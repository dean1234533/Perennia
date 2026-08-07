import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, MessageCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/badge'

export function Matches() {
  const navigate = useNavigate()
  const { matchedIds, profiles } = useApp()
  const matched = profiles.filter((p) => matchedIds.includes(p.id))

  return (
    <div className="px-6 pt-8 pb-10 md:px-10 md:pt-12 lg:px-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Mutual Alignment</p>
        <h1 className="font-serif-display text-4xl md:text-5xl">Your Matches</h1>
        <p className="mt-3 max-w-lg text-white/50">
          {matched.length} people you've connected with. Reach out and start a story.
        </p>
      </motion.div>

      {matched.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl px-8 py-20 text-center">
          <p className="font-serif-display text-2xl text-champagne">No matches yet</p>
          <p className="max-w-sm text-sm text-white/50">
            Keep exploring your curated discovery collection — your next match is waiting.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {matched.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/profile/${p.id}`)}
              className="group cursor-pointer overflow-hidden rounded-2xl glass"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/messages/${p.id}`)
                  }}
                  className="glass-strong absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-champagne cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-1">
                    <p className="font-serif-display text-lg text-white">{p.name.split(' ')[0]}</p>
                    {p.verified && <BadgeCheck className="h-3.5 w-3.5 text-gold" />}
                  </div>
                  <Badge variant="gold" className="mt-1 px-2 py-0.5 text-[9px]">
                    {p.compatibility}% Match
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
