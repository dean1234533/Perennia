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

export function computeFullNatalChart(birthDate: string, birthTime: string, birthPlace: string): FullNatalChart {
  const geo = geocodePlace(birthPlace)
  const positions = computeNatalPositions(birthDate, birthTime, geo)
  const year = Number(birthDate.split('-')[0])
  const chinese = computeChineseZodiac(year)
  return { ...positions, ...chinese, matchedCity: geo.matchedCity, matchedCountry: geo.matchedCountry }
}
