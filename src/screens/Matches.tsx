import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, MotionConfig } from 'framer-motion'
import { BadgeCheck, LockKeyhole, MessageCircle, Loader2, RefreshCw, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { CompatibilityWhyDialog } from '@/components/shared/CompatibilityWhyDialog'
import { ConnectionHeartsIcon } from '@/components/shared/ConnectionHeartsIcon'
import { InterestHeartsIcon } from '@/components/shared/InterestHeartsIcon'
import { subscribeMyMatches, getUserDoc, type MatchDoc, type DiscoveryCandidate } from '@/lib/firestore'
import { getCompatibility, type CompatibilityResult, type PersonBirthProfile } from '@/lib/compatibilityApi'
import { subscribeFoundingMembership } from '@/lib/founding500'
import type { FoundingMemberRecord } from '@/types/founding500'

export interface MatchesPreviewData {
  matches: Array<{ matchId: string; profile: DiscoveryCandidate }>
  scores: Record<string, CompatibilityResult>
  isPremium?: boolean
  subscribeMatches?: (
    onMatches: (matches: Array<{ matchId: string; profile: DiscoveryCandidate }>) => void,
    onError: (error: Error) => void,
  ) => () => void
  onViewProfile?: (profile: DiscoveryCandidate) => void
  onMessage?: (matchId: string, profile: DiscoveryCandidate) => void
}

type MatchesLoadIssueSource = 'subscription' | 'profiles' | 'compatibility' | 'membership'
type MatchesLoadIssues = Partial<Record<MatchesLoadIssueSource, string>>

export function Matches({ previewData }: { previewData?: MatchesPreviewData } = {}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { onboarding } = useApp()
  const [matches, setMatches] = useState<MatchDoc[] | null>(previewData ? [] : null)
  const [previewMatches, setPreviewMatches] = useState<MatchesPreviewData['matches'] | null>(
    previewData?.subscribeMatches ? null : previewData?.matches ?? null,
  )
  const [profiles, setProfiles] = useState<Record<string, DiscoveryCandidate>>({})
  const [failedProfileUids, setFailedProfileUids] = useState<Set<string>>(new Set())
  const [profilesPending, setProfilesPending] = useState(false)
  const [scores, setScores] = useState<Record<string, CompatibilityResult>>(previewData?.scores ?? {})
  const [failedUids, setFailedUids] = useState<Set<string>>(new Set())
  const [membership, setMembership] = useState<FoundingMemberRecord | null>(null)
  const [subscriptionPending, setSubscriptionPending] = useState(!previewData || Boolean(previewData.subscribeMatches))
  const [loadIssues, setLoadIssues] = useState<MatchesLoadIssues>({})
  const [retryRevision, setRetryRevision] = useState(0)
  const [explanation, setExplanation] = useState<{ memberName: string; result: CompatibilityResult } | null>(null)

  useEffect(() => {
    if (!previewData) return
    if (!previewData.subscribeMatches) {
      setPreviewMatches(previewData.matches)
      setSubscriptionPending(false)
      setLoadIssues((current) => ({ ...current, subscription: undefined }))
      return
    }

    let active = true
    if (previewMatches === null) setSubscriptionPending(true)
    const unsubscribe = previewData.subscribeMatches(
      (nextMatches) => {
        if (!active) return
        setPreviewMatches(nextMatches)
        setSubscriptionPending(false)
        setLoadIssues((current) => ({ ...current, subscription: undefined }))
      },
      (error) => {
        if (!active) return
        console.warn('[Perennia preview] Matches subscription failed:', error)
        setSubscriptionPending(false)
        setLoadIssues((current) => ({ ...current, subscription: 'We could not refresh your matches.' }))
      },
    )
    return () => {
      active = false
      unsubscribe()
    }
    // previewMatches is deliberately retained across retries and must not
    // create another subscription when a snapshot arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewData, retryRevision])

  useEffect(() => {
    if (previewData || !user) return
    let active = true
    if (matches === null) setSubscriptionPending(true)
    const unsubscribe = subscribeMyMatches(
      user.uid,
      (nextMatches) => {
        if (!active) return
        setMatches(nextMatches)
        setSubscriptionPending(false)
        setLoadIssues((current) => ({ ...current, subscription: undefined }))
      },
      (error) => {
        if (!active) return
        console.warn('[Perennia] Matches subscription failed:', error)
        setSubscriptionPending(false)
        setLoadIssues((current) => ({ ...current, subscription: 'We could not refresh your matches.' }))
      },
    )
    return () => {
      active = false
      unsubscribe()
    }
    // matches is intentionally retained across retries and live errors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewData, user, retryRevision])

  const productionProfileUids = previewData || !user
    ? []
    : [...new Set((matches ?? [])
        .map((match) => match.users.find((uid) => uid !== user.uid))
        .filter((uid): uid is string => Boolean(uid)))]
  const profileResolutionKey = productionProfileUids
    .map((uid) => `${uid}:${profiles[uid] ? 'ready' : failedProfileUids.has(uid) ? 'failed' : 'pending'}`)
    .join('|')

  useEffect(() => {
    if (previewData || !user || matches === null) return
    const missing = productionProfileUids.filter((uid) => !profiles[uid] && !failedProfileUids.has(uid))
    if (missing.length === 0) {
      setProfilesPending(false)
      return
    }

    let active = true
    setProfilesPending(true)
    Promise.allSettled(missing.map(async (uid) => {
      const profile = await getUserDoc(uid)
      if (!profile) throw new Error(`Profile ${uid} is unavailable.`)
      return { uid, profile: { uid, ...profile } as DiscoveryCandidate }
    })).then((results) => {
      if (!active) return
      const nextProfiles: Record<string, DiscoveryCandidate> = {}
      const failed: string[] = []
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') nextProfiles[result.value.uid] = result.value.profile
        else failed.push(missing[index])
      })
      if (Object.keys(nextProfiles).length > 0) {
        setProfiles((current) => ({ ...current, ...nextProfiles }))
      }
      if (failed.length > 0) {
        console.warn('[Perennia] Failed to load one or more match profiles.')
        setFailedProfileUids((current) => new Set([...current, ...failed]))
        setLoadIssues((current) => ({ ...current, profiles: 'We could not load all of your match profiles.' }))
      } else {
        setLoadIssues((current) => ({ ...current, profiles: undefined }))
      }
    }).finally(() => {
      if (active) setProfilesPending(false)
    })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, previewData, user?.uid, profileResolutionKey, retryRevision])

  useEffect(() => {
    if (previewData || !user) return
    let active = true
    const unsubscribe = subscribeFoundingMembership(
      user.uid,
      (record) => {
        if (!active) return
        setMembership(record)
        setLoadIssues((current) => ({ ...current, membership: undefined }))
      },
      (error) => {
        if (!active) return
        console.warn('[Perennia] Membership subscription failed:', error)
        setLoadIssues((current) => ({ ...current, membership: 'Premium access could not be refreshed.' }))
      },
    )
    return () => {
      active = false
      unsubscribe()
    }
  }, [previewData, user, retryRevision])

  const matched = previewData ? (previewMatches ?? []) : (user
    ? (matches ?? [])
        .map((m) => {
          const otherUid = m.users.find((u) => u !== user.uid)
          return otherUid ? { matchId: m.id, profile: profiles[otherUid] } : null
        })
        .filter((m): m is { matchId: string; profile: DiscoveryCandidate } => !!m?.profile)
    : [])
  const selfChartComplete = Boolean(
    onboarding.sunSign && onboarding.moonSign && onboarding.risingSign &&
    onboarding.chineseAnimal && onboarding.chineseElement && onboarding.yinYang,
  )
  const hasCompleteChart = (profile: DiscoveryCandidate) => Boolean(
    profile.sunSign && profile.moonSign && profile.risingSign &&
    profile.chineseAnimal && profile.chineseElement && profile.yinYang,
  )
  const scoreResolutionKey = matched
    .map(({ profile }) => `${profile.uid}:${scores[profile.uid] ? 'ready' : failedUids.has(profile.uid) ? 'failed' : 'pending'}`)
    .join('|')

  useEffect(() => {
    if (previewData || !selfChartComplete) return
    const toFetch = matched
      .map(({ profile }) => profile)
      .filter((profile) => hasCompleteChart(profile) && !scores[profile.uid] && !failedUids.has(profile.uid))
      .slice(0, 20)
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
    Promise.all(toFetch.map(async (profile) => {
      try {
        const result = await getCompatibility({
          personA,
          personB: {
            sunSign: profile.sunSign,
            moonSign: profile.moonSign,
            risingSign: profile.risingSign,
            chineseAnimal: profile.chineseAnimal,
            chineseElement: profile.chineseElement,
            yinYang: profile.yinYang,
          },
        })
        return { uid: profile.uid, result }
      } catch (error) {
        console.warn(`[Perennia] Failed to compute match compatibility for ${profile.uid}:`, error)
        return { uid: profile.uid, result: null }
      }
    })).then((results) => {
      if (cancelled) return
      const resolved = results.filter((entry): entry is { uid: string; result: CompatibilityResult } => entry.result !== null)
      const failed = results.filter((entry) => entry.result === null).map((entry) => entry.uid)
      if (resolved.length) setScores((previous) => ({ ...previous, ...Object.fromEntries(resolved.map((entry) => [entry.uid, entry.result])) }))
      if (failed.length) {
        setFailedUids((previous) => new Set([...previous, ...failed]))
        setLoadIssues((current) => ({ ...current, compatibility: 'Some compatibility details could not be refreshed.' }))
      } else {
        setLoadIssues((current) => ({ ...current, compatibility: undefined }))
      }
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewData, scoreResolutionKey, selfChartComplete, onboarding.sunSign, onboarding.moonSign, onboarding.risingSign, onboarding.chineseAnimal, onboarding.chineseElement, onboarding.yinYang])

  const isPremium = previewData?.isPremium ?? (membership?.tier === 'premium' && !membership.canceledAt)
  const sourceReady = previewData ? previewMatches !== null : matches !== null
  const unresolvedRequiredProfiles = !previewData && productionProfileUids.some((uid) => !profiles[uid] && !failedProfileUids.has(uid))
  const blockingIssue = matched.length === 0
    ? loadIssues.subscription ?? loadIssues.profiles
    : undefined
  const isInitialLoading = !blockingIssue && (
    !sourceReady || subscriptionPending || (matched.length === 0 && (profilesPending || unresolvedRequiredProfiles))
  )
  const nonBlockingIssues = Object.values(loadIssues).filter((message): message is string => Boolean(message))

  function retryLoad() {
    setLoadIssues({})
    setFailedProfileUids(new Set())
    setFailedUids(new Set())
    if (!sourceReady) setSubscriptionPending(true)
    setRetryRevision((revision) => revision + 1)
  }

  function openWhyMatched(profile: DiscoveryCandidate) {
    const result = scores[profile.uid]
    if (!result) return
    if (!isPremium) {
      navigate('/founding-500?next=%2Fmatches')
      return
    }
    setExplanation({ memberName: profile.name.split(' ')[0], result })
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="px-6 pt-8 pb-10 md:px-10 md:pt-12 lg:px-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Mutual Interest</p>
        <h1 className="font-serif-display text-4xl md:text-5xl">Your Matches</h1>
        <p className="mt-3 max-w-lg text-white/50">
          {matched.length} mutual matches. Reach out and start a story.
        </p>
      </motion.div>

      {!blockingIssue && nonBlockingIssues.length > 0 && (
        <MatchesLoadNotice retained onRetry={retryLoad} />
      )}

      {isInitialLoading ? (
        <div className="flex justify-center py-24" role="status" aria-live="polite" aria-label="Loading your matches">
          <Loader2 className="h-6 w-6 animate-spin text-gold" aria-hidden="true" />
        </div>
      ) : blockingIssue ? (
        <MatchesLoadNotice onRetry={retryLoad} />
      ) : matched.length === 0 ? (
        <div className="perennia-empty-state-panel glass flex flex-col items-center gap-3 rounded-3xl px-8 py-20 text-center">
          <p className="perennia-empty-state-heading font-serif-display text-2xl text-champagne">No matches yet</p>
          <p className="perennia-empty-state-copy max-w-sm text-sm text-white/50">
            Keep exploring your curated discovery collection — your next connection is waiting.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {matched.map(({ matchId, profile: p }, i) => {
            const result = scores[p.uid]
            const compatibilityPending = selfChartComplete && hasCompleteChart(p) && !failedUids.has(p.uid) && !result
            return (
              <motion.div
                key={matchId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                onClick={() => {
                  if (previewData?.onViewProfile) previewData.onViewProfile(p)
                  else navigate(`/profile/${p.uid}`)
                }}
                className="group cursor-pointer overflow-hidden rounded-2xl glass"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={p.profilePhotoUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      if (previewData?.onMessage) previewData.onMessage(matchId, p)
                      else navigate(`/messages/${matchId}`)
                    }}
                    aria-label={`Message ${p.name.split(' ')[0]}`}
                    className="glass-strong absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-champagne cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center gap-1">
                      <p className="font-serif-display text-lg text-white">{p.name.split(' ')[0]}</p>
                      {p.verification?.status === 'verified' && <BadgeCheck className="h-3.5 w-3.5 text-gold" />}
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/[.06] p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-100" aria-label={`Matched with ${p.name.split(' ')[0]}; interest is mutual`}>
                    <InterestHeartsIcon state="matched" className="h-7 w-7 shrink-0" />
                    <span>Matched</span>
                  </div>
                  <p className="text-xs font-semibold text-[#f3d18f]">
                    {result ? `${result.compatibility}% compatible` : compatibilityPending ? 'Calculating compatibility…' : 'Compatibility unavailable'}
                  </p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      openWhyMatched(p)
                    }}
                    disabled={!result}
                    aria-label={result
                      ? `Why you matched with ${p.name.split(' ')[0]}${isPremium ? '' : ' — Premium locked'}`
                      : `Match explanation with ${p.name.split(' ')[0]} unavailable`}
                    className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200/20 bg-blue-300/[.05] px-2 text-xs font-semibold text-blue-100 disabled:cursor-default disabled:opacity-50"
                  >
                    <ConnectionHeartsIcon className="h-5 w-5 object-contain opacity-80" />
                    <span>{result ? 'Why you matched' : compatibilityPending ? 'Preparing explanation…' : 'Explanation unavailable'}</span>
                    {result && !isPremium && <LockKeyhole className="h-3.5 w-3.5 text-gold" aria-hidden="true" />}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
      {explanation && (
        <CompatibilityWhyDialog
          memberName={explanation.memberName}
          result={explanation.result}
          onClose={() => setExplanation(null)}
        />
      )}
      </div>
    </MotionConfig>
  )
}

function MatchesLoadNotice({ retained = false, onRetry }: { retained?: boolean; onRetry: () => void }) {
  if (retained) {
    return (
      <div
        className="mb-6 flex flex-col items-start gap-3 rounded-2xl border border-amber-200/20 bg-amber-100/[.06] px-4 py-4 text-sm text-white/75 sm:flex-row sm:items-center sm:justify-between"
        role="alert"
      >
        <span className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
          <span><strong className="block text-champagne">Some match information could not be refreshed.</strong>Your existing matches are still available.</span>
        </span>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold/10 px-4 font-semibold text-champagne focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      </div>
    )
  }

  return (
    <div className="perennia-empty-state-panel glass flex flex-col items-center gap-4 rounded-3xl px-8 py-20 text-center" role="alert">
      <TriangleAlert className="h-8 w-8 text-gold" aria-hidden="true" />
      <p className="perennia-empty-state-heading font-serif-display text-2xl text-champagne">We couldn’t load your matches</p>
      <p className="perennia-empty-state-copy max-w-sm text-sm text-white/55">Please check your connection and try again. Your match information has not been changed.</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold/10 px-5 text-sm font-semibold text-champagne focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
      </button>
    </div>
  )
}
