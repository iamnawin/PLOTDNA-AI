import type { CityMeta, MicroMarket } from '@/types'
import { CITIES, CITY_LIST } from '@/data/cities'
import hydAliasesJson from '../../../../data/cities/hyderabad/aliases.json'
import hydCityJson from '../../../../data/cities/hyderabad/city.json'
import hydClustersJson from '../../../../data/cities/hyderabad/clusters.json'
import hydLocalitiesJson from '../../../../data/cities/hyderabad/localities.json'

export interface ResolverOptions {
  locality?: string | null
  city?: string | null
}

export interface AreaReference {
  area: MicroMarket
  citySlug: string
  cityName: string
}

export interface ExactMatchCandidate {
  citySlug: string
  localitySlug: string
  localityName: string
  distanceKm: number
  matchedBy: 'polygon' | 'alias'
}

export interface NearbyMatchCandidate {
  citySlug: string
  localitySlug: string
  localityName: string
  distanceKm: number
  matchedBy: 'radius'
}

export interface ClusterCandidate {
  citySlug: string
  cityName: string
  clusterId: string
  distanceKm: number
}

export interface ResolutionCandidates {
  exact: ExactMatchCandidate | null
  nearby: NearbyMatchCandidate | null
  cluster: ClusterCandidate | null
}

interface CityCandidate {
  slug: string
  meta: CityMeta
  areas: MicroMarket[]
  distKm: number
  coverageRadiusKm: number
  centralRadiusKm: number
}

interface MatchableArea {
  ref: AreaReference
  center: [number, number]
  polygon: [number, number][]
  aliases: string[]
}

interface HyderabadCityData {
  slug: string
  name: string
  state: string
  center: [number, number]
  zoom: number
  coverageRadiusKm: number
  centralRadiusKm: number
  exactLocalityBufferKm: number
  nearbyMicroMarketRadiusKm: number
}

interface HyderabadLocalityData {
  slug: string
  name: string
  center: [number, number]
  polygon: [number, number][]
}

interface HyderabadClusterData {
  id: string
  label: string
  zone: CityZone
  localitySlugs: string[]
}

type CityZone = 'Central' | 'North' | 'East' | 'South' | 'West'
type HyderabadAliasData = Record<string, string[]>

const DEFAULT_EXACT_LOCALITY_BUFFER_KM = 6
const DEFAULT_NEARBY_MICRO_MARKET_RADIUS_KM = 5
const CITY_CATCHMENT_PADDING_KM = 10

const HYDERABAD_CITY = hydCityJson as HyderabadCityData
const HYDERABAD_LOCALITIES = hydLocalitiesJson as HyderabadLocalityData[]
const HYDERABAD_ALIASES = hydAliasesJson as HyderabadAliasData
const HYDERABAD_CLUSTERS = hydClustersJson as HyderabadClusterData[]

const HYDERABAD_CITY_META: CityMeta = {
  slug: HYDERABAD_CITY.slug,
  name: HYDERABAD_CITY.name,
  center: HYDERABAD_CITY.center,
  zoom: HYDERABAD_CITY.zoom,
}

const AREA_REFERENCES: AreaReference[] = Object.entries(CITIES).flatMap(([citySlug, entry]) =>
  entry.areas.map(area => ({ area, citySlug, cityName: entry.meta.name })),
)

const HYDERABAD_FULL_AREAS_BY_SLUG = new Map(
  CITIES.hyderabad.areas.map(area => [area.slug, area]),
)

const HYDERABAD_CLUSTERS_BY_ID = new Map(
  HYDERABAD_CLUSTERS.map(cluster => [cluster.id, cluster]),
)

const HYDERABAD_CLUSTERS_BY_ZONE = new Map(
  HYDERABAD_CLUSTERS.map(cluster => [cluster.zone, cluster]),
)

function warnHyderabadDataMismatch(message: string, values: string[]): void {
  if (import.meta.env.DEV && values.length > 0) {
    console.warn(`[location] Hyderabad resolver data mismatch: ${message}: ${values.join(', ')}`)
  }
}

