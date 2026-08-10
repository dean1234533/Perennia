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
          allowed_types: ['passport', 'driving_license', 'id_card'],
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

export async function confirmVerificationDetails(uid: string) {
  const userRef = getFirestore().collection('users').doc(uid)
  const snapshot = await userRef.get()
  if (!snapshot.exists) throw failedPrecondition('Your account profile could not be found.')
  const data = snapshot.data()
  if (data?.verification?.status !== 'verified' || !data?.legalName || !data?.birthDate) {
    throw failedPrecondition('Verified identity details are not ready to confirm.')
  }
  await userRef.update({ 'verification.detailsConfirmedAt': new Date().toISOString() })
  return { confirmed: true as const }
}

export function constructWebhookEvent(params: { rawBody: Buffer; signature: string; secretKey: string; webhookSecret: string }) {
  const stripe = getStripe(params.secretKey)
  return stripe.webhooks.constructEvent(params.rawBody, params.signature, params.webhookSecret)
}

async function persistVerificationResult(params: {
  uid: string
  session: Stripe.Identity.VerificationSession
  secretKey: string
  verified: boolean
}) {
  const { uid, session, secretKey, verified } = params
  const db = getFirestore()
  const update: Record<string, unknown> = {
    'verification.status': verified ? 'verified' : 'failed',
    'verification.provider': 'stripe_identity',
    'verification.verificationReference': session.id,
    'verification.verifiedAt': verified ? new Date().toISOString() : null,
  }

  if (verified) {
    try {
      const stripe = getStripe(secretKey)
      const full = session.verified_outputs
        ? session
        : await stripe.identity.verificationSessions.retrieve(session.id, { expand: ['verified_outputs'] })
      const outputs = full.verified_outputs
      const dob = outputs?.dob

      const userRef = db.collection('users').doc(uid)
      const existing = await userRef.get()
      const hasBirthDate = !!existing.get('birthDate')
      const hasDisplayName = !!existing.get('name')

      if (dob?.year && dob.month && dob.day && !hasBirthDate) {
        const mm = String(dob.month).padStart(2, '0')
        const dd = String(dob.day).padStart(2, '0')
        update.birthDate = `${dob.year}-${mm}-${dd}`
      }

      const legalName = [outputs?.first_name, outputs?.last_name].filter(Boolean).join(' ')
      if (legalName) update.legalName = legalName
      if (outputs?.first_name && !hasDisplayName) update.name = outputs.first_name
    } catch (err) {
      log.warn('identity_verified_outputs_fetch_failed', {
        uid,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  await db.collection('users').doc(uid).update(update)
  return verified ? 'verified' as const : 'failed' as const
}

/** Reconciles a pending Firestore record directly against Stripe. This is a
 * secure fallback for delayed/misconfigured webhooks and never trusts a
 * client-supplied session id. */
export async function refreshVerificationStatus(uid: string, secretKey: string) {
  const snapshot = await getFirestore().collection('users').doc(uid).get()
  const sessionId = snapshot.get('verification.verificationReference') as string | undefined
  if (!sessionId) throw failedPrecondition('No identity verification session is available to refresh.')

  const stripe = getStripe(secretKey)
  const session = await stripe.identity.verificationSessions.retrieve(sessionId, {
    expand: ['verified_outputs'],
  })

  if (session.status === 'processing') return { status: 'pending' as const }
  if (session.status === 'verified') {
    return { status: await persistVerificationResult({ uid, session, secretKey, verified: true }) }
  }

  // Once Stripe's hosted UI has returned, requires_input/canceled means the
  // current attempt cannot progress without a fresh capture.
  return { status: await persistVerificationResult({ uid, session, secretKey, verified: false }) }
}

export async function handleVerificationWebhookEvent(event: Stripe.Event, secretKey: string) {
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
    await persistVerificationResult({ uid, session, secretKey, verified })

    log.info('identity_verification_updated', { uid, status: verified ? 'verified' : 'failed' })
  }
}
