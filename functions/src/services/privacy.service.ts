import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { buildPairKey } from '../utils/pairKey'
import { failedPrecondition } from '../utils/errors'

export interface PrivateSafetyState {
  safeMode: boolean
  blockedIds: string[]
  mutedIds: string[]
}

export async function migratePrivateSafety(uid: string): Promise<PrivateSafetyState> {
  const db = getFirestore()
  const userRef = db.collection('users').doc(uid)
  const safetyRef = userRef.collection('private').doc('safety')

  return db.runTransaction(async (tx) => {
    const [userSnap, safetySnap] = await Promise.all([tx.get(userRef), tx.get(safetyRef)])
    const user = userSnap.data() ?? {}
    const safety = safetySnap.data() ?? {}
    const blockedIds = [...new Set([...(safety.blockedIds ?? []), ...(user.blockedIds ?? [])])]
    const mutedIds = [...new Set([...(safety.mutedIds ?? []), ...(user.mutedIds ?? [])])]
    const safeMode = Boolean(safety.safeMode ?? user.safeMode ?? false)

    tx.set(safetyRef, { safeMode, blockedIds, mutedIds }, { merge: true })
    if ('blockedIds' in user || 'mutedIds' in user || 'safeMode' in user) {
      tx.update(userRef, {
        blockedIds: FieldValue.delete(),
        mutedIds: FieldValue.delete(),
        safeMode: FieldValue.delete(),
      })
    }
    return { safeMode, blockedIds, mutedIds }
  })
}

export async function blockUser(uid: string, targetUid: string): Promise<void> {
  const db = getFirestore()
  const pairKey = buildPairKey(uid, targetUid)
  const conversationRef = db.collection('conversations').doc(pairKey)
  const messages = await conversationRef.collection('messages').get()
  // Chunked: a batch caps at 500 writes and a long chat can exceed that.
  for (let i = 0; i < messages.docs.length; i += 400) {
    const chunk = db.batch()
    for (const message of messages.docs.slice(i, i + 400)) chunk.delete(message.ref)
    await chunk.commit()
  }
  const batch = db.batch()

  batch.set(db.collection('users').doc(uid).collection('private').doc('safety'), {
    blockedIds: FieldValue.arrayUnion(targetUid),
  }, { merge: true })
  batch.delete(db.collection('likes').doc(`${uid}_${targetUid}`))
  batch.delete(db.collection('likes').doc(`${targetUid}_${uid}`))
  batch.delete(db.collection('matches').doc(pairKey))
  batch.delete(db.collection('connections').doc(pairKey))
  batch.delete(conversationRef)
  batch.update(db.collection('users').doc(uid), { matchedIds: FieldValue.arrayRemove(targetUid) })
  batch.update(db.collection('users').doc(targetUid), { matchedIds: FieldValue.arrayRemove(uid) })
  await batch.commit()
}

/** Ends an existing connection without blocking either member. Shared likes,
 * match, connection and conversation data are removed so both members return
 * to an unconnected state. */
export async function endConnection(uid: string, targetUid: string): Promise<void> {
  const db = getFirestore()
  const pairKey = buildPairKey(uid, targetUid)
  const connectionRef = db.collection('connections').doc(pairKey)
  const conversationRef = db.collection('conversations').doc(pairKey)
  const [connection, messages] = await Promise.all([
    connectionRef.get(),
    conversationRef.collection('messages').get(),
  ])
  const users = connection.get('users') as unknown
  if (!connection.exists || !Array.isArray(users) || !users.includes(uid) || !users.includes(targetUid)) {
    throw failedPrecondition('That connection is no longer available.')
  }
  // Firestore batches cap at 500 writes, so a long chat is deleted in chunks
  // first; the connection record itself goes last so a failure part-way
  // leaves a retryable state rather than orphaned messages.
  for (let i = 0; i < messages.docs.length; i += 400) {
    const chunk = db.batch()
    for (const message of messages.docs.slice(i, i + 400)) chunk.delete(message.ref)
    await chunk.commit()
  }
  const batch = db.batch()

  batch.delete(db.collection('likes').doc(`${uid}_${targetUid}`))
  batch.delete(db.collection('likes').doc(`${targetUid}_${uid}`))
  batch.delete(db.collection('matches').doc(pairKey))
  batch.delete(connectionRef)
  batch.delete(conversationRef)
  batch.update(db.collection('users').doc(uid), { matchedIds: FieldValue.arrayRemove(targetUid) })
  batch.update(db.collection('users').doc(targetUid), { matchedIds: FieldValue.arrayRemove(uid) })
  await batch.commit()
}

export async function unblockUser(uid: string, targetUid: string): Promise<void> {
  await getFirestore().collection('users').doc(uid).collection('private').doc('safety').set({
    blockedIds: FieldValue.arrayRemove(targetUid),
  }, { merge: true })
}

export async function reportUser(reporterUid: string, targetUid: string): Promise<void> {
  // One open report per reporter/target pair — repeat taps shouldn't create
  // duplicate moderation work.
  const existing = await getFirestore().collection('reports')
    .where('reporterUid', '==', reporterUid)
    .where('targetUid', '==', targetUid)
    .where('status', '==', 'submitted')
    .limit(1)
    .get()
  if (!existing.empty) return
  await getFirestore().collection('reports').add({
    reporterUid,
    targetUid,
    category: 'other-misconduct',
    status: 'submitted',
    createdAt: FieldValue.serverTimestamp(),
  })
}