function validateHyderabadResolverData(): void {
  const localitySlugs = new Set(HYDERABAD_LOCALITIES.map(locality => locality.slug))
  const marketSlugs = new Set(HYDERABAD_FULL_AREAS_BY_SLUG.keys())
  const aliasSlugs = Object.keys(HYDERABAD_ALIASES)
  const clusterSlugs = new Set(HYDERABAD_CLUSTERS.flatMap(cluster => cluster.localitySlugs))

  warnHyderabadDataMismatch(
    'missing localities for frontend market areas',
    [...marketSlugs].filter(slug => !localitySlugs.has(slug)),
  )
  warnHyderabadDataMismatch(
    'localities without frontend market data',
    [...localitySlugs].filter(slug => !marketSlugs.has(slug)),
  )
  warnHyderabadDataMismatch(
    'aliases referencing unknown localities',
    aliasSlugs.filter(slug => !localitySlugs.has(slug)),
  )
  warnHyderabadDataMismatch(
    'cluster members referencing unknown localities',
    [...clusterSlugs].filter(slug => !localitySlugs.has(slug)),
  )
  warnHyderabadDataMismatch(
    'localities missing cluster membership',
    [...localitySlugs].filter(slug => !clusterSlugs.has(slug)),
  )
}

validateHyderabadResolverData()

const MATCHABLE_AREAS: MatchableArea[] = [
  ...HYDERABAD_LOCALITIES.flatMap(locality => {
    const area = HYDERABAD_FULL_AREAS_BY_SLUG.get(locality.slug)
    if (!area) return []

    return [{
      ref: { area, citySlug: HYDERABAD_CITY.slug, cityName: HYDERABAD_CITY.name },
      center: locality.center,
      polygon: locality.polygon,
      aliases: (HYDERABAD_ALIASES[locality.slug] ?? []).map(normalizePlaceName),
    }]
  }),
  ...AREA_REFERENCES
    .filter(ref => ref.citySlug !== HYDERABAD_CITY.slug)
    .map(ref => ({
      ref,
      center: ref.area.center,
      polygon: ref.area.polygon,
      aliases: buildAreaAliases(ref.area),
    })),
]

function roundKm(value: number): number {
  return Math.round(value * 10) / 10
}

function normalizePlaceName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildAreaAliases(area: MicroMarket): string[] {
  const aliases = new Set<string>([
    normalizePlaceName(area.name),
    normalizePlaceName(area.slug.replace(/-/g, ' ')),
  ])

  const parenthetical = area.name.match(/\(([^)]+)\)/g) ?? []
  for (const match of parenthetical) {
    const value = normalizePlaceName(match.replace(/[()]/g, ' '))
    if (value) aliases.add(value)
  }

  const withoutParen = normalizePlaceName(area.name.replace(/\([^)]*\)/g, ' '))
  if (withoutParen) aliases.add(withoutParen)

  return [...aliases].filter(Boolean)
}

function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i]
    const [latJ, lngJ] = polygon[j]
    const intersects =
      ((lngI > lng) !== (lngJ > lng)) &&
      (lat < ((latJ - latI) * (lng - lngI)) / ((lngJ - lngI) || Number.EPSILON) + latI)
    if (intersects) inside = !inside
  }
  return inside
}

export function distKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getExactLocalityBufferKm(citySlug: string): number {
  if (citySlug === HYDERABAD_CITY.slug) return HYDERABAD_CITY.exactLocalityBufferKm
  return DEFAULT_EXACT_LOCALITY_BUFFER_KM
}

function getNearbyMicroMarketRadiusKm(citySlug: string): number {
  if (citySlug === HYDERABAD_CITY.slug) return HYDERABAD_CITY.nearbyMicroMarketRadiusKm
  return DEFAULT_NEARBY_MICRO_MARKET_RADIUS_KM
}

function getNearestAreaReference(
  lat: number,
  lng: number,
  refs = AREA_REFERENCES,
): (AreaReference & { distKm: number }) | null {
  let best: (AreaReference & { distKm: number }) | null = null
  for (const ref of refs) {
    const distance = distKm(lat, lng, ref.area.center[0], ref.area.center[1])
    if (!best || distance < best.distKm) {
      best = { ...ref, distKm: distance }
    }
  }
  return best
}

function cityCatchmentRadiusKm(meta: CityMeta, areas: MicroMarket[]): number {
  const furthestArea = Math.max(...areas.map(area => distKm(meta.center[0], meta.center[1], area.center[0], area.center[1])))
  return furthestArea + CITY_CATCHMENT_PADDING_KM
}

