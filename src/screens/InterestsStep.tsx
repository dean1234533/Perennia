import { useMemo, useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
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
  Star,
  SunMedium,
  Utensils,
  Volleyball,
} from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/context/AppContext'
import {
  AVAILABLE_INTERESTS,
  LEGACY_INTEREST_MAP,
  MAX_ONBOARDING_INTERESTS,
  MIN_ONBOARDING_INTERESTS,
} from '@/data/interests'

type IconType = ComponentType<{ className?: string }>

const INTEREST_META: Record<string, { icon: IconType; accent: string; glow: string }> = {
  Travel: { icon: Plane, accent: 'text-cyan-300', glow: 'group-hover:shadow-cyan-300/20' },
  Fitness: { icon: Dumbbell, accent: 'text-violet-300', glow: 'group-hover:shadow-violet-300/20' },
  'Food & Cooking': { icon: Utensils, accent: 'text-amber-200', glow: 'group-hover:shadow-amber-200/20' },
  Music: { icon: Music2, accent: 'text-pink-300', glow: 'group-hover:shadow-pink-300/20' },
  'Art & Culture': { icon: Palette, accent: 'text-fuchsia-300', glow: 'group-hover:shadow-fuchsia-300/20' },
  Reading: { icon: BookOpen, accent: 'text-sky-300', glow: 'group-hover:shadow-sky-300/20' },
  Photography: { icon: Camera, accent: 'text-purple-300', glow: 'group-hover:shadow-purple-300/20' },
  'Outdoor Adventures': { icon: Mountain, accent: 'text-emerald-300', glow: 'group-hover:shadow-emerald-300/20' },
  Dancing: { icon: PersonStanding, accent: 'text-rose-300', glow: 'group-hover:shadow-rose-300/20' },
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

const LIFESTYLE_VIBES: { title: string; description: string; icon: IconType; accent: string }[] = [
  { title: 'Calm & Peaceful', description: 'I value peace, simplicity and mindfulness.', icon: SunMedium, accent: 'text-amber-200' },
  { title: 'Active & Adventurous', description: 'I love exploring, staying active and new experiences.', icon: Mountain, accent: 'text-cyan-300' },
  { title: 'Driven & Ambitious', description: "I'm focused on growth, goals and building my future.", icon: BriefcaseBusiness, accent: 'text-violet-300' },
  { title: 'Family-Oriented', description: 'Family and strong relationships are very important.', icon: Heart, accent: 'text-pink-300' },
  { title: 'Creative & Inspired', description: "I'm drawn to creativity, ideas and imagination.", icon: Star, accent: 'text-fuchsia-300' },
]

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
    <OnboardingShell step={7} totalSteps={12}>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <InterestsForm />}
    </OnboardingShell>
  )
}

