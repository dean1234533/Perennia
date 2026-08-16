import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  subscribeMyConnections,
  subscribeConversation,
  getUserDoc,
  type ConnectionDoc,
  type ConversationDoc,
  type DiscoveryCandidate,
} from '@/lib/firestore'

export function MessagesList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [matches, setMatches] = useState<ConnectionDoc[] | null>(null)
  const [profiles, setProfiles] = useState<Record<string, DiscoveryCandidate>>({})
  const [conversations, setConversations] = useState<Record<string, ConversationDoc | null>>({})

  useEffect(() => {
    if (!user) return
    return subscribeMyConnections(user.uid, setMatches)
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

  useEffect(() => {
    if (!matches) return
    const unsubs = matches.map((m) => subscribeConversation(m.id, (c) => setConversations((prev) => ({ ...prev, [m.id]: c }))))
    return () => unsubs.forEach((u) => u())
  }, [matches])

  const rows = user
    ? (matches ?? [])
        .map((m) => {
          const otherUid = m.users.find((u) => u !== user.uid)
          const profile = otherUid ? profiles[otherUid] : undefined
          return profile ? { matchId: m.id, profile, conversation: conversations[m.id] } : null
        })
        .filter((r): r is { matchId: string; profile: DiscoveryCandidate; conversation: ConversationDoc | null } => !!r)
        .sort((a, b) => {
          const aTime = a.conversation?.lastMessageAt?.toMillis() ?? 0
          const bTime = b.conversation?.lastMessageAt?.toMillis() ?? 0
          return bTime - aTime
        })
    : []

  return (
    <div className="px-6 pt-8 pb-10 md:px-10 md:pt-12 lg:px-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Conversations</p>
        <h1 className="font-serif-display text-4xl md:text-5xl">Messages</h1>
      </motion.div>

      {matches === null ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : rows.length === 0 ? (
        <div className="perennia-empty-state-panel glass flex flex-col items-center gap-3 rounded-3xl px-8 py-20 text-center">
          <p className="perennia-empty-state-heading font-serif-display text-2xl text-champagne">No conversations yet</p>
          <p className="perennia-empty-state-copy max-w-sm text-sm text-white/50">Like someone in Discovery to open a conversation.</p>
        </div>
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {rows.map(({ matchId, profile: p, conversation }, i) => {
            const unread = !!conversation?.lastMessageSenderId && conversation.lastMessageSenderId !== user?.uid
            const lastTime = conversation?.lastMessageAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            return (
              <motion.button
                key={matchId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(`/messages/${matchId}`)}
                className="glass flex items-center gap-4 rounded-2xl p-3 text-left transition-colors hover:bg-white/[0.06] cursor-pointer"
              >
                <div className="relative shrink-0">
                  <img src={p.profilePhotoUrl} alt={p.name} className="h-14 w-14 rounded-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-white">{p.name}</p>
                    {p.verification?.status === 'verified' && <BadgeCheck className="h-3.5 w-3.5 text-gold" />}
                  </div>
                  <p className={`truncate text-sm ${unread ? 'text-white/90 font-medium' : 'text-white/45'}`}>
                    {conversation?.lastMessagePreview ?? 'Say hello to start the conversation'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[11px] text-white/35">{lastTime ?? ''}</span>
                  {unread && <span className="h-2 w-2 rounded-full bg-gold" />}
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
