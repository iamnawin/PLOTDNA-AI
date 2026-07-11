import { getAreaSources } from '@/lib/areaSources'
import type { Category, MicroMarket } from '@/types'

export type BuyerMode = 'plot' | 'flat' | 'house' | 'area'

export interface VerificationSourceCard {
  id: string
  title: string
  description: string
  sourceType: string
  statusLabel: string
  warning: string
  applicableModes: BuyerMode[]
  url: string | null
}

interface VerificationSourceShell {
  id: string
  title: string
  description: string
  sourceType: string
  statusLabel: string
  warning: string
  applicableModes: BuyerMode[]
  titleMatch: RegExp | null
}

// Fixed card shells — static copy per approved product spec.
// `titleMatch` picks a real gov-type URL from getAreaSources(); no match → url: null (card still renders).
const VERIFICATION_SOURCE_SHELLS: VerificationSourceShell[] = [
  {
    id: 'rera',
    title: 'RERA project check',
    description: 'Confirm the project or layout is registered with RERA before paying any booking amount.',
    sourceType: 'gov',
    statusLabel: 'User must verify',
    warning: 'Some land/plot cases may not be RERA applicable. Ask the seller for written reason if RERA does not apply.',
    applicableModes: ['plot', 'flat', 'house', 'area'],
    titleMatch: /RERA/i,
  },
  {
    id: 'land_records',
    title: 'Land records / land status',
    description: 'Check the land classification and ownership trail through official land record portals before committing.',
    sourceType: 'gov',
    statusLabel: 'User must verify',
    warning: 'PlotDNA does not certify ownership or title. Use official records and legal review.',
    applicableModes: ['plot', 'area'],
    titleMatch: /HMDA|Bhu|Land Records|BBMP|BDA|CMDA|PMC|MMRDA|DDA/i,
  },
  {
    id: 'market_value',
    title: 'Government market value reference',
    description: 'Look up the official guideline value for the area to sanity-check the quoted price.',
    sourceType: 'gov',
    statusLabel: 'Reference only',
    warning: 'Official market value is a reference/guideline value, not guaranteed current market price.',
    applicableModes: ['plot', 'flat', 'house', 'area'],
    titleMatch: null,
  },
  {
    id: 'planning',
    title: 'Planning / master plan check',
    description: 'Verify the area’s zoning and master plan status so future land use matches what you expect.',
    sourceType: 'gov',
    statusLabel: 'User must verify',
    warning: 'Planning context can change. Verify latest official notifications before decision.',
    applicableModes: ['plot', 'house', 'area'],
    titleMatch: /Master Plan|HMDA|BDA|CMDA|Development Plan|BBMP|Planning/i,
  },
  {
    id: 'encumbrance',
    title: 'Encumbrance and title review',
    description: 'Get an encumbrance certificate and legal title review done by a qualified lawyer before purchase.',
    sourceType: 'gov',
    statusLabel: 'Legal review required',
    warning: 'PlotDNA does not provide title clearance.',
    applicableModes: ['plot', 'flat', 'house'],
    titleMatch: null,
  },
  {
    id: 'site_visit',
    title: 'Ground reality / site visit',
    description: 'Visit the site yourself to check what data and photos alone cannot confirm.',
    sourceType: 'manual',
    statusLabel: 'Physical verification required',
    warning: 'Verify exact road width, access road type, boundaries, utilities, drainage, nearby construction, and local issues in person.',
    applicableModes: ['plot', 'flat', 'house', 'area'],
    titleMatch: null,
  },
]

/**
 * Maps the DNA score Category enum to the buyer-facing mode vocabulary used
 * to filter verification-source cards. All areas here are locality-level
 * micro-markets rather than individual listings, so most categories map to
 * 'area'; 'Emerging' areas skew toward raw plot investment.
 */
export function getBuyerModeForCategory(category: Category): BuyerMode {
  switch (category) {
    case 'Established':
      return 'area'
    case 'High Growth':
      return 'area'
    case 'Emerging':
      return 'plot'
    case 'Industrial':
      return 'area'
    default:
      return 'area'
  }
}

export function getVerificationSources(area: MicroMarket, citySlug: string): VerificationSourceCard[] {
  const sources = getAreaSources(area.slug, citySlug)

  return VERIFICATION_SOURCE_SHELLS.map((shell) => {
    const matched = shell.titleMatch
      ? sources.find((source) => source.type === 'gov' && shell.titleMatch!.test(source.title))
      : undefined

    return {
      id: shell.id,
      title: shell.title,
      description: shell.description,
      sourceType: shell.sourceType,
      statusLabel: shell.statusLabel,
      warning: shell.warning,
      applicableModes: shell.applicableModes,
      url: matched ? matched.url : null,
    }
  })
}
