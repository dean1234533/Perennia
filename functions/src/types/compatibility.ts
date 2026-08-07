/**
 * Domain types for the Perennia Compatibility Fusion System.
 *
 * The real system is a weighted fusion of six independent lookup tables
 * (three Western zodiac factors, three Chinese zodiac factors), reduced
 * to a single 0-100 score:
 *
 *   final = sun*0.20 + moon*0.20 + rising*0.10
 *         + animal*0.20 + element*0.15 + yinYang*0.15
 *
 * That final score selects a row of six narrative texts (Understanding,
 * Emotional Connection, Communication, Relationship Growth, Challenges,
 * Long Term Potential) from an "insights library" keyed by score range,
 * AND a qualitative band (Excellent/Very Good/Good/Challenging/Difficult).
 *
 * Independently, each of the six sub-scores ALSO has its own short
 * narrative, selected from a small tiered table for that factor (three
 * tiers — low/medium/high — for the five score-based factors, or two —
 * complementary/similar — for Yin/Yang, since that one is inherently
 * binary rather than a continuous score).
 *
 * Nothing here — or anywhere downstream — ever hands a caller more than
 * one resolved CompatibilityResult. All the underlying tables exist only
 * to describe what lives in Firestore/Sheets; none is ever serialized
 * whole into a function response.
 */

export type WesternSign =
  | 'ARIES' | 'TAURUS' | 'GEMINI' | 'CANCER' | 'LEO' | 'VIRGO'
  | 'LIBRA' | 'SCORPIO' | 'SAGITTARIUS' | 'CAPRICORN' | 'AQUARIUS' | 'PISCES'

export type ChineseAnimal =
  | 'RAT' | 'OX' | 'TIGER' | 'RABBIT' | 'DRAGON' | 'SNAKE'
  | 'HORSE' | 'SHEEP' | 'MONKEY' | 'ROOSTER' | 'DOG' | 'PIG'

export type ChineseElement = 'WATER' | 'METAL' | 'WOOD' | 'EARTH' | 'FIRE'

export type YinYang = 'YIN' | 'YANG'

/** The six sub-score tables that get fused into one final percentage. */
export type FusionTable = 'sun' | 'moon' | 'rising' | 'animal' | 'element' | 'yinYang'

/** Weight each table contributes to the final 0-100 score. Must sum to 1. */
export const FUSION_WEIGHTS: Record<FusionTable, number> = {
  sun: 0.20,
  moon: 0.20,
  rising: 0.10,
  animal: 0.20,
  element: 0.15,
  yinYang: 0.15,
}

/** Score-based tiers for sun/moon/rising/animal/element. */
export type ScoreTier = 'LOW' | 'MEDIUM' | 'HIGH'

/** Yin/Yang has no continuous score — it's binary: opposite polarity or same. */
export type YinYangTier = 'COMPLEMENTARY' | 'SIMILAR'

/**
 * ASSUMPTION, not read from the sheet: the cutoffs for low/medium/high on
 * a single factor's own 0-100 score. Adjust here if the real thresholds
 * differ once we can verify against the sheet.
 */
export const SCORE_TIER_THRESHOLDS = { lowMax: 49, mediumMax: 79 } as const

export function scoreToTier(score: number): ScoreTier {
  if (score <= SCORE_TIER_THRESHOLDS.lowMax) return 'LOW'
  if (score <= SCORE_TIER_THRESHOLDS.mediumMax) return 'MEDIUM'
  return 'HIGH'
}

/**
 * The overall qualitative band for the final fused score — from the
 * "Compatibility Guide" legend in the product's own mockup, not the
 * sheet. Fixed, not sheet-driven.
 */
export const COMPATIBILITY_BANDS = [
  { min: 90, max: 100, label: 'Excellent' },
  { min: 75, max: 89, label: 'Very Good' },
  { min: 50, max: 74, label: 'Good' },
  { min: 25, max: 49, label: 'Challenging' },
  { min: 0, max: 24, label: 'Difficult' },
] as const

export function scoreToBandLabel(score: number): string {
  return COMPATIBILITY_BANDS.find((b) => score >= b.min && score <= b.max)?.label ?? 'Unrated'
}

/** One row of a pairwise sub-score table (e.g. "ARIES"+"LEO" -> 97), as stored in Firestore. */
export interface PairScoreRecord {
  pairKey: string
  valueA: string
  valueB: string
  score: number
  updatedAt: FirebaseFirestore.Timestamp
  source: 'google-sheets-sync'
}

/** A person's birth-derived inputs — everything needed to resolve their side of a pairing. */
export interface PersonBirthProfile {
  sunSign: WesternSign
  moonSign: WesternSign
  risingSign: WesternSign
  chineseAnimal: ChineseAnimal
  chineseElement: ChineseElement
  yinYang: YinYang
}

/** One row of the overall insights library: a score range plus six narrative texts. */
export interface InsightBucket {
  bucketId: string // e.g. "90-95"
  minScore: number
  maxScore: number
  understanding: string
  emotionalConnection: string
  communication: string
  relationshipGrowth: string
  challenges: string
  longTermPotential: string
  updatedAt: FirebaseFirestore.Timestamp
  source: 'google-sheets-sync'
}

/** One row of a per-factor tiered insight table, e.g. "Sun Sign Insights" / HIGH -> text. */
export interface FactorInsightRecord {
  table: FusionTable
  tier: ScoreTier | YinYangTier
  text: string
  updatedAt: FirebaseFirestore.Timestamp
  source: 'google-sheets-sync'
}

/** Per-factor detail included in the result — score, tier, and its short blurb. */
export interface FactorResult {
  score: number
  tier: ScoreTier | YinYangTier
  insight: string
}

/** The only shape ever returned to the client for a compatibility check. */
export interface CompatibilityResult {
  compatibility: number
  band: string
  factors: {
    sun: FactorResult
    moon: FactorResult
    rising: FactorResult
    animal: FactorResult
    element: FactorResult
    yinYang: FactorResult
  }
  insights: {
    understanding: string
    emotionalConnection: string
    communication: string
    relationshipGrowth: string
    challenges: string
    longTermPotential: string
  }
}

/** Input contract for the getCompatibility callable function. */
export interface GetCompatibilityInput {
  personA: PersonBirthProfile
  personB: PersonBirthProfile
}

/** Result summary returned by a sync run. No row data included — counts only. */
export interface SyncSummary {
  tables: Record<FusionTable, { rowsRead: number; rowsImported: number }>
  factorInsights: Record<FusionTable, { rowsRead: number; rowsImported: number }>
  insightsLibrary: { rowsRead: number; rowsImported: number }
  errors: string[]
  durationMs: number
}
