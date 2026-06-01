import type { MicroMarket } from '@/types'

export type ResolutionTier = 'exact' | 'nearby' | 'cluster' | 'regional' | 'uncovered'

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
  matchedBy: 'polygon' | 'alias' | 'radius' | 'cluster' | 'district' | 'none'
  reason: string
  catalogArea?: MicroMarket | null
}
