import type { MicroMarket } from '@/types'
import { getConfidenceMeta } from '@/lib/cityProduction'
import { getInvestmentReportSummary, getBuyerRecommendation } from '@/lib/investmentReport'
import { getBuyerModeForCategory, getVerificationSources } from '@/lib/verificationSources'

export interface StorySignal {
  title: string
  meaning: string
  status: string
  confidence: string
}

export const VERIFICATION_GROUPS = [
  {
    title: 'Documents',
    items: [
      'Mother deed and complete title chain',
      'Latest encumbrance certificate',
      'Sale deed and link documents',
      'Seller identity and ownership',
    ],
  },
  {
    title: 'Approvals',
    items: [
      'TG-RERA registration if applicable',
      'Written reason if RERA does not apply',
      'HMDA, DTCP, or local authority layout approval',
      'Land conversion and zoning permission',
      'Building permission, sanctioned plan, or OC where applicable',
    ],
  },
  {
    title: 'Site Reality',
    items: [
      'Survey number match with physical boundaries',
      'Road access width',
      'Public, private, or layout-internal access status',
      'Boundary stones or fencing',
      'Water, drainage, and electricity',
      'Nearby construction and activity',
    ],
  },
  {
    title: 'Price Sanity',
    items: [
      'Recent nearby registered transaction reference',
      'Broker quote compared with locality strength',
      'Price per sqyd or sqft comparison',
      'Negotiation margin',
    ],
  },
] as const

export const SELLER_QUESTIONS = [
  'Which exact survey number and sub-division is this property under?',
  'Can you show the complete title chain and latest encumbrance certificate?',
  'Which authority approved this layout or project?',
  'If RERA does not apply, can you give the reason in writing?',
  'What recent registered transaction supports this quoted price?',
  'What is the exact road width and access-road status at the property?',
  'Is the access road public, private, or layout-internal?',
  'Are there any pending disputes, mortgages, restrictions, or court issues?',
] as const

const UNCERTAINTIES = [
  'Seller price may already be too high.',
  'Road access may not be good for the exact plot.',
  'Papers or approval may not be clean.',
  'The area may grow, but your plot may still be hard to resell.',
] as const

function signalStatus(value: number | null | undefined) {
  const score = value ?? 0
  if (score >= 75) return 'Looks strong'
  if (score >= 55) return 'Looks okay'
  if (score >= 40) return 'Needs care'
  return 'Needs checking'
}

export function buildAreaStoryBrief(area: MicroMarket, citySlug: string, usesNearbySignals = false) {
  const confidence = getConfidenceMeta(area.dataConfidence)
  const summary = getInvestmentReportSummary(area)
  const highlights = area.highlights.filter(Boolean)
  const mode = getBuyerModeForCategory(area.category)
  const sources = getVerificationSources(area, citySlug).filter(source => source.applicableModes.includes(mode))
  const signals: StorySignal[] = [
    {
      title: 'Roads and nearby development',
      meaning: highlights[0] ?? 'Road access, utilities, and commute reliability still need a site check.',
      status: signalStatus(area.signals.infrastructure),
      confidence: confidence.description,
    },
    {
      title: 'Building activity nearby',
      meaning: highlights[2] ?? 'Use visible construction and approved layout activity as ground-level evidence.',
      status: signalStatus(area.signals.satellite),
      confidence: 'Check what is happening on the ground',
    },
    {
      title: 'Jobs and buyer demand',
      meaning: highlights[1] ?? 'Employment movement can support demand, but it does not guarantee resale depth.',
      status: signalStatus(area.signals.employment),
      confidence: 'Nearby demand can help, but resale is not guaranteed',
    },
    {
      title: 'Approval check',
      meaning: 'Check the exact layout or project approval independently before paying token.',
      status: signalStatus(area.signals.rera),
      confidence: 'Check the exact project or layout papers',
    },
  ]

  const fallbackWarning = usesNearbySignals
    ? `Nearest area used. We found the nearest available area details for ${area.name}. This is useful for first checking, but your exact plot still needs verification.`
    : null

  return {
    summary,
    confidence,
    signals,
    sources,
    fallbackWarning,
    story: 'People are showing interest in this side because it connects to nearby developed areas and work zones. That can help demand. But every plot is different, so check the road, approval, documents, and price.',
    demandDrivers: highlights.slice(0, 4),
    uncertainties: [
      ...UNCERTAINTIES,
      ...(area.dataConfidence === 'partial' || area.dataConfidence === 'estimated' || area.dataConfidence === 'uncovered'
        ? ['Some details are available, but not everything.']
        : []),
    ],
    buyerMeaning: 'You can keep this area in your shortlist, but do not pay token in a hurry. A good area does not automatically mean every plot is safe or fairly priced.',
    recommendation: getBuyerRecommendation(summary.verdict, area.dataConfidence ?? 'partial'),
    confidenceReasons: [
      'Some area details are available, but not everything.',
      'The exact plot papers have not been checked.',
      'The seller price still needs comparison.',
      'Visit the site and verify documents before deciding.',
    ],
  }
}
