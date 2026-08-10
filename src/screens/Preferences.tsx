import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import type { OnboardingData } from '@/context/AppContext'

type GenderChoice = Exclude<OnboardingData['gender'], ''>

const choices: { value: GenderChoice; label: string; symbol: string }[] = [
  { value: 'male', label: 'Man', symbol: '♂' },
  { value: 'female', label: 'Woman', symbol: '♀' },
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
      className="w-full max-w-xl pb-4"
    >
      <button
        type="button"
        onClick={() => navigate('/birth-details')}
        className="mb-5 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="glass-strong rounded-[2rem] border border-blue-200/20 bg-[#08162f]/75 p-6 shadow-[0_0_48px_rgba(85,104,230,.14)] sm:p-9">
        <header className="mx-auto mb-8 max-w-md text-center">
          <h1 className="font-serif-display bg-gradient-to-r from-blue-200 via-white to-violet-200 bg-clip-text text-4xl text-transparent sm:text-5xl">
            Tell Us About You
          </h1>
          <p className="mt-3 text-sm text-white/55 sm:text-base">How do you identify?</p>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:gap-5" role="radiogroup" aria-label="Select whether you are a man or woman">
          {choices.map((choice) => {
            const selected = gender === choice.value
            return (
              <button
                key={choice.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setGender(choice.value)}
                className={`relative flex min-h-44 flex-col items-center justify-center rounded-[1.65rem] border px-4 py-7 transition-all duration-300 sm:min-h-52 ${
                  selected
                    ? 'border-blue-200/75 bg-gradient-to-b from-blue-400/15 to-violet-500/12 shadow-[0_0_34px_rgba(103,126,255,.3),inset_0_0_28px_rgba(123,98,255,.08)]'
                    : 'border-white/12 bg-white/[.025] hover:border-blue-200/35 hover:bg-white/[.045]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`font-serif-display text-6xl leading-none transition-all sm:text-7xl ${
                    selected ? 'text-blue-100 drop-shadow-[0_0_16px_rgba(138,159,255,.8)]' : 'text-white/70'
                  }`}
                >
                  {choice.symbol}
                </span>
                <span className={`mt-5 text-xs font-medium uppercase tracking-[.28em] sm:text-sm ${selected ? 'text-blue-100' : 'text-white/70'}`}>
                  {choice.label}
                </span>
                <span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border transition ${selected ? 'border-blue-200 bg-blue-200 text-[#08142d]' : 'border-white/15 text-transparent'}`}>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              </button>
            )
          })}
        </div>

        <Button size="lg" className="mt-8 w-full" disabled={!gender} onClick={handleContinue}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.main>
  )
}
