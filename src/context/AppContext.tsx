import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { firebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { DEFAULT_MEDIA_CATEGORIES } from '@/data/mediaCategories'
import { emptySelfProfile, type SelfProfile } from '@/data/selfProfile'
import { likeUser } from '@/lib/matchingApi'
import {
  subscribeUserDoc,
  updateUserDoc,
  passProfileRemote,
  completeOnboardingRemote,
  updateProfileExtrasRemote,
  updatePreferencesRemote,
  defaultPreferences,
  type UserDoc,
  type VerificationState,
  type MatchingPreferences,
  type StoryPrompt,
} from '@/lib/firestore'

export interface OnboardingData {
  name: string
  email: string
  phone: string
  password: string
  verification: VerificationState
  legalName: string
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
  updateOnboarding: (data: Partial<OnboardingData>) => void
  likedIds: string[]
  passedIds: string[]
  matchedIds: string[]
  /** Real like via the likeUser Cloud Function. Returns the real matchId
   *  when a genuine mutual match was just created, otherwise null. */
  likeProfile: (targetUid: string) => Promise<string | null>
  passProfile: (targetUid: string) => Promise<void>
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
  verification: { status: 'unverified', provider: null, verificationReference: null, verifiedAt: null },
  legalName: '',
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
  const [matchedIds, setMatchedIds] = useState<string[]>([])
  const [localAuthenticated, setLocalAuthenticated] = useState(false)
  const [remoteOnboardingComplete, setRemoteOnboardingComplete] = useState(false)
  const [lastMatchId, setLastMatchId] = useState<string | null>(null)
  const [profileExtras, setProfileExtras] = useState<SelfProfile>(emptySelfProfile)
  const [hideBottomNav, setHideBottomNav] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(!firebaseConfigured)

  // Sync the signed-in user's doc (onboarding fields + like/pass/match state).
  useEffect(() => {
    if (!firebaseConfigured || !user) return
    const unsub = subscribeUserDoc(user.uid, (data: UserDoc | null) => {
      setProfileLoaded(true)
      if (!data) return
      setOnboarding((prev) => ({
        ...prev,
        name: data.name,
        email: data.email,
        phone: data.phone ?? '',
        verification: data.verification ?? prev.verification,
        legalName: data.legalName ?? '',
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
      if (data.profileExtras) setProfileExtras(data.profileExtras)
    })
    return unsub
  }, [user])

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
    (data: Partial<OnboardingData>) => {
      setOnboarding((prev) => ({ ...prev, ...data }))
      if (firebaseConfigured && user) {
        const { password: _password, ...remote } = data
        if (Object.keys(remote).length > 0) {
          updateUserDoc(user.uid, remote).catch((err) =>
            console.warn('[Perennia] Failed to sync onboarding data:', err)
          )
        }
      }
    },
    [user]
  )

  const likeProfile = useCallback(
    async (targetUid: string) => {
      if (!firebaseConfigured || !user) {
        setLikedIds((prev) => (prev.includes(targetUid) ? prev : [...prev, targetUid]))
        return null
      }
      const result = await likeUser(targetUid)
      setLikedIds((prev) => (prev.includes(targetUid) ? prev : [...prev, targetUid]))
      if (result.matched && result.matchId) {
        setMatchedIds((prev) => (prev.includes(targetUid) ? prev : [...prev, targetUid]))
        setLastMatchId(result.matchId)
        return result.matchId
      }
      return null
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
        likeProfile,
        passProfile,
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
