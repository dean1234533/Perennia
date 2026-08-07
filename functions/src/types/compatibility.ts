/**
 * Domain types for the Perennia Compatibility Fusion System.
 *
 * Nothing in this file — or anywhere downstream of it — ever leaves the
 * server holding more than a single resolved score. The full matrix type
 * exists only to describe what lives in Firestore/Sheets; it is never
 * serialized whole into a function response.
 */

/** A single Western zodiac sign, e.g. "ARIES". Validated shape only — see validation/. */
export type PersonalityCode = string

/**
 * The canonical, order-independent key for a pair of zodiac signs.
 * Always the two codes sorted alphabetically and joined with "_", e.g.
 * "ARIES_LEO" regardless of which was passed as A or B.
 */
export type PairKey = string

/** One row of the proprietary compatibility matrix, as stored in Firestore. */
export interface CompatibilityRecord {
  pairKey: PairKey
  personalityA: PersonalityCode
  personalityB: PersonalityCode
  compatibility: number
  updatedAt: FirebaseFirestore.Timestamp
  source: 'google-sheets-sync'
}

/** Raw row shape as read from the Google Sheet, before validation/normalization. */
export interface RawSheetRow {
  personalityA: string
  personalityB: string
  compatibility: string
}

/** The only shape ever returned to the client — deliberately minimal. */
export interface CompatibilityResult {
  compatibility: number
}

/** Input contract for the getCompatibility callable function. */
export interface GetCompatibilityInput {
  personalityA: string
  personalityB: string
}

/** Input contract passed to the AI explanation layer — score only, never the table. */
export interface AiExplanationInput {
  personalityA: PersonalityCode
  personalityB: PersonalityCode
  compatibility: number
}

/** Result summary returned by the sheet sync (manual or scheduled). No row data included. */
export interface SyncSummary {
  rowsRead: number
  rowsImported: number
  rowsSkipped: number
  errors: string[]
  durationMs: number
}