function getCityMeta(citySlug: string, fallback: CityMeta): CityMeta {
  return citySlug === HYDERABAD_CITY.slug ? HYDERABAD_CITY_META : fallback
}

function getCityCoverageRadiusKm(citySlug: string, meta: CityMeta, areas: MicroMarket[]): number {
  if (citySlug === HYDERABAD_CITY.slug) return HYDERABAD_CITY.coverageRadiusKm
  return cityCatchmentRadiusKm(meta, areas)
}

function getCityCentralRadiusKm(citySlug: string, coverageRadiusKm: number): number {
  if (citySlug === HYDERABAD_CITY.slug) return HYDERABAD_CITY.centralRadiusKm
  return Math.max(4, Math.min(8, coverageRadiusKm * 0.22))
}

function resolveCityCandidate(lat: number, lng: number, cityHint?: string | null): CityCandidate | null {
  const normalizedHint = normalizePlaceName(cityHint ?? '')
  const candidates: CityCandidate[] = CITY_LIST.map(meta => {
    const entry = CITIES[meta.slug]
    const cityMeta = getCityMeta(meta.slug, meta)
    const coverageRadiusKm = getCityCoverageRadiusKm(meta.slug, cityMeta, entry.areas)
    return {
      slug: meta.slug,
      meta: cityMeta,
      areas: entry.areas,
      distKm: distKm(lat, lng, cityMeta.center[0], cityMeta.center[1]),
      coverageRadiusKm,
      centralRadiusKm: getCityCentralRadiusKm(meta.slug, coverageRadiusKm),
    }
  })

  if (normalizedHint) {
    const hinted = candidates.find(candidate => normalizePlaceName(candidate.meta.name) === normalizedHint)
    if (hinted && hinted.distKm <= hinted.coverageRadiusKm) return hinted
  }

  const inCatchment = candidates
    .filter(candidate => candidate.distKm <= candidate.coverageRadiusKm)
    .sort((a, b) => a.distKm - b.distKm)

  return inCatchment[0] ?? null
}

function zoneForPoint(city: CityMeta, lat: number, lng: number, centralRadiusKm: number): CityZone {
  const distanceFromCenter = distKm(lat, lng, city.center[0], city.center[1])
  if (distanceFromCenter <= centralRadiusKm) return 'Central'

  const latDelta = lat - city.center[0]
  const lngDelta = lng - city.center[1]
  if (Math.abs(latDelta) >= Math.abs(lngDelta)) {
    return latDelta >= 0 ? 'North' : 'South'
  }
  return lngDelta >= 0 ? 'East' : 'West'
}

function zoneForArea(city: CityMeta, area: MicroMarket, centralRadiusKm: number): CityZone {
  return zoneForPoint(city, area.center[0], area.center[1], centralRadiusKm)
}

function clusterIdFor(citySlug: string, zone: CityZone): string {
  return `${citySlug}:${zone.toLowerCase()}`
}

export function getCityName(citySlug: string | null): string | null {
  if (!citySlug) return null
  if (citySlug === HYDERABAD_CITY.slug) return HYDERABAD_CITY.name
  return CITIES[citySlug]?.meta.name ?? null
}

export function getClusterLabel(clusterId: string | null): string | null {
  if (!clusterId) return null

  const hydCluster = HYDERABAD_CLUSTERS_BY_ID.get(clusterId)
  if (hydCluster) return hydCluster.label

  const [citySlug, zoneSlug] = clusterId.split(':')
  const cityName = getCityName(citySlug)
  if (!cityName || !zoneSlug) return null
  const zone = `${zoneSlug.charAt(0).toUpperCase()}${zoneSlug.slice(1)}`
  return `${cityName} ${zone} Zone`
}

export function getAreaReferenceBySlug(citySlug: string | null, localitySlug: string | null): AreaReference | null {
  if (!citySlug || !localitySlug) return null
  return AREA_REFERENCES.find(ref => ref.citySlug === citySlug && ref.area.slug === localitySlug) ?? null
}

