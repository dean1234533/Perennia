import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { OnboardingBackButton, OnboardingPrimaryButton } from '@/components/ui/onboarding-buttons'
import { useApp } from '@/context/AppContext'
import { AVAILABLE_VALUES } from '@/data/values'
import { getOnboardingStep } from '@/lib/onboardingFlow'

const approvedValues = new Set<string>(AVAILABLE_VALUES)

export function ValuesStep() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <ValuesForm />}
    </OnboardingShell>
  )
}

function ValuesForm() {
  const navigate = useNavigate()
  const { profileExtras, saveProfileExtras } = useApp()
  const [selected, setSelected] = useState<string[]>(() => [...new Set(profileExtras.values)])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const canContinue = selected.some((value) => approvedValues.has(value))

  const toggle = (value: string) => {
    setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }

  const handleContinue = async () => {
    if (!canContinue) return
    setSaving(true)
    setError('')
    try {
      await saveProfileExtras({ ...profileExtras, values: selected })
      navigate(getOnboardingStep('values').nextRoute!)
    } catch {
      setError('Could not save your values. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-lg pb-6"
    >
      <OnboardingBackButton to={getOnboardingStep('values').previousRoute!} className="mb-5" />

      <div className="glass-strong rounded-[2rem] p-8 md:p-10">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Your Values</p>
        <h1 className="font-serif-display mb-2 text-3xl">What matters to you?</h1>
        <p className="mb-6 text-sm text-white/55">Choose at least one value that feels true to you.</p>

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_VALUES.map((value) => {
            const isSelected = selected.includes(value)
            return (
              <button
                type="button"
                key={value}
                aria-pressed={isSelected}
                onClick={() => toggle(value)}
                className={`flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/45 ${isSelected ? 'border border-gold/30 bg-gold/15 text-champagne' : 'glass text-white/60 hover:text-white/85'}`}
              >
                {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                {value}
              </button>
            )
          })}
        </div>

        {error && <p role="alert" className="mt-6 text-center text-sm text-rose-300">{error}</p>}

        <OnboardingPrimaryButton
          className="values-continue-button mt-8 w-full"
          disabled={!canContinue || saving}
          loading={saving}
          loadingLabel="Saving…"
          showArrow={canContinue}
          onClick={handleContinue}
        >
          {canContinue ? 'Continue' : 'Choose at least one value'}
        </OnboardingPrimaryButton>
      </div>
    </motion.main>
  )
}
