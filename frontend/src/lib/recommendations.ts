import type { MicroMarket, RecommendationGoal } from '@/types'

export interface RecommendationReason {
  label: string
  value: string
}

export interface RecommendationResult {
  area: MicroMarket
  matchScore: number
  reasons: RecommendationReason[]
  caution: string
}

interface RankedArea {
  area: MicroMarket
  priceFloor: number
  livability: number
  upside: number
  stability: number
  affordability: number
}

const GOAL_META: Record<RecommendationGoal, { label: string; shortLabel: string }> = {
  balanced:   { label: 'Balanced',       shortLabel: 'Balanced' },
  growth:     { label: 'High Upside',    shortLabel: 'Upside' },
  affordable: { label: 'Affordable',     shortLabel: 'Affordable' },
  defensive:  { label: 'Lower Risk',     shortLabel: 'Lower Risk' },
  livable:    { label: 'Livability',     shortLabel: 'Livability' },
}

const GOAL_WEIGHTS: Record<RecommendationGoal, { upside: number; stability: number; affordability: number; livability: number }> = {
  balanced:   { upside: 0.34, stability: 0.28, affordability: 0.18, livability: 0.20 },
  growth:     { upside: 0.50, stability: 0.18, affordability: 0.12, livability: 0.20 },
  affordable: { upside: 0.20, stability: 0.16, affordability: 0.46, livability: 0.18 },
  defensive:  { upside: 0.16, stability: 0.46, affordability: 0.14, livability: 0.24 },
  livable:    { upside: 0.16, stability: 0.24, affordability: 0.12, livability: 0.48 },
}

