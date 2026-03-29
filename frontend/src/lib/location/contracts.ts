export type ResolutionTier = 'exact' | 'nearby' | 'cluster' | 'uncovered'

export interface LocalityResolution {
  tier: ResolutionTier
  citySlug: string | null
  localitySlug: string | null
  localityName: string | null
  clusterId: string | null
  distanceKm: number | null
  matchedBy: 'polygon' | 'alias' | 'radius' | 'cluster' | 'none'
  reason: string
}
