import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/** Real city/country -> coordinates for a member's current location
 *  (distance-based discovery), via the `geocodeLocation` Cloud Function —
 *  the same real ~138k-city dataset used for birth-place geocoding. */

export interface GeocodeResult {
  lat: number
  lon: number
  matchedCity: string
  matchedCountry: string
}

const geocodeLocationCallable = httpsCallable<{ place: string }, GeocodeResult>(functions, 'geocodeLocation')

export async function geocodeLocation(place: string): Promise<GeocodeResult> {
  const result: HttpsCallableResult<GeocodeResult> = await geocodeLocationCallable({ place })
  return result.data
}
