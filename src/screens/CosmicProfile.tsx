import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, MotionConfig } from 'framer-motion'
import { ArrowLeft, ChevronRight, Info } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { AppShell } from '@/components/layout/AppShell'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { Button } from '@/components/ui/button'
import { OnboardingPrimaryButton } from '@/components/ui/onboarding-buttons'
import { CosmicZodiacWheel } from './CosmicZodiacWheel'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { hasDevelopmentVerificationBypass } from '@/lib/developmentVerification'
import { firebaseConfigured } from '@/lib/firebase'
import { calculateOnboardingProgress, getOnboardingStep } from '@/lib/onboardingFlow'
import { computeNatalChart, type NatalChartResult } from '@/lib/natalChart'
import { computeChineseYearProfile } from '@/lib/chineseAstrology'
import { getChineseAstrologyRows, type ChineseAstrologyRow } from '@/data/chineseAstrologyPresentation'
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
  symbolAsset: string
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
  { key: 'sunSign', label: 'Sun', symbolAsset: '/approved-symbol-cards-v4/western-placements-dark/sun.png', accent: 'gold' },
  { key: 'moonSign', label: 'Moon', symbolAsset: '/approved-symbol-cards-v4/western-placements-dark/moon.png', accent: 'moon' },
  { key: 'risingSign', label: 'Rising / Ascendant', symbolAsset: '/approved-symbol-cards-v4/western-placements-dark/rising-ascendant.png', accent: 'earth' },
  { key: 'mercurySign', label: 'Mercury', symbolAsset: '/approved-symbol-cards-v4/western-placements-dark/mercury.png', accent: 'coral' },
  { key: 'venusSign', label: 'Venus', symbolAsset: '/approved-symbol-cards-v4/western-placements-dark/venus.png', accent: 'cyan' },
  { key: 'marsSign', label: 'Mars', symbolAsset: '/approved-symbol-cards-v4/western-placements-dark/mars.png', accent: 'pink' },
  { key: 'jupiterSign', label: 'Jupiter', symbolAsset: '/approved-symbol-cards-v4/western-placements-dark/jupiter.png', accent: 'amber' },
  { key: 'saturnSign', label: 'Saturn', symbolAsset: '/approved-symbol-cards-v4/western-placements-dark/saturn.png', accent: 'gold' },
  { key: 'uranusSign', label: 'Uranus', symbolAsset: '/approved-symbol-cards-v4/western-placements-dark/uranus.png', accent: 'blue' },
  { key: 'neptuneSign', label: 'Neptune', symbolAsset: '/approved-symbol-cards-v4/western-placements-dark/neptune.png', accent: 'cyan' },
  { key: 'plutoSign', label: 'Pluto', symbolAsset: '/approved-symbol-cards-v4/western-placements-dark/pluto.png', accent: 'violet' },
]

const SIGN_ASSETS: Record<string, string> = {
  Aries: '/approved-symbol-cards-v4/zodiac-white/aries.png',
  Taurus: '/approved-symbol-cards-v4/zodiac-white/taurus.png',
  Gemini: '/approved-symbol-cards-v4/zodiac-white/gemini.png',
  Cancer: '/approved-symbol-cards-v4/zodiac-white/cancer.png',
  Leo: '/approved-symbol-cards-v4/zodiac-white/leo.png',
  Virgo: '/approved-symbol-cards-v4/zodiac-white/virgo.png',
  Libra: '/approved-symbol-cards-v4/zodiac-white/libra.png',
  Scorpio: '/approved-symbol-cards-v4/zodiac-white/scorpio.png',
  Sagittarius: '/approved-symbol-cards-v4/zodiac-white/sagittarius.png',
  Capricorn: '/approved-symbol-cards-v4/zodiac-white/capricorn.png',
  Aquarius: '/approved-symbol-cards-v4/zodiac-white/aquarius.png',
  Pisces: '/approved-symbol-cards-v4/zodiac-white/pisces.png',
}

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
  return <CelestialHeart className="mb-5 h-16 w-16 sm:h-20 sm:w-20" />
}

