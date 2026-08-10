import { z } from 'zod'

export const verifyBirthDetailsOtpInputSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'code must be a 6-digit number'),
})

export type VerifyBirthDetailsOtpInput = z.infer<typeof verifyBirthDetailsOtpInputSchema>

/**
 * Exactly the birth-detail fields this edit flow is allowed to change.
 * Deliberately excludes birthDate — DOB comes from identity verification
 * and must never be editable through this path, even via a direct call.
 */
export const updateBirthDetailsInputSchema = z
  .object({
    birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'birthTime must be HH:MM').optional(),
    birthTimeUnknown: z.boolean(),
    birthCountry: z.string().length(2, 'birthCountry must be a 2-letter code'),
    birthCity: z.string().trim().min(1, 'birthCity is required'),
    birthPlaceLat: z.number().nullable(),
    birthPlaceLon: z.number().nullable(),
    sunSign: z.string().trim().min(1),
    moonSign: z.string().trim().min(1),
    risingSign: z.string().trim().min(1),
    chineseAnimal: z.string().trim().min(1),
    chineseElement: z.string().trim().min(1),
    yinYang: z.string().trim().min(1),
  })
  .refine((data) => data.birthTimeUnknown || !!data.birthTime, {
    message: 'birthTime is required unless birthTimeUnknown is true',
    path: ['birthTime'],
  })

export type UpdateBirthDetailsInput = z.infer<typeof updateBirthDetailsInputSchema>
