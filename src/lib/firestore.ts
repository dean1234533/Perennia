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
  limit,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
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
  phone: string
  verification: VerificationState
  onboardingComplete: boolean
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
  phone: '',
  verification: defaultVerification,
  onboardingComplete: false,
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

/** A real member's doc plus their uid — the shape used everywhere a screen
 *  shows someone OTHER than the signed-in member (Discovery, Matches,
 *  ProfileDetail, compatibility). Never fabricated client-side. */
export type DiscoveryCandidate = UserDoc & { uid: string }

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

export async function passProfileRemote(uid: string, targetUid: string) {
  await updateDoc(doc(db, 'users', uid), { passedIds: arrayUnion(targetUid) })
}

// --- Real discovery, matches, messaging -------------------------------------
// Liking (and the reciprocal-match check that goes with it) is NOT done here
// — it goes through the real `likeUser` Cloud Function (see matchingApi.ts),
// since a client can never safely read another user's likes to detect
// mutual interest. Everything below is read-only from the client's side,
// or writes that are already scoped to data the client is allowed to touch.

/** A candidate pool for Discovery: real, onboarded members with a profile
 *  photo. Excludes nobody by like/pass state — the caller filters that
 *  client-side against its own likedIds/passedIds, since Firestore can't
 *  express "not in this array" as a query. */
export async function fetchDiscoveryCandidates(uid: string): Promise<DiscoveryCandidate[]> {
  const q = query(
    collection(db, 'users'),
    where('onboardingComplete', '==', true),
    where('profilePhotoUrl', '!=', ''),
    limit(50)
  )
  const snap = await getDocs(q)
  return snap.docs
    .filter((d) => d.id !== uid)
    .map((d) => ({ uid: d.id, ...(d.data() as UserDoc) }))
}

export interface MatchDoc {
  id: string
  users: [string, string]
  createdAt: Timestamp | null
}

export function subscribeMyMatches(uid: string, cb: (matches: MatchDoc[]) => void) {
  const q = query(collection(db, 'matches'), where('users', 'array-contains', uid))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as MatchDoc))
  })
}

export async function getMatch(matchId: string): Promise<MatchDoc | null> {
  const snap = await getDoc(doc(db, 'matches', matchId))
  return snap.exists() ? (snap.data() as MatchDoc) : null
}

export interface ConversationDoc {
  matchId: string
  participants: [string, string]
  createdAt: Timestamp | null
  lastMessageAt: Timestamp | null
  lastMessagePreview: string | null
  lastMessageSenderId: string | null
}

export function subscribeConversation(matchId: string, cb: (conversation: ConversationDoc | null) => void) {
  return onSnapshot(doc(db, 'conversations', matchId), (snap) => {
    cb(snap.exists() ? (snap.data() as ConversationDoc) : null)
  })
}

export interface Message {
  id: string
  senderId: string
  text: string
  createdAt: Timestamp | null
  read: boolean
}

export function subscribeMessages(matchId: string, cb: (messages: Message[]) => void) {
  const msgsRef = collection(db, 'conversations', matchId, 'messages')
  const q = query(msgsRef, orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as Message))
  })
}

export async function sendMessageRemote(matchId: string, senderId: string, text: string) {
  const msgsRef = collection(db, 'conversations', matchId, 'messages')
  const ref = doc(msgsRef)
  await setDoc(ref, { id: ref.id, senderId, text, createdAt: serverTimestamp(), read: false })
  await updateDoc(doc(db, 'conversations', matchId), {
    lastMessageAt: serverTimestamp(),
    lastMessagePreview: text.slice(0, 140),
    lastMessageSenderId: senderId,
  })
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
