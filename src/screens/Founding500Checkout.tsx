import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck, Loader2, AlertTriangle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AtmosphericBackground } from '@/components/shared/AtmosphericBackground'
import { useApp } from '@/context/AppContext'
import { firebaseConfigured } from '@/lib/firebase'
import { subscribeFounding500Config, createFoundingCheckoutSession, FoundingCheckoutNotConfiguredError } from '@/lib/founding500'
import type { Founding500Config, MembershipTier } from '@/types/founding500'

function formatPrice(amount: number, currency: string) {
  const symbol = currency.toUpperCase() === 'GBP' ? '£' : currency.toUpperCase() === 'USD' ? '$' : '€'
  return `${symbol}${amount.toFixed(2)}`
}

export function Founding500Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, onboarding } = useApp()
  const tier = (searchParams.get('tier') === 'premium' ? 'premium' : 'essential') as MembershipTier

  const [config, setConfig] = useState<Founding500Config | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notConfigured, setNotConfigured] = useState(false)

  useEffect(() => {
    if (!firebaseConfigured) return
    return subscribeFounding500Config(setConfig)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/signup?next=${encodeURIComponent(`/founding-500/checkout?tier=${tier}`)}`, { replace: true })
    }
  }, [isAuthenticated, tier, navigate])

  const isVerified = onboarding.verification.status === 'verified'
  const isFull = !config || !config.enabled || config.currentMemberCount >= config.memberLimit
  const pricing = config?.[tier]

  const handlePay = async () => {
    setError('')
    setSubmitting(true)
    try {
      const { url } = await createFoundingCheckoutSession({
        tier,
        successUrl: `${window.location.origin}/founding-500/success`,
        cancelUrl: `${window.location.origin}/founding-500/checkout?tier=${tier}`,
      })
      window.location.href = url
    } catch (err) {
      if (err instanceof FoundingCheckoutNotConfiguredError) {
        setNotConfigured(true)
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      }
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative min-h-screen bg-midnight text-white">
      <AtmosphericBackground />

      <Button variant="glass" size="icon" onClick={() => navigate(-1)} className="fixed left-4 top-4 z-30 md:left-8 md:top-8">
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="relative z-10 mx-auto max-w-lg px-6 pb-20 pt-24 md:pt-32">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold/70">Founding 500</p>
          <h1 className="font-serif-display text-3xl text-champagne md:text-4xl">Confirm Your Membership</h1>
        </div>

        {!config || !pricing ? (
          <div className="flex flex-col items-center gap-3 py-14">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : isFull ? (
          <div className="glass-strong flex flex-col items-center gap-4 rounded-[2rem] px-8 py-14 text-center">
            <AlertTriangle className="h-8 w-8 text-gold" />
            <p className="font-serif-display text-xl text-champagne">The Founding 500 Is Now Full</p>
            <p className="max-w-sm text-sm text-white/55">
              All 500 founding places have been claimed. Thank you for your interest in Perennia.
            </p>
            <Button variant="glass" onClick={() => navigate('/discovery')}>Continue to Perennia</Button>
          </div>
        ) : (
          <>
            {/* Checkout summary */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-strong mb-6 rounded-[1.75rem] p-7">
              <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">Your Founding 500 Membership</p>
              <h2 className="font-serif-display mb-4 text-2xl text-champagne">{tier === 'premium' ? 'Premium' : 'Essential'}</h2>

              <div className="mb-4 rounded-xl border border-gold/20 bg-gold/5 p-4">
                <p className="font-serif-display text-2xl text-gradient-gold">
                  {formatPrice(pricing.introPrice, config.currency)}<span className="text-sm text-white/40">/month</span>
                </p>
                <p className="text-xs text-white/50">for your first {config.promoPeriodMonths} months</p>
              </div>

              <div className="flex flex-col gap-2 text-sm text-white/60">
                <p>Then {formatPrice(pricing.year1Price, config.currency)}/month during your first year.</p>
                <p className="text-white/40">Future standard pricing: {formatPrice(pricing.futurePrice, config.currency)}/month.</p>
              </div>
            </motion.div>

            {/* Verification gate */}
            {!isVerified && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass mb-6 flex items-center gap-4 rounded-2xl p-5">
                <ShieldCheck className="h-6 w-6 shrink-0 text-gold" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-champagne">Identity verification required</p>
                  <p className="text-xs text-white/45">Founding members are verified before payment.</p>
                </div>
                <Button
                  size="sm"
                  variant="glass"
                  onClick={() => navigate(`/verify?next=${encodeURIComponent(`/founding-500/checkout?tier=${tier}`)}`)}
                >
                  Verify
                </Button>
              </motion.div>
            )}

            {notConfigured && (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-xs text-amber-200">
                <p className="mb-1 font-medium">Payment setup required</p>
                <p className="text-amber-200/70">
                  Founding 500 payments use Stripe and aren't configured in this environment yet. An administrator needs
                  to set STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET (see functions/.env.example) before real checkout can run.
                </p>
              </div>
            )}

            {error && (
              <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">{error}</p>
            )}

            <Button size="lg" className="w-full" onClick={handlePay} disabled={!isVerified || submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Opening secure payment…</>
              ) : (
                <><Lock className="h-4 w-4" /> Confirm & Pay Securely</>
              )}
            </Button>
            <p className="mt-3 text-center text-[11px] text-white/30">
              You'll be taken to Stripe's secure checkout. No card details are ever seen by Perennia.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
