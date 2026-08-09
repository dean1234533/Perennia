import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, MapPin, SlidersHorizontal, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchDiscoveryCandidates, type DiscoveryCandidate } from '@/lib/firestore'
import { getCompatibility, type CompatibilityResult, type PersonBirthProfile } from '@/lib/compatibilityApi'
import { calculateAge } from '@/lib/age'

export function Discovery() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { passedIds, likedIds, onboarding } = useApp()
  const [filter, setFilter] = useState<'all' | 'nearby'>('all')
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [scores, setScores] = useState<Record<string, CompatibilityResult>>({})

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchDiscoveryCandidates(user.uid)
      .then((result) => {
        if (!cancelled) setCandidates(result)
      })
      .catch((err) => console.warn('[Perennia] Failed to load discovery candidates:', err))
      .finally(() => {
        if (!cancelled) setLoadingCandidates(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const interestedIn = onboarding.gender === 'male' ? 'female' : onboarding.gender === 'female' ? 'male' : null

  const eligible = candidates.filter(
    (c) => !passedIds.includes(c.uid) && !likedIds.includes(c.uid) && (!interestedIn || c.gender === interestedIn)
  )

  const selfChartComplete = Boolean(
    onboarding.sunSign && onboarding.moonSign && onboarding.risingSign &&
    onboarding.chineseAnimal && onboarding.chineseElement && onboarding.yinYang
  )

  // Real per-candidate compatibility from the Fusion System backend, cached
  // so re-renders don't re-call. Capped per pass to keep this cheap.
  useEffect(() => {
    if (!selfChartComplete) return
    const toFetch = eligible.filter((c) => !scores[c.uid]).slice(0, 20)
    if (toFetch.length === 0) return

    const personA: PersonBirthProfile = {
      sunSign: onboarding.sunSign,
      moonSign: onboarding.moonSign,
      risingSign: onboarding.risingSign,
      chineseAnimal: onboarding.chineseAnimal,
      chineseElement: onboarding.chineseElement,
      yinYang: onboarding.yinYang,
    }

    let cancelled = false
    Promise.all(
      toFetch.map(async (c) => {
        try {
          const result = await getCompatibility({
            personA,
            personB: {
              sunSign: c.sunSign,
              moonSign: c.moonSign,
              risingSign: c.risingSign,
              chineseAnimal: c.chineseAnimal,
              chineseElement: c.chineseElement,
              yinYang: c.yinYang,
            },
          })
          return [c.uid, result] as const
        } catch (err) {
          console.warn(`[Perennia] Failed to compute compatibility for ${c.uid}:`, err)
          return null
        }
      })
    ).then((results) => {
      if (cancelled) return
      const resolved = results.filter((r): r is readonly [string, CompatibilityResult] => r !== null)
      if (resolved.length) setScores((prev) => ({ ...prev, ...Object.fromEntries(resolved) }))
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible.map((c) => c.uid).join(','), selfChartComplete, onboarding.sunSign, onboarding.moonSign, onboarding.risingSign, onboarding.chineseAnimal, onboarding.chineseElement, onboarding.yinYang])

  const visible = eligible
    .filter((c) => scores[c.uid])
    .map((c) => ({ ...c, compatibility: scores[c.uid].compatibility, compatibilityLabel: scores[c.uid].band }))
    .sort((a, b) => b.compatibility - a.compatibility)

  const [featured, ...rest] = visible
  const loading = loadingCandidates || (eligible.length > 0 && selfChartComplete && visible.length === 0 && eligible.some((c) => !scores[c.uid]))

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

      {!selfChartComplete ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass flex flex-col items-center gap-3 rounded-3xl px-8 py-20 text-center"
        >
          <Sparkles className="h-8 w-8 text-gold/50" />
          <p className="font-serif-display text-2xl text-champagne">Complete Your Cosmic Profile</p>
          <p className="max-w-sm text-sm text-white/50">
            Add your birth date, time, and place so we can calculate real compatibility with other members.
          </p>
          <Button onClick={() => navigate('/birth-details')}>Add Birth Details</Button>
        </motion.div>
      ) : loading ? (
        <div className="flex flex-col items-center gap-3 py-24">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : candidates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass flex flex-col items-center gap-3 rounded-3xl px-8 py-20 text-center"
        >
          <p className="font-serif-display text-2xl text-champagne">No one here yet</p>
          <p className="max-w-sm text-sm text-white/50">
            You're one of our very first members — check back soon as more people join Perennia.
          </p>
        </motion.div>
      ) : visible.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass flex flex-col items-center gap-3 rounded-3xl px-8 py-20 text-center"
        >
          <p className="font-serif-display text-2xl text-champagne">You've seen everyone for now</p>
          <p className="max-w-sm text-sm text-white/50">
            Check back soon as more members join — we'll surface anyone new automatically.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Featured match — editorial, full-width, image + info split */}
          <motion.div
            layoutId={`card-${featured.uid}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4 }}
            onClick={() => navigate(`/profile/${featured.uid}`)}
            className="group mb-6 grid cursor-pointer grid-cols-1 overflow-hidden rounded-[2rem] glass glow-purple md:grid-cols-5"
          >
            <div className="relative h-80 overflow-hidden md:col-span-3 md:h-[420px]">
              <motion.img
                layoutId={`card-img-${featured.uid}`}
                src={featured.profilePhotoUrl}
                alt={featured.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r" />
              <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-gold/30 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-widest text-champagne shadow-lg backdrop-blur-md">
                <Sparkles className="h-3 w-3" /> Top Alignment
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4 p-8 md:col-span-2 md:p-10">
              <div className="flex items-center gap-1">
                <h2 className="font-serif-display text-3xl text-white md:text-4xl">
                  {featured.name.split(' ')[0]}{calculateAge(featured.birthDate) ? `, ${calculateAge(featured.birthDate)}` : ''}
                </h2>
                {featured.verification?.status === 'verified' && <BadgeCheck className="h-5 w-5 text-gold" />}
              </div>
              {(featured.profileExtras?.location || featured.profileExtras?.profession) && (
                <div className="flex items-center gap-1.5 text-sm text-white/50">
                  <MapPin className="h-3.5 w-3.5" /> {[featured.profileExtras?.location, featured.profileExtras?.profession].filter(Boolean).join(' · ')}
                </div>
              )}
              {featured.profileExtras?.about && (
                <p className="line-clamp-3 text-sm leading-relaxed text-white/55">{featured.profileExtras.about}</p>
              )}
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
                  key={p.uid}
                  layoutId={`card-${p.uid}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6 }}
                  onClick={() => navigate(`/profile/${p.uid}`)}
                  className="group cursor-pointer overflow-hidden rounded-[1.75rem] glass transition-shadow duration-500 hover:shadow-[0_20px_60px_-15px_rgba(107,79,214,0.5)]"
                >
                  <div className="relative h-80 overflow-hidden">
                    <motion.img
                      layoutId={`card-img-${p.uid}`}
                      src={p.profilePhotoUrl}
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
                        <h3 className="font-serif-display text-2xl text-white">
                          {p.name.split(' ')[0]}{calculateAge(p.birthDate) ? `, ${calculateAge(p.birthDate)}` : ''}
                        </h3>
                        {p.verification?.status === 'verified' && <BadgeCheck className="h-4 w-4 text-gold" />}
                      </div>
                      {p.profileExtras?.location && (
                        <div className="mb-2 flex items-center gap-1 text-xs text-white/60">
                          <MapPin className="h-3 w-3" />
                          {p.profileExtras.location}
                        </div>
                      )}
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
