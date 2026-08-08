import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { profiles as fallbackProfiles, type Profile } from '@/data/profiles'
import { firebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { DEFAULT_MEDIA_CATEGORIES } from '@/data/mediaCategories'
import { emptySelfProfile, type SelfProfile } from '@/data/selfProfile'
import { getCompatibility, type PersonBirthProfile } from '@/lib/compatibilityApi'
import {
  fetchProfiles,
  seedProfilesIfNeeded,
  subscribeUserDoc,
  updateUserDoc,
  likeProfileRemote,
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
  profiles: Profile[]
  likedIds: string[]
  passedIds: string[]
  matchedIds: string[]
  likeProfile: (id: string) => Promise<boolean>
  passProfile: (id: string) => Promise<void>
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
  const [profiles, setProfiles] = useState<Profile[]>(fallbackProfiles)
  const [likedIds, setLikedIds] = useState<string[]>([])
  const [passedIds, setPassedIds] = useState<string[]>([])
  const [matchedIds, setMatchedIds] = useState<string[]>(firebaseConfigured ? [] : ['amara', 'julian', 'sienna'])
  const [localAuthenticated, setLocalAuthenticated] = useState(false)
  const [remoteOnboardingComplete, setRemoteOnboardingComplete] = useState(false)
  const [lastMatchId, setLastMatchId] = useState<string | null>(null)
  const [profileExtras, setProfileExtras] = useState<SelfProfile>(emptySelfProfile)
  const [hideBottomNav, setHideBottomNav] = useState(false)
  const resolvedChartKey = useRef<string | null>(null)

  // Load curated profiles — from Firestore when configured, otherwise the bundled mock data.
  useEffect(() => {
    if (!firebaseConfigured) return
    seedProfilesIfNeeded()
      .then(fetchProfiles)
      .then(setProfiles)
      .catch((err) => console.warn('[Perennia] Failed to load profiles from Firestore:', err))
  }, [])

  // Once the signed-in member's own natal chart is complete, replace each
  // discovery profile's bundled mock compatibility score/label with the
  // real one from the Fusion System backend — so the badge shown in
  // Discovery/Matches/the orbit hero always matches the detailed report.
  // Only 6 seed profiles exist, so a full batch is cheap; re-runs only if
  // the member's own chart actually changes.
  useEffect(() => {
    if (!firebaseConfigured || profiles.length === 0) return
    const { sunSign, moonSign, risingSign, chineseAnimal, chineseElement, yinYang } = onboarding
    if (!sunSign || !moonSign || !risingSign || !chineseAnimal || !chineseElement || !yinYang) return

    const chartKey = [sunSign, moonSign, risingSign, chineseAnimal, chineseElement, yinYang].join('|')
    if (resolvedChartKey.current === chartKey) return
    resolvedChartKey.current = chartKey

    const personA: PersonBirthProfile = { sunSign, moonSign, risingSign, chineseAnimal, chineseElement, yinYang }
    let cancelled = false

    Promise.all(
      profiles.map(async (p) => {
        try {
          const result = await getCompatibility({
            personA,
            personB: {
              sunSign: p.sunSign,
              moonSign: p.moonSign,
              risingSign: p.risingSign,
              chineseAnimal: p.chineseZodiac,
              chineseElement: p.chineseElement,
              yinYang: p.yinYang,
            },
          })
          return { id: p.id, compatibility: result.compatibility, compatibilityLabel: result.band }
        } catch (err) {
          console.warn(`[Perennia] Failed to compute real compatibility for ${p.id}:`, err)
          return null
        }
      })
    ).then((results) => {
      if (cancelled) return
      setProfiles((prev) =>
        prev.map((p) => {
          const real = results.find((r) => r?.id === p.id)
          return real ? { ...p, compatibility: real.compatibility, compatibilityLabel: real.compatibilityLabel } : p
        })
      )
    })

    return () => {
      cancelled = true
    }
  }, [profiles.length, onboarding.sunSign, onboarding.moonSign, onboarding.risingSign, onboarding.chineseAnimal, onboarding.chineseElement, onboarding.yinYang])

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
    async (id: string) => {
      const profile = profiles.find((p) => p.id === id)
      const willMatch = !!profile && profile.compatibility >= 80

      if (firebaseConfigured && user) {
        await likeProfileRemote(user.uid, id, willMatch)
      } else {
        setLikedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
        if (willMatch) setMatchedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      }
      if (willMatch) setLastMatchId(id)
      return willMatch
    },
    [profiles, user]
  )

  const passProfile = useCallback(
    async (id: string) => {
      if (firebaseConfigured && user) {
        await passProfileRemote(user.uid, id)
      } else {
        setPassedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
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
        profiles,
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
