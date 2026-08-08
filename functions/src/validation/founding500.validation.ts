import { z } from 'zod'

export const createFoundingCheckoutInputSchema = z.object({
  tier: z.enum(['essential', 'premium']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export type CreateFoundingCheckoutInput = z.infer<typeof createFoundingCheckoutInputSchema>

export const updateFounding500ConfigInputSchema = z
  .object({
    enabled: z.boolean().optional(),
    memberLimit: z.number().int().positive().optional(),
    promoPeriodMonths: z.number().int().positive().optional(),
    currency: z.string().length(3).optional(),
    essential: z
      .object({ introPrice: z.number().nonnegative(), year1Price: z.number().nonnegative(), futurePrice: z.number().nonnegative() })
      .optional(),
    premium: z
      .object({ introPrice: z.number().nonnegative(), year1Price: z.number().nonnegative(), futurePrice: z.number().nonnegative() })
      .optional(),
  })
  .strict()

export type UpdateFounding500ConfigInput = z.infer<typeof updateFounding500ConfigInputSchema>
