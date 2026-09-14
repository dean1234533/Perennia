import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Label } from '@/components/ui/label'
import { OnboardingBackButton, OnboardingPrimaryButton } from '@/components/ui/onboarding-buttons'
import { useApp } from '@/context/AppContext'
import { STORY_PROMPTS } from '@/data/storyPrompts'

const BIO_MIN_LENGTH = 50
const BIO_MAX_LENGTH = 500
const PROMPT_MIN_LENGTH = 20
const PROMPT_MAX_LENGTH = 300
const REQUIRED_PROMPT_ANSWERS = 2

export function YourStoryStep() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell step={11} totalSteps={12}>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <YourStoryForm />}
    </OnboardingShell>
  )
}

// Only mounted once profileLoaded — see AboutYouDetails.tsx for why.
function YourStoryForm() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding, profileExtras, updateProfileExtras } = useApp()
  const [about, setAbout] = useState(profileExtras.about)
  const existingByQuestion = Object.fromEntries(onboarding.storyPrompts.map((p) => [p.question, p.answer]))
  const [answers, setAnswers] = useState<Record<string, string>>(existingByQuestion)
  const [saving, setSaving] = useState(false)
  const aboutLength = about.trim().length
  const aboutComplete = aboutLength >= BIO_MIN_LENGTH && aboutLength <= BIO_MAX_LENGTH
  const validPromptCount = STORY_PROMPTS.filter((question) => {
    const length = (answers[question] ?? '').trim().length
    return length >= PROMPT_MIN_LENGTH && length <= PROMPT_MAX_LENGTH
  }).length
  const remainingPrompts = Math.max(0, REQUIRED_PROMPT_ANSWERS - validPromptCount)
  const canContinue = aboutComplete && remainingPrompts === 0
  const continueLabel = !aboutComplete
    ? 'Write your short intro'
    : remainingPrompts === 2
      ? 'Answer 2 more prompts'
      : remainingPrompts === 1
        ? 'Answer 1 more prompt'
        : 'Continue'

  const handleContinue = async () => {
    if (!canContinue) return
    setSaving(true)
    await updateProfileExtras({ ...profileExtras, about: about.trim() })
    const storyPrompts = STORY_PROMPTS.filter((q) => answers[q]?.trim()).map((q) => ({ question: q, answer: answers[q].trim() }))
    updateOnboarding({ storyPrompts })
    setSaving(false)
    navigate('/cosmic-profile')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="your-story-panel w-full max-w-lg rounded-[2rem] p-8 md:p-10"
    >
      <OnboardingBackButton to="/profile-photo" className="mb-5" />

      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Your introduction</p>
      <h1 className="font-serif-display mb-2 text-3xl">Short Intro &amp; Bio</h1>
      <p className="mb-6 text-sm text-white/55">Write a short intro and answer at least 2 prompts.</p>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="about">About You</Label>
          <textarea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={3}
            maxLength={BIO_MAX_LENGTH}
            placeholder="A short introduction..."
            className="your-story-field rounded-xl p-3 text-sm text-white outline-none focus:border-gold/40"
          />
          <p className={`text-right text-xs ${aboutComplete ? 'text-white/45' : 'text-white/65'}`}>
            {aboutLength} / {BIO_MAX_LENGTH} characters · minimum {BIO_MIN_LENGTH}
          </p>
        </div>

        {STORY_PROMPTS.map((question) => {
          const answer = answers[question] ?? ''
          const answerLength = answer.trim().length
          const answerComplete = answerLength >= PROMPT_MIN_LENGTH && answerLength <= PROMPT_MAX_LENGTH

          return (
            <div key={question} className="flex flex-col gap-2">
              <Label>{question}</Label>
              <textarea
                value={answer}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [question]: e.target.value }))}
                rows={2}
                maxLength={PROMPT_MAX_LENGTH}
                className="your-story-field rounded-xl p-3 text-sm text-white outline-none focus:border-gold/40"
              />
              <p className={`text-right text-xs ${answerComplete ? 'text-white/45' : 'text-white/65'}`}>
                {answerLength} / {PROMPT_MAX_LENGTH} characters · minimum {PROMPT_MIN_LENGTH}
              </p>
            </div>
          )
        })}
      </div>

      <OnboardingPrimaryButton
        className="mt-8 w-full"
        disabled={!canContinue || saving}
        loading={saving}
        loadingLabel="Saving…"
        showArrow={canContinue}
        onClick={handleContinue}
      >
        {continueLabel}
      </OnboardingPrimaryButton>
    </motion.div>
  )
}
