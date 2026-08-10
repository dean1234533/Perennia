/**
 * Re-verification gate for editing already-confirmed Birth Details.
 *
 * State lives in an Admin-SDK-only collection (see firestore.rules) keyed
 * by uid — one reverification attempt in flight at a time. Password
 * re-entry itself happens client-side via Firebase's own
 * reauthenticateWithCredential (see AuthContext.reauthenticate) before
 * sendOtp is ever called; this service only owns the OTP leg and the final
 * gated write.
 *
 * The OTP code itself is never stored in plaintext — only its sha256 hash.
 */
import { createHash, randomInt } from 'node:crypto'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { sendOtpEmail } from './email.service'
import { invalidArgument, failedPrecondition, permissionDenied } from '../utils/errors'

const COLLECTION = 'birthDetailsReverification'
const OTP_TTL_MS = 10 * 60 * 1000
const UNLOCK_TTL_MS = 10 * 60 * 1000
const MAX_OTP_ATTEMPTS = 5

interface ReverificationDoc {
  otpCodeHash: string | null
  otpExpiresAt: number | null
  otpAttempts: number
  status: 'otp_pending' | 'unlocked'
  unlockExpiresAt: number | null
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export async function sendOtp(uid: string, email: string, apiKey: string): Promise<{ sent: true }> {
  const code = generateCode()
  const doc: ReverificationDoc = {
    otpCodeHash: hashCode(code),
    otpExpiresAt: Date.now() + OTP_TTL_MS,
    otpAttempts: 0,
    status: 'otp_pending',
    unlockExpiresAt: null,
  }

  // Send first — if delivery fails (e.g. RESEND_API_KEY unset), don't leave
  // a code active that the user was never actually given.
  await sendOtpEmail(email, code, apiKey)
  await getFirestore()
    .collection(COLLECTION)
    .doc(uid)
    .set({ ...doc, updatedAt: FieldValue.serverTimestamp() })

  return { sent: true }
}

export async function verifyOtp(uid: string, code: string): Promise<{ verified: true }> {
  const ref = getFirestore().collection(COLLECTION).doc(uid)
  const snap = await ref.get()
  const data = snap.data() as ReverificationDoc | undefined

  if (!data || data.status !== 'otp_pending' || !data.otpCodeHash || !data.otpExpiresAt) {
    throw failedPrecondition('No verification code is pending. Please request a new one.')
  }
  if (Date.now() > data.otpExpiresAt) {
    throw failedPrecondition('This code has expired. Please request a new one.')
  }
  if (data.otpAttempts >= MAX_OTP_ATTEMPTS) {
    throw failedPrecondition('Too many incorrect attempts. Please request a new code.')
  }

  if (hashCode(code) !== data.otpCodeHash) {
    await ref.update({ otpAttempts: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() })
    throw invalidArgument('Incorrect code. Please try again.')
  }

  await ref.update({
    status: 'unlocked',
    unlockExpiresAt: Date.now() + UNLOCK_TTL_MS,
    otpCodeHash: null,
    updatedAt: FieldValue.serverTimestamp(),
  })
  return { verified: true }
}

async function assertUnlocked(uid: string): Promise<void> {
  const snap = await getFirestore().collection(COLLECTION).doc(uid).get()
  const data = snap.data() as ReverificationDoc | undefined
  if (!data || data.status !== 'unlocked' || !data.unlockExpiresAt || Date.now() > data.unlockExpiresAt) {
    throw permissionDenied('Re-verification is required before editing birth details. Please start again.')
  }
}

export interface BirthDetailsUpdateFields {
  birthTime: string
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
  yinYang: string
}

export async function updateBirthDetails(uid: string, fields: BirthDetailsUpdateFields): Promise<{ updated: true }> {
  await assertUnlocked(uid)

  const db = getFirestore()
  await db.collection('users').doc(uid).update({ ...fields })
  // Consume the unlock so it can't be reused for a second silent edit.
  await db.collection(COLLECTION).doc(uid).set({
    otpCodeHash: null,
    otpExpiresAt: null,
    otpAttempts: 0,
    status: 'otp_pending',
    unlockExpiresAt: null,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { updated: true }
}
