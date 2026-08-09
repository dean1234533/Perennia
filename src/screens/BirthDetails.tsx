import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Globe2, ArrowRight, Loader2, ShieldCheck, Calendar } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CityCombobox } from '@/components/shared/CityCombobox'
import { useApp } from '@/context/AppContext'
import { computeNatalChart } from '@/lib/natalChart'
import { firebaseConfigured } from '@/lib/firebase'
import { COUNTRIES, countryName } from '@/data/countries'
import { TIME_OPTIONS } from '@/lib/timeOptions'
import type { CityMatch } from '@/lib/citySearchApi'

function formatBirthDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

export function BirthDetails() {
  const { onboarding } = useApp()

  // Once a member has confirmed their birth details here, the field is
  // locked (also enforced server-side in firestore.rules) — this screen
  // then shows a read-only summary instead of an editable form.
  const locked = !!onboarding.birthCity

  if (locked) {
    return (
      <OnboardingShell step={4} totalSteps={12}>
        <LockedSummary />
      </OnboardingShell>
    )
  }

  return (
    <OnboardingShell step={4} totalSteps={12}>
      <BirthDetailsForm />
    </OnboardingShell>
  )
}

function LockedSummary() {
  const navigate = useNavigate()
  const { onboarding } = useApp()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong w-full max-w-md rounded-[2rem] p-8 text-center md:p-10"
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
        <ShieldCheck className="h-8 w-8 text-emerald-400" />
      </div>
      <h1 className="font-serif-display mb-2 text-3xl">Birth Details Confirmed</h1>
      <p className="mb-6 text-sm leading-relaxed text-white/55">
        These details are locked in for your astrological profile. Need a correction? Contact
        Perennia Support.
      </p>
      <div className="mb-8 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm">
        <p className="text-white/70">
          <span className="text-white/40">Birth date · </span>{formatBirthDate(onboarding.birthDate) || '—'}
        </p>
        <p className="text-white/70">
          <span className="text-white/40">Birth time · </span>
          {onboarding.birthTimeUnknown ? 'Unknown' : (TIME_OPTIONS.find((t) => t.value === onboarding.birthTime)?.label ?? onboarding.birthTime)}
        </p>
        <p className="text-white/70">
          <span className="text-white/40">Birth place · </span>{onboarding.birthCity}, {countryName(onboarding.birthCountry)}
        </p>
        <p className="text-white/70">
          <span className="text-white/40">Current location · </span>{onboarding.city}, {countryName(onboarding.country)}
        </p>
      </div>
      <Button size="lg" className="w-full" onClick={() => navigate('/relationship-goals')}>
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}

