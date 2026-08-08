import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import { subscribeFoundingMembership } from '@/lib/founding500'
import type { FoundingMemberRecord } from '@/types/founding500'
import { cn } from '@/lib/utils'

/** Small champagne-gold pill shown ONLY once a real `foundingMembers/{uid}`
 *  record exists (written exclusively by the post-payment Stripe webhook) —
 *  never rendered from client-guessed or optimistic state. */
export function FoundingMemberBadge({ className }: { className?: string }) {
  const { user } = useAuth()
  const [record, setRecord] = useState<FoundingMemberRecord | null>(null)

  useEffect(() => {
    if (!firebaseConfigured || !user) return
    return subscribeFoundingMembership(user.uid, setRecord)
  }, [user])

  if (!record) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-gold',
        className
      )}
      title={`Founding Member #${record.memberNumber}`}
    >
      <Sparkles className="h-2.5 w-2.5" /> Founding Member
    </span>
  )
}
