import type { CompatibilityResult } from '@/lib/compatibilityApi'
import type { DiscoveryCandidate } from '@/lib/firestore'

export const DISCOVERY_SEARCH_RADII = [5, 10, 25, 50] as const
export type DiscoverySearchRadiusMiles = (typeof DISCOVERY_SEARCH_RADII)[number]

export interface ResolvedDiscoveryArea {
  label: string
  lat: number
  lon: number
}

type PrivateLocationFields =
  | 'birthPlace'
  | 'birthPlaceLat'
  | 'birthPlaceLon'
  | 'currentLocationLat'
  | 'currentLocationLon'
  | 'email'
  | 'phone'

/**
 * Area-search results must be sanitised by the server. Exact member
 * coordinates, birth coordinates, addresses and direct contact details are
 * deliberately unavailable to this UI boundary.
 */
export type SafeAreaDiscoveryCandidate = Omit<DiscoveryCandidate, PrivateLocationFields> & {
  birthPlace: ''
  birthPlaceLat: null
  birthPlaceLon: null
  currentLocationLat: null
  currentLocationLon: null
  email: ''
  phone: ''
}

export interface DiscoveryAreaSearchItem {
  candidate: SafeAreaDiscoveryCandidate
  distanceMiles: number
  compatibility: CompatibilityResult | null
  /** Server-owned classification. The frontend does not define a threshold. */
  meetsHighCompatibility: boolean
}

export interface DiscoveryAreaSearchRequest {
  area: ResolvedDiscoveryArea
  radiusMiles: DiscoverySearchRadiusMiles
  highCompatibilityOnly: boolean
}

export interface DiscoveryAreaSearchResult {
  area: ResolvedDiscoveryArea
  radiusMiles: DiscoverySearchRadiusMiles
  items: DiscoveryAreaSearchItem[]
}

export type ResolveDiscoveryArea = (query: string) => Promise<ResolvedDiscoveryArea>
export type SearchDiscoveryArea = (request: DiscoveryAreaSearchRequest) => Promise<DiscoveryAreaSearchResult>

export class DiscoveryAreaSearchUnavailableError extends Error {
  constructor() {
    super('Search Area candidate querying is not available yet. Please return to All Matches.')
    this.name = 'DiscoveryAreaSearchUnavailableError'
  }
}

/**
 * Integration boundary for Dean: production implementation must authenticate
 * the viewer and enforce radius, eligibility, bilateral blocks, visibility,
 * Premium entitlement and High Compatibility classification server-side.
 * It must return only sanitised public profile data and coarse distance.
 */
export async function searchDiscoveryAreaCandidates(
  _request: DiscoveryAreaSearchRequest,
): Promise<DiscoveryAreaSearchResult> {
  throw new DiscoveryAreaSearchUnavailableError()
}