function BirthDetailsForm() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding } = useApp()

  const [birthDate, setBirthDate] = useState(onboarding.birthDate)
  const [time, setTime] = useState(onboarding.birthTime)
  const [timeUnknown, setTimeUnknown] = useState(onboarding.birthTimeUnknown)

  const [birthCountry, setBirthCountry] = useState(onboarding.birthCountry)
  const [birthCity, setBirthCity] = useState<CityMatch | null>(null)

  const [currentCountry, setCurrentCountry] = useState(onboarding.country)
  const [currentCity, setCurrentCity] = useState<CityMatch | null>(null)

  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const needsManualBirthDate = !onboarding.birthDate

  const isValid =
    (needsManualBirthDate ? !!birthDate : true) &&
    (timeUnknown || !!time) &&
    !!birthCountry && !!birthCity &&
    !!currentCountry && !!currentCity &&
    confirmed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setError('')
    setSaving(true)

    const resolvedBirthDate = needsManualBirthDate ? birthDate : onboarding.birthDate
    const birthPlace = `${birthCity!.name}, ${birthCountry}`

    try {
      if (firebaseConfigured) {
        const chart = await computeNatalChart({
          birthDate: resolvedBirthDate,
          birthTime: timeUnknown ? undefined : time,
          birthTimeUnknown: timeUnknown,
          birthPlace,
        })
        updateOnboarding({
          birthDate: resolvedBirthDate,
          birthTime: timeUnknown ? '' : time,
          birthTimeUnknown: timeUnknown,
          birthPlace,
          birthCountry,
          birthCity: birthCity!.name,
          birthPlaceLat: birthCity!.lat,
          birthPlaceLon: birthCity!.lon,
          sunSign: chart.sunSign,
          moonSign: chart.moonSign,
          risingSign: chart.risingSign,
          chineseAnimal: chart.animal,
          chineseElement: chart.element,
          yinYang: chart.yinYang,
          country: currentCountry,
          city: currentCity!.name,
          currentLocationLat: currentCity!.lat,
          currentLocationLon: currentCity!.lon,
        })
      } else {
        updateOnboarding({
          birthDate: resolvedBirthDate,
          birthTime: timeUnknown ? '' : time,
          birthTimeUnknown: timeUnknown,
          birthPlace,
          birthCountry,
          birthCity: birthCity!.name,
          birthPlaceLat: birthCity!.lat,
          birthPlaceLon: birthCity!.lon,
          country: currentCountry,
          city: currentCity!.name,
          currentLocationLat: currentCity!.lat,
          currentLocationLon: currentCity!.lon,
        })
      }
      navigate('/relationship-goals')
    } catch (err) {
      const message = (err as { message?: string })?.message ?? ''
      setError(message || 'Could not confirm your birth details. Please check your entries and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="font-serif-display bg-gradient-to-r from-blue-200 via-white to-fuchsia-200 bg-clip-text text-4xl text-transparent sm:text-6xl">Birth Details</h1>
        <p className="mt-2 text-base text-white/65 sm:text-lg">For accurate compatibility calculations</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="birth-details-card glass-strong w-full max-w-2xl rounded-[2rem] border-blue-200/30 p-6 shadow-[0_0_48px_rgba(76,96,220,.18)] sm:p-9 md:p-12"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {needsManualBirthDate && (
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-lavender/70">Birth Date</p>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/50" />
                <Input type="date" className="pl-11 [color-scheme:dark]" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
              </div>
              <p className="text-xs text-white/35">
                Identity verification didn't return a birth date, so please confirm it here.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h2 className="font-serif-display text-2xl text-blue-100 sm:text-3xl">Time of Birth</h2>
            <Select
              icon={<Clock className="h-4 w-4" />}
              value={time}
              disabled={timeUnknown}
              onChange={(e) => setTime(e.target.value)}
            >
              <option value="" disabled>Select time</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>

            <label className="flex items-start gap-2.5 text-sm text-white/70">
              <input
                type="checkbox"
                checked={timeUnknown}
                onChange={(e) => {
                  setTimeUnknown(e.target.checked)
                  if (e.target.checked) setTime('')
                }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/25 bg-navy/40 accent-gold"
              />
              I don't know my birth time
            </label>
            <p className="text-xs leading-relaxed text-white/40 sm:text-sm">
              You may be able to find it in family records or request it from the hospital or
              records service where you were born, where available.
            </p>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex flex-col gap-3">
            <h2 className="font-serif-display text-2xl text-blue-100 sm:text-3xl">Place of Birth</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/45">Country</label>
              <Select
                icon={<Globe2 className="h-4 w-4" />}
                value={birthCountry}
                onChange={(e) => { setBirthCountry(e.target.value); setBirthCity(null) }}
              >
                <option value="" disabled>Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/45">City / Town</label>
              <CityCombobox
                countryCode={birthCountry}
                value={birthCity?.name ?? ''}
                disabled={!birthCountry}
                placeholder="Select city / town"
                onSelect={setBirthCity}
              />
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex flex-col gap-3">
            <h2 className="font-serif-display text-2xl text-blue-100 sm:text-3xl">Current Location</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/45">Country</label>
              <Select
                icon={<Globe2 className="h-4 w-4" />}
                value={currentCountry}
                onChange={(e) => { setCurrentCountry(e.target.value); setCurrentCity(null) }}
              >
                <option value="" disabled>Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/45">City / Area</label>
              <CityCombobox
                countryCode={currentCountry}
                value={currentCity?.name ?? ''}
                disabled={!currentCountry}
                placeholder="Select city / area"
                onSelect={setCurrentCity}
              />
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <label className="flex items-start gap-2.5 text-sm text-white/80">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/25 bg-navy/40 accent-gold"
              required
            />
            I confirm that my birth time and place of birth are accurate to the best of my knowledge.
          </label>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-white/40">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            These birth details will be locked after confirmation because they are used to
            calculate your astrological profile and compatibility. If you need to change them
            later, please contact Perennia Support.
          </p>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" className="birth-details-cta mt-1 min-h-14 w-full font-serif-display text-xl sm:text-2xl" disabled={!isValid || saving}>
            {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Confirming…</>) : 'Confirm Birth Details'}
          </Button>
        </form>
      </motion.div>
    </>
  )
}
