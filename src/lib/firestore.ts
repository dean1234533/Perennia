import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
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
  detailsConfirmedAt?: string | null
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
  onboardingResumePath: string
  verification: VerificationState
  onboardingComplete: boolean
  /** Real legal name extracted from the member's government ID during
   *  identity verification (Stripe Identity `verified_outputs`). */
  legalName: string
  /** Records completion even when all three optional About You answers are blank. */
  aboutYouCompletedAt: string
  /** Records that the member explicitly reviewed and confirmed the complete
   *  Birth Details form rather than merely having populated birth fields. */
  birthDetailsConfirmedAt: string
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
  relationshipGoalSelectedAt: string
  relationshipDealBreakers: string[]
  partnerValues: string[]
  prioritiseSameRelationshipGoal: boolean
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
  /** Real FCM registration tokens for this member's browsers/devices —
   *  written only by the client's own opt-in flow (src/lib/pushNotifications.ts)
   *  after the browser actually grants Notification permission. */
  pushTokens: string[]
  likedIds: string[]
  passedIds: string[]
  matchedIds: string[]
  /** Real blocked-member list — a block hides that member from Discovery
   *  (same mechanism as passedIds) and is reversible from Settings ->
   *  Blocked Users, unlike a pass. */
  blockedIds: string[]
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
  detailsConfirmedAt: null,
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
  onboardingResumePath: '',
  verification: defaultVerification,
  onboardingComplete: false,
  legalName: '',
  aboutYouCompletedAt: '',
  birthDetailsConfirmedAt: '',
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
  relationshipGoalSelectedAt: '',
  relationshipDealBreakers: [],
  partnerValues: [],
  prioritiseSameRelationshipGoal: true,
  currentLocationLat: null,
  currentLocationLon: null,
  storyPrompts: [],
  preferences: defaultPreferences,
  incognito: false,
  showDistance: true,
  pushNotificationsEnabled: true,
  pushTokens: [],
  likedIds: [],
  passedIds: [],
  matchedIds: [],
  blockedIds: [],
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

/** The viewer's OWN full document. Never use this for another member — their
 *  `users` doc is private (email, phone, exact location, …); use
 *  getPublicProfile instead. */
export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserDoc) : null
}

/** What other members may see of someone: an allow-listed copy of their
 *  `users` doc that the server keeps in `publicProfiles/{uid}` (see
 *  functions/src/services/publicProfile.service.ts). No email, phone, legal
 *  name, birth date, exact location, push tokens or like/block lists. */
export type PublicProfileDoc = Pick<
  UserDoc,
  | 'name' | 'onboardingComplete' | 'sunSign' | 'moonSign' | 'risingSign'
  | 'chineseAnimal' | 'chineseElement' | 'yinYang' | 'gender' | 'heightCm'
  | 'country' | 'city' | 'religion' | 'relationshipGoal' | 'storyPrompts'
  | 'incognito' | 'showDistance' | 'profilePhotoUrl' | 'profilePhotoThumbUrl'
  | 'categories' | 'profileExtras'
> & {
  /** Whole years, computed server-side from the private birth date. */
  age: number | null
  verified: boolean
  /** Rounded to ~11 km — not the member's real coordinates. */
  currentLocationLat: number | null
  currentLocationLon: number | null
}

/** A real member's public profile plus their uid — the shape used everywhere
 *  a screen shows someone OTHER than the signed-in member (Discovery,
 *  Matches, ProfileDetail, compatibility). Never fabricated client-side. */
export type DiscoveryCandidate = PublicProfileDoc & { uid: string }

function coarse(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 10) / 10 : null
}

function ageOf(birthDate: string | undefined): number | null {
  if (!birthDate) return null
  const dob = new Date(birthDate)
  if (Number.isNaN(dob.getTime())) return null
  const now = new Date()
  let age = now.getUTCFullYear() - dob.getUTCFullYear()
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) age--
  return age
}

/** Transitional fallback for members whose `publicProfiles` doc hasn't been
 *  created yet (before the one-off backfill has run). Builds the same shape
 *  from a full `users` doc, dropping everything private. Once every member
 *  has a public doc and the rules lock `users`, this is never reached. */
function publicProfileFromUserDoc(d: Partial<UserDoc>): PublicProfileDoc {
  return {
    name: d.name ?? '',
    onboardingComplete: d.onboardingComplete ?? false,
    sunSign: d.sunSign ?? '', moonSign: d.moonSign ?? '', risingSign: d.risingSign ?? '',
    chineseAnimal: d.chineseAnimal ?? '', chineseElement: d.chineseElement ?? '', yinYang: d.yinYang ?? '',
    gender: d.gender ?? '', heightCm: d.heightCm ?? null,
    country: d.country ?? '', city: d.city ?? '', religion: d.religion ?? '',
    relationshipGoal: d.relationshipGoal ?? '', storyPrompts: d.storyPrompts ?? [],
    incognito: d.incognito ?? false, showDistance: d.showDistance ?? true,
    profilePhotoUrl: d.profilePhotoUrl ?? '', profilePhotoThumbUrl: d.profilePhotoThumbUrl ?? '',
    categories: d.categories ?? [], profileExtras: d.profileExtras ?? null,
    age: ageOf(d.birthDate), verified: d.verification?.status === 'verified',
    currentLocationLat: coarse(d.currentLocationLat), currentLocationLon: coarse(d.currentLocationLon),
  }
}

