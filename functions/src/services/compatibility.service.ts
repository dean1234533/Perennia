import { getCompatibilityByPair, upsertCompatibilityRows } from '../repositories/compatibility.repository'
import { fetchSheetRows } from './googleSheets.service'
import { cacheGet, cacheSet } from './cache.service'
import { buildPairKey } from '../utils/pairKey'
import { sheetRowSchema } from '../validation/compatibility.validation'
import type { GetCompatibilityParsedInput } from '../validation/compatibility.validation'
import type { CompatibilityResult, SyncSummary } from '../types/compatibility'
import { notFound } from '../utils/errors'
import { log } from '../utils/logger'

/**
 * Resolves a single compatibility score for a validated pair.
 *
 * Returns ONLY `{ compatibility }` — this is the boundary that guarantees
 * the rest of the matrix never reaches a caller. Do not change this
 * function to return the full record; add a separate, narrowly-scoped
 * method if some future admin tool genuinely needs more.
 */
export async function resolveCompatibility(
  input: GetCompatibilityParsedInput,
  cacheTtlSeconds: number
): Promise<CompatibilityResult> {
  const pairKey = buildPairKey(input.personalityA, input.personalityB)
  const cached = cacheGet<number>(pairKey)
  if (cached !== undefined) {
    return { compatibility: cached }
  }

  const compatibility = await getCompatibilityByPair(input.personalityA, input.personalityB)
  if (compatibility === undefined) {
    throw notFound('No compatibility record for that pair.')
  }

  cacheSet(pairKey, compatibility, cacheTtlSeconds)
  return { compatibility }
}

/**
 * Full sync pipeline: read the sheet -> validate every row -> upsert into
 * Firestore. Bad rows are skipped (and counted), not fatal — one typo in
 * row 400 of a spreadsheet shouldn't block the other 399 from updating.
 */
export async function syncCompatibilityFromSheet(params: {
  clientEmail: string
  privateKey: string
  sheetId: string
  range: string
}): Promise<SyncSummary> {
  const startedAt = Date.now()
  const errors: string[] = []

  const rawRows = await fetchSheetRows(params)

  const validRows = []
  for (const [index, raw] of rawRows.entries()) {
    const parsed = sheetRowSchema.safeParse(raw)
    if (parsed.success) {
      validRows.push(parsed.data)
    } else {
      errors.push(`Row ${index + 2}: ${parsed.error.issues.map((i) => i.message).join('; ')}`)
    }
  }

  const rowsImported = validRows.length > 0 ? await upsertCompatibilityRows(validRows) : 0

  const summary: SyncSummary = {
    rowsRead: rawRows.length,
    rowsImported,
    rowsSkipped: rawRows.length - rowsImported,
    errors,
    durationMs: Date.now() - startedAt,
  }

  log.info('sheet_sync_complete', {
    rowsRead: summary.rowsRead,
    rowsImported: summary.rowsImported,
    rowsSkipped: summary.rowsSkipped,
    errorCount: errors.length,
    durationMs: summary.durationMs,
  })

  return summary
}
