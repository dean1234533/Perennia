import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import type { OnboardingData } from '@/context/AppContext'

const options: { value: NonNullable<OnboardingData['gender']>; label: string; shows: string }[] = [
  { value: 'male', label: 'Male', shows: "We'll show you women" },
  { value: 'female', label: 'Female', shows: "We'll show you men" },
]

export function Preferences() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding } = useApp()
  const [gender, setGender] = useState<OnboardingData['gender']>(onboarding.gender)

  const handleContinue = () => {
    if (!gender) return
    updateOnboarding({ gender })
    navigate('/cosmic-profile')
  }

  return (
    <OnboardingShell step={11} totalSteps={12}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-md rounded-[2rem] p-8 md:p-10"
      >
        <h1 className="font-serif-display mb-2 text-3xl">Who Are You?</h1>
        <p className="mb-8 text-sm text-white/55">
          We'll curate your Discovery collection based on this — you can change it anytime in Settings.
        </p>

        <div className="flex flex-col gap-3">
          {options.map((opt) => {
            const selected = gender === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setGender(opt.value)}
                className={`group relative flex items-center justify-between rounded-2xl border px-5 py-5 text-left transition-all cursor-pointer ${
                  selected
                    ? 'border-gold/50 bg-gold/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                }`}
              >
                <div>
                  <p className={`font-serif-display text-xl ${selected ? 'text-champagne' : 'text-white/90'}`}>
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">{opt.shows}</p>
                </div>
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                    selected ? 'border-gold bg-gold text-midnight' : 'border-white/20 text-transparent'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
              </button>
            )
          })}
        </div>

        <Button size="lg" className="mt-8 w-full" disabled={!gender} onClick={handleContinue}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </OnboardingShell>
  )
}
