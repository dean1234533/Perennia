import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldCheck, ScanFace, IdCard, CheckCircle2, Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'

type Stage = 'intro' | 'id' | 'scanning-id' | 'selfie' | 'scanning-selfie' | 'processing' | 'success'

export function Verify() {
  const navigate = useNavigate()
  const { updateOnboarding } = useApp()
  const [stage, setStage] = useState<Stage>('intro')

  const goScanId = () => {
    setStage('scanning-id')
    setTimeout(() => setStage('selfie'), 1800)
  }
  const goScanSelfie = () => {
    setStage('scanning-selfie')
    setTimeout(() => finish(), 1800)
  }
  const finish = () => {
    setStage('processing')
    setTimeout(() => {
      updateOnboarding({ verified: true })
      setStage('success')
    }, 2200)
  }

  return (
    <OnboardingShell step={2} totalSteps={6}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-md rounded-[2rem] p-8 text-center md:p-10"
      >
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
                <ShieldCheck className="h-8 w-8 text-gold" />
              </div>
              <h1 className="font-serif-display mb-2 text-3xl">Identity Verification</h1>
              <p className="mb-8 text-sm leading-relaxed text-white/55">
                Every Perennia member is verified — it's how we keep this a space of real people,
                real intentions. This takes about a minute.
              </p>
              <Button size="lg" className="w-full" onClick={() => setStage('id')}>
                Start Verification
              </Button>
            </motion.div>
          )}

          {stage === 'id' && (
            <motion.div key="id" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-nebula-purple/20">
                <IdCard className="h-8 w-8 text-champagne" />
              </div>
              <h2 className="font-serif-display mb-2 text-2xl">Scan Your ID</h2>
              <p className="mb-8 text-sm text-white/55">
                Position your government-issued ID within the frame.
              </p>
              <div className="mx-auto mb-8 flex h-40 w-64 items-center justify-center rounded-2xl border-2 border-dashed border-gold/30 bg-white/[0.02]">
                <IdCard className="h-10 w-10 text-white/20" />
              </div>
              <Button size="lg" className="w-full" onClick={goScanId}>
                Capture ID
              </Button>
            </motion.div>
          )}

          {stage === 'scanning-id' && (
            <motion.div key="scanning-id" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="font-serif-display mb-8 text-2xl">Scanning ID…</h2>
              <div className="relative mx-auto mb-8 h-40 w-64 overflow-hidden rounded-2xl border-2 border-gold/40 bg-white/[0.02]">
                <IdCard className="absolute inset-0 m-auto h-10 w-10 text-white/20" />
                <motion.div
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"
                  animate={{ top: ['0%', '95%', '0%'] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <p className="text-xs uppercase tracking-widest text-white/40">Reading document…</p>
            </motion.div>
          )}

          {stage === 'selfie' && (
            <motion.div key="selfie" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-nebula-purple/20">
                <ScanFace className="h-8 w-8 text-champagne" />
              </div>
              <h2 className="font-serif-display mb-2 text-2xl">Liveness Check</h2>
              <p className="mb-8 text-sm text-white/55">Center your face in the frame and hold still.</p>
              <div className="mx-auto mb-8 flex h-48 w-48 items-center justify-center rounded-full border-2 border-dashed border-gold/30 bg-white/[0.02]">
                <ScanFace className="h-12 w-12 text-white/20" />
              </div>
              <Button size="lg" className="w-full" onClick={goScanSelfie}>
                Capture Selfie
              </Button>
            </motion.div>
          )}

          {stage === 'scanning-selfie' && (
            <motion.div key="scanning-selfie" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="font-serif-display mb-8 text-2xl">Analyzing…</h2>
              <div className="relative mx-auto mb-8 flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-2 border-gold/40 bg-white/[0.02]">
                <ScanFace className="h-12 w-12 text-white/20" />
                <motion.div
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"
                  animate={{ top: ['0%', '95%', '0%'] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <p className="text-xs uppercase tracking-widest text-white/40">Matching biometrics…</p>
            </motion.div>
          )}

          {stage === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8">
              <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-gold" />
              <h2 className="font-serif-display mb-2 text-2xl">Verifying Your Identity</h2>
              <p className="text-sm text-white/55">This will only take a moment…</p>
            </motion.div>
          )}

          {stage === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </motion.div>
              <h2 className="font-serif-display mb-2 text-2xl">You're Verified</h2>
              <p className="mb-8 text-sm text-white/55">
                Welcome to a community built on authenticity. Let's build your cosmic profile next.
              </p>
              <Button size="lg" className="w-full" onClick={() => navigate('/birth-details')}>
                Continue
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </OnboardingShell>
  )
}
