import { getFirestore } from 'firebase-admin/firestore'
import { log } from '../utils/logger'

/**
 * Public profile projection.
 *
 * `users/{uid}` holds everything about a member, including private data
 * (email, phone, legal name, exact birth details, exact location, push
 * tokens, like/pass/block lists). Other members must never read that
 * document. Instead the server keeps `publicProfiles/{uid}` — an allow-list
 * copy of only the fields other members legitimately see — in sync via a
 * Firestore trigger (see index.ts). Clients can read it but never write it.
 *
 * To expose another field, add it to PUBLIC_FIELDS deliberately; anything not
 * listed here stays private by default.
 */
const PUBLIC_FIELDS = [
  'name',
  'onboardingComplete',
  'sunSign',
  'moonSign',
  'risingSign',
  'chineseAnimal',
  'chineseElement',
  'yinYang',
  'gender',
  'heightCm',
  'country',
  'city',
  'religion',
  'relationshipGoal',
  'storyPrompts',
  'incognito',
  'showDistance',
  'profilePhotoUrl',
  'profilePhotoThumbUrl',
  'categories',
  'profileExtras',
  'accountPausedUntil',
] as const

type RawUser = Record<string, unknown>

/** Whole years since `birthDate` (an ISO date string), or null if unusable. */
export function ageFromBirthDate(birthDate: unknown, now = new Date()): number | null {
  if (typeof birthDate !== 'string' || !birthDate) return null
  const dob = new Date(birthDate)
  if (Number.isNaN(dob.getTime())) return null
  let age = now.getUTCFullYear() - dob.getUTCFullYear()
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) age--
  return age
}

/** ~11 km grid. Enough for "nearest first" and rough distance, not enough to
 *  find someone's street. Exact coordinates stay in the private document. */
export function coarsenCoordinate(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 10) / 10 : null
}

export function toPublicProfile(user: RawUser, now = new Date()): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of PUBLIC_FIELDS) {
    if (key in user) out[key] = user[key]
  }
  const verification = user.verification as { status?: string } | undefined
  out.verified = verification?.status === 'verified'
  out.age = ageFromBirthDate(user.birthDate, now)
  out.currentLocationLat = coarsenCoordinate(user.currentLocationLat)
  out.currentLocationLon = coarsenCoordinate(user.currentLocationLon)
  return out
}

const COLLECTION = 'publicProfiles'

/** Mirrors one member's `users` doc into `publicProfiles` (or removes it if
 *  the member no longer exists). Idempotent. */
export async function syncPublicProfile(uid: string, user: RawUser | undefined): Promise<void> {
  const ref = getFirestore().collection(COLLECTION).doc(uid)
  if (!user) {
    await ref.delete()
    return
  }
  // set() without merge so a field removed from `users` is removed here too.
  await ref.set(toPublicProfile(user))
}

/** Rebuilds every public profile from `users`. Run once after deploying the
 *  trigger so existing members get one; safe to re-run. */
export async function backfillPublicProfiles(): Promise<{ processed: number }> {
  const db = getFirestore()
  let processed = 0
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined
  for (;;) {
    let q = db.collection('users').orderBy('__name__').limit(300)
    if (last) q = q.startAfter(last)
    const snap = await q.get()
    if (snap.empty) break
    const batch = db.batch()
    for (const doc of snap.docs) batch.set(db.collection(COLLECTION).doc(doc.id), toPublicProfile(doc.data()))
    await batch.commit()
    processed += snap.size
    last = snap.docs[snap.docs.length - 1]
  }
  log.info('public_profiles_backfilled', { processed })
  return { processed }
}

/** Ages change on birthdays without any write to the member's document, so
 *  the stored `age` is refreshed daily. Only writes when the value changed. */
export async function refreshPublicProfileAges(): Promise<{ updated: number }> {
  const db = getFirestore()
  let updated = 0
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined
  for (;;) {
    let q = db.collection('users').orderBy('__name__').select('birthDate').limit(500)
    if (last) q = q.startAfter(last)
    const snap = await q.get()
    if (snap.empty) break
    const refs = snap.docs.map((d) => db.collection(COLLECTION).doc(d.id))
    const publicSnaps = await db.getAll(...refs, { fieldMask: ['age'] })
    const batch = db.batch()
    let writes = 0
    snap.docs.forEach((d, i) => {
      const age = ageFromBirthDate(d.get('birthDate'))
      const current = publicSnaps[i]
      if (current.exists && current.get('age') !== age) {
        batch.update(current.ref, { age })
        writes++
      }
    })
    if (writes > 0) await batch.commit()
    updated += writes
    last = snap.docs[snap.docs.length - 1]
  }
  log.info('public_profile_ages_refreshed', { updated })
  return { updated }
}
