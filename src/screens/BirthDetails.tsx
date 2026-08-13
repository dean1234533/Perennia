import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Clock, Globe2, ArrowRight, Loader2, ShieldCheck, Pencil, MapPin, X } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { CityCombobox } from '@/components/shared/CityCombobox'
import { EditBirthDetailsModal } from '@/components/shared/EditBirthDetailsModal'
import { useApp } from '@/context/AppContext'
import { computeNatalChart } from '@/lib/natalChart'
import { firebaseConfigured } from '@/lib/firebase'
import { hasDevelopmentVerificationBypass } from '@/lib/developmentVerification'
import { refreshIdentityVerificationStatus } from '@/lib/identityVerification'
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
  const { onboarding, updateOnboarding } = useApp()
  const [recoveringBirthDate, setRecoveringBirthDate] = useState(false)
  const recoveryAttempted = useRef(false)

  useEffect(() => {
    if (onboarding.birthDate || recoveryAttempted.current) return

    // Repair an older local test session that navigated before the bypass
    // date write completed.
    if (hasDevelopmentVerificationBypass()) {
      recoveryAttempted.current = true
      setRecoveringBirthDate(true)
      void updateOnboarding({ birthDate: '1995-06-15' })
        .catch(() => undefined)
        .finally(() => setRecoveringBirthDate(false))
      return
    }

    // Reconcile trusted Stripe output when the verification webhook marked
    // the account verified before its DOB reached the user document.
    if (
      firebaseConfigured &&
      onboarding.verification.status === 'verified' &&
      onboarding.verification.provider === 'stripe_identity' &&
      onboarding.verification.verificationReference
    ) {
      recoveryAttempted.current = true
      setRecoveringBirthDate(true)
      void refreshIdentityVerificationStatus()
        .catch(() => undefined)
        .finally(() => setRecoveringBirthDate(false))
    }
  }, [onboarding.birthDate, onboarding.verification, updateOnboarding])

  if (recoveringBirthDate && !onboarding.birthDate) {
    return (
      <OnboardingShell step={4} totalSteps={12}>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-navy/40 px-5 py-4 text-sm text-white/65">
          <Loader2 className="h-5 w-5 animate-spin text-gold" /> Loading your verified birth date…
        </div>
      </OnboardingShell>
    )
  }

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
  const [editBirthOpen, setEditBirthOpen] = useState(false)
  const [editLocationOpen, setEditLocationOpen] = useState(false)

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
        These details are locked in for your astrological profile. You can correct them any time
        with a quick identity re-check.
      </p>
      <div className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm">
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
      </div>
      <button
        type="button"
        onClick={() => setEditBirthOpen(true)}
        className="mb-4 flex w-full cursor-pointer items-center justify-center gap-2 text-xs text-white/45 hover:text-white/75"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit Birth Details
      </button>

      <div className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm">
        <p className="text-white/70">
          <span className="text-white/40">Current location · </span>{onboarding.city}, {countryName(onboarding.country)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditLocationOpen(true)}
        className="mb-8 flex w-full cursor-pointer items-center justify-center gap-2 text-xs text-white/45 hover:text-white/75"
      >
        <MapPin className="h-3.5 w-3.5" /> Edit Current Location
      </button>

      <Button size="lg" className="w-full" onClick={() => navigate('/preferences')}>
        Continue <ArrowRight className="h-4 w-4" />
      </Button>

      {editBirthOpen && <EditBirthDetailsModal onClose={() => setEditBirthOpen(false)} />}
      {editLocationOpen && <EditCurrentLocationModal onClose={() => setEditLocationOpen(false)} />}
    </motion.div>
  )
}

/** Current Location is designed to change (people relocate), so unlike
 *  Birth Details it stays freely editable with no re-verification step —
 *  same instant-write path as the rest of onboarding. */
function EditCurrentLocationModal({ onClose }: { onClose: () => void }) {
  const { onboarding, updateOnboarding } = useApp()
  const validCountryCode = (c: string) => COUNTRIES.some((x) => x.code === c)

  const [country, setCountry] = useState(validCountryCode(onboarding.country) ? onboarding.country : '')
  const [city, setCity] = useState<CityMatch | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!country || !city) {
      setError('Please select both a country and a city.')
      return
    }
    setSaving(true)
    updateOnboarding({
      country,
      city: city.name,
      currentLocationLat: city.lat,
      currentLocationLon: city.lon,
    })
    setSaving(false)
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-strong relative w-full max-w-md rounded-2xl p-6 sm:p-8"
        >
          <button onClick={onClose} className="absolute right-5 top-5 cursor-pointer text-white/40 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-serif-display mb-5 text-2xl">Edit Current Location</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/45">Country</label>
              <Select icon={<Globe2 className="h-4 w-4" />} value={country} onChange={(e) => { if (e.target.value !== country) { setCountry(e.target.value); setCity(null) } }}>
                <option value="" disabled>Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/45">City / Area</label>
              <CityCombobox
                key={country}
                countryCode={country}
                initialValue={city?.name ?? ''}
                disabled={!country}
                placeholder="Select city / area"
                onSelect={setCity}
              />
            </div>
            {error && <p className="text-xs text-rose-300">{error}</p>}
            <Button size="lg" className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save Location'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

