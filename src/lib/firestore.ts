import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { profiles as seedProfiles, type Profile } from '@/data/profiles'
import { conversationSeeds, type Message } from '@/data/messages'
import { DEFAULT_MEDIA_CATEGORIES } from '@/data/mediaCategories'
import type { SelfProfile } from '@/data/selfProfile'

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed'

export interface VerificationState {
  status: VerificationStatus
  provider: 'stripe_identity' | null
  verificationReference: string | null
  verifiedAt: string | null
}

export interface UserDoc {
  name: string
  email: string
  verification: VerificationState
  onboardingComplete: boolean
  birthDate: string
  birthTime: string
  birthPlace: string
  sunSign: string
  gender: 'male' | 'female' | ''
  likedIds: string[]
  passedIds: string[]
  matchedIds: string[]
  profilePhotoUrl: string
  profilePhotoThumbUrl: string
  categories: { id: string; label: string }[]
  profileExtras: SelfProfile | null
}

const defaultVerification: VerificationState = {
  status: 'unverified',
  provider: null,
  verificationReference: null,
  verifiedAt: null,
}

const defaultUserDoc: Omit<UserDoc, 'name' | 'email'> = {
  verification: defaultVerification,
  onboardingComplete: false,
  birthDate: '',
  birthTime: '',
  birthPlace: '',
  sunSign: '',
  gender: '',
  likedIds: [],
  passedIds: [],
  matchedIds: [],
  profilePhotoUrl: '',
  profilePhotoThumbUrl: '',
  categories: DEFAULT_MEDIA_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  profileExtras: null,
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

/** Upserts the curated `profiles` collection with the bundled mock data on every
 *  load, so schema/content changes here always propagate. Prototype-only
 *  convenience — in production this would be done via the Admin SDK, not open
 *  client writes. */
export async function seedProfilesIfNeeded() {
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

// --- Real user-uploaded media -----------------------------------------------
// One doc per uploaded photo/video. Images are ready immediately (compressed
// client-side before upload); videos start as `processing` and are flipped to
// `ready` by the server-side ffmpeg Cloud Function once transcoding finishes.

export type MediaType = 'image' | 'video'
export type ProcessingStatus = 'processing' | 'ready' | 'error'

export interface VideoVariants {
  poster: string
  p480?: string
  p720?: string
  p1080?: string
}

export interface MediaDoc {
  id: string
  userId: string
  type: MediaType
  url: string
  thumbnailUrl: string
  category: string
  caption: string
  createdAt: number
  order: number
  processingStatus: ProcessingStatus
  video?: VideoVariants
}

export function subscribeUserMedia(uid: string, cb: (media: MediaDoc[]) => void) {
  const q = query(collection(db, 'media'), where('userId', '==', uid))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => d.data() as MediaDoc)
    items.sort((a, b) => a.order - b.order)
    cb(items)
  })
}

export async function createMediaDoc(media: MediaDoc) {
  await setDoc(doc(db, 'media', media.id), media)
}

export async function updateMediaDoc(mediaId: string, data: Partial<MediaDoc>) {
  await updateDoc(doc(db, 'media', mediaId), data)
}

export async function deleteMediaDoc(mediaId: string) {
  await deleteDoc(doc(db, 'media', mediaId))
}

export async function reorderMediaDocs(updates: { id: string; order: number }[]) {
  const batch = writeBatch(db)
  for (const u of updates) {
    batch.update(doc(db, 'media', u.id), { order: u.order })
  }
  await batch.commit()
}

export async function setProfilePhotoRemote(uid: string, url: string, thumbUrl: string) {
  await updateDoc(doc(db, 'users', uid), { profilePhotoUrl: url, profilePhotoThumbUrl: thumbUrl })
}

export async function renameCategoryRemote(uid: string, categoryId: string, label: string) {
  const snap = await getDoc(doc(db, 'users', uid))
  const data = snap.data() as UserDoc | undefined
  const categories = (data?.categories ?? DEFAULT_MEDIA_CATEGORIES.map((c) => ({ id: c.id, label: c.label })))
    .map((c) => (c.id === categoryId ? { ...c, label } : c))
  await updateDoc(doc(db, 'users', uid), { categories })
}

export async function updateProfileExtrasRemote(uid: string, extras: SelfProfile) {
  await updateDoc(doc(db, 'users', uid), { profileExtras: extras })
}

export async function setVerificationState(uid: string, state: Partial<VerificationState>) {
  const snap = await getDoc(doc(db, 'users', uid))
  const data = snap.data() as UserDoc | undefined
  const merged = { ...defaultVerification, ...(data?.verification ?? {}), ...state }
  await updateDoc(doc(db, 'users', uid), { verification: merged })
}
