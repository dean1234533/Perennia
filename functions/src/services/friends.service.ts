import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { buildPairKey } from '../utils/pairKey'
import { failedPrecondition, permissionDenied } from '../utils/errors'

export async function sendFriendRequest(senderUid: string, recipientUid: string): Promise<void> {
  const db = getFirestore()
  const id = buildPairKey(senderUid, recipientUid)
  const requestRef = db.collection('friendRequests').doc(id)
  const friendshipRef = db.collection('friendships').doc(id)
  const senderSafety = db.collection('users').doc(senderUid).collection('private').doc('safety')
  const recipientSafety = db.collection('users').doc(recipientUid).collection('private').doc('safety')

  await db.runTransaction(async (tx) => {
    const [request, friendship, senderSafetySnap, recipientSafetySnap] = await Promise.all([
      tx.get(requestRef), tx.get(friendshipRef), tx.get(senderSafety), tx.get(recipientSafety),
    ])
    if (friendship.exists) return
    const blocked = (senderSafetySnap.get('blockedIds') ?? []).includes(recipientUid) ||
      (recipientSafetySnap.get('blockedIds') ?? []).includes(senderUid)
    if (blocked) throw permissionDenied('That profile is not available.')
    if (request.exists) return
    tx.set(requestRef, {
      senderUid,
      recipientUid,
      participants: [senderUid, recipientUid].sort(),
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    })
  })
}

export async function respondToFriendRequest(recipientUid: string, otherUid: string, accept: boolean): Promise<void> {
  const db = getFirestore()
  const id = buildPairKey(recipientUid, otherUid)
  const requestRef = db.collection('friendRequests').doc(id)
  const friendshipRef = db.collection('friendships').doc(id)
  await db.runTransaction(async (tx) => {
    const request = await tx.get(requestRef)
    if (!request.exists || request.get('recipientUid') !== recipientUid) throw failedPrecondition('This friend request is no longer available.')
    if (accept) {
      tx.set(friendshipRef, { users: [recipientUid, otherUid].sort(), createdAt: FieldValue.serverTimestamp() })
    }
    tx.delete(requestRef)
  })
}

export async function unfriend(uid: string, otherUid: string): Promise<void> {
  await getFirestore().collection('friendships').doc(buildPairKey(uid, otherUid)).delete()
}
