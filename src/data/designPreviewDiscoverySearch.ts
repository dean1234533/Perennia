import {
  type DiscoveryAreaSearchItem,
  type DiscoveryAreaSearchRequest,
  type DiscoveryAreaSearchResult,
  type ResolvedDiscoveryArea,
  type SafeAreaDiscoveryCandidate,
} from '@/lib/discoveryAreaSearch'
import { milesBetween } from '@/lib/distance'
import type { DiscoveryCandidate } from '@/lib/firestore'
import {
  DESIGN_PREVIEW_AREA_HIGH_COMPATIBILITY,
  DESIGN_PREVIEW_AREA_HIGH_PROFILE,
  DESIGN_PREVIEW_AREA_HIGHER_COMPATIBILITY,
  DESIGN_PREVIEW_AREA_HIGHER_PROFILE,
  DESIGN_PREVIEW_AREA_STANDARD_COMPATIBILITY,
  DESIGN_PREVIEW_AREA_STANDARD_PROFILE,
  DESIGN_PREVIEW_DISTANT_COMPATIBILITY,
  DESIGN_PREVIEW_DISTANT_PROFILE,
  DESIGN_PREVIEW_VISITOR_COMPATIBILITY,
  DESIGN_PREVIEW_VISITOR_PROFILE,
} from '@/data/designPreviewVisitorProfile'

type PreviewArea = ResolvedDiscoveryArea & { aliases: string[] }

const PREVIEW_AREAS: PreviewArea[] = [
  { label: 'London, United Kingdom', lat: 51.5074, lon: -0.1278, aliases: ['london', 'sw1a 1aa', 'sw1a1aa'] },
  { label: 'Manchester, United Kingdom', lat: 53.4808, lon: -2.2426, aliases: ['manchester', 'm1 1ae', 'm11ae'] },
  { label: 'Glasgow, United Kingdom', lat: 55.8642, lon: -4.2518, aliases: ['glasgow', 'g1 1aa', 'g11aa'] },
]

const PREVIEW_CLASSIFICATIONS: Record<string, boolean> = {
  [DESIGN_PREVIEW_VISITOR_PROFILE.uid]: true,
  [DESIGN_PREVIEW_AREA_HIGH_PROFILE.uid]: true,
  [DESIGN_PREVIEW_AREA_HIGHER_PROFILE.uid]: true,
  [DESIGN_PREVIEW_AREA_STANDARD_PROFILE.uid]: false,
  [DESIGN_PREVIEW_DISTANT_PROFILE.uid]: false,
}

const PREVIEW_RESULTS = [
  { candidate: DESIGN_PREVIEW_VISITOR_PROFILE, compatibility: DESIGN_PREVIEW_VISITOR_COMPATIBILITY },
  { candidate: DESIGN_PREVIEW_AREA_HIGH_PROFILE, compatibility: DESIGN_PREVIEW_AREA_HIGH_COMPATIBILITY },
  { candidate: DESIGN_PREVIEW_AREA_HIGHER_PROFILE, compatibility: DESIGN_PREVIEW_AREA_HIGHER_COMPATIBILITY },
  { candidate: DESIGN_PREVIEW_AREA_STANDARD_PROFILE, compatibility: DESIGN_PREVIEW_AREA_STANDARD_COMPATIBILITY },
  { candidate: DESIGN_PREVIEW_DISTANT_PROFILE, compatibility: DESIGN_PREVIEW_DISTANT_COMPATIBILITY },
]

function normaliseAreaQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function sanitiseCandidate(candidate: DiscoveryCandidate): SafeAreaDiscoveryCandidate {
  return {
    ...candidate,
    birthPlace: '',
    birthPlaceLat: null,
    birthPlaceLon: null,
    currentLocationLat: null,
    currentLocationLon: null,
    email: '',
    phone: '',
  }
}

export async function resolveDesignPreviewDiscoveryArea(query: string): Promise<ResolvedDiscoveryArea> {
  const normalised = normaliseAreaQuery(query)
  const match = PREVIEW_AREAS.find((area) => area.aliases.includes(normalised))
  if (!match) {
    throw new Error('We could not find that UK town, city or postcode. Try London, Manchester, Glasgow or SW1A 1AA in this local preview.')
  }
  return { label: match.label, lat: match.lat, lon: match.lon }
}

export async function searchDesignPreviewDiscoveryArea(
  request: DiscoveryAreaSearchRequest,
): Promise<DiscoveryAreaSearchResult> {
  const items: DiscoveryAreaSearchItem[] = PREVIEW_RESULTS.flatMap(({ candidate, compatibility }) => {
    if (candidate.currentLocationLat === null || candidate.currentLocationLon === null) return []
    const distanceMiles = milesBetween(request.area, {
      lat: candidate.currentLocationLat,
      lon: candidate.currentLocationLon,
    })
    const meetsHighCompatibility = PREVIEW_CLASSIFICATIONS[candidate.uid] ?? false
    if (distanceMiles > request.radiusMiles) return []
    if (request.highCompatibilityOnly && !meetsHighCompatibility) return []
    return [{
      candidate: sanitiseCandidate(candidate),
      distanceMiles,
      compatibility,
      meetsHighCompatibility,
    }]
  })

  items.sort((a, b) => request.highCompatibilityOnly
    ? (b.compatibility?.compatibility ?? -1) - (a.compatibility?.compatibility ?? -1) || a.distanceMiles - b.distanceMiles
    : a.distanceMiles - b.distanceMiles)

  return { area: request.area, radiusMiles: request.radiusMiles, items }
}
