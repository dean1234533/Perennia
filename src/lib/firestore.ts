import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { profiles as seedProfiles, type Profile } from '@/data/profiles'
import { conversationSeeds, type Message } from '@/data/messages'

export interface UserDoc {
  name: string
  email: string
  verified: boolean
  onboardingComplete: boolean
  birthDate: string
  birthTime: string
  birthPlace: string
  sunSign: string
  likedIds: string[]
  passedIds: string[]
  matchedIds: string[]
}

const defaultUserDoc: Omit<UserDoc, 'name' | 'email'> = {
  verified: false,
  onboardingComplete: false,
  birthDate: '',
  birthTime: '',
  birthPlace: '',
  sunSign: '',
  likedIds: [],
  passedIds: [],
  matchedIds: [],
}

export async function ensureUserDoc(uid: string, data: { name: string; email: string }) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { ...defaultUserDoc, ...data })
  }
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserDoc) : null
}

export function subscribeUserDoc(uid: string, cb: (data: UserDoc | null) => void) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    cb(snap.exists() ? (snap.data() as UserDoc) : null)
  })
}

export async function updateUserDoc(uid: string, data: Partial<UserDoc>) {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function completeOnboardingRemote(uid: string) {
  await updateDoc(doc(db, 'users', uid), { onboardingComplete: true })
}

export async function likeProfileRemote(uid: string, profileId: string, isMatch: boolean) {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, {
    likedIds: arrayUnion(profileId),
    ...(isMatch ? { matchedIds: arrayUnion(profileId) } : {}),
  })
}

export async function passProfileRemote(uid: string, profileId: string) {
  await updateDoc(doc(db, 'users', uid), { passedIds: arrayUnion(profileId) })
}

/** Seeds the curated `profiles` collection once, if empty. Prototype-only convenience —
 *  in production this would be done via the Admin SDK, not open client writes. */
export async function seedProfilesIfNeeded() {
  const snap = await getDocs(collection(db, 'profiles'))
  if (!snap.empty) return
  const batch = writeBatch(db)
  for (const p of seedProfiles) {
    batch.set(doc(db, 'profiles', p.id), p)
  }
  await batch.commit()
}

export async function fetchProfiles(): Promise<Profile[]> {
  const snap = await getDocs(collection(db, 'profiles'))
  if (snap.empty) return seedProfiles
  return snap.docs.map((d) => d.data() as Profile)
}

function convoId(uid: string, profileId: string) {
  return `${uid}_${profileId}`
}

export async function seedConversationIfNeeded(uid: string, profileId: string) {
  const msgsRef = collection(db, 'conversations', convoId(uid, profileId), 'messages')
  const snap = await getDocs(msgsRef)
  if (!snap.empty) return
  const seed = conversationSeeds[profileId]
  if (!seed) return
  const batch = writeBatch(db)
  seed.forEach((m, i) => {
    const ref = doc(msgsRef)
    batch.set(ref, { ...m, order: i, createdAt: serverTimestamp() })
  })
  await batch.commit()
}

export function subscribeMessages(uid: string, profileId: string, cb: (messages: Message[]) => void) {
  const msgsRef = collection(db, 'conversations', convoId(uid, profileId), 'messages')
  const q = query(msgsRef, orderBy('order', 'asc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as Message))
  })
}

export async function sendMessageRemote(uid: string, profileId: string, message: Omit<Message, 'id'>, order: number) {
  const msgsRef = collection(db, 'conversations', convoId(uid, profileId), 'messages')
  const ref = doc(msgsRef)
  await setDoc(ref, { ...message, id: ref.id, order, createdAt: serverTimestamp() })
}
