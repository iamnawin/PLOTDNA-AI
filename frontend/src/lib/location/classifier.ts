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
      regionalSlug: null,
      regionalName: null,
      marketTier: null,
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
      regionalSlug: null,
      regionalName: null,
      marketTier: null,
      stateSlug: null,
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
      districtSlug: null,
      districtName: null,
      regionalSlug: null,
      regionalName: null,
      marketTier: null,
      stateSlug: null,
      distanceKm: candidates.cluster.distanceKm,
      matchedBy: 'cluster',
      reason: 'Coordinate is inside a supported city catchment, but only broad cluster context is available.',
    }
  }

  if (candidates.regional) {
    return {
      tier: 'regional',
      citySlug: null,
      localitySlug: null,
      localityName: null,
      clusterId: null,
      districtSlug: null,
      districtName: null,
      regionalSlug: candidates.regional.regionalSlug,
      regionalName: candidates.regional.regionalName,
      marketTier: candidates.regional.marketTier,
      stateSlug: candidates.regional.stateSlug,
      distanceKm: candidates.regional.distanceKm,
      matchedBy: 'regional',
      reason: `${candidates.regional.regionalName} has broad ${candidates.regional.marketTier.toUpperCase()} regional coverage, but no curated micro-market package yet.`,
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
      regionalSlug: null,
      regionalName: null,
      marketTier: null,
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
    regionalSlug: null,
    regionalName: null,
    marketTier: null,
    stateSlug: null,
    distanceKm: null,
    matchedBy: 'none',
    reason: 'Coordinate does not map to a supported locality or regional coverage area.',
  }
}

export function resolveLocalityResolution(lat: number, lng: number, options: ResolverOptions = {}): LocalityResolution {
  return classifyLocalityResolution(resolveLocalityCandidates(lat, lng, options))
}
