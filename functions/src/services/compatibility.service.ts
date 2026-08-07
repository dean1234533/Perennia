import type { ZodTypeAny } from 'zod'
import * as repo from '../repositories/compatibility.repository'
import { fetchPairTable, fetchInsightsTable, fetchFactorInsightsGrid } from './googleSheets.service'
import { cacheGet, cacheSet } from './cache.service'
import { buildPairKey } from '../utils/pairKey'
import {
  pairScoreRowSchema, insightBucketRowSchema, factorInsightRowSchema,
  westernSignSchema, chineseAnimalSchema, chineseElementSchema, yinYangSchema,
} from '../validation/compatibility.validation'
import type { GetCompatibilityParsedInput, ParsedInsightBucketRow } from '../validation/compatibility.validation'
import {
  FUSION_WEIGHTS, scoreToTier, scoreToBandLabel,
} from '../types/compatibility'
import type {
  CompatibilityResult, SyncSummary, FusionTable, FactorResult, ScoreTier, YinYangTier,
} from '../types/compatibility'
import { notFound } from '../utils/errors'
import { log } from '../utils/logger'

const FUSION_TABLES: FusionTable[] = ['sun', 'moon', 'rising', 'animal', 'element', 'yinYang']

const EMPTY_INSIGHTS = {
  understanding: '', emotionalConnection: '', communication: '',
  relationshipGrowth: '', challenges: '', longTermPotential: '',
}

/**
 * Resolves the two values to compare for a given table, from each
 * person's birth profile.
 */
function pickValues(table: FusionTable, person: GetCompatibilityParsedInput['personA']): string {
  switch (table) {
    case 'sun': return person.sunSign
    case 'moon': return person.moonSign
    case 'rising': return person.risingSign
    case 'animal': return person.chineseAnimal
    case 'element': return person.chineseElement
    case 'yinYang': return person.yinYang
  }
}

/**
 * Resolves a full CompatibilityResult for a validated pair of birth
 * profiles.
 *
 * The final `compatibility` number is a strict lookup — if any of the
 * six sub-score tables is missing a pair, we fail loudly (notFound)
 * rather than silently guessing, since that number is the one thing this
 * whole system exists to get right. The narrative texts (per-factor
 * blurbs + the overall insights-library paragraphs) are treated as
 * enrichment: if a tier or bucket's text hasn't been synced yet, we
 * degrade to an empty string for that field and log a warning, rather
 * than blocking the numeric result on incomplete narrative content.
 */
export async function resolveCompatibility(
  input: GetCompatibilityParsedInput,
  cacheTtlSeconds: number
): Promise<CompatibilityResult> {
  const cacheKey = [
    buildPairKey(input.personA.sunSign, input.personB.sunSign),
    buildPairKey(input.personA.moonSign, input.personB.moonSign),
    buildPairKey(input.personA.risingSign, input.personB.risingSign),
    buildPairKey(input.personA.chineseAnimal, input.personB.chineseAnimal),
    buildPairKey(input.personA.chineseElement, input.personB.chineseElement),
    buildPairKey(input.personA.yinYang, input.personB.yinYang),
  ].join('|')

  const cached = cacheGet<CompatibilityResult>(cacheKey)
  if (cached) return cached

  const scores = await Promise.all(
    FUSION_TABLES.map(async (table) => {
      const valueA = pickValues(table, input.personA)
      const valueB = pickValues(table, input.personB)
      const score = await repo.getScore(table, valueA, valueB)
      return { table, valueA, valueB, score }
    })
  )

  const missing = scores.filter((s) => s.score === undefined)
  if (missing.length > 0) {
    log.warn('fusion_score_missing', { tables: missing.map((m) => m.table) })
    throw notFound('No compatibility data for that combination yet.')
  }

  let weightedTotal = 0
  for (const s of scores) {
    weightedTotal += (s.score as number) * FUSION_WEIGHTS[s.table]
  }
  const compatibility = Math.round(weightedTotal)

  const factorEntries = await Promise.all(
    scores.map(async ({ table, valueA, valueB, score }): Promise<[FusionTable, FactorResult]> => {
      const tier: ScoreTier | YinYangTier =
        table === 'yinYang' ? (valueA === valueB ? 'SIMILAR' : 'COMPLEMENTARY') : scoreToTier(score as number)
      const insight = (await repo.getFactorInsight(table, tier)) ?? ''
      if (!insight) log.warn('factor_insight_missing', { table, tier })
      return [table, { score: score as number, tier, insight }]
    })
  )
  const factors = Object.fromEntries(factorEntries) as CompatibilityResult['factors']

  const bucket = await repo.getInsightBucketForScore(compatibility)
  if (!bucket) log.warn('insight_bucket_missing', { compatibility })

  const result: CompatibilityResult = {
    compatibility,
    band: scoreToBandLabel(compatibility),
    factors,
    insights: bucket
      ? {
          understanding: bucket.understanding,
          emotionalConnection: bucket.emotionalConnection,
          communication: bucket.communication,
          relationshipGrowth: bucket.relationshipGrowth,
          challenges: bucket.challenges,
          longTermPotential: bucket.longTermPotential,
        }
      : EMPTY_INSIGHTS,
  }

  cacheSet(cacheKey, result, cacheTtlSeconds)
  return result
}

