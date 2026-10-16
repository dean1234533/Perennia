import { firebaseConfigured } from '@/lib/firebase'

const DEVELOPMENT_VERIFICATION_KEY = 'perennia:development-verification-bypass'
const DEVELOPMENT_VERIFIED_AT_KEY = 'perennia:development-verification-verified-at'
const LOCAL_PREVIEW_FLAG = import.meta.env.VITE_ENABLE_LOCAL_PREVIEW_BYPASS === 'true'

export const DEVELOPMENT_VERIFICATION_FIXTURE = {
  legalName: 'Jenny Rosen',
  birthDate: '1995-06-15',
} as const

export function isDevelopmentVerificationBypassAvailable() {
  if (!import.meta.env.DEV || !LOCAL_PREVIEW_FLAG || typeof window === 'undefined') return false
  const localHostname = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  return localHostname && !firebaseConfigured
}

/**
 * Lets local development move through the full onboarding UI when Stripe's
 * test verification is unavailable or left pending. This deliberately cannot
 * be enabled in a production build and never writes its simulated verified
 * state to Firebase.
 */
export function enableDevelopmentVerificationBypass() {
  if (!isDevelopmentVerificationBypassAvailable()) return
  window.sessionStorage.setItem(DEVELOPMENT_VERIFICATION_KEY, 'enabled')
  if (!window.sessionStorage.getItem(DEVELOPMENT_VERIFIED_AT_KEY)) {
    window.sessionStorage.setItem(DEVELOPMENT_VERIFIED_AT_KEY, new Date().toISOString())
  }
}

export function hasDevelopmentVerificationBypass() {
  return isDevelopmentVerificationBypassAvailable() &&
    window.sessionStorage.getItem(DEVELOPMENT_VERIFICATION_KEY) === 'enabled'
}

/** Rehydrates the same test-only identity contract after a local page reload.
 * The session data is ignored whenever Firebase is configured or the app is
 * not running as an explicitly enabled localhost development preview. */
export function getDevelopmentVerificationData() {
  if (!hasDevelopmentVerificationBypass()) return null
  const verifiedAt = window.sessionStorage.getItem(DEVELOPMENT_VERIFIED_AT_KEY) ?? new Date().toISOString()
  return {
    ...DEVELOPMENT_VERIFICATION_FIXTURE,
    verification: {
      status: 'verified',
      provider: 'stripe_identity',
      verificationReference: 'development-test-session',
      verifiedAt,
      detailsConfirmedAt: verifiedAt,
    },
  } as const
}
