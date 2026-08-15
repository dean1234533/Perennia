import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/**
 * Client bridge for recording a like and opening an introduction.
 *
 * This is the ONLY sanctioned way to like someone — it calls the `likeUser`
 * Cloud Function, which opens a conversation immediately. A reciprocal like
 * promotes that connection to a Match. The client has no direct write access
 * to `likes`/`matches` (see firestore.rules).
 */

export interface LikeUserResult {
  matched: boolean
  matchId: string | null
  conversationId: string
}

const likeUserCallable = httpsCallable<{ targetUid: string }, LikeUserResult>(functions, 'likeUser')

export async function likeUser(targetUid: string): Promise<LikeUserResult> {
  const result: HttpsCallableResult<LikeUserResult> = await likeUserCallable({ targetUid })
  return result.data
}
