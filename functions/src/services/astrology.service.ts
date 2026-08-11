/**
 * Real natal-chart calculation — no hardcoded/fake signs.
 *
 * Sun/Moon sign: actual geocentric ecliptic longitude at the birth instant
 * (astronomy-engine), not just a calendar-date lookup table.
 * Rising sign: the real Ascendant formula (local sidereal time + mean
 * obliquity of the ecliptic + geographic latitude) — standard astrology
 * math, e.g. Meeus "Astronomical Algorithms".
 * Birth place -> coordinates: matched against a real ~138k-city dataset
 * (GeoNames, via `all-the-cities`), picking the highest-population match
 * for an ambiguous name (e.g. "London" -> London, UK over London, Ontario).
 * Local birth time -> UTC: real IANA timezone lookup from the matched
 * coordinates (`tz-lookup`) + historical-DST-aware conversion (`luxon`).
 *
 * Known simplification: Chinese zodiac year is derived from the Gregorian
 * birth year, not the exact lunisolar new-year date — correct for the vast
 * majority of birthdates, off by one for people born before Chinese New
 * Year in Jan/early Feb of their birth year. Fixing this exactly would
 * need a table of historical lunar new year dates; flagged here rather
 * than silently treated as exact.
 */
import * as Astronomy from 'astronomy-engine'
import tzlookup from 'tz-lookup'
import { DateTime } from 'luxon'
import cities from 'all-the-cities'

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

function signFromLongitude(elonDeg: number): string {
  const norm = ((elonDeg % 360) + 360) % 360
  return ZODIAC_SIGNS[Math.floor(norm / 30)]
}

export interface GeocodeResult {
  lat: number
  lon: number
  matchedCity: string
  matchedCountry: string
}

export class AstrologyError extends Error {}

export interface CityMatch {
  name: string
  country: string
  lat: number
  lon: number
}

/** Strips accents/diacritics so "munchen" matches "München" and "sao paulo"
 *  matches "São Paulo" — typing a city without its native diacritics is the
 *  normal case on most keyboards, not an edge case. */
function normalizeForSearch(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Real ranked city matches from the same ~138k-city dataset `geocodePlace`
 *  uses, for a typeahead dropdown rather than free-text entry. Synchronous,
 *  offline — this is the fast/common path searchCityMatches tries first. */
function searchCityMatchesLocal(query: string, countryCode?: string, limit = 8): CityMatch[] {
  const q = normalizeForSearch(query.trim())
  if (q.length < 2) return []

  const pool = countryCode ? cities.filter((c) => c.country === countryCode) : cities

  // Prefix match first (most relevant, matches typeahead expectations);
  // fall back to substring match so a city typed as part of a longer local
  // name (or not started from its exact first letters) still surfaces
  // instead of silently returning nothing.
  let matches = pool.filter((c) => normalizeForSearch(c.name).startsWith(q))
  if (matches.length === 0) {
    matches = pool.filter((c) => normalizeForSearch(c.name).includes(q))
  }

  return [...matches]
    .sort((a, b) => b.population - a.population)
    .slice(0, limit)
    .map((c) => ({ name: c.name, country: c.country, lat: c.loc.coordinates[1], lon: c.loc.coordinates[0] }))
}

interface GeonamesResult {
  name: string
  countryCode: string
  lat: string
  lng: string
}

/** Live fallback against GeoNames' search API, which indexes alternate
 *  names in many languages (e.g. "München" for Munich). Only ever called
 *  when the offline dataset finds nothing, and fails silently (empty
 *  array) on any error — this is an enhancement, never a required
 *  dependency for the birth-place flow to work. */
async function searchCityMatchesRemote(
  query: string,
  countryCode: string | undefined,
  username: string,
  limit = 8
): Promise<CityMatch[]> {
  const UNSET_SENTINEL = 'not_configured'
  if (!username || username === UNSET_SENTINEL) return []

  const params = new URLSearchParams({
    q: query,
    maxRows: String(limit),
    featureClass: 'P', // populated places only
    username,
  })
  if (countryCode) params.set('country', countryCode)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(`https://secure.geonames.org/searchJSON?${params}`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!response.ok) return []

    const data = (await response.json()) as { geonames?: GeonamesResult[] }
    return (data.geonames ?? []).map((g) => ({
      name: g.name,
      country: g.countryCode,
      lat: Number(g.lat),
      lon: Number(g.lng),
    }))
  } catch {
    return []
  }
}

export async function searchCityMatches(
  query: string,
  countryCode?: string,
  geonamesUsernameValue?: string,
  limit = 8
): Promise<CityMatch[]> {
  const local = searchCityMatchesLocal(query, countryCode, limit)
  if (local.length > 0) return local
  if (!geonamesUsernameValue || query.trim().length < 2) return []
  return searchCityMatchesRemote(query, countryCode, geonamesUsernameValue, limit)
}

