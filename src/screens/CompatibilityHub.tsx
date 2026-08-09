import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { getUserDoc, type DiscoveryCandidate } from '@/lib/firestore'
import { getCompatibility, type PersonBirthProfile } from '@/lib/compatibilityApi'

export function CompatibilityHub() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { matchedIds, likedIds, onboarding } = useApp()
  const relevantIds = useMemo(() => Array.from(new Set([...matchedIds, ...likedIds])), [matchedIds, likedIds])

  const [profiles, setProfiles] = useState<Record<string, DiscoveryCandidate>>({})
  const [scores, setScores] = useState<Record<string, { compatibility: number; band: string }>>({})
  const [loading, setLoading] = useState(true)

  const selfChartComplete = Boolean(
    onboarding.sunSign && onboarding.moonSign && onboarding.risingSign &&
    onboarding.chineseAnimal && onboarding.chineseElement && onboarding.yinYang
  )

  useEffect(() => {
    if (relevantIds.length === 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all(relevantIds.map((uid) => getUserDoc(uid).then((doc) => (doc ? { uid, ...doc } : null))))
      .then((results) => {
        const next: Record<string, DiscoveryCandidate> = {}
        for (const r of results) if (r) next[r.uid] = r
        setProfiles(next)
      })
      .finally(() => setLoading(false))
  }, [relevantIds])

  useEffect(() => {
    if (!selfChartComplete) return
    const people = Object.values(profiles).filter((p) => !scores[p.uid])
    if (people.length === 0) return
    const personA: PersonBirthProfile = {
      sunSign: onboarding.sunSign,
      moonSign: onboarding.moonSign,
      risingSign: onboarding.risingSign,
      chineseAnimal: onboarding.chineseAnimal,
      chineseElement: onboarding.chineseElement,
      yinYang: onboarding.yinYang,
    }
    Promise.all(
      people.map(async (p) => {
        try {
          const result = await getCompatibility({
            personA,
            personB: {
              sunSign: p.sunSign,
              moonSign: p.moonSign,
              risingSign: p.risingSign,
              chineseAnimal: p.chineseAnimal,
              chineseElement: p.chineseElement,
              yinYang: p.yinYang,
            },
          })
          return [p.uid, { compatibility: result.compatibility, band: result.band }] as const
        } catch {
          return null
        }
      })
    ).then((results) => {
      const resolved = results.filter((r): r is readonly [string, { compatibility: number; band: string }] => r !== null)
      if (resolved.length) setScores((prev) => ({ ...prev, ...Object.fromEntries(resolved) }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, selfChartComplete, onboarding.sunSign, onboarding.moonSign, onboarding.risingSign, onboarding.chineseAnimal, onboarding.chineseElement, onboarding.yinYang])

  const relevant = relevantIds.map((uid) => profiles[uid]).filter((p): p is DiscoveryCandidate => !!p)
  const ranked = [...relevant].sort((a, b) => (scores[b.uid]?.compatibility ?? -1) - (scores[a.uid]?.compatibility ?? -1))
  const [featured, ...rest] = ranked

  return (
    <div className="mx-auto max-w-3xl px-6 pt-8 pb-16 md:pt-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold/70">Cosmic Alignment</p>
        <h1 className="font-serif-display text-4xl md:text-5xl">Compatibility</h1>
        <p className="mx-auto mt-3 max-w-md text-white/50">
          Every real connection's full compatibility breakdown, in one place.
        </p>
      </motion.div>

      {!user ? null : loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : relevant.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Sparkles className="h-7 w-7 text-gold/40" />
          <p className="font-serif-display text-2xl text-champagne">Nothing to show yet</p>
          <p className="max-w-sm text-sm text-white/50">
            Like or match with someone in Discovery to see your compatibility report here.
          </p>
        </div>
      ) : (
        <>
          {/* Featured — the strongest alignment, given real editorial weight */}
          {featured && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/compatibility/${featured.uid}`)}
              className="group mb-12 flex w-full flex-col items-center gap-6 text-center cursor-pointer sm:flex-row sm:text-left"
            >
              <div className="relative shrink-0">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-gold/25 via-champagne/10 to-transparent blur-xl transition-opacity group-hover:opacity-80" />
                <img
                  src={featured.profilePhotoUrl}
                  alt={featured.name}
                  className="relative h-28 w-28 rounded-full border-2 border-gold/40 object-cover shadow-2xl"
                />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">Strongest Alignment</p>
                <p className="font-serif-display text-2xl text-white">{featured.name}</p>
                <p className="mt-1 text-sm text-white/50">
                  {scores[featured.uid]?.band ?? (selfChartComplete ? 'Calculating…' : 'Complete your cosmic profile')}
                </p>
              </div>
              {scores[featured.uid] ? (
                <p className="font-serif-display text-gradient-gold text-6xl">
                  {scores[featured.uid].compatibility}<span className="text-2xl text-white/40">%</span>
                </p>
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-gold/50" />
              )}
            </motion.button>
          )}

          {/* Everyone else — an editorial divided list, not another grid of boxes */}
          {rest.length > 0 && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/50">Your Other Connections</p>
              <div className="divide-y divide-white/5">
                {rest.map((p, i) => {
                  const score = scores[p.uid]
                  return (
                    <motion.button
                      key={p.uid}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => navigate(`/compatibility/${p.uid}`)}
                      className="flex w-full items-center gap-4 py-4 text-left cursor-pointer transition-colors hover:bg-white/[0.02]"
                    >
                      <img src={p.profilePhotoUrl} alt={p.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif-display text-base text-white">{p.name}</p>
                        <p className="truncate text-xs text-white/40">{score?.band ?? (selfChartComplete ? 'Calculating…' : 'Complete your cosmic profile')}</p>
                      </div>
                      {score ? (
                        <span className="font-serif-display text-gradient-gold shrink-0 text-xl">{score.compatibility}%</span>
                      ) : (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold/40" />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
