import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/** Client bridge to the real natal-chart calculation (ephemeris + geocoding
 *  + timezone math — see functions/src/services/astrology.service.ts). */

export interface NatalChartResult {
  sunSign: string
  moonSign: string
  risingSign: string
  mercurySign: string
  venusSign: string
  marsSign: string
  jupiterSign: string
  saturnSign: string
  uranusSign: string
  neptuneSign: string
  plutoSign: string
  animal: string
  element: string
  yinYang: 'Yin' | 'Yang'
  matchedCity: string
  matchedCountry: string
}

export interface ComputeNatalChartInput {
  birthDate: string
  birthTime?: string
  birthTimeUnknown?: boolean
  birthPlace: string
}

const computeNatalChartCallable = httpsCallable<ComputeNatalChartInput, NatalChartResult>(functions, 'computeNatalChart')

export async function computeNatalChart(input: ComputeNatalChartInput): Promise<NatalChartResult> {
  const result: HttpsCallableResult<NatalChartResult> = await computeNatalChartCallable(input)
  return result.data
}
