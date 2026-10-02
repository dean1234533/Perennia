import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'framer-motion'
import {
  BadgeCheck,
  Check,
  Crown,
  LockKeyhole,
  Loader2,
  MapPin,
  Pause,
  Play,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { MatchingPreferencesPanel } from '@/components/shared/MatchingPreferencesPanel'
import { InterestHeartsIcon, type InterestHeartState } from '@/components/shared/InterestHeartsIcon'
import { Switch } from '@/components/ui/switch'
import { profileAstrologyAsset } from '@/data/profileAstrologyAssets'
import { fetchDiscoveryCandidates, getPrivateLifestyle, type DiscoveryCandidate, type PrivateLifestyle } from '@/lib/firestore'
import { getCompatibility, type CompatibilityResult, type PersonBirthProfile } from '@/lib/compatibilityApi'
import { subscribeFoundingMembership } from '@/lib/founding500'
import type { FoundingMemberRecord } from '@/types/founding500'
import { geocodeLocation } from '@/lib/geocodeApi'
import {
  DISCOVERY_SEARCH_RADII,
  DiscoveryAreaSearchUnavailableError,
  searchDiscoveryAreaCandidates,
  type DiscoveryAreaSearchItem,
  type DiscoverySearchRadiusMiles,
  type ResolvedDiscoveryArea,
  type ResolveDiscoveryArea,
  type SearchDiscoveryArea,
} from '@/lib/discoveryAreaSearch'
import { calculateAge } from '@/lib/age'
import { milesBetween } from '@/lib/distance'
import { useModalAccessibility } from '@/hooks/useModalAccessibility'
import './Discovery.css'

export interface DiscoveryPreviewData {
  candidates: DiscoveryCandidate[]
  scores: Record<string, CompatibilityResult>
  lifestyles?: Record<string, PrivateLifestyle | null>
  mediaByCandidate?: Record<string, DiscoveryFeedMedia>
  interestStates?: Record<string, InterestHeartState>
  isPremium?: boolean
  resolveArea?: ResolveDiscoveryArea
  searchArea?: SearchDiscoveryArea
  initialAreaDialogOpen?: boolean
  onPremiumUpgrade?: (path: string) => void
  onViewProfile?: (profile: DiscoveryCandidate) => void
}

export interface DiscoveryFeedMedia {
  type: 'image' | 'video'
  url: string
  poster?: string
}

export function Discovery({ previewData }: { previewData?: DiscoveryPreviewData } = {}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { passedIds, likedIds, matchedIds, blockedIds, onboarding, likeProfile } = useApp()
  const [discoveryMode, setDiscoveryMode] = useState<'all' | 'area'>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [areaDialogOpen, setAreaDialogOpen] = useState(previewData?.initialAreaDialogOpen ?? false)
  const [areaQuery, setAreaQuery] = useState('')
  const [resolvedArea, setResolvedArea] = useState<ResolvedDiscoveryArea | null>(null)
  const [activeArea, setActiveArea] = useState<ResolvedDiscoveryArea | null>(null)
  const [radiusMiles, setRadiusMiles] = useState<DiscoverySearchRadiusMiles>(25)
  const [highCompatibilityOnly, setHighCompatibilityOnly] = useState(false)
  const [areaItems, setAreaItems] = useState<DiscoveryAreaSearchItem[]>([])
  const [areaStatus, setAreaStatus] = useState<'idle' | 'resolving' | 'searching' | 'error'>('idle')
  const [areaError, setAreaError] = useState('')
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>(previewData?.candidates ?? [])
  const [loadingCandidates, setLoadingCandidates] = useState(!previewData)
  const [scores, setScores] = useState<Record<string, CompatibilityResult>>(previewData?.scores ?? {})
  const [failedUids, setFailedUids] = useState<Set<string>>(new Set())
  const [lifestyles, setLifestyles] = useState<Record<string, PrivateLifestyle | null>>(previewData?.lifestyles ?? {})
  const [actionPendingUid, setActionPendingUid] = useState<string | null>(null)
  const [previewInterestStates, setPreviewInterestStates] = useState<Record<string, InterestHeartState>>(previewData?.interestStates ?? {})
  const [membership, setMembership] = useState<FoundingMemberRecord | null>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  useEffect(() => {
    if (previewData) return
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
  }, [previewData, user])

  useEffect(() => {
    if (previewData || !user) return
    return subscribeFoundingMembership(user.uid, setMembership)
  }, [previewData, user])

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
    if (passedIds.includes(c.uid) || blockedIds.includes(c.uid)) return false
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
    if (previewData) return
    if (!wantsChildren) return
    const toFetch = eligible.filter((c) => !(c.uid in lifestyles)).slice(0, 30)
    if (toFetch.length === 0) return
    let cancelled = false
    Promise.all(toFetch.map((c) => getPrivateLifestyle(c.uid).then((l) => [c.uid, l] as const))).then((results) => {
      if (!cancelled) setLifestyles((prev) => ({ ...prev, ...Object.fromEntries(results) }))
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewData, wantsChildren, eligible.map((c) => c.uid).join(',')])

  const selfChartComplete = Boolean(
    onboarding.sunSign && onboarding.moonSign && onboarding.risingSign &&
    onboarding.chineseAnimal && onboarding.chineseElement && onboarding.yinYang
  )

  const hasCompleteChart = (c: DiscoveryCandidate) =>
    !!(c.sunSign && c.moonSign && c.risingSign && c.chineseAnimal && c.chineseElement && c.yinYang)
  const scoreResolutionKey = eligible
    .map((candidate) => `${candidate.uid}:${scores[candidate.uid] ? 'ready' : failedUids.has(candidate.uid) ? 'failed' : 'pending'}`)
    .join('|')

  useEffect(() => {
    if (previewData) return
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
  }, [previewData, scoreResolutionKey, selfChartComplete, onboarding.sunSign, onboarding.moonSign, onboarding.risingSign, onboarding.chineseAnimal, onboarding.chineseElement, onboarding.yinYang])

  const allVisible = eligible
    .map((c) => ({ ...c, compatibility: scores[c.uid]?.compatibility ?? null, distance: distanceTo(c) }))
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0
      if (a.distance === null) return 1
      if (b.distance === null) return -1
      return a.distance - b.distance
    })

  const areaVisible = areaItems
    .map((item) => ({
      ...item.candidate,
      compatibility: item.compatibility?.compatibility ?? null,
      distance: item.distanceMiles,
    }))
    .sort((a, b) => highCompatibilityOnly
      ? (b.compatibility ?? -1) - (a.compatibility ?? -1) || (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY)
      : (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY))

  const visible = discoveryMode === 'area' ? areaVisible : allVisible
  const isPremium = previewData?.isPremium ?? (membership?.tier === 'premium' && !membership.canceledAt)

  const loading = loadingCandidates

  async function resolveAreaInput() {
    const query = areaQuery.trim()
    if (!query) return
    setAreaStatus('resolving')
    setAreaError('')
    setResolvedArea(null)
    try {
      const area = previewData?.resolveArea
        ? await previewData.resolveArea(query)
        : await resolveProductionDiscoveryArea(query)
      setResolvedArea(area)
      setAreaQuery(area.label)
      setAreaStatus('idle')
    } catch (error) {
      setAreaStatus('error')
      setAreaError(error instanceof Error ? error.message : 'We could not find that UK town, city or postcode.')
    }
  }

  async function runAreaSearch({
    area = resolvedArea,
    radius = radiusMiles,
    highOnly = highCompatibilityOnly,
    closeDialog = true,
  }: {
    area?: ResolvedDiscoveryArea | null
    radius?: DiscoverySearchRadiusMiles
    highOnly?: boolean
    closeDialog?: boolean
  } = {}) {
    if (!area) return
    setAreaStatus('searching')
    setAreaError('')
    try {
      const result = await (previewData?.searchArea ?? searchDiscoveryAreaCandidates)({
        area,
        radiusMiles: radius,
        highCompatibilityOnly: highOnly,
      })
      const resolvedScores = result.items.flatMap((item) => item.compatibility ? [[item.candidate.uid, item.compatibility] as const] : [])
      if (resolvedScores.length) setScores((previous) => ({ ...previous, ...Object.fromEntries(resolvedScores) }))
      setAreaItems(result.items)
      setActiveArea(result.area)
      setResolvedArea(result.area)
      setAreaQuery(result.area.label)
      setRadiusMiles(result.radiusMiles)
      setHighCompatibilityOnly(highOnly)
      setDiscoveryMode('area')
      setAreaStatus('idle')
      if (closeDialog) setAreaDialogOpen(false)
    } catch (error) {
      setAreaStatus('error')
      setAreaError(error instanceof DiscoveryAreaSearchUnavailableError
        ? error.message
        : error instanceof Error ? error.message : 'Search Area is unavailable right now.')
      setAreaDialogOpen(true)
    }
  }

  function clearAreaSearch() {
    setDiscoveryMode('all')
    setAreaItems([])
    setActiveArea(null)
    setResolvedArea(null)
    setAreaQuery('')
    setRadiusMiles(25)
    setHighCompatibilityOnly(false)
    setAreaStatus('idle')
    setAreaError('')
    setAreaDialogOpen(false)
  }

  function requestPremiumUpgrade() {
    const path = '/founding-500?next=%2Fdiscovery'
    if (previewData?.onPremiumUpgrade) previewData.onPremiumUpgrade(path)
    else navigate(path)
  }

  function openAreaEditor() {
    setAreaError('')
    setAreaStatus('idle')
    setAreaDialogOpen(true)
  }

  function increaseAreaRadius() {
    const index = DISCOVERY_SEARCH_RADII.indexOf(radiusMiles)
    const nextRadius = DISCOVERY_SEARCH_RADII[index + 1]
    if (nextRadius && activeArea) void runAreaSearch({ area: activeArea, radius: nextRadius, closeDialog: false })
  }

  async function handleLike(profile: DiscoveryCandidate & { compatibility: number | null }) {
    if (actionPendingUid || interestStateFor(profile.uid) !== 'neutral') return
    if (previewData) {
      setPreviewInterestStates((previous) => ({ ...previous, [profile.uid]: 'interested' }))
      return
    }
    setActionPendingUid(profile.uid)
    try {
      const { matchId, conversationId } = await likeProfile(profile.uid)
      if (matchId) navigate(`/match/${matchId}`, { state: { otherUid: profile.uid, compatibility: profile.compatibility } })
      else if (conversationId) navigate(`/messages/${conversationId}`, { state: { otherUid: profile.uid } })
    } catch (err) {
      console.warn('[Perennia] Failed to like profile:', err)
    } finally {
      setActionPendingUid(null)
    }
  }

  function interestStateFor(uid: string): InterestHeartState {
    if (previewData) return previewInterestStates[uid] ?? 'neutral'
    if (matchedIds.includes(uid)) return 'matched'
    if (likedIds.includes(uid)) return 'interested'
    return 'neutral'
  }

  function openProfile(profile: DiscoveryCandidate) {
    if (previewData?.onViewProfile) previewData.onViewProfile(profile)
    else navigate(`/profile/${profile.uid}`)
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="discovery-page">
      <header className="discovery-toolbar" aria-label="Discovery controls">
        <div className="discovery-segmented" role="group" aria-label="Choose Explore area">
          <button
            className={discoveryMode === 'all' ? 'is-active' : ''}
            onClick={clearAreaSearch}
            aria-pressed={discoveryMode === 'all'}
          >
            All Matches
          </button>
          <button
            className={discoveryMode === 'area' ? 'is-active' : ''}
            onClick={openAreaEditor}
            aria-pressed={discoveryMode === 'area'}
          >
            Search Area
          </button>
        </div>
        <button className="discovery-filter-button" onClick={() => setFilterOpen(true)} aria-label="Open discovery filters">
          <SlidersHorizontal />
        </button>
      </header>

      {discoveryMode === 'area' && activeArea && (
        <div className="discovery-area-summary" aria-label={`Search Area: ${activeArea.label}, within ${radiusMiles} miles${highCompatibilityOnly ? ', High Compatibility Only' : ''}`}>
          <MapPin aria-hidden="true" />
          <span>
            <strong>{activeArea.label}</strong>
            <small>Within {radiusMiles} miles{highCompatibilityOnly ? ' · High Compatibility Only' : ''}</small>
          </span>
          <button type="button" onClick={openAreaEditor}>Edit</button>
          <button type="button" onClick={clearAreaSearch}>Clear</button>
        </div>
      )}

      {!selfChartComplete ? (
        <DiscoveryState icon={<Sparkles />} title="Complete Your Cosmic Profile" body="Add your birth date, time, and place so Perennia can calculate real compatibility." action={<button onClick={() => navigate('/birth-details')}>Add Birth Details</button>} />
      ) : discoveryMode === 'area' && areaStatus === 'searching' ? (
        <div className="discovery-loading" role="status" aria-label="Searching selected area"><Loader2 /></div>
      ) : loading && discoveryMode === 'all' ? (
        <div className="discovery-loading" role="status" aria-label="Loading compatible profiles"><Loader2 /></div>
      ) : discoveryMode === 'all' && candidates.length === 0 ? (
        <DiscoveryState title="No eligible profiles are available" body="There are no Discovery profiles available for your account right now." />
      ) : discoveryMode === 'area' && activeArea && visible.length === 0 ? (
        <DiscoveryAreaEmptyState
          area={activeArea}
          radiusMiles={radiusMiles}
          highCompatibilityOnly={highCompatibilityOnly}
          canIncreaseRadius={radiusMiles < 50}
          onShowEveryone={() => void runAreaSearch({ area: activeArea, highOnly: false, closeDialog: false })}
          onIncreaseRadius={increaseAreaRadius}
          onChooseAnotherArea={openAreaEditor}
          onReturnToAll={clearAreaSearch}
        />
      ) : visible.length === 0 ? (
        <DiscoveryState title="No profiles match your preferences" body="No profiles currently meet your discovery preferences." />
      ) : visible.length > 0 ? (
        <div className="discovery-stage" aria-label="Explore member feed">
          {visible.map((candidate, index) => {
            const interestState = interestStateFor(candidate.uid)
            const areaResult = discoveryMode === 'area' ? areaItems.find((item) => item.candidate.uid === candidate.uid) : undefined
            const compatibilityResult = areaResult?.compatibility ?? scores[candidate.uid]
            const media = previewData?.mediaByCandidate?.[candidate.uid] ?? {
              type: 'image' as const,
              url: candidate.profilePhotoUrl,
            }
            return (
              <motion.article
                key={candidate.uid}
                initial={{ opacity: index === 0 ? 1 : 0.7 }}
                whileInView={{ opacity: 1 }}
                viewport={{ amount: 0.65 }}
                transition={{ duration: 0.3 }}
                className="discovery-card"
              >
                <div className="discovery-photo-panel">
                  <DiscoveryMedia media={media} memberName={candidate.name} />
                  <div className="discovery-photo-shade" />
                  <div className="discovery-card-identity">
                    <Identity
                      candidate={candidate}
                      result={compatibilityResult}
                      compatibilityPending={discoveryMode === 'all' && selfChartComplete && hasCompleteChart(candidate) && !failedUids.has(candidate.uid) && !scores[candidate.uid]}
                      onOpenProfile={() => openProfile(candidate)}
                    />
                  </div>
                  <aside className="discovery-action-rail" aria-label={`Actions and astrology for ${candidate.name}`}>
                    <button
                      type="button"
                      className="discovery-rail-item discovery-rail-button"
                      onClick={() => openProfile(candidate)}
                      aria-label="View profile"
                    >
                      <span className="discovery-rail-icon discovery-rail-icon--profile" aria-hidden="true"><UserRound /></span>
                    </button>
                    <DiscoveryInterestRailItem
                      state={interestState}
                      pending={actionPendingUid === candidate.uid}
                      onInterest={() => void handleLike(candidate)}
                    />
                    <DiscoveryAstrologyRailItem kind="western" value={candidate.sunSign} descriptor="Western Sun sign" />
                    <DiscoveryAstrologyRailItem kind="chinese" value={candidate.chineseAnimal} descriptor="Chinese zodiac" />
                  </aside>
                </div>
              </motion.article>
            )
          })}
        </div>
      ) : null}

      <AnimatePresence>
        {areaDialogOpen && (
          <DiscoveryAreaDialog
            query={areaQuery}
            resolvedArea={resolvedArea}
            radiusMiles={radiusMiles}
            highCompatibilityOnly={highCompatibilityOnly}
            isPremium={isPremium}
            status={areaStatus}
            error={areaError}
            hasActiveArea={activeArea !== null}
            onQueryChange={(value) => {
              setAreaQuery(value)
              setResolvedArea(value === activeArea?.label ? activeArea : null)
              setAreaError('')
              setAreaStatus('idle')
            }}
            onResolve={() => void resolveAreaInput()}
            onRadiusChange={setRadiusMiles}
            onHighCompatibilityChange={setHighCompatibilityOnly}
            onLockedPremium={requestPremiumUpgrade}
            onApply={() => void runAreaSearch()}
            onClear={clearAreaSearch}
            onClose={() => setAreaDialogOpen(false)}
          />
        )}
        {filterOpen && (
          <motion.div key="discovery-filters" className="discovery-filter-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && setFilterOpen(false)}>
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
    </MotionConfig>
  )
}

function DiscoveryAreaDialog({
  query,
  resolvedArea,
  radiusMiles,
  highCompatibilityOnly,
  isPremium,
  status,
  error,
  hasActiveArea,
  onQueryChange,
  onResolve,
  onRadiusChange,
  onHighCompatibilityChange,
  onLockedPremium,
  onApply,
  onClear,
  onClose,
}: {
  query: string
  resolvedArea: ResolvedDiscoveryArea | null
  radiusMiles: DiscoverySearchRadiusMiles
  highCompatibilityOnly: boolean
  isPremium: boolean
  status: 'idle' | 'resolving' | 'searching' | 'error'
  error: string
  hasActiveArea: boolean
  onQueryChange: (value: string) => void
  onResolve: () => void
  onRadiusChange: (value: DiscoverySearchRadiusMiles) => void
  onHighCompatibilityChange: (value: boolean) => void
  onLockedPremium: () => void
  onApply: () => void
  onClear: () => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLElement>(null)
  useModalAccessibility({ open: true, dialogRef, onClose })
  const busy = status === 'resolving' || status === 'searching'

  return createPortal(
    <motion.div
      className="discovery-area-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.section
        ref={dialogRef}
        className="discovery-area-panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-area-title"
        tabIndex={-1}
        data-modal-surface
      >
        <div className="discovery-area-heading">
          <span>
            <p>Explore somewhere specific</p>
            <h2 id="discovery-area-title">Search Area</h2>
          </span>
          <button type="button" data-modal-initial-focus onClick={onClose} aria-label="Close Search Area"><X /></button>
        </div>

        <div className="discovery-area-field">
          <label htmlFor="discovery-area-input">Town, city or postcode</label>
          <div>
            <span><MapPin aria-hidden="true" /></span>
            <input
              id="discovery-area-input"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && query.trim() && !busy) {
                  event.preventDefault()
                  onResolve()
                }
              }}
              placeholder="For example, London or SW1A 1AA"
              autoComplete="postal-code"
              aria-describedby={error ? 'discovery-area-error' : resolvedArea ? 'discovery-area-resolved' : undefined}
            />
            <button type="button" onClick={onResolve} disabled={!query.trim() || busy}>
              {status === 'resolving' ? <><Loader2 aria-hidden="true" /> Finding…</> : 'Find area'}
            </button>
          </div>
          {resolvedArea && (
            <p id="discovery-area-resolved" className="discovery-area-resolved" role="status"><Check aria-hidden="true" /> Selected: {resolvedArea.label}</p>
          )}
          {error && <p id="discovery-area-error" className="discovery-area-error" role="alert">{error}</p>}
        </div>

        <fieldset className="discovery-area-radius">
          <legend>Search radius</legend>
          <div role="radiogroup" aria-label="Search radius in miles">
            {DISCOVERY_SEARCH_RADII.map((radius) => (
              <button
                key={radius}
                type="button"
                role="radio"
                aria-checked={radiusMiles === radius}
                className={radiusMiles === radius ? 'is-active' : ''}
                onClick={() => onRadiusChange(radius)}
              >
                {radius} miles
              </button>
            ))}
          </div>
        </fieldset>

        <div className={`discovery-area-premium ${highCompatibilityOnly ? 'is-active' : ''}`}>
          {isPremium ? (
            <label htmlFor="discovery-high-compatibility">
              <span><Crown aria-hidden="true" /></span>
              <span><strong>High Compatibility Only</strong><small>Show profiles already classified as high compatibility.</small></span>
              <Switch
                id="discovery-high-compatibility"
                checked={highCompatibilityOnly}
                onCheckedChange={onHighCompatibilityChange}
                aria-label="High Compatibility Only"
              />
            </label>
          ) : (
            <button type="button" onClick={onLockedPremium} aria-label="High Compatibility Only, Premium locked">
              <span><LockKeyhole aria-hidden="true" /></span>
              <span><strong>High Compatibility Only</strong><small>Premium · Upgrade to activate this filter.</small></span>
              <Crown aria-hidden="true" />
            </button>
          )}
        </div>

        <p className="discovery-area-privacy">Searches use a broad area only. Other members’ exact coordinates, addresses and postcodes are never shown.</p>

        <div className="discovery-area-actions">
          {hasActiveArea && <button type="button" className="is-secondary" onClick={onClear}>Remove area</button>}
          <button type="button" className="is-primary" onClick={onApply} disabled={!resolvedArea || busy}>
            {status === 'searching' ? <><Loader2 aria-hidden="true" /> Searching…</> : 'Apply Search'}
          </button>
        </div>
      </motion.section>
    </motion.div>,
    document.body,
  )
}

