import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, MapPin, SlidersHorizontal } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function Discovery() {
  const navigate = useNavigate()
  const { passedIds, profiles } = useApp()
  const [filter, setFilter] = useState<'all' | 'nearby'>('all')

  const visible = profiles.filter((p) => !passedIds.includes(p.id))

  return (
    <div className="px-6 pt-8 pb-10 md:px-10 md:pt-12 lg:px-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-gold/80">Curated for you</p>
          <h1 className="font-serif-display text-3xl md:text-4xl">Your Discovery Collection</h1>
          <p className="mt-2 max-w-lg text-sm text-white/50">
            {visible.length} highly compatible people, selected by our compatibility engine — not an endless feed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors cursor-pointer ${filter === 'all' ? 'bg-gold/15 text-champagne border border-gold/30' : 'glass text-white/50'}`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilter('nearby')}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors cursor-pointer ${filter === 'nearby' ? 'bg-gold/15 text-champagne border border-gold/30' : 'glass text-white/50'}`}
          >
            Nearby
          </button>
          <Button variant="glass" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {visible.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass flex flex-col items-center gap-3 rounded-3xl px-8 py-20 text-center"
        >
          <p className="font-serif-display text-2xl text-champagne">You've seen everyone for now</p>
          <p className="max-w-sm text-sm text-white/50">
            Check back soon — we're curating new compatible introductions for you daily.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p, i) => (
            <motion.div
              key={p.id}
              layoutId={`card-${p.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              onClick={() => navigate(`/profile/${p.id}`)}
              className="group cursor-pointer overflow-hidden rounded-[1.75rem] glass transition-shadow duration-500 hover:shadow-[0_20px_60px_-15px_rgba(107,79,214,0.5)]"
            >
              <div className="relative h-80 overflow-hidden">
                <motion.img
                  layoutId={`card-img-${p.id}`}
                  src={p.images[0]}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <div className="absolute right-4 top-4">
                  <div className="glass-strong flex items-center gap-1.5 rounded-full px-3 py-1.5">
                    <span className="font-serif-display text-sm text-gradient-gold">{p.compatibility}%</span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <h3 className="font-serif-display text-2xl text-white">{p.name.split(' ')[0]}, {p.age}</h3>
                    {p.verified && <BadgeCheck className="h-4 w-4 text-gold" />}
                  </div>
                  <div className="mb-2 flex items-center gap-1 text-xs text-white/60">
                    <MapPin className="h-3 w-3" />
                    {p.location}
                  </div>
                  <Badge variant="purple">{p.compatibilityLabel}</Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
