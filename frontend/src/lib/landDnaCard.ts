import type { MicroMarket } from '@/types'
import { CITIES, type CityEntry } from '@/data/cities'
import type { GrowthForecast } from '@/lib/forecast/growthForecast'
import { getScoreLabel } from '@/lib/utils'

export type CardMetricConfidence = 'high' | 'medium' | 'low'

export interface CardMetric {
  key: string
  label: string
  value: string | number | null
  sublabel?: string | null
  available: boolean
  priority: number
  source?: string
  confidence?: CardMetricConfidence
  layout?: 'compact' | 'wide'
}

export interface LandDnaCardMatch {
  area: MicroMarket
  city: CityEntry
  areaCode: string
}

const INVALID_VALUES = new Set(['not available yet', 'n/a', 'na', 'requires historical data'])

export function getLandDnaAreaCode(cityName: string, area: MicroMarket) {
  const city = cityName.slice(0, 3).toUpperCase()
  const areaCode = area.name
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X')
  return `${city}-${areaCode}-${String(area.score).padStart(3, '0')}`
}

export function getLandDnaCardPath(cityName: string, area: MicroMarket) {
  return `/card/${getLandDnaAreaCode(cityName, area)}`
}

export function getLandDnaCardPathForArea(area: MicroMarket) {
  const city = Object.values(CITIES).find(entry => entry.areas.some(candidate => candidate.slug === area.slug))
  return getLandDnaCardPath(city?.meta.name ?? 'Hyderabad', area)
}

export function findLandDnaCardMatch(identifier: string | undefined): LandDnaCardMatch | null {
  if (!identifier) return null
  const normalized = identifier.trim().toLowerCase()

  for (const city of Object.values(CITIES)) {
    for (const area of city.areas) {
      const areaCode = getLandDnaAreaCode(city.meta.name, area)
      if (area.slug.toLowerCase() === normalized || areaCode.toLowerCase() === normalized) {
        return { area, city, areaCode }
      }
    }
  }

  return null
}

export function isMetricAvailable(value: CardMetric['value'], sublabel?: CardMetric['sublabel'], confidence?: CardMetricConfidence) {
  if (value === null || value === undefined) return false
  if (confidence === 'low') return false

  const normalizedValue = String(value).trim().toLowerCase()
  if (!normalizedValue || INVALID_VALUES.has(normalizedValue)) return false

  const normalizedSublabel = String(sublabel ?? '').trim().toLowerCase()
  if (normalizedSublabel === 'requires historical data' && !normalizedValue) return false

  return true
}

export function createCardMetric(metric: Omit<CardMetric, 'available'>): CardMetric {
  return {
    ...metric,
    available: isMetricAvailable(metric.value, metric.sublabel, metric.confidence),
  }
}

export function forecastMultiple(forecast: GrowthForecast | null, years: 5 | 10) {
  if (!forecast) return null
  const annualMidpoint = (forecast.twelve_month_growth.min + forecast.twelve_month_growth.max) / 2 / 100
  const multiplier = Math.pow(1 + annualMidpoint, years)
  return `${multiplier.toFixed(1)}x`
}

export function getLandDnaCardMetrics(area: MicroMarket, forecast: GrowthForecast | null): CardMetric[] {
  const fiveYearOutlook = forecastMultiple(forecast, 5)
  const tenYearOutlook = forecastMultiple(forecast, 10)
  const activeProject = area.activeProjects?.[0]
  const confidence = area.dataConfidence === 'verified' ? 'high' : area.dataConfidence === 'partial' ? 'medium' : 'low'

  return [
    createCardMetric({
      key: 'infrastructure',
      label: 'Infrastructure Readiness',
      value: area.signals.infrastructure === null ? null : `${area.signals.infrastructure} / 100`,
      priority: 4,
      confidence: 'medium',
      layout: 'compact',
    }),
    createCardMetric({
      key: 'connectivity',
      label: 'Connectivity Signal',
      value: area.livability?.connectivity ? `${area.livability.connectivity} / 100 locality connectivity` : null,
      priority: 5,
      confidence: 'medium',
      layout: 'compact',
    }),
    createCardMetric({
      key: 'development',
      label: 'Nearby Development Signal',
      value: area.highlights[0] ?? null,
      priority: 6,
      confidence: 'medium',
      layout: 'wide',
    }),
    createCardMetric({
      key: 'growth-5y',
      label: '5-Year Growth Outlook',
      value: fiveYearOutlook,
      sublabel: fiveYearOutlook ? 'indicative outlook' : 'requires historical data',
      priority: 7,
      confidence: fiveYearOutlook ? 'medium' : undefined,
      layout: 'compact',
    }),
    createCardMetric({
      key: 'growth-10y',
      label: '10-Year Growth Outlook',
      value: tenYearOutlook,
      sublabel: tenYearOutlook ? 'indicative outlook' : 'requires historical data',
      priority: 8,
      confidence: tenYearOutlook ? 'medium' : undefined,
      layout: 'compact',
    }),
    createCardMetric({
      key: 'signal-class',
      label: 'Signal Class',
      value: getScoreLabel(area.score),
      priority: 9,
      confidence: 'medium',
      layout: 'compact',
    }),
    createCardMetric({
      key: 'access-class',
      label: 'Access Class',
      value: area.category,
      priority: 10,
      confidence: 'medium',
      layout: 'compact',
    }),
    createCardMetric({
      key: 'active-project',
      label: 'Expansion Signal',
      value: activeProject?.name ?? null,
      sublabel: activeProject?.status?.replace(/_/g, ' ') ?? null,
      priority: 11,
      confidence: activeProject?.impact === 'low' ? 'low' : 'medium',
      layout: 'wide',
    }),
    createCardMetric({
      key: 'confidence',
      label: 'Confidence',
      value: area.dataConfidence ? area.dataConfidence : null,
      priority: 12,
      confidence,
      layout: 'compact',
    }),
    createCardMetric({
      key: 'data-status',
      label: 'Data Status',
      value: area.dataAsOf ? `Updated ${area.dataAsOf}` : null,
      priority: 13,
      confidence: 'medium',
      layout: 'compact',
    }),
    createCardMetric({
      key: 'evidence-count',
      label: 'Evidence Count',
      value: area.signalsAvailable ? `${area.signalsAvailable} signal classes` : null,
      priority: 14,
      confidence: 'medium',
      layout: 'compact',
    }),
  ].filter(metric => metric.available).sort((a, b) => a.priority - b.priority)
}

export async function exportLandDnaCardPng(node: HTMLElement, areaCode: string) {
  const { toPng } = await import('html-to-image')
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#050a14',
    style: {
      margin: '0',
    },
  })

  const link = document.createElement('a')
  link.download = `plotdna-area-pass-${areaCode}.png`
  link.href = dataUrl
  link.click()
}
