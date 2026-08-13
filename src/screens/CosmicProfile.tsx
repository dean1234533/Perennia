import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { ZodiacWheel } from '@/components/shared/ZodiacWheel'
import { useApp } from '@/context/AppContext'
import { MIN_ONBOARDING_INTERESTS } from '@/data/interests'
import { hasDevelopmentVerificationBypass } from '@/lib/developmentVerification'
import { firebaseConfigured } from '@/lib/firebase'
import { computeNatalChart, type NatalChartResult } from '@/lib/natalChart'
import './CosmicProfile.css'

type WesternPlacementKey =
  | 'sunSign'
  | 'moonSign'
  | 'risingSign'
  | 'mercurySign'
  | 'venusSign'
  | 'marsSign'
  | 'jupiterSign'
  | 'saturnSign'
  | 'uranusSign'
  | 'neptuneSign'
  | 'plutoSign'

interface WesternPlacement {
  key: WesternPlacementKey
  label: string
  symbol: string
  accent: string
}

interface ChineseProfileDisplay {
  animal: string | null
  heavenlyStem: string | null
  stemElement: string | null
  earthlyBranch: string | null
  polarity: string | null
}

const WESTERN_PLACEMENTS: WesternPlacement[] = [
  { key: 'sunSign', label: 'Sun', symbol: '☉', accent: 'gold' },
  { key: 'moonSign', label: 'Moon', symbol: '☾', accent: 'moon' },
  { key: 'risingSign', label: 'Rising / Ascendant', symbol: '↑', accent: 'earth' },
  { key: 'mercurySign', label: 'Mercury', symbol: '☿', accent: 'coral' },
  { key: 'venusSign', label: 'Venus', symbol: '♀', accent: 'cyan' },
  { key: 'marsSign', label: 'Mars', symbol: '♂', accent: 'pink' },
  { key: 'jupiterSign', label: 'Jupiter', symbol: '♃', accent: 'amber' },
  { key: 'saturnSign', label: 'Saturn', symbol: '♄', accent: 'gold' },
  { key: 'uranusSign', label: 'Uranus', symbol: '♅', accent: 'blue' },
  { key: 'neptuneSign', label: 'Neptune', symbol: '♆', accent: 'cyan' },
  { key: 'plutoSign', label: 'Pluto', symbol: '♇', accent: 'violet' },
]

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

const CHINESE_ITEMS = [
  { key: 'animal', label: 'Chinese Zodiac Animal', symbol: '生肖', accent: 'gold' },
  { key: 'heavenlyStem', label: 'Heavenly Stem', symbol: '天', accent: 'amber' },
  { key: 'earthlyBranch', label: 'Earthly Branch', symbol: '地', accent: 'blue' },
  { key: 'stemElement', label: 'Stem Element', symbol: '五', accent: 'green' },
  { key: 'polarity', label: 'Yin / Yang', symbol: '☯', accent: 'gold' },
] as const

function valueOrUnavailable(value: string | null | undefined) {
  return value?.trim() || 'Not available'
}

function CosmicSectionHeading({ children, id }: { children: string; id: string }) {
  return (
    <div className="cosmic-section-heading">
      <span aria-hidden="true" />
      <h2 id={id}>{children}</h2>
      <span aria-hidden="true" />
    </div>
  )
}

function WesternCard({ placement, value }: { placement: WesternPlacement; value?: string }) {
  const displayValue = valueOrUnavailable(value)
  const signSymbol = value ? SIGN_SYMBOLS[value] : null

  return (
    <article className={`cosmic-placement-card cosmic-accent-${placement.accent}`}>
      <span className="cosmic-planet-symbol" aria-hidden="true">{placement.symbol}</span>
      <div className="cosmic-placement-copy">
        <h3>{placement.label}</h3>
        <p className={value ? '' : 'cosmic-unavailable'}>
          {signSymbol && <span aria-hidden="true">{signSymbol}</span>}
          {displayValue}
        </p>
      </div>
    </article>
  )
}

function ChineseCard({
  item,
  value,
}: {
  item: (typeof CHINESE_ITEMS)[number]
  value: string | null
}) {
  return (
    <article className={`cosmic-chinese-card cosmic-accent-${item.accent}`}>
      <span className="cosmic-chinese-symbol" aria-hidden="true">{item.symbol}</span>
      <div>
        <h3>{item.label}</h3>
        <p className={value ? '' : 'cosmic-unavailable'}>{valueOrUnavailable(value)}</p>
      </div>
    </article>
  )
}

