import { z } from 'zod'

/**
 * The 12 Western zodiac signs. This is the single source of truth for
 * "is this a valid personality code" everywhere in the backend — update
 * this set if the Fusion System's typing scheme changes (e.g. to add
 * Chinese zodiac or a combined fusion code).
 */
const ZODIAC_SIGNS = new Set([
  'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
  'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
])

export const personalityCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => ZODIAC_SIGNS.has(v), {
    message: 'Must be a valid Western zodiac sign, e.g. "Aries".',
  })

/** Input contract for the getCompatibility callable. */
export const getCompatibilityInputSchema = z.object({
  personalityA: personalityCodeSchema,
  personalityB: personalityCodeSchema,
})

export type GetCompatibilityParsedInput = z.infer<typeof getCompatibilityInputSchema>

/**
 * A single raw row from the Google Sheet, before it becomes a
 * CompatibilityRecord. Coerces the score column from sheet-string to
 * number and bounds it to a sane percentage range.
 */
export const sheetRowSchema = z.object({
  personalityA: personalityCodeSchema,
  personalityB: personalityCodeSchema,
  compatibility: z.coerce.number().int().min(0).max(100),
})

export type ParsedSheetRow = z.infer<typeof sheetRowSchema>
