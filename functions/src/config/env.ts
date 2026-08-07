/**
 * Centralized, typed configuration.
 *
 * Secrets are declared with `defineSecret` (Cloud Functions v2 params) so
 * they're pulled from Secret Manager at runtime and never baked into the
 * deployed bundle, logs, or the Functions console.
 *
 * Sheet RANGES are declared with `defineString` and sane defaults inferred
 * from screenshots of the real sheet — they are NOT guaranteed to be
 * exactly right on the first try. Override any of them without touching
 * code by creating `functions/.env.perennia-982a6` (see README.md) and
 * redeploying — no code change needed.
 */
import { defineSecret, defineString } from 'firebase-functions/params'

// --- Secrets -----------------------------------------------------------
export const googleServiceAccountEmail = defineSecret('GOOGLE_SHEETS_CLIENT_EMAIL')
export const googleServiceAccountKey = defineSecret('GOOGLE_SHEETS_PRIVATE_KEY')
export const googleSheetId = defineSecret('GOOGLE_SHEET_ID')

// --- Sub-score table ranges (Western Zodiac tab) ------------------------
// Columns read directly off a screenshot of the real sheet: three side by
// side 3-column tables (label | score | rule-applied) at B:D, F:H, J:L.
export const rangeWesternSun = defineString('RANGE_WESTERN_SUN', {
  default: 'Western Zodiac!B1:D500',
})
export const rangeWesternMoon = defineString('RANGE_WESTERN_MOON', {
  default: 'Western Zodiac!F1:H500',
})
export const rangeWesternRising = defineString('RANGE_WESTERN_RISING', {
  default: 'Western Zodiac!J1:L500',
})

// --- Sub-score table ranges (Chinese Zodiac tab) ------------------------
export const rangeChineseAnimal = defineString('RANGE_CHINESE_ANIMAL', {
  default: 'Chinese Zodiac!B1:D500',
})
export const rangeChineseElement = defineString('RANGE_CHINESE_ELEMENT', {
  default: 'Chinese Zodiac!F1:H500',
})
export const rangeChineseYinYang = defineString('RANGE_CHINESE_YIN_YANG', {
  default: 'Chinese Zodiac!J1:L500',
})

// --- Overall insights library (keyed by final-score bucket) ------------
export const rangeInsightsLibrary = defineString('RANGE_INSIGHTS_LIBRARY', {
  default: 'Compatibility Insights Library!A1:L30',
})

// --- Per-factor tiered insights ------------------------------------------
// All six factors' tiered blurbs live on ONE tab, as six columns side by
// side (Animal / Heavenly stem / Yin-Yang / Sun / Moon / Rising Insights),
// each column a repeating "tier label row, then text row" pattern. See
// googleSheets.service.ts fetchFactorInsightsGrid for how that's parsed.
export const rangeFactorInsights = defineString('RANGE_FACTOR_INSIGHTS', {
  default: 'Compatibility Insights!A1:F60',
})

// --- Operational config --------------------------------------------------
export const rateLimitMaxRequests = defineString('RATE_LIMIT_MAX_REQUESTS', { default: '30' })
export const rateLimitWindowSeconds = defineString('RATE_LIMIT_WINDOW_SECONDS', { default: '60' })
export const cacheTtlSeconds = defineString('CACHE_TTL_SECONDS', { default: '300' })

export function normalizePrivateKey(raw: string): string {
  // Secret values are stored as single-line strings with literal "\n" —
  // the PEM parser needs real newlines.
  return raw.replace(/\\n/g, '\n')
}
