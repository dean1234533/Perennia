import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AtmosphericBackground } from '@/components/shared/AtmosphericBackground'
import { MemberCounter } from '@/components/founding500/MemberCounter'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import { ensureFounding500Config, subscribeFounding500Config } from '@/lib/founding500'
import type { Founding500Config, MembershipTier } from '@/types/founding500'

const FLOW_PRIMARY_BUTTON = 'min-h-12 border border-gold/75 bg-[#0a1023]/45 text-champagne shadow-[0_0_18px_rgba(229,192,123,.22),inset_0_0_18px_rgba(229,192,123,.05)] backdrop-blur-md hover:border-gold hover:bg-gold/10 hover:text-white hover:shadow-[0_0_28px_rgba(229,192,123,.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-4 focus-visible:ring-offset-midnight active:scale-[.98] disabled:border-white/20 disabled:bg-[#0a1023]/35 disabled:text-white/45 disabled:shadow-none disabled:opacity-100'
const FLOW_SECONDARY_BUTTON = 'min-h-12 border border-blue-200/35 bg-[#071126]/45 text-blue-100 shadow-[0_0_16px_rgba(96,135,255,.14)] backdrop-blur-md hover:border-blue-200/60 hover:bg-blue-300/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/60 focus-visible:ring-offset-4 focus-visible:ring-offset-midnight active:scale-[.98] disabled:border-white/20 disabled:text-white/45 disabled:opacity-100'

const BENEFITS = [
  { icon: 'shield', title: 'Locked-in founding pricing', body: 'Never adjusted while you remain a member.' },
  { icon: 'star', title: 'A permanent founding number', body: 'Your place from #1 to #500, recorded forever.' },
  { icon: 'person', title: 'A hand in shaping Perennia', body: 'Get early access to new features and influence what comes next.' },
  { icon: 'heart', title: 'The full Perennia experience', body: 'No stripped-down starter — founding members get everything.' },
]

function formatPrice(amount: number, currency: string) {
  const symbol = currency.toUpperCase() === 'GBP' ? '£' : currency.toUpperCase() === 'USD' ? '$' : '€'
  return `${symbol}${amount.toFixed(2)}`
}

