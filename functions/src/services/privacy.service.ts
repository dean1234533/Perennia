import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { buildPairKey } from '../utils/pairKey'

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
  const batch = db.batch()

  batch.set(db.collection('users').doc(uid).collection('private').doc('safety'), {
    blockedIds: FieldValue.arrayUnion(targetUid),
  }, { merge: true })
  batch.delete(db.collection('likes').doc(`${uid}_${targetUid}`))
  batch.delete(db.collection('likes').doc(`${targetUid}_${uid}`))
  batch.delete(db.collection('matches').doc(pairKey))
  batch.delete(db.collection('connections').doc(pairKey))
  batch.delete(conversationRef)
  for (const message of messages.docs) batch.delete(message.ref)
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
  await getFirestore().collection('reports').add({
    reporterUid,
    targetUid,
    category: 'other-misconduct',
    status: 'submitted',
    createdAt: FieldValue.serverTimestamp(),
  })
}
