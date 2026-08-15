import { httpsCallable } from 'firebase/functions'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db, functions } from '@/lib/firebase'

export type FriendState = 'none' | 'outgoing' | 'incoming' | 'friends'

const sendCallable = httpsCallable<{ targetUid: string }, { sent: true }>(functions, 'sendFriendRequest')
const respondCallable = httpsCallable<{ targetUid: string; accept: boolean }, { updated: true }>(functions, 'respondToFriendRequest')
const unfriendCallable = httpsCallable<{ targetUid: string }, { removed: true }>(functions, 'unfriend')

function pairKey(a: string, b: string) { return [a, b].sort().join('_') }

export function subscribeFriendState(uid: string, otherUid: string, cb: (state: FriendState) => void) {
  const id = pairKey(uid, otherUid)
  let request: { senderUid?: string } | null = null
  let friendship = false
  const emit = () => cb(friendship ? 'friends' : request ? (request.senderUid === uid ? 'outgoing' : 'incoming') : 'none')
  const requestQuery = query(collection(db, 'friendRequests'), where('participants', 'array-contains', uid))
  const friendshipQuery = query(collection(db, 'friendships'), where('users', 'array-contains', uid))
  const unsubRequest = onSnapshot(requestQuery, (snap) => { request = snap.docs.find((item) => item.id === id)?.data() ?? null; emit() })
  const unsubFriendship = onSnapshot(friendshipQuery, (snap) => { friendship = snap.docs.some((item) => item.id === id); emit() })
  return () => { unsubRequest(); unsubFriendship() }
}

export async function sendFriendRequest(targetUid: string) { await sendCallable({ targetUid }) }
export async function respondToFriendRequest(targetUid: string, accept: boolean) { await respondCallable({ targetUid, accept }) }
export async function unfriend(targetUid: string) { await unfriendCallable({ targetUid }) }
