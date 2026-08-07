import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, MapPin, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function Discovery() {
  const navigate = useNavigate()
  const { passedIds, profiles, onboarding } = useApp()
  const [filter, setFilter] = useState<'all' | 'nearby'>('all')

  const interestedIn = onboarding.gender === 'male' ? 'female' : onboarding.gender === 'female' ? 'male' : null

  const visible = profiles
    .filter((p) => !passedIds.includes(p.id) && (!interestedIn || p.gender === interestedIn))
    .sort((a, b) => b.compatibility - a.compatibility)

  const [featured, ...rest] = visible

  return (
    <div className="px-6 pt-8 pb-16 md:px-10 md:pt-12 lg:px-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Curated for you</p>
          <h1 className="font-serif-display text-4xl md:text-5xl">Your Discovery Collection</h1>
          <p className="mt-3 max-w-lg text-white/50">
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
        <>
          {/* Featured match — editorial, full-width, image + info split */}
          <motion.div
            layoutId={`card-${featured.id}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4 }}
            onClick={() => navigate(`/profile/${featured.id}`)}
            className="group mb-6 grid cursor-pointer grid-cols-1 overflow-hidden rounded-[2rem] glass glow-purple md:grid-cols-5"
          >
            <div className="relative h-80 overflow-hidden md:col-span-3 md:h-[420px]">
              <motion.img
                layoutId={`card-img-${featured.id}`}
                src={featured.images[0]}
                alt={featured.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r" />
              <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-[10px] uppercase tracking-widest text-champagne border border-gold/30">
                <Sparkles className="h-3 w-3" /> Top Alignment
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4 p-8 md:col-span-2 md:p-10">
              <div className="flex items-center gap-1">
                <h2 className="font-serif-display text-3xl text-white md:text-4xl">
                  {featured.name.split(' ')[0]}, {featured.age}
                </h2>
                {featured.verified && <BadgeCheck className="h-5 w-5 text-gold" />}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/50">
                <MapPin className="h-3.5 w-3.5" /> {featured.location} · {featured.profession}
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-white/55">{featured.about}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="glass-strong rounded-2xl px-4 py-2">
                  <span className="font-serif-display text-gradient-gold text-2xl">{featured.compatibility}%</span>
                </div>
                <Badge variant="purple">{featured.compatibilityLabel}</Badge>
              </div>
            </div>
          </motion.div>

          {/* Remaining matches — editorial grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {rest.map((p, i) => (
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
        </>
      )}
    </div>
  )
}
