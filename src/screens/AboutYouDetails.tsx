import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BriefcaseBusiness, ChevronDown, GraduationCap, Languages, Loader2, Search, X } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useApp } from '@/context/AppContext'

const EDUCATION_OPTIONS = [
  'Secondary School',
  'College / Sixth Form',
  'Apprenticeship / Vocational',
  'Undergraduate Degree',
  'Postgraduate Degree',
  'Doctorate / PhD',
  'Other',
  'Prefer not to say',
]

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch',
  'Polish', 'Romanian', 'Greek', 'Russian', 'Ukrainian', 'Arabic', 'Hebrew',
  'Turkish', 'Persian', 'Hindi', 'Urdu', 'Bengali', 'Punjabi', 'Mandarin Chinese',
  'Cantonese', 'Japanese', 'Korean', 'Vietnamese', 'Thai', 'Indonesian',
  'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Irish', 'Welsh', 'Swahili',
  'British Sign Language', 'American Sign Language',
]

export function AboutYouDetails() {
  const { profileLoaded } = useApp()
  return (
    <OnboardingShell step={7} totalSteps={12}>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <AboutYouForm />}
    </OnboardingShell>
  )
}

function AboutYouForm() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding, profileExtras, updateProfileExtras } = useApp()
  const [profession, setProfession] = useState(profileExtras.profession)
  const [hideProfession, setHideProfession] = useState(profileExtras.profession === 'Prefer not to say')
  const [education, setEducation] = useState(profileExtras.education)
  const [languages, setLanguages] = useState(profileExtras.languages)
  const [saving, setSaving] = useState(false)

  const handleContinue = async () => {
    setSaving(true)
    await updateProfileExtras({
      ...profileExtras,
      profession: hideProfession ? 'Prefer not to say' : profession.trim(),
      education,
      languages,
      location: profileExtras.location || [onboarding.city, onboarding.country].filter(Boolean).join(', '),
    })
    updateOnboarding({ aboutYouCompletedAt: new Date().toISOString() })
    setSaving(false)
    navigate('/profile-photo')
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-xl pb-4"
    >
      <header className="mb-7 text-center">
        <h1 className="font-serif-display bg-gradient-to-r from-blue-200 via-white to-violet-200 bg-clip-text text-4xl text-transparent sm:text-5xl">About You</h1>
        <p className="mt-2 text-sm text-white/55 sm:text-base">Tell us a little more about your everyday life.</p>
      </header>

      <div className="about-you-card glass-strong rounded-[2rem] border-blue-200/25 p-6 shadow-[0_0_42px_rgba(83,105,220,.16)] sm:p-9">
        <div className="space-y-7">
          <section className="space-y-3">
            <Label htmlFor="profession" className="text-sm text-white/85">Profession / Job Title</Label>
            <div className="relative">
              <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200/60" />
              <Input
                id="profession" value={hideProfession ? '' : profession} disabled={hideProfession}
                onChange={(event) => setProfession(event.target.value)}
                placeholder="e.g. Teacher, Engineer, Designer"
                className="h-14 border-blue-200/30 bg-navy/40 pl-11 text-base focus:border-blue-200/65"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-white/60">
              <input
                type="checkbox" checked={hideProfession}
                onChange={(event) => setHideProfession(event.target.checked)}
                className="h-4 w-4 rounded border-white/25 bg-navy/50 accent-blue-400"
              />
              Prefer not to say
            </label>
            <p className="text-xs text-white/35">This can appear on your finished profile.</p>
          </section>

          <div className="h-px bg-white/10" />

          <section className="space-y-3">
            <Label htmlFor="education" className="text-sm text-white/85">Education</Label>
            <Select
              id="education" value={education} onChange={(event) => setEducation(event.target.value)}
              icon={<GraduationCap className="h-4 w-4" />}
            >
              <option value="" disabled>Select education</option>
              {EDUCATION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </Select>
          </section>

          <div className="h-px bg-white/10" />

          <section className="space-y-3">
            <Label className="text-sm text-white/85">Languages</Label>
            <LanguageMultiSelect values={languages} onChange={setLanguages} />
            <p className="text-xs text-white/35">Choose every language you speak. You can update these later.</p>
          </section>
        </div>

        <Button size="lg" className="mt-9 w-full" onClick={handleContinue} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </Button>
        <p className="mt-4 text-center text-xs text-white/35">You can update this information later from your profile.</p>
      </div>
    </motion.main>
  )
}

function LanguageMultiSelect({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const options = useMemo(
    () => LANGUAGE_OPTIONS.filter((language) => language.toLowerCase().includes(query.trim().toLowerCase()) && !values.includes(language)),
    [query, values]
  )

  const remove = (language: string) => onChange(values.filter((value) => value !== language))
  const add = (language: string) => {
    onChange([...values, language])
    setQuery('')
  }

  return (
    <div className="relative">
      <Languages className="pointer-events-none absolute left-4 top-5 z-10 h-4 w-4 text-blue-200/60" />
      <button
        type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}
        className="flex min-h-14 w-full items-center gap-2 rounded-xl border border-blue-200/35 bg-navy/40 py-2 pl-11 pr-10 text-left transition focus:border-blue-200/70 focus:outline-none"
      >
        {values.length === 0 ? <span className="text-base text-white/35">Select languages</span> : (
          <span className="flex flex-wrap gap-1.5">
            {values.map((language) => (
              <span key={language} className="flex items-center gap-1 rounded-full border border-blue-200/25 bg-blue-400/10 px-2.5 py-1 text-xs text-blue-100">
                {language}
                <span
                  role="button" tabIndex={0} aria-label={`Remove ${language}`}
                  onClick={(event) => { event.stopPropagation(); remove(language) }}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') remove(language) }}
                ><X className="h-3 w-3" /></span>
              </span>
            ))}
          </span>
        )}
      </button>
      <ChevronDown className="pointer-events-none absolute right-4 top-5 h-4 w-4 text-white/40" />

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-blue-200/20 bg-[#08132f]/98 shadow-2xl backdrop-blur-xl">
          <div className="relative border-b border-white/10 p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              autoFocus value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Search languages"
              className="h-10 w-full rounded-lg bg-white/[.04] pl-10 pr-3 text-base text-white outline-none placeholder:text-white/30"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((language) => (
              <button key={language} type="button" onClick={() => add(language)} className="block w-full px-4 py-2.5 text-left text-sm text-white/75 hover:bg-blue-400/10 hover:text-white">{language}</button>
            ))}
            {options.length === 0 && <p className="px-4 py-4 text-center text-xs text-white/35">No more matching languages</p>}
          </div>
        </div>
      )}
    </div>
  )
}
