import type { LocalityResolution } from './contracts'
import type { ResolverOptions, ResolutionCandidates } from './resolver'
import { resolveLocalityCandidates } from './resolver'

export function classifyLocalityResolution(candidates: ResolutionCandidates): LocalityResolution {
  if (candidates.exact) {
    return {
      tier: 'exact',
      citySlug: candidates.exact.citySlug,
      localitySlug: candidates.exact.localitySlug,
      localityName: candidates.exact.localityName,
      clusterId: null,
      districtSlug: null,
      districtName: null,
      stateSlug: null,
      distanceKm: candidates.exact.distanceKm,
      matchedBy: candidates.exact.matchedBy,
      reason: candidates.exact.matchedBy === 'polygon'
        ? 'Coordinate falls inside a supported locality polygon.'
        : 'Resolved locality alias is close enough to a supported locality centroid.',
    }
  }

  if (candidates.nearby) {
    return {
      tier: 'nearby',
      citySlug: candidates.nearby.citySlug,
      localitySlug: candidates.nearby.localitySlug,
      localityName: candidates.nearby.localityName,
      clusterId: null,
      districtSlug: null,
      districtName: null,
      stateSlug: null,
      distanceKm: candidates.nearby.distanceKm,
      matchedBy: 'radius',
      reason: 'Coordinate is within the safe nearby radius of a supported micro-market.',
    }
  }

  if (candidates.context) {
    return {
      tier: 'context',
      citySlug: candidates.context.citySlug,
      localitySlug: candidates.context.localitySlug,
      localityName: candidates.context.localityName,
      clusterId: null,
      districtSlug: null,
      districtName: null,
      stateSlug: null,
      distanceKm: candidates.context.distanceKm,
      matchedBy: 'context',
      reason: 'Coordinate falls inside an identified Hyderabad context area. PlotDNA will start validation for this area before assigning an exact score.',
      resolvedPlaceSlug: candidates.context.localitySlug,
      analysisSlug: null,
      boundaryKind: candidates.context.boundaryKind,
      boundaryConfidence: candidates.context.boundaryConfidence,
      scorePrecision: candidates.context.scorePrecision,
      catalogArea: null,
    }
  }

  if (candidates.cluster) {
    return {
      tier: 'cluster',
      citySlug: candidates.cluster.citySlug,
      localitySlug: null,
      localityName: null,
      clusterId: candidates.cluster.clusterId,
      districtSlug: null,
      districtName: null,
      stateSlug: null,
      distanceKm: candidates.cluster.distanceKm,
      matchedBy: 'cluster',
      reason: 'Coordinate is inside a supported city catchment, but only broad cluster context is available.',
    }
  }

  if (candidates.district) {
    return {
      tier: 'regional',
      citySlug: null,
      localitySlug: null,
      localityName: null,
      clusterId: null,
      districtSlug: candidates.district.districtSlug,
      districtName: candidates.district.districtName,
      stateSlug: candidates.district.stateSlug,
      distanceKm: candidates.district.distanceKm,
      matchedBy: 'district',
      reason: `Coordinate is inside ${candidates.district.districtName} regional coverage — no micro-market data yet for this area.`,
    }
  }

  return {
    tier: 'uncovered',
    citySlug: null,
    localitySlug: null,
    localityName: null,
    clusterId: null,
    districtSlug: null,
    districtName: null,
    stateSlug: null,
    distanceKm: null,
    matchedBy: 'none',
    reason: 'Coordinate does not map to a supported locality or regional coverage area.',
  }
}

export function resolveLocalityResolution(lat: number, lng: number, options: ResolverOptions = {}): LocalityResolution {
  return classifyLocalityResolution(resolveLocalityCandidates(lat, lng, options))
}
