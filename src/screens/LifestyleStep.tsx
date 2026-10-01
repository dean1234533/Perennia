import { useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BriefcaseBusiness,
  Check,
  Compass,
  Heart,
  HeartPulse,
  Home,
  Lightbulb,
  Loader2,
  Mountain,
  SunMedium,
  Ticket,
  Trees,
  Users,
} from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { OnboardingBackButton, OnboardingPrimaryButton } from '@/components/ui/onboarding-buttons'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/context/AppContext'
import { LIFESTYLE_VIBE_DESCRIPTIONS, LIFESTYLE_VIBE_OPTIONS } from '@/data/onboardingOptions'
import { getOnboardingStep } from '@/lib/onboardingFlow'

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>

interface LifestyleVisual {
  icon: IconType
  accent: string
}

const LIFESTYLE_VIBES: { title: string; description: string; visual: LifestyleVisual }[] = [
  { title: LIFESTYLE_VIBE_OPTIONS[0], description: LIFESTYLE_VIBE_DESCRIPTIONS[LIFESTYLE_VIBE_OPTIONS[0]], visual: { icon: SunMedium, accent: 'text-amber-200' } },
  { title: LIFESTYLE_VIBE_OPTIONS[1], description: LIFESTYLE_VIBE_DESCRIPTIONS[LIFESTYLE_VIBE_OPTIONS[1]], visual: { icon: Mountain, accent: 'text-cyan-300' } },
  { title: LIFESTYLE_VIBE_OPTIONS[2], description: LIFESTYLE_VIBE_DESCRIPTIONS[LIFESTYLE_VIBE_OPTIONS[2]], visual: { icon: BriefcaseBusiness, accent: 'text-violet-300' } },
  { title: LIFESTYLE_VIBE_OPTIONS[3], description: LIFESTYLE_VIBE_DESCRIPTIONS[LIFESTYLE_VIBE_OPTIONS[3]], visual: { icon: Heart, accent: 'text-pink-300' } },
  { title: LIFESTYLE_VIBE_OPTIONS[4], description: LIFESTYLE_VIBE_DESCRIPTIONS[LIFESTYLE_VIBE_OPTIONS[4]], visual: { icon: Lightbulb, accent: 'text-fuchsia-300' } },
  { title: LIFESTYLE_VIBE_OPTIONS[5], description: LIFESTYLE_VIBE_DESCRIPTIONS[LIFESTYLE_VIBE_OPTIONS[5]], visual: { icon: Users, accent: 'text-cyan-300' } },
  { title: LIFESTYLE_VIBE_OPTIONS[6], description: LIFESTYLE_VIBE_DESCRIPTIONS[LIFESTYLE_VIBE_OPTIONS[6]], visual: { icon: HeartPulse, accent: 'text-emerald-300' } },
  { title: LIFESTYLE_VIBE_OPTIONS[7], description: LIFESTYLE_VIBE_DESCRIPTIONS[LIFESTYLE_VIBE_OPTIONS[7]], visual: { icon: Home, accent: 'text-amber-200' } },
  { title: LIFESTYLE_VIBE_OPTIONS[8], description: LIFESTYLE_VIBE_DESCRIPTIONS[LIFESTYLE_VIBE_OPTIONS[8]], visual: { icon: Trees, accent: 'text-emerald-300' } },
  { title: LIFESTYLE_VIBE_OPTIONS[9], description: LIFESTYLE_VIBE_DESCRIPTIONS[LIFESTYLE_VIBE_OPTIONS[9]], visual: { icon: Ticket, accent: 'text-violet-300' } },
]

function LifestyleIconTile({ visual, selected, size }: { visual: LifestyleVisual; selected: boolean; size: 'lifestyle' | 'open' }) {
  const Icon = visual.icon

  return (
    <span aria-hidden="true" className={`interest-icon-tile interest-icon-tile--${size} ${visual.accent}${selected ? ' is-selected' : ''}`}>
      <Icon className="interest-icon-tile__artwork" strokeWidth={2} />
    </span>
  )
}

export function LifestyleStep() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <LifestyleForm />}
    </OnboardingShell>
  )
}

function LifestyleForm() {
  const navigate = useNavigate()
  const { profileExtras, saveProfileExtras } = useApp()
  const [lifestyleVibe, setLifestyleVibe] = useState(profileExtras.lifestyleVibe)
  const [openToNewThings, setOpenToNewThings] = useState(profileExtras.openToNewThings)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const canContinue = LIFESTYLE_VIBE_OPTIONS.some((value) => value === lifestyleVibe)

  const handleContinue = async () => {
    if (!canContinue) return
    setSaving(true)
    setError('')
    try {
      await saveProfileExtras({ ...profileExtras, lifestyleVibe, openToNewThings })
      navigate(getOnboardingStep('lifestyle').nextRoute!)
    } catch {
      setError('Could not save your lifestyle. Please try again.')
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
      <OnboardingBackButton to={getOnboardingStep('lifestyle').previousRoute!} className="mb-5" />

      <div className="interests-panel rounded-[2rem] p-1 sm:p-2">
        <header className="mx-auto mb-9 max-w-2xl px-4 text-center sm:mb-11">
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold/70">Shape your profile</p>
          <h1 className="font-serif-display text-4xl text-gradient-gold sm:text-5xl lg:text-6xl">Lifestyle</h1>
          <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">What kind of lifestyle resonates with you most?</p>
        </header>

        <section aria-label="Lifestyle options" className="px-3 sm:px-5">
          <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LIFESTYLE_VIBES.map((vibe) => {
              const isSelected = lifestyleVibe === vibe.title
              return (
                <button
                  type="button"
                  key={vibe.title}
                  aria-pressed={isSelected}
                  onClick={() => setLifestyleVibe(vibe.title)}
                  className={`group relative h-full min-h-40 rounded-[1.35rem] border p-4 text-left transition-all duration-300 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/45 active:scale-[0.985] ${isSelected ? 'border-gold/65 bg-gold/[0.09] shadow-[0_0_34px_-20px_rgba(229,192,123,.95)]' : 'border-white/10 bg-navy/40 hover:border-white/25 hover:bg-white/[0.055]'}`}
                >
                  <LifestyleIconTile visual={vibe.visual} selected={isSelected} size="lifestyle" />
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
            <label htmlFor="open-to-new-things-switch" className="flex min-w-0 flex-1 cursor-pointer items-center gap-4">
              <LifestyleIconTile visual={{ icon: Compass, accent: 'text-violet-200' }} selected={openToNewThings} size="open" />
              <span className="min-w-0 flex-1">
                <span className="block font-serif-display text-xl text-champagne">Open to New Things</span>
                <span className="mt-1 block text-xs leading-5 text-white/45 sm:text-sm">I enjoy trying new experiences and meeting people with different interests.</span>
              </span>
            </label>
            <Switch id="open-to-new-things-switch" className="lifestyle-open-switch" checked={openToNewThings} onCheckedChange={setOpenToNewThings} aria-label="Open to new things" />
          </div>
        </section>

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
            {canContinue ? 'Continue' : 'Choose your lifestyle'}
          </OnboardingPrimaryButton>
        </div>
      </div>
    </motion.main>
  )
}
