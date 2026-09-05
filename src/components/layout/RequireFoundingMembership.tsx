import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { firebaseConfigured } from '@/lib/firebase'
import { subscribeFoundingMembership } from '@/lib/founding500'
import type { FoundingMemberRecord } from '@/types/founding500'
import { MIN_ONBOARDING_INTERESTS } from '@/data/interests'
import { isNotSureGoalExpired, NOT_SURE_GOAL } from '@/data/relationshipGoals'

interface MembershipState {
  uid: string
  record: FoundingMemberRecord | null
}

const RESUMABLE_ONBOARDING_PATHS = new Set([
  '/verify',
  '/birth-details',
  '/preferences',
  '/relationship-goals',
  '/interests',
  '/about-you',
  '/profile-photo',
  '/your-story',
  '/cosmic-profile',
])

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

  // Profile progress must be resolved before payment status. Payment is the
  // final handoff after onboarding, so an incomplete member must never be
  // sent to the Founding 500 page just because they have not paid yet.
  if (!profileLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  // No member can see Discovery/matches/the app's bottom nav until they've
  // actually finished onboarding — otherwise there is a gap where someone
  // could pay (or merely reach the payment page), skip straight to
  // /discovery by URL, and never confirm birth details, profile info, etc.
  if (!onboardingComplete) {
    // Required prerequisites take priority over a saved route, protecting
    // against stale/tampered progress while still allowing exact resumption
    // once everything before that saved screen is valid.
    if (onboarding.verification.status !== 'verified' || !onboarding.verification.detailsConfirmedAt) {
      return <Navigate to="/verify" replace />
    }
    if (!onboarding.birthCity || !onboarding.country || !onboarding.city) {
      return <Navigate to="/birth-details" replace />
    }
    if (!onboarding.gender) {
      return <Navigate to="/preferences" replace />
    }
    if (
      !onboarding.relationshipGoal ||
      (onboarding.relationshipGoal === NOT_SURE_GOAL && isNotSureGoalExpired(onboarding.relationshipGoalSelectedAt))
    ) {
      return <Navigate to="/relationship-goals" replace />
    }
    if ((profileExtras.interests ?? []).length < MIN_ONBOARDING_INTERESTS || !profileExtras.lifestyleVibe) {
      return <Navigate to="/interests" replace />
    }
    if (!onboarding.aboutYouCompletedAt) {
      return <Navigate to="/about-you" replace />
    }
    if (!onboarding.profilePhotoUrl) {
      return <Navigate to="/profile-photo" replace />
    }
    if (RESUMABLE_ONBOARDING_PATHS.has(onboarding.onboardingResumePath)) {
      return <Navigate to={onboarding.onboardingResumePath} replace />
    }
    return <Navigate to="/cosmic-profile" replace />
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

  return <>{children}</>
}
