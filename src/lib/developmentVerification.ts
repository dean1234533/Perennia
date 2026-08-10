const DEVELOPMENT_VERIFICATION_KEY = 'perennia:development-verification-bypass'

/**
 * Lets local development move through the full onboarding UI when Stripe's
 * test verification is unavailable or left pending. This deliberately cannot
 * be enabled in a production build and never writes a fake verified state to
 * Firebase.
 */
export function enableDevelopmentVerificationBypass() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return
  window.sessionStorage.setItem(DEVELOPMENT_VERIFICATION_KEY, 'enabled')
}

export function hasDevelopmentVerificationBypass() {
  return import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem(DEVELOPMENT_VERIFICATION_KEY) === 'enabled'
}
