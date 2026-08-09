import { useState, type ComponentType } from 'react'
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
  CookingPot,
  Dumbbell,
  Earth,
  Heart,
  Languages,
  Leaf,
  Loader2,
  MapPinned,
  Music2,
  Palette,
  PawPrint,
  Plane,
  Sparkles,
  Trophy,
  Users,
  Utensils,
} from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { AVAILABLE_INTERESTS, MIN_ONBOARDING_INTERESTS } from '@/data/interests'

const INTEREST_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Travel: Plane,
  Music: Music2,
  Food: Utensils,
  Fitness: Dumbbell,
  Books: BookOpen,
  Movies: Clapperboard,
  Lifestyle: Heart,
  Hobbies: Sparkles,
  'Favourite Places': MapPinned,
  'Dream Destinations': Earth,
  Languages,
  'Art / Creativity': Palette,
  Photography: Camera,
  'Nature / Outdoors': Leaf,
  Spirituality: Sparkles,
  'Family Time': Users,
  Cooking: CookingPot,
  Sports: Trophy,
  Pets: PawPrint,
  'Personal Growth': BriefcaseBusiness,
}

export function InterestsStep() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell step={6} totalSteps={12}>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <InterestsForm />}
    </OnboardingShell>
  )
}

function InterestsForm() {
  const navigate = useNavigate()
  const { profileExtras, updateProfileExtras } = useApp()
  const [selected, setSelected] = useState<string[]>(profileExtras.interests)
  const [saving, setSaving] = useState(false)
  const remaining = Math.max(0, MIN_ONBOARDING_INTERESTS - selected.length)

  const toggle = (interest: string) => {
    setSelected((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest])
  }

  const handleContinue = async () => {
    if (remaining > 0) return
    setSaving(true)
    await updateProfileExtras({ ...profileExtras, interests: selected })
    setSaving(false)
    navigate('/about-you')
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl pb-4"
    >
      <button onClick={() => navigate('/relationship-goals')} className="mb-5 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="glass-strong rounded-[2rem] p-6 sm:p-9">
        <header className="mx-auto mb-8 max-w-xl text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.26em] text-gold/75">Shape your profile</p>
          <h1 className="font-serif-display text-4xl text-gradient-gold sm:text-5xl">Interests</h1>
          <p className="mt-3 text-sm leading-6 text-white/55 sm:text-base">
            Choose the things that genuinely interest you so we can help shape your profile.
          </p>
        </header>

        <section aria-labelledby="interests-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="interests-heading" className="flex items-center gap-2 font-serif-display text-xl text-champagne">
                <Sparkles className="h-4 w-4 text-gold" /> Your Interests
              </h2>
              <p className="mt-1 text-xs text-white/45">Select at least {MIN_ONBOARDING_INTERESTS}. You can update these later.</p>
            </div>
            <p aria-live="polite" className="shrink-0 text-xs font-medium text-gold/85">{selected.length} selected</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {AVAILABLE_INTERESTS.map((interest) => {
              const isSelected = selected.includes(interest)
              const Icon = INTEREST_ICONS[interest] ?? Sparkles
              return (
                <button
                  type="button"
                  key={interest}
                  aria-pressed={isSelected}
                  onClick={() => toggle(interest)}
                  className={`group flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${isSelected ? 'border-gold/60 bg-gold/10 text-champagne shadow-[0_0_26px_-18px_rgba(229,192,123,.95)]' : 'border-white/10 bg-white/[0.025] text-white/70 hover:border-white/25 hover:bg-white/[0.045]'}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${isSelected ? 'border-gold/30 bg-gold/10 text-gold' : 'border-lavender/20 bg-lavender/[0.06] text-lavender'}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">{interest}</span>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${isSelected ? 'border-gold bg-gold text-midnight' : 'border-white/20 text-transparent'}`}>
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-center text-xs leading-5 text-white/40">
          These interests will appear on your profile and help add context to discovery.
        </div>

        <Button size="lg" className="mt-7 w-full" disabled={remaining > 0 || saving} onClick={handleContinue}>
          {saving ? 'Saving…' : remaining > 0 ? `Choose ${remaining} more` : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </motion.main>
  )
}
