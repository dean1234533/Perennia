import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/**
 * Client bridge to the Perennia Compatibility Fusion System backend.
 *
 * This is the ONLY sanctioned way the frontend touches compatibility
 * data — it calls the `getCompatibility` Cloud Function, which is the
 * only thing with read access to the (server-only) `compatibilityMatrix`
 * Firestore collection. There is no client-side Firestore path for this
 * data — see firestore.rules.
 *
 * The resolved score is the only proprietary value that should ever be
 * handed to an AI explanation call: send `{ personalityA, personalityB,
 * compatibility }` and nothing more (no history of other pairs, no raw
 * matrix, no lookup logic).
 */

export interface CompatibilityResult {
  compatibility: number
}

export interface GetCompatibilityInput {
  personalityA: string
  personalityB: string
}

const getCompatibilityCallable = httpsCallable<GetCompatibilityInput, CompatibilityResult>(
  functions,
  'getCompatibility'
)

export async function getCompatibility(input: GetCompatibilityInput): Promise<CompatibilityResult> {
  const result: HttpsCallableResult<CompatibilityResult> = await getCompatibilityCallable(input)
  return result.data
}
