import { motion } from 'framer-motion'
import {
  BadgeCheck, MapPin, Sun, Moon, ArrowUpCircle, CheckCheck,
  ShieldCheck, ScanFace, Sparkles,
} from 'lucide-react'
import { ProgressRing } from '@/components/ui/progress-ring'
import { ZodiacWheel } from '@/components/shared/ZodiacWheel'
import { editorial } from '@/data/editorial-images'

/** Chrome-less glass frame that makes homepage sections read as real product screens. */
export function DeviceFrame({
  children,
  className = '',
  label,
}: {
  children: React.ReactNode
  className?: string
  label?: string
}) {
  return (
    <div className={`glass-strong glow-purple relative overflow-hidden rounded-[1.75rem] ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-white/8 px-5 py-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        {label && (
          <span className="ml-3 text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</span>
        )}
      </div>
      {children}
    </div>
  )
}

export function DiscoveryMockup() {
  const cards = [
    { name: 'Amara, 29', pct: 94, label: 'Rare Alignment', img: editorial.portraitMoody },
    { name: 'Sienna, 27', pct: 88, label: 'Strong Alignment', img: editorial.portraitGlamour },
  ]
  return (
    <DeviceFrame label="Discovery">
      <div className="grid grid-cols-2 gap-3 p-4">
        {cards.map((c) => (
          <div key={c.name} className="relative overflow-hidden rounded-xl">
            <img src={c.img} alt="" className="h-40 w-full object-cover sm:h-56" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur">
              <span className="font-serif-display text-xs text-gradient-gold">{c.pct}%</span>
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-center gap-1">
                <p className="font-serif-display text-sm text-white">{c.name}</p>
                <BadgeCheck className="h-3 w-3 text-gold" />
              </div>
              <p className="text-[9px] text-white/50">{c.label}</p>
            </div>
          </div>
        ))}
      </div>
    </DeviceFrame>
  )
}

export function ProfileMockup() {
  return (
    <DeviceFrame label="Profile">
      <div className="relative h-72">
        <img src={editorial.portraitGlamour} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[9px] uppercase tracking-widest text-champagne border border-gold/30">
              Rare Alignment
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <p className="font-serif-display text-2xl text-white">Isabelle, 28</p>
            <BadgeCheck className="h-4 w-4 text-gold" />
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-white/60">
            <MapPin className="h-3 w-3" /> Oxford, UK · Curator
          </p>
        </div>
      </div>
    </DeviceFrame>
  )
}

export function CosmicProfileMockup() {
  return (
    <DeviceFrame label="Cosmic Profile">
      <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:justify-between">
        <ZodiacWheel size={140} />
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:min-w-[180px]">
          {[
            { icon: Sun, label: 'Sun', value: 'Libra' },
            { icon: Moon, label: 'Moon', value: 'Pisces' },
            { icon: ArrowUpCircle, label: 'Rising', value: 'Leo' },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
              <r.icon className="h-3.5 w-3.5 text-gold" />
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/40">{r.label}</p>
                <p className="font-serif-display text-sm text-champagne">{r.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DeviceFrame>
  )
}

export function CompatibilityMockup() {
  const sections = [
    { label: 'Emotional Connection', score: 92 },
    { label: 'Life Values', score: 88 },
    { label: 'Intellectual Bond', score: 85 },
  ]
  return (
    <DeviceFrame label="Compatibility Report">
      <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
        <ProgressRing value={94} size={140} strokeWidth={9} label="94%" sublabel="Rare Alignment" />
        <div className="flex w-full flex-col gap-3">
          {sections.map((s, i) => (
            <div key={s.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/60">{s.label}</span>
                <span className="text-gold">{s.score}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.score}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-gold to-champagne"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DeviceFrame>
  )
}

export function MessagingMockup() {
  return (
    <DeviceFrame label="Messages">
      <div className="flex flex-col gap-2.5 p-5">
        <div className="flex justify-start">
          <div className="glass max-w-[75%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-xs text-white/85">
            I have to say, your compatibility report genuinely surprised me — 94%?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-2xl rounded-br-md bg-gradient-to-br from-gold to-champagne px-3.5 py-2.5 text-xs text-midnight">
            I know! The values alignment section was scarily accurate.
          </div>
        </div>
        <div className="flex items-center gap-1 self-end pr-1 text-[9px] text-white/30">
          Read <CheckCheck className="h-3 w-3 text-gold" />
        </div>
        <div className="flex justify-start">
          <div className="glass flex items-center gap-1 rounded-2xl rounded-bl-md px-4 py-3">
            {[0, 1, 2].map((d) => (
              <motion.span
                key={d}
                className="h-1.5 w-1.5 rounded-full bg-white/50"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
              />
            ))}
          </div>
        </div>
      </div>
    </DeviceFrame>
  )
}

export function VerificationMockup() {
  return (
    <DeviceFrame label="Identity Verification">
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-gold/40 bg-white/[0.02]">
          <ScanFace className="h-9 w-9 text-white/25" />
          <motion.div
            className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent"
            animate={{ top: ['5%', '92%', '5%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Identity Verified
        </div>
        <p className="max-w-[240px] text-[11px] leading-relaxed text-white/45">
          Every Perennia member passes biometric verification before they ever appear in Discovery.
        </p>
      </div>
    </DeviceFrame>
  )
}

export function MatchesMockup() {
  return (
    <DeviceFrame label="Matches">
      <div className="flex items-center justify-center gap-3 p-8">
        <motion.img
          initial={{ x: 20, rotate: -6 }}
          whileInView={{ x: 0, rotate: -6 }}
          viewport={{ once: true }}
          src={editorial.portraitMale}
          alt=""
          className="h-20 w-20 -mr-3 rounded-full border-2 border-midnight object-cover shadow-xl"
        />
        <motion.img
          initial={{ x: -20, rotate: 6 }}
          whileInView={{ x: 0, rotate: 6 }}
          viewport={{ once: true }}
          src={editorial.portraitMoody}
          alt=""
          className="h-20 w-20 rounded-full border-2 border-midnight object-cover shadow-xl"
        />
        <div className="ml-3 text-left">
          <p className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold">
            <Sparkles className="h-3 w-3" /> It's a Match
          </p>
          <p className="font-serif-display text-lg text-white">94% Alignment</p>
        </div>
      </div>
    </DeviceFrame>
  )
}
