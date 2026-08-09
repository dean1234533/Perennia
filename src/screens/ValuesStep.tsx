import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { AVAILABLE_VALUES } from '@/data/values'

export function ValuesStep() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell step={9} totalSteps={12}>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <ValuesForm />}
    </OnboardingShell>
  )
}

// Only mounted once profileLoaded — see AboutYouDetails.tsx for why.
function ValuesForm() {
  const navigate = useNavigate()
  const { profileExtras, updateProfileExtras } = useApp()
  const [selected, setSelected] = useState<string[]>(profileExtras.values)
  const [saving, setSaving] = useState(false)

  const toggle = (value: string) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  const handleContinue = async () => {
    setSaving(true)
    await updateProfileExtras({ ...profileExtras, values: selected })
    setSaving(false)
    navigate('/your-story')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong w-full max-w-lg rounded-[2rem] p-8 md:p-10"
    >
      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">05 — Your Values</p>
      <h1 className="font-serif-display mb-2 text-3xl">What matters to you?</h1>
      <p className="mb-6 text-sm text-white/55">Optional — choose as many as feel true.</p>

      <div className="flex flex-wrap gap-2">
        {AVAILABLE_VALUES.map((value) => {
          const isSelected = selected.includes(value)
          return (
            <button
              key={value}
              onClick={() => toggle(value)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                isSelected ? 'bg-gold/15 text-champagne border border-gold/30' : 'glass text-white/60 hover:text-white/85'
              }`}
            >
              {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              {value}
            </button>
          )
        })}
      </div>

      <Button size="lg" className="mt-8 w-full" onClick={handleContinue} disabled={saving}>
        {saving ? 'Saving…' : <>Continue <ArrowRight className="h-4 w-4" /></>}
      </Button>
    </motion.div>
  )
}
