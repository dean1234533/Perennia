import { z } from 'zod'

export const likeUserInputSchema = z.object({
  targetUid: z.string().min(1),
})

export type LikeUserInput = z.infer<typeof likeUserInputSchema>
