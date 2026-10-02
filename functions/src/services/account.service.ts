import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { getAuth } from 'firebase-admin/auth'
import { log } from '../utils/logger'
import { getMemberRecord } from '../repositories/founding500.repository'
import { cancelFoundingSubscription } from './founding500.service'

/** Real account deletion. Removes:
 *   - the member's own Firestore doc, uploaded media (docs + Storage files)
 *   - their Founding 500 membership record, after actually canceling any
 *     active Stripe subscription (not just deleting the local record)
 *   - the Firebase Auth account itself
 *   - every real reference to this uid elsewhere: their likes, their
 *     matches (+ each match's conversation + all its messages), and their
 *     uid scrubbed from every OTHER member's likedIds/passedIds/matchedIds
 *     arrays — so a deleted member doesn't linger as a stray id in someone
 *     else's data.
 *
 *  Deliberately does NOT touch other members' own docs beyond that array
 *  scrub, and never deletes anything not owned by or referencing this uid. */
export async function deleteAccount(uid: string, stripeSecretKey: string): Promise<void> {
  const db = getFirestore()
  const bucket = getStorage().bucket()

  // 1. Cancel any active Stripe subscription BEFORE deleting the local
  // record — otherwise there'd be no way to look up the subscription id
  // afterward, and the member would keep being billed for a deleted account.
  const foundingRecord = await getMemberRecord(uid)
  if (foundingRecord?.stripeSubscriptionId) {
    try {
      await cancelFoundingSubscription(foundingRecord.stripeSubscriptionId, stripeSecretKey)
    } catch (err) {
      // Stop here rather than delete the account: once the member's record
      // and Auth account are gone there is no way to find or cancel the
      // subscription, and they would keep being billed. The member can
      // simply retry; nothing has been deleted yet.
      log.error('delete_account_subscription_cancel_failed', {
        uid,
        subscriptionId: foundingRecord.stripeSubscriptionId,
        message: err instanceof Error ? err.message : String(err),
      })
      throw new Error('Could not cancel your subscription, so your account was not deleted. Please try again in a moment.')
    }
  }

  // 2. Referential cleanup — every real place this uid appears in another
  // real record.
  const [likesAsLiker, likesAsLiked, myMatches, myConnections, likedByOthers, passedByOthers, friendRequests, friendships, reports] = await Promise.all([
    db.collection('likes').where('likerUid', '==', uid).get(),
    db.collection('likes').where('likedUid', '==', uid).get(),
    db.collection('matches').where('users', 'array-contains', uid).get(),
    db.collection('connections').where('users', 'array-contains', uid).get(),
    db.collection('users').where('likedIds', 'array-contains', uid).get(),
    db.collection('users').where('passedIds', 'array-contains', uid).get(),
    db.collection('friendRequests').where('participants', 'array-contains', uid).get(),
    db.collection('friendships').where('users', 'array-contains', uid).get(),
    db.collection('reports').where('reporterUid', '==', uid).get(),
  ])

  // Firestore caps a batch at 500 writes, so operations are queued and
  // committed in chunks (an account with many matches/messages would
  // otherwise fail partway through deletion).
  type Op = (batch: FirebaseFirestore.WriteBatch) => void
  const queued: Op[] = []
  const cleanupBatch = {
    delete: (ref: FirebaseFirestore.DocumentReference) => { queued.push((b) => b.delete(ref)) },
    update: (ref: FirebaseFirestore.DocumentReference, data: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>) => { queued.push((b) => b.update(ref, data)) },
  }
  let ops = 0

  for (const doc of likesAsLiker.docs) {
    cleanupBatch.delete(doc.ref)
    ops++
  }
  for (const doc of likesAsLiked.docs) {
    cleanupBatch.delete(doc.ref)
    ops++
  }
  for (const doc of likedByOthers.docs) {
    cleanupBatch.update(doc.ref, { likedIds: FieldValue.arrayRemove(uid) })
    ops++
  }
  for (const doc of passedByOthers.docs) {
    cleanupBatch.update(doc.ref, { passedIds: FieldValue.arrayRemove(uid) })
    ops++
  }
  for (const doc of friendRequests.docs) { cleanupBatch.delete(doc.ref); ops++ }
  for (const doc of friendships.docs) { cleanupBatch.delete(doc.ref); ops++ }
  for (const doc of reports.docs) { cleanupBatch.delete(doc.ref); ops++ }

  for (const matchDoc of myMatches.docs) {
    const matchData = matchDoc.data() as { users: string[] }
    const otherUid = matchData.users.find((u) => u !== uid)

    cleanupBatch.delete(matchDoc.ref)
    ops++
    if (otherUid) {
      cleanupBatch.update(db.collection('users').doc(otherUid), { matchedIds: FieldValue.arrayRemove(uid) })
      ops++
    }

  }

  for (const connectionDoc of myConnections.docs) {
    cleanupBatch.delete(connectionDoc.ref)
    ops++
    const conversationRef = db.collection('conversations').doc(connectionDoc.id)
    const messagesSnap = await conversationRef.collection('messages').get()
    for (const messageDoc of messagesSnap.docs) {
      cleanupBatch.delete(messageDoc.ref)
      ops++
    }
    cleanupBatch.delete(conversationRef)
    ops++
  }

  for (let i = 0; i < queued.length; i += 400) {
    const batch = db.batch()
    for (const op of queued.slice(i, i + 400)) op(batch)
    await batch.commit()
  }

  // 3. The member's own records.
  const mediaSnap = await db.collection('media').where('userId', '==', uid).get()
  const userRef = db.collection('users').doc(uid)
  const privateSnap = await userRef.collection('private').get()
  const ownRefs: FirebaseFirestore.DocumentReference[] = [
    ...mediaSnap.docs.map((d) => d.ref),
    ...privateSnap.docs.map((d) => d.ref),
  ]
  // The member's own doc and membership record go last so a failure partway
  // through leaves a retryable account rather than orphaned media.
  ownRefs.push(userRef, db.collection('publicProfiles').doc(uid), db.collection('foundingMembers').doc(uid))
  for (let i = 0; i < ownRefs.length; i += 400) {
    const batch = db.batch()
    for (const ref of ownRefs.slice(i, i + 400)) batch.delete(ref)
    await batch.commit()
  }

  // 4. Real Storage files.
  try {
    await bucket.deleteFiles({ prefix: `users/${uid}/` })
  } catch (err) {
    log.warn('delete_account_storage_cleanup_failed', { uid, message: err instanceof Error ? err.message : String(err) })
  }

  // 5. The Firebase Auth account itself.
  await getAuth().deleteUser(uid)
  log.info('account_deleted', { uid, referentialOps: ops })
}
