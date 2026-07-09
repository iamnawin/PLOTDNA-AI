import type { DataConfidence, MicroMarket } from '@/types'
import { getScoreColor } from '@/lib/utils'
import { getInvestmentReportSummary, type InvestmentVerdict } from '@/lib/investmentReport'

export type SignalSeverity = 'good' | 'neutral' | 'watch' | 'unknown'

export interface DNASignalCardModel {
  key: string
  label: string
  status: string
  description: string
  severity: SignalSeverity
}

export interface DNARiskModel {
  label: string
  status: string
  description: string
  severity: SignalSeverity
}

export interface DNARecommendationModel {
  headline: string
  why: string
  nextSteps: string[]
}

export interface DNAMapEvidenceModel {
  areaName: string
  cityName: string
  precisionLabel: string
  note: string
  mapHref: string
}

export interface LocationDNAViewModel {
  locationName: string
  cityName: string
  dnaScore: number
  verdictZone: string
  verdictColor: string
  bestFor: string
  summary: string
  signals: DNASignalCardModel[]
  risks: DNARiskModel[]
  recommendation: DNARecommendationModel
  mapEvidence: DNAMapEvidenceModel
}

/**
 * User-facing "zone" language for the guided DNA experience — deliberately
 * separate from getScoreLabel()'s Goldzone/Good Growth/Moderate/High Risk
 * tiers, which drive map legend + polygon coloring and must stay stable.
 */
export function getVerdictZoneLabel(score: number): string {
  if (score >= 85) return 'Premium Growth Zone'
  if (score >= 70) return 'Good Growth Zone'
  if (score >= 55) return 'Emerging / Watch Zone'
  if (score >= 40) return 'Caution Zone'
  return 'Weak / High-Risk Zone'
}

function describeSignal(value: number | null | undefined): { status: string; severity: SignalSeverity } {
  if (value === null || value === undefined) return { status: 'Needs Verification', severity: 'unknown' }
  if (value >= 75) return { status: 'Strong', severity: 'good' }
  if (value >= 55) return { status: 'Improving', severity: 'good' }
  if (value >= 35) return { status: 'Developing', severity: 'neutral' }
  return { status: 'Limited', severity: 'watch' }
}

function priceHypeLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Unclear'
  if (value >= 75) return 'High'
  if (value >= 45) return 'Medium'
  return 'Low'
}

function coverageRisk(confidence: DataConfidence): { status: string; severity: SignalSeverity } {
  switch (confidence) {
    case 'verified':
      return { status: 'Low Risk', severity: 'good' }
    case 'partial':
      return { status: 'Medium Risk', severity: 'neutral' }
    case 'estimated':
      return { status: 'Needs Verification', severity: 'watch' }
    default:
      return { status: 'Insufficient Data', severity: 'watch' }
  }
}

function average(values: Array<number | null | undefined>): number | null {
  const known = values.filter((v): v is number => typeof v === 'number')
  if (known.length === 0) return null
  return Math.round(known.reduce((sum, v) => sum + v, 0) / known.length)
}

const RECOMMENDATION_HEADLINE: Record<InvestmentVerdict, string> = {
  Buy: 'Shortlist, but verify documents.',
  Investigate: 'Compare and verify before deciding.',
  Wait: 'Add this to your watchlist.',
  Avoid: 'Avoid for now — evidence is weak.',
}

interface BuildLocationDNAViewModelOptions {
  cityName: string
  citySlug: string
  mapHref: string
  confidence?: DataConfidence
}

/**
 * Adapts existing MicroMarket/score/signal data into the plain-language
 * shape the guided DNA screens render. Never invents a value — every field
 * here is derived from area.score/signals/highlights or the existing
 * getInvestmentReportSummary() output.
 */
export function buildLocationDNAViewModel(
  area: MicroMarket,
  options: BuildLocationDNAViewModelOptions,
): LocationDNAViewModel {
  const confidence = options.confidence ?? area.dataConfidence ?? 'estimated'
  const summary = getInvestmentReportSummary({ ...area, dataConfidence: confidence })
  const { signals } = area

  const growth = describeSignal(average([signals.satellite, signals.population]))
  const infra = describeSignal(signals.infrastructure)
  const priceHeat = describeSignal(signals.priceVelocity)
  const approval = describeSignal(signals.rera)
  const fitSeverity: SignalSeverity =
    summary.verdict === 'Buy' ? 'good' : summary.verdict === 'Avoid' ? 'watch' : 'neutral'

  const signalCards: DNASignalCardModel[] = [
    {
      key: 'growth',
      label: 'Growth Signal',
      status: growth.status,
      description: area.highlights?.[0] ?? 'Population and satellite change trends for this zone.',
      severity: growth.severity,
    },
    {
      key: 'infrastructure',
      label: 'Infrastructure Signal',
      status: infra.status,
      description: 'Connectivity, roads, and access development around this area.',
      severity: infra.severity,
    },
    {
      key: 'price-heat',
      label: 'Price Heat',
      status: priceHeat.status,
      description: `Current quoted band: ${area.priceRange}. Not every pocket in this zone carries the same value.`,
      severity: priceHeat.severity,
    },
    {
      key: 'approval-clarity',
      label: 'Approval Clarity',
      status: approval.severity === 'good' ? 'Reported Active — Verify Details' : 'Needs Verification',
      description: 'Official plot-level and layout approvals should be checked before purchase.',
      severity: approval.severity === 'good' ? 'neutral' : 'watch',
    },
    {
      key: 'investment-fit',
      label: 'Investment Fit',
      status: summary.bestFor,
      description: summary.mainUpside,
      severity: fitSeverity,
    },
  ]

  const coverage = coverageRisk(confidence)
  const risks: DNARiskModel[] = [
    {
      label: 'Approval Clarity',
      status: 'Needs Verification',
      description: summary.mainRisk,
      severity: 'watch',
    },
    {
      label: 'Price Hype',
      status: priceHypeLabel(signals.priceVelocity),
      description: `Current quoted band: ${area.priceRange}. Compare with nearby localities before negotiating.`,
      severity: priceHypeLabel(signals.priceVelocity) === 'High' ? 'watch' : 'neutral',
    },
    {
      label: 'Data Coverage',
      status: coverage.status,
      description:
        'PlotDNA provides area-level location intelligence. Combine this with official land records before purchase.',
      severity: coverage.severity,
    },
  ]

  const recommendation: DNARecommendationModel = {
    headline: RECOMMENDATION_HEADLINE[summary.verdict],
    why: summary.mainRisk,
    nextSteps: [
      summary.nextVerification,
      'Compare this area with a nearby locality before shortlisting.',
      'Generate a DNA report before discussing with your broker or family.',
    ],
  }

  const mapEvidence: DNAMapEvidenceModel = {
    areaName: area.name,
    cityName: options.cityName,
    precisionLabel:
      confidence === 'verified' ? 'Verified zone' : confidence === 'partial' ? 'Partial evidence zone' : 'Estimated zone',
    note:
      confidence === 'verified'
        ? 'We analyzed this zone based on verified locality signals.'
        : 'Exact plot-level verification is not available yet. This report shows area-level intelligence and should be combined with official land records before purchase.',
    mapHref: options.mapHref,
  }

  return {
    locationName: area.name,
    cityName: options.cityName,
    dnaScore: area.score,
    verdictZone: getVerdictZoneLabel(area.score),
    verdictColor: getScoreColor(area.score),
    bestFor: summary.bestFor,
    summary: `${summary.mainUpside} ${summary.mainRisk}`,
    signals: signalCards,
    risks,
    recommendation,
    mapEvidence,
  }
}
