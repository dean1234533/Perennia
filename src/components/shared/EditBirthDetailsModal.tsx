import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { AlertTriangle, Clock, Globe2, KeyRound, Mail, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CityCombobox } from '@/components/shared/CityCombobox'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { computeNatalChart } from '@/lib/natalChart'
import { sendBirthDetailsOtp, verifyBirthDetailsOtp, updateBirthDetailsSecure } from '@/lib/birthDetailsReverificationApi'
import { COUNTRIES } from '@/data/countries'
import { TIME_OPTIONS } from '@/lib/timeOptions'
import type { CityMatch } from '@/lib/citySearchApi'

type Step = 'warning' | 'password' | 'otp' | 'edit'

function maskEmail(email: string | null | undefined): string {
  if (!email) return 'your email address'
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 3))}@${domain}`
}

export function EditBirthDetailsModal({ onClose }: { onClose: () => void }) {
  const { user, reauthenticate } = useAuth()
  const { onboarding } = useApp()

  const [step, setStep] = useState<Step>('warning')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const validCountryCode = (c: string) => COUNTRIES.some((x) => x.code === c)

  const [time, setTime] = useState(onboarding.birthTime)
  const [timeUnknown, setTimeUnknown] = useState(onboarding.birthTimeUnknown)
  const [birthCountry, setBirthCountry] = useState(validCountryCode(onboarding.birthCountry) ? onboarding.birthCountry : '')
  const [birthCity, setBirthCity] = useState<CityMatch | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const startResendCooldown = () => {
    setResendCooldown(60)
    const timer = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(timer)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const handlePasswordSubmit = async () => {
    setError('')
    setBusy(true)
    try {
      await reauthenticate(password)
      await sendBirthDetailsOtp()
      startResendCooldown()
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify your password. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return
    setError('')
    setBusy(true)
    try {
      await sendBirthDetailsOtp()
      startResendCooldown()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a new code. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleOtpSubmit = async () => {
    setError('')
    setBusy(true)
    try {
      await verifyBirthDetailsOtp(code)
      setStep('edit')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect code. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const missingFields: string[] = []
  if (!timeUnknown && !time) missingFields.push('time of birth (or check "I don\'t know")')
  if (!birthCountry) missingFields.push('birth country')
  else if (!birthCity) missingFields.push('birth city — select it from the dropdown')
  if (!confirmed) missingFields.push('the confirmation checkbox')

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (missingFields.length > 0) {
      setError(`Still needed: ${missingFields.join(', ')}.`)
      return
    }
    setError('')
    setBusy(true)
    try {
      const birthPlace = `${birthCity!.name}, ${birthCountry}`
      const chart = await computeNatalChart({
        birthDate: onboarding.birthDate,
        birthTime: timeUnknown ? undefined : time,
        birthTimeUnknown: timeUnknown,
        birthPlace,
      })
      await updateBirthDetailsSecure({
        birthTime: timeUnknown ? undefined : time,
        birthTimeUnknown: timeUnknown,
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
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your birth details. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-strong relative w-full max-w-md rounded-2xl p-6 sm:p-8"
        >
          <button
            onClick={() => !busy && onClose()}
            className="absolute right-5 top-5 cursor-pointer text-white/40 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {step === 'warning' && (
            <div className="flex flex-col gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <h2 className="font-serif-display text-2xl">Edit Birth Details</h2>
              <p className="text-sm leading-relaxed text-white/60">
                Changing your birth details may change your astrological profile and compatibility results.
              </p>
              <p className="text-sm leading-relaxed text-white/60">
                To protect the accuracy of your matches, you'll need to confirm your password and a
                one-time code sent to your email before you can make changes.
              </p>
              <Button size="lg" className="w-full" onClick={() => setStep('password')}>
                Continue
              </Button>
            </div>
          )}

          {step === 'password' && (
            <div className="flex flex-col gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <KeyRound className="h-6 w-6 text-white/70" />
              </div>
              <h2 className="font-serif-display text-2xl">Confirm Your Password</h2>
              <p className="text-sm text-white/55">Enter your account password to continue.</p>
              <Input
                type="password"
                placeholder="Current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-xs text-rose-300">{error}</p>}
              <Button size="lg" className="w-full" onClick={handlePasswordSubmit} disabled={busy || !password}>
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : 'Continue'}
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="flex flex-col gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Mail className="h-6 w-6 text-white/70" />
              </div>
              <h2 className="font-serif-display text-2xl">Enter Verification Code</h2>
              <p className="text-sm text-white/55">
                We sent a 6-digit code to {maskEmail(user?.email)}. It expires in 10 minutes.
              </p>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-[0.5em]"
                autoFocus
              />
              {error && <p className="text-xs text-rose-300">{error}</p>}
              <Button size="lg" className="w-full" onClick={handleOtpSubmit} disabled={busy || code.length !== 6}>
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : 'Verify Code'}
              </Button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={busy || resendCooldown > 0}
                className="cursor-pointer text-center text-xs text-white/40 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          )}

          {step === 'edit' && (
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
              <h2 className="font-serif-display text-2xl">Update Birth Details</h2>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-white/45">Time of Birth</label>
                <Select icon={<Clock className="h-4 w-4" />} value={time} disabled={timeUnknown} onChange={(e) => setTime(e.target.value)}>
                  <option value="" disabled>Select time</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
                <label className="flex items-center gap-2 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={timeUnknown}
                    onChange={(e) => { setTimeUnknown(e.target.checked); if (e.target.checked) setTime('') }}
                    className="h-4 w-4 rounded border-white/25 bg-navy/40 accent-gold"
                  />
                  I don't know my birth time
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-white/45">Birth Country</label>
                <Select icon={<Globe2 className="h-4 w-4" />} value={birthCountry} onChange={(e) => { if (e.target.value !== birthCountry) { setBirthCountry(e.target.value); setBirthCity(null) } }}>
                  <option value="" disabled>Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-white/45">Birth City / Town</label>
                <CityCombobox
                  key={birthCountry}
                  countryCode={birthCountry}
                  initialValue={birthCity?.name ?? ''}
                  disabled={!birthCountry}
                  placeholder="Select city / town"
                  onSelect={setBirthCity}
                />
              </div>

              <label className="flex items-start gap-2.5 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/25 bg-navy/40 accent-gold"
                />
                I confirm that these updated birth details are accurate to the best of my knowledge.
              </label>

              {error && <p className="text-xs text-rose-300">{error}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save Changes'}
              </Button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
