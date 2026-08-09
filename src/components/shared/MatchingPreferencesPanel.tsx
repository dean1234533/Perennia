import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Loader2, Check } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { DualRangeSlider } from '@/components/ui/dual-range-slider'
import { geocodeLocation } from '@/lib/geocodeApi'
import { useAuth } from '@/context/AuthContext'
import { setCurrentLocationRemote, updateUserDoc } from '@/lib/firestore'

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100, null] as const

function distanceLabel(miles: number | null) {
  return miles === null ? 'Anywhere' : `${miles} miles`
}

/** Real matching preferences — age range and distance actually change who
 *  shows up in Discovery (see Discovery.tsx). Shared between the Discovery
 *  filter drawer and Profile > Matching Preferences in Settings so there's
 *  one real source of truth, not two out-of-sync copies. */
export function MatchingPreferencesPanel({ onSaved }: { onSaved?: () => void }) {
  const { user } = useAuth()
  const { onboarding, updatePreferences } = useApp()
  const [ageMin, setAgeMin] = useState(onboarding.preferences.ageMin)
  const [ageMax, setAgeMax] = useState(onboarding.preferences.ageMax)
  const [maxDistance, setMaxDistance] = useState<number | null>(onboarding.preferences.maxDistanceMiles)
  const [locationInput, setLocationInput] = useState(
    onboarding.city && onboarding.country ? `${onboarding.city}, ${onboarding.country}` : ''
  )
  const [locationStatus, setLocationStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [locationError, setLocationError] = useState('')
  const [saving, setSaving] = useState(false)

  const hasLocation = onboarding.currentLocationLat !== null && onboarding.currentLocationLon !== null

  const handleSaveLocation = async () => {
    if (!locationInput.trim() || !user) return
    setLocationStatus('saving')
    setLocationError('')
    try {
      const geo = await geocodeLocation(locationInput.trim())
      await setCurrentLocationRemote(user.uid, geo.lat, geo.lon)
      await updateUserDoc(user.uid, { city: geo.matchedCity, country: geo.matchedCountry })
      setLocationStatus('saved')
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Could not find that location.')
      setLocationStatus('error')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await updatePreferences({ ageMin, ageMax, maxDistanceMiles: maxDistance })
    setSaving(false)
    onSaved?.()
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Location */}
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">Your Location</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value)
                setLocationStatus('idle')
              }}
              placeholder="City, Country"
              className="h-11 w-full rounded-full border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-gold/40"
            />
          </div>
          <Button variant="glass" size="sm" onClick={handleSaveLocation} disabled={locationStatus === 'saving' || !locationInput.trim()}>
            {locationStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : locationStatus === 'saved' ? <Check className="h-4 w-4 text-emerald-400" /> : 'Set'}
          </Button>
        </div>
        {locationError && <p className="mt-2 text-xs text-rose-300">{locationError}</p>}
        {!hasLocation && locationStatus !== 'saved' && (
          <p className="mt-2 text-xs text-white/40">Set your location so distance filtering can actually work.</p>
        )}
      </div>

      {/* Age range */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.25em] text-gold/70">Age</p>
          <p className="font-serif-display text-lg text-champagne">{ageMin} — {ageMax}</p>
        </div>
        <DualRangeSlider min={18} max={80} valueMin={ageMin} valueMax={ageMax} onChange={(lo, hi) => { setAgeMin(lo); setAgeMax(hi) }} />
      </div>

      {/* Distance */}
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">Distance</p>
        <div className="flex flex-wrap gap-2">
          {DISTANCE_OPTIONS.map((d) => (
            <button
              key={d ?? 'anywhere'}
              onClick={() => setMaxDistance(d)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                maxDistance === d ? 'bg-gold/15 text-champagne border border-gold/30' : 'glass text-white/50'
              }`}
            >
              {distanceLabel(d)}
            </button>
          ))}
        </div>
      </div>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Preferences'}
        </Button>
      </motion.div>
    </div>
  )
}
