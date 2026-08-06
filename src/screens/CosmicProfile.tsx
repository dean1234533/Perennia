import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sun, Moon, ArrowUpCircle, Sparkles, ArrowRight } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ZodiacWheel } from '@/components/shared/ZodiacWheel'
import { useApp } from '@/context/AppContext'

const traits = ['Intuitive', 'Loyal', 'Passionate', 'Idealistic', 'Warm', 'Determined']

function CosmicProfileContent({ isOnboarding }: { isOnboarding: boolean }) {
  const navigate = useNavigate()
  const { onboarding, completeOnboarding } = useApp()
  const sunSign = onboarding.sunSign || 'Libra'

  const finish = async () => {
    await completeOnboarding()
    navigate('/discovery')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl"
    >
      <div className="mb-8 text-center">
        <h1 className="font-serif-display mb-2 text-3xl md:text-4xl">
          {isOnboarding ? 'Your Cosmic Profile' : 'Your Cosmic Profile'}
        </h1>
        <p className="mx-auto max-w-md text-sm text-white/55">
          {isOnboarding
            ? 'Drawn from your birth details — this shapes how we calculate compatibility with others.'
            : 'The astrological foundation behind every match we make for you.'}
        </p>
      </div>

      <Card className="glow-purple mb-6 overflow-visible">
        <CardContent className="flex flex-col items-center gap-6 p-8 md:flex-row md:justify-between">
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
                <p className="font-serif-display text-xl text-champagne">Pisces</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nebula-blue/20">
                <ArrowUpCircle className="h-5 w-5 text-white/80" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">Rising Sign</p>
                <p className="font-serif-display text-xl text-champagne">Leo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-8">
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
          <p className="mt-5 text-sm leading-relaxed text-white/55">
            As a {sunSign} Sun with Pisces Moon, you lead with charm and diplomacy while feeling
            things deeply beneath the surface. You're drawn to partners who can match your emotional
            intuition with steady, grounded presence.
          </p>
        </CardContent>
      </Card>

      {isOnboarding ? (
        <Button size="lg" className="w-full" onClick={finish}>
          Enter Perennia <ArrowRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button size="lg" variant="glass" className="w-full" onClick={() => navigate('/settings')}>
          Edit Profile
        </Button>
      )}
    </motion.div>
  )
}

export function CosmicProfile() {
  const { onboardingComplete } = useApp()

  if (onboardingComplete) {
    return (
      <AppShell>
        <div className="flex justify-center px-6 py-10 md:py-16">
          <CosmicProfileContent isOnboarding={false} />
        </div>
      </AppShell>
    )
  }

  return (
    <OnboardingShell step={4} totalSteps={5}>
      <CosmicProfileContent isOnboarding={true} />
    </OnboardingShell>
  )
}
