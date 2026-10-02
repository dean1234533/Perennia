import { useMemo, useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  BriefcaseBusiness,
  Camera,
  Check,
  Clapperboard,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  HandHeart,
  Heart,
  Loader2,
  Mountain,
  Music2,
  Palette,
  PawPrint,
  PenLine,
  PersonStanding,
  Plane,
  ShieldCheck,
  Sparkles,
  Utensils,
  Volleyball,
} from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { OnboardingBackButton, OnboardingPrimaryButton } from '@/components/ui/onboarding-buttons'
import { useApp } from '@/context/AppContext'
import {
  AVAILABLE_INTERESTS,
  LEGACY_INTEREST_MAP,
  MAX_ONBOARDING_INTERESTS,
  MIN_ONBOARDING_INTERESTS,
} from '@/data/interests'
import { getOnboardingStep } from '@/lib/onboardingFlow'

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>

interface IconVisual {
  icon: IconType
  accent: string
  glow?: string
  artworkClassName?: string
}

const INTEREST_META: Record<string, IconVisual> = {
  Travel: { icon: Plane, accent: 'text-cyan-300', glow: 'group-hover:shadow-cyan-300/20' },
  Fitness: { icon: Dumbbell, accent: 'text-violet-300', glow: 'group-hover:shadow-violet-300/20' },
  'Food & Cooking': { icon: Utensils, accent: 'text-amber-200', glow: 'group-hover:shadow-amber-200/20' },
  Music: { icon: Music2, accent: 'text-pink-300', glow: 'group-hover:shadow-pink-300/20' },
  'Art & Culture': { icon: Palette, accent: 'text-fuchsia-300', glow: 'group-hover:shadow-fuchsia-300/20' },
  Reading: { icon: BookOpen, accent: 'text-sky-300', glow: 'group-hover:shadow-sky-300/20' },
  Photography: { icon: Camera, accent: 'text-purple-300', glow: 'group-hover:shadow-purple-300/20' },
  'Outdoor Adventures': { icon: Mountain, accent: 'text-emerald-300', glow: 'group-hover:shadow-emerald-300/20' },
  Dancing: { icon: PersonStanding, accent: 'text-rose-300', glow: 'group-hover:shadow-rose-300/20', artworkClassName: 'interest-icon-tile__artwork--dancing' },
  'Movies & TV': { icon: Clapperboard, accent: 'text-indigo-300', glow: 'group-hover:shadow-indigo-300/20' },
  Spirituality: { icon: Sparkles, accent: 'text-violet-200', glow: 'group-hover:shadow-violet-200/20' },
  Gaming: { icon: Gamepad2, accent: 'text-cyan-300', glow: 'group-hover:shadow-cyan-300/20' },
  'Helping Others': { icon: HandHeart, accent: 'text-pink-300', glow: 'group-hover:shadow-pink-300/20' },
  Business: { icon: BriefcaseBusiness, accent: 'text-amber-200', glow: 'group-hover:shadow-amber-200/20' },
  Education: { icon: GraduationCap, accent: 'text-sky-300', glow: 'group-hover:shadow-sky-300/20' },
  'Pets & Animals': { icon: PawPrint, accent: 'text-fuchsia-200', glow: 'group-hover:shadow-fuchsia-200/20' },
  Sports: { icon: Volleyball, accent: 'text-emerald-300', glow: 'group-hover:shadow-emerald-300/20' },
  Writing: { icon: PenLine, accent: 'text-purple-300', glow: 'group-hover:shadow-purple-300/20' },
}

const FALLBACK_VISUAL: IconVisual = { icon: Sparkles, accent: 'text-lavender' }

function InterestIconTile({
  visual,
  selected,
}: {
  visual: IconVisual
  selected: boolean
}) {
  const Icon = visual.icon

  return (
    <span
      aria-hidden="true"
      className={`interest-icon-tile interest-icon-tile--interest ${visual.accent} ${visual.glow ?? ''}${selected ? ' is-selected' : ''}`}
    >
      <Icon className={`interest-icon-tile__artwork ${visual.artworkClassName ?? ''}`} strokeWidth={2} />
    </span>
  )
}

const curatedSet = new Set<string>(AVAILABLE_INTERESTS)

function getNormalizedCuratedInterests(saved: string[]) {
  return [...new Set(saved.map((item) => LEGACY_INTEREST_MAP[item] ?? item).filter((item) => curatedSet.has(item)))]
}

function getCuratedSelections(saved: string[]) {
  return getNormalizedCuratedInterests(saved).slice(0, MAX_ONBOARDING_INTERESTS)
}

export function InterestsStep() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <InterestsForm />}
    </OnboardingShell>
  )
}

