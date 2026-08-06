import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { profiles as fallbackProfiles, type Profile } from '@/data/profiles'
import { firebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import {
  fetchProfiles,
  seedProfilesIfNeeded,
  subscribeUserDoc,
  updateUserDoc,
  likeProfileRemote,
  passProfileRemote,
  completeOnboardingRemote,
  type UserDoc,
} from '@/lib/firestore'

export interface OnboardingData {
  name: string
  email: string
  password: string
  verified: boolean
  birthDate: string
  birthTime: string
  birthPlace: string
  sunSign: string
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
}

const defaultOnboarding: OnboardingData = {
  name: '',
  email: '',
  password: '',
  verified: false,
  birthDate: '',
  birthTime: '',
  birthPlace: '',
  sunSign: '',
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

  // Load curated profiles — from Firestore when configured, otherwise the bundled mock data.
  useEffect(() => {
    if (!firebaseConfigured) return
    seedProfilesIfNeeded()
      .then(fetchProfiles)
      .then(setProfiles)
      .catch((err) => console.warn('[Perennia] Failed to load profiles from Firestore:', err))
  }, [])

  // Sync the signed-in user's doc (onboarding fields + like/pass/match state).
  useEffect(() => {
    if (!firebaseConfigured || !user) return
    const unsub = subscribeUserDoc(user.uid, (data: UserDoc | null) => {
      if (!data) return
      setOnboarding((prev) => ({
        ...prev,
        name: data.name,
        email: data.email,
        verified: data.verified,
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        birthPlace: data.birthPlace,
        sunSign: data.sunSign,
      }))
      setLikedIds(data.likedIds ?? [])
      setPassedIds(data.passedIds ?? [])
      setMatchedIds(data.matchedIds ?? [])
      setRemoteOnboardingComplete(!!data.onboardingComplete)
    })
    return unsub
  }, [user])

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
