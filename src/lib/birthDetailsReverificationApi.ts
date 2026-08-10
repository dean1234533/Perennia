import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/**
 * Client bridge to the secure birth-details edit flow (see
 * functions/src/services/birthDetailsReverification.service.ts). Password
 * re-entry itself is NOT here — that's AuthContext.reauthenticate, a real
 * Firebase reauth that must succeed before sendBirthDetailsOtp is called.
 */

const sendBirthDetailsOtpCallable = httpsCallable<Record<string, never>, { sent: true }>(
  functions,
  'sendBirthDetailsOtp'
)
const verifyBirthDetailsOtpCallable = httpsCallable<{ code: string }, { verified: true }>(
  functions,
  'verifyBirthDetailsOtp'
)

export interface UpdateBirthDetailsInput {
  birthTime?: string
  birthTimeUnknown: boolean
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

const updateBirthDetailsSecureCallable = httpsCallable<UpdateBirthDetailsInput, { updated: true }>(
  functions,
  'updateBirthDetailsSecure'
)

export async function sendBirthDetailsOtp(): Promise<{ sent: true }> {
  const result: HttpsCallableResult<{ sent: true }> = await sendBirthDetailsOtpCallable({})
  return result.data
}

export async function verifyBirthDetailsOtp(code: string): Promise<{ verified: true }> {
  const result: HttpsCallableResult<{ verified: true }> = await verifyBirthDetailsOtpCallable({ code })
  return result.data
}

export async function updateBirthDetailsSecure(input: UpdateBirthDetailsInput): Promise<{ updated: true }> {
  const result: HttpsCallableResult<{ updated: true }> = await updateBirthDetailsSecureCallable(input)
  return result.data
}
