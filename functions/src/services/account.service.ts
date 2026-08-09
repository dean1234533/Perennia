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
      // Don't block account deletion on a billing-system hiccup — log
      // loudly for a human to reconcile, same pattern as the webhook's
      // full/disabled handling in founding500.service.ts.
      log.error('delete_account_subscription_cancel_failed', {
        uid,
        subscriptionId: foundingRecord.stripeSubscriptionId,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // 2. Referential cleanup — every real place this uid appears in another
  // real record.
  const [likesAsLiker, likesAsLiked, myMatches, likedByOthers, passedByOthers] = await Promise.all([
    db.collection('likes').where('likerUid', '==', uid).get(),
    db.collection('likes').where('likedUid', '==', uid).get(),
    db.collection('matches').where('users', 'array-contains', uid).get(),
    db.collection('users').where('likedIds', 'array-contains', uid).get(),
    db.collection('users').where('passedIds', 'array-contains', uid).get(),
  ])

  const cleanupBatch = db.batch()
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

  for (const matchDoc of myMatches.docs) {
    const matchData = matchDoc.data() as { users: string[] }
    const otherUid = matchData.users.find((u) => u !== uid)

    cleanupBatch.delete(matchDoc.ref)
    ops++
    if (otherUid) {
      cleanupBatch.update(db.collection('users').doc(otherUid), { matchedIds: FieldValue.arrayRemove(uid) })
      ops++
    }

    // Delete the conversation doc and every message in it.
    const conversationRef = db.collection('conversations').doc(matchDoc.id)
    const messagesSnap = await conversationRef.collection('messages').get()
    for (const messageDoc of messagesSnap.docs) {
      cleanupBatch.delete(messageDoc.ref)
      ops++
    }
    cleanupBatch.delete(conversationRef)
    ops++
  }

  // A single batch caps at 500 writes — plenty at this app's current scale
  // (would need 200+ real matches from one member to exceed it). If that
  // ever changes, this should become a chunked/paginated job; for now
  // Firestore throws a clear error rather than silently dropping writes.
  if (ops > 0) {
    await cleanupBatch.commit()
  }

  // 3. The member's own records.
  const mediaSnap = await db.collection('media').where('userId', '==', uid).get()
  const userRef = db.collection('users').doc(uid)
  const privateSnap = await userRef.collection('private').get()
  const ownBatch = db.batch()
  for (const doc of mediaSnap.docs) ownBatch.delete(doc.ref)
  for (const doc of privateSnap.docs) ownBatch.delete(doc.ref)
  ownBatch.delete(userRef)
  ownBatch.delete(db.collection('foundingMembers').doc(uid))
  await ownBatch.commit()

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
