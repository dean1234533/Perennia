import { z } from 'zod'

/** Origins Stripe is allowed to send a member back to after checkout or the
 *  billing portal. Without this check a caller could pass any URL and use
 *  Perennia's Stripe session as an open redirect to a phishing page. Extra
 *  origins (e.g. a custom domain) can be added via the comma-separated
 *  ALLOWED_RETURN_ORIGINS environment variable, no code change needed. */
const BUILT_IN_ORIGINS = [
  'https://perennia-coral.vercel.app',
  'https://perennia-deans-projects-30127c36.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
]
// Per-deployment preview URLs for this Vercel project.
const VERCEL_PROJECT_ORIGIN = /^https:\/\/perennia-[a-z0-9-]+-deans-projects-30127c36\.vercel\.app$/

export function isAllowedReturnUrl(value: string): boolean {
  let origin: string
  try {
    origin = new URL(value).origin
  } catch {
    return false
  }
  const extra = (process.env.ALLOWED_RETURN_ORIGINS ?? '')
    .split(',')
    .map((entry) => entry.trim().replace(/\/$/, ''))
    .filter(Boolean)
  return BUILT_IN_ORIGINS.includes(origin) || extra.includes(origin) || VERCEL_PROJECT_ORIGIN.test(origin)
}

const returnUrl = z.string().url().refine(isAllowedReturnUrl, { message: 'Return URL is not an allowed origin' })

export const createFoundingCheckoutInputSchema = z.object({
  tier: z.enum(['essential', 'premium']),
  successUrl: returnUrl,
  cancelUrl: returnUrl,
})

export type CreateFoundingCheckoutInput = z.infer<typeof createFoundingCheckoutInputSchema>

export const createBillingPortalInputSchema = z.object({
  returnUrl,
})

export type CreateBillingPortalInput = z.infer<typeof createBillingPortalInputSchema>

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
