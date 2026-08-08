import { httpsCallable } from 'firebase/functions'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { functions } from '@/lib/firebase'

export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
export const identityVerificationConfigured = Boolean(stripePublishableKey)

let stripePromise: Promise<Stripe | null> | null = null
function getStripe() {
  if (!stripePromise) {
    if (!stripePublishableKey) throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is not set')
    stripePromise = loadStripe(stripePublishableKey)
  }
  return stripePromise
}

export class VerificationNotConfiguredError extends Error {}

/** Launches Stripe's own hosted verification UI (real document capture,
 *  liveness, face match — not anything we render ourselves). Resolves once
 *  the user finishes or dismisses that flow; the actual verified/failed
 *  result arrives asynchronously via the stripeIdentityWebhook Cloud
 *  Function updating Firestore, which the app already listens to. */
export async function startIdentityVerification(): Promise<void> {
  if (!identityVerificationConfigured) {
    throw new VerificationNotConfiguredError('Stripe publishable key is not set on the frontend.')
  }

  const createSession = httpsCallable<unknown, { clientSecret: string }>(functions, 'createIdentityVerificationSession')
  let clientSecret: string
  try {
    const result = await createSession()
    clientSecret = result.data.clientSecret
  } catch (err) {
    const code = (err as { code?: string })?.code ?? ''
    if (code.includes('failed-precondition')) {
      throw new VerificationNotConfiguredError((err as Error).message)
    }
    throw err
  }

  const stripe = await getStripe()
  if (!stripe) throw new Error('Stripe.js failed to load')

  const { error } = await stripe.verifyIdentity(clientSecret)
  if (error) throw new Error(error.message ?? 'Verification was cancelled.')
}