export function getRecommendationGoalMeta(goal: RecommendationGoal) {
  return GOAL_META[goal]
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function parsePriceFloor(priceRange: string): number | null {
  const matches = [...priceRange.matchAll(/[\d,.]+/g)]
  if (matches.length === 0) return null
  const value = Number(matches[0][0].replace(/,/g, ''))
  return Number.isFinite(value) ? value : null
}

function normalizeInverse(value: number, min: number, max: number) {
  if (max <= min) return 100
  return clamp(100 - ((value - min) / (max - min)) * 100)
}

function computeLivability(area: MicroMarket) {
  if (area.livability) {
    return Math.round(average(Object.values(area.livability)))
  }

  return Math.round(
    area.signals.infrastructure * 0.40 +
    area.signals.population * 0.35 +
    area.signals.rera * 0.25,
  )
}

function computeUpside(area: MicroMarket) {
  const yoyMomentum = clamp(area.yoy * 4.5)
  return Math.round(
    area.signals.infrastructure * 0.26 +
    area.signals.satellite * 0.28 +
    area.signals.employment * 0.18 +
    area.signals.priceVelocity * 0.12 +
    yoyMomentum * 0.16,
  )
}

function computeStability(area: MicroMarket, livability: number) {
  return Math.round(
    area.score * 0.36 +
    area.signals.infrastructure * 0.24 +
    area.signals.rera * 0.18 +
    livability * 0.14 +
    clamp(100 - area.yoy * 1.8) * 0.08,
  )
}

function toRankedAreas(areas: MicroMarket[]): RankedArea[] {
  const priceFloors = areas
    .map((area) => parsePriceFloor(area.priceRange))
    .filter((value): value is number => value !== null)

  const minPrice = priceFloors.length ? Math.min(...priceFloors) : 0
  const maxPrice = priceFloors.length ? Math.max(...priceFloors) : 0

  return areas.map((area) => {
    const livability = computeLivability(area)
    const priceFloor = parsePriceFloor(area.priceRange) ?? maxPrice
    const upside = computeUpside(area)
    const stability = computeStability(area, livability)

    return {
      area,
      priceFloor,
      livability,
      upside,
      stability,
      affordability: normalizeInverse(priceFloor, minPrice, maxPrice),
    }
  })
}

function formatCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function buildReasons(goal: RecommendationGoal, rankedArea: RankedArea): RecommendationReason[] {
  const { area, priceFloor, livability, upside, stability, affordability } = rankedArea

  switch (goal) {
    case 'growth':
      return [
        { label: 'Upside', value: `${upside}/100 momentum` },
        { label: 'Catalyst', value: `${area.signals.satellite}/100 satellite growth` },
        { label: 'Entry', value: `${formatCurrency(priceFloor)} floor` },
      ]
    case 'affordable':
      return [
        { label: 'Entry', value: `${formatCurrency(priceFloor)} floor` },
        { label: 'Value', value: `${affordability}/100 relative affordability` },
        { label: 'Momentum', value: `+${area.yoy}% YoY` },
      ]
    case 'defensive':
      return [
        { label: 'Stability', value: `${stability}/100 confidence` },
        { label: 'RERA', value: `${area.signals.rera}/100 compliance proxy` },
        { label: 'Infra', value: `${area.signals.infrastructure}/100 backbone` },
      ]
    case 'livable':
      return [
        { label: 'Livability', value: `${livability}/100 day-to-day` },
        { label: 'Access', value: `${area.signals.infrastructure}/100 connectivity` },
        { label: 'Base', value: `${area.signals.population}/100 neighborhood depth` },
      ]
    case 'balanced':
    default:
      return [
        { label: 'Match', value: `${area.score}/100 DNA` },
        { label: 'Upside', value: `${upside}/100 momentum` },
        { label: 'Livability', value: `${livability}/100 day-to-day` },
      ]
  }
}

function buildCaution(goal: RecommendationGoal, rankedArea: RankedArea) {
  const { area, priceFloor, affordability, stability, livability } = rankedArea

  if (goal === 'growth' && stability < 70) {
    return 'Higher upside comes with a thinner stability cushion.'
  }
  if (goal === 'affordable' && area.signals.infrastructure < 72) {
    return 'Cheaper entry point, but infrastructure is still catching up.'
  }
  if (goal === 'defensive' && affordability < 40) {
    return `Safer profile, but the entry price starts near ${formatCurrency(priceFloor)}.`
  }
  if (goal === 'livable' && area.score < 70) {
    return 'Daily convenience looks better than pure investment upside here.'
  }
  if (livability < 65) {
    return 'Strong investment signals, but daily-use amenities are still uneven.'
  }
  if (affordability < 35) {
    return `Premium market with a higher entry band near ${formatCurrency(priceFloor)}.`
  }

  return 'Verify plot-level legal status and project execution before committing.'
}

function scoreArea(goal: RecommendationGoal, rankedArea: RankedArea) {
  const weights = GOAL_WEIGHTS[goal]
  return Math.round(
    rankedArea.upside * weights.upside +
    rankedArea.stability * weights.stability +
    rankedArea.affordability * weights.affordability +
    rankedArea.livability * weights.livability,
  )
}

export function getGoalTopAreas(areas: MicroMarket[], goal: RecommendationGoal, count: number) {
  return rankAreasForGoal(areas, goal).slice(0, count)
}

export function rankAreasForGoal(areas: MicroMarket[], goal: RecommendationGoal): RecommendationResult[] {
  return toRankedAreas(areas)
    .map((rankedArea) => ({
      area: rankedArea.area,
      matchScore: scoreArea(goal, rankedArea),
      reasons: buildReasons(goal, rankedArea),
      caution: buildCaution(goal, rankedArea),
    }))
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
      if (b.area.score !== a.area.score) return b.area.score - a.area.score
      return b.area.yoy - a.area.yoy
    })
}

export function getAlternativeAreas(
  areas: MicroMarket[],
  currentArea: MicroMarket,
  goal: RecommendationGoal,
  count: number,
) {
  return rankAreasForGoal(
    areas.filter((area) => area.slug !== currentArea.slug),
    goal,
  ).slice(0, count)
}
