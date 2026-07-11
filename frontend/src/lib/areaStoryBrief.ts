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
  'Exact plot access and road width can differ on the ground.',
  'Approval and title quality must be checked for the specific property.',
  'The seller quote may already include expected future growth.',
  'Drainage, utilities, and development quality can vary by layout.',
] as const

function signalStatus(value: number | null | undefined) {
  const score = value ?? 0
  if (score >= 75) return 'Strong area signal'
  if (score >= 55) return 'Moderate area signal'
  if (score >= 40) return 'Weak area signal'
  return 'Needs verification'
}

export function buildAreaStoryBrief(area: MicroMarket, citySlug: string, usesNearbySignals = false) {
  const confidence = getConfidenceMeta(area.dataConfidence)
  const summary = getInvestmentReportSummary(area)
  const highlights = area.highlights.filter(Boolean)
  const mode = getBuyerModeForCategory(area.category)
  const sources = getVerificationSources(area, citySlug).filter(source => source.applicableModes.includes(mode))
  const signals: StorySignal[] = [
    {
      title: 'Infrastructure readiness',
      meaning: highlights[0] ?? 'Road access, utilities, and commute reliability still need a site check.',
      status: signalStatus(area.signals.infrastructure),
      confidence: `${confidence.label} locality data`,
    },
    {
      title: 'Development activity',
      meaning: highlights[2] ?? 'Use visible construction and approved layout activity as ground-level evidence.',
      status: signalStatus(area.signals.satellite),
      confidence: 'Area signal',
    },
    {
      title: 'Employment and demand',
      meaning: highlights[1] ?? 'Employment movement can support demand, but it does not guarantee resale depth.',
      status: signalStatus(area.signals.employment),
      confidence: 'Area signal',
    },
    {
      title: 'Approvals visibility',
      meaning: 'Check the exact layout or project approval independently before paying token.',
      status: signalStatus(area.signals.rera),
      confidence: 'Needs property verification',
    },
  ]

  const storyEvidence = highlights.slice(0, 2).join(' ') || 'The available locality signals are directional and require property-level checks.'
  const fallbackWarning = usesNearbySignals
    ? 'This is based on nearby locality signals, not exact plot-level verification.'
    : null

  return {
    summary,
    confidence,
    signals,
    sources,
    fallbackWarning,
    story: `${area.name} is being screened through available locality infrastructure, demand, development, and approval signals. ${storyEvidence} Exact access, approvals, seller price, and document quality decide whether a property is safe to shortlist.`,
    demandDrivers: highlights.slice(0, 4),
    uncertainties: [
      ...UNCERTAINTIES,
      ...(area.dataConfidence === 'partial' || area.dataConfidence === 'estimated' || area.dataConfidence === 'uncovered'
        ? ['Current source coverage is partial and needs external confirmation.']
        : []),
    ],
    buyerMeaning: `${area.name} may be worth shortlisting only when the property has clean access, suitable approvals, a fair quote, and complete documents. Do not pay token only because the locality shows growth signals.`,
    recommendation: getBuyerRecommendation(summary.verdict, area.dataConfidence ?? 'partial'),
    confidenceReasons: [
      'Nearby locality signals are available.',
      'Exact plot documents have not been verified.',
      'Current pricing needs external confirmation.',
      'Data-source coverage may be partial.',
    ],
  }
}