export function geocodePlace(placeText: string): GeocodeResult {
  const cityPart = placeText.split(',')[0].trim().toLowerCase()
  if (!cityPart) throw new AstrologyError('Birth place is required.')

  let matches = cities.filter((c) => c.name.toLowerCase() === cityPart)
  if (matches.length === 0) {
    matches = cities.filter((c) => c.name.toLowerCase().startsWith(cityPart))
  }
  if (matches.length === 0) {
    throw new AstrologyError(`Couldn't find a city matching "${placeText}". Try a more specific name, e.g. "Paris, FR".`)
  }

  const countryPart = placeText.split(',')[1]?.trim().toUpperCase()
  const scoped = countryPart ? matches.filter((c) => c.country === countryPart) : matches
  const pool = scoped.length > 0 ? scoped : matches
  const best = [...pool].sort((a, b) => b.population - a.population)[0]

  return { lat: best.loc.coordinates[1], lon: best.loc.coordinates[0], matchedCity: best.name, matchedCountry: best.country }
}

export interface NatalPositions {
  sunSign: string
  moonSign: string
  risingSign: string
}

const MEAN_OBLIQUITY_DEG = 23.4392911 // J2000 mean obliquity of the ecliptic; drifts ~0.013°/century, negligible here

export function computeNatalPositions(birthDate: string, birthTime: string, geo: GeocodeResult): NatalPositions {
  const tz = tzlookup(geo.lat, geo.lon)
  const local = DateTime.fromISO(`${birthDate}T${birthTime}`, { zone: tz })
  if (!local.isValid) {
    throw new AstrologyError(`Invalid birth date/time (${local.invalidReason}).`)
  }
  const utcDate = local.toUTC().toJSDate()

  const sunLon = Astronomy.SunPosition(utcDate).elon
  const moonLon = Astronomy.EclipticGeoMoon(utcDate).lon

  const gstHours = Astronomy.SiderealTime(utcDate)
  const lstDeg = ((gstHours + geo.lon / 15) * 15 + 360) % 360
  const latRad = (geo.lat * Math.PI) / 180
  const oblRad = (MEAN_OBLIQUITY_DEG * Math.PI) / 180
  const lstRad = (lstDeg * Math.PI) / 180

  const y = -Math.cos(lstRad)
  const x = Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad)
  const ascDeg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360

  return {
    sunSign: signFromLongitude(sunLon),
    moonSign: signFromLongitude(moonLon),
    risingSign: signFromLongitude(ascDeg),
  }
}

export interface ChineseZodiacResult {
  animal: string
  element: string
  yinYang: 'Yin' | 'Yang'
}

const CHINESE_ANIMALS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Sheep', 'Monkey', 'Rooster', 'Dog', 'Pig']
// 10-year heavenly-stem cycle, two years per element. 1900 (index 0) was
// the Metal Rat — a verifiable historical reference point.
const CHINESE_ELEMENTS = ['Metal', 'Metal', 'Water', 'Water', 'Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth']

export function computeChineseZodiac(birthYear: number): ChineseZodiacResult {
  const animalIndex = (((birthYear - 1900) % 12) + 12) % 12
  const stemIndex = (((birthYear - 1900) % 10) + 10) % 10
  return {
    animal: CHINESE_ANIMALS[animalIndex],
    element: CHINESE_ELEMENTS[stemIndex],
    yinYang: stemIndex % 2 === 0 ? 'Yang' : 'Yin',
  }
}

export interface FullNatalChart extends NatalPositions, ChineseZodiacResult {
  matchedCity: string
  matchedCountry: string
}

// When the member genuinely doesn't know their birth time, sun/moon signs
// are computed against local noon as a real, documented best-effort default
// (time-of-day rarely shifts sun sign and only occasionally shifts moon sign
// near a transition) — but the Ascendant/rising sign is dropped entirely
// rather than shown as if it were accurate, since it changes roughly every
// two hours and cannot be honestly computed without a real birth time.
export function computeFullNatalChart(
  birthDate: string,
  birthTime: string | undefined,
  birthPlace: string,
  birthTimeUnknown = false
): FullNatalChart {
  const geo = geocodePlace(birthPlace)
  const positions = computeNatalPositions(birthDate, birthTimeUnknown ? '12:00' : birthTime!, geo)
  if (birthTimeUnknown) {
    positions.risingSign = ''
  }
  const year = Number(birthDate.split('-')[0])
  const chinese = computeChineseZodiac(year)
  return { ...positions, ...chinese, matchedCity: geo.matchedCity, matchedCountry: geo.matchedCountry }
}
