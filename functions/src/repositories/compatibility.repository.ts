import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type {
  FusionTable, InsightBucket, ScoreTier, YinYangTier,
} from '../types/compatibility'
import type { ParsedInsightBucketRow } from '../validation/compatibility.validation'
import { buildPairKey } from '../utils/pairKey'
import { log } from '../utils/logger'

/**
 * Sole access point for every Fusion System collection in Firestore.
 *
 * Firestore Security Rules deny ALL client reads/writes on every
 * `fusion*` collection (see firestore.rules) — the Admin SDK used here,
 * running inside Cloud Functions, bypasses those rules entirely, which
 * is exactly why nothing outside this module may touch them directly.
 */

const SCORE_COLLECTIONS: Record<FusionTable, string> = {
  sun: 'fusionSunScores',
  moon: 'fusionMoonScores',
  rising: 'fusionRisingScores',
  animal: 'fusionAnimalScores',
  element: 'fusionElementScores',
  yinYang: 'fusionYinYangScores',
}

const INSIGHTS_LIBRARY_COLLECTION = 'fusionInsightsLibrary'
const FACTOR_INSIGHTS_COLLECTION = 'fusionFactorInsights'
const FIRESTORE_BATCH_LIMIT = 500

// --- Pairwise sub-score tables (sun/moon/rising/animal/element/yinYang) ---

export async function getScore(
  table: FusionTable,
  valueA: string,
  valueB: string
): Promise<number | undefined> {
  const pairKey = buildPairKey(valueA, valueB)
  const doc = await getFirestore().collection(SCORE_COLLECTIONS[table]).doc(pairKey).get()
  if (!doc.exists) return undefined
  return (doc.data() as { score: number }).score
}

export async function upsertScores(
  table: FusionTable,
  rows: { valueA: string; valueB: string; score: number }[]
): Promise<number> {
  const db = getFirestore()
  const collectionName = SCORE_COLLECTIONS[table]
  let written = 0

  for (let i = 0; i < rows.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = rows.slice(i, i + FIRESTORE_BATCH_LIMIT)
    const batch = db.batch()

    for (const row of chunk) {
      const pairKey = buildPairKey(row.valueA, row.valueB)
      const ref = db.collection(collectionName).doc(pairKey)
      batch.set(
        ref,
        {
          pairKey,
          valueA: row.valueA,
          valueB: row.valueB,
          score: row.score,
          source: 'google-sheets-sync',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    await batch.commit()
    written += chunk.length
  }

  log.info('fusion_scores_written', { table, count: written })
  return written
}

// --- Overall insights library (keyed by final-score bucket) --------------

let insightBucketsCache: InsightBucket[] | null = null

/**
 * All 20 buckets, read once per warm instance. Buckets are irregular
 * width (one is 6 wide, the rest 5 — see types/compatibility.ts), so we
 * find the matching one with a simple linear scan rather than trying to
 * compute it arithmetically.
 */
export async function getInsightBucketForScore(score: number): Promise<InsightBucket | undefined> {
  if (!insightBucketsCache) {
    const snap = await getFirestore().collection(INSIGHTS_LIBRARY_COLLECTION).get()
    insightBucketsCache = snap.docs.map((d) => d.data() as InsightBucket)
  }
  return insightBucketsCache.find((b) => score >= b.minScore && score <= b.maxScore)
}

export async function upsertInsightBuckets(rows: ParsedInsightBucketRow[]): Promise<number> {
  const db = getFirestore()
  const batch = db.batch()

  for (const row of rows) {
    const bucketId = `${row.minScore}-${row.maxScore}`
    const ref = db.collection(INSIGHTS_LIBRARY_COLLECTION).doc(bucketId)
    batch.set(
      ref,
      {
        bucketId,
        ...row,
        source: 'google-sheets-sync',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  }

  await batch.commit()
  insightBucketsCache = null // invalidate — next read picks up the fresh data
  log.info('insight_buckets_written', { count: rows.length })
  return rows.length
}

// --- Per-factor tiered insights ------------------------------------------

export async function getFactorInsight(
  table: FusionTable,
  tier: ScoreTier | YinYangTier
): Promise<string | undefined> {
  const docId = `${table}_${tier}`
  const doc = await getFirestore().collection(FACTOR_INSIGHTS_COLLECTION).doc(docId).get()
  if (!doc.exists) return undefined
  return (doc.data() as { text: string }).text
}

export async function upsertFactorInsights(
  table: FusionTable,
  rows: { tier: string; text: string }[]
): Promise<number> {
  const db = getFirestore()
  const batch = db.batch()

  for (const row of rows) {
    const docId = `${table}_${row.tier}`
    const ref = db.collection(FACTOR_INSIGHTS_COLLECTION).doc(docId)
    batch.set(
      ref,
      {
        table,
        tier: row.tier,
        text: row.text,
        source: 'google-sheets-sync',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  }

  await batch.commit()
  log.info('factor_insights_written', { table, count: rows.length })
  return rows.length
}
