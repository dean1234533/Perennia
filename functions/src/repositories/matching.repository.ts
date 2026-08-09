import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { buildPairKey } from '../utils/pairKey'
import { log } from '../utils/logger'
import type { LikeResult } from '../types/matching'

const LIKES_COLLECTION = 'likes'
const MATCHES_COLLECTION = 'matches'
const CONVERSATIONS_COLLECTION = 'conversations'
const USERS_COLLECTION = 'users'

/** Records a real like and — only when the other person has genuinely
 *  already liked back — atomically creates a real match + its conversation.
 *  This is the ONLY place a `matches`/`conversations` doc is ever created,
 *  and the ONLY writer of the `likes` collection. A client can never fake a
 *  match: it has no way to read another user's `likedIds`, so reciprocity
 *  can only be established here, server-side, inside one transaction.
 *
 *  Idempotent: re-liking someone (duplicate call/retry) never double-writes
 *  the like doc, never recreates an existing match, and never double-counts
 *  `matchedIds`. */
export async function recordLike(likerUid: string, likedUid: string): Promise<LikeResult> {
  const db = getFirestore()
  const forwardRef = db.collection(LIKES_COLLECTION).doc(`${likerUid}_${likedUid}`)
  const reverseRef = db.collection(LIKES_COLLECTION).doc(`${likedUid}_${likerUid}`)
  const matchId = buildPairKey(likerUid, likedUid)
  const matchRef = db.collection(MATCHES_COLLECTION).doc(matchId)
  const conversationRef = db.collection(CONVERSATIONS_COLLECTION).doc(matchId)
  const likerRef = db.collection(USERS_COLLECTION).doc(likerUid)
  const likedRef = db.collection(USERS_COLLECTION).doc(likedUid)

  return db.runTransaction(async (tx) => {
    const [forwardSnap, reverseSnap, matchSnap] = await Promise.all([
      tx.get(forwardRef),
      tx.get(reverseRef),
      tx.get(matchRef),
    ])

    if (!forwardSnap.exists) {
      tx.set(forwardRef, { likerUid, likedUid, createdAt: FieldValue.serverTimestamp() })
      tx.update(likerRef, { likedIds: FieldValue.arrayUnion(likedUid) })
    }

    if (matchSnap.exists) {
      // Already matched (e.g. a retried call after the first succeeded) —
      // nothing left to create.
      return { matched: true, matchId }
    }

    if (!reverseSnap.exists) {
      // No reciprocal like yet — a real, ordinary "liked, waiting" state.
      return { matched: false, matchId: null }
    }

    const users = [likerUid, likedUid].sort()
    tx.set(matchRef, { id: matchId, users, createdAt: FieldValue.serverTimestamp() })
    tx.set(conversationRef, {
      matchId,
      participants: users,
      createdAt: FieldValue.serverTimestamp(),
      lastMessageAt: null,
      lastMessagePreview: null,
      lastMessageSenderId: null,
    })
    tx.update(likerRef, { matchedIds: FieldValue.arrayUnion(likedUid) })
    tx.update(likedRef, { matchedIds: FieldValue.arrayUnion(likerUid) })

    log.info('match_created', { matchId })
    return { matched: true, matchId }
  })
}
