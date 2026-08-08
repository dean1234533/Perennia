import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import { subscribeFoundingMembership } from '@/lib/founding500'
import type { FoundingMemberRecord } from '@/types/founding500'

/** Perennia is a paid, Founding-500-gated app: every real screen behind
 *  this guard requires (1) a real signed-in account and (2) a real
 *  `foundingMembers/{uid}` record — written exclusively by the post-payment
 *  Stripe webhook, never guessable/fakeable client-side. There is no
 *  "logged in but hasn't paid" access to the product. */
export function RequireFoundingMembership({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { user, authReady } = useAuth()
  const [membership, setMembership] = useState<FoundingMemberRecord | null | undefined>(undefined)

  useEffect(() => {
    if (!firebaseConfigured || !user) {
      setMembership(null)
      return
    }
    setMembership(undefined)
    return subscribeFoundingMembership(user.uid, setMembership)
  }, [user])

  if (!firebaseConfigured) {
    // No backend configured in this environment — fall back to the app's
    // existing local-demo behavior rather than locking the prototype out
    // entirely with no way to ever satisfy the gate.
    return <>{children}</>
  }

  if (!authReady || membership === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/signup?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (!membership) {
    return <Navigate to={`/founding-500?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}
