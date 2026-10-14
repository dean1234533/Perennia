import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import type { SafetySettings } from '@/lib/firestore'

const migratePrivateSafetyCallable = httpsCallable<Record<string, never>, SafetySettings>(functions, 'migratePrivateSafety')
const blockUserCallable = httpsCallable<{ targetUid: string }, { blocked: true }>(functions, 'blockUser')
const unblockUserCallable = httpsCallable<{ targetUid: string }, { unblocked: true }>(functions, 'unblockUser')
const reportUserCallable = httpsCallable<{ targetUid: string }, { reported: true }>(functions, 'reportUser')
const endConnectionCallable = httpsCallable<{ targetUid: string }, { ended: true }>(functions, 'endConnection')

export async function migratePrivateSafetyRemote() {
  return (await migratePrivateSafetyCallable({})).data
}

export async function blockProfileRemote(_uid: string, targetUid: string) {
  await blockUserCallable({ targetUid })
}

export async function unblockProfileRemote(_uid: string, targetUid: string) {
  await unblockUserCallable({ targetUid })
}

export async function reportProfileRemote(targetUid: string) {
  await reportUserCallable({ targetUid })
}

export async function endConnectionRemote(targetUid: string) {
  await endConnectionCallable({ targetUid })
}
