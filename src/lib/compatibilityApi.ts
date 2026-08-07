import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/**
 * Client bridge to the Perennia Compatibility Fusion System backend.
 *
 * This is the ONLY sanctioned way the frontend touches compatibility
 * data — it calls the `getCompatibility` Cloud Function, which is the
 * only thing with read access to the (server-only) `fusion*` Firestore
 * collections. There is no client-side Firestore path for this data —
 * see firestore.rules.
 *
 * The backend fuses six weighted factors (Sun/Moon/Rising sign, Chinese
 * animal/element/Yin-Yang) into one score, then attaches a short blurb
 * per factor plus six overall narrative sections. None of the underlying
 * lookup tables are ever exposed — only this shape.
 */

export type ScoreTier = 'LOW' | 'MEDIUM' | 'HIGH'
export type YinYangTier = 'COMPLEMENTARY' | 'SIMILAR'

export interface FactorResult {
  score: number
  tier: ScoreTier | YinYangTier
  insight: string
}

export interface CompatibilityResult {
  compatibility: number
  band: string
  factors: {
    sun: FactorResult
    moon: FactorResult
    rising: FactorResult
    animal: FactorResult
    element: FactorResult
    yinYang: FactorResult
  }
  insights: {
    understanding: string
    emotionalConnection: string
    communication: string
    relationshipGrowth: string
    challenges: string
    longTermPotential: string
  }
}

export interface PersonBirthProfile {
  sunSign: string
  moonSign: string
  risingSign: string
  chineseAnimal: string
  chineseElement: string
  yinYang: string
}

export interface GetCompatibilityInput {
  personA: PersonBirthProfile
  personB: PersonBirthProfile
}

const getCompatibilityCallable = httpsCallable<GetCompatibilityInput, CompatibilityResult>(
  functions,
  'getCompatibility'
)

export async function getCompatibility(input: GetCompatibilityInput): Promise<CompatibilityResult> {
  const result: HttpsCallableResult<CompatibilityResult> = await getCompatibilityCallable(input)
  return result.data
}
