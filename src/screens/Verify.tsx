import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ShieldCheck, CheckCircle2, Loader2, AlertTriangle, UploadCloud,
  Camera, ScanFace, CalendarDays, UserRound, ArrowRight,
} from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import {
  confirmIdentityDetails,
  refreshIdentityVerificationStatus,
  startIdentityVerification,
  identityVerificationConfigured,
  VerificationNotConfiguredError,
} from '@/lib/identityVerification'
import { enableDevelopmentVerificationBypass } from '@/lib/developmentVerification'

type LocalStage = 'idle' | 'launching' | 'pending' | 'confirming' | 'error'

function formatBirthDate(value: string) {
  if (!value) return 'Not returned'
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

function VerificationProgress({ active }: { active: number }) {
  return (
    <div className="verification-progress mx-auto mb-6 w-full max-w-sm">
      <div className="verification-progress-track flex items-center">
        {['ID', 'Validate', 'Face', 'Confirm', 'Verified'].map((label, index) => (
          <div key={label} className="contents">
            {index > 0 && <div className={`verification-progress-line h-px flex-1 ${index <= active ? 'is-complete' : ''}`} />}
            <div
              aria-label={label}
              className={`verification-progress-node flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs transition-all ${
                index < active ? 'is-complete' :
                index === active ? 'is-active' :
                'is-upcoming'
              }`}
            >
              {index < active ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-white/95">Step {active + 1} of 5</p>
    </div>
  )
}

export function Verify() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const continueDestination = searchParams.get('next') || '/birth-details'
  const previewPending = import.meta.env.DEV && searchParams.get('preview') === 'pending'
  const { user } = useAuth()
  const { onboarding, updateOnboarding } = useApp()
  const [stage, setStage] = useState<LocalStage>(previewPending ? 'pending' : 'idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [pendingLong, setPendingLong] = useState(false)
  const [refreshError, setRefreshError] = useState('')

  const verification = onboarding.verification
  const configured = identityVerificationConfigured && firebaseConfigured
  // Stripe confirming the document + face match is what actually matters —
  // legalName/birthDate are a bonus extraction that not every document type
  // or region returns. Requiring them to proceed used to strand verified
  // members on this screen forever with no way out.
  const isVerified = verification.status === 'verified'
  const detailsConfirmed = Boolean(verification.detailsConfirmedAt)

  const refreshStatus = async () => {
    if (refreshing) return
    setRefreshing(true)
    setRefreshError('')
    try {
      const status = await refreshIdentityVerificationStatus()
      if (status === 'failed') {
        setErrorMessage('This verification attempt needs new information. Please upload or scan your ID again.')
        setStage('idle')
      } else if (status === 'verified') {
        setPendingLong(false)
      }
    } catch {
      setRefreshError('We could not refresh the status automatically. You can check again or start a new verification attempt.')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (verification.status === 'failed') setStage('idle')
    if (verification.status === 'pending') setStage('pending')
    // Stop the pending-poll timers once Stripe has actually confirmed —
    // the confirm screen renders from `isVerified` regardless of `stage`,
    // this just avoids pointless background refresh calls afterward.
    if (verification.status === 'verified') setStage('idle')
  }, [verification.status])

  useEffect(() => {
    if (stage !== 'pending') {
      setPendingLong(false)
      return
    }

    const firstRefresh = window.setTimeout(() => void refreshStatus(), 1200)
    const secondRefresh = window.setTimeout(() => void refreshStatus(), 6000)
    const longTimer = window.setTimeout(() => setPendingLong(true), 9000)
    return () => {
      window.clearTimeout(firstRefresh)
      window.clearTimeout(secondRefresh)
      window.clearTimeout(longTimer)
    }
    // Refreshing is deliberately excluded: it is transient request state,
    // not a reason to recreate every pending timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  // Wait for the Firestore listener to observe the server-side confirmation
  // before navigating. Otherwise the route guard could briefly see stale
  // state and bounce the member back to this screen.
  useEffect(() => {
    if (detailsConfirmed && stage === 'confirming') navigate(continueDestination)
  }, [detailsConfirmed, stage, navigate, continueDestination])

  const launch = async () => {
    setErrorMessage('')
    setRefreshError('')
    setPendingLong(false)
    setStage('launching')
    try {
      await startIdentityVerification()
      setStage('pending')
    } catch (err) {
      if (err instanceof VerificationNotConfiguredError) {
        setErrorMessage('Identity verification has not been configured for this environment yet.')
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Verification could not be opened. Please try again.')
      }
      setStage('error')
    }
  }

  const confirmAndContinue = async () => {
    setStage('confirming')
    setErrorMessage('')
    try {
      await confirmIdentityDetails()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not save your confirmation.')
      setStage('error')
    }
  }

  const skipForTesting = async () => {
    // Dev-only convenience for a local build with no completed Stripe
    // session. Deployed Stripe test mode is handled independently by the
    // backend using Stripe's trusted `livemode` flag.
    if (import.meta.env.DEV) {
      enableDevelopmentVerificationBypass()
      // Finish persisting the fallback before Birth Details reads it.
      if (!onboarding.birthDate) await updateOnboarding({ birthDate: '1995-06-15' })
    }
    navigate(continueDestination)
  }

  const activeStep = detailsConfirmed ? 4 : isVerified ? 3 : stage === 'pending' ? 2 : stage === 'launching' ? 1 : 0

  return (
    <OnboardingShell className="verification-onboarding-shell">
      <div className="verification-heading mb-5 text-center">
        <h1 className="font-serif-display text-4xl sm:text-5xl">Verify Your Identity</h1>
        <p className="mt-2 text-sm text-white/55">Keep our community safe with verified profiles</p>
      </div>
      <VerificationProgress active={activeStep} />

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className={`verification-card w-full max-w-2xl text-center ${!isVerified && !detailsConfirmed && stage !== 'pending' && configured ? 'is-intro' : isVerified && !detailsConfirmed ? 'verification-confirm-card rounded-[2rem] border border-transparent p-7 sm:p-10' : 'glass-strong rounded-[2rem] border-white/20 p-7 shadow-[0_0_50px_rgba(54,93,211,.16)] sm:p-10'}`}
      >
        <AnimatePresence mode="wait">
          {isVerified && !detailsConfirmed ? (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-300/40 bg-blue-500/10 shadow-[0_0_22px_rgba(79,118,255,.25)]">
                <CheckCircle2 className="h-8 w-8 text-blue-200" />
              </div>
              <h2 className="font-serif-display text-3xl">Confirm Your Details</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">
                Your document and live face match passed
                {onboarding.legalName || onboarding.birthDate
                  ? '. Please confirm the verified details extracted from your ID.'
                  : ' — your identity has been verified by Stripe.'}
              </p>
              {(onboarding.legalName || onboarding.birthDate) && (
                <div className="mx-auto my-7 max-w-md space-y-3 text-left">
                  {onboarding.legalName && (
                    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <UserRound className="h-5 w-5 text-champagne" />
                      <div><p className="text-[10px] uppercase tracking-[.18em] text-white/35">Legal name</p><p className="mt-1 text-white/90">{onboarding.legalName}</p></div>
                    </div>
                  )}
                  {onboarding.birthDate && (
                    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <CalendarDays className="h-5 w-5 text-champagne" />
                      <div><p className="text-[10px] uppercase tracking-[.18em] text-white/35">Date of birth</p><p className="mt-1 text-white/90">{formatBirthDate(onboarding.birthDate)}</p></div>
                    </div>
                  )}
                </div>
              )}
              {errorMessage && <p className="mb-4 text-sm text-rose-300">{errorMessage}</p>}
              <Button size="lg" className="verification-confirm-button w-full max-w-md rounded-full" onClick={confirmAndContinue} disabled={stage === 'confirming'}>
                {stage === 'confirming' ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Confirm &amp; Continue <ArrowRight className="h-4 w-4" /></>}
              </Button>
              <p className="mt-4 text-xs text-white/35">If these details are incorrect, do not continue. Contact Perennia Support.</p>
            </motion.div>
          ) : detailsConfirmed ? (
            <motion.div key="verified" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}>
              <CheckCircle2 className="mx-auto mb-5 h-14 w-14 text-emerald-400" />
              <h2 className="font-serif-display text-3xl">Identity Verified</h2>
              <p className="mx-auto mb-7 mt-2 max-w-md text-sm text-white/55">Your identity details and face match have been confirmed securely.</p>
              <Button size="lg" onClick={() => navigate(continueDestination)}>Continue <ArrowRight className="h-4 w-4" /></Button>
            </motion.div>
          ) : stage === 'pending' ? (
            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="relative mx-auto mb-6 flex h-44 w-44 items-center justify-center rounded-full border border-blue-300/70 shadow-[0_0_35px_rgba(68,103,255,.35)]">
                {pendingLong ? <AlertTriangle className="h-16 w-16 text-amber-300/80" strokeWidth={1} /> : <ScanFace className="h-20 w-20 text-blue-100/75" strokeWidth={1} />}
                {!pendingLong && <Loader2 className="absolute h-48 w-48 animate-spin text-blue-400/60" strokeWidth={.5} />}
              </div>
              <h2 className="font-serif-display text-3xl">{pendingLong ? 'Still Checking Your Identity' : 'Checking Your Identity'}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">
                {pendingLong
                  ? 'This is taking longer than expected. Check the status again or begin a fresh verification attempt.'
                  : 'Stripe is validating your document and matching your live face to its photograph. This screen updates automatically.'}
              </p>
              {(pendingLong || refreshError) && (
                <div className="mx-auto mt-6 max-w-md space-y-3">
                  {refreshError && <p className="rounded-xl border border-amber-400/20 bg-amber-400/[.06] px-4 py-3 text-xs leading-relaxed text-amber-100/70">{refreshError}</p>}
                  <Button type="button" className="w-full" onClick={refreshStatus} disabled={refreshing}>
                    {refreshing ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking status…</> : 'Check Verification Status'}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={launch} disabled={refreshing}>
                    Start a New Verification
                  </Button>
                </div>
              )}
              {import.meta.env.DEV && (
                <div className="mx-auto mt-7 max-w-md border-t border-white/10 pt-6">
                  <Button type="button" variant="outline" className="w-full" onClick={skipForTesting}>
                    Skip identity check for testing <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="mt-3 text-xs text-white/35">Development mode only — identity verification remains required in production.</p>
                </div>
              )}
            </motion.div>
          ) : !configured ? (
            <motion.div key="configuration" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AlertTriangle className="mx-auto mb-5 h-12 w-12 text-amber-400" />
              <h2 className="font-serif-display text-3xl">Verification Setup Required</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">Stripe Identity keys must be configured before anyone can continue. Verification cannot be skipped or simulated.</p>
              <p className="mx-auto mt-5 max-w-lg rounded-xl border border-white/10 bg-white/[.03] p-4 text-xs text-white/45">Configure <code className="text-champagne">STRIPE_SECRET_KEY</code>, <code className="text-champagne">STRIPE_WEBHOOK_SECRET</code>, and <code className="text-champagne">VITE_STRIPE_PUBLISHABLE_KEY</code>.</p>
              {import.meta.env.DEV && (
                <Button type="button" variant="outline" className="mt-6 w-full max-w-md" onClick={skipForTesting}>
                  Skip identity check for testing <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {verification.status === 'failed' && <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">Your previous attempt could not be verified. Please try again with a clear, valid document.</p>}
              {errorMessage && <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">{errorMessage}</p>}
              <div className="verification-actions space-y-4">
                <button type="button" onClick={launch} disabled={stage === 'launching' || !user} className="verification-action-card flex w-full items-center gap-6 px-8 text-left disabled:opacity-50">
                  <UploadCloud className="h-9 w-9 shrink-0 text-white" />
                  <span><span className="block text-xl font-medium text-white">Upload ID Photo</span><span className="mt-1 block text-sm text-white/85">Passport, driving licence or provisional driving licence</span></span>
                </button>
                <button type="button" onClick={launch} disabled={stage === 'launching' || !user} className="verification-action-card flex w-full items-center gap-6 px-8 text-left disabled:opacity-50">
                  {stage === 'launching' ? <Loader2 className="h-9 w-9 shrink-0 animate-spin" /> : <Camera className="h-9 w-9 shrink-0 text-white" />}
                  <span><span className="block text-xl font-medium text-white">Scan with Camera</span><span className="mt-1 block text-sm text-white/85">Use your device camera</span></span>
                </button>
              </div>
              <p className="verification-security-line mt-7 flex items-center justify-center gap-2 text-sm text-white/90"><ShieldCheck className="h-4 w-4" /> Secure document, liveness and face-match verification by Stripe</p>
              {import.meta.env.DEV && (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <Button type="button" variant="outline" className="w-full" onClick={skipForTesting}>
                    Skip identity check for testing <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="mt-3 text-xs text-white/35">Development mode only — this option is removed from production.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </OnboardingShell>
  )
}
