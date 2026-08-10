import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/** Real ranked city matches from the `searchCities` Cloud Function — the
 *  same ~138k-city dataset used for birth-place/current-location geocoding
 *  — for a live typeahead dropdown instead of free-text place entry. */

export interface CityMatch {
  name: string
  country: string
  lat: number
  lon: number
}

const searchCitiesCallable = httpsCallable<{ query: string; country?: string }, CityMatch[]>(functions, 'searchCities')

export async function searchCities(query: string, country?: string): Promise<CityMatch[]> {
  if (query.trim().length < 2) return []
  // The backend requires a real 2-letter ISO code and rejects anything
  // else — silently drop an invalid one (e.g. leftover legacy free-text
  // country data) rather than sending a request that's guaranteed to fail
  // validation and return nothing with no visible explanation.
  const safeCountry = country && /^[A-Za-z]{2}$/.test(country) ? country : undefined
  const result: HttpsCallableResult<CityMatch[]> = await searchCitiesCallable({ query, country: safeCountry })
  return result.data
}
