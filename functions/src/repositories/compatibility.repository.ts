import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type { CompatibilityRecord, PairKey } from '../types/compatibility'
import type { ParsedSheetRow } from '../validation/compatibility.validation'
import { buildPairKey } from '../utils/pairKey'
import { log } from '../utils/logger'

/**
 * Sole access point for the `compatibilityMatrix` collection.
 *
 * Firestore Security Rules deny ALL client reads/writes on this collection
 * (see firestore.rules) — the Admin SDK used here, running inside Cloud
 * Functions, bypasses those rules entirely, which is exactly why nothing
 * outside this module may touch the collection directly. If you need a
 * new access pattern, add a method here rather than reaching for
 * `getFirestore()` elsewhere.
 */
const COLLECTION = 'compatibilityMatrix'
const FIRESTORE_BATCH_LIMIT = 500

export async function getCompatibilityByPair(
  personalityA: string,
  personalityB: string
): Promise<number | undefined> {
  const pairKey = buildPairKey(personalityA, personalityB)
  const doc = await getFirestore().collection(COLLECTION).doc(pairKey).get()
  if (!doc.exists) return undefined
  const data = doc.data() as CompatibilityRecord
  return data.compatibility
}

/**
 * Upserts validated sheet rows in batches. Each row's document id is its
 * pairKey, so re-running the sync is idempotent — it updates existing
 * pairs in place rather than duplicating them.
 */
export async function upsertCompatibilityRows(rows: ParsedSheetRow[]): Promise<number> {
  const db = getFirestore()
  let written = 0

  for (let i = 0; i < rows.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = rows.slice(i, i + FIRESTORE_BATCH_LIMIT)
    const batch = db.batch()

    for (const row of chunk) {
      const pairKey: PairKey = buildPairKey(row.personalityA, row.personalityB)
      const ref = db.collection(COLLECTION).doc(pairKey)
      const record: Omit<CompatibilityRecord, 'updatedAt'> & { updatedAt: FieldValue } = {
        pairKey,
        personalityA: row.personalityA,
        personalityB: row.personalityB,
        compatibility: row.compatibility,
        source: 'google-sheets-sync',
        updatedAt: FieldValue.serverTimestamp(),
      }
      batch.set(ref, record, { merge: true })
    }

    await batch.commit()
    written += chunk.length
    log.info('compatibility_batch_written', { batchSize: chunk.length })
  }

  return written
}
