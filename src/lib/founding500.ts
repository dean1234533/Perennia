import { doc, onSnapshot } from 'firebase/firestore'
import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import type { Founding500Config, FoundingMemberRecord, MembershipTier } from '@/types/founding500'

/** Live config — public, no auth required (the pricing page is shown
 *  pre-signup). Never write this directly; it's admin/webhook-only. */
export function subscribeFounding500Config(cb: (config: Founding500Config | null) => void) {
  return onSnapshot(doc(db, 'config', 'founding500'), (snap) => {
    cb(snap.exists() ? (snap.data() as Founding500Config) : null)
  })
}

/** Live membership record for the signed-in member — the only source of
 *  truth for "are they really a Founding 500 member." Absent until the
 *  real Stripe webhook confirms payment. */
export function subscribeFoundingMembership(uid: string, cb: (record: FoundingMemberRecord | null) => void) {
  return onSnapshot(doc(db, 'foundingMembers', uid), (snap) => {
    cb(snap.exists() ? (snap.data() as FoundingMemberRecord) : null)
  })
}

const publicFoundingStatusCallable = httpsCallable<{ targetUid: string }, { isFoundingMember: boolean }>(functions, 'getPublicFoundingStatus')

export async function getPublicFoundingStatus(targetUid: string) {
  return (await publicFoundingStatusCallable({ targetUid })).data.isFoundingMember
}

const ensureConfigCallable = httpsCallable<unknown, Founding500Config>(functions, 'ensureFounding500Config')

/** Idempotent bootstrap — seeds default config only if it doesn't exist yet. */
export async function ensureFounding500Config(): Promise<Founding500Config> {
  const result: HttpsCallableResult<Founding500Config> = await ensureConfigCallable()
  return result.data
}

interface CreateCheckoutInput {
  tier: MembershipTier
  successUrl: string
  cancelUrl: string
}
interface CreateCheckoutResult {
  url: string
  sessionId: string
}

const createCheckoutCallable = httpsCallable<CreateCheckoutInput, CreateCheckoutResult>(functions, 'createFoundingCheckoutSession')

export class FoundingCheckoutNotConfiguredError extends Error {}

/** Creates a REAL Stripe Checkout Session and returns its URL for redirect.
 *  Throws FoundingCheckoutNotConfiguredError if Stripe isn't configured on
 *  the backend yet — the caller should show that honestly, never fake a
 *  successful checkout. */
export async function createFoundingCheckoutSession(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  try {
    const result = await createCheckoutCallable(input)
    return result.data
  } catch (err) {
    const code = (err as { code?: string })?.code ?? ''
    if (code.includes('failed-precondition')) {
      throw new FoundingCheckoutNotConfiguredError((err as Error).message)
    }
    throw err
  }
}

const cancelMembershipCallable = httpsCallable<unknown, { canceled: true }>(functions, 'cancelFoundingMembership')

/** Real self-serve cancellation — cancels the actual Stripe subscription
 *  and marks the member's own foundingMembers record canceled server-side.
 *  Throws if there's no active membership to cancel. */
export async function cancelFoundingMembership(): Promise<{ canceled: true }> {
  const result: HttpsCallableResult<{ canceled: true }> = await cancelMembershipCallable()
  return result.data
}

const billingPortalCallable = httpsCallable<{ returnUrl: string }, { url: string }>(functions, 'createBillingPortalSession')

/** Real Stripe-hosted billing portal — invoices and payment method come
 *  straight from Stripe. Returns the URL to redirect to. */
export async function createBillingPortalSession(returnUrl: string): Promise<{ url: string }> {
  const result: HttpsCallableResult<{ url: string }> = await billingPortalCallable({ returnUrl })
  return result.data
}
