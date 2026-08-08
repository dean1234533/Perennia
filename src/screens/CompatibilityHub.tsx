import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { ProgressRing } from '@/components/ui/progress-ring'

export function CompatibilityHub() {
  const navigate = useNavigate()
  const { matchedIds, likedIds, profiles } = useApp()
  const relevant = profiles.filter((p) => matchedIds.includes(p.id) || likedIds.includes(p.id))

  return (
    <div className="px-6 pt-8 pb-10 md:px-10 md:pt-12 lg:px-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Cosmic Alignment</p>
        <h1 className="font-serif-display text-4xl md:text-5xl">Compatibility</h1>
        <p className="mt-3 max-w-lg text-white/50">
          Every connection's full compatibility breakdown, in one place.
        </p>
      </motion.div>

      {relevant.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl px-8 py-20 text-center">
          <Sparkles className="h-8 w-8 text-gold/50" />
          <p className="font-serif-display text-2xl text-champagne">Nothing to show yet</p>
          <p className="max-w-sm text-sm text-white/50">
            Like or match with someone in Discovery to see your compatibility report here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {relevant.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/compatibility/${p.id}`)}
              className="glass flex items-center gap-4 rounded-2xl p-4 text-left cursor-pointer hover:border-gold/25"
            >
              <img src={p.images[0]} alt={p.name} className="h-16 w-16 rounded-full object-cover" />
              <div className="flex-1">
                <p className="font-serif-display text-lg text-white">{p.name}</p>
                <p className="text-xs text-white/45">{p.compatibilityLabel}</p>
              </div>
              <ProgressRing value={p.compatibility} size={52} strokeWidth={5} label={`${p.compatibility}%`} />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