function CosmicArtworkPlate({ src, className = '' }: { src: string; className?: string }) {
  return (
    <span className={`cosmic-icon-plate ${className}`} aria-hidden="true">
      <img className="cosmic-icon-artwork" src={src} alt="" />
    </span>
  )
}

function WesternCard({ placement, value }: { placement: WesternPlacement; value?: string }) {
  const displayValue = valueOrUnavailable(value)
  const signAsset = value ? SIGN_ASSETS[value] : null

  return (
    <article className={`cosmic-placement-card cosmic-accent-${placement.accent}`}>
      <CosmicArtworkPlate src={placement.symbolAsset} className="cosmic-placement-icon-plate" />
      <div className="cosmic-placement-copy">
        <h3>{placement.label}</h3>
        <p className={value ? '' : 'cosmic-unavailable'}>
          {signAsset && <CosmicArtworkPlate src={signAsset} />}
          {displayValue}
        </p>
      </div>
      <ChevronRight className="cosmic-card-chevron" aria-hidden="true" />
    </article>
  )
}

function ChineseCard({ row }: { row: ChineseAstrologyRow }) {
  return (
    <article className={`cosmic-chinese-card cosmic-accent-${row.accent}`}>
      <span className="cosmic-chinese-visual" aria-hidden="true">
        <span className="cosmic-chinese-category-symbol" lang="zh-Hant">
          {row.leftCharacter ?? '—'}
        </span>
      </span>
      <h3>{row.label}</h3>
      <div className="cosmic-chinese-outcome">
        <span className="cosmic-chinese-character" lang="zh-Hant" aria-hidden="true">
          {row.rightArtwork ? (
            <img className="cosmic-chinese-result-artwork" src={row.rightArtwork} alt="" />
          ) : (
            row.rightCharacter ?? '—'
          )}
        </span>
        <div className="cosmic-chinese-result">
          <p className={`cosmic-chinese-value ${row.value ? '' : 'cosmic-unavailable'}`}>
            {valueOrUnavailable(row.value)}
          </p>
          {row.explanation && <p className="cosmic-chinese-explanation">{row.explanation}</p>}
        </div>
      </div>
      <ChevronRight className="cosmic-card-chevron" aria-hidden="true" />
    </article>
  )
}

