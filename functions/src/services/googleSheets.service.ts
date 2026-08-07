import { google } from 'googleapis'
import { normalizePrivateKey } from '../config/env'
import type { RawSheetRow } from '../types/compatibility'
import { log } from '../utils/logger'

/**
 * Reads the private Google Sheet via a service account (read-only scope).
 *
 * The service account must be shared as a Viewer on the target sheet —
 * see functions/README.md for the exact steps. Credentials never touch
 * disk or a git-tracked file; they're pulled from Secret Manager params
 * at call time (see config/env.ts) and passed in memory only.
 */

const READONLY_SCOPE = ['https://www.googleapis.com/auth/spreadsheets.readonly']

export async function fetchSheetRows(params: {
  clientEmail: string
  privateKey: string
  sheetId: string
  range: string
}): Promise<RawSheetRow[]> {
  const auth = new google.auth.JWT({
    email: params.clientEmail,
    key: normalizePrivateKey(params.privateKey),
    scopes: READONLY_SCOPE,
  })

  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: params.sheetId,
    range: params.range,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })

  const rows = response.data.values ?? []
  log.info('sheet_rows_fetched', { count: rows.length })

  // Expected column order: personalityA | personalityB | compatibility
  return rows.map((row): RawSheetRow => ({
    personalityA: String(row[0] ?? ''),
    personalityB: String(row[1] ?? ''),
    compatibility: String(row[2] ?? ''),
  }))
}