function InterestsForm() {
  const navigate = useNavigate()
  const { profileExtras, saveProfileExtras } = useApp()
  const [selected, setSelected] = useState<string[]>(() => getCuratedSelections(profileExtras.interests))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const remaining = Math.max(0, MIN_ONBOARDING_INTERESTS - selected.length)
  const minimumMet = remaining === 0
  const canContinue = minimumMet
  const legacyInterests = useMemo(
    () => profileExtras.interests.filter((item) => !curatedSet.has(item) && !LEGACY_INTEREST_MAP[item]),
    [profileExtras.interests]
  )
  // Profiles created before the eight-interest cap may already contain more.
  // Keep any overflow stored unless the member explicitly brings it back into
  // the visible selection, rather than silently deleting existing data.
  const preservedOverflow = useMemo(
    () => getNormalizedCuratedInterests(profileExtras.interests).slice(MAX_ONBOARDING_INTERESTS),
    [profileExtras.interests]
  )

  const toggle = (interest: string) => {
    setSelected((current) => {
      if (current.includes(interest)) return current.filter((item) => item !== interest)
      if (current.length >= MAX_ONBOARDING_INTERESTS) return current
      return [...current, interest]
    })
  }

  const handleContinue = async () => {
    if (!canContinue) return
    setSaving(true)
    setError('')
    try {
      await saveProfileExtras({
        ...profileExtras,
        interests: [...selected, ...preservedOverflow.filter((item) => !selected.includes(item)), ...legacyInterests],
      })
      navigate(getOnboardingStep('interests').nextRoute!)
    } catch {
      setError('Could not save your interests. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-6xl pb-6"
    >
      <OnboardingBackButton to={getOnboardingStep('interests').previousRoute!} className="mb-5" />

      <div className="interests-panel rounded-[2rem] p-1 sm:p-2">
        <header className="mx-auto mb-9 max-w-2xl px-4 text-center sm:mb-11">
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold/70">Shape your profile</p>
          <h1 className="font-serif-display text-4xl text-gradient-gold sm:text-5xl lg:text-6xl">Interests</h1>
          <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            Tell us what you enjoy and what you're passionate about so we can connect you with people who share your world.
          </p>
        </header>

        <section aria-labelledby="interests-heading" className="px-3 sm:px-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="interests-heading" className="flex items-center gap-2 font-serif-display text-2xl text-champagne sm:text-3xl">
                <Heart className="h-5 w-5 text-gold" /> Your Interests
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-white/50 sm:text-sm">Select 5–8 topics and activities that genuinely interest you.</p>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
              <p aria-live="polite" className="shrink-0 text-sm font-medium text-champagne">{selected.length} / {MAX_ONBOARDING_INTERESTS} selected</p>
              <p className={`text-[11px] tracking-wide ${minimumMet ? 'text-emerald-300/85' : 'text-white/40'}`}>
                {minimumMet && <Check className="mr-1 inline h-3 w-3" />}Minimum 5 · Maximum 8
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_INTERESTS.map((interest) => {
              const isSelected = selected.includes(interest)
              const visual = INTEREST_META[interest] ?? FALLBACK_VISUAL
              const atLimit = selected.length >= MAX_ONBOARDING_INTERESTS && !isSelected
              return (
                <button
                  type="button"
                  key={interest}
                  aria-pressed={isSelected}
                  aria-disabled={atLimit}
                  disabled={atLimit}
                  onClick={() => toggle(interest)}
                  className={`group flex min-h-14 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all duration-300 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/45 active:scale-[0.985] ${isSelected ? 'border-gold/65 bg-gold/[0.09] text-champagne shadow-[0_0_30px_-18px_rgba(229,192,123,.95)]' : atLimit ? 'border-white/[0.07] bg-navy/25 text-white/35' : 'border-white/10 bg-navy/35 text-white/75 hover:border-white/25 hover:bg-white/[0.055]'}`}
                >
                  <InterestIconTile visual={visual} selected={isSelected} />
                  <span className="min-w-0 flex-1 text-sm font-medium">{interest}</span>
                  <span className={`interests-selection-indicator flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${isSelected ? 'border-gold bg-gold text-midnight' : 'text-transparent'}`}>
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="mx-3 mt-9 flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3.5 text-xs leading-5 text-white/45 sm:mx-5 sm:px-5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold/65" />
          <p>Your interests help others get to know you and help us introduce you to people you'll genuinely connect with. You can update them anytime.</p>
        </div>

        <div className="mx-auto mt-7 max-w-sm px-3 pb-3 sm:px-0 sm:pb-5">
          {error && <p role="alert" className="mb-4 text-center text-sm text-rose-300">{error}</p>}
          <OnboardingPrimaryButton
            className="w-full"
            disabled={!canContinue || saving}
            loading={saving}
            loadingLabel="Saving…"
            showArrow={canContinue}
            onClick={handleContinue}
          >
            {remaining > 0 ? `Choose ${remaining} more` : 'Continue'}
          </OnboardingPrimaryButton>
        </div>
      </div>
    </motion.main>
  )
}
