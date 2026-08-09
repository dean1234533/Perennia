import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApp } from '@/context/AppContext'
import type { OnboardingData } from '@/context/AppContext'
import type { SelfProfile } from '@/data/selfProfile'
import { geocodeLocation } from '@/lib/geocodeApi'

export function AboutYouDetails() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell step={5} totalSteps={12}>
      {!profileLoaded ? (
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      ) : (
        <AboutYouForm />
      )}
    </OnboardingShell>
  )
}

// Only ever mounted once `profileLoaded` is true, so its useState initial
// values correctly reflect real saved data instead of racing the async
// Firestore fetch — otherwise a refresh mid-onboarding would seed blank
// inputs and Continue would silently overwrite genuinely saved answers.
function AboutYouForm() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding, profileExtras, updateProfileExtras } = useApp()
  const [heightCm, setHeightCm] = useState(onboarding.heightCm ? String(onboarding.heightCm) : '')
  const [country, setCountry] = useState(onboarding.country)
  const [city, setCity] = useState(onboarding.city)
  const [profession, setProfession] = useState(profileExtras.profession)
  const [education, setEducation] = useState(profileExtras.education)
  const [religion, setReligion] = useState(onboarding.religion)
  const [saving, setSaving] = useState(false)

  const canContinue = city.trim() && country.trim()

  const handleContinue = async () => {
    if (!canContinue) return
    setSaving(true)

    const onboardingPatch: Partial<OnboardingData> = {
      heightCm: heightCm ? Number(heightCm) : null,
      country: country.trim(),
      city: city.trim(),
      religion: religion.trim(),
    }
    updateOnboarding(onboardingPatch)
    const extrasPatch: SelfProfile = {
      ...profileExtras,
      profession: profession.trim(),
      education: education.trim(),
      location: `${city.trim()}, ${country.trim()}`,
    }
    await updateProfileExtras(extrasPatch)

    // Best-effort real geocoding for distance-based discovery — never blocks
    // onboarding if the place can't be matched.
    try {
      const geo = await geocodeLocation(`${city.trim()}, ${country.trim()}`)
      updateOnboarding({ currentLocationLat: geo.lat, currentLocationLon: geo.lon })
    } catch {
      // Leave location unset — Discovery already fails open when it's missing.
    }

    setSaving(false)
    navigate('/relationship-goals')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong w-full max-w-md rounded-[2rem] p-8 md:p-10"
    >
      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">01 — About You</p>
      <h1 className="font-serif-display mb-2 text-3xl">Tell Us About You</h1>
      <p className="mb-8 text-sm text-white/55">Real information — this is what other members will see.</p>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="London" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="UK" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input id="height" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="178" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profession">Profession</Label>
          <Input id="profession" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Designer" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="education">Education</Label>
          <Input id="education" value={education} onChange={(e) => setEducation(e.target.value)} placeholder="MA, University College London" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="religion">Religion <span className="text-white/30">(optional)</span></Label>
          <Input id="religion" value={religion} onChange={(e) => setReligion(e.target.value)} placeholder="Prefer not to say" />
        </div>
      </div>

      <Button size="lg" className="mt-8 w-full" disabled={!canContinue || saving} onClick={handleContinue}>
        {saving ? 'Saving…' : <>Continue <ArrowRight className="h-4 w-4" /></>}
      </Button>
    </motion.div>
  )
}
