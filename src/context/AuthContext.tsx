import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, firebaseConfigured } from '@/lib/firebase'
import { ensureUserDoc } from '@/lib/firestore'

interface AuthContextValue {
  user: User | null
  loading: boolean
  authReady: boolean
  signUp: (name: string, email: string, password: string) => Promise<User>
  logIn: (email: string, password: string) => Promise<User>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthReady(true)
      return
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthReady(true)
    })
    return unsub
  }, [])

  const signUp = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await ensureUserDoc(cred.user.uid, { name, email })
    setUser(cred.user)
    return cred.user
  }

  const logIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    setUser(cred.user)
    return cred.user
  }

  const logOut = async () => {
    await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading: !authReady, authReady, signUp, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
