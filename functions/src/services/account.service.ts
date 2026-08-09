import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { getAuth } from 'firebase-admin/auth'
import { log } from '../utils/logger'

/** Real account deletion — removes the member's own Firestore doc, all
 *  their uploaded media (docs + real Storage files), their Founding 500
 *  membership record, and the Firebase Auth account itself. Not a
 *  client-side sign-out pretending to be a deletion.
 *
 *  Scoped deliberately: does not attempt to scrub this uid out of other
 *  members' matchedIds arrays or shared matches/conversations docs (that's
 *  a larger referential-integrity project), and does not cancel any active
 *  Stripe subscription (billing cancellation is a separate, explicit flow
 *  a member should confirm, not something silently triggered by account
 *  deletion). Both are flagged here rather than silently assumed done. */
export async function deleteAccount(uid: string): Promise<void> {
  const db = getFirestore()
  const bucket = getStorage().bucket()

  const mediaSnap = await db.collection('media').where('userId', '==', uid).get()
  const batch = db.batch()
  for (const doc of mediaSnap.docs) batch.delete(doc.ref)
  batch.delete(db.collection('users').doc(uid))
  batch.delete(db.collection('foundingMembers').doc(uid))
  await batch.commit()

  try {
    await bucket.deleteFiles({ prefix: `users/${uid}/` })
  } catch (err) {
    log.warn('delete_account_storage_cleanup_failed', { uid, message: err instanceof Error ? err.message : String(err) })
  }

  await getAuth().deleteUser(uid)
  log.info('account_deleted', { uid })
}
