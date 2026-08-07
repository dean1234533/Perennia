import { google, sheets_v4 } from 'googleapis'
import { normalizePrivateKey } from '../config/env'
import { log } from '../utils/logger'
import type { FusionTable } from '../types/compatibility'

/**
 * Reads the private Google Sheet via a service account (read-only scope).
 *
 * The service account must be shared as a Viewer on the target sheet —
 * see functions/README.md. Credentials are pulled from Secret Manager
 * params (config/env.ts) and passed in memory only; never written to
 * disk or logged.
 *
 * IMPORTANT — layout assumption: the Western/Chinese zodiac tabs are
 * human-formatted, not a clean one-row-per-record table. Each sub-table
 * (Sun, Moon, Rising, Animal, Element, Yin/Yang) is laid out as repeating
 * blocks: a header/section row, then N data rows shaped "SignA + SignB"
 * | score | rule-applied-text, then a blank separator row, repeated per
 * base sign/animal. Rather than assume exact row offsets (fragile if a
 * row gets inserted or a block resized), `scanPairBlock` below scans
 * every row of a given column range and pulls out only the rows that
 * match the "A + B" pattern with both sides being known-valid values —
 * header rows and blanks are simply skipped because they don't match.
 *
 * The column ranges (B:D / F:H / J:L) were read directly off screenshots
 * of the real sheet. If your layout differs, adjust the ranges passed
 * into fetchWesternZodiacTables / fetchChineseZodiacTables below.
 */

const READONLY_SCOPE = ['https://www.googleapis.com/auth/spreadsheets.readonly']

export interface RawPairRow {
  valueA: string
  valueB: string
  score: string
}

export interface RawInsightRow {
  minScore: string
  maxScore: string
  understanding: string
  emotionalConnection: string
  communication: string
  relationshipGrowth: string
  challenges: string
  longTermPotential: string
}

interface SheetAuthParams {
  clientEmail: string
  privateKey: string
  sheetId: string
}

function buildSheetsClient(params: SheetAuthParams): sheets_v4.Sheets {
  const auth = new google.auth.JWT({
    email: params.clientEmail,
    key: normalizePrivateKey(params.privateKey),
    scopes: READONLY_SCOPE,
  })
  return google.sheets({ version: 'v4', auth })
}

async function getRawValues(
  client: sheets_v4.Sheets,
  sheetId: string,
  range: string
): Promise<string[][]> {
  const response = await client.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  return (response.data.values ?? []).map((row) => row.map((cell) => String(cell ?? '')))
}

const PAIR_PATTERN = /^\s*([A-Za-z]+)\s*\+\s*([A-Za-z]+)/

/**
 * Scans a fetched range for rows shaped "A + B" | score, where col 0 is
 * the label and col 1 is the score. Rows that don't match the pattern,
 * or where either captured token isn't in `validValues`, are skipped —
 * this is what makes header rows ("Aries + Signs = Sun") and blank
 * separator rows harmless without needing to know exact row offsets.
 */
function scanPairBlock(rows: string[][], validValues: Set<string>): RawPairRow[] {
  const results: RawPairRow[] = []

  for (const row of rows) {
    const label = row[0]
    const score = row[1]
    if (!label || score === undefined || score === '') continue

    const match = PAIR_PATTERN.exec(label)
    if (!match) continue

    const valueA = match[1].toUpperCase()
    const valueB = match[2].toUpperCase()
    if (!validValues.has(valueA) || !validValues.has(valueB)) continue

    results.push({ valueA, valueB, score })
  }

  return results
}

export async function fetchPairTable(
  authParams: SheetAuthParams,
  range: string,
  validValues: Set<string>
): Promise<RawPairRow[]> {
  const client = buildSheetsClient(authParams)
  const rows = await getRawValues(client, authParams.sheetId, range)
  const parsed = scanPairBlock(rows, validValues)
  log.info('sheet_pair_table_scanned', { range, rowsFound: parsed.length })
  return parsed
}

const BUCKET_PATTERN = /^\s*(\d{1,3})\s*-\s*(\d{1,3})\s*$/

/**
 * Scans the insights library for bucket rows. Finds the header row
 * dynamically by locating the six known category names (rather than
 * assuming fixed columns), then reads each subsequent "NN-NN" bucket
 * row using those discovered column indices.
 */
