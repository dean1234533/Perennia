import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Brain,
  Check,
  Cigarette,
  CircleHelp,
  Clock3,
  Heart,
  HeartCrack,
  HeartHandshake,
  Info,
  Link2,
  Loader2,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Smile,
  Sparkles,
  Sprout,
  Star,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/context/AppContext'
import { hasDevelopmentVerificationBypass } from '@/lib/developmentVerification'
import {
  DEAL_BREAKER_OPTIONS,
  isNotSureGoalExpired,
  NOT_SURE_GOAL,
  PARTNER_VALUE_OPTIONS,
  RELATIONSHIP_GOALS,
} from '@/data/relationshipGoals'

const MAX_DEAL_BREAKERS = 3
const MAX_PARTNER_VALUES = 4

const GOAL_ICONS: Record<string, { icon: LucideIcon; colour: string }> = {
  'Long-term Relationship / Marriage': { icon: HeartHandshake, colour: 'text-violet-300' },
  'Something Serious': { icon: Link2, colour: 'text-amber-200' },
  'Open to Exploring': { icon: Sprout, colour: 'text-cyan-300' },
  [NOT_SURE_GOAL]: { icon: CircleHelp, colour: 'text-fuchsia-300' },
}

const CHIP_ICONS: Record<string, { icon: LucideIcon; colour: string }> = {
  Dishonesty: { icon: ShieldCheck, colour: 'text-amber-200' },
  'Poor communication': { icon: MessageCircle, colour: 'text-cyan-300' },
  "Doesn't want children": { icon: Baby, colour: 'text-violet-300' },
  'Different family goals': { icon: Users, colour: 'text-pink-300' },
  Smoking: { icon: Cigarette, colour: 'text-slate-300' },
  'Emotional unavailability': { icon: HeartCrack, colour: 'text-fuchsia-300' },
  Kindness: { icon: Heart, colour: 'text-pink-300' },
  Loyalty: { icon: ShieldCheck, colour: 'text-cyan-300' },
  Ambition: { icon: Trophy, colour: 'text-amber-200' },
  'Family Values': { icon: Users, colour: 'text-violet-300' },
  'Emotional Maturity': { icon: Brain, colour: 'text-emerald-300' },
  'Sense of Humour': { icon: Smile, colour: 'text-yellow-200' },
  'Spiritual Connection': { icon: Star, colour: 'text-indigo-300' },
}

export function RelationshipGoalsStep() {
  const { profileLoaded } = useApp()
  const canRenderLocalPreview = hasDevelopmentVerificationBypass()

  return (
    <OnboardingShell step={6} totalSteps={12}>
      {!profileLoaded && !canRenderLocalPreview ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <RelationshipGoalsForm />}
    </OnboardingShell>
  )
}

