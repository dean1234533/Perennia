import { z } from 'zod'

/**
 * Valid-value sets for each axis of the Fusion System. These are the
 * single source of truth for "is this a valid X" everywhere in the
 * backend — update here if the sheet's vocabulary changes.
 */
const WESTERN_SIGNS = new Set([
  'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
  'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
])

const CHINESE_ANIMALS = new Set([
  'RAT', 'OX', 'TIGER', 'RABBIT', 'DRAGON', 'SNAKE',
  'HORSE', 'SHEEP', 'MONKEY', 'ROOSTER', 'DOG', 'PIG',
])

const CHINESE_ELEMENTS = new Set(['WATER', 'METAL', 'WOOD', 'EARTH', 'FIRE'])

/**
 * The sheet spells this "Ying" in places (Ying+Yang, Ying+Ying) — normalize
 * that spelling to the canonical "YIN" before validating, so a sheet typo
 * doesn't turn into a broken lookup key.
 */
function normalizeYinYang(raw: string): string {
  const upper = raw.trim().toUpperCase()
  return upper === 'YING' ? 'YIN' : upper
}

export const westernSignSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => WESTERN_SIGNS.has(v), { message: 'Must be a valid Western zodiac sign, e.g. "Aries".' })

export const chineseAnimalSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => CHINESE_ANIMALS.has(v), { message: 'Must be a valid Chinese zodiac animal, e.g. "Rat".' })

export const chineseElementSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => CHINESE_ELEMENTS.has(v), { message: 'Must be a valid Chinese element, e.g. "Water".' })

export const yinYangSchema = z
  .string()
  .transform(normalizeYinYang)
  .refine((v) => v === 'YIN' || v === 'YANG', { message: 'Must be "Yin" or "Yang".' })

/** A full birth profile, as sent by the client for one side of a pairing. */
export const personBirthProfileSchema = z.object({
  sunSign: westernSignSchema,
  moonSign: westernSignSchema,
  risingSign: westernSignSchema,
  chineseAnimal: chineseAnimalSchema,
  chineseElement: chineseElementSchema,
  yinYang: yinYangSchema,
})

export type ParsedPersonBirthProfile = z.infer<typeof personBirthProfileSchema>

/** Input contract for the getCompatibility callable. */
export const getCompatibilityInputSchema = z.object({
  personA: personBirthProfileSchema,
  personB: personBirthProfileSchema,
})

export type GetCompatibilityParsedInput = z.infer<typeof getCompatibilityInputSchema>

/**
 * A single "A + B -> score" row scraped from one of the six sub-score
 * tables in the sheet. `valueA`/`valueB` are validated against the given
 * set (Western signs, animals, or elements/polarity) by the caller.
 */
export function pairScoreRowSchema(valueSchema: z.ZodTypeAny) {
  return z.object({
    valueA: valueSchema,
    valueB: valueSchema,
    score: z.coerce.number().min(0).max(100),
  })
}

/** One row of the insights library: a "min-max" bucket plus six texts. */
export const insightBucketRowSchema = z.object({
  minScore: z.coerce.number().int().min(0).max(100),
  maxScore: z.coerce.number().int().min(0).max(100),
  understanding: z.string().trim().min(1),
  emotionalConnection: z.string().trim().min(1),
  communication: z.string().trim().min(1),
  relationshipGrowth: z.string().trim().min(1),
  challenges: z.string().trim().min(1),
  longTermPotential: z.string().trim().min(1),
})

export type ParsedInsightBucketRow = z.infer<typeof insightBucketRowSchema>

const SCORE_TIERS = new Set(['LOW', 'MEDIUM', 'HIGH'])
const YIN_YANG_TIERS = new Set(['COMPLEMENTARY', 'SIMILAR'])

/**
 * A single tier row from a per-factor insight table, e.g. "Sun Sign
 * Insights": tier label (Low/Medium/High, or Complementary/Similar for
 * Yin/Yang) plus its narrative text.
 */
export function factorInsightRowSchema(kind: 'score' | 'yinYang') {
  const validTiers = kind === 'score' ? SCORE_TIERS : YIN_YANG_TIERS
  return z.object({
    tier: z
      .string()
      .trim()
      .toUpperCase()
      .refine((v) => validTiers.has(v), {
        message: kind === 'score' ? 'Must be Low, Medium, or High.' : 'Must be Complementary or Similar.',
      }),
    text: z.string().trim().min(1),
  })
}

export type ParsedFactorInsightRow = z.infer<ReturnType<typeof factorInsightRowSchema>>
