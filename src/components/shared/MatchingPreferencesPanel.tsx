import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Loader2, Check, ChevronDown } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DualRangeSlider } from '@/components/ui/dual-range-slider'
import { geocodeLocation } from '@/lib/geocodeApi'
import { useAuth } from '@/context/AuthContext'
import { setCurrentLocationRemote, updateUserDoc } from '@/lib/firestore'
import { RELATIONSHIP_GOALS } from '@/data/relationshipGoals'
import { LIFESTYLE_CATEGORIES } from '@/data/lifestyleOptions'

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100, null] as const
const WANTS_CHILDREN_OPTIONS = LIFESTYLE_CATEGORIES.find((c) => c.label === 'Wants Children')?.options ?? []

function distanceLabel(miles: number | null) {
  return miles === null ? 'Anywhere' : `${miles} miles`
}

/** Real matching preferences — age range and distance actually change who
 *  shows up in Discovery (see Discovery.tsx). Shared between the Discovery
 *  filter drawer and Profile > Matching Preferences in Settings so there's
 *  one real source of truth, not two out-of-sync copies. */
export function MatchingPreferencesPanel({ onSaved, actionButtonClassName }: { onSaved?: () => void; actionButtonClassName?: string }) {
  const { user } = useAuth()
  const { onboarding, updatePreferences } = useApp()
  const [ageMin, setAgeMin] = useState(onboarding.preferences.ageMin)
  const [ageMax, setAgeMax] = useState(onboarding.preferences.ageMax)
  const [maxDistance, setMaxDistance] = useState<number | null>(onboarding.preferences.maxDistanceMiles)
  const [relationshipGoal, setRelationshipGoal] = useState<string | null>(onboarding.preferences.relationshipGoal)
  const [wantsChildren, setWantsChildren] = useState<string | null>(onboarding.preferences.wantsChildren)
  const [religion, setReligion] = useState(onboarding.preferences.religion)
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
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
    await updatePreferences({ ageMin, ageMax, maxDistanceMiles: maxDistance, relationshipGoal, wantsChildren, religion: religion.trim() })
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

      {/* More filters — all optional */}
      <div>
        <button
          onClick={() => setMoreFiltersOpen((v) => !v)}
          className="flex w-full items-center justify-between text-xs uppercase tracking-[0.25em] text-gold/70 cursor-pointer"
        >
          More Filters
          <ChevronDown className={`h-4 w-4 transition-transform ${moreFiltersOpen ? 'rotate-180' : ''}`} />
        </button>
        {moreFiltersOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 flex flex-col gap-4 overflow-hidden">
            <div className="flex flex-col gap-2">
              <Label>Relationship Goal</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRelationshipGoal(null)}
                  className={`rounded-full px-3 py-1.5 text-xs cursor-pointer ${relationshipGoal === null ? 'bg-gold/15 text-champagne border border-gold/30' : 'glass text-white/50'}`}
                >
                  Any
                </button>
                {RELATIONSHIP_GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setRelationshipGoal(g.value)}
                    className={`rounded-full px-3 py-1.5 text-xs cursor-pointer ${relationshipGoal === g.value ? 'bg-gold/15 text-champagne border border-gold/30' : 'glass text-white/50'}`}
                  >
                    {g.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Wants Children</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setWantsChildren(null)}
                  className={`rounded-full px-3 py-1.5 text-xs cursor-pointer ${wantsChildren === null ? 'bg-gold/15 text-champagne border border-gold/30' : 'glass text-white/50'}`}
                >
                  Any
                </button>
                {WANTS_CHILDREN_OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => setWantsChildren(o)}
                    className={`rounded-full px-3 py-1.5 text-xs cursor-pointer ${wantsChildren === o ? 'bg-gold/15 text-champagne border border-gold/30' : 'glass text-white/50'}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="religion-filter">Religion</Label>
              <Input id="religion-filter" value={religion} onChange={(e) => setReligion(e.target.value)} placeholder="Any" />
            </div>
          </motion.div>
        )}
      </div>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button className={`w-full ${actionButtonClassName ?? ''}`} size="lg" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Preferences'}
        </Button>
      </motion.div>
    </div>
  )
}
