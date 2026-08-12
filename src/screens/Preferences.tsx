import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Mars, Venus } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import type { OnboardingData } from '@/context/AppContext'

type GenderChoice = Exclude<OnboardingData['gender'], ''>

const choices: { value: GenderChoice; label: string; Icon: typeof Mars }[] = [
  { value: 'male', label: 'Man', Icon: Mars },
  { value: 'female', label: 'Woman', Icon: Venus },
]

export function Preferences() {
  return (
    <OnboardingShell step={5} totalSteps={12}>
      <GenderSelectionForm />
    </OnboardingShell>
  )
}

function GenderSelectionForm() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding } = useApp()
  const [gender, setGender] = useState<OnboardingData['gender']>(onboarding.gender)

  const handleContinue = () => {
    if (!gender) return
    updateOnboarding({ gender })
    navigate('/relationship-goals')
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-full max-w-xl flex-col items-center pb-4"
    >
      <button
        type="button"
        onClick={() => navigate('/birth-details')}
        className="mb-8 inline-flex items-center gap-2 self-start text-sm text-white/50 transition-colors [@media(hover:hover)]:hover:text-white/85"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-serif-display text-center text-4xl text-gradient-gold sm:text-5xl">
        I am a…
      </h1>

      <div
        className="mx-auto mt-10 grid w-full max-w-xs grid-cols-2 gap-4 sm:mt-12 sm:max-w-sm sm:gap-5"
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
              className={`group relative flex aspect-[3/4] flex-col items-center justify-center gap-4 rounded-[1.5rem] border backdrop-blur-md transition-all duration-300 [@media(hover:hover)]:hover:-translate-y-0.5 ${
                selected
                  ? 'border-gold/60 bg-gold/[.06] shadow-[0_0_26px_-6px_rgba(229,192,123,.4)]'
                  : 'border-white/12 bg-white/[.03] [@media(hover:hover)]:hover:border-champagne/35 [@media(hover:hover)]:hover:bg-white/[.05] [@media(hover:hover)]:hover:shadow-[0_0_20px_-8px_rgba(229,192,123,.3)]'
              }`}
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

      <Button
        size="lg"
        onClick={handleContinue}
        disabled={!gender}
        className="mx-auto mt-10 w-full max-w-[14rem] shadow-[0_4px_18px_-6px_rgba(212,175,106,.45)] disabled:text-midnight/70 disabled:opacity-70 sm:mt-12"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.main>
  )
}
