import type { MicroMarket } from '@/types'

export interface BuyerBriefInput {
  name?: string
  contact?: string
  email?: string
  phone?: string
  budgetRange?: string
  timeline?: string
  notes?: string
}

export interface BuyerBriefSection {
  id: 'buyer_context' | 'verification_priorities' | 'seller_questions' | 'price_sanity' | 'risk_flags' | 'next_actions'
  title: string
  items: string[]
}

export interface CustomBuyerVerificationBrief {
  title: 'Custom Buyer Verification Brief'
  audience: string
  areaLine: string
  scoreLine: string
  priceLine: string
  positioning: string
  sections: BuyerBriefSection[]
  disclaimer: string
}

function clean(value: string | undefined) {
  return value?.trim() || ''
}

function firstHighlight(area: MicroMarket) {
  return area.highlights?.[0] || 'This market has measurable PlotDNA signals, but project-level checks are still required.'
}

function riskFromSignals(area: MicroMarket) {
  const rera = area.signals?.rera ?? 0
  const infrastructure = area.signals?.infrastructure ?? 0

  if (rera < 45) {
    return 'RERA and approval visibility is weak here, so project registration, layout approval, and applicability need priority checks.'
  }
  if (infrastructure < 55) {
    return 'Infrastructure score is moderate, so road access, utilities, drainage, and commute reliability need ground verification.'
  }
  return 'Project-level title, RERA, approvals, road access, and quoted pricing still need independent verification.'
}

function buildBuyerContext(input: BuyerBriefInput) {
  const items = [
    clean(input.budgetRange) ? `Budget range: ${clean(input.budgetRange)}.` : 'Budget range: not shared. Confirm affordability before shortlisting projects.',
    clean(input.timeline) ? `Decision timeline: ${clean(input.timeline)}.` : 'Decision timeline: not shared. Use this brief as a pre-site-visit checklist.',
  ]

  if (clean(input.notes)) {
    items.push(`Buyer notes: ${clean(input.notes)}`)
  } else {
    items.push('Buyer notes: not shared. Add project name, survey number, seller quote, and site-visit observations before final review.')
  }

  return items
}

export function buildCustomBuyerVerificationBrief(
  area: MicroMarket,
  input: BuyerBriefInput = {},
): CustomBuyerVerificationBrief {
  const buyerName = clean(input.name)
  const audience = buyerName ? `Prepared for ${buyerName}` : 'Prepared for buyer review'
  const cityLine = `${area.name} / ${area.category}`
  const priceLine = `${area.priceRange} quoted band; compare with current seller quote before negotiation.`
  const scoreLine = `${area.score}/100 PlotDNA score with ${area.dataConfidence ?? 'estimated'} data confidence.`
  const mainRisk = riskFromSignals(area)

  return {
    title: 'Custom Buyer Verification Brief',
    audience,
    areaLine: cityLine,
    scoreLine,
    priceLine,
    positioning: 'A buyer-side verification brief for one serious location or project decision. This is not legal due diligence or investment advice.',
    disclaimer: 'PlotDNA provides buyer-side screening and verification guidance. Title, RERA, zoning, approvals, access, utilities, and legal opinions must be checked independently with qualified professionals before committing capital.',
    sections: [
      {
        id: 'buyer_context',
        title: 'Buyer context',
        items: buildBuyerContext(input),
      },
      {
        id: 'verification_priorities',
        title: 'Verification priorities',
        items: [
          'Confirm exact project or plot identity: project name, survey number, boundaries, and seller authority.',
          'Check RERA registration or written reason RERA does not apply; verify layout approval and sanction status.',
          'Review title chain, mother deed, latest encumbrance certificate, and any mortgage or litigation flags.',
          'Verify road access width, public/private access status, utilities, drainage, and physical approach quality.',
          mainRisk,
        ],
      },
      {
        id: 'seller_questions',
        title: 'Questions to ask seller or broker',
        items: [
          'What is the exact survey number, plot number, and layout approval reference?',
          'Who is the current title holder, and can they share the full title chain and latest EC?',
          'Is the quoted price inclusive of registration, development, corpus, GST, or other charges?',
          'What are the nearest sold comparables or registered transactions supporting this quote?',
          'Are there lake, nala, forest, road-widening, litigation, or buffer-zone restrictions nearby?',
        ],
      },
      {
        id: 'price_sanity',
        title: 'Price sanity',
        items: [
          `Area band: ${area.priceRange}. Treat seller quotes above this band as negotiation risk unless supported by project quality or registered comps.`,
          `Market momentum: +${area.yoy}% YoY signal. Use this as directional context, not a guaranteed return.`,
          firstHighlight(area),
          'Before token advance, compare at least two nearby projects or plots with similar access, approvals, and possession status.',
        ],
      },
      {
        id: 'risk_flags',
        title: 'Risk flags',
        items: [
          'Do not rely only on broker screenshots, WhatsApp claims, or brochure promises.',
          'Avoid paying token until title, RERA or approval status, access, and quote basis are independently checked.',
          'If the plot is far from existing access or utilities, treat infrastructure timing as a separate risk.',
        ],
      },
      {
        id: 'next_actions',
        title: 'Next actions',
        items: [
          'Collect project documents and seller quote in writing.',
          'Visit the exact plot or project entrance and record road width, utilities, drainage, and nearby land use.',
          'Run legal/title review with a qualified lawyer before advance payment.',
          'Update this brief with project documents for a final buyer verification pass.',
        ],
      },
    ],
  }
}
