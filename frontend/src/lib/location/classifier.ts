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
      distanceKm: candidates.nearby.distanceKm,
      matchedBy: 'radius',
      reason: 'Coordinate is within the safe nearby radius of a supported micro-market.',
    }
  }

  if (candidates.cluster) {
    return {
      tier: 'cluster',
      citySlug: candidates.cluster.citySlug,
      localitySlug: null,
      localityName: null,
      clusterId: candidates.cluster.clusterId,
      distanceKm: candidates.cluster.distanceKm,
      matchedBy: 'cluster',
      reason: 'Coordinate is inside a supported city catchment, but only broad cluster context is available.',
    }
  }

  return {
    tier: 'uncovered',
    citySlug: null,
    localitySlug: null,
    localityName: null,
    clusterId: null,
    distanceKm: null,
    matchedBy: 'none',
    reason: 'Coordinate does not map to a supported locality or city cluster.',
  }
}

export function resolveLocalityResolution(lat: number, lng: number, options: ResolverOptions = {}): LocalityResolution {
  return classifyLocalityResolution(resolveLocalityCandidates(lat, lng, options))
}