export async function fetchInsightsTable(
  authParams: SheetAuthParams,
  range: string
): Promise<RawInsightRow[]> {
  const client = buildSheetsClient(authParams)
  const rows = await getRawValues(client, authParams.sheetId, range)

  const categoryHeaders: Record<string, string> = {
    understanding: 'understanding',
    'emotional connection': 'emotionalConnection',
    communication: 'communication',
    'relationship growth': 'relationshipGrowth',
    challenges: 'challenges',
    'long term potential': 'longTermPotential',
  }

  let columnMap: Partial<Record<string, number>> | null = null
  let bucketColumn = -1

  for (const row of rows) {
    const found: Partial<Record<string, number>> = {}
    row.forEach((cell, colIndex) => {
      const key = categoryHeaders[cell.trim().toLowerCase()]
      if (key) found[key] = colIndex
    })
    if (Object.keys(found).length >= 4) {
      // Found the header row — bucket range lives in the first column of the range.
      columnMap = found
      bucketColumn = 0
      break
    }
  }

  if (!columnMap) {
    log.error('insights_header_not_found', { range })
    return []
  }

  const results: RawInsightRow[] = []
  for (const row of rows) {
    const bucketCell = row[bucketColumn]
    if (!bucketCell) continue
    const match = BUCKET_PATTERN.exec(bucketCell)
    if (!match) continue

    const get = (key: string) => {
      const col = columnMap![key]
      return col === undefined ? '' : (row[col] ?? '')
    }

    results.push({
      minScore: match[1],
      maxScore: match[2],
      understanding: get('understanding'),
      emotionalConnection: get('emotionalConnection'),
      communication: get('communication'),
      relationshipGrowth: get('relationshipGrowth'),
      challenges: get('challenges'),
      longTermPotential: get('longTermPotential'),
    })
  }

  log.info('sheet_insights_table_scanned', { range, rowsFound: results.length })
  return results
}

export interface RawFactorInsightRow {
  tier: string
  text: string
}

/** Column header text -> which fusion table it belongs to. Matched loosely
 *  (substring, case-insensitive) since exact wording varies. */
const FACTOR_COLUMN_HINTS: [string, FusionTable][] = [
  ['animal', 'animal'],
  ['heavenly', 'element'],
  ['stem', 'element'],
  ['yin', 'yinYang'],
  ['sun', 'sun'],
  ['moon', 'moon'],
  ['rising', 'rising'],
]

const SCORE_TIER_WORDS = new Set(['LOW', 'MEDIUM', 'HIGH'])
const YIN_YANG_TIER_WORDS = new Set(['COMPLEMENTARY', 'SIMILAR'])

/**
 * Reads the per-factor insights grid: six factor columns side by side on
 * one tab (e.g. "Compatibility Insights"), each shaped as repeating
 * vertical pairs of [tier label row] then [narrative text row directly
 * below it], e.g.:
 *
 *   Animal Insights | Heavenly stem Insights | Yin/Yang Insights | ...
 *   High             | High                    | Complementary     | ...
 *   "Your energies…" | "You share…"            | "Your energies…"  | ...
 *   Medium           | Medium                  | Similar           | ...
 *   "There's a…"     | "There's a…"            | "Shared traits…"  | ...
 *
 * The header row is found dynamically (matching known factor-name
 * fragments), then each column is scanned top-to-bottom independently:
 * whenever a cell's text matches a valid tier keyword for that column's
 * kind, the very next row's cell in the same column is taken as that
 * tier's narrative. This doesn't care about blank spacer rows between
 * tier blocks, or how many tiers each column has.
 */
export async function fetchFactorInsightsGrid(
  authParams: SheetAuthParams,
  range: string
): Promise<Partial<Record<FusionTable, RawFactorInsightRow[]>>> {
  const client = buildSheetsClient(authParams)
  const rows = await getRawValues(client, authParams.sheetId, range)

  // Find the header row: the first row where at least 3 cells match a known factor hint.
  let headerRowIndex = -1
  let columnTables: (FusionTable | undefined)[] = []

  for (let r = 0; r < rows.length; r++) {
    const candidate = rows[r].map((cell) => {
      const lower = cell.trim().toLowerCase()
      const hit = FACTOR_COLUMN_HINTS.find(([hint]) => lower.includes(hint))
      return hit?.[1]
    })
    const matchCount = candidate.filter(Boolean).length
    if (matchCount >= 3) {
      headerRowIndex = r
      columnTables = candidate
      break
    }
  }

  if (headerRowIndex === -1) {
    log.error('factor_insights_header_not_found', { range })
    return {}
  }

  const results: Partial<Record<FusionTable, RawFactorInsightRow[]>> = {}

  for (let col = 0; col < columnTables.length; col++) {
    const table = columnTables[col]
    if (!table) continue

    const validTiers = table === 'yinYang' ? YIN_YANG_TIER_WORDS : SCORE_TIER_WORDS
    const found: RawFactorInsightRow[] = []

    for (let r = headerRowIndex + 1; r < rows.length - 1; r++) {
      const cell = (rows[r]?.[col] ?? '').trim()
      if (!cell) continue
      const upper = cell.toUpperCase()
      if (!validTiers.has(upper)) continue

      const text = (rows[r + 1]?.[col] ?? '').trim()
      if (!text) continue

      found.push({ tier: cell, text })
    }

    results[table] = found
  }

  log.info('factor_insights_grid_scanned', {
    range,
    perTable: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.length])),
  })
  return results
}