function CosmicProfileContent({
  isOnboarding,
  previewWesternValues,
  previewChineseProfile,
}: {
  isOnboarding: boolean
  previewWesternValues?: Partial<Record<WesternPlacementKey, string>>
  previewChineseProfile?: Partial<ChineseProfileDisplay>
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { onboarding, profileExtras, completeOnboarding, onboardingComplete, profileLoaded } = useApp()
  const [extendedChart, setExtendedChart] = useState<NatalChartResult | null>(null)
  const [loadingPlacements, setLoadingPlacements] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [completionError, setCompletionError] = useState('')

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
    sunSign: previewWesternValues?.sunSign ?? (onboarding.sunSign || extendedChart?.sunSign),
    moonSign: previewWesternValues?.moonSign ?? (onboarding.moonSign || extendedChart?.moonSign),
    risingSign: previewWesternValues?.risingSign ?? (onboarding.risingSign || extendedChart?.risingSign),
    mercurySign: previewWesternValues?.mercurySign ?? extendedChart?.mercurySign,
    venusSign: previewWesternValues?.venusSign ?? extendedChart?.venusSign,
    marsSign: previewWesternValues?.marsSign ?? extendedChart?.marsSign,
    jupiterSign: previewWesternValues?.jupiterSign ?? extendedChart?.jupiterSign,
    saturnSign: previewWesternValues?.saturnSign ?? extendedChart?.saturnSign,
    uranusSign: previewWesternValues?.uranusSign ?? extendedChart?.uranusSign,
    neptuneSign: previewWesternValues?.neptuneSign ?? extendedChart?.neptuneSign,
    plutoSign: previewWesternValues?.plutoSign ?? extendedChart?.plutoSign,
  }), [extendedChart, onboarding.moonSign, onboarding.risingSign, onboarding.sunSign, previewWesternValues])

  const chineseYear = useMemo(
    () => computeChineseYearProfile(onboarding.birthDate),
    [onboarding.birthDate],
  )

  const chineseProfile: ChineseProfileDisplay = {
    animal: previewChineseProfile?.animal ?? (onboarding.chineseAnimal || chineseYear?.animal || null),
    heavenlyStem: previewChineseProfile?.heavenlyStem ?? (chineseYear?.heavenlyStem || null),
    stemElement: previewChineseProfile?.stemElement ?? (onboarding.chineseElement || chineseYear?.element || null),
    earthlyBranch: previewChineseProfile?.earthlyBranch ?? (chineseYear?.earthlyBranch || null),
    polarity: previewChineseProfile?.polarity ?? (onboarding.yinYang || chineseYear?.polarity || null),
  }
  const chineseRows = getChineseAstrologyRows(chineseProfile)

  const visibleWesternPlacements = WESTERN_PLACEMENTS

  const finish = async () => {
    if (completing) return
    const progress = calculateOnboardingProgress({
      onboarding,
      profileExtras,
      user,
      profileLoaded,
      onboardingComplete,
      backendConfigured: firebaseConfigured,
      localPreviewBypassEnabled: hasDevelopmentVerificationBypass(),
    })
    if (!progress.allPrerequisiteStepsComplete) {
      navigate(progress.earliestIncompleteStep?.route ?? getOnboardingStep('signup').route)
      return
    }

    setCompleting(true)
    setCompletionError('')
    try {
      await completeOnboarding()
      navigate('/founding-500?next=' + encodeURIComponent('/discovery'))
    } catch {
      setCompletionError('Could not complete onboarding. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <MotionConfig reducedMotion="user">
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
          {chineseRows.map((row) => (
            <ChineseCard key={row.key} row={row} />
          ))}
        </div>
      </section>

      <p className="cosmic-profile-note">
        <Info aria-hidden="true" />
        These are the core astrological influences connected with your birth.
      </p>

      {isOnboarding && (
        <>
          {completionError && <p role="alert" className="cosmic-profile-note text-rose-300">{completionError}</p>}
          <OnboardingPrimaryButton
            className="mx-auto mt-4 w-full max-w-[390px]"
            onClick={finish}
            disabled={completing}
            loading={completing}
            loadingLabel="Entering Perennia…"
            showArrow
          >
            Enter Perennia
          </OnboardingPrimaryButton>
        </>
      )}
      </motion.main>
    </MotionConfig>
  )
}

function CosmicProfileBackButton({ compact = true }: { compact?: boolean }) {
  const navigate = useNavigate()
  const handleBack = () => {
    if (compact) {
      navigate(-1)
      return
    }
    navigate(getOnboardingStep('cosmicProfile').previousRoute!)
  }

  return (
    <Button
      variant={compact ? 'glass' : 'link'}
      size={compact ? 'icon' : 'sm'}
      onClick={handleBack}
      className={compact ? 'fixed left-4 top-4 z-30 md:left-8 md:top-8 lg:left-28 xl:left-72' : 'cosmic-back-button'}
      aria-label="Go back"
    >
      <ArrowLeft aria-hidden="true" />
      {!compact && <span>Back</span>}
    </Button>
  )
}

export function CosmicProfile({
  previewWesternValues,
  previewChineseProfile,
}: {
  previewWesternValues?: Partial<Record<WesternPlacementKey, string>>
  previewChineseProfile?: Partial<ChineseProfileDisplay>
} = {}) {
  const { onboardingComplete } = useApp()

  if (onboardingComplete) {
    return (
      <AppShell>
        <CosmicProfileBackButton />
        <div className="cosmic-app-shell-wrap">
          <CosmicProfileContent
            isOnboarding={false}
            previewWesternValues={previewWesternValues}
            previewChineseProfile={previewChineseProfile}
          />
        </div>
      </AppShell>
    )
  }

  return (
    <OnboardingShell
      headerMark={<CosmicHeaderMark />}
      progressVariant="nodes"
    >
      <CosmicProfileContent
        isOnboarding
        previewWesternValues={previewWesternValues}
        previewChineseProfile={previewChineseProfile}
      />
    </OnboardingShell>
  )
}
