/**
 * Best-effort in-memory cache, scoped to a single warm function instance.
 *
 * This is NOT a distributed cache — Cloud Functions can and will spin up
 * multiple concurrent instances, each with its own copy, and a cold start
 * wipes it entirely. It exists purely to avoid redundant Firestore reads
 * within a burst of requests hitting the same warm instance (e.g. a user
 * re-checking the same pair, or retries). Never rely on it for
 * correctness — only for cost/latency.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

export function cacheClear(): void {
  store.clear()
}
