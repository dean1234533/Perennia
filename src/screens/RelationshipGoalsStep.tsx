import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { RELATIONSHIP_GOALS } from '@/data/relationshipGoals'

export function RelationshipGoalsStep() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell step={6} totalSteps={12}>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <RelationshipGoalsForm />}
    </OnboardingShell>
  )
}

// Only mounted once profileLoaded — see AboutYouDetails.tsx for why.
function RelationshipGoalsForm() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding } = useApp()
  const [goal, setGoal] = useState(onboarding.relationshipGoal)

  const handleContinue = () => {
    if (!goal) return
    updateOnboarding({ relationshipGoal: goal })
    navigate('/lifestyle')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong w-full max-w-md rounded-[2rem] p-8 md:p-10"
    >
      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">02 — What You're Looking For</p>
      <h1 className="font-serif-display mb-8 text-3xl">What are you looking for?</h1>

      <div className="flex flex-col gap-3">
        {RELATIONSHIP_GOALS.map((opt) => {
          const selected = goal === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setGoal(opt.value)}
              className={`group relative flex items-center justify-between rounded-2xl border px-5 py-5 text-left transition-all cursor-pointer ${
                selected ? 'border-gold/50 bg-gold/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
              }`}
            >
              <div>
                <p className={`font-serif-display text-lg ${selected ? 'text-champagne' : 'text-white/90'}`}>{opt.value}</p>
                <p className="mt-0.5 text-xs text-white/45">{opt.description}</p>
              </div>
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${selected ? 'border-gold bg-gold text-midnight' : 'border-white/20 text-transparent'}`}>
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </div>
            </button>
          )
        })}
      </div>

      <Button size="lg" className="mt-8 w-full" disabled={!goal} onClick={handleContinue}>
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}