function DiscoveryInterestRailItem({
  state,
  pending,
  onInterest,
}: {
  state: InterestHeartState
  pending: boolean
  onInterest: () => void
}) {
  const accessibleLabel = state === 'matched'
    ? 'Mutual match'
    : state === 'interested'
      ? 'Romantic interest sent'
      : 'Express romantic interest'

  if (state !== 'neutral') {
    return (
      <div className={`discovery-rail-item discovery-interest-state is-${state}`} role="status" aria-label={accessibleLabel}>
        <span className="discovery-rail-icon discovery-rail-icon--interested" aria-hidden="true">
          <InterestHeartsIcon state={state} className="discovery-interest-hearts" />
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="discovery-rail-item discovery-rail-button"
      onClick={onInterest}
      disabled={pending}
      aria-label={pending ? 'Recording romantic interest' : accessibleLabel}
    >
      <span className="discovery-rail-icon discovery-rail-icon--interested" aria-hidden="true">
        {pending ? <Loader2 className="discovery-action-spinner" /> : <InterestHeartsIcon state="neutral" className="discovery-interest-hearts" />}
      </span>
    </button>
  )
}

function DiscoveryMedia({ media, memberName }: { media: DiscoveryFeedMedia; memberName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const [playing, setPlaying] = useState(media.type === 'video' && !shouldReduceMotion)

  useEffect(() => {
    if (media.type !== 'video') return
    const video = videoRef.current
    if (!video) return
    if (shouldReduceMotion) {
      video.pause()
      setPlaying(false)
      return
    }
    void video.play().catch(() => setPlaying(false))
  }, [media.type, shouldReduceMotion])

  if (media.type === 'image') {
    return <img className="discovery-media" src={media.url} alt={`Public media from ${memberName}`} />
  }

  async function togglePlayback() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) await video.play()
    else video.pause()
  }

  return (
    <>
      <video
        ref={videoRef}
        className="discovery-media"
        src={media.url}
        poster={media.poster}
        autoPlay={!shouldReduceMotion}
        muted
        loop
        playsInline
        aria-label={`Public video from ${memberName}`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        className="discovery-media-control"
        onClick={() => void togglePlayback()}
        aria-label={`${playing ? 'Pause' : 'Play'} ${memberName}'s video`}
      >
        {playing ? <Pause /> : <Play />}
      </button>
    </>
  )
}

function DiscoveryAstrologyRailItem({
  kind,
  value,
  descriptor,
}: {
  kind: 'western' | 'chinese'
  value: string
  descriptor: string
}) {
  const imageSrc = profileAstrologyAsset(kind, value)
  return (
    <div className="discovery-rail-item" aria-label={`${value}, ${descriptor}`}>
      <span className={`discovery-rail-art discovery-rail-art--${kind}`} aria-hidden="true">
        {imageSrc ? <img src={imageSrc} alt="" draggable={false} /> : <span className="discovery-rail-fallback">✦</span>}
      </span>
    </div>
  )
}

function Identity({
  candidate,
  result,
  compatibilityPending,
  onOpenProfile,
}: {
  candidate: DiscoveryCandidate & { compatibility: number | null; distance: number | null }
  result?: CompatibilityResult
  compatibilityPending: boolean
  onOpenProfile: () => void
}) {
  const age = calculateAge(candidate.birthDate)
  const location = candidate.profileExtras?.location || [candidate.city, candidate.country].filter(Boolean).join(', ')
  return (
    <div className="discovery-identity">
      <div className="discovery-name-row">
        <h1>
          <button type="button" className="discovery-name-link" onClick={onOpenProfile} aria-label={`View ${candidate.name}'s profile`}>
            {candidate.name.split(' ')[0]}{age !== null ? `, ${age}` : ''}
          </button>
        </h1>
        {candidate.verification?.status === 'verified' && <BadgeCheck aria-label="Verified profile" />}
      </div>
      {location && <p><MapPin /> {location}</p>}
      <div className="discovery-match-summary">
        <span className="discovery-compatibility-score">
          {result ? `${result.compatibility}% compatible` : compatibilityPending ? 'Calculating compatibility…' : 'Compatibility unavailable'}
        </span>
      </div>
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

function DiscoveryAreaEmptyState({
  area,
  radiusMiles,
  highCompatibilityOnly,
  canIncreaseRadius,
  onShowEveryone,
  onIncreaseRadius,
  onChooseAnotherArea,
  onReturnToAll,
}: {
  area: ResolvedDiscoveryArea
  radiusMiles: DiscoverySearchRadiusMiles
  highCompatibilityOnly: boolean
  canIncreaseRadius: boolean
  onShowEveryone: () => void
  onIncreaseRadius: () => void
  onChooseAnotherArea: () => void
  onReturnToAll: () => void
}) {
  return (
    <DiscoveryState
      title={highCompatibilityOnly ? 'No high-compatibility profiles in this area yet' : 'No profiles in this area yet'}
      body={`${area.label} · within ${radiusMiles} miles. ${highCompatibilityOnly ? 'Try everyone in this area or broaden your search.' : 'Try a wider radius or choose another area.'}`}
      action={(
        <div className="discovery-area-empty-actions">
          {highCompatibilityOnly && <button type="button" onClick={onShowEveryone}>Show everyone in this area</button>}
          {canIncreaseRadius && <button type="button" onClick={onIncreaseRadius}>Increase the radius</button>}
          <button type="button" onClick={onChooseAnotherArea}>Choose another area</button>
          <button type="button" onClick={onReturnToAll}>Return to All Matches</button>
        </div>
      )}
    />
  )
}

async function resolveProductionDiscoveryArea(query: string): Promise<ResolvedDiscoveryArea> {
  const result = await geocodeLocation(query)
  const country = result.matchedCountry.trim().toLowerCase()
  const isUnitedKingdom = country === 'gb' || country === 'uk' || country === 'united kingdom'
  if (!isUnitedKingdom) throw new Error('Search Area currently accepts UK towns, cities and postcodes only.')
  return {
    label: `${result.matchedCity}, United Kingdom`,
    lat: result.lat,
    lon: result.lon,
  }
}
