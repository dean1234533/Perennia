import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { AVAILABLE_INTERESTS, MIN_ONBOARDING_INTERESTS } from '@/data/interests'

export function InterestsStep() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell step={8} totalSteps={12}>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <InterestsForm />}
    </OnboardingShell>
  )
}

// Only mounted once profileLoaded — see AboutYouDetails.tsx for why.
function InterestsForm() {
  const navigate = useNavigate()
  const { profileExtras, updateProfileExtras } = useApp()
  const [selected, setSelected] = useState<string[]>(profileExtras.interests)
  const [saving, setSaving] = useState(false)

  const toggle = (interest: string) => {
    setSelected((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]))
  }

  const handleContinue = async () => {
    if (selected.length < MIN_ONBOARDING_INTERESTS) return
    setSaving(true)
    await updateProfileExtras({ ...profileExtras, interests: selected })
    setSaving(false)
    navigate('/values')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong w-full max-w-lg rounded-[2rem] p-8 md:p-10"
    >
      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">04 — Your Interests</p>
      <h1 className="font-serif-display mb-2 text-3xl">What do you love?</h1>
      <p className="mb-6 text-sm text-white/55">
        Choose at least {MIN_ONBOARDING_INTERESTS} — {selected.length} selected.
      </p>

      <div className="flex flex-wrap gap-2">
        {AVAILABLE_INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest)
          return (
            <button
              key={interest}
              onClick={() => toggle(interest)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                isSelected ? 'bg-gold/15 text-champagne border border-gold/30' : 'glass text-white/60 hover:text-white/85'
              }`}
            >
              {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              {interest}
            </button>
          )
        })}
      </div>

      <Button size="lg" className="mt-8 w-full" disabled={selected.length < MIN_ONBOARDING_INTERESTS || saving} onClick={handleContinue}>
        {saving ? 'Saving…' : <>Continue <ArrowRight className="h-4 w-4" /></>}
      </Button>
    </motion.div>
  )
}