function CosmicProfileContent({ isOnboarding }: { isOnboarding: boolean }) {
  const navigate = useNavigate()
  const { onboarding, profileExtras, completeOnboarding } = useApp()
  const [extendedChart, setExtendedChart] = useState<NatalChartResult | null>(null)
  const [loadingPlacements, setLoadingPlacements] = useState(false)

  useEffect(() => {
    if (!firebaseConfigured || !onboarding.birthDate || !onboarding.birthPlace) return

    let active = true
    setLoadingPlacements(true)
    computeNatalChart({
      birthDate: onboarding.birthDate,
      birthTime: onboarding.birthTimeUnknown ? undefined : onboarding.birthTime,
      birthTimeUnknown: onboarding.birthTimeUnknown,
      birthPlace: onboarding.birthPlace,
    })
      .then((chart) => {
        if (active) setExtendedChart(chart)
      })
      .catch(() => {
        // The existing core placements remain usable. Additional display-only
        // values degrade individually rather than blocking onboarding.
      })
      .finally(() => {
        if (active) setLoadingPlacements(false)
      })

    return () => { active = false }
  }, [onboarding.birthDate, onboarding.birthPlace, onboarding.birthTime, onboarding.birthTimeUnknown])

  const westernValues = useMemo<Partial<Record<WesternPlacementKey, string>>>(() => ({
    sunSign: onboarding.sunSign || extendedChart?.sunSign,
    moonSign: onboarding.moonSign || extendedChart?.moonSign,
    risingSign: onboarding.risingSign || extendedChart?.risingSign,
    mercurySign: extendedChart?.mercurySign,
    venusSign: extendedChart?.venusSign,
    marsSign: extendedChart?.marsSign,
    jupiterSign: extendedChart?.jupiterSign,
    saturnSign: extendedChart?.saturnSign,
    uranusSign: extendedChart?.uranusSign,
    neptuneSign: extendedChart?.neptuneSign,
    plutoSign: extendedChart?.plutoSign,
  }), [extendedChart, onboarding.moonSign, onboarding.risingSign, onboarding.sunSign])

  // This adapter intentionally contains no calendar math. Stem and branch
  // remain null until a validated full-date Chinese astrology source exists.
  const chineseProfile: ChineseProfileDisplay = {
    animal: onboarding.chineseAnimal || null,
    heavenlyStem: null,
    stemElement: onboarding.chineseElement || null,
    earthlyBranch: null,
    polarity: onboarding.yinYang || null,
  }

  const visibleWesternPlacements = isOnboarding
    ? WESTERN_PLACEMENTS
    : WESTERN_PLACEMENTS.filter(({ key }) => ['sunSign', 'moonSign', 'risingSign'].includes(key))

  const finish = async () => {
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
    if (profileExtras.interests.length < MIN_ONBOARDING_INTERESTS || !profileExtras.lifestyleVibe) {
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
    navigate('/founding-500?next=' + encodeURIComponent('/discovery'))
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="cosmic-profile"
    >
      <header className="cosmic-profile-header">
        <p className="cosmic-eyebrow">Your Astrological Foundation</p>
        <h1>Your Cosmic Profile</h1>
        <p>A glimpse into the Western and Chinese astrology that makes you uniquely you.</p>
      </header>

      <div className="cosmic-western-layout">
        <div className="cosmic-wheel-column" aria-label="Decorative zodiac wheel">
          <div className="cosmic-wheel-halo" aria-hidden="true" />
          <ZodiacWheel size={260} />
          <p>Your celestial signature</p>
        </div>

        <section className="cosmic-western-section" aria-labelledby="western-astrology-heading">
          <CosmicSectionHeading id="western-astrology-heading">Western Astrology</CosmicSectionHeading>
          <div className="cosmic-western-grid" aria-busy={loadingPlacements}>
            {visibleWesternPlacements.map((placement) => (
              <WesternCard key={placement.key} placement={placement} value={westernValues[placement.key]} />
            ))}
          </div>
          {loadingPlacements && (
            <p className="cosmic-loading" role="status">Completing your planetary profile…</p>
          )}
        </section>
      </div>

      {isOnboarding && (
        <section className="cosmic-chinese-section" aria-labelledby="chinese-astrology-heading">
          <CosmicSectionHeading id="chinese-astrology-heading">Chinese Astrology</CosmicSectionHeading>
          <div className="cosmic-chinese-grid">
            {CHINESE_ITEMS.map((item) => (
              <ChineseCard key={item.key} item={item} value={chineseProfile[item.key]} />
            ))}
          </div>
        </section>
      )}

      <p className="cosmic-profile-note">
        <Info aria-hidden="true" />
        {isOnboarding
          ? 'These are the core astrological influences connected with your birth.'
          : 'Your core astrological profile. Full profile access is reserved for the onboarding reveal and future Premium access.'}
      </p>

      {isOnboarding && (
        <Button size="lg" className="cosmic-enter-button" onClick={finish}>
          Enter Perennia <ArrowRight aria-hidden="true" />
        </Button>
      )}
    </motion.main>
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
      aria-label="Go back"
    >
      <ArrowLeft aria-hidden="true" />
    </Button>
  )
}

export function CosmicProfile() {
  const { onboardingComplete } = useApp()

  if (onboardingComplete) {
    return (
      <AppShell>
        <CosmicProfileBackButton />
        <div className="cosmic-app-shell-wrap">
          <CosmicProfileContent isOnboarding={false} />
        </div>
      </AppShell>
    )
  }

  return (
    <OnboardingShell step={12} totalSteps={12}>
      <CosmicProfileContent isOnboarding />
    </OnboardingShell>
  )
}