export async function getPublicProfile(uid: string): Promise<DiscoveryCandidate | null> {
  const snap = await getDoc(doc(db, 'publicProfiles', uid))
  if (snap.exists()) return { uid, ...(snap.data() as PublicProfileDoc) }
  // Not backfilled yet — fall back to the old document (readable only until
  // the rules lock it), reduced to the public shape.
  try {
    const legacy = await getDoc(doc(db, 'users', uid))
    return legacy.exists() ? { uid, ...publicProfileFromUserDoc(legacy.data() as UserDoc) } : null
  } catch {
    return null
  }
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

export async function updatePreferencesRemote(uid: string, preferences: MatchingPreferences) {
  await updateDoc(doc(db, 'users', uid), { preferences })
}

export async function setCurrentLocationRemote(uid: string, lat: number, lon: number) {
  await updateDoc(doc(db, 'users', uid), { currentLocationLat: lat, currentLocationLon: lon })
}

export async function passProfileRemote(uid: string, targetUid: string) {
  await updateDoc(doc(db, 'users', uid), { passedIds: arrayUnion(targetUid) })
}

export interface SafetySettings {
  safeMode: boolean
  blockedIds: string[]
  mutedIds: string[]
}

const defaultSafetySettings: SafetySettings = { safeMode: false, blockedIds: [], mutedIds: [] }

export function subscribeSafetySettings(uid: string, cb: (settings: SafetySettings) => void) {
  return onSnapshot(doc(db, 'users', uid, 'private', 'safety'), (snap) => {
    cb(snap.exists() ? { ...defaultSafetySettings, ...(snap.data() as Partial<SafetySettings>) } : defaultSafetySettings)
  })
}

export async function updateSafetySettingsRemote(uid: string, data: Partial<SafetySettings>) {
  await setDoc(doc(db, 'users', uid, 'private', 'safety'), data, { merge: true })
}

export async function blockProfileRemote(uid: string, targetUid: string) {
  await setDoc(doc(db, 'users', uid, 'private', 'safety'), { blockedIds: arrayUnion(targetUid) }, { merge: true })
}

export async function unblockProfileRemote(uid: string, targetUid: string) {
  await setDoc(doc(db, 'users', uid, 'private', 'safety'), { blockedIds: arrayRemove(targetUid) }, { merge: true })
}

export async function muteProfileRemote(uid: string, targetUid: string) {
  await setDoc(doc(db, 'users', uid, 'private', 'safety'), { mutedIds: arrayUnion(targetUid) }, { merge: true })
}

export async function unmuteProfileRemote(uid: string, targetUid: string) {
  await setDoc(doc(db, 'users', uid, 'private', 'safety'), { mutedIds: arrayRemove(targetUid) }, { merge: true })
}

export async function savePushTokenRemote(uid: string, token: string) {
  await updateDoc(doc(db, 'users', uid), { pushNotificationsEnabled: true, pushTokens: arrayUnion(token) })
}

// --- Real discovery, matches, messaging -------------------------------------
// Liking and connection creation are NOT done here — they go through the
// real `likeUser` Cloud Function (see matchingApi.ts), since clients cannot
// safely create shared connections or conversations directly.
// Everything below is read-only from the client's side, or writes that are
// already scoped to data the client is allowed to touch.

/** A candidate pool for Discovery: real, onboarded members with a profile
 *  photo. Excludes nobody by connection/like/pass state — the caller filters
 *  that client-side against its own state, since Firestore can't
 *  express "not in this array" as a query. */
export async function fetchDiscoveryCandidates(uid: string): Promise<DiscoveryCandidate[]> {
  const publicSnap = await getDocs(query(
    collection(db, 'publicProfiles'),
    where('onboardingComplete', '==', true),
    where('profilePhotoUrl', '!=', ''),
    limit(50)
  ))
  if (!publicSnap.empty) {
    return publicSnap.docs
      .filter((d) => d.id !== uid)
      .map((d) => ({ uid: d.id, ...(d.data() as PublicProfileDoc) }))
  }
  // No public profiles exist yet (backfill hasn't run): old behaviour,
  // reduced to the public shape so nothing private reaches the screens.
  const legacySnap = await getDocs(query(
    collection(db, 'users'),
    where('onboardingComplete', '==', true),
    where('profilePhotoUrl', '!=', ''),
    limit(50)
  )).catch(() => null)
  return (legacySnap?.docs ?? [])
    .filter((d) => d.id !== uid)
    .map((d) => ({ uid: d.id, ...publicProfileFromUserDoc(d.data() as UserDoc) }))
}

export interface MatchDoc {
  id: string
  users: [string, string]
  initiatedBy?: string
  createdAt: Timestamp | null
}

export function subscribeMyMatches(
  uid: string,
  cb: (matches: MatchDoc[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(collection(db, 'matches'), where('users', 'array-contains', uid))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as MatchDoc))
  }, onError)
}

export async function getMatch(matchId: string): Promise<MatchDoc | null> {
  const snap = await getDoc(doc(db, 'matches', matchId))
  return snap.exists() ? (snap.data() as MatchDoc) : null
}

export interface ConnectionDoc extends MatchDoc {}

export function subscribeMyConnections(uid: string, cb: (connections: ConnectionDoc[]) => void) {
  const q = query(collection(db, 'connections'), where('users', 'array-contains', uid))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as ConnectionDoc)))
}

export async function getConnection(connectionId: string): Promise<ConnectionDoc | null> {
  const snap = await getDoc(doc(db, 'connections', connectionId))
  return snap.exists() ? (snap.data() as ConnectionDoc) : null
}

export interface ConversationDoc {
  matchId: string
  participants: [string, string]
  createdAt: Timestamp | null
  lastMessageAt: Timestamp | null
  lastMessagePreview: string | null
  lastMessageSenderId: string | null
}

export async function getConversation(matchId: string): Promise<ConversationDoc | null> {
  const snap = await getDoc(doc(db, 'conversations', matchId))
  return snap.exists() ? (snap.data() as ConversationDoc) : null
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
