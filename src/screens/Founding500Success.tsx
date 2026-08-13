import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, BadgeCheck, ShieldCheck, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AtmosphericBackground } from '@/components/shared/AtmosphericBackground'
import { PricingTimeline } from '@/components/founding500/PricingTimeline'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { firebaseConfigured } from '@/lib/firebase'
import { subscribeFoundingMembership } from '@/lib/founding500'
import type { FoundingMemberRecord } from '@/types/founding500'

const FLOW_PRIMARY_BUTTON = 'min-h-12 border border-gold/75 bg-[#0a1023]/45 text-champagne shadow-[0_0_18px_rgba(229,192,123,.22),inset_0_0_18px_rgba(229,192,123,.05)] backdrop-blur-md hover:border-gold hover:bg-gold/10 hover:text-white hover:shadow-[0_0_28px_rgba(229,192,123,.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-4 focus-visible:ring-offset-midnight active:scale-[.98] disabled:border-white/20 disabled:text-white/45 disabled:opacity-100'

export function Founding500Success() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const destination = searchParams.get('next') || '/discovery'
  const { user } = useAuth()
  const { onboarding } = useApp()
  const [record, setRecord] = useState<FoundingMemberRecord | null>(null)
  const [waitedTooLong, setWaitedTooLong] = useState(false)

  useEffect(() => {
    if (!firebaseConfigured || !user) return
    return subscribeFoundingMembership(user.uid, setRecord)
  }, [user])

  useEffect(() => {
    if (record) return
    const t = setTimeout(() => setWaitedTooLong(true), 15000)
    return () => clearTimeout(t)
  }, [record])

  return (
    <div className="relative min-h-screen overflow-x-clip bg-midnight text-white">
      <AtmosphericBackground />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-16 text-center sm:px-6">
        {!record ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="font-serif-display text-2xl text-champagne">Confirming Your Membership</p>
            <p className="max-w-sm text-sm text-white/50">
              Stripe is finalizing your payment — this page updates automatically the moment it's confirmed.
            </p>
            {waitedTooLong && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-white/35">
                <Clock className="h-3.5 w-3.5" /> This is taking longer than usual — if it doesn't confirm shortly,
                check your email for a receipt or contact support.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full py-6 sm:py-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/35 bg-gold/10 shadow-[0_0_34px_rgba(229,192,123,.2)] backdrop-blur-md"
            >
              <BadgeCheck className="h-8 w-8 text-gold" />
            </motion.div>

            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-gold/70">Welcome to the</p>
            <h1 className="font-serif-display text-gradient-gold mb-2 text-4xl md:text-5xl">FOUNDING 500</h1>
            <p className="mb-10 text-sm text-white/50">You were here from the beginning.</p>

            <div className="mb-8 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" />
              <p className="font-serif-display text-3xl text-champagne">Founding Member #{record.memberNumber}</p>
              <Sparkles className="h-4 w-4 text-gold" />
            </div>

            <div className="mx-auto mb-10 grid w-full max-w-xl grid-cols-2 gap-3 text-left sm:gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#071126]/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-md sm:p-5">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Membership Tier</p>
                <p className="font-serif-display text-lg text-champagne">{record.tier === 'premium' ? 'Premium' : 'Essential'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#071126]/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-md sm:p-5">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Current Price</p>
                <p className="font-serif-display text-lg text-champagne">
                  {record.pricing.currency.toUpperCase() === 'GBP' ? '£' : '$'}{record.pricing.introPrice.toFixed(2)}/mo
                </p>
              </div>
              <div className="col-span-2 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#071126]/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-md">
                <ShieldCheck className={`h-4 w-4 ${onboarding.verification.status === 'verified' ? 'text-emerald-400' : 'text-white/30'}`} />
                <p className="text-xs text-white/60">
                  {onboarding.verification.status === 'verified' ? 'Identity verified' : 'Verification pending'}
                </p>
              </div>
            </div>

            <div className="mx-auto mb-10 w-full max-w-md">
              <p className="mb-5 text-xs uppercase tracking-widest text-white/40">Your Pricing Timeline</p>
              <PricingTimeline
                pricing={record.pricing}
                currency={record.pricing.currency}
                promoPeriodMonths={record.pricing.promoPeriodMonths}
              />
            </div>

            <Button size="lg" variant="outline" className={`mx-auto w-full max-w-md ${FLOW_PRIMARY_BUTTON}`} onClick={() => navigate(destination)}>
              Enter Perennia
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