// ---------------------------------------------------------------------------
// Sync: sheet -> validated rows -> Firestore, for all 13 sources.
// ---------------------------------------------------------------------------

interface SheetAuthParams {
  clientEmail: string
  privateKey: string
  sheetId: string
}

const VALUE_SCHEMAS: Record<FusionTable, ZodTypeAny> = {
  sun: westernSignSchema,
  moon: westernSignSchema,
  rising: westernSignSchema,
  animal: chineseAnimalSchema,
  element: chineseElementSchema,
  yinYang: yinYangSchema,
}

const FACTOR_INSIGHT_KIND: Record<FusionTable, 'score' | 'yinYang'> = {
  sun: 'score', moon: 'score', rising: 'score', animal: 'score', element: 'score', yinYang: 'yinYang',
}

export async function syncCompatibilityFromSheet(params: {
  auth: SheetAuthParams
  scoreRanges: Record<FusionTable, string>
  factorInsightsRange: string
  insightsLibraryRange: string
}): Promise<SyncSummary> {
  const startedAt = Date.now()
  const errors: string[] = []

  const tables: SyncSummary['tables'] = {} as SyncSummary['tables']
  const factorInsights: SyncSummary['factorInsights'] = {} as SyncSummary['factorInsights']

  for (const table of FUSION_TABLES) {
    try {
      const raw = await fetchPairTable(params.auth, params.scoreRanges[table], VALID_VALUES[table])
      const schema = pairScoreRowSchema(VALUE_SCHEMAS[table])
      const valid: { valueA: string; valueB: string; score: number }[] = []
      raw.forEach((row, i) => {
        const parsed = schema.safeParse(row)
        if (parsed.success) valid.push(parsed.data as { valueA: string; valueB: string; score: number })
        else errors.push(`[${table}] row ${i + 1}: ${parsed.error.issues.map((iss) => iss.message).join('; ')}`)
      })
      const rowsImported = valid.length > 0 ? await repo.upsertScores(table, valid) : 0
      tables[table] = { rowsRead: raw.length, rowsImported }
    } catch (err) {
      errors.push(`[${table}] fetch/sync failed: ${err instanceof Error ? err.message : String(err)}`)
      tables[table] = { rowsRead: 0, rowsImported: 0 }
    }
  }

  try {
    const grid = await fetchFactorInsightsGrid(params.auth, params.factorInsightsRange)
    for (const table of FUSION_TABLES) {
      const raw = grid[table] ?? []
      const schema = factorInsightRowSchema(FACTOR_INSIGHT_KIND[table])
      const valid: { tier: string; text: string }[] = []
      raw.forEach((row, i) => {
        const parsed = schema.safeParse(row)
        if (parsed.success) valid.push(parsed.data)
        else errors.push(`[${table} insights] row ${i + 1}: ${parsed.error.issues.map((iss) => iss.message).join('; ')}`)
      })
      const rowsImported = valid.length > 0 ? await repo.upsertFactorInsights(table, valid) : 0
      factorInsights[table] = { rowsRead: raw.length, rowsImported }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    for (const table of FUSION_TABLES) {
      errors.push(`[${table} insights] fetch/sync failed: ${message}`)
      factorInsights[table] = { rowsRead: 0, rowsImported: 0 }
    }
  }

  let insightsLibrary: SyncSummary['insightsLibrary'] = { rowsRead: 0, rowsImported: 0 }
  try {
    const raw = await fetchInsightsTable(params.auth, params.insightsLibraryRange)
    const valid: ParsedInsightBucketRow[] = []
    raw.forEach((row, i) => {
      const parsed = insightBucketRowSchema.safeParse(row)
      if (parsed.success) valid.push(parsed.data)
      else errors.push(`[insights library] row ${i + 1}: ${parsed.error.issues.map((iss) => iss.message).join('; ')}`)
    })
    const rowsImported = valid.length > 0 ? await repo.upsertInsightBuckets(valid) : 0
    insightsLibrary = { rowsRead: raw.length, rowsImported }
  } catch (err) {
    errors.push(`[insights library] fetch/sync failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  const summary: SyncSummary = {
    tables,
    factorInsights,
    insightsLibrary,
    errors,
    durationMs: Date.now() - startedAt,
  }

  log.info('fusion_sync_complete', {
    tables: Object.fromEntries(FUSION_TABLES.map((t) => [t, tables[t]?.rowsImported ?? 0])),
    insightsLibraryImported: insightsLibrary.rowsImported,
    errorCount: errors.length,
    durationMs: summary.durationMs,
  })

  return summary
}

const VALID_VALUES: Record<FusionTable, Set<string>> = {
  sun: new Set([
    'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
    'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
  ]),
  moon: new Set([
    'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
    'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
  ]),
  rising: new Set([
    'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
    'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
  ]),
  animal: new Set([
    'RAT', 'OX', 'TIGER', 'RABBIT', 'DRAGON', 'SNAKE',
    'HORSE', 'SHEEP', 'MONKEY', 'ROOSTER', 'DOG', 'PIG',
  ]),
  element: new Set(['WATER', 'METAL', 'WOOD', 'EARTH', 'FIRE']),
  yinYang: new Set(['YIN', 'YANG', 'YING']), // sheet spelling variant tolerated at the scan stage
}
