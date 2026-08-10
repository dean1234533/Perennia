import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Clock3, Loader2, Sparkles } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/context/AppContext'
import { DEAL_BREAKER_OPTIONS, PARTNER_VALUE_OPTIONS, RELATIONSHIP_GOALS } from '@/data/relationshipGoals'

export function RelationshipGoalsStep() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell step={6} totalSteps={12}>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <RelationshipGoalsForm />}
    </OnboardingShell>
  )
}

function RelationshipGoalsForm() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding } = useApp()
  const [goal, setGoal] = useState(onboarding.relationshipGoal)
  const [dealBreakers, setDealBreakers] = useState(onboarding.relationshipDealBreakers)
  const [partnerValues, setPartnerValues] = useState(onboarding.partnerValues)
  const [prioritiseSameGoal, setPrioritiseSameGoal] = useState(onboarding.prioritiseSameRelationshipGoal)

  const toggle = (value: string, values: string[], setValues: (next: string[]) => void) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  const handleContinue = () => {
    if (!goal) return
    updateOnboarding({
      relationshipGoal: goal,
      relationshipGoalSelectedAt: goal === 'Not Sure Yet' ? onboarding.relationshipGoalSelectedAt || new Date().toISOString() : '',
      relationshipDealBreakers: dealBreakers,
      partnerValues,
      prioritiseSameRelationshipGoal: prioritiseSameGoal,
    })
    navigate('/interests')
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl pb-4"
    >
      <button onClick={() => navigate('/preferences')} className="mb-5 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="glass-strong rounded-[2rem] p-6 sm:p-9">
        <header className="mx-auto mb-8 max-w-xl text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.26em] text-gold/75">Your intentions</p>
          <h1 className="font-serif-display text-4xl text-gradient-gold sm:text-5xl">Relationship Interest</h1>
          <p className="mt-3 text-sm leading-6 text-white/55 sm:text-base">
            Help us understand what you’re looking for so we can introduce you to people with compatible intentions.
          </p>
        </header>

        <section aria-labelledby="relationship-goal-heading">
          <h2 id="relationship-goal-heading" className="mb-3 flex items-center gap-2 font-serif-display text-xl text-champagne">
            <Sparkles className="h-4 w-4 text-gold" /> Relationship Goal
          </h2>
          <div className="flex flex-col gap-3" role="radiogroup">
            {RELATIONSHIP_GOALS.map((option) => {
              const selected = goal === option.value
              return (
                <button
                  key={option.value}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setGoal(option.value)}
                  className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${selected ? 'border-gold/60 bg-gold/10 shadow-[0_0_28px_-18px_rgba(229,192,123,.9)]' : 'border-white/10 bg-white/[0.025] hover:border-white/25'}`}
                >
                  <span>
                    <span className={`block text-sm font-medium sm:text-base ${selected ? 'text-champagne' : 'text-white/90'}`}>{option.value}</span>
                    <span className="mt-1 block text-xs leading-5 text-white/45 sm:text-sm">{option.description}</span>
                    {'temporary' in option && option.temporary && (
                      <span className="mt-2 flex items-center gap-1.5 text-xs text-gold/80"><Clock3 className="h-3.5 w-3.5" /> Available for up to one week</span>
                    )}
                  </span>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-gold bg-gold text-midnight' : 'border-white/25 text-transparent'}`}>
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="deal-breakers-heading">
          <h2 id="deal-breakers-heading" className="font-serif-display text-xl text-champagne">Deal Breakers <span className="font-sans text-xs text-white/35">(Optional)</span></h2>
          <p className="mb-3 mt-1 text-xs text-white/45">Choose anything that would make a relationship unsuitable.</p>
          <div className="flex flex-wrap gap-2">
            {DEAL_BREAKER_OPTIONS.map((item) => <ChoiceChip key={item} label={item} selected={dealBreakers.includes(item)} onClick={() => toggle(item, dealBreakers, setDealBreakers)} />)}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="values-heading">
          <h2 id="values-heading" className="font-serif-display text-xl text-champagne">Important to Me</h2>
          <p className="mb-3 mt-1 text-xs text-white/45">Choose the qualities you value most in a partner.</p>
          <div className="flex flex-wrap gap-2">
            {PARTNER_VALUE_OPTIONS.map((item) => <ChoiceChip key={item} label={item} selected={partnerValues.includes(item)} onClick={() => toggle(item, partnerValues, setPartnerValues)} />)}
          </div>
        </section>

        <div className="mt-8 flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div>
            <p className="text-sm font-medium text-white/90">Prioritise people who want the same</p>
            <p className="mt-1 text-xs leading-5 text-white/45">Use relationship intention as an additional matching preference.</p>
          </div>
          <Switch checked={prioritiseSameGoal} onCheckedChange={setPrioritiseSameGoal} aria-label="Prioritise people with the same relationship intention" />
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-white/35">Your astrological compatibility score is calculated separately from these preferences.</p>

        <Button size="lg" className="mt-7 w-full" disabled={!goal} onClick={handleContinue}>
          Continue to interests <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.main>
  )
}

function ChoiceChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs transition sm:text-sm ${selected ? 'border-gold/55 bg-gold/10 text-champagne' : 'border-white/10 bg-white/[0.025] text-white/55 hover:border-white/25 hover:text-white/80'}`}
    >
      {label}{selected && <Check className="h-3.5 w-3.5 text-gold" strokeWidth={3} />}
    </button>
  )
}