function InterestsForm() {
  const navigate = useNavigate()
  const { profileExtras, updateProfileExtras } = useApp()
  const [selected, setSelected] = useState<string[]>(() => getCuratedSelections(profileExtras.interests))
  const [lifestyleVibe, setLifestyleVibe] = useState(profileExtras.lifestyleVibe)
  const [openToNewThings, setOpenToNewThings] = useState(profileExtras.openToNewThings)
  const [saving, setSaving] = useState(false)
  const remaining = Math.max(0, MIN_ONBOARDING_INTERESTS - selected.length)
  const minimumMet = remaining === 0
  const canContinue = minimumMet && !!lifestyleVibe
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
    try {
      await updateProfileExtras({
        ...profileExtras,
        interests: [...selected, ...preservedOverflow.filter((item) => !selected.includes(item)), ...legacyInterests],
        lifestyleVibe,
        openToNewThings,
      })
      navigate('/about-you')
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
      <button onClick={() => navigate('/relationship-goals')} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-navy/25 px-3.5 text-sm text-white/65 transition hover:border-gold/30 hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/45 active:scale-[0.97]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

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
                <Sparkles className="h-5 w-5 text-gold" /> Your Interests
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
              const meta = INTEREST_META[interest]
              const Icon = meta?.icon ?? Sparkles
              const atLimit = selected.length >= MAX_ONBOARDING_INTERESTS && !isSelected
              return (
                <button
                  type="button"
                  key={interest}
                  aria-pressed={isSelected}
                  aria-disabled={atLimit}
                  disabled={atLimit}
                  onClick={() => toggle(interest)}
                  className={`group flex min-h-14 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/45 active:scale-[0.985] ${isSelected ? 'border-gold/65 bg-gold/[0.09] text-champagne shadow-[0_0_30px_-18px_rgba(229,192,123,.95)]' : atLimit ? 'border-white/[0.07] bg-navy/25 text-white/35' : 'border-white/10 bg-navy/35 text-white/75 hover:border-white/25 hover:bg-white/[0.055]'}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-white/[0.035] shadow-lg transition-shadow ${meta?.glow ?? ''} ${isSelected ? 'border-gold/30' : 'border-white/10'} ${meta?.accent ?? 'text-lavender'}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">{interest}</span>
                  <span className={`interests-selection-indicator flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${isSelected ? 'border-gold bg-gold text-midnight' : 'text-transparent'}`}>
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="vibes-heading" className="mt-11 px-3 sm:px-5">
          <h2 id="vibes-heading" className="font-serif-display text-2xl text-champagne sm:text-3xl">Lifestyle Vibes</h2>
          <p className="mt-1.5 text-xs text-white/50 sm:text-sm">What kind of lifestyle resonates with you most?</p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {LIFESTYLE_VIBES.map((vibe) => {
              const isSelected = lifestyleVibe === vibe.title
              const Icon = vibe.icon
              return (
                <button
                  type="button"
                  key={vibe.title}
                  aria-pressed={isSelected}
                  onClick={() => setLifestyleVibe(vibe.title)}
                  className={`group relative min-h-40 rounded-[1.35rem] border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/45 active:scale-[0.985] ${isSelected ? 'border-gold/65 bg-gold/[0.09] shadow-[0_0_34px_-20px_rgba(229,192,123,.95)]' : 'border-white/10 bg-navy/40 hover:border-white/25 hover:bg-white/[0.055]'}`}
                >
                  <span className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] ${vibe.accent}`}>
                    <Icon className="h-5 w-5 transition group-hover:drop-shadow-[0_0_7px_currentColor]" />
                  </span>
                  <span className={`block pr-6 font-serif-display text-lg ${isSelected ? 'text-champagne' : 'text-white/85'}`}>{vibe.title}</span>
                  <span className="mt-1.5 block text-xs leading-5 text-white/45">{vibe.description}</span>
                  <span className={`interests-selection-indicator absolute right-3.5 top-3.5 flex h-6 w-6 items-center justify-center rounded-full border transition ${isSelected ? 'border-gold bg-gold text-midnight' : 'text-transparent'}`}>
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-9 px-3 sm:px-5">
          <div className="flex items-center gap-4 rounded-[1.35rem] border border-white/10 bg-navy/40 p-4 sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/[0.07] text-violet-200">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif-display text-xl text-champagne">Open to New Things</h2>
              <p className="mt-1 text-xs leading-5 text-white/45 sm:text-sm">I enjoy trying new experiences and meeting people with different interests.</p>
            </div>
            <Switch checked={openToNewThings} onCheckedChange={setOpenToNewThings} aria-label="Open to new things" />
          </div>
        </section>

        <div className="mx-3 mt-5 flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3.5 text-xs leading-5 text-white/45 sm:mx-5 sm:px-5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold/65" />
          <p>Your interests help others get to know you and help us introduce you to people you'll genuinely connect with. You can update them anytime.</p>
        </div>

        <div className="mx-auto mt-7 max-w-sm px-3 pb-3 sm:px-0 sm:pb-5">
          <Button size="lg" className="interests-continue-button w-full" disabled={!canContinue || saving} onClick={handleContinue}>
            {saving ? 'Saving…' : remaining > 0 ? `Choose ${remaining} more` : !lifestyleVibe ? 'Choose your lifestyle vibe' : <>Continue <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </div>
    </motion.main>
  )
}
