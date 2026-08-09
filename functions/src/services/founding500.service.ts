/**
 * Real Stripe subscription checkout for the Founding 500 offer — a
 * three-phase price schedule (intro months 1-3 -> rest of year 1 -> future
 * standard price), built entirely from the live `config/founding500`
 * document, never hardcoded.
 *
 * Flow:
 *   1. createFoundingCheckoutSession — validates eligibility, opens a real
 *      Stripe Checkout Session at the introductory price.
 *   2. Stripe redirects the member through actual payment.
 *   3. Our webhook receives `checkout.session.completed`, converts the
 *      resulting subscription into a Stripe Subscription Schedule with the
 *      three real phases/prices, and only THEN calls
 *      confirmFoundingMembership to atomically assign a real member number.
 *
 * Not live-tested end-to-end against a real Stripe account in this
 * environment (STRIPE_SECRET_KEY is an unset placeholder) — the Subscription
 * Schedule phase-building step is implemented against Stripe's documented
 * API shape and should be smoke-tested once real keys are configured.
 */
import Stripe from 'stripe'
import { failedPrecondition, internal } from '../utils/errors'
import { log } from '../utils/logger'
import { getConfig, confirmFoundingMembership, Founding500FullError, Founding500DisabledError } from '../repositories/founding500.repository'
import type { MembershipTier, PricingSnapshot } from '../types/founding500'

let stripeClient: Stripe | null = null
const UNSET_SENTINEL = 'not_configured'

function getStripe(secretKey: string): Stripe {
  if (!secretKey || secretKey === UNSET_SENTINEL) {
    throw failedPrecondition(
      'Founding 500 payments are not configured yet. An administrator needs to set STRIPE_SECRET_KEY (see functions/.env.example).'
    )
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' })
  }
  return stripeClient
}

export async function createFoundingCheckoutSession(params: {
  uid: string
  email: string | undefined
  tier: MembershipTier
  successUrl: string
  cancelUrl: string
  secretKey: string
}) {
  const config = await getConfig()
  if (!config.enabled) throw failedPrecondition('The Founding 500 offer is not currently active.')
  if (config.currentMemberCount >= config.memberLimit) {
    throw failedPrecondition('The Founding 500 is now full.')
  }

  const pricing = config[params.tier]
  const stripe = getStripe(params.secretKey)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: params.email,
      client_reference_id: params.uid,
      line_items: [
        {
          price_data: {
            currency: config.currency,
            unit_amount: Math.round(pricing.introPrice * 100),
            recurring: { interval: 'month' },
            product_data: {
              name: `Perennia Founding 500 — ${params.tier === 'premium' ? 'Premium' : 'Essential'} (introductory price)`,
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: { uid: params.uid, tier: params.tier, founding500: 'true' },
      },
      metadata: { uid: params.uid, tier: params.tier, founding500: 'true' },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    })

    if (!session.url) throw new Error('Stripe did not return a Checkout URL')
    return { url: session.url, sessionId: session.id }
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      throw internal(`Stripe checkout session creation failed: ${err.message}`, err)
    }
    throw err
  }
}

async function createMonthlyPrice(stripe: Stripe, amount: number, currency: string, name: string): Promise<string> {
  const price = await stripe.prices.create({
    unit_amount: Math.round(amount * 100),
    currency,
    recurring: { interval: 'month' },
    product_data: { name },
  })
  return price.id
}

/** Builds the real 3-phase Subscription Schedule (intro -> year1 -> future
 *  standard) from a just-created subscription. Failure here is logged but
 *  does not block membership confirmation — the member has genuinely paid;
 *  the schedule is what automates their future price changes. */
async function applyFoundingPriceSchedule(
  stripe: Stripe,
  subscriptionId: string,
  tier: MembershipTier,
  pricing: PricingSnapshot
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const phase1PriceId = subscription.items.data[0]?.price.id
  const phase1Start = subscription.current_period_start
  if (!phase1PriceId) throw new Error('Subscription has no price on its first item')

  const label = tier === 'premium' ? 'Premium' : 'Essential'
  const [year1PriceId, futurePriceId] = await Promise.all([
    createMonthlyPrice(stripe, pricing.year1Price, pricing.currency, `Perennia ${label} — Year 1 (post-introductory)`),
    createMonthlyPrice(stripe, pricing.futurePrice, pricing.currency, `Perennia ${label} — Standard`),
  ])

  const schedule = await stripe.subscriptionSchedules.create({ from_subscription: subscriptionId })
  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: 'release',
    phases: [
      { items: [{ price: phase1PriceId, quantity: 1 }], start_date: phase1Start, iterations: pricing.promoPeriodMonths },
      { items: [{ price: year1PriceId, quantity: 1 }], iterations: Math.max(12 - pricing.promoPeriodMonths, 1) },
      { items: [{ price: futurePriceId, quantity: 1 }] },
    ],
  })
}

export async function handleFoundingCheckoutCompleted(session: Stripe.Checkout.Session, secretKey: string) {
  const uid = session.metadata?.uid
  const tier = session.metadata?.tier as MembershipTier | undefined
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

  if (!uid || !tier || !subscriptionId || !customerId) {
    log.warn('founding500_webhook_missing_fields', { sessionId: session.id })
    return
  }

  const config = await getConfig()
  const pricing: PricingSnapshot = { ...config[tier], currency: config.currency, promoPeriodMonths: config.promoPeriodMonths }

  try {
    const record = await confirmFoundingMembership({
      uid,
      tier,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      pricing,
    })
    log.info('founding500_member_confirmed', { uid, memberNumber: record.memberNumber, tier })
  } catch (err) {
    if (err instanceof Founding500FullError || err instanceof Founding500DisabledError) {
      // Genuinely paid but arrived after the 500th slot filled (race) or the
      // offer was disabled mid-flow — log loudly for a human to reconcile
      // (refund/waitlist), but don't throw: the webhook must still 200 to
      // Stripe or it will keep retrying indefinitely.
      log.error('founding500_confirm_rejected_after_payment', { uid, tier, reason: err.message })
      return
    }
    throw err
  }

  try {
    const stripe = getStripe(secretKey)
    await applyFoundingPriceSchedule(stripe, subscriptionId, tier, pricing)
    log.info('founding500_schedule_applied', { uid, subscriptionId })
  } catch (err) {
    log.error('founding500_schedule_failed', {
      uid,
      subscriptionId,
      message: err instanceof Error ? err.message : String(err),
    })
  }
}

/** Real subscription cancellation via the Stripe API — called from account
 *  deletion so a deleted member stops being billed, not just stops being
 *  able to log in. Treats "already gone" as success rather than an error,
 *  since a member might delete their account after already canceling
 *  through the Stripe customer portal. */
export async function cancelFoundingSubscription(subscriptionId: string, secretKey: string): Promise<void> {
  const stripe = getStripe(secretKey)
  try {
    await stripe.subscriptions.cancel(subscriptionId)
    log.info('founding500_subscription_canceled', { subscriptionId })
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError && err.code === 'resource_missing') {
      log.info('founding500_subscription_already_gone', { subscriptionId })
      return
    }
    throw internal(`Failed to cancel Stripe subscription: ${err instanceof Error ? err.message : String(err)}`, err)
  }
}
