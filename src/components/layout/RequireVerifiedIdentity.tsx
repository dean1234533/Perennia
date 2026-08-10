import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { hasDevelopmentVerificationBypass } from '@/lib/developmentVerification'

export function RequireVerifiedIdentity({ children }: { children: ReactNode }) {
  const { onboarding, profileLoaded } = useApp()
  const location = useLocation()

  if (!profileLoaded) {
    return <div className="flex min-h-screen items-center justify-center bg-midnight"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
  }

  if (!hasDevelopmentVerificationBypass() && (onboarding.verification.status !== 'verified' || !onboarding.verification.detailsConfirmedAt)) {
    return <Navigate to={`/verify?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}
