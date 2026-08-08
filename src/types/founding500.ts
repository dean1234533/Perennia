export type MembershipTier = 'essential' | 'premium'

export interface TierPricing {
  introPrice: number
  year1Price: number
  futurePrice: number
}

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

export interface FoundingMemberRecord {
  uid: string
  memberNumber: number
  tier: MembershipTier
  status: 'confirmed'
  stripeCustomerId: string
  stripeSubscriptionId: string
  pricing: PricingSnapshot
  confirmedAt: string
}
