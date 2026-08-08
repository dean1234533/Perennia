import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, MessageCircle, Loader2, AlertTriangle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Starfield } from '@/components/shared/Starfield'
import { SelfAvatar } from '@/components/shared/SelfAvatar'
import { getCompatibility, type CompatibilityResult, type PersonBirthProfile } from '@/lib/compatibilityApi'

const FACTOR_LABELS: Record<keyof CompatibilityResult['factors'], string> = {
  sun: 'Sun Sign',
  moon: 'Moon Sign',
  rising: 'Rising Sign',
  animal: 'Chinese Animal',
  element: 'Chinese Element',
  yinYang: 'Yin / Yang',
}

const INSIGHT_LABELS: Record<keyof CompatibilityResult['insights'], string> = {
  understanding: 'Understanding',
  emotionalConnection: 'Emotional Connection',
  communication: 'Communication',
  relationshipGrowth: 'Relationship Growth',
  challenges: 'Challenges',
  longTermPotential: 'Long-Term Potential',
}

export function CompatibilityReport() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profiles, onboarding } = useApp()
  const profile = id ? profiles.find((p) => p.id === id) : undefined

  const [result, setResult] = useState<CompatibilityResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const selfChartComplete = Boolean(
    onboarding.sunSign && onboarding.moonSign && onboarding.risingSign &&
    onboarding.chineseAnimal && onboarding.chineseElement && onboarding.yinYang
  )

  useEffect(() => {
    if (!profile || !selfChartComplete) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    const personA: PersonBirthProfile = {
      sunSign: onboarding.sunSign,
      moonSign: onboarding.moonSign,
      risingSign: onboarding.risingSign,
      chineseAnimal: onboarding.chineseAnimal,
      chineseElement: onboarding.chineseElement,
      yinYang: onboarding.yinYang,
    }
    const personB: PersonBirthProfile = {
      sunSign: profile.sunSign,
      moonSign: profile.moonSign,
      risingSign: profile.risingSign,
      chineseAnimal: profile.chineseZodiac,
      chineseElement: profile.chineseElement,
      yinYang: profile.yinYang,
    }
    getCompatibility({ personA, personB })
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your compatibility report.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, selfChartComplete])

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-serif-display text-2xl text-champagne">Report not found</p>
        <Button onClick={() => navigate('/discovery')}>Back to Discovery</Button>
      </div>
    )
  }

  const factorEntries = result
    ? (Object.entries(result.factors) as [keyof CompatibilityResult['factors'], CompatibilityResult['factors'][keyof CompatibilityResult['factors']]][])
        .sort((a, b) => b[1].score - a[1].score)
    : []
  const [topFactor, ...otherFactors] = factorEntries
  const insightEntries = result
    ? (Object.entries(result.insights) as [keyof CompatibilityResult['insights'], string][])
    : []

  return (
    <div className="relative pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] overflow-hidden">
        <Starfield density={70} />
      </div>

      <Button variant="glass" size="icon" onClick={() => navigate(-1)} className="fixed left-4 top-4 z-30 md:left-8 md:top-8 lg:left-28 xl:left-72">
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-16 text-center md:pt-24">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-xs uppercase tracking-[0.3em] text-gold/80"
        >
          Compatibility Report
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-serif-display mb-2 text-3xl md:text-5xl"
        >
          You &amp; {profile.name.split(' ')[0]}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12 text-white/50"
        >
          A closer look at the real alignment across six weighted dimensions — sun, moon, rising,
          Chinese animal, element, and yin/yang.
        </motion.p>

        {!selfChartComplete ? (
          <div className="glass-strong mb-16 flex flex-col items-center gap-4 rounded-[2rem] px-8 py-14 text-center">
            <AlertTriangle className="h-8 w-8 text-gold" />
            <p className="font-serif-display text-2xl text-champagne">Complete Your Cosmic Profile</p>
            <p className="max-w-sm text-sm text-white/55">
              Your real compatibility report needs your birth date, time, and place to calculate your
              Sun, Moon, Rising, and Chinese zodiac.
            </p>
            <Button onClick={() => navigate('/birth-details')}>Add Birth Details</Button>
          </div>
        ) : loading ? (
          <div className="mb-16 flex flex-col items-center gap-3 py-14">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="text-sm text-white/50">Calculating your real compatibility…</p>
          </div>
        ) : error ? (
          <div className="glass-strong mb-16 flex flex-col items-center gap-4 rounded-[2rem] px-8 py-14 text-center">
            <AlertTriangle className="h-8 w-8 text-rose-400" />
            <p className="font-serif-display text-2xl text-champagne">Couldn't Load This Report</p>
            <p className="max-w-sm text-sm text-white/55">{error}</p>
            <Button variant="glass" onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : result ? (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 flex justify-center"
            >
              <ProgressRing value={result.compatibility} size={260} strokeWidth={12} label={`${result.compatibility}%`} sublabel={result.band} />
            </motion.div>

            <div className="mb-16 flex items-center justify-center gap-4">
              <SelfAvatar className="h-12 w-12 rounded-full border-2 border-gold/40" />
              <Sparkles className="h-5 w-5 text-gold" />
              <img src={profile.images[0]} alt={profile.name} className="h-12 w-12 rounded-full border-2 border-gold/40 object-cover" />
            </div>
          </>
        ) : null}
      </div>

      {result && (
        <div className="relative z-10 mx-auto max-w-4xl px-6">
          {/* Strongest dimension — featured, full-width */}
          {topFactor && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="glass glow-gold mb-6 overflow-hidden rounded-[1.75rem]"
            >
              <div className="p-8 md:p-10">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gold/70">
                  <Sparkles className="h-3 w-3" /> Strongest Dimension
                </div>
                <div className="mb-4 flex items-end justify-between">
                  <h3 className="font-serif-display text-3xl text-champagne md:text-4xl">{FACTOR_LABELS[topFactor[0]]}</h3>
                  <span className="font-serif-display text-gradient-gold text-4xl md:text-5xl">{topFactor[1].score}%</span>
                </div>
                <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${topFactor[1].score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                    className="h-full rounded-full bg-gradient-to-r from-gold to-champagne"
                  />
                </div>
                <p className="max-w-2xl text-white/70 leading-relaxed">{topFactor[1].insight}</p>
              </div>
            </motion.div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {otherFactors.map(([key, factor], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: (i % 2) * 0.1 }}
              >
                <Card className="h-full overflow-hidden">
                  <CardContent className="p-7">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-serif-display text-xl text-champagne">{FACTOR_LABELS[key]}</h3>
                      <span className="font-serif-display text-2xl text-gradient-gold">{factor.score}%</span>
                    </div>
                    <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${factor.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                        className="h-full rounded-full bg-gradient-to-r from-gold to-champagne"
                      />
                    </div>
                    <p className="text-sm leading-relaxed text-white/55">{factor.insight}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Overall narrative — six fixed dimensions of the relationship */}
          <div className="mt-14">
            <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">The Full Picture</p>
            <h2 className="font-serif-display mb-6 text-2xl text-champagne">What This Alignment Means</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {insightEntries.map(([key, text], i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="glass rounded-2xl p-6"
                >
                  <p className="mb-2 text-xs uppercase tracking-widest text-gold/60">{INSIGHT_LABELS[key]}</p>
                  <p className="text-sm leading-relaxed text-white/70">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="glass-strong glow-gold mt-10 flex flex-col items-center rounded-[2rem] px-8 py-14 text-center"
          >
            <h2 className="font-serif-display mb-3 text-2xl md:text-3xl">Ready to Explore This Further?</h2>
            <p className="mb-8 max-w-md text-white/55">
              Compatibility this rare doesn't happen often. Perhaps it's time to say hello.
            </p>
            <Button size="lg" onClick={() => navigate(`/messages/${profile.id}`)}>
              <MessageCircle className="h-4 w-4" /> Message {profile.name.split(' ')[0]}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
