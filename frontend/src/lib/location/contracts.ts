import type { MicroMarket } from '@/types'

export type ResolutionTier = 'exact' | 'nearby' | 'context' | 'cluster' | 'regional' | 'uncovered'

export interface LocalityResolution {
  tier: ResolutionTier
  citySlug: string | null
  localitySlug: string | null
  localityName: string | null
  clusterId: string | null
  districtSlug: string | null
  districtName: string | null
  stateSlug: string | null
  distanceKm: number | null
  matchedBy: 'polygon' | 'alias' | 'radius' | 'context' | 'cluster' | 'district' | 'none'
  reason: string
  resolvedPlaceSlug?: string | null
  analysisSlug?: string | null
  boundaryKind?: string | null
  boundaryConfidence?: string | null
  scorePrecision?: string | null
  catalogArea?: MicroMarket | null
}
