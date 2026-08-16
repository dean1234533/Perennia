import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Droplets,
  Flame,
  Gem,
  Heart,
  Leaf,
  Loader2,
  MapPin,
  Mountain,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { MatchingPreferencesPanel } from '@/components/shared/MatchingPreferencesPanel'
import { fetchDiscoveryCandidates, getPrivateLifestyle, type DiscoveryCandidate, type PrivateLifestyle } from '@/lib/firestore'
import { getCompatibility, type CompatibilityResult, type PersonBirthProfile } from '@/lib/compatibilityApi'
import { subscribeFoundingMembership } from '@/lib/founding500'
import { firebaseConfigured } from '@/lib/firebase'
import { calculateAge } from '@/lib/age'
import { milesBetween } from '@/lib/distance'
import './Discovery.css'

const MINIMUM_COMPATIBILITY = 80

const zodiacGlyphs: Record<string, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍',
  libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
}

const chineseAnimalGlyphs: Record<string, string> = {
  rat: '🐀', ox: '🐂', tiger: '🐅', rabbit: '🐇', dragon: '🐉', snake: '🐍',
  horse: '🐎', goat: '🐐', sheep: '🐑', monkey: '🐒', rooster: '🐓', dog: '🐕', pig: '🐖',
}

function AstrologyChip({ icon, value, label, tone = 'violet' }: { icon: ReactNode; value: string; label: string; tone?: 'blue' | 'gold' | 'violet' | 'silver' }) {
  return (
    <div className={`discovery-astro-chip discovery-astro-chip--${tone}`}>
      <span className="discovery-astro-icon" aria-hidden="true">{icon}</span>
      <span className="discovery-astro-copy">
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </div>
  )
}

function WesternChip({ sign, label, tone }: { sign: string; label: string; tone: 'blue' | 'gold' | 'violet' }) {
  const glyph = zodiacGlyphs[sign.trim().toLowerCase()] ?? '✦'
  return <AstrologyChip icon={glyph} value={sign} label={label} tone={tone} />
}

function ElementIcon({ element }: { element: string }) {
  const key = element.trim().toLowerCase()
  if (key === 'wood') return <Leaf />
  if (key === 'fire') return <Flame />
  if (key === 'earth') return <Mountain />
  if (key === 'metal') return <Gem />
  return <Droplets />
}

function PolarityIcon() {
  return <span className="discovery-yinyang">◐</span>
}

