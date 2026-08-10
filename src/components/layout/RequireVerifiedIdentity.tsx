import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { hasDevelopmentVerificationBypass } from '@/lib/developmentVerification'

export function RequireVerifiedIdentity({ children }: { children: ReactNode }) {
  const { onboarding, profileLoaded } = useApp()
  const location = useLocation()
  const developmentBypassEnabled = hasDevelopmentVerificationBypass()

  // The local-only verification bypass must also bypass the remote profile
  // loading gate. With Firebase configured but no signed-in test user, that
  // profile subscription never starts and the onboarding route would remain
  // on this spinner forever.
  if (!developmentBypassEnabled && !profileLoaded) {
    return <div className="flex min-h-screen items-center justify-center bg-midnight"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
  }

  if (!developmentBypassEnabled && (onboarding.verification.status !== 'verified' || !onboarding.verification.detailsConfirmedAt)) {
    return <Navigate to={`/verify?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}
