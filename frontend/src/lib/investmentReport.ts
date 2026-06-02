import type { DataConfidence, MicroMarket } from '@/types'

export type InvestmentVerdict = 'Buy' | 'Wait' | 'Avoid' | 'Investigate'

export interface InvestmentReportSummary {
  verdict: InvestmentVerdict
  bestFor: string
  mainUpside: string
  mainRisk: string
  nextVerification: string
  confidenceLabel: DataConfidence
}

function signalValue(value: number | null | undefined) {
  return typeof value === 'number' ? value : 0
}

export function getInvestmentReportSummary(area: MicroMarket): InvestmentReportSummary {
  const confidence = area.dataConfidence ?? 'estimated'
  const score = area.score ?? 0
  const signals = area.signals
  const mainUpside = area.highlights?.[0] ?? 'Location has measurable market signals, but evidence is limited.'

  const legalRisk = signalValue(signals.rera) < 45
    ? 'RERA and approval visibility is weak for this market.'
    : 'Project-level title, RERA, and approval status still need independent verification.'

  if (score >= 78 && confidence !== 'estimated' && confidence !== 'uncovered') {
    return {
      verdict: 'Buy',
      bestFor: '3-7 year investment shortlist',
      mainUpside,
      mainRisk: legalRisk,
      nextVerification: 'Check exact project approvals, title chain, EC, road access, and current quoted price.',
      confidenceLabel: confidence,
    }
  }

  if (score >= 60) {
    return {
      verdict: 'Investigate',
      bestFor: 'Selective buying after site and document checks',
      mainUpside,
      mainRisk: legalRisk,
      nextVerification: 'Compare at least two nearby areas and verify seller documents before negotiation.',
      confidenceLabel: confidence,
    }
  }

  if (score >= 45) {
    return {
      verdict: 'Wait',
      bestFor: 'Long-horizon watchlist',
      mainUpside,
      mainRisk: 'Infrastructure, demand, or approval signals are not strong enough for fast conviction.',
      nextVerification: 'Wait for stronger infra execution, RERA activity, or price discovery before committing.',
      confidenceLabel: confidence,
    }
  }

  return {
    verdict: 'Avoid',
    bestFor: 'Not recommended without strong local evidence',
    mainUpside,
    mainRisk: 'Current signals are too weak or too uncertain for buyer-side confidence.',
    nextVerification: 'Only proceed if independent legal, access, and pricing checks strongly contradict the model.',
    confidenceLabel: confidence,
  }
}

export const BUYER_DUE_DILIGENCE_CHECKLIST = [
  'TG-RERA registration number, project status, promoter name, validity, and latest quarterly updates',
  'Written reason RERA does not apply, if the project is not registered',
  'Mother deed and complete title chain',
  'Latest encumbrance certificate from the correct SRO for the full review period requested by your lawyer',
  'HMDA, DTCP, or local authority layout approval',
  'Building permission, sanctioned plan, completion certificate, or occupancy certificate where applicable',
  'Land conversion and zoning permission',
  'Revenue record, mutation, pattadar passbook, or municipal record consistency where applicable',
  'Survey number match with physical plot boundaries',
  'Road access width and public/private access status',
  'Lake, forest, nala, buffer, or litigation risk check',
  'Draft sale agreement, payment schedule, GST, corpus, development charges, and cancellation terms',
  'Seller authority, power of attorney, NOCs, property tax, utility dues, and society handover status where applicable',
  'Current market quote compared with nearby registered or broker-verified transactions',
] as const