export function getClusterRepresentative(
  citySlug: string | null,
  clusterId: string | null,
  lat: number,
  lng: number,
): AreaReference | null {
  if (!citySlug || !clusterId) return null
  const entry = CITIES[citySlug]
  if (!entry) return null

  if (citySlug === HYDERABAD_CITY.slug) {
    const cluster = HYDERABAD_CLUSTERS_BY_ID.get(clusterId)
    if (!cluster) return null

    const refs = cluster.localitySlugs
      .map(localitySlug => getAreaReferenceBySlug(citySlug, localitySlug))
      .filter((ref): ref is AreaReference => Boolean(ref))

    const best = getNearestAreaReference(lat, lng, refs)
    return best ? { area: best.area, citySlug: best.citySlug, cityName: best.cityName } : null
  }

  const [, zoneSlug] = clusterId.split(':')
  const zone = zoneSlug
    ? `${zoneSlug.charAt(0).toUpperCase()}${zoneSlug.slice(1)}` as CityZone
    : null
  if (!zone) return null

  const coverageRadiusKm = getCityCoverageRadiusKm(citySlug, entry.meta, entry.areas)
  const centralRadiusKm = getCityCentralRadiusKm(citySlug, coverageRadiusKm)
  const zoneAreas = entry.areas.filter(area => zoneForArea(entry.meta, area, centralRadiusKm) === zone)
  const refs = (zoneAreas.length > 0 ? zoneAreas : entry.areas).map(area => ({
    area,
    citySlug,
    cityName: entry.meta.name,
  }))

  const best = getNearestAreaReference(lat, lng, refs)
  return best ? { area: best.area, citySlug: best.citySlug, cityName: best.cityName } : null
}

export function resolveLocalityCandidates(
  lat: number,
  lng: number,
  options: ResolverOptions = {},
): ResolutionCandidates {
  const locality = normalizePlaceName(options.locality ?? '')
  const cityHint = options.city ?? null

  let exact: ExactMatchCandidate | null = null
  if (locality) {
    const localityMatches = MATCHABLE_AREAS
      .filter(candidate => candidate.aliases.includes(locality))
      .map(candidate => {
        const distance = distKm(lat, lng, candidate.center[0], candidate.center[1])
        const matchedBy: 'polygon' | 'alias' = pointInPolygon(lat, lng, candidate.polygon) ? 'polygon' : 'alias'
        return { candidate, distance, matchedBy }
      })
      .filter(({ candidate }) => !cityHint || normalizePlaceName(candidate.ref.cityName) === normalizePlaceName(cityHint))
      .sort((a, b) => {
        if (a.matchedBy !== b.matchedBy) return a.matchedBy === 'polygon' ? -1 : 1
        return a.distance - b.distance
      })

    const bestExact = localityMatches[0]
    if (
      bestExact &&
      (bestExact.matchedBy === 'polygon' ||
        bestExact.distance <= getExactLocalityBufferKm(bestExact.candidate.ref.citySlug))
    ) {
      exact = {
        citySlug: bestExact.candidate.ref.citySlug,
        localitySlug: bestExact.candidate.ref.area.slug,
        localityName: bestExact.candidate.ref.area.name,
        distanceKm: roundKm(bestExact.distance),
        matchedBy: bestExact.matchedBy,
      }
    }
  }

  const nearest = getNearestAreaReference(lat, lng)
  const nearby = nearest && nearest.distKm <= getNearbyMicroMarketRadiusKm(nearest.citySlug)
    ? {
        citySlug: nearest.citySlug,
        localitySlug: nearest.area.slug,
        localityName: nearest.area.name,
        distanceKm: roundKm(nearest.distKm),
        matchedBy: 'radius' as const,
      }
    : null

  const city = resolveCityCandidate(lat, lng, cityHint)
  const cluster = city
    ? (() => {
        const zone = zoneForPoint(city.meta, lat, lng, city.centralRadiusKm)
        const cityCluster = city.slug === HYDERABAD_CITY.slug
          ? HYDERABAD_CLUSTERS_BY_ZONE.get(zone)
          : null

        return {
          citySlug: city.slug,
          cityName: city.meta.name,
          clusterId: cityCluster?.id ?? clusterIdFor(city.slug, zone),
          distanceKm: roundKm(city.distKm),
        }
      })()
    : null

  return { exact, nearby, cluster }
}