function RelationshipGoalsForm() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding } = useApp()
  const temporaryGoalExpired = onboarding.relationshipGoalSelectedAt
    ? isNotSureGoalExpired(onboarding.relationshipGoalSelectedAt)
    : false
  const [goal, setGoal] = useState(
    onboarding.relationshipGoal === NOT_SURE_GOAL && temporaryGoalExpired ? '' : onboarding.relationshipGoal
  )
  const [dealBreakers, setDealBreakers] = useState(onboarding.relationshipDealBreakers)
  const [partnerValues, setPartnerValues] = useState(onboarding.partnerValues)
  const [prioritiseSameGoal, setPrioritiseSameGoal] = useState(onboarding.prioritiseSameRelationshipGoal)

  const toggle = (value: string, values: string[], limit: number, setValues: (next: string[]) => void) => {
    if (values.includes(value)) {
      setValues(values.filter((item) => item !== value))
    } else if (values.length < limit) {
      setValues([...values, value])
    }
  }

  const handleContinue = () => {
    if (!goal) return
    updateOnboarding({
      relationshipGoal: goal,
      relationshipGoalSelectedAt: goal === NOT_SURE_GOAL
        ? onboarding.relationshipGoalSelectedAt || new Date().toISOString()
        : onboarding.relationshipGoalSelectedAt,
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
      className="w-full max-w-3xl pb-4"
    >
      <button onClick={() => navigate('/preferences')} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-navy/25 px-3.5 text-sm text-white/65 transition hover:border-gold/30 hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/45">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="relationship-interest-panel rounded-[2rem] p-5 sm:p-9">
        <header className="mx-auto mb-8 max-w-xl text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.26em] text-gold/75">Your intentions</p>
          <h1 className="font-serif-display text-4xl text-gradient-gold sm:text-5xl">Relationship Interest</h1>
          <p className="mt-3 text-sm leading-6 text-white/68 sm:text-base">
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
              const expired = option.value === NOT_SURE_GOAL && temporaryGoalExpired
              const goalVisual = GOAL_ICONS[option.value]
              const GoalIcon = goalVisual.icon
              return (
                <button
                  key={option.value}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setGoal(option.value)}
                  disabled={expired}
                  className={`group flex min-h-20 items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all active:scale-[.99] sm:px-5 ${selected ? 'border-gold/65 bg-gold/[.09] shadow-[0_0_30px_-17px_rgba(229,192,123,.9)]' : 'border-white/12 bg-navy/30 hover:border-blue-200/35 hover:bg-blue-950/30 hover:shadow-[0_0_28px_-20px_rgba(133,156,255,.8)]'} disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[.035] ${goalVisual.colour} shadow-[0_0_18px_-8px_currentColor]`}>
                    <GoalIcon className="h-6 w-6" strokeWidth={1.45} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-medium sm:text-base ${selected ? 'text-champagne' : 'text-white/90'}`}>{option.value}</span>
                    <span className="mt-1 block text-xs leading-5 text-white/45 sm:text-sm">{option.description}</span>
                    {'temporary' in option && option.temporary && (
                      <span className="mt-2 flex items-center gap-1.5 text-xs text-gold/85"><Clock3 className="h-3.5 w-3.5" /> {expired ? 'Your one-week period has ended' : 'Available for up to one week'}</span>
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

        <aside className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-200/15 bg-blue-950/25 p-4 text-left" aria-label="Compatibility information">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/[.07] text-violet-200">
            <Heart className="h-5 w-5" strokeWidth={1.5} />
            <LockKeyhole className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-navy p-0.5 text-gold" />
          </span>
          <p className="pt-0.5 text-sm leading-6 text-white/72">We only show you people who are <strong className="font-medium text-champagne">80%+ compatible</strong> based on your astrological profile.</p>
        </aside>

        <section className="mt-8" aria-labelledby="deal-breakers-heading">
          <h2 id="deal-breakers-heading" className="font-serif-display text-xl text-champagne">Deal Breakers <span className="font-sans text-xs text-white/35">(Optional)</span></h2>
          <p id="deal-breakers-help" className="mb-3 mt-1 text-xs text-white/55">Choose up to 3 things that would make a relationship unsuitable.</p>
          <div className="flex flex-wrap gap-2">
            {DEAL_BREAKER_OPTIONS.map((item) => <ChoiceChip key={item} label={item} selected={dealBreakers.includes(item)} disabled={!dealBreakers.includes(item) && dealBreakers.length >= MAX_DEAL_BREAKERS} onClick={() => toggle(item, dealBreakers, MAX_DEAL_BREAKERS, setDealBreakers)} />)}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="values-heading">
          <h2 id="values-heading" className="font-serif-display text-xl text-champagne">Important to Me</h2>
          <p id="values-help" className="mb-3 mt-1 text-xs text-white/55">Choose up to 4 qualities you value most in a partner.</p>
          <div className="flex flex-wrap gap-2">
            {PARTNER_VALUE_OPTIONS.map((item) => <ChoiceChip key={item} label={item} selected={partnerValues.includes(item)} disabled={!partnerValues.includes(item) && partnerValues.length >= MAX_PARTNER_VALUES} onClick={() => toggle(item, partnerValues, MAX_PARTNER_VALUES, setPartnerValues)} />)}
          </div>
        </section>

        <div className="mt-8 flex items-center justify-between gap-5 rounded-2xl border border-white/12 bg-navy/30 p-5">
          <div>
            <p className="text-sm font-medium text-white/90">Prioritise people who want the same</p>
            <p className="mt-1 text-xs leading-5 text-white/55">Use relationship intention as an additional matching preference.</p>
          </div>
          <Switch checked={prioritiseSameGoal} onCheckedChange={setPrioritiseSameGoal} aria-label="Prioritise people with the same relationship intention" />
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs leading-5 text-white/48"><Info className="h-3.5 w-3.5 shrink-0 text-gold/65" /> Your astrological compatibility score is calculated separately from these preferences.</p>

        <Button size="lg" className="relationship-interest-continue mt-7 w-full" disabled={!goal} onClick={handleContinue}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.main>
  )
}

function ChoiceChip({ label, selected, disabled, onClick }: { label: string; selected: boolean; disabled: boolean; onClick: () => void }) {
  const chipVisual = CHIP_ICONS[label]
  const ChipIcon = chipVisual.icon
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-xs transition active:scale-[.98] sm:text-sm ${selected ? 'border-gold/60 bg-gold/10 text-champagne shadow-[0_0_18px_-12px_rgba(229,192,123,.9)]' : 'border-white/12 bg-navy/30 text-white/65 hover:border-white/30 hover:text-white/90'} disabled:cursor-not-allowed disabled:opacity-35`}
    >
      <ChipIcon className={`h-3.5 w-3.5 ${chipVisual.colour}`} strokeWidth={1.7} />
      {label}{selected && <Check className="h-3.5 w-3.5 text-gold" strokeWidth={3} />}
    </button>
  )
}
