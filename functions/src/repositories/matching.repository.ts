import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { buildPairKey } from '../utils/pairKey'
import { log } from '../utils/logger'
import { notFound, permissionDenied } from '../utils/errors'
import type { LikeResult } from '../types/matching'

const LIKES_COLLECTION = 'likes'
const MATCHES_COLLECTION = 'matches'
const CONNECTIONS_COLLECTION = 'connections'
const CONVERSATIONS_COLLECTION = 'conversations'
const USERS_COLLECTION = 'users'

/** Records a real like and opens a shared introduction conversation. The
 *  connection is promoted to a Match only after a reciprocal like.
 *
 *  Idempotent: re-liking someone (duplicate call/retry) never double-writes
 *  the like doc, connection, conversation, or reciprocal match. */
export async function recordLike(likerUid: string, likedUid: string): Promise<LikeResult> {
  const db = getFirestore()
  const forwardRef = db.collection(LIKES_COLLECTION).doc(`${likerUid}_${likedUid}`)
  const reverseRef = db.collection(LIKES_COLLECTION).doc(`${likedUid}_${likerUid}`)
  const matchId = buildPairKey(likerUid, likedUid)
  const matchRef = db.collection(MATCHES_COLLECTION).doc(matchId)
  const connectionRef = db.collection(CONNECTIONS_COLLECTION).doc(matchId)
  const conversationRef = db.collection(CONVERSATIONS_COLLECTION).doc(matchId)
  const likerRef = db.collection(USERS_COLLECTION).doc(likerUid)
  const likedRef = db.collection(USERS_COLLECTION).doc(likedUid)
  const likerSafetyRef = likerRef.collection('private').doc('safety')
  const likedSafetyRef = likedRef.collection('private').doc('safety')

  return db.runTransaction(async (tx) => {
    const [forwardSnap, reverseSnap, matchSnap, connectionSnap, likerSnap, likedSnap, likerSafetySnap, likedSafetySnap] = await Promise.all([
      tx.get(forwardRef),
      tx.get(reverseRef),
      tx.get(matchRef),
      tx.get(connectionRef),
      tx.get(likerRef),
      tx.get(likedRef),
      tx.get(likerSafetyRef),
      tx.get(likedSafetyRef),
    ])

    if (!likerSnap.exists || !likedSnap.exists) {
      throw notFound('That profile is no longer available.')
    }

    const likerBlockedIds = (likerSafetySnap.get('blockedIds') ?? likerSnap.get('blockedIds')) as unknown
    const likedBlockedIds = (likedSafetySnap.get('blockedIds') ?? likedSnap.get('blockedIds')) as unknown
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
      return { matched: true, matchId, conversationId: matchId }
    }

    const users = [likerUid, likedUid].sort()
    if (!connectionSnap.exists) {
      tx.set(connectionRef, {
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
    }

    if (!reverseSnap.exists) {
      log.info('introduction_created', { conversationId: matchId })
      return { matched: false, matchId: null, conversationId: matchId }
    }

    tx.set(matchRef, {
      id: matchId,
      users,
      initiatedBy: likerUid,
      createdAt: FieldValue.serverTimestamp(),
    })
    tx.update(likerRef, { matchedIds: FieldValue.arrayUnion(likedUid) })
    tx.update(likedRef, { matchedIds: FieldValue.arrayUnion(likerUid) })

    log.info('match_created', { matchId })
    return { matched: true, matchId, conversationId: matchId }
  })
}