export function Founding500() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Carried from RequireFoundingMembership when an unpaid visitor tries to
  // reach a real app screen — preserved through signup/checkout so payment
  // lands them back where they were actually headed, not always Discovery.
  const next = searchParams.get('next')
  const { isAuthenticated, onboarding } = useApp()
  const { user } = useAuth()
  const [config, setConfig] = useState<Founding500Config | null>(null)

  useEffect(() => {
    if (!firebaseConfigured) return
    ensureFounding500Config().catch((err) => console.warn('[Perennia] Failed to bootstrap Founding 500 config:', err))
    return subscribeFounding500Config(setConfig)
  }, [])

  const isFull = !config || !config.enabled || config.currentMemberCount >= config.memberLimit

  const handleSelectTier = (tier: MembershipTier) => {
    const dest = `/founding-500/checkout?tier=${tier}${next ? `&next=${encodeURIComponent(next)}` : ''}`
    if (!isAuthenticated) {
      navigate(`/signup?next=${encodeURIComponent(dest)}`)
    } else {
      navigate(dest)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-midnight text-white">
      <AtmosphericBackground />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: 'radial-gradient(90% 60% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 60%)' }}
      />

      <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Go back" className={`fixed left-4 top-4 z-30 md:left-7 md:top-6 md:w-auto md:px-4 ${FLOW_SECONDARY_BUTTON}`}>
        <ArrowLeft className="h-4 w-4" /><span className="hidden md:inline">Back</span>
      </Button>

      {user?.email && (
        <div className="fixed right-4 top-4 z-30 hidden items-center gap-4 text-[11px] md:flex md:right-7 md:top-6">
          <span className="flex items-center gap-1.5 text-white/75">
            <ShieldMark className={`h-4 w-4 ${onboarding.verification.status === 'verified' ? 'text-gold' : 'text-white/35'}`} />
            {onboarding.verification.status === 'verified' ? 'Identity verified' : 'Verification pending'}
            <i className={`h-2 w-2 rounded-full ${onboarding.verification.status === 'verified' ? 'bg-emerald-400' : 'bg-white/25'}`} />
          </span>
          <span className="max-w-[220px] truncate rounded-full border border-white/15 bg-[#071126]/45 px-4 py-2.5 text-white/75 backdrop-blur-md">{user.email}</span>
        </div>
      )}

      {/* Hero */}
      <div className="relative z-10 mx-auto max-w-3xl px-5 pb-4 pt-12 text-center sm:px-6 md:pb-6 md:pt-5">
        {next && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-6 max-w-md rounded-xl border border-gold/20 bg-gold/5 px-4 py-2.5 text-xs text-champagne/80"
          >
            Perennia is a Founding 500 membership — choose a plan to continue.
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-2 flex flex-col items-center"
        >
          <HeartMark className="mb-1 h-8 w-8 text-gold md:h-10 md:w-10" />
          <div className="mb-2 flex items-center" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6].map((step) => (
              <span key={step} className="flex items-center">
                {step > 0 && <i className={`h-px w-7 ${step <= 3 ? 'bg-gold/70' : 'bg-white/20'}`} />}
                <i className={`block rounded-full border ${step === 3 ? 'h-5 w-5 border-gold bg-gold/25 shadow-[0_0_14px_rgba(229,192,123,.7)]' : step < 3 ? 'h-3 w-3 border-gold/70 bg-gold' : 'h-3 w-3 border-white/25 bg-[#071126]/70'}`} />
              </span>
            ))}
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold/75 sm:text-xs">Be here at the beginning</p>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif-display text-gradient-gold mb-2 whitespace-nowrap text-[2.35rem] leading-none tracking-[.05em] sm:text-5xl md:text-[4.15rem]"
        >
          FOUNDING 500
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base md:mb-4"
        >
          Become one of the first 500 members of Perennia and receive introductory pricing
          reserved for our founding community.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {config ? (
            <MemberCounter config={config} />
          ) : (
            <p className="text-xs uppercase tracking-widest text-white/30">Loading availability…</p>
          )}
        </motion.div>
      </div>

      {config && (
        <div className="relative z-10 mx-auto grid max-w-[94rem] gap-3 px-5 pb-5 sm:px-6 md:grid-cols-[minmax(0,2.2fr)_minmax(19rem,.85fr)] md:items-start md:gap-5 md:px-8 md:pb-8">
          <section>
            <SectionRule>Choose Your Membership</SectionRule>
            <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
              <TierCard tier="essential" title="Essential" description="The complete Perennia experience — compatibility-first matching, real conversations, no compromises." pricing={config.essential} currency={config.currency} promoPeriodMonths={config.promoPeriodMonths} isFull={isFull} className="order-2 md:order-1" onSelect={() => handleSelectTier('essential')} />
              <TierCard tier="premium" title="Premium" description="Everything in Essential, plus priority visibility, deeper compatibility insight, and founding-tier recognition." pricing={config.premium} currency={config.currency} promoPeriodMonths={config.promoPeriodMonths} isFull={isFull} featured className="order-1 md:order-2" onSelect={() => handleSelectTier('premium')} />
            </div>

            {isFull && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto mt-5 max-w-md text-center text-sm text-white/55">
                {!config.enabled ? 'The Founding 500 offer isn\'t active right now.' : 'The Founding 500 is now full — thank you to everyone who joined us at the beginning.'}
              </motion.p>
            )}

          </section>

          <section>
            <SectionRule>As a Founding Member You Get</SectionRule>
            <div className="grid grid-cols-4 gap-1.5 md:grid-cols-2 md:gap-3">
              {BENEFITS.map((b, i) => (
                <motion.div key={b.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex min-h-[9rem] flex-col items-center rounded-xl border border-white/10 bg-[#071126]/44 px-1.5 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-md md:min-h-[10rem] md:rounded-2xl md:p-4">
                  <BenefitMark kind={b.icon} />
                  <p className="mb-1 text-[8px] font-medium uppercase leading-snug text-champagne sm:text-[9px] md:text-xs">{b.title}</p>
                  <p className="text-[8px] leading-snug text-white/60 sm:text-[9px] md:text-[11px] md:leading-relaxed">{b.body}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {!isFull && (
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative mx-auto mt-3 flex w-full max-w-3xl flex-col items-center rounded-[1.5rem] border border-white/12 bg-[#071126]/38 px-5 pb-4 pt-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-md md:col-start-1 md:row-start-2 md:-mt-1">
              <span className="absolute -top-5 flex h-10 w-10 items-center justify-center rounded-full border border-gold/35 bg-[#12162c] shadow-[0_0_18px_rgba(229,192,123,.22)]"><ShieldMark className="h-6 w-6 text-gold" checked /></span>
              <h2 className="font-serif-display text-2xl text-champagne md:text-3xl">Your Place Is Waiting</h2>
              <p className="mb-3 text-xs text-white/60">{config.memberLimit - config.currentMemberCount} of {config.memberLimit} founding places remain.</p>
              <Button size="lg" variant="outline" className={`w-full max-w-xl ${FLOW_PRIMARY_BUTTON}`} onClick={() => handleSelectTier('premium')}>Secure My Place Now <span aria-hidden="true">→</span></Button>
              <p className="mt-2 text-[10px] text-white/40">Secure checkout powered by Stripe.</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionRule({ children }: { children: string }) {
  return (
    <div className="mb-3 flex items-center gap-3" aria-hidden="true">
      <span className="relative h-px flex-1 bg-gradient-to-r from-transparent to-gold/55"><i className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rotate-45 bg-gold shadow-[0_0_8px_rgba(229,192,123,.7)]" /></span>
      <p className="text-center text-[10px] uppercase tracking-[.28em] text-champagne">{children}</p>
      <span className="relative h-px flex-1 bg-gradient-to-l from-transparent to-gold/55"><i className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rotate-45 bg-gold shadow-[0_0_8px_rgba(229,192,123,.7)]" /></span>
    </div>
  )
}

function TierCard({
  tier,
  title,
  description,
  pricing,
  currency,
  promoPeriodMonths,
  isFull,
  featured,
  className,
  onSelect,
}: {
  tier: MembershipTier
  title: string
  description: string
  pricing: { introPrice: number; year1Price: number; futurePrice: number }
  currency: string
  promoPeriodMonths: number
  isFull: boolean
  featured?: boolean
  className?: string
  onSelect: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.045),0_20px_55px_rgba(2,7,20,.18)] backdrop-blur-md sm:p-5 md:p-6 ${
        featured
          ? 'border-gold/45 bg-[#16132a]/55 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_0_34px_rgba(229,192,123,.13)]'
          : 'border-blue-200/20 bg-[#071126]/52'
      } ${className ?? ''}`}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.25em] text-gold/70">Founding 500 Member</p>
        {featured && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/35 bg-gold/[.08] px-3 py-1 text-[10px] uppercase tracking-widest text-gold">
            <FourPointStar className="h-3.5 w-3.5 text-gold" filled /> Most Chosen
          </span>
        )}
      </div>
      <div className="mb-1 flex items-center justify-between gap-4">
        <h3 className="font-serif-display text-3xl text-champagne">{title}</h3>
        <span className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tier === 'premium' ? 'bg-violet-500/10 shadow-[0_0_28px_rgba(168,85,247,.35)]' : 'bg-blue-400/10 shadow-[0_0_25px_rgba(96,165,250,.28)]'}`} aria-hidden="true">
          <TierGem tier={tier} />
        </span>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-white/70 sm:text-sm">{description}</p>

      <div className="mb-5 grid grid-cols-3 divide-x divide-white/10">
        <PricePoint price={pricing.introPrice} currency={currency} label={`First ${promoPeriodMonths} months`} emphasis={featured} intro />
        <PricePoint price={pricing.year1Price} currency={currency} label="Rest of your first year" />
        <PricePoint price={pricing.futurePrice} currency={currency} label="From year 2 onward" />
      </div>

      <Button size="lg" className={`mt-auto w-full ${featured ? FLOW_PRIMARY_BUTTON : FLOW_SECONDARY_BUTTON}`} variant="outline" onClick={onSelect} disabled={isFull}>
        {isFull ? 'The Founding 500 Is Full' : `Choose ${title}`}
      </Button>
    </motion.div>
  )
}

function PricePoint({ price, currency, label, emphasis, intro }: { price: number; currency: string; label: string; emphasis?: boolean; intro?: boolean }) {
  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0 sm:px-4">
      <p className={`flex items-center gap-1 font-serif-display text-xl sm:text-2xl ${emphasis ? 'text-gradient-gold' : 'text-champagne'}`}>
        {intro && <PriceTag className={`h-5 w-5 shrink-0 ${emphasis ? 'text-gold' : 'text-blue-200'}`} />}
        {formatPrice(price, currency)}
      </p>
      <p className="mt-0.5 text-[10px] text-white/45">/ month</p>
      <p className="mt-2 text-[10px] leading-snug text-white/50 sm:text-[11px]">{label}</p>
    </div>
  )
}

function TierGem({ tier }: { tier: MembershipTier }) {
  const premium = tier === 'premium'
  const prefix = premium ? 'premium' : 'essential'
  return (
    <svg viewBox="0 0 64 72" className="relative h-12 w-11 overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={`${prefix}-gem-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={premium ? '#f5c8ff' : '#e4f6ff'} />
          <stop offset="1" stopColor={premium ? '#8b3fd4' : '#4e98ff'} />
        </linearGradient>
        <linearGradient id={`${prefix}-gem-left`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={premium ? '#a24ede' : '#7abfff'} />
          <stop offset="1" stopColor={premium ? '#4a176d' : '#184cbf'} />
        </linearGradient>
        <linearGradient id={`${prefix}-gem-right`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={premium ? '#d775ff' : '#6eb7ff'} />
          <stop offset="1" stopColor={premium ? '#63239a' : '#0e37a2'} />
        </linearGradient>
        <filter id={`${prefix}-gem-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {premium && <circle cx="32" cy="36" r="27" fill="none" stroke="#a855f7" strokeOpacity=".2" strokeWidth="5" />}
      <g filter={`url(#${prefix}-gem-glow)`} stroke={premium ? '#e9b8ff' : '#bde5ff'} strokeOpacity=".65" strokeWidth=".8">
        <path d="M32 5 57 35 32 66 7 35Z" fill={`url(#${prefix}-gem-left)`} />
        <path d="M32 5 32 35 7 35Z" fill={`url(#${prefix}-gem-top)`} />
        <path d="M32 5 57 35 32 35Z" fill={`url(#${prefix}-gem-right)`} />
        <path d="M7 35 32 35 32 66Z" fill={premium ? '#7025a6' : '#194bbd'} />
        <path d="M57 35 32 35 32 66Z" fill={premium ? '#451263' : '#102d8f'} />
      </g>
      {premium && <path d="M32 20c1.2 8.2 3.3 12.4 12 15-8.7 2.6-10.8 6.8-12 15-1.2-8.2-3.3-12.4-12-15 8.7-2.6 10.8-6.8 12-15Z" fill="#ffd7e9" stroke="#fff0f7" strokeWidth=".8" />}
    </svg>
  )
}

function BenefitMark({ kind }: { kind: string }) {
  const styles = {
    shield: 'text-gold shadow-[0_0_15px_rgba(229,192,123,.22)]',
    star: 'text-violet-400 shadow-[0_0_15px_rgba(168,85,247,.2)]',
    person: 'text-blue-300 shadow-[0_0_15px_rgba(96,165,250,.2)]',
    heart: 'text-pink-400 shadow-[0_0_15px_rgba(244,114,182,.2)]',
  }[kind]
  return (
    <div className={`mb-1.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[.025] md:mb-2 md:h-12 md:w-12 md:rounded-xl ${styles}`} aria-hidden="true">
      {kind === 'shield' && <CrownShield className="h-8 w-8 md:h-11 md:w-11" />}
      {kind === 'star' && <OutlineStar className="h-8 w-8 md:h-11 md:w-11" />}
      {kind === 'person' && <PersonPlus className="h-8 w-8 md:h-11 md:w-11" />}
      {kind === 'heart' && <HeartMark className="h-8 w-8 md:h-11 md:w-11" />}
    </div>
  )
}

function HeartMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path d="M24 41C20.5 37.8 8 29.1 8 17.6 8 11.6 12 8 17.1 8c3.3 0 5.7 1.7 6.9 4.1C25.2 9.7 27.6 8 30.9 8 36 8 40 11.6 40 17.6 40 29.1 27.5 37.8 24 41Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FourPointStar({ className = '', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <path d="M16 2.5c1.4 7.4 3.1 11.9 13.5 13.5C19.1 17.6 17.4 22.1 16 29.5 14.6 22.1 12.9 17.6 2.5 16 12.9 14.4 14.6 9.9 16 2.5Z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function PriceTag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} fill="none" aria-hidden="true">
      <path d="M3 15 15 3h8v8L11 23 3 15Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="19" cy="7" r="1.6" fill="currentColor" />
    </svg>
  )
}

function ShieldMark({ className = '', checked = false }: { className?: string; checked?: boolean }) {
  return (
    <svg viewBox="0 0 40 44" className={className} fill="none" aria-hidden="true">
      <path d="M20 2.5c5.4 4.2 10.7 5.6 16 6.2v11.2C36 30.5 30.1 37 20 41.5 9.9 37 4 30.5 4 19.9V8.7c5.3-.6 10.6-2 16-6.2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {checked && <path d="m13.5 21.5 4.2 4.2 9-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

function CrownShield({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 52" className={className} fill="none" aria-hidden="true">
      <path d="M24 2.5c6.4 4.3 12.4 5.7 18 6.4v14c0 11-6.6 19-18 25.5C12.6 41.9 6 33.9 6 22.9v-14c5.6-.7 11.6-2.1 18-6.4Z" stroke="currentColor" strokeWidth="2.2" />
      <path d="m14.5 20.5 3.3 3.4 3.3-7 3.2 7 4.5-7 3.3 7 3.4-3.4-1.2 11H15.7l-1.2-11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M17 35h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function OutlineStar({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path d="m24 3.5 5.7 13.8 14.8 1.2-11.3 9.7 3.5 14.4L24 34.9l-12.7 7.7 3.5-14.4-11.3-9.7 14.8-1.2L24 3.5Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <FourPointStar className="text-current" />
    </svg>
  )
}

function PersonPlus({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <circle cx="20" cy="13" r="7" stroke="currentColor" strokeWidth="2.2" />
      <path d="M7 38c0-8 5.2-13 13-13s13 5 13 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M38 23v13M31.5 29.5h13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
