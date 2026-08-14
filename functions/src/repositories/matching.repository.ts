import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { buildPairKey } from '../utils/pairKey'
import { log } from '../utils/logger'
import { notFound, permissionDenied } from '../utils/errors'
import type { LikeResult } from '../types/matching'

const LIKES_COLLECTION = 'likes'
const MATCHES_COLLECTION = 'matches'
const CONVERSATIONS_COLLECTION = 'conversations'
const USERS_COLLECTION = 'users'

/** Records a real like and atomically creates a shared connection and its
 *  conversation. A like is an explicit invitation to talk: both members see
 *  the connection immediately and either member can start the conversation.
 *  This is the ONLY place a `matches`/`conversations` doc is ever created,
 *  and the ONLY writer of the `likes` collection. The client still cannot
 *  fabricate connections or conversations directly.
 *
 *  Idempotent: re-liking someone (duplicate call/retry) never double-writes
 *  the like doc, never recreates an existing match, and never double-counts
 *  `matchedIds`. */
export async function recordLike(likerUid: string, likedUid: string): Promise<LikeResult> {
  const db = getFirestore()
  const forwardRef = db.collection(LIKES_COLLECTION).doc(`${likerUid}_${likedUid}`)
  const matchId = buildPairKey(likerUid, likedUid)
  const matchRef = db.collection(MATCHES_COLLECTION).doc(matchId)
  const conversationRef = db.collection(CONVERSATIONS_COLLECTION).doc(matchId)
  const likerRef = db.collection(USERS_COLLECTION).doc(likerUid)
  const likedRef = db.collection(USERS_COLLECTION).doc(likedUid)

  return db.runTransaction(async (tx) => {
    const [forwardSnap, matchSnap, likerSnap, likedSnap] = await Promise.all([
      tx.get(forwardRef),
      tx.get(matchRef),
      tx.get(likerRef),
      tx.get(likedRef),
    ])

    if (!likerSnap.exists || !likedSnap.exists) {
      throw notFound('That profile is no longer available.')
    }

    const likerBlockedIds = likerSnap.get('blockedIds') as unknown
    const likedBlockedIds = likedSnap.get('blockedIds') as unknown
    const blockedEitherWay =
      (Array.isArray(likerBlockedIds) && likerBlockedIds.includes(likedUid)) ||
      (Array.isArray(likedBlockedIds) && likedBlockedIds.includes(likerUid))
    if (blockedEitherWay) {
      throw permissionDenied('That profile is not available.')
    }

    if (!forwardSnap.exists) {
      tx.set(forwardRef, { likerUid, likedUid, createdAt: FieldValue.serverTimestamp() })
      tx.update(likerRef, { likedIds: FieldValue.arrayUnion(likedUid) })
    }

    if (matchSnap.exists) {
      // Already matched (e.g. a retried call after the first succeeded) —
      // nothing left to create.
      return { matched: true, matchId }
    }

    const users = [likerUid, likedUid].sort()
    tx.set(matchRef, {
      id: matchId,
      users,
      initiatedBy: likerUid,
      createdAt: FieldValue.serverTimestamp(),
    })
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

    log.info('connection_created', { matchId })
    return { matched: true, matchId }
  })
}
