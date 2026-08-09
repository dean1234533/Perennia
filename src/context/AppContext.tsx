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
  type UserDoc,
  type VerificationState,
} from '@/lib/firestore'

export interface OnboardingData {
  name: string
  email: string
  phone: string
  password: string
  verification: VerificationState
  birthDate: string
  birthTime: string
  birthPlace: string
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
  birthDate: '',
  birthTime: '',
  birthPlace: '',
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

  // Sync the signed-in user's doc (onboarding fields + like/pass/match state).
  useEffect(() => {
    if (!firebaseConfigured || !user) return
    const unsub = subscribeUserDoc(user.uid, (data: UserDoc | null) => {
      if (!data) return
      setOnboarding((prev) => ({
        ...prev,
        name: data.name,
        email: data.email,
        phone: data.phone ?? '',
        verification: data.verification ?? prev.verification,
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        birthPlace: data.birthPlace,
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
