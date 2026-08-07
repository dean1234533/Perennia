import type { PairKey, PersonalityCode } from '../types/compatibility'

/**
 * Builds the canonical, order-independent lookup key for a pair of
 * personality codes. Sorting means "ARIES"+"LEO" and "LEO"+"ARIES" both
 * resolve to "ARIES_LEO" — callers never need to know which order the
 * sheet/importer used.
 */
export function buildPairKey(a: PersonalityCode, b: PersonalityCode): PairKey {
  return [a, b].sort().join('_')
}
