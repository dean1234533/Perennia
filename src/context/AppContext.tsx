import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { firebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { DEFAULT_MEDIA_CATEGORIES } from '@/data/mediaCategories'
import { emptySelfProfile, type SelfProfile } from '@/data/selfProfile'
import { likeUser } from '@/lib/matchingApi'
import {
  subscribeUserDoc,
  updateUserDoc,
  passProfileRemote,
  muteProfileRemote,
  unmuteProfileRemote,
  subscribeSafetySettings,
  updateSafetySettingsRemote,
  completeOnboardingRemote,
  updateProfileExtrasRemote,
  updatePreferencesRemote,
  defaultPreferences,
  type UserDoc,
  type VerificationState,
  type MatchingPreferences,
  type StoryPrompt,
} from '@/lib/firestore'
import { blockProfileRemote, unblockProfileRemote, migratePrivateSafetyRemote } from '@/lib/privacyApi'

export interface OnboardingData {
  name: string
  email: string
  phone: string
  password: string
  onboardingResumePath: string
  verification: VerificationState
  legalName: string
  aboutYouCompletedAt: string
  birthDate: string
  birthTime: string
  birthTimeUnknown: boolean
  birthPlace: string
  birthCountry: string
  birthCity: string
  birthPlaceLat: number | null
  birthPlaceLon: number | null
  sunSign: string
  moonSign: string
  risingSign: string
  chineseAnimal: string
  chineseElement: string
  yinYang: 'Yin' | 'Yang' | ''
  gender: 'male' | 'female' | ''
  profilePhotoUrl: string
  profilePhotoThumbUrl: string
  categories: { id: string; label: string }[]
  heightCm: number | null
  country: string
  city: string
  religion: string
  relationshipGoal: string
  relationshipGoalSelectedAt: string
  relationshipDealBreakers: string[]
  partnerValues: string[]
  prioritiseSameRelationshipGoal: boolean
  currentLocationLat: number | null
  currentLocationLon: number | null
  storyPrompts: StoryPrompt[]
  preferences: MatchingPreferences
  incognito: boolean
  showDistance: boolean
  pushNotificationsEnabled: boolean
}

interface AppContextValue {
  onboarding: OnboardingData
  updateOnboarding: (data: Partial<OnboardingData>) => Promise<void>
  likedIds: string[]
  passedIds: string[]
  matchedIds: string[]
  blockedIds: string[]
  mutedIds: string[]
  safeMode: boolean
  /** Opens an introduction immediately; matchId is set only when mutual. */
  likeProfile: (targetUid: string) => Promise<{ conversationId: string | null; matchId: string | null }>
  passProfile: (targetUid: string) => Promise<void>
  blockProfile: (targetUid: string) => Promise<void>
  unblockProfile: (targetUid: string) => Promise<void>
  muteProfile: (targetUid: string) => Promise<void>
  unmuteProfile: (targetUid: string) => Promise<void>
  updateSafeMode: (enabled: boolean) => Promise<void>
  isAuthenticated: boolean
  setAuthenticated: (v: boolean) => void
  onboardingComplete: boolean
  completeOnboarding: () => Promise<void>
  lastMatchId: string | null
  clearLastMatch: () => void
  profileExtras: SelfProfile
  updateProfileExtras: (extras: SelfProfile) => Promise<void>
  updatePreferences: (preferences: MatchingPreferences) => Promise<void>
  /** True once the real Firestore user doc has been fetched at least once
   *  (or immediately, in local-demo mode). Onboarding screens that seed
   *  editable local state from `onboarding`/`profileExtras` at mount MUST
   *  wait for this before rendering their form — otherwise a page refresh
   *  mid-onboarding seeds inputs from the still-empty default before the
   *  real data arrives, and hitting Continue silently overwrites genuinely
   *  saved answers with blanks. */
  profileLoaded: boolean
  /** Set while a fullscreen overlay (media viewer, etc.) is open so
   *  AppShell can hide the bottom nav underneath it and bring it back on
   *  close, rather than leaving it sitting there under the overlay. */
  hideBottomNav: boolean
  setHideBottomNav: (v: boolean) => void
}

const defaultOnboarding: OnboardingData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  onboardingResumePath: '',
  verification: { status: 'unverified', provider: null, verificationReference: null, verifiedAt: null, detailsConfirmedAt: null },
  legalName: '',
  aboutYouCompletedAt: '',
  birthDate: '',
  birthTime: '',
  birthTimeUnknown: false,
  birthPlace: '',
  birthCountry: '',
  birthCity: '',
  birthPlaceLat: null,
  birthPlaceLon: null,
  sunSign: '',
  moonSign: '',
  risingSign: '',
  chineseAnimal: '',
  chineseElement: '',
  yinYang: '',
  gender: '',
  profilePhotoUrl: '',
  profilePhotoThumbUrl: '',
  categories: DEFAULT_MEDIA_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  heightCm: null,
  country: '',
  city: '',
  religion: '',
  relationshipGoal: '',
  relationshipGoalSelectedAt: '',
  relationshipDealBreakers: [],
  partnerValues: [],
  prioritiseSameRelationshipGoal: true,
  currentLocationLat: null,
  currentLocationLon: null,
  storyPrompts: [],
  preferences: defaultPreferences,
  incognito: false,
  showDistance: true,
  pushNotificationsEnabled: true,
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [onboarding, setOnboarding] = useState<OnboardingData>(defaultOnboarding)
  const [likedIds, setLikedIds] = useState<string[]>([])
  const [passedIds, setPassedIds] = useState<string[]>([])
  const [blockedIds, setBlockedIds] = useState<string[]>([])
  const [mutedIds, setMutedIds] = useState<string[]>([])
  const [safeMode, setSafeMode] = useState(false)
  const [matchedIds, setMatchedIds] = useState<string[]>([])
  const [localAuthenticated, setLocalAuthenticated] = useState(false)
  const [remoteOnboardingComplete, setRemoteOnboardingComplete] = useState(false)
  const [lastMatchId, setLastMatchId] = useState<string | null>(null)
  const [profileExtras, setProfileExtras] = useState<SelfProfile>(emptySelfProfile)
  const [hideBottomNav, setHideBottomNav] = useState(false)
  const [profileLoadedUid, setProfileLoadedUid] = useState<string | null>(null)
  const reconciledLikes = useRef(new Set<string>())
  const profileLoaded = !firebaseConfigured || (!!user && profileLoadedUid === user.uid)
  const userUid = user?.uid

  // Sync the signed-in user's doc (onboarding fields + like/pass/match state).
  useEffect(() => {
    if (!firebaseConfigured) return

    // Never expose one account's loaded profile state during an auth switch.
    // The uid-bound loaded flag keeps routing on a spinner until the current
    // member's own document has arrived.
    setProfileLoadedUid(null)
    setOnboarding(defaultOnboarding)
    setProfileExtras(emptySelfProfile)
    setRemoteOnboardingComplete(false)
    setLikedIds([])
    setPassedIds([])
    setBlockedIds([])
    setMutedIds([])
    setSafeMode(false)
    setMatchedIds([])
    if (!userUid) return

    const uid = userUid
    const unsub = subscribeUserDoc(uid, (data: UserDoc | null) => {
      setProfileLoadedUid(uid)
      if (!data) return
      setOnboarding((prev) => ({
        ...prev,
        name: data.name,
        email: data.email,
        phone: data.phone ?? '',
        onboardingResumePath: data.onboardingResumePath ?? '',
        verification: data.verification ?? prev.verification,
        legalName: data.legalName ?? '',
        aboutYouCompletedAt: data.aboutYouCompletedAt ?? '',
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        birthTimeUnknown: data.birthTimeUnknown ?? false,
        birthPlace: data.birthPlace,
        birthCountry: data.birthCountry ?? '',
        birthCity: data.birthCity ?? '',
        birthPlaceLat: data.birthPlaceLat ?? null,
        birthPlaceLon: data.birthPlaceLon ?? null,
        sunSign: data.sunSign,
        moonSign: data.moonSign ?? '',
        risingSign: data.risingSign ?? '',
        chineseAnimal: data.chineseAnimal ?? '',
        chineseElement: data.chineseElement ?? '',
        yinYang: data.yinYang ?? '',
        gender: data.gender ?? '',
        profilePhotoUrl: data.profilePhotoUrl ?? '',
        profilePhotoThumbUrl: data.profilePhotoThumbUrl ?? '',
        categories: data.categories?.length ? data.categories : prev.categories,
        heightCm: data.heightCm ?? null,
        country: data.country ?? '',
        city: data.city ?? '',
        religion: data.religion ?? '',
        relationshipGoal: data.relationshipGoal ?? '',
        relationshipGoalSelectedAt: data.relationshipGoalSelectedAt ?? '',
        relationshipDealBreakers: data.relationshipDealBreakers ?? [],
        partnerValues: data.partnerValues ?? [],
        prioritiseSameRelationshipGoal: data.prioritiseSameRelationshipGoal ?? true,
        currentLocationLat: data.currentLocationLat ?? null,
        currentLocationLon: data.currentLocationLon ?? null,
        storyPrompts: data.storyPrompts ?? [],
        preferences: data.preferences ?? defaultPreferences,
        incognito: data.incognito ?? false,
        showDistance: data.showDistance ?? true,
        pushNotificationsEnabled: data.pushNotificationsEnabled ?? true,
      }))
      setLikedIds(data.likedIds ?? [])
      setPassedIds(data.passedIds ?? [])
      setMatchedIds(data.matchedIds ?? [])
      setRemoteOnboardingComplete(!!data.onboardingComplete)
      // Merged field-by-field against emptySelfProfile, not set wholesale —
      // an account whose profileExtras doc predates a newer SelfProfile
      // field (interests, languages, storyPrompts, etc. were all added
      // over time) would otherwise have that field come back as
      // `undefined` from Firestore, and every screen that reads its
      // `.length` (Discovery gating, MyProfile, CosmicProfile) would
      // throw and white-screen for that one real account.
      if (data.profileExtras) setProfileExtras({ ...emptySelfProfile, ...data.profileExtras })
    })
    return unsub
  }, [userUid])

  useEffect(() => {
    if (!firebaseConfigured || !userUid) return
    migratePrivateSafetyRemote().catch((err) => console.warn('[Perennia] Failed to migrate private safety settings:', err))
    return subscribeSafetySettings(userUid, (settings) => {
      setBlockedIds(settings.blockedIds)
      setMutedIds(settings.mutedIds)
      setSafeMode(settings.safeMode)
    })
  }, [userUid])

  // Likes made before one-way connections were introduced have no match or
  // conversation record. Re-submit each of those likes once per app session;
  // likeUser is idempotent and now fills in the missing shared records.
  useEffect(() => {
    if (!firebaseConfigured || !user || !profileLoaded) return

    for (const targetUid of likedIds) {
      if (matchedIds.includes(targetUid) || blockedIds.includes(targetUid)) continue
      const reconciliationKey = `${user.uid}:${targetUid}`
      if (reconciledLikes.current.has(reconciliationKey)) continue
      reconciledLikes.current.add(reconciliationKey)
      likeUser(targetUid).catch((err) => {
        console.warn('[Perennia] Failed to activate an existing like:', err)
      })
    }
  }, [user, profileLoaded, likedIds, matchedIds, blockedIds])

  const updateProfileExtras = useCallback(
    async (extras: SelfProfile) => {
      setProfileExtras(extras)
      if (firebaseConfigured && user) {
        await updateProfileExtrasRemote(user.uid, extras)
      }
    },
    [user]
  )

  const updatePreferences = useCallback(
    async (preferences: MatchingPreferences) => {
      setOnboarding((prev) => ({ ...prev, preferences }))
      if (firebaseConfigured && user) {
        await updatePreferencesRemote(user.uid, preferences)
      }
    },
    [user]
  )

  const updateOnboarding = useCallback(
    async (data: Partial<OnboardingData>) => {
      setOnboarding((prev) => ({ ...prev, ...data }))
      if (firebaseConfigured && user) {
        const { password: _password, ...remote } = data
        if (Object.keys(remote).length > 0) {
          await updateUserDoc(user.uid, remote).catch((err) => {
            console.warn('[Perennia] Failed to sync onboarding data:', err)
          })
        }
      }
    },
    [user]
  )

  const likeProfile = useCallback(
    async (targetUid: string) => {
      if (!firebaseConfigured || !user) {
        setLikedIds((prev) => (prev.includes(targetUid) ? prev : [...prev, targetUid]))
        return { conversationId: null, matchId: null }
      }
      const result = await likeUser(targetUid)
      setLikedIds((prev) => (prev.includes(targetUid) ? prev : [...prev, targetUid]))
      if (result.matched && result.matchId) {
        setMatchedIds((prev) => (prev.includes(targetUid) ? prev : [...prev, targetUid]))
        setLastMatchId(result.matchId)
        return { conversationId: result.conversationId, matchId: result.matchId }
      }
      return { conversationId: result.conversationId, matchId: null }
    },
    [user]
  )

  const passProfile = useCallback(
    async (targetUid: string) => {
      if (firebaseConfigured && user) {
        await passProfileRemote(user.uid, targetUid)
      } else {
        setPassedIds((prev) => (prev.includes(targetUid) ? prev : [...prev, targetUid]))
      }
    },
    [user]
  )

  const blockProfile = useCallback(
    async (targetUid: string) => {
      if (firebaseConfigured && user) {
        await blockProfileRemote(user.uid, targetUid)
      } else {
        setBlockedIds((prev) => (prev.includes(targetUid) ? prev : [...prev, targetUid]))
      }
    },
    [user]
  )

  const unblockProfile = useCallback(
    async (targetUid: string) => {
      if (firebaseConfigured && user) {
        await unblockProfileRemote(user.uid, targetUid)
      } else {
        setBlockedIds((prev) => prev.filter((id) => id !== targetUid))
      }
    },
    [user]
  )

  const muteProfile = useCallback(async (targetUid: string) => {
    if (firebaseConfigured && user) await muteProfileRemote(user.uid, targetUid)
    else setMutedIds((prev) => prev.includes(targetUid) ? prev : [...prev, targetUid])
  }, [user])

  const unmuteProfile = useCallback(async (targetUid: string) => {
    if (firebaseConfigured && user) await unmuteProfileRemote(user.uid, targetUid)
    else setMutedIds((prev) => prev.filter((id) => id !== targetUid))
  }, [user])

  const updateSafeMode = useCallback(async (enabled: boolean) => {
    setSafeMode(enabled)
    if (firebaseConfigured && user) await updateSafetySettingsRemote(user.uid, { safeMode: enabled })
  }, [user])

  const clearLastMatch = useCallback(() => setLastMatchId(null), [])

  const isAuthenticated = firebaseConfigured ? !!user : localAuthenticated
  const onboardingComplete = firebaseConfigured ? remoteOnboardingComplete : localAuthenticated

  const completeOnboarding = useCallback(async () => {
    if (firebaseConfigured && user) {
      await completeOnboardingRemote(user.uid)
    } else {
      setLocalAuthenticated(true)
    }
  }, [user])

  return (
    <AppContext.Provider
      value={{
        onboarding,
        updateOnboarding,
        likedIds,
        passedIds,
        matchedIds,
        blockedIds,
        mutedIds,
        safeMode,
        likeProfile,
        passProfile,
        blockProfile,
        unblockProfile,
        muteProfile,
        unmuteProfile,
        updateSafeMode,
        isAuthenticated,
        setAuthenticated: setLocalAuthenticated,
        onboardingComplete,
        completeOnboarding,
        lastMatchId,
        clearLastMatch,
        profileExtras,
        updateProfileExtras,
        updatePreferences,
        profileLoaded,
        hideBottomNav,
        setHideBottomNav,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
