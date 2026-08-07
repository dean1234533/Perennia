import type { PairKey, PersonalityCode } from '../types/compatibility'

/**
 * Builds the canonical, order-independent lookup key for a pair of
 * personality codes. Sorting means "ENTJ"+"INTP" and "INTP"+"ENTJ" both
 * resolve to "ENTJ_INTP" — callers never need to know which order the
 * sheet/importer used.
 */
export function buildPairKey(a: PersonalityCode, b: PersonalityCode): PairKey {
  return [a, b].sort().join('_')
}
