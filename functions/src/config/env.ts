/**
 * Centralized, typed configuration.
 *
 * Secrets are declared with `defineSecret` (Cloud Functions v2 params) so
 * they're pulled from Secret Manager at runtime and never baked into the
 * deployed bundle, logs, or the Functions console. Non-secret config uses
 * `defineString` with sane defaults. See functions/.env.example for the
 * full list of values `firebase functions:secrets:set` expects.
 */
import { defineSecret, defineString } from 'firebase-functions/params'

/** Service account client email, e.g. perennia-sync@<project>.iam.gserviceaccount.com */
export const googleServiceAccountEmail = defineSecret('GOOGLE_SHEETS_CLIENT_EMAIL')

/** Service account private key (PEM). Store with literal \n escapes; we unescape at read time. */
export const googleServiceAccountKey = defineSecret('GOOGLE_SHEETS_PRIVATE_KEY')

/** The private Google Sheet's ID (the long id segment in its URL). */
export const googleSheetId = defineSecret('GOOGLE_SHEET_ID')

/** Sheet tab + range to read, e.g. "CompatibilityMatrix!A2:C". Header row excluded. */
export const googleSheetRange = defineString('GOOGLE_SHEET_RANGE', {
  default: 'CompatibilityMatrix!A2:C',
})

/** Max calls a single authenticated user may make per rate-limit window. */
export const rateLimitMaxRequests = defineString('RATE_LIMIT_MAX_REQUESTS', {
  default: '30',
})

/** Rate-limit window size, in seconds. */
export const rateLimitWindowSeconds = defineString('RATE_LIMIT_WINDOW_SECONDS', {
  default: '60',
})

/** In-memory cache TTL for getCompatibility results, in seconds. Best-effort — see cache.service.ts. */
export const cacheTtlSeconds = defineString('CACHE_TTL_SECONDS', {
  default: '300',
})

export function normalizePrivateKey(raw: string): string {
  // Secret values are stored as single-line strings with literal "\n" —
  // the PEM parser needs real newlines.
  return raw.replace(/\\n/g, '\n')
}
