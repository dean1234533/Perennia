/**
 * Builds the canonical, order-independent lookup key for a pair of
 * values (signs, animals, elements, polarities — anything). Sorting
 * means "ARIES"+"LEO" and "LEO"+"ARIES" both resolve to "ARIES_LEO" —
 * callers never need to know which order the sheet/importer used.
 */
export function buildPairKey(a: string, b: string): string {
  return [a, b].sort().join('_')
}
