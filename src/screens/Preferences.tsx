import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Mars, Venus } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { OnboardingBackButton, OnboardingPrimaryButton } from '@/components/ui/onboarding-buttons'
import { useApp } from '@/context/AppContext'
import type { OnboardingData } from '@/context/AppContext'
import { SUPPORTED_GENDERS } from '@/data/onboardingOptions'
import { getOnboardingStep } from '@/lib/onboardingFlow'

type GenderChoice = Exclude<OnboardingData['gender'], ''>

const choices: { value: GenderChoice; label: string; Icon: typeof Mars }[] = [
  { value: SUPPORTED_GENDERS[0], label: 'Man', Icon: Mars },
  { value: SUPPORTED_GENDERS[1], label: 'Woman', Icon: Venus },
]

export function Preferences() {
  return (
    <OnboardingShell>
      <GenderSelectionForm />
    </OnboardingShell>
  )
}

function GenderSelectionForm() {
  const navigate = useNavigate()
  const { onboarding, saveOnboarding } = useApp()
  const [gender, setGender] = useState<OnboardingData['gender']>(onboarding.gender)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const genderComplete = SUPPORTED_GENDERS.some((value) => value === gender)

  const handleContinue = async () => {
    if (!genderComplete) return
    setSaving(true)
    setError('')
    try {
      await saveOnboarding({ gender })
      navigate(getOnboardingStep('preferences').nextRoute!)
    } catch {
      setError('Could not save your preference. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-full max-w-xl flex-col items-center pb-4"
    >
      <OnboardingBackButton to={getOnboardingStep('preferences').previousRoute!} className="mb-8 self-start" />

      <h1 className="font-serif-display text-center text-4xl text-gradient-gold sm:text-5xl">
        I am a…
      </h1>

      <div
        className="mx-auto mt-10 grid w-full max-w-[22rem] grid-cols-2 gap-4 sm:mt-12 sm:max-w-[26rem] sm:gap-5"
        role="radiogroup"
        aria-label="Select whether you are a man or woman"
      >
        {choices.map(({ value, label, Icon }) => {
          const selected = gender === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setGender(value)}
              className={`gender-selection-card group relative flex h-[203px] flex-col items-center justify-center gap-4 rounded-[1.5rem] transition-all duration-300 sm:h-[243px] ${selected ? 'is-selected' : ''}`}
            >
              <Icon
                className={`h-9 w-9 transition-colors sm:h-10 sm:w-10 ${selected ? 'text-champagne' : 'text-white/60 [@media(hover:hover)]:group-hover:text-white/80'}`}
                strokeWidth={1.25}
              />
              <span
                className={`text-xs font-medium uppercase tracking-[.28em] transition-colors ${
                  selected ? 'text-champagne' : 'text-white/60 [@media(hover:hover)]:group-hover:text-white/80'
                }`}
              >
                {label}
              </span>
              <span
                className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition ${
                  selected ? 'border-gold bg-gold text-midnight' : 'border-white/15 text-transparent'
                }`}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            </button>
          )
        })}
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-rose-300">{error}</p>}

      <OnboardingPrimaryButton
        onClick={handleContinue}
        disabled={!genderComplete || saving}
        loading={saving}
        loadingLabel="Saving…"
        showArrow
        className="mx-auto mt-10 w-full max-w-[14rem] sm:mt-12"
      >
        Continue
      </OnboardingPrimaryButton>
    </motion.main>
  )
}
