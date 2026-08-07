import { z } from 'zod'

/**
 * A personality type code: four letters, one from each axis pair.
 * Adjust this pattern if the Fusion System's typing scheme differs from
 * standard 16-type codes (e.g. to allow x/X wildcards) — it's the single
 * source of truth for "is this a valid code" everywhere in the backend.
 */
const PERSONALITY_CODE_PATTERN = /^[EI][NS][TF][JP]$/

export const personalityCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => PERSONALITY_CODE_PATTERN.test(v), {
    message: 'Must be a 4-letter personality code, e.g. "ENTJ".',
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
