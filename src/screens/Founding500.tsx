import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, ShieldCheck, Compass, MessageCircleHeart, Crown, Heart, Gem, Star, Tag } from 'lucide-react'
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
  { icon: Crown, title: 'Locked-in founding pricing', body: 'Your introductory rate is preserved for a full year — never adjusted while you remain a member.' },
  { icon: Sparkles, title: 'A permanent founding number', body: 'Your place among the first 500 is recorded forever, from #1 to #500.' },
  { icon: Compass, title: 'A hand in shaping Perennia', body: 'Founding members get early access to new features and a direct line to the team building them.' },
  { icon: MessageCircleHeart, title: 'The same compatibility-first experience', body: 'No stripped-down "starter" tier — founding members get the full Perennia experience from day one.' },
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
            <ShieldCheck className={`h-4 w-4 ${onboarding.verification.status === 'verified' ? 'text-gold' : 'text-white/35'}`} />
            {onboarding.verification.status === 'verified' ? 'Identity verified' : 'Verification pending'}
            <i className={`h-2 w-2 rounded-full ${onboarding.verification.status === 'verified' ? 'bg-emerald-400' : 'bg-white/25'}`} />
          </span>
          <span className="max-w-[220px] truncate rounded-full border border-white/15 bg-[#071126]/45 px-4 py-2.5 text-white/75 backdrop-blur-md">{user.email}</span>
        </div>
      )}

      {/* Hero */}
      <div className="relative z-10 mx-auto max-w-3xl px-5 pb-8 pt-20 text-center sm:px-6 md:pb-6 md:pt-5">
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
          <Heart className="mb-1 h-9 w-9 text-gold md:h-10 md:w-10" strokeWidth={1.4} />
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
          className="font-serif-display text-gradient-gold mb-2 text-5xl tracking-[.06em] sm:text-6xl md:text-[4.15rem] md:leading-none"
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
        <div className="relative z-10 mx-auto grid max-w-[94rem] gap-5 px-5 pb-8 sm:px-6 md:grid-cols-[minmax(0,2.2fr)_minmax(19rem,.85fr)] md:items-start md:px-8">
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
            <div className="grid grid-cols-2 gap-3">
              {BENEFITS.map((b, i) => (
                <motion.div key={b.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex min-h-[10rem] flex-col items-center rounded-2xl border border-white/10 bg-[#071126]/44 p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-md">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10"><b.icon className="h-5 w-5 text-gold" /></div>
                  <p className="mb-1 text-xs font-medium uppercase leading-snug text-champagne">{b.title}</p>
                  <p className="text-[11px] leading-relaxed text-white/60">{b.body}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {!isFull && (
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative mx-auto mt-3 flex w-full max-w-3xl flex-col items-center rounded-[1.5rem] border border-white/12 bg-[#071126]/38 px-5 pb-4 pt-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-md md:col-start-1 md:row-start-2 md:-mt-1">
              <span className="absolute -top-5 flex h-10 w-10 items-center justify-center rounded-full border border-gold/35 bg-[#12162c] shadow-[0_0_18px_rgba(229,192,123,.22)]"><ShieldCheck className="h-5 w-5 text-gold" /></span>
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
      className={`relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.045),0_20px_55px_rgba(2,7,20,.18)] backdrop-blur-md sm:p-6 ${
        featured
          ? 'border-gold/45 bg-[#16132a]/55 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_0_34px_rgba(229,192,123,.13)]'
          : 'border-blue-200/20 bg-[#071126]/52'
      } ${className ?? ''}`}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.25em] text-gold/70">Founding 500 Member</p>
        {featured && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/35 bg-gold/[.08] px-3 py-1 text-[10px] uppercase tracking-widest text-gold">
            <Star className="h-3 w-3 fill-gold/30" /> Most Chosen
          </span>
        )}
      </div>
      <div className="mb-1 flex items-center justify-between gap-4">
        <h3 className="font-serif-display text-3xl text-champagne">{title}</h3>
        <span className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tier === 'premium' ? 'bg-violet-500/10 shadow-[0_0_28px_rgba(168,85,247,.35)]' : 'bg-blue-400/10 shadow-[0_0_25px_rgba(96,165,250,.28)]'}`} aria-hidden="true">
          <i className={`absolute inset-2 rotate-45 rounded-lg border ${tier === 'premium' ? 'border-violet-300/25 bg-violet-500/10' : 'border-blue-200/25 bg-blue-400/10'}`} />
          <Gem className={`relative h-8 w-8 ${tier === 'premium' ? 'text-violet-300' : 'text-blue-200'}`} strokeWidth={1.25} />
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
        {intro && <Tag className={`h-4 w-4 shrink-0 ${emphasis ? 'text-gold' : 'text-blue-200'}`} strokeWidth={1.4} />}
        {formatPrice(price, currency)}
      </p>
      <p className="mt-0.5 text-[10px] text-white/45">/ month</p>
      <p className="mt-2 text-[10px] leading-snug text-white/50 sm:text-[11px]">{label}</p>
    </div>
  )
}
