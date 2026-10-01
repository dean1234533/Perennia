import { firebaseConfigured } from '@/lib/firebase'

const DEVELOPMENT_VERIFICATION_KEY = 'perennia:development-verification-bypass'
const LOCAL_PREVIEW_FLAG = import.meta.env.VITE_ENABLE_LOCAL_PREVIEW_BYPASS === 'true'

export function isDevelopmentVerificationBypassAvailable() {
  if (!import.meta.env.DEV || !LOCAL_PREVIEW_FLAG || typeof window === 'undefined') return false
  const localHostname = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  return localHostname && !firebaseConfigured
}

/**
 * Lets local development move through the full onboarding UI when Stripe's
 * test verification is unavailable or left pending. This deliberately cannot
 * be enabled in a production build and never writes a fake verified state to
 * Firebase.
 */
export function enableDevelopmentVerificationBypass() {
  if (!isDevelopmentVerificationBypassAvailable()) return
  window.sessionStorage.setItem(DEVELOPMENT_VERIFICATION_KEY, 'enabled')
}

export function hasDevelopmentVerificationBypass() {
  return isDevelopmentVerificationBypassAvailable() &&
    window.sessionStorage.getItem(DEVELOPMENT_VERIFICATION_KEY) === 'enabled'
}
