import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { firebaseConfigured } from '@/lib/firebase'
import { subscribeFoundingMembership } from '@/lib/founding500'
import type { FoundingMemberRecord } from '@/types/founding500'
import { MIN_ONBOARDING_INTERESTS } from '@/data/interests'

interface MembershipState {
  uid: string
  record: FoundingMemberRecord | null
}

/** Perennia is a paid, Founding-500-gated app: every real screen behind
 *  this guard requires (1) a real signed-in account and (2) a real
 *  `foundingMembers/{uid}` record — written exclusively by the post-payment
 *  Stripe webhook, never guessable/fakeable client-side. There is no
 *  "logged in but hasn't paid" access to the product.
 *
 *  `membershipState` is only ever trusted when its `uid` matches the
 *  CURRENT user's uid — on a cold page load, `authReady`/`user` can flip to
 *  a real signed-in user in the same render a leftover "no membership yet"
 *  value from before auth resolved is still sitting in state (the
 *  Firestore subscription for the real uid hasn't resolved yet). Matching
 *  on uid instead of relying on effect-ordering closes that race: a stale
 *  or not-yet-fetched value can never be mistaken for "confirmed no
 *  membership" and trigger a false redirect. */
export function RequireFoundingMembership({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { user, authReady } = useAuth()
  const { onboarding, profileExtras, onboardingComplete, profileLoaded } = useApp()
  const [membershipState, setMembershipState] = useState<MembershipState | null>(null)

  useEffect(() => {
    if (!firebaseConfigured || !user) return
    const uid = user.uid
    return subscribeFoundingMembership(uid, (record) => {
      setMembershipState({ uid, record })
    })
  }, [user])

  if (!firebaseConfigured) {
    // No backend configured in this environment — fall back to the app's
    // existing local-demo behavior rather than locking the prototype out
    // entirely with no way to ever satisfy the gate.
    return <>{children}</>
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/signup?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (!membershipState || membershipState.uid !== user.uid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  if (!membershipState.record || membershipState.record.canceledAt) {
    return <Navigate to={`/founding-500?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (!profileLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  // A paid Founding 500 member still can't see Discovery/matches/the app's
  // bottom nav until they've actually finished onboarding — otherwise
  // there's a real gap where someone could pay, skip straight to
  // /discovery by URL, and never confirm birth details, profile info, etc.
  if (!onboardingComplete) {
    // Resume at the earliest objectively incomplete required step. In
    // particular, a just-verified member always lands on Birth Details —
    // never Discovery or a screen containing the app navigation.
    if (onboarding.verification.status !== 'verified' || !onboarding.verification.detailsConfirmedAt) {
      return <Navigate to="/verify" replace />
    }
    if (!onboarding.birthCity || !onboarding.country || !onboarding.city) {
      return <Navigate to="/birth-details" replace />
    }
    if (!onboarding.relationshipGoal) {
      return <Navigate to="/relationship-goals" replace />
    }
    if (profileExtras.interests.length < MIN_ONBOARDING_INTERESTS) {
      return <Navigate to="/interests" replace />
    }
    if (!onboarding.aboutYouCompletedAt) {
      return <Navigate to="/about-you" replace />
    }
    if (!onboarding.profilePhotoUrl) {
      return <Navigate to="/profile-photo" replace />
    }
    return <Navigate to="/cosmic-profile" replace />
  }

  return <>{children}</>
}
