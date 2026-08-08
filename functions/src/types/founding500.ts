export type MembershipTier = 'essential' | 'premium'

export interface TierPricing {
  /** Price per month for the first `promoPeriodMonths` months. */
  introPrice: number
  /** Price per month for the remainder of year 1. */
  year1Price: number
  /** Price per month once the founding-member introductory period ends. */
  futurePrice: number
}

/** Admin-editable, single source of truth for Founding 500 pricing and
 *  availability. Lives at Firestore `config/founding500` — read openly
 *  (the pricing page is public), written only via the Admin SDK / callables
 *  below, never directly by clients. */
export interface Founding500Config {
  enabled: boolean
  memberLimit: number
  currentMemberCount: number
  promoPeriodMonths: number
  currency: string
  essential: TierPricing
  premium: TierPricing
  updatedAt: string
}

export interface PricingSnapshot extends TierPricing {
  currency: string
  promoPeriodMonths: number
}

export type FoundingMemberStatus = 'confirmed'

/** Firestore `foundingMembers/{uid}` — the ONLY source of truth for whether
 *  someone is a real Founding 500 member. Written exclusively by the
 *  post-payment webhook; never client-writable. */
export interface FoundingMemberRecord {
  uid: string
  memberNumber: number
  tier: MembershipTier
  status: FoundingMemberStatus
  stripeCustomerId: string
  stripeSubscriptionId: string
  pricing: PricingSnapshot
  confirmedAt: string
}

export const DEFAULT_FOUNDING500_CONFIG: Founding500Config = {
  enabled: true,
  memberLimit: 500,
  currentMemberCount: 0,
  promoPeriodMonths: 3,
  currency: 'gbp',
  essential: { introPrice: 3.99, year1Price: 7.99, futurePrice: 12.99 },
  premium: { introPrice: 7.99, year1Price: 9.99, futurePrice: 17.99 },
  updatedAt: new Date(0).toISOString(),
}
