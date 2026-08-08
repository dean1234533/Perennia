import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldCheck, CheckCircle2, Loader2, AlertTriangle, Clock, ExternalLink } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import {
  startIdentityVerification,
  identityVerificationConfigured,
  VerificationNotConfiguredError,
} from '@/lib/identityVerification'

type LocalStage = 'idle' | 'launching' | 'pending-webhook' | 'not-configured' | 'error'

export function Verify() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')
  const continueDestination = next || '/birth-details'
  const { user } = useAuth()
  const { onboarding } = useApp()
  const [stage, setStage] = useState<LocalStage>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const remoteStatus = onboarding.verification.status

  // The webhook flips `verification.status` in Firestore asynchronously —
  // AppContext already listens for that in real time, so once it changes we
  // just react to it here instead of faking a local timer.
  useEffect(() => {
    if (remoteStatus === 'verified' || remoteStatus === 'failed') {
      setStage('idle')
    }
  }, [remoteStatus])

  const handleStart = async () => {
    setErrorMessage('')
    setStage('launching')
    try {
      await startIdentityVerification()
      setStage('pending-webhook')
    } catch (err) {
      if (err instanceof VerificationNotConfiguredError) {
        setStage('not-configured')
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        setStage('error')
      }
    }
  }

  const showNotConfigured = stage === 'not-configured' || !identityVerificationConfigured

  return (
    <OnboardingShell step={3} totalSteps={7}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-md rounded-[2rem] p-8 text-center md:p-10"
      >
        <AnimatePresence mode="wait">
          {remoteStatus === 'verified' && (
            <motion.div key="verified" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </motion.div>
              <h2 className="font-serif-display mb-2 text-2xl">You're Verified</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/55">
                Stripe Identity confirmed your face matches your government ID. Welcome to a
                community built on authenticity — let's build your cosmic profile next.
              </p>
              <Button size="lg" className="w-full" onClick={() => navigate(continueDestination)}>
                Continue
              </Button>
            </motion.div>
          )}

          {remoteStatus !== 'verified' && stage === 'pending-webhook' && (
            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
                <Clock className="h-8 w-8 text-gold" />
              </div>
              <h2 className="font-serif-display mb-2 text-2xl">Verification In Review</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/55">
                Stripe is reviewing your document and selfie. This page updates automatically the
                moment a result comes back — no need to refresh.
              </p>
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-gold" />
            </motion.div>
          )}

          {remoteStatus !== 'verified' && stage !== 'pending-webhook' && showNotConfigured && (
            <motion.div key="not-configured" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
              </div>
              <h2 className="font-serif-display mb-2 text-2xl">Verification Setup Required</h2>
              <p className="mb-4 text-sm leading-relaxed text-white/55">
                Perennia uses Stripe Identity for real document + liveness verification. This
                environment doesn't have Stripe keys configured yet, so verification can't run —
                and rather than fake a result, we're showing you this instead.
              </p>
              <div className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-xs text-white/50">
                <p className="mb-1 font-medium text-white/70">To enable this:</p>
                <p>1. Set <code className="text-champagne">STRIPE_SECRET_KEY</code> / <code className="text-champagne">STRIPE_WEBHOOK_SECRET</code> as Firebase function secrets</p>
                <p>2. Set <code className="text-champagne">VITE_STRIPE_PUBLISHABLE_KEY</code> in the frontend .env</p>
                <p className="mt-1 text-white/40">See functions/.env.example for full setup steps.</p>
              </div>
              <Button variant="glass" className="w-full" onClick={() => navigate(continueDestination)}>
                Skip for Now <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}

          {remoteStatus !== 'verified' && stage !== 'pending-webhook' && !showNotConfigured && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
                <ShieldCheck className="h-8 w-8 text-gold" />
              </div>
              <h1 className="font-serif-display mb-2 text-3xl">Identity Verification</h1>
              <p className="mb-8 text-sm leading-relaxed text-white/55">
                Every Perennia member is verified through Stripe Identity — a real document scan,
                live selfie, and liveness/anti-spoof check. It's how we keep this a space of real
                people, real intentions.
              </p>
              {remoteStatus === 'failed' && (
                <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
                  Your last verification attempt didn't pass. You can try again.
                </p>
              )}
              {errorMessage && (
                <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
                  {errorMessage}
                </p>
              )}
              <Button
                size="lg"
                className="w-full"
                onClick={handleStart}
                disabled={stage === 'launching' || !firebaseConfigured || !user}
              >
                {stage === 'launching' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Opening Stripe Identity…</>
                ) : (
                  'Start Verification'
                )}
              </Button>
              {(!firebaseConfigured || !user) && (
                <p className="mt-3 text-xs text-white/35">Sign in with a real account to verify your identity.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </OnboardingShell>
  )
}
