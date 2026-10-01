import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { firebaseConfigured } from '@/lib/firebase'
import {
  hasDevelopmentVerificationBypass,
  isDevelopmentVerificationBypassAvailable,
} from '@/lib/developmentVerification'
import {
  calculateOnboardingProgress,
  getOnboardingStep,
  type OnboardingStepId,
} from '@/lib/onboardingFlow'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-midnight">
      <Loader2 className="h-6 w-6 animate-spin text-gold" />
    </div>
  )
}

export function RequireOnboardingStep({
  children,
  stepId,
}: {
  children: ReactNode
  stepId: OnboardingStepId
}) {
  const { user, authReady } = useAuth()
  const { onboarding, profileExtras, onboardingComplete, profileLoaded } = useApp()
  const step = getOnboardingStep(stepId)
  const previewBypassAvailable = isDevelopmentVerificationBypassAvailable()
  const previewBypassEnabled = hasDevelopmentVerificationBypass()
  const previewActivationScreen = stepId === 'verification' && previewBypassAvailable && !previewBypassEnabled

  if (firebaseConfigured && !authReady) return <LoadingScreen />

  if (step.requiresAuthentication && !user && !previewBypassEnabled) {
    // The verification page remains reachable only in an explicitly enabled,
    // backend-free local preview so its visible test control can be activated.
    if (!previewActivationScreen) {
      return <Navigate to="/signup" replace />
    }
  }

  if (firebaseConfigured && user && !profileLoaded) {
    return <LoadingScreen />
  }

  if (onboardingComplete) {
    if (step.completedUserRevisit === 'redirect-to-app') {
      return <Navigate to="/discovery" replace />
    }
    return <>{children}</>
  }

  const progress = calculateOnboardingProgress({
    onboarding,
    profileExtras,
    user,
    profileLoaded,
    onboardingComplete,
    backendConfigured: firebaseConfigured,
    localPreviewBypassEnabled: previewBypassEnabled,
  })

  if (stepId === 'signup' && progress.completion.get('signup')) {
    return <Navigate to={progress.earliestIncompleteStep?.route ?? '/discovery'} replace />
  }

  if (!previewActivationScreen && !progress.isRouteAccessible(step.route)) {
    return <Navigate to={progress.earliestIncompleteStep?.route ?? '/cosmic-profile'} replace />
  }

  return <>{children}</>
}
