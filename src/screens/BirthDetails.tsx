import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApp } from '@/context/AppContext'
import { computeNatalChart } from '@/lib/natalChart'
import { firebaseConfigured } from '@/lib/firebase'

function calcSunSign(dateStr: string): string {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-').map(Number)
  const signs: [number, number, string][] = [
    [1, 19, 'Capricorn'], [2, 18, 'Aquarius'], [3, 20, 'Pisces'], [4, 19, 'Aries'],
    [5, 20, 'Taurus'], [6, 20, 'Gemini'], [7, 22, 'Cancer'], [8, 22, 'Leo'],
    [9, 22, 'Virgo'], [10, 22, 'Libra'], [11, 21, 'Scorpio'], [12, 21, 'Sagittarius'], [12, 31, 'Capricorn'],
  ]
  for (const [month, day, sign] of signs) {
    if (m < month || (m === month && d <= day)) return sign
  }
  return 'Capricorn'
}

export function BirthDetails() {
  const navigate = useNavigate()
  const { updateOnboarding } = useApp()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [place, setPlace] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sunSign = calcSunSign(date)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!firebaseConfigured) {
      updateOnboarding({ birthDate: date, birthTime: time, birthPlace: place, sunSign })
      navigate('/preferences')
      return
    }

    setLoading(true)
    try {
      const chart = await computeNatalChart({ birthDate: date, birthTime: time, birthPlace: place })
      updateOnboarding({
        birthDate: date,
        birthTime: time,
        birthPlace: place,
        sunSign: chart.sunSign,
        moonSign: chart.moonSign,
        risingSign: chart.risingSign,
        chineseAnimal: chart.animal,
        chineseElement: chart.element,
        yinYang: chart.yinYang,
      })
      navigate('/preferences')
    } catch (err) {
      const message = (err as { message?: string })?.message ?? ''
      setError(
        message.includes('Couldn\'t find a city')
          ? message
          : 'Could not calculate your cosmic profile. Please check your birth place and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const isValid = date && time && place.length > 1

  return (
    <OnboardingShell step={4} totalSteps={7}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-md rounded-[2rem] p-8 md:p-10"
      >
        <h1 className="font-serif-display mb-2 text-3xl">Your Birth Details</h1>
        <p className="mb-8 text-sm text-white/55">
          The foundation of your cosmic profile — used to calculate your astrological compatibility with others.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Birth Date</Label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <Input id="date" type="date" className="pl-11 [color-scheme:dark]" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="time">Birth Time</Label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <Input id="time" type="time" className="pl-11 [color-scheme:dark]" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="place">Birth Place</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <Input id="place" placeholder="City, Country" className="pl-11" value={place} onChange={(e) => setPlace(e.target.value)} required />
            </div>
          </div>

          {sunSign && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-gold/5 px-4 py-3"
            >
              <Sparkles className="h-4 w-4 text-gold" />
              <p className="text-sm text-champagne">
                Your Sun Sign is <span className="font-medium">{sunSign}</span>
              </p>
            </motion.div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" className="mt-2 w-full" disabled={!isValid || loading}>
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Calculating your cosmic profile…</>) : (<>Continue <ArrowRight className="h-4 w-4" /></>)}
          </Button>
        </form>
      </motion.div>
    </OnboardingShell>
  )
}
