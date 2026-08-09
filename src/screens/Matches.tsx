import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, MessageCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { subscribeMyMatches, getUserDoc, type MatchDoc, type DiscoveryCandidate } from '@/lib/firestore'

export function Matches() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [matches, setMatches] = useState<MatchDoc[] | null>(null)
  const [profiles, setProfiles] = useState<Record<string, DiscoveryCandidate>>({})

  useEffect(() => {
    if (!user) return
    return subscribeMyMatches(user.uid, setMatches)
  }, [user])

  useEffect(() => {
    if (!matches || !user) return
    const missing = matches
      .map((m) => m.users.find((u) => u !== user.uid))
      .filter((uid): uid is string => !!uid && !profiles[uid])
    if (missing.length === 0) return
    Promise.all(missing.map((uid) => getUserDoc(uid).then((doc) => (doc ? { uid, ...doc } : null)))).then((results) => {
      const next: Record<string, DiscoveryCandidate> = {}
      for (const r of results) if (r) next[r.uid] = r
      setProfiles((prev) => ({ ...prev, ...next }))
    })
  }, [matches, user, profiles])

  const matched = user
    ? (matches ?? [])
        .map((m) => {
          const otherUid = m.users.find((u) => u !== user.uid)
          return otherUid ? { matchId: m.id, profile: profiles[otherUid] } : null
        })
        .filter((m): m is { matchId: string; profile: DiscoveryCandidate } => !!m?.profile)
    : []

  return (
    <div className="px-6 pt-8 pb-10 md:px-10 md:pt-12 lg:px-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Mutual Alignment</p>
        <h1 className="font-serif-display text-4xl md:text-5xl">Your Matches</h1>
        <p className="mt-3 max-w-lg text-white/50">
          {matched.length} people you've connected with. Reach out and start a story.
        </p>
      </motion.div>

      {matches === null ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : matched.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl px-8 py-20 text-center">
          <p className="font-serif-display text-2xl text-champagne">No matches yet</p>
          <p className="max-w-sm text-sm text-white/50">
            Keep exploring your curated discovery collection — your next match is waiting.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {matched.map(({ matchId, profile: p }, i) => (
            <motion.div
              key={matchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/profile/${p.uid}`)}
              className="group cursor-pointer overflow-hidden rounded-2xl glass"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={p.profilePhotoUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/messages/${matchId}`)
                  }}
                  className="glass-strong absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-champagne cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-1">
                    <p className="font-serif-display text-lg text-white">{p.name.split(' ')[0]}</p>
                    {p.verification?.status === 'verified' && <BadgeCheck className="h-3.5 w-3.5 text-gold" />}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
