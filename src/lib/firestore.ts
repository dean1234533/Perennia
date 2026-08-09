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

export type LifestyleVisibility = 'public' | 'private' | 'matching-only'

export interface MatchingPreferences {
  ageMin: number
  ageMax: number
  /** null = "Anywhere" — no distance filtering applied. */
  maxDistanceMiles: number | null
  /** "More filters" — all optional, null/'' = no filtering on that dimension. */
  relationshipGoal: string | null
  wantsChildren: string | null
  religion: string
}

export interface StoryPrompt {
  question: string
  answer: string
}

export interface UserDoc {
  name: string
  email: string
  phone: string
  verification: VerificationState
  onboardingComplete: boolean
  /** Real legal name extracted from the member's government ID during
   *  identity verification (Stripe Identity `verified_outputs`). */
  legalName: string
  birthDate: string
  birthTime: string
  /** True when the member confirmed they don't know their birth time —
   *  sun/moon signs still compute against a noon default, but rising sign
   *  is genuinely unavailable (never fabricated) when this is set. */
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
  /** Real "About You" fields collected during onboarding. */
  heightCm: number | null
  country: string
  city: string
  religion: string
  relationshipGoal: string
  /** Real current-location coordinates (distinct from birthPlace, which is
   *  only used for astrology) — geocoded via the geocodeLocation Cloud
   *  Function so distance-based discovery filtering is real, not guessed. */
  currentLocationLat: number | null
  currentLocationLon: number | null
  storyPrompts: StoryPrompt[]
  preferences: MatchingPreferences
  /** Real, persisted privacy/notification settings — not decorative. */
  incognito: boolean
  showDistance: boolean
  pushNotificationsEnabled: boolean
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

export const defaultPreferences: MatchingPreferences = {
  ageMin: 21,
  ageMax: 55,
  maxDistanceMiles: null,
  relationshipGoal: null,
  wantsChildren: null,
  religion: '',
}

const defaultUserDoc: Omit<UserDoc, 'name' | 'email'> = {
  phone: '',
  verification: defaultVerification,
  onboardingComplete: false,
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

export async function updatePreferencesRemote(uid: string, preferences: MatchingPreferences) {
  await updateDoc(doc(db, 'users', uid), { preferences })
}

export async function setCurrentLocationRemote(uid: string, lat: number, lon: number) {
  await updateDoc(doc(db, 'users', uid), { currentLocationLat: lat, currentLocationLon: lon })
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

/** Real read receipts: marks every message NOT sent by `uid` as read, once
 *  they've actually viewed the thread. Rules only allow a recipient to flip
 *  this one field on someone else's message — see firestore.rules. */
export async function markConversationRead(matchId: string, uid: string, messages: Message[]) {
  const unread = messages.filter((m) => m.senderId !== uid && !m.read)
  if (unread.length === 0) return
  const batch = writeBatch(db)
  for (const m of unread) {
    batch.update(doc(db, 'conversations', matchId, 'messages', m.id), { read: true })
  }
  await batch.commit()
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

// --- Lifestyle (privacy-gated) ----------------------------------------------
// Lives in a separate `users/{uid}/private/lifestyle` doc, not on the main
// `users/{uid}` doc, because the main doc is readable by any signed-in
// member. Firestore rules can't hide individual fields on one doc, so a
// genuinely private/matches-only field has to live somewhere with its own
// read rule — see firestore.rules. A permission-denied read (private, or
// matching-only without a real match) is treated the same as "not set".

export interface PrivateLifestyle {
  items: { label: string; value: string }[]
  visibility: LifestyleVisibility
}

export async function getPrivateLifestyle(uid: string): Promise<PrivateLifestyle | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'private', 'lifestyle'))
    return snap.exists() ? (snap.data() as PrivateLifestyle) : null
  } catch {
    return null
  }
}

export async function updatePrivateLifestyle(uid: string, lifestyle: PrivateLifestyle) {
  await setDoc(doc(db, 'users', uid, 'private', 'lifestyle'), lifestyle)
}

export async function setVerificationState(uid: string, state: Partial<VerificationState>) {
  const snap = await getDoc(doc(db, 'users', uid))
  const data = snap.data() as UserDoc | undefined
  const merged = { ...defaultVerification, ...(data?.verification ?? {}), ...state }
  await updateDoc(doc(db, 'users', uid), { verification: merged })
}
