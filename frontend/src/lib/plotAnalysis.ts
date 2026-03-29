import type { MicroMarket } from '@/types'
import type { ResolutionTier } from '@/lib/location/contracts'
import { resolveLocalityResolution } from '@/lib/location/classifier'
import {
  getAreaReferenceBySlug,
  getCityName,
  getClusterLabel,
  getClusterRepresentative,
  type ResolverOptions,
} from '@/lib/location/resolver'

// Extracts lat/lng from Google Maps, Apple Maps, and OpenStreetMap URLs.
// Returns null for short links (maps.app.goo.gl) because those need backend resolution.
export function parseMapUrl(input: string): [number, number] | null {
  const s = input.trim()
  const valid = (lat: number, lng: number): [number, number] | null =>
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 ? [lat, lng] : null

  const patterns = [
    /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
    /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
    /[?&](?:query|destination|center)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
    /[?&](?:ll|sll)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
    /[?&]mlat=(-?\d{1,3}\.\d+)[^#]*[?&]mlon=(-?\d{1,3}\.\d+)/,
    /#map=\d+\/(-?\d{1,3}\.\d+)\/(-?\d{1,3}\.\d+)/,
    /\/(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)(?:,|[/?#&]|$)/,
  ]

  for (const pattern of patterns) {
    const match = s.match(pattern)
    if (match) return valid(parseFloat(match[1]), parseFloat(match[2]))
  }

  return null
}

export function isShortMapUrl(input: string): boolean {
  return /maps\.app\.goo\.gl|goo\.gl\/maps/i.test(input.trim())
}

export function isMapUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim())
}

// Accepts:
// "17.51, 78.29" | "17.51 78.29" | "17.513607429705296, 78.2920650662839"
export function parseCoords(query: string): [number, number] | null {
  const clean = query.trim()
  const match = clean.match(/^(-?\d{1,3}(?:\.\d+)?)\s*[,\s]+\s*(-?\d{1,3}(?:\.\d+)?)$/)
  if (!match) return null
  const lat = parseFloat(match[1])
  const lng = parseFloat(match[2])
  if (isNaN(lat) || isNaN(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return [lat, lng]
}

export type LocalityFallbackTier =
  | 'exact_locality'
  | 'nearby_micro_market'
  | 'city_zone_cluster'
  | 'uncovered'

export type LocalityFallbackOptions = ResolverOptions

export interface LocalityFallbackResult {
  tier: LocalityFallbackTier
  area: MicroMarket | null
  distKm: number | null
  withinCoverage: boolean
  citySlug: string | null
  cityName: string | null
  clusterLabel: string | null
  matchedLocality: string | null
  displayLabel: string
  precisionLabel: 'exact' | 'approximate' | 'broad' | 'none'
  shouldSelectArea: boolean
}

function mapTier(tier: ResolutionTier): LocalityFallbackTier {
  if (tier === 'exact') return 'exact_locality'
  if (tier === 'nearby') return 'nearby_micro_market'
  if (tier === 'cluster') return 'city_zone_cluster'
  return 'uncovered'
}

export function resolveLocalityFallback(
  lat: number,
  lng: number,
  options: LocalityFallbackOptions = {},
): LocalityFallbackResult {
  const resolution = resolveLocalityResolution(lat, lng, options)
  const tier = mapTier(resolution.tier)
  const areaRef = getAreaReferenceBySlug(resolution.citySlug, resolution.localitySlug)
  const clusterRepresentative = getClusterRepresentative(resolution.citySlug, resolution.clusterId, lat, lng)
  const cityName = getCityName(resolution.citySlug)
  const clusterLabel = getClusterLabel(resolution.clusterId)

  if (resolution.tier === 'exact' || resolution.tier === 'nearby') {
    return {
      tier,
      area: areaRef?.area ?? null,
      distKm: resolution.distanceKm,
      withinCoverage: true,
      citySlug: resolution.citySlug,
      cityName,
      clusterLabel: null,
      matchedLocality: options.locality ?? resolution.localityName,
      displayLabel: resolution.localityName ?? 'Supported locality',
      precisionLabel: resolution.tier === 'exact' ? 'exact' : 'approximate',
      shouldSelectArea: true,
    }
  }

  if (resolution.tier === 'cluster') {
    return {
      tier,
      area: clusterRepresentative?.area ?? null,
      distKm: resolution.distanceKm,
      withinCoverage: false,
      citySlug: resolution.citySlug,
      cityName,
      clusterLabel,
      matchedLocality: options.locality ?? null,
      displayLabel: clusterLabel ?? 'Supported city cluster',
      precisionLabel: 'broad',
      shouldSelectArea: false,
    }
  }

  return {
    tier,
    area: null,
    distKm: null,
    withinCoverage: false,
    citySlug: null,
    cityName: null,
    clusterLabel: null,
    matchedLocality: options.locality ?? null,
    displayLabel: options.locality?.trim() || 'Unsupported location',
    precisionLabel: 'none',
    shouldSelectArea: false,
  }
}

export function findNearestArea(
  lat: number,
  lng: number,
  options: LocalityFallbackOptions = {},
): LocalityFallbackResult {
  return resolveLocalityFallback(lat, lng, options)
}

export type MilestonePhase = 'baseline' | 'early' | 'growth' | 'boom' | 'now'

export interface Milestone {
  year: string
  label: string
  phase: MilestonePhase
}

export function getGrowthMilestones(area: MicroMarket): Milestone[] {
  const s = area.score
  if (s >= 86)
    return [
      { year: '2009', label: 'Open farmland', phase: 'baseline' },
      { year: '2014', label: 'ORR connectivity', phase: 'early' },
      { year: '2019', label: 'IT park approvals', phase: 'growth' },
      { year: '2022', label: 'Construction surge', phase: 'boom' },
      { year: '2024', label: 'Prime zone', phase: 'now' },
    ]
  if (s >= 66)
    return [
      { year: '2009', label: 'Peripheral village', phase: 'baseline' },
      { year: '2015', label: 'Ring road access', phase: 'early' },
      { year: '2020', label: 'Residential projects', phase: 'growth' },
      { year: '2023', label: 'Rising demand', phase: 'boom' },
      { year: '2024', label: 'Growth corridor', phase: 'now' },
    ]
  if (s >= 41)
    return [
      { year: '2009', label: 'Peri-urban fringe', phase: 'baseline' },
      { year: '2016', label: 'Basic amenities', phase: 'early' },
      { year: '2021', label: 'Affordable housing', phase: 'growth' },
      { year: '2023', label: 'Slow appreciation', phase: 'boom' },
      { year: '2024', label: 'Moderate zone', phase: 'now' },
    ]
  return [
    { year: '2009', label: 'Agricultural land', phase: 'baseline' },
    { year: '2017', label: 'Minimal change', phase: 'early' },
    { year: '2022', label: 'Low activity', phase: 'growth' },
    { year: '2024', label: 'Watch area', phase: 'now' },
  ]
}

export interface Outlook {
  range: string
  confidence: 'High' | 'Medium' | 'Low'
  headline: string
  drivers: string[]
}

export function getOutlook(area: MicroMarket): Outlook {
  const infra = area.signals.infrastructure
  const satellite = area.signals.satellite
  const low = Math.round(area.yoy * 3.5)
  const high = Math.round(area.yoy * 5.5)
  const confidence: 'High' | 'Medium' | 'Low' =
    infra > 80 && satellite > 75 ? 'High' : infra > 60 ? 'Medium' : 'Low'
  const headline =
    area.score >= 86 ? 'Strong multi-year appreciation likely' :
    area.score >= 66 ? 'Steady growth with infra catalyst' :
    area.score >= 41 ? 'Moderate gains - monitor closely' :
    'High risk - insufficient market data'
  return {
    range: `+${low}-${high}%`,
    confidence,
    headline,
    drivers: area.highlights.slice(0, 2),
  }
}
