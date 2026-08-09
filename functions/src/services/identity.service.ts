/**
 * Real identity verification via Stripe Identity — not a simulated camera
 * screen. Stripe hosts the actual document capture, liveness check, and
 * face-match; we only create a session and react to its webhook result.
 *
 * Requires STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET to be set (see
 * functions/README.md). Until then, `createVerificationSession` throws a
 * failed-precondition error rather than pretending to work.
 */
import Stripe from 'stripe'
import { getFirestore } from 'firebase-admin/firestore'
import { failedPrecondition, internal } from '../utils/errors'
import { log } from '../utils/logger'

let stripeClient: Stripe | null = null

const UNSET_SENTINEL = 'not_configured'

function getStripe(secretKey: string): Stripe {
  if (!secretKey || secretKey === UNSET_SENTINEL) {
    throw failedPrecondition(
      'Identity verification is not configured yet. An administrator needs to set STRIPE_SECRET_KEY (see functions/README.md).'
    )
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' })
  }
  return stripeClient
}

export async function createVerificationSession(params: { uid: string; secretKey: string }) {
  const stripe = getStripe(params.secretKey)

  try {
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: { uid: params.uid },
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
    })

    await getFirestore().collection('users').doc(params.uid).update({
      'verification.status': 'pending',
      'verification.provider': 'stripe_identity',
      'verification.verificationReference': session.id,
      'verification.verifiedAt': null,
    })

    return { clientSecret: session.client_secret, sessionId: session.id }
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      throw internal(`Stripe Identity session creation failed: ${err.message}`, err)
    }
    throw err
  }
}

export function constructWebhookEvent(params: { rawBody: Buffer; signature: string; secretKey: string; webhookSecret: string }) {
  const stripe = getStripe(params.secretKey)
  return stripe.webhooks.constructEvent(params.rawBody, params.signature, params.webhookSecret)
}

export async function handleVerificationWebhookEvent(event: Stripe.Event, secretKey: string) {
  const db = getFirestore()

  if (
    event.type === 'identity.verification_session.verified' ||
    event.type === 'identity.verification_session.requires_input'
  ) {
    const session = event.data.object as Stripe.Identity.VerificationSession
    const uid = session.metadata?.uid
    if (!uid) {
      log.warn('stripe_webhook_missing_uid', { sessionId: session.id, type: event.type })
      return
    }

    const verified = event.type === 'identity.verification_session.verified'
    const update: Record<string, unknown> = {
      'verification.status': verified ? 'verified' : 'failed',
      'verification.provider': 'stripe_identity',
      'verification.verificationReference': session.id,
      'verification.verifiedAt': verified ? new Date().toISOString() : null,
    }

    // Real extracted legal name + DOB from the ID document Stripe just
    // verified — this is what feeds the Birth Details step (the member no
    // longer re-types their birth date; it's already confirmed against a
    // government ID). Never overwrites a birth date the member has already
    // locked in via the Birth Details screen.
    if (verified) {
      try {
        const stripe = getStripe(secretKey)
        const full = await stripe.identity.verificationSessions.retrieve(session.id, {
          expand: ['verified_outputs'],
        })
        const outputs = full.verified_outputs
        const dob = outputs?.dob

        const userRef = db.collection('users').doc(uid)
        const existing = await userRef.get()
        const hasBirthDate = !!existing.get('birthDate')

        if (dob?.year && dob.month && dob.day && !hasBirthDate) {
          const mm = String(dob.month).padStart(2, '0')
          const dd = String(dob.day).padStart(2, '0')
          update.birthDate = `${dob.year}-${mm}-${dd}`
        }

        const legalName = [outputs?.first_name, outputs?.last_name].filter(Boolean).join(' ')
        if (legalName) update.legalName = legalName
      } catch (err) {
        log.warn('identity_verified_outputs_fetch_failed', {
          uid,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    await db.collection('users').doc(uid).update(update)

    log.info('identity_verification_updated', { uid, status: verified ? 'verified' : 'failed' })
  }
}
