import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/**
 * Client bridge for turning a like into a real shared connection.
 *
 * This is the ONLY sanctioned way to like someone — it calls the `likeUser`
 * Cloud Function, which atomically records the like and creates the match +
 * conversation immediately. The client has no direct write access to
 * `likes`/`matches` (see firestore.rules), so it cannot fake a connection.
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
