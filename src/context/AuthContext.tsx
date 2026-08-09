import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { auth, functions, firebaseConfigured } from '@/lib/firebase'
import { ensureUserDoc } from '@/lib/firestore'

interface AuthContextValue {
  user: User | null
  loading: boolean
  authReady: boolean
  /** Account creation is now email/password only — real name is collected
   *  later, in the "About You" onboarding step, not at signup. */
  signUp: (email: string, password: string) => Promise<User>
  logIn: (email: string, password: string) => Promise<User>
  logOut: () => Promise<void>
  /** Reauthenticates with the current password, then sets the new one —
   *  Firebase requires a fresh sign-in before a real password change. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  /** Reauthenticates, then calls the real deleteAccount Cloud Function
   *  (Firestore doc + media + Storage files + the Auth account itself),
   *  and finally clears local session state. */
  deleteAccount: (currentPassword: string) => Promise<void>
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

  const signUp = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await ensureUserDoc(cred.user.uid, { name: '', email })
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

  const reauthenticate = async (currentPassword: string) => {
    if (!auth.currentUser?.email) throw new Error('No signed-in account with an email/password to verify.')
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
    await reauthenticateWithCredential(auth.currentUser, credential)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await reauthenticate(currentPassword)
    if (!auth.currentUser) throw new Error('Not signed in.')
    await updatePassword(auth.currentUser, newPassword)
  }

  const deleteAccountAction = async (currentPassword: string) => {
    await reauthenticate(currentPassword)
    const deleteAccountCallable = httpsCallable(functions, 'deleteAccount')
    await deleteAccountCallable({})
    await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading: !authReady, authReady, signUp, logIn, logOut, changePassword, deleteAccount: deleteAccountAction }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
