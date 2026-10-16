import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Gift, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import { getPublicProfile, type DiscoveryCandidate } from '@/lib/firestore'
import { subscribeGiftRequestsForRecipient, type GiftRequest } from '@/lib/gifts'

const STATUS_LABEL: Record<GiftRequest['status'], string> = {
  pending: 'Waiting for your response',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
}

function formatDate(value: { toDate: () => Date } | null) {
  return value ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(value.toDate()) : null
}

/** The signed-in member's real gift requests. Everything here comes from the
 *  database — no sample senders or offerings. */
export function Gifts() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [requests, setRequests] = useState<GiftRequest[] | null>(null)
  const [senders, setSenders] = useState<Record<string, DiscoveryCandidate | null>>({})
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!firebaseConfigured || !user) {
      setRequests([])
      return
    }
    return subscribeGiftRequestsForRecipient(user.uid, setRequests, () => {
      setError(true)
      setRequests([])
    })
  }, [user])

  useEffect(() => {
    const missing = [...new Set((requests ?? []).map((r) => r.senderUid))].filter((uid) => !(uid in senders))
    if (missing.length === 0) return
    let active = true
    Promise.all(missing.map(async (uid) => [uid, await getPublicProfile(uid).catch(() => null)] as const)).then((entries) => {
      if (active) setSenders((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
    })
    return () => { active = false }
  }, [requests, senders])

  return (
    <div className="mx-auto min-h-[calc(100svh-5rem)] max-w-3xl px-5 pb-28 pt-8 sm:px-8 xl:pb-12 xl:pt-12">
      <button
        type="button"
        onClick={() => navigate('/my-profile')}
        className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 text-sm text-white/70 transition-colors hover:bg-white/[.08] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to profile
      </button>

      <h1 className="font-serif-display text-4xl text-white sm:text-5xl">Gift to Me</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
        Gift requests from other members appear here. You stay in control of everything you receive.
      </p>

      <div className="mt-8">
        {requests === null ? (
          <div className="flex items-center gap-2 text-sm text-white/60" role="status"><Loader2 className="h-4 w-4 animate-spin" /> Loading your gifts…</div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[.04] px-6 py-14 text-center">
            <Gift className="h-8 w-8 text-violet-200/70" strokeWidth={1.6} aria-hidden="true" />
            <p className="mt-4 text-base text-white/85">{error ? 'Your gifts could not be loaded' : 'No gifts to show yet'}</p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-white/50">
              {error ? 'Please try again in a moment.' : 'When another member wants to send you a gift, the request will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {requests.map((request) => {
              const sender = senders[request.senderUid]
              const expires = formatDate(request.expiresAt)
              return (
                <li key={request.id} className="flex gap-4 rounded-3xl border border-white/10 bg-white/[.04] p-5">
                  {sender?.profilePhotoThumbUrl || sender?.profilePhotoUrl ? (
                    <img src={sender.profilePhotoThumbUrl || sender.profilePhotoUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10"><Gift className="h-5 w-5 text-white/60" aria-hidden="true" /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[.18em] text-blue-300/80">{STATUS_LABEL[request.status]}</p>
                    <h2 className="mt-1 font-serif-display text-xl text-white">{request.offeringTitle}</h2>
                    <p className="mt-1 text-sm text-white/60">From {sender?.name ?? 'a Perennia member'}</p>
                    {request.message && <p className="mt-3 text-sm leading-6 text-white/70">“{request.message}”</p>}
                    {request.status === 'pending' && expires && <p className="mt-3 text-xs text-white/45">Respond by {expires}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
