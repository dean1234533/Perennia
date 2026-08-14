import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronRight, Heart, Info } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { CosmicZodiacWheel } from './CosmicZodiacWheel'
import { useApp } from '@/context/AppContext'
import { MIN_ONBOARDING_INTERESTS } from '@/data/interests'
import { hasDevelopmentVerificationBypass } from '@/lib/developmentVerification'
import { firebaseConfigured } from '@/lib/firebase'
import { computeNatalChart, type NatalChartResult } from '@/lib/natalChart'
import { computeChineseYearProfile } from '@/lib/chineseAstrology'
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
  animalCharacter: string | null
  heavenlyStem: string | null
  heavenlyStemCharacter: string | null
  stemElement: string | null
  earthlyBranch: string | null
  earthlyBranchCharacter: string | null
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
      <span aria-hidden="true"><i>✦</i></span>
      <h2 id={id}>{children}</h2>
      <span aria-hidden="true"><i>✦</i></span>
    </div>
  )
}

function CosmicHeaderMark() {
  return (
    <div className="cosmic-header-mark" aria-hidden="true">
      <Heart />
      <span>✦</span>
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
      <ChevronRight className="cosmic-card-chevron" aria-hidden="true" />
    </article>
  )
}

function ChineseCard({
  item,
  value,
  character,
}: {
  item: (typeof CHINESE_ITEMS)[number]
  value: string | null
  character?: string | null
}) {
  const animalSymbols: Record<string, string> = { Rat: '鼠', Ox: '牛', Tiger: '虎', Rabbit: '兔', Dragon: '龍', Snake: '蛇', Horse: '馬', Sheep: '羊', Monkey: '猴', Rooster: '雞', Dog: '狗', Pig: '豬' }
  const symbol = character ?? (item.key === 'animal' && value ? animalSymbols[value] ?? item.symbol : item.symbol)
  return (
    <article className={`cosmic-chinese-card cosmic-accent-${item.accent}`}>
      <span className="cosmic-chinese-symbol" aria-hidden="true">{symbol}</span>
      <div>
        <h3>{item.label}</h3>
        <p className={value ? '' : 'cosmic-unavailable'}>{valueOrUnavailable(value)}</p>
      </div>
      <ChevronRight className="cosmic-card-chevron" aria-hidden="true" />
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

  const chineseYear = useMemo(
    () => computeChineseYearProfile(onboarding.birthDate),
    [onboarding.birthDate],
  )

  const chineseProfile: ChineseProfileDisplay = {
    animal: onboarding.chineseAnimal || chineseYear?.animal || null,
    animalCharacter: chineseYear?.animalCharacter || null,
    heavenlyStem: chineseYear?.heavenlyStem || null,
    heavenlyStemCharacter: chineseYear?.heavenlyStemCharacter || null,
    stemElement: onboarding.chineseElement || chineseYear?.element || null,
    earthlyBranch: chineseYear?.earthlyBranch || null,
    earthlyBranchCharacter: chineseYear?.earthlyBranchCharacter || null,
    polarity: onboarding.yinYang || chineseYear?.polarity || null,
  }

  const visibleWesternPlacements = WESTERN_PLACEMENTS

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
      {isOnboarding && <CosmicProfileBackButton compact={false} />}
      <header className="cosmic-profile-header">
        <p className="cosmic-eyebrow">Your Astrological Foundation</p>
        <h1>Your Cosmic Profile</h1>
        <p>A glimpse into the Western and Chinese astrology that makes you uniquely you.</p>
      </header>

      <div className="cosmic-western-layout">
        <div className="cosmic-wheel-column" aria-label="Decorative zodiac wheel">
          <CosmicZodiacWheel />
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

      <section className="cosmic-chinese-section" aria-labelledby="chinese-astrology-heading">
        <CosmicSectionHeading id="chinese-astrology-heading">Chinese Astrology</CosmicSectionHeading>
        <div className="cosmic-chinese-grid">
          {CHINESE_ITEMS.map((item) => (
            <ChineseCard
              key={item.key}
              item={item}
              value={chineseProfile[item.key]}
              character={item.key === 'animal'
                ? chineseProfile.animalCharacter
                : item.key === 'heavenlyStem'
                  ? chineseProfile.heavenlyStemCharacter
                  : item.key === 'earthlyBranch'
                    ? chineseProfile.earthlyBranchCharacter
                    : null}
            />
          ))}
        </div>
      </section>

      <p className="cosmic-profile-note">
        <Info aria-hidden="true" />
        These are the core astrological influences connected with your birth.
      </p>

      {isOnboarding && (
        <Button size="lg" className="cosmic-enter-button" onClick={finish}>
          Enter Perennia <ArrowRight aria-hidden="true" />
        </Button>
      )}
    </motion.main>
  )
}

function CosmicProfileBackButton({ compact = true }: { compact?: boolean }) {
  const navigate = useNavigate()
  return (
    <Button
      variant={compact ? 'glass' : 'link'}
      size={compact ? 'icon' : 'sm'}
      onClick={() => navigate(-1)}
      className={compact ? 'fixed left-4 top-4 z-30 md:left-8 md:top-8 lg:left-28 xl:left-72' : 'cosmic-back-button'}
      aria-label="Go back"
    >
      <ArrowLeft aria-hidden="true" />
      {!compact && <span>Back</span>}
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
    <OnboardingShell
      step={12}
      totalSteps={12}
      headerMark={<CosmicHeaderMark />}
      progressVariant="nodes"
    >
      <CosmicProfileContent isOnboarding />
    </OnboardingShell>
  )
}
