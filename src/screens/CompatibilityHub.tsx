import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { ProgressRing } from '@/components/ui/progress-ring'
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

  return (
    <div className="px-6 pt-8 pb-10 md:px-10 md:pt-12 lg:px-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Cosmic Alignment</p>
        <h1 className="font-serif-display text-4xl md:text-5xl">Compatibility</h1>
        <p className="mt-3 max-w-lg text-white/50">
          Every connection's full compatibility breakdown, in one place.
        </p>
      </motion.div>

      {!user ? null : loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : relevant.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl px-8 py-20 text-center">
          <Sparkles className="h-8 w-8 text-gold/50" />
          <p className="font-serif-display text-2xl text-champagne">Nothing to show yet</p>
          <p className="max-w-sm text-sm text-white/50">
            Like or match with someone in Discovery to see your compatibility report here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {relevant.map((p, i) => {
            const score = scores[p.uid]
            return (
              <motion.button
                key={p.uid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/compatibility/${p.uid}`)}
                className="glass flex items-center gap-4 rounded-2xl p-4 text-left cursor-pointer hover:border-gold/25"
              >
                <img src={p.profilePhotoUrl} alt={p.name} className="h-16 w-16 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="font-serif-display text-lg text-white">{p.name}</p>
                  <p className="text-xs text-white/45">{score?.band ?? (selfChartComplete ? 'Calculating…' : 'Complete your cosmic profile')}</p>
                </div>
                {score ? (
                  <ProgressRing value={score.compatibility} size={52} strokeWidth={5} label={`${score.compatibility}%`} />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-gold/50" />
                )}
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