export function Discovery() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { passedIds, likedIds, matchedIds, blockedIds, onboarding, likeProfile, passProfile } = useApp()
  const [filter, setFilter] = useState<'all' | 'nearby'>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [scores, setScores] = useState<Record<string, CompatibilityResult>>({})
  const [failedUids, setFailedUids] = useState<Set<string>>(new Set())
  const [lifestyles, setLifestyles] = useState<Record<string, PrivateLifestyle | null>>({})
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [actionPending, setActionPending] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const wheelLockedUntil = useRef(0)

  useEffect(() => {
    if (!firebaseConfigured || !user) return
    return subscribeFoundingMembership(user.uid, (record) => setIsPremium(record?.tier === 'premium'))
  }, [user])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchDiscoveryCandidates(user.uid)
      .then((result) => {
        if (!cancelled) setCandidates(result)
      })
      .catch((err) => console.warn('[Perennia] Failed to load discovery candidates:', err))
      .finally(() => {
        if (!cancelled) setLoadingCandidates(false)
      })
    return () => { cancelled = true }
  }, [user])

  const interestedIn = onboarding.gender === 'male' ? 'female' : onboarding.gender === 'female' ? 'male' : null
  const { ageMin, ageMax, maxDistanceMiles, relationshipGoal, wantsChildren, religion } = onboarding.preferences
  const selfLocation = onboarding.currentLocationLat !== null && onboarding.currentLocationLon !== null
    ? { lat: onboarding.currentLocationLat, lon: onboarding.currentLocationLon }
    : null

  function distanceTo(c: DiscoveryCandidate): number | null {
    if (!selfLocation || c.currentLocationLat === null || c.currentLocationLon === null) return null
    return milesBetween(selfLocation, { lat: c.currentLocationLat, lon: c.currentLocationLon })
  }

  const eligible = candidates.filter((c) => {
    if (passedIds.includes(c.uid) || likedIds.includes(c.uid) || matchedIds.includes(c.uid) || blockedIds.includes(c.uid)) return false
    if (c.incognito) return false
    if (interestedIn && c.gender !== interestedIn) return false
    const age = calculateAge(c.birthDate)
    if (age !== null && (age < ageMin || age > ageMax)) return false
    if (maxDistanceMiles !== null) {
      const distance = distanceTo(c)
      if (distance !== null && distance > maxDistanceMiles) return false
    }
    if (relationshipGoal && c.relationshipGoal && c.relationshipGoal !== relationshipGoal) return false
    if (wantsChildren) {
      const theirAnswer = lifestyles[c.uid]?.items.find((l) => l.label === 'Wants Children')?.value
      if (theirAnswer && theirAnswer !== wantsChildren) return false
    }
    if (religion.trim() && c.religion && c.religion.toLowerCase() !== religion.trim().toLowerCase()) return false
    return true
  })

  useEffect(() => {
    if (!wantsChildren) return
    const toFetch = eligible.filter((c) => !(c.uid in lifestyles)).slice(0, 30)
    if (toFetch.length === 0) return
    let cancelled = false
    Promise.all(toFetch.map((c) => getPrivateLifestyle(c.uid).then((l) => [c.uid, l] as const))).then((results) => {
      if (!cancelled) setLifestyles((prev) => ({ ...prev, ...Object.fromEntries(results) }))
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsChildren, eligible.map((c) => c.uid).join(',')])

  const selfChartComplete = Boolean(
    onboarding.sunSign && onboarding.moonSign && onboarding.risingSign &&
    onboarding.chineseAnimal && onboarding.chineseElement && onboarding.yinYang
  )

  const hasCompleteChart = (c: DiscoveryCandidate) =>
    !!(c.sunSign && c.moonSign && c.risingSign && c.chineseAnimal && c.chineseElement && c.yinYang)

  useEffect(() => {
    if (!selfChartComplete) return
    const toFetch = eligible.filter((c) => hasCompleteChart(c) && !(c.uid in scores) && !failedUids.has(c.uid)).slice(0, 20)
    if (toFetch.length === 0) return

    const personA: PersonBirthProfile = {
      sunSign: onboarding.sunSign,
      moonSign: onboarding.moonSign,
      risingSign: onboarding.risingSign,
      chineseAnimal: onboarding.chineseAnimal,
      chineseElement: onboarding.chineseElement,
      yinYang: onboarding.yinYang,
    }

    let cancelled = false
    Promise.all(toFetch.map(async (c) => {
      try {
        const result = await getCompatibility({
          personA,
          personB: {
            sunSign: c.sunSign,
            moonSign: c.moonSign,
            risingSign: c.risingSign,
            chineseAnimal: c.chineseAnimal,
            chineseElement: c.chineseElement,
            yinYang: c.yinYang,
          },
        })
        return { uid: c.uid, result }
      } catch (err) {
        console.warn(`[Perennia] Failed to compute compatibility for ${c.uid}:`, err)
        return { uid: c.uid, result: null }
      }
    })).then((results) => {
      if (cancelled) return
      const resolved = results.filter((r): r is { uid: string; result: CompatibilityResult } => r.result !== null)
      const failed = results.filter((r) => r.result === null).map((r) => r.uid)
      if (resolved.length) setScores((prev) => ({ ...prev, ...Object.fromEntries(resolved.map((r) => [r.uid, r.result])) }))
      if (failed.length) setFailedUids((prev) => new Set([...prev, ...failed]))
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible.map((c) => c.uid).join(','), selfChartComplete, onboarding.sunSign, onboarding.moonSign, onboarding.risingSign, onboarding.chineseAnimal, onboarding.chineseElement, onboarding.yinYang])

  const visible = eligible
    .filter((c) => scores[c.uid]?.compatibility >= MINIMUM_COMPATIBILITY)
    .map((c) => ({ ...c, compatibility: scores[c.uid].compatibility, distance: distanceTo(c) }))
    .sort((a, b) => {
      if (filter === 'nearby' && a.distance !== null && b.distance !== null) return a.distance - b.distance
      return b.compatibility - a.compatibility
    })

  const loading = loadingCandidates || (
    eligible.length > 0 && selfChartComplete && visible.length === 0 &&
    eligible.some((c) => hasCompleteChart(c) && !failedUids.has(c.uid) && !scores[c.uid])
  )

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(visible.length - 1, 0)))
  }, [visible.length])

  const goToProfile = useCallback((step: 1 | -1) => {
    setDirection(step)
    setActiveIndex((current) => Math.max(0, Math.min(visible.length - 1, current + step)))
  }, [visible.length])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (filterOpen || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return
      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault()
        goToProfile(1)
      }
      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault()
        goToProfile(-1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [filterOpen, goToProfile])

  const active = visible[activeIndex]

  function onWheel(event: React.WheelEvent) {
    if (window.innerWidth < 768 || Math.abs(event.deltaY) < 28 || Date.now() < wheelLockedUntil.current) return
    wheelLockedUntil.current = Date.now() + 650
    goToProfile(event.deltaY > 0 ? 1 : -1)
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (touchStartY.current === null) return
    const distance = touchStartY.current - event.changedTouches[0].clientY
    touchStartY.current = null
    if (Math.abs(distance) >= 72) goToProfile(distance > 0 ? 1 : -1)
  }

  async function handlePass() {
    if (!active || actionPending) return
    setActionPending(true)
    setDirection(1)
    try {
      await passProfile(active.uid)
    } catch (err) {
      console.warn('[Perennia] Failed to pass profile:', err)
    } finally {
      setActionPending(false)
    }
  }

  async function handleLike() {
    if (!active || actionPending) return
    setActionPending(true)
    setDirection(1)
    try {
      const { matchId, conversationId } = await likeProfile(active.uid)
      if (matchId) navigate(`/match/${matchId}`, { state: { otherUid: active.uid, compatibility: active.compatibility } })
      else if (conversationId) navigate(`/messages/${conversationId}`, { state: { otherUid: active.uid } })
    } catch (err) {
      console.warn('[Perennia] Failed to like profile:', err)
    } finally {
      setActionPending(false)
    }
  }

  return (
    <div className="discovery-page" onWheel={onWheel}>
      <header className="discovery-toolbar" aria-label="Discovery controls">
        <div className="discovery-segmented" role="group" aria-label="Sort profiles">
          <button className={filter === 'all' ? 'is-active' : ''} onClick={() => { setFilter('all'); setActiveIndex(0) }}>All Matches</button>
          <button className={filter === 'nearby' ? 'is-active' : ''} onClick={() => { setFilter('nearby'); setActiveIndex(0) }}>Nearby</button>
        </div>
        <button className="discovery-filter-button" onClick={() => setFilterOpen(true)} aria-label="Open discovery filters">
          <SlidersHorizontal />
        </button>
      </header>

      {!selfChartComplete ? (
        <DiscoveryState icon={<Sparkles />} title="Complete Your Cosmic Profile" body="Add your birth date, time, and place so Perennia can calculate real compatibility." action={<button onClick={() => navigate('/birth-details')}>Add Birth Details</button>} />
      ) : loading ? (
        <div className="discovery-loading" role="status" aria-label="Loading compatible profiles"><Loader2 /></div>
      ) : candidates.length === 0 ? (
        <DiscoveryState title="No eligible profiles are available" body="There are no Discovery profiles available for your account right now." />
      ) : visible.length === 0 ? (
        <DiscoveryState title="No compatible profiles found" body="No profiles currently meet your preferences and compatibility threshold." />
      ) : active ? (
        <div className="discovery-stage">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.article
              key={active.uid}
              custom={direction}
              initial={{ opacity: 0, y: direction > 0 ? 34 : -34 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction > 0 ? -28 : 28 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="discovery-card"
              onTouchStart={(event) => { touchStartY.current = event.touches[0].clientY }}
              onTouchEnd={onTouchEnd}
            >
              <div className="discovery-photo-panel">
                <img src={active.profilePhotoUrl} alt={`Portrait of ${active.name}`} />
                <div className="discovery-photo-shade" />
                <div className="discovery-mobile-identity">
                  <Identity candidate={active} />
                </div>
              </div>

              <div className="discovery-profile-panel">
                <div className="discovery-desktop-identity">
                  <Identity candidate={active} />
                </div>

                <div
                  className="discovery-score"
                  style={{ '--score': `${active.compatibility * 3.6}deg` } as CSSProperties}
                  aria-label={`${active.compatibility}% compatible`}
                >
                  <div><strong>{active.compatibility}<span>%</span></strong><small>Compatible</small></div>
                </div>

                <section className="discovery-astrology" aria-label={`${active.name}'s astrology snapshot`}>
                  <WesternChip sign={active.sunSign} label="Sun" tone="blue" />
                  <WesternChip sign={active.moonSign} label="Moon" tone="gold" />
                  <WesternChip sign={active.risingSign} label="Rising" tone="violet" />
                  {isPremium && (
                    <>
                      <AstrologyChip icon={chineseAnimalGlyphs[active.chineseAnimal.trim().toLowerCase()] ?? '✦'} value={active.chineseAnimal} label="Chinese Sign" tone="gold" />
                      <AstrologyChip icon={<ElementIcon element={active.chineseElement} />} value={active.chineseElement} label="Element" tone="blue" />
                      <AstrologyChip icon={<PolarityIcon />} value={active.yinYang} label="Polarity" tone="silver" />
                    </>
                  )}
                </section>

                <div className="discovery-actions">
                  <button className="discovery-action discovery-action--pass" onClick={handlePass} disabled={actionPending} aria-label={`Pass on ${active.name}`}>
                    <X />
                  </button>
                  <button className="discovery-action discovery-action--like" onClick={handleLike} disabled={actionPending} aria-label={`Like ${active.name}`}>
                    {actionPending ? <Loader2 className="discovery-action-spinner" /> : <Heart />}
                  </button>
                  <button className="discovery-view-profile" onClick={() => navigate(`/profile/${active.uid}`)}>
                    View Profile <ArrowRight />
                  </button>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>

          <div className="discovery-vertical-nav" aria-label="Browse profiles vertically">
            <button onClick={() => goToProfile(-1)} disabled={activeIndex === 0} aria-label="Previous profile"><ArrowUp /></button>
            <div className="discovery-vertical-line"><span /></div>
            <p><span>{activeIndex + 1}</span> / {visible.length}</p>
            <button onClick={() => goToProfile(1)} disabled={activeIndex === visible.length - 1} aria-label="Next profile"><ArrowDown /></button>
          </div>

          <p className="discovery-swipe-hint"><ArrowUp /> Swipe vertically to discover <ArrowDown /></p>
        </div>
      ) : null}

      <AnimatePresence>
        {filterOpen && (
          <motion.div className="discovery-filter-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && setFilterOpen(false)}>
            <motion.div className="discovery-filter-panel" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} role="dialog" aria-modal="true" aria-label="Discovery filters">
              <div className="discovery-filter-heading">
                <h2>Discovery Filters</h2>
                <button onClick={() => setFilterOpen(false)} aria-label="Close filters"><X /></button>
              </div>
              <MatchingPreferencesPanel
                onSaved={() => setFilterOpen(false)}
                actionButtonClassName="discovery-filter-apply-button"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Identity({ candidate }: { candidate: DiscoveryCandidate & { compatibility: number; distance: number | null } }) {
  const age = calculateAge(candidate.birthDate)
  const location = candidate.profileExtras?.location || [candidate.city, candidate.country].filter(Boolean).join(', ')
  return (
    <div className="discovery-identity">
      <div className="discovery-name-row">
        <h1>{candidate.name.split(' ')[0]}{age !== null ? `, ${age}` : ''}</h1>
        {candidate.verification?.status === 'verified' && <BadgeCheck aria-label="Verified profile" />}
      </div>
      {location && <p><MapPin /> {location}</p>}
    </div>
  )
}

function DiscoveryState({ icon, title, body, action }: { icon?: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <motion.div className="discovery-state perennia-empty-state-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {icon && <span className="discovery-state-icon">{icon}</span>}
      <h1 className="perennia-empty-state-heading">{title}</h1>
      <p className="perennia-empty-state-copy">{body}</p>
      {action}
    </motion.div>
  )
}
