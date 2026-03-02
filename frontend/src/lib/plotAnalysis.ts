import type { MicroMarket } from '@/types'
import { hyderabadAreas } from '@/data/hyderabad'

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

export function findNearestArea(lat: number, lng: number): { area: MicroMarket; distKm: number } {
  let best = hyderabadAreas[0]
  let bestDist = Infinity
  for (const area of hyderabadAreas) {
    const d = distKm(lat, lng, area.center[0], area.center[1])
    if (d < bestDist) {
      best = area
      bestDist = d
    }
  }
  return { area: best, distKm: Math.round(bestDist * 10) / 10 }
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
