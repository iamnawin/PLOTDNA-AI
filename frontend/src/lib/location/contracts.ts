export type ResolutionTier = 'exact' | 'nearby' | 'cluster' | 'regional' | 'uncovered'

export interface LocalityResolution {
  tier: ResolutionTier
  citySlug: string | null
  localitySlug: string | null
  localityName: string | null
  clusterId: string | null
  districtSlug: string | null
  districtName: string | null
  regionalSlug: string | null
  regionalName: string | null
  marketTier: 'tier2' | 'tier3' | null
  stateSlug: string | null
  distanceKm: number | null
  matchedBy: 'polygon' | 'alias' | 'radius' | 'cluster' | 'regional' | 'district' | 'none'
  reason: string
}
