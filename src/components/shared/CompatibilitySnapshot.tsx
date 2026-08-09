import { motion } from 'framer-motion'
import { Sun, Moon, ArrowUpCircle, Sparkles } from 'lucide-react'
import type { SelfProfile } from '@/data/selfProfile'
import { ProgressRing } from '@/components/ui/progress-ring'

function overlap(a: string[], b: string[]): string[] {
  const bLower = new Set(b.map((x) => x.toLowerCase()))
  return a.filter((x) => bLower.has(x.toLowerCase()))
}

interface CompatibilityProfile {
  sunSign: string
  moonSign: string
  risingSign: string
  chineseAnimal: string
  profileExtras: SelfProfile | null
}

export function CompatibilitySnapshot({
  profile,
  self,
  otherLifestyle,
  selfLifestyle,
  compatibility,
  compatibilityLabel,
}: {
  profile: CompatibilityProfile
  self: SelfProfile
  /** Lifestyle lives in the privacy-gated `private/lifestyle` subdoc, not on
   *  SelfProfile — a successful fetch already means visibility allowed it. */
  otherLifestyle: { label: string; value: string }[]
  selfLifestyle: { label: string; value: string }[]
  compatibility: number
  compatibilityLabel: string
}) {
  const otherExtras = profile.profileExtras
  const sharedInterests = overlap(otherExtras?.interests ?? [], self.interests)
  const sharedValues = overlap(otherExtras?.values ?? [], self.values)
  const sharedLifestyle = otherLifestyle.filter((item) =>
    selfLifestyle.some((s) => s.label === item.label && s.value === item.value)
  )

  const chips = [
    { icon: Sun, label: 'Sun', value: profile.sunSign },
    { icon: Moon, label: 'Moon', value: profile.moonSign },
    { icon: ArrowUpCircle, label: 'Rising', value: profile.risingSign },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="glass glow-purple overflow-hidden rounded-[1.75rem]"
    >
      <div className="flex flex-col items-center gap-6 p-6 md:flex-row md:p-8">
        <ProgressRing
          value={compatibility}
          size={140}
          strokeWidth={9}
          label={`${compatibility}%`}
          sublabel={compatibilityLabel}
        />
        <div className="flex-1">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gold/70">Cosmic Alignment</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {chips.map((c) => (
              <div key={c.label} className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70">
                <c.icon className="h-3 w-3 text-gold" /> {c.label} · {c.value}
              </div>
            ))}
            {profile.chineseAnimal && (
              <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70">
                <Sparkles className="h-3 w-3 text-gold" /> {profile.chineseAnimal}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Shared Interests', count: sharedInterests.length },
              { label: 'Shared Values', count: sharedValues.length },
              { label: 'Shared Lifestyle', count: sharedLifestyle.length },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.1, type: 'spring', stiffness: 200 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] py-3"
              >
                <p className="font-serif-display text-gradient-gold text-2xl">{s.count}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/40">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
