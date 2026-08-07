import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck } from 'lucide-react'
import { conversationSeeds } from '@/data/messages'
import { useApp } from '@/context/AppContext'

export function MessagesList() {
  const navigate = useNavigate()
  const { matchedIds, profiles } = useApp()
  const matched = profiles.filter((p) => matchedIds.includes(p.id))

  return (
    <div className="px-6 pt-8 pb-10 md:px-10 md:pt-12 lg:px-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Conversations</p>
        <h1 className="font-serif-display text-4xl md:text-5xl">Messages</h1>
      </motion.div>

      {matched.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl px-8 py-20 text-center">
          <p className="font-serif-display text-2xl text-champagne">No conversations yet</p>
          <p className="max-w-sm text-sm text-white/50">Match with someone to start a conversation.</p>
        </div>
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {matched.map((p, i) => {
            const thread = conversationSeeds[p.id] ?? []
            const last = thread[thread.length - 1]
            const unread = last && last.sender === 'them' && !last.read
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(`/messages/${p.id}`)}
                className="glass flex items-center gap-4 rounded-2xl p-3 text-left transition-colors hover:bg-white/[0.06] cursor-pointer"
              >
                <div className="relative shrink-0">
                  <img src={p.images[0]} alt={p.name} className="h-14 w-14 rounded-full object-cover" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-midnight bg-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-white">{p.name}</p>
                    {p.verified && <BadgeCheck className="h-3.5 w-3.5 text-gold" />}
                  </div>
                  <p className={`truncate text-sm ${unread ? 'text-white/90 font-medium' : 'text-white/45'}`}>
                    {last?.voice ? '🎙️ Voice message' : last?.text ?? 'Say hello to start the conversation'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[11px] text-white/35">{last?.time ?? ''}</span>
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
