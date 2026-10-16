import { collection, onSnapshot, query, where, type Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/**
 * A gift one member has asked to send another. Documents live in
 * `giftRequests/{id}` and are created only by the server (Admin SDK) once the
 * gifting service exists — the client can read the ones it is part of and
 * can never create or edit them (see firestore.rules). Until that service is
 * built there are none, and the Gifts screen shows an honest empty state.
 */
export type GiftRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface GiftRequest {
  id: string
  senderUid: string
  recipientUid: string
  status: GiftRequestStatus
  /** What is being sent, e.g. "Afternoon tea for two". */
  offeringTitle: string
  /** Optional note from the sender. */
  message?: string
  createdAt: Timestamp | null
  expiresAt: Timestamp | null
}

/** Live list of gift requests addressed to `uid`, newest first. */
export function subscribeGiftRequestsForRecipient(
  uid: string,
  cb: (requests: GiftRequest[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(collection(db, 'giftRequests'), where('recipientUid', '==', uid))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ ...(d.data() as Omit<GiftRequest, 'id'>), id: d.id }))
    items.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
    cb(items)
  }, onError)
}
