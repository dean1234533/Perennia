import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { resourceExhausted } from '../utils/errors'
import { log } from '../utils/logger'

/**
 * Fixed-window rate limiter backed by Firestore, keyed by caller uid.
 *
 * We use Firestore (not in-memory) because Cloud Functions scale out to
 * many concurrent instances with no shared memory — an in-memory counter
 * would let a caller get `maxRequests * instanceCount` calls through.
 * A transaction keeps the read-check-increment atomic under concurrent
 * calls from the same user.
 *
 * This collection is server-only, same as compatibilityMatrix — see
 * firestore.rules.
 */
const COLLECTION = 'rateLimits'

interface RateLimitDoc {
  windowStart: number
  count: number
}

export async function assertWithinRateLimit(
  uid: string,
  maxRequests: number,
  windowSeconds: number
): Promise<void> {
  const db = getFirestore()
  const ref = db.collection(COLLECTION).doc(uid)
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const allowed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.exists ? (snap.data() as RateLimitDoc) : undefined

    if (!data || now - data.windowStart >= windowMs) {
      tx.set(ref, { windowStart: now, count: 1, updatedAt: FieldValue.serverTimestamp() })
      return true
    }

    if (data.count >= maxRequests) {
      return false
    }

    tx.update(ref, { count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() })
    return true
  })

  if (!allowed) {
    log.warn('rate_limit_exceeded', { uid })
    throw resourceExhausted()
  }
}
