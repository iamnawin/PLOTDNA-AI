import type { CityMeta, DataConfidence, MicroMarket } from '@/types'
import { HYDERABAD_VERIFIED_PRIORITY_SET } from '@/data/hyderabadPriority'

export interface CityProductionProfile {
  slug: string
  name: string
  isFlagship: boolean
  label: string
  summary: string
  totalLocalities: number
  verifiedCount: number
  partialCount: number
  estimatedCount: number
  uncoveredCount: number
  activeProjectCount: number
  averageScore: number
  priorityTarget: number
}

interface CityProductionOverride {
  isFlagship: boolean
  label: string
  summary: string
  priorityTarget: number
}

const CITY_PRODUCTION_OVERRIDES: Record<string, CityProductionOverride> = {
  hyderabad: {
    isFlagship: true,
    label: 'Flagship production city',
    summary: 'Hyderabad is the production reference market with the deepest locality coverage and the first buyer-trust workflow.',
    priorityTarget: 50,
  },
}

export const CONFIDENCE_META: Record<DataConfidence, { label: string; tone: string; description: string }> = {
  verified: {
    label: 'Verified',
    tone: '#10b981',
    description: 'Source-backed locality record',
  },
  partial: {
    label: 'Partial',
    tone: '#f59e0b',
    description: 'Directional record with partial source coverage',
  },
  estimated: {
    label: 'Estimated',
    tone: '#38bdf8',
    description: 'Modeled record for early market screening',
  },
  uncovered: {
    label: 'Uncovered',
    tone: '#94a3b8',
    description: 'Coverage not production-ready yet',
  },
}

export function getConfidenceMeta(confidence?: DataConfidence) {
  return CONFIDENCE_META[confidence ?? 'partial']
}

export function getCityProductionProfile(meta: CityMeta, areas: MicroMarket[]): CityProductionProfile {
  const counts: Record<DataConfidence, number> = {
    verified: 0,
    partial: 0,
    estimated: 0,
    uncovered: 0,
  }

  let activeProjectCount = 0
  let scoreTotal = 0

  areas.forEach(area => {
    const confidence: DataConfidence = meta.slug === 'hyderabad' && HYDERABAD_VERIFIED_PRIORITY_SET.has(area.slug)
      ? 'verified'
      : area.dataConfidence ?? 'partial'
    counts[confidence] += 1
    scoreTotal += area.score
    if ((area.activeProjects?.length ?? 0) > 0) activeProjectCount += 1
  })

  const override = CITY_PRODUCTION_OVERRIDES[meta.slug]
  const totalLocalities = areas.length

  return {
    slug: meta.slug,
    name: meta.name,
    isFlagship: override?.isFlagship ?? false,
    label: override?.label ?? 'Coverage city',
    summary: override?.summary ?? `${meta.name} has locality-level PlotDNA coverage with confidence labels by market.`,
    totalLocalities,
    verifiedCount: counts.verified,
    partialCount: counts.partial,
    estimatedCount: counts.estimated,
    uncoveredCount: counts.uncovered,
    activeProjectCount,
    averageScore: totalLocalities > 0 ? Math.round(scoreTotal / totalLocalities) : 0,
    priorityTarget: override?.priorityTarget ?? Math.min(25, totalLocalities),
  }
}
