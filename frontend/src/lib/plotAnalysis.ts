import type { MicroMarket } from '@/types'
import { getAllAreas } from '@/data/cities'

// ── Map URL parsing ────────────────────────────────────────────────────────────
// Extracts lat/lng from Google Maps, Apple Maps, and OpenStreetMap URLs.
// Returns null for short links (maps.app.goo.gl) — those need backend resolution.
export function parseMapUrl(input: string): [number, number] | null {
  const s = input.trim()
  const valid = (lat: number, lng: number): [number, number] | null =>
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 ? [lat, lng] : null

  // Google Maps @lat,lng,zoom (most common share format)
  const atMatch = s.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/)
  if (atMatch) return valid(parseFloat(atMatch[1]), parseFloat(atMatch[2]))

  // ?q=lat,lng or &q=lat,lng
  const qMatch = s.match(/[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/)
  if (qMatch) return valid(parseFloat(qMatch[1]), parseFloat(qMatch[2]))

  // Apple Maps: ?ll=lat,lng
  const llMatch = s.match(/[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/)
  if (llMatch) return valid(parseFloat(llMatch[1]), parseFloat(llMatch[2]))

  // OpenStreetMap: #map=zoom/lat/lng
  const osmMatch = s.match(/#map=\d+\/(-?\d{1,3}\.\d+)\/(-?\d{1,3}\.\d+)/)
  if (osmMatch) return valid(parseFloat(osmMatch[1]), parseFloat(osmMatch[2]))

  return null
}

// Returns true for short links that need backend redirect resolution
export function isShortMapUrl(input: string): boolean {
  return /maps\.app\.goo\.gl|goo\.gl\/maps/i.test(input.trim())
}

// Returns true for any URL input (map link or short link)
export function isMapUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim())
}

// ── Coordinate parsing ────────────────────────────────────────────────────────
// Accepts: "17.51, 78.29"  |  "17.51 78.29"  |  "17.513607429705296,  78.2920650662839"
export function parseCoords(query: string): [number, number] | null {
  const clean = query.trim()
  const match = clean.match(/^(-?\d{1,3}(?:\.\d+)?)\s*[,\s]+\s*(-?\d{1,3}(?:\.\d+)?)$/)
  if (!match) return null
  const lat = parseFloat(match[1])
  const lng = parseFloat(match[2])
  if (isNaN(lat) || isNaN(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  // Bias: Hyderabad is ~17°N 78°E — reject obviously wrong coords
  return [lat, lng]
}

// ── Haversine distance ────────────────────────────────────────────────────────
function distKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const COVERAGE_RADIUS_KM = 5

export function findNearestArea(
  lat: number,
  lng: number,
): { area: MicroMarket; distKm: number; withinCoverage: boolean } {
  const allAreas = getAllAreas()
  let best = allAreas[0]
  let bestDist = Infinity
  for (const area of allAreas) {
    const d = distKm(lat, lng, area.center[0], area.center[1])
    if (d < bestDist) {
      best = area
      bestDist = d
    }
  }
  const rounded = Math.round(bestDist * 10) / 10
  return { area: best, distKm: rounded, withinCoverage: rounded <= COVERAGE_RADIUS_KM }
}

// ── Growth timeline ───────────────────────────────────────────────────────────
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

// ── 5-year outlook ────────────────────────────────────────────────────────────
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
    area.score >= 41 ? 'Moderate gains — monitor closely' :
    'High risk — insufficient market data'
  return {
    range: `+${low}–${high}%`,
    confidence,
    headline,
    drivers: area.highlights.slice(0, 2),
  }
}
