import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Sparkles, ShieldCheck, Compass, MessageCircleHeart, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AtmosphericBackground } from '@/components/shared/AtmosphericBackground'
import { MemberCounter } from '@/components/founding500/MemberCounter'
import { PricingTimeline } from '@/components/founding500/PricingTimeline'
import { useApp } from '@/context/AppContext'
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
  const { isAuthenticated } = useApp()
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

      <Button
        variant="glass"
        size="icon"
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className={`fixed left-4 top-4 z-30 md:left-8 md:top-8 ${FLOW_SECONDARY_BUTTON}`}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Hero */}
      <div className="relative z-10 mx-auto max-w-3xl px-5 pb-12 pt-24 text-center sm:px-6 md:pb-14 md:pt-20">
        {next && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-6 max-w-md rounded-xl border border-gold/20 bg-gold/5 px-4 py-2.5 text-xs text-champagne/80"
          >
            Perennia is a Founding 500 membership — choose a plan to continue.
          </motion.p>
        )}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-xs uppercase tracking-[0.4em] text-gold/70"
        >
          Be here at the beginning
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif-display text-gradient-gold mb-5 text-5xl tracking-[.06em] sm:text-6xl md:text-7xl"
        >
          FOUNDING 500
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-9 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base"
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

      {/* Tier selection */}
      {config && (
        <div className="relative z-10 mx-auto max-w-6xl px-5 pb-16 sm:px-6 md:pb-20">
          <div className="mb-7 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/55" />
            <p className="text-[11px] uppercase tracking-[.32em] text-champagne sm:text-xs">Choose Your Membership</p>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/55" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
            <TierCard
              tier="essential"
              title="Essential"
              description="The complete Perennia experience — compatibility-first matching, real conversations, no compromises."
              pricing={config.essential}
              currency={config.currency}
              promoPeriodMonths={config.promoPeriodMonths}
              isFull={isFull}
              className="order-2 md:order-1"
              onSelect={() => handleSelectTier('essential')}
            />
            <TierCard
              tier="premium"
              title="Premium"
              description="Everything in Essential, plus priority visibility, deeper compatibility insight, and founding-tier recognition."
              pricing={config.premium}
              currency={config.currency}
              promoPeriodMonths={config.promoPeriodMonths}
              isFull={isFull}
              featured
              className="order-1 md:order-2"
              onSelect={() => handleSelectTier('premium')}
            />
          </div>

          {isFull && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto mt-8 max-w-md text-center text-sm text-white/50"
            >
              {!config.enabled
                ? 'The Founding 500 offer isn\'t active right now.'
                : 'The Founding 500 is now full — thank you to everyone who joined us at the beginning.'}
            </motion.p>
          )}
        </div>
      )}

      {/* Pricing timelines */}
      {config && (
        <div className="relative z-10 mx-auto max-w-5xl px-5 pb-16 sm:px-6 md:pb-20">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold/70">Your Pricing Journey</p>
            <h2 className="font-serif-display text-3xl text-champagne md:text-4xl">Exactly What You'll Pay, and When</h2>
          </div>
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="mb-6 text-center text-sm uppercase tracking-widest text-white/50">Essential</p>
              <PricingTimeline pricing={config.essential} currency={config.currency} promoPeriodMonths={config.promoPeriodMonths} />
            </div>
            <div>
              <p className="mb-6 text-center text-sm uppercase tracking-widest text-white/50">Premium</p>
              <PricingTimeline pricing={config.premium} currency={config.currency} promoPeriodMonths={config.promoPeriodMonths} />
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/10 bg-[#071126]/42 px-6 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.035),0_18px_50px_rgba(2,7,20,.14)] backdrop-blur-md sm:px-8">
            <p className="mb-2 text-xs uppercase tracking-widest text-gold/60">Future Standard Pricing</p>
            <p className="text-sm leading-relaxed text-white/55">
              From year two onward, Perennia's standard pricing is {formatPrice(config.essential.futurePrice, config.currency)}/month
              for Essential and {formatPrice(config.premium.futurePrice, config.currency)}/month for Premium. Founding 500
              members keep their preferential introductory pricing throughout their first year simply for joining us now.
            </p>
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-16 sm:px-6 md:pb-20">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold/70">Why Founding Members</p>
          <h2 className="font-serif-display text-3xl text-champagne md:text-4xl">More Than Early Access</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#071126]/42 p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.035),0_16px_45px_rgba(2,7,20,.14)] backdrop-blur-md sm:p-5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                <b.icon className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium leading-snug text-champagne sm:text-sm">{b.title}</p>
                <p className="text-xs leading-relaxed text-white/50">{b.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      {config && !isFull && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 mx-auto mb-24 flex max-w-2xl flex-col items-center px-5 py-7 text-center sm:px-8"
        >
          <ShieldCheck className="mb-4 h-7 w-7 text-gold" />
          <h2 className="font-serif-display mb-3 text-2xl md:text-3xl">Your Place Is Waiting</h2>
          <p className="mb-8 max-w-sm text-sm text-white/55">
            {config.memberLimit - config.currentMemberCount} of {config.memberLimit} founding places remain.
          </p>
          <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="outline" className={`w-full ${FLOW_SECONDARY_BUTTON}`} onClick={() => handleSelectTier('essential')}>
              <Check className="h-4 w-4" /> Join as Essential
            </Button>
            <Button size="lg" variant="outline" className={`w-full ${FLOW_PRIMARY_BUTTON}`} onClick={() => handleSelectTier('premium')}>
              <Crown className="h-4 w-4" /> Join as Premium
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function TierCard({
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
      className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.045),0_24px_65px_rgba(2,7,20,.2)] backdrop-blur-md sm:p-8 ${
        featured
          ? 'border-gold/45 bg-[#16132a]/55 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_0_34px_rgba(229,192,123,.13)]'
          : 'border-blue-200/20 bg-[#071126]/52'
      } ${className ?? ''}`}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.25em] text-gold/70">Founding 500 Member</p>
        {featured && (
          <span className="shrink-0 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-widest text-gold">
            Most Chosen
          </span>
        )}
      </div>
      <h3 className="font-serif-display mb-3 text-3xl text-champagne">{title}</h3>
      <p className="mb-6 text-sm leading-relaxed text-white/70">{description}</p>

      <div className="mb-7 grid grid-cols-3 divide-x divide-white/10">
        <PricePoint price={pricing.introPrice} currency={currency} label={`First ${promoPeriodMonths} months`} emphasis={featured} />
        <PricePoint price={pricing.year1Price} currency={currency} label="Rest of your first year" />
        <PricePoint price={pricing.futurePrice} currency={currency} label="From year 2 onward" />
      </div>

      <Button size="lg" className={`mt-auto w-full ${featured ? FLOW_PRIMARY_BUTTON : FLOW_SECONDARY_BUTTON}`} variant="outline" onClick={onSelect} disabled={isFull}>
        {isFull ? 'The Founding 500 Is Full' : `Choose ${title}`}
      </Button>
    </motion.div>
  )
}

function PricePoint({ price, currency, label, emphasis }: { price: number; currency: string; label: string; emphasis?: boolean }) {
  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0 sm:px-4">
      <p className={`font-serif-display text-xl sm:text-2xl ${emphasis ? 'text-gradient-gold' : 'text-champagne'}`}>
        {formatPrice(price, currency)}
      </p>
      <p className="mt-0.5 text-[10px] text-white/45">/ month</p>
      <p className="mt-2 text-[10px] leading-snug text-white/50 sm:text-[11px]">{label}</p>
    </div>
  )
}
