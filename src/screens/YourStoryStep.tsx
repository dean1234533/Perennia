import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useApp } from '@/context/AppContext'
import { STORY_PROMPTS } from '@/data/storyPrompts'

export function YourStoryStep() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell step={10} totalSteps={12}>
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

  const handleContinue = async () => {
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
      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Your introduction</p>
      <h1 className="font-serif-display mb-2 text-3xl">Short Intro &amp; Bio</h1>
      <p className="mb-6 text-sm text-white/55">Share a little personality before previewing your profile. Everything here is optional.</p>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="about">About You</Label>
          <textarea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={3}
            placeholder="A short introduction..."
            className="your-story-field rounded-xl p-3 text-sm text-white outline-none focus:border-gold/40"
          />
        </div>

        {STORY_PROMPTS.map((question) => (
          <div key={question} className="flex flex-col gap-2">
            <Label>{question}</Label>
            <textarea
              value={answers[question] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [question]: e.target.value }))}
              rows={2}
              className="your-story-field rounded-xl p-3 text-sm text-white outline-none focus:border-gold/40"
            />
          </div>
        ))}
      </div>

      <Button size="lg" className="your-story-continue-button mt-8 w-full" onClick={handleContinue} disabled={saving}>
        {saving ? 'Saving…' : <>Continue <ArrowRight className="h-4 w-4" /></>}
      </Button>
    </motion.div>
  )
}
