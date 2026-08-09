import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/**
 * Client bridge to real mutual-like matching.
 *
 * This is the ONLY sanctioned way to like someone — it calls the `likeUser`
 * Cloud Function, which atomically records the like and, only when the
 * other person has genuinely already liked back, creates a real match +
 * conversation. The client has no direct write access to `likes`/`matches`
 * (see firestore.rules) and can never read another user's likes, so there
 * is no way to fake reciprocity from here.
 */

export interface LikeUserResult {
  matched: boolean
  matchId: string | null
}

const likeUserCallable = httpsCallable<{ targetUid: string }, LikeUserResult>(functions, 'likeUser')

export async function likeUser(targetUid: string): Promise<LikeUserResult> {
  const result: HttpsCallableResult<LikeUserResult> = await likeUserCallable({ targetUid })
  return result.data
}
