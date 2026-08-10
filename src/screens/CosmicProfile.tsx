import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sun, Moon, ArrowUpCircle, Sparkles, ArrowRight, ArrowLeft, Compass } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ZodiacWheel } from '@/components/shared/ZodiacWheel'
import { useApp } from '@/context/AppContext'
import { MIN_ONBOARDING_INTERESTS } from '@/data/interests'
import { hasDevelopmentVerificationBypass } from '@/lib/developmentVerification'

const traits = ['Intuitive', 'Loyal', 'Passionate', 'Idealistic', 'Warm', 'Determined']

function CosmicProfileContent({ isOnboarding }: { isOnboarding: boolean }) {
  const navigate = useNavigate()
  const { onboarding, profileExtras, completeOnboarding } = useApp()
  const sunSign = onboarding.sunSign || '—'
  const moonSign = onboarding.moonSign || '—'
  const risingSign = onboarding.risingSign || '—'
  const chineseLabel = onboarding.chineseAnimal
    ? `${onboarding.chineseElement} ${onboarding.chineseAnimal}`.trim()
    : '—'

  const finish = async () => {
    // The final screen is addressable by URL, so it also validates the
    // required onboarding milestones instead of trusting page order alone.
    if (!hasDevelopmentVerificationBypass() && (onboarding.verification.status !== 'verified' || !onboarding.verification.detailsConfirmedAt)) {
      navigate('/verify')
      return
    }
    if (!onboarding.birthCity || !onboarding.country || !onboarding.city) {
      navigate('/birth-details')
      return
    }
    if (!onboarding.gender) {
      navigate('/preferences')
      return
    }
    if (!onboarding.relationshipGoal) {
      navigate('/relationship-goals')
      return
    }
    if (profileExtras.interests.length < MIN_ONBOARDING_INTERESTS) {
      navigate('/interests')
      return
    }
    if (!onboarding.aboutYouCompletedAt) {
      navigate('/about-you')
      return
    }
    if (!onboarding.profilePhotoUrl) {
      navigate('/profile-photo')
      return
    }
    await completeOnboarding()
    // Perennia is Founding-500-gated end to end — finishing onboarding
    // doesn't grant app access by itself, it hands off to the real paywall.
    navigate('/founding-500?next=' + encodeURIComponent('/discovery'))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl"
    >
      <div className="mb-10 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">Your Astrological Foundation</p>
        <h1 className="font-serif-display mb-3 text-4xl md:text-5xl">Your Cosmic Profile</h1>
        <p className="mx-auto max-w-md text-white/55">
          {isOnboarding
            ? 'Drawn from your birth details — this shapes how we calculate compatibility with others.'
            : 'The astrological foundation behind every match we make for you.'}
        </p>
      </div>

      <Card className="glow-purple mb-6 overflow-visible">
        <CardContent className="flex flex-col items-center gap-8 p-8 md:flex-row md:justify-between md:p-10">
          <ZodiacWheel size={200} />
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15">
                <Sun className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">Sun Sign</p>
                <p className="font-serif-display text-xl text-champagne">{sunSign}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nebula-purple/20">
                <Moon className="h-5 w-5 text-white/80" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">Moon Sign</p>
                <p className="font-serif-display text-xl text-champagne">{moonSign}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nebula-blue/20">
                <ArrowUpCircle className="h-5 w-5 text-white/80" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">Rising Sign</p>
                <p className="font-serif-display text-xl text-champagne">{risingSign}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15">
                <Compass className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">Chinese Zodiac</p>
                <p className="font-serif-display text-xl text-champagne">{chineseLabel}{onboarding.yinYang ? ` · ${onboarding.yinYang}` : ''}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <div className="border-t border-white/5 p-8 md:p-10">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h3 className="font-serif-display text-xl text-champagne">Your Traits</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {traits.map((t) => (
              <Badge key={t} variant="gold">
                {t}
              </Badge>
            ))}
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/55">
            As a {sunSign} Sun with {moonSign} Moon, you lead with charm and diplomacy while feeling
            things deeply beneath the surface. You're drawn to partners who can match your emotional
            intuition with steady, grounded presence.
          </p>
        </div>
      </Card>

      {isOnboarding && (
        <Button size="lg" className="w-full" onClick={finish}>
          Enter Perennia <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  )
}

function CosmicProfileBackButton() {
  const navigate = useNavigate()
  return (
    <Button
      variant="glass"
      size="icon"
      onClick={() => navigate(-1)}
      className="fixed left-4 top-4 z-30 md:left-8 md:top-8 lg:left-28 xl:left-72"
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  )
}

export function CosmicProfile() {
  const { onboardingComplete } = useApp()

  if (onboardingComplete) {
    return (
      <AppShell>
        <CosmicProfileBackButton />
        <div className="flex justify-center px-6 py-10 md:py-16">
          <CosmicProfileContent isOnboarding={false} />
        </div>
      </AppShell>
    )
  }

  return (
    <OnboardingShell step={12} totalSteps={12}>
      <CosmicProfileContent isOnboarding={true} />
    </OnboardingShell>
  )
}