function BirthDetailsForm() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding } = useApp()

  const [time, setTime] = useState(onboarding.birthTime)
  const [timeUnknown, setTimeUnknown] = useState(onboarding.birthTimeUnknown)

  // Only trust a pre-existing country value if it's a real ISO code we
  // recognize — some accounts still carry a legacy free-text country
  // (e.g. "United Kingdom") from before this screen existed, when current
  // location was a plain text field elsewhere in onboarding. Passing that
  // straight through as countryCode silently breaks every city search
  // (the backend expects a 2-letter code), so the field would never fill
  // in no matter what was typed. Falling back to empty forces a real,
  // valid re-selection instead.
  const validCountryCode = (code: string) => COUNTRIES.some((c) => c.code === code)

  const [birthCountry, setBirthCountry] = useState(validCountryCode(onboarding.birthCountry) ? onboarding.birthCountry : '')
  const [birthCity, setBirthCity] = useState<CityMatch | null>(null)

  const [currentCountry, setCurrentCountry] = useState(validCountryCode(onboarding.country) ? onboarding.country : '')
  const [currentCity, setCurrentCity] = useState<CityMatch | null>(null)

  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Only reset the paired city when the country genuinely changes — a
  // handler that unconditionally cleared it on every fire could otherwise
  // desync the visible (still-selected-looking) city from the actual
  // stored value if it were ever invoked with an unchanged value.
  const handleBirthCountryChange = (value: string) => {
    if (value === birthCountry) return
    setBirthCountry(value)
    setBirthCity(null)
  }
  const handleCurrentCountryChange = (value: string) => {
    if (value === currentCountry) return
    setCurrentCountry(value)
    setCurrentCity(null)
  }

  // Named so the disabled Confirm button can explain itself — otherwise a
  // missed step (most easily: typing a city without clicking an actual
  // suggestion from the dropdown, which is the only thing that sets
  // birthCity/currentCity) makes the button silently do nothing with zero
  // feedback about why. Checks the actual stored birthCity/currentCity
  // values (CityMatch | null), never the combobox's own display text.
  const missingFields: string[] = []
  if (!onboarding.birthDate) missingFields.push("birth date — this comes from identity verification; contact support if it's missing")
  if (!timeUnknown && !time) missingFields.push('time of birth (or check "I don\'t know")')
  if (!birthCountry) missingFields.push('birth country')
  else if (!birthCity) missingFields.push('birth city — select it from the dropdown')
  if (!currentCountry) missingFields.push('current country')
  else if (!currentCity) missingFields.push('current city — select it from the dropdown')
  if (!confirmed) missingFields.push('the confirmation checkbox')

  const isValid = missingFields.length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setError(`Still needed: ${missingFields.join(', ')}.`)
      return
    }
    setError('')
    setSaving(true)

    const resolvedBirthDate = onboarding.birthDate
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
      navigate('/preferences')
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
        className="birth-details-card w-full max-w-2xl rounded-[2rem] p-6 shadow-[0_0_48px_rgba(76,96,220,.18)] sm:p-9 md:p-12"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
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
                onChange={(e) => handleBirthCountryChange(e.target.value)}
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
                key={birthCountry}
                countryCode={birthCountry}
                initialValue={birthCity?.name ?? ''}
                disabled={!birthCountry}
                placeholder="Select city / town"
                onSelect={setBirthCity}
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
            calculate your astrological profile and compatibility. You can securely update them
            later through a quick identity re-check.
          </p>

          <div className="h-px bg-white/10" />

          <div className="flex flex-col gap-3">
            <h2 className="font-serif-display text-2xl text-blue-100 sm:text-3xl">Current Location</h2>
            <p className="text-xs leading-relaxed text-white/40 sm:text-sm">
              You can update your current location later if you move or relocate.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/45">Country</label>
              <Select
                icon={<Globe2 className="h-4 w-4" />}
                value={currentCountry}
                onChange={(e) => handleCurrentCountryChange(e.target.value)}
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
                key={currentCountry}
                countryCode={currentCountry}
                initialValue={currentCity?.name ?? ''}
                disabled={!currentCountry}
                placeholder="Select city / area"
                onSelect={setCurrentCity}
              />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            size="lg"
            className={`birth-details-cta mt-1 min-h-14 w-full font-serif-display text-xl sm:text-2xl ${!isValid && !saving ? 'opacity-60' : ''}`}
            disabled={saving}
          >
            {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Confirming…</>) : 'Confirm Birth Details'}
          </Button>
        </form>
      </motion.div>
    </>
  )
}
