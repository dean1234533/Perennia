import { getFirestore } from 'firebase-admin/firestore'
import { DEFAULT_FOUNDING500_CONFIG, type Founding500Config, type FoundingMemberRecord, type MembershipTier, type PricingSnapshot } from '../types/founding500'
import { log } from '../utils/logger'

const CONFIG_DOC = 'config/founding500'
const MEMBERS_COLLECTION = 'foundingMembers'

export async function ensureConfigSeeded(): Promise<Founding500Config> {
  const ref = getFirestore().doc(CONFIG_DOC)
  const snap = await ref.get()
  if (snap.exists) return snap.data() as Founding500Config
  const seeded = { ...DEFAULT_FOUNDING500_CONFIG, updatedAt: new Date().toISOString() }
  await ref.set(seeded)
  log.info('founding500_config_seeded', { memberLimit: seeded.memberLimit })
  return seeded
}

export async function getConfig(): Promise<Founding500Config> {
  const snap = await getFirestore().doc(CONFIG_DOC).get()
  if (!snap.exists) return ensureConfigSeeded()
  return snap.data() as Founding500Config
}

export async function updateConfig(patch: Partial<Founding500Config>): Promise<Founding500Config> {
  const ref = getFirestore().doc(CONFIG_DOC)
  await ref.set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true })
  const snap = await ref.get()
  return snap.data() as Founding500Config
}

export async function getMemberRecord(uid: string): Promise<FoundingMemberRecord | null> {
  const snap = await getFirestore().collection(MEMBERS_COLLECTION).doc(uid).get()
  return snap.exists ? (snap.data() as FoundingMemberRecord) : null
}

export class Founding500FullError extends Error {}
export class Founding500DisabledError extends Error {}

/** Atomically assigns the next founding-member number and writes the
 *  confirmed record — the ONLY place `currentMemberCount` is ever
 *  incremented, and the ONLY writer of `foundingMembers/{uid}`. Idempotent:
 *  if this uid is already confirmed (e.g. a duplicate webhook delivery),
 *  returns the existing record instead of double-counting. */
export async function confirmFoundingMembership(params: {
  uid: string
  tier: MembershipTier
  stripeCustomerId: string
  stripeSubscriptionId: string
  pricing: PricingSnapshot
}): Promise<FoundingMemberRecord> {
  const db = getFirestore()
  const configRef = db.doc(CONFIG_DOC)
  const memberRef = db.collection(MEMBERS_COLLECTION).doc(params.uid)

  return db.runTransaction(async (tx) => {
    const [configSnap, memberSnap] = await Promise.all([tx.get(configRef), tx.get(memberRef)])

    if (memberSnap.exists) {
      // Already confirmed (duplicate webhook delivery) — return as-is, no re-increment.
      return memberSnap.data() as FoundingMemberRecord
    }

    const config = (configSnap.exists ? configSnap.data() : DEFAULT_FOUNDING500_CONFIG) as Founding500Config
    if (!config.enabled) throw new Founding500DisabledError('Founding 500 is not currently active.')
    if (config.currentMemberCount >= config.memberLimit) {
      throw new Founding500FullError('The Founding 500 is now full.')
    }

    const memberNumber = config.currentMemberCount + 1
    const record: FoundingMemberRecord = {
      uid: params.uid,
      memberNumber,
      tier: params.tier,
      status: 'confirmed',
      stripeCustomerId: params.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      pricing: params.pricing,
      confirmedAt: new Date().toISOString(),
    }

    tx.set(memberRef, record)
    tx.update(configRef, { currentMemberCount: memberNumber })

    return record
  })
}
