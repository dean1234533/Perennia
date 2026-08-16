import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck, Loader2, AlertTriangle, Lock, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import { subscribeFounding500Config, createFoundingCheckoutSession, FoundingCheckoutNotConfiguredError } from '@/lib/founding500'
import type { Founding500Config, MembershipTier } from '@/types/founding500'
import './Founding500.css'

const FLOW_PRIMARY_BUTTON = 'founding-500-outline-button min-h-12 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-4 focus-visible:ring-offset-midnight active:scale-[.98] disabled:text-white/40 disabled:opacity-100'
const FLOW_SECONDARY_BUTTON = 'min-h-11 border border-white/20 bg-[#071126]/45 text-white/75 backdrop-blur-md hover:border-gold/50 hover:bg-white/[.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-4 focus-visible:ring-offset-midnight active:scale-[.98]'

function formatPrice(amount: number, currency: string) {
  const symbol = currency.toUpperCase() === 'GBP' ? '£' : currency.toUpperCase() === 'USD' ? '$' : '€'
  return `${symbol}${amount.toFixed(2)}`
}

export function Founding500Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, onboarding } = useApp()
  const { authReady, user, logOut } = useAuth()
  const tier = (searchParams.get('tier') === 'premium' ? 'premium' : 'essential') as MembershipTier
  const next = searchParams.get('next')
  const checkoutPath = `/founding-500/checkout?tier=${tier}${next ? `&next=${encodeURIComponent(next)}` : ''}`

  const [config, setConfig] = useState<Founding500Config | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notConfigured, setNotConfigured] = useState(false)

  useEffect(() => {
    if (!firebaseConfigured) return
    return subscribeFounding500Config(setConfig)
  }, [])

  useEffect(() => {
    // Wait for Firebase Auth to actually finish restoring the session
    // before deciding — on a direct page load/refresh (not an in-app
    // navigation), `isAuthenticated` is briefly false while that's still
    // in flight, which used to bounce a genuinely signed-in member to
    // /signup for the account they already have.
    if (!firebaseConfigured || !authReady) return
    if (!isAuthenticated) {
      navigate(`/signup?next=${encodeURIComponent(checkoutPath)}`, { replace: true })
    }
  }, [authReady, isAuthenticated, checkoutPath, navigate])

  const isVerified = onboarding.verification.status === 'verified'
  const isFull = !config || !config.enabled || config.currentMemberCount >= config.memberLimit
  const pricing = config?.[tier]

  const handlePay = async () => {
    setError('')
    setSubmitting(true)
    try {
      const successUrl = `${window.location.origin}/founding-500/success${next ? `?next=${encodeURIComponent(next)}` : ''}`
      const { url } = await createFoundingCheckoutSession({
        tier,
        successUrl,
        cancelUrl: `${window.location.origin}${checkoutPath}`,
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

  if (firebaseConfigured && !authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }
  if (!isAuthenticated) return null

  const handleLogOut = async () => {
    await logOut()
    navigate('/login')
  }

  return (
    <div className="founding-500-page relative min-h-screen overflow-x-clip bg-midnight text-white">
      <div className="founding-500-background" aria-hidden="true" />
      <div className="founding-500-vignette" aria-hidden="true" />

      <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Go back" className={`fixed left-4 top-4 z-30 md:left-8 md:top-8 ${FLOW_SECONDARY_BUTTON}`}>
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {user?.email && (
        <button
          onClick={handleLogOut}
          className="fixed right-4 top-4 z-30 flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-[#071126]/45 px-3 py-1.5 text-[11px] text-white/65 backdrop-blur-md transition hover:border-gold/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 md:right-8 md:top-8"
        >
          <span className="max-w-[140px] truncate">{user.email}</span>
          <LogOut className="h-3 w-3 shrink-0" />
        </button>
      )}

      <div className="relative z-10 mx-auto max-w-xl px-5 pb-20 pt-28 sm:px-6 md:pt-24">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold/70">Founding 500</p>
          <h1 className="font-serif-display text-3xl text-champagne md:text-4xl">Confirm Your Membership</h1>
        </div>

        {!config || !pricing ? (
          <div className="flex flex-col items-center gap-3 py-14">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : isFull ? (
          <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <AlertTriangle className="h-8 w-8 text-gold" />
            <p className="font-serif-display text-xl text-champagne">The Founding 500 Is Now Full</p>
            <p className="max-w-sm text-sm text-white/55">
              All 500 founding places have been claimed. Thank you for your interest in Perennia.
            </p>
            <Button variant="outline" className={FLOW_PRIMARY_BUTTON} onClick={() => navigate('/discovery')}>Continue to Perennia</Button>
          </div>
        ) : (
          <>
            {/* Checkout summary */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="founding-500-glass founding-500-glass--featured mb-6 rounded-[1.75rem] p-6 sm:p-8">
              <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">Your Founding 500 Membership</p>
              <h2 className="font-serif-display mb-4 text-2xl text-champagne">{tier === 'premium' ? 'Premium' : 'Essential'}</h2>

              <div className="mb-5 rounded-2xl border border-gold/25 bg-gold/[.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
                <p className="font-serif-display text-2xl text-gradient-gold">
                  {formatPrice(pricing.introPrice, config.currency)}<span className="text-sm text-white/40">/month</span>
                </p>
                <p className="text-xs text-white/50">for your first {config.promoPeriodMonths} months</p>
              </div>

              <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
                <p>Then {formatPrice(pricing.year1Price, config.currency)}/month during your first year.</p>
                <p className="text-white/55">Future standard pricing: {formatPrice(pricing.futurePrice, config.currency)}/month.</p>
              </div>
            </motion.div>

            {/* Verification gate */}
            {!isVerified && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-[#071126]/42 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-md">
                <ShieldCheck className="h-6 w-6 shrink-0 text-gold" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-champagne">Identity verification required</p>
                  <p className="text-xs text-white/45">Founding members are verified before payment.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={FLOW_SECONDARY_BUTTON}
                  onClick={() => navigate(`/verify?next=${encodeURIComponent(checkoutPath)}`)}
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

            <Button size="lg" variant="outline" className={`w-full ${FLOW_PRIMARY_BUTTON}`} onClick={handlePay} disabled={!isVerified || submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Opening secure payment…</>
              ) : (
                <><Lock className="h-4 w-4" /> Confirm & Pay Securely</>
              )}
            </Button>
            <p className="mt-3 text-center text-[11px] text-white/45">
              You'll be taken to Stripe's secure checkout. No card details are ever seen by Perennia.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
