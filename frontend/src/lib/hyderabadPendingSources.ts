import hyderabadPendingSourcesRaw from '../../../data/cities/hyderabad/pending-context-sources.json?raw'
import hyderabadPendingScoringReadinessRaw from '../../../data/cities/hyderabad/pending-scoring-readiness.json?raw'
import hyderabadPendingSignalInventoryRaw from '../../../data/cities/hyderabad/pending-signal-inventory.json?raw'

export interface HyderabadPendingOfficialMatch {
  villageName?: string
  mandalName?: string
  districtName?: string
  revenueName?: string
  divisionName?: string
  admin?: string
  dmvCode?: string
  fid?: number
  sourceKey?: string
  sourceId?: number | string
  sourceIdField?: string
  villageCode?: number | string
  census2011Code?: string
  households?: number
  population?: number
}

export interface HyderabadPendingSourceAudit {
  slug: string
  status: string
  officialMatches?: HyderabadPendingOfficialMatch[]
}

export interface HyderabadPendingScoringReadiness {
  slug: string
  promotionReady: boolean
  missingEvidence: string[]
}

export interface HyderabadPendingSignalInventory {
  slug: string
  signalDeckReady: boolean
  signals: Record<string, {
    status: 'verified' | 'source_identified' | 'missing'
    label?: string
    sourceName?: string
  }>
}

const HYDERABAD_PENDING_SOURCES = JSON.parse(hyderabadPendingSourcesRaw) as {
  sourceAudits: HyderabadPendingSourceAudit[]
}

const HYDERABAD_PENDING_SCORING_READINESS = JSON.parse(hyderabadPendingScoringReadinessRaw) as {
  areaAudits: HyderabadPendingScoringReadiness[]
}

const HYDERABAD_PENDING_SIGNAL_INVENTORY = JSON.parse(hyderabadPendingSignalInventoryRaw) as {
  areaInventories: HyderabadPendingSignalInventory[]
}

export const HYDERABAD_PENDING_SOURCE_BY_SLUG: Record<string, HyderabadPendingSourceAudit> = Object.fromEntries(
  HYDERABAD_PENDING_SOURCES.sourceAudits.map(audit => [audit.slug, audit]),
)

export const HYDERABAD_PENDING_SCORING_READINESS_BY_SLUG: Record<string, HyderabadPendingScoringReadiness> = Object.fromEntries(
  HYDERABAD_PENDING_SCORING_READINESS.areaAudits.map(audit => [audit.slug, audit]),
)

export const HYDERABAD_PENDING_SIGNAL_INVENTORY_BY_SLUG: Record<string, HyderabadPendingSignalInventory> = Object.fromEntries(
  HYDERABAD_PENDING_SIGNAL_INVENTORY.areaInventories.map(inventory => [inventory.slug, inventory]),
)

export function getHyderabadPendingSource(slug: string | null | undefined): HyderabadPendingSourceAudit | null {
  if (!slug) return null
  return HYDERABAD_PENDING_SOURCE_BY_SLUG[slug] ?? null
}

export function getHyderabadPendingScoringReadiness(slug: string | null | undefined): HyderabadPendingScoringReadiness | null {
  if (!slug) return null
  return HYDERABAD_PENDING_SCORING_READINESS_BY_SLUG[slug] ?? null
}

export function getHyderabadPendingSignalInventory(slug: string | null | undefined): HyderabadPendingSignalInventory | null {
  if (!slug) return null
  return HYDERABAD_PENDING_SIGNAL_INVENTORY_BY_SLUG[slug] ?? null
}

export function getOfficialMatchLabel(match: HyderabadPendingOfficialMatch | null | undefined): string | null {
  if (!match) return null
  return [match.villageName, match.mandalName, match.districtName].filter(Boolean).join(' / ') || null
}

export function getOfficialMatchDetails(match: HyderabadPendingOfficialMatch | null | undefined): string[] {
  if (!match) return []
  return [
    match.revenueName ? `Revenue: ${match.revenueName}` : null,
    match.divisionName ? `Division: ${match.divisionName}` : null,
    match.admin ? `Admin: ${match.admin}` : null,
    match.dmvCode ? `DMV code: ${match.dmvCode}` : null,
    match.villageCode ? `Village code: ${match.villageCode}` : null,
    match.census2011Code ? `Census 2011: ${match.census2011Code}` : null,
    typeof match.population === 'number' ? `Population: ${Math.round(match.population).toLocaleString('en-IN')}` : null,
    typeof match.households === 'number' ? `Households: ${Math.round(match.households).toLocaleString('en-IN')}` : null,
    typeof match.fid === 'number' ? `TGRAC FID: ${match.fid}` : null,
    match.sourceId && match.sourceIdField && match.sourceIdField !== 'FID' ? `TGRAC ${match.sourceIdField}: ${match.sourceId}` : null,
  ].filter((value): value is string => Boolean(value))
}

export function getPendingSourceStatusLabel(status: string | null | undefined): string | null {
  if (!status) return 'needs non-HMDA boundary source'
  if (status === 'tgrac_village_matched') return 'official boundary source'
  if (status === 'tgrac_statewide_village_matched') return 'official boundary source'
  if (status === 'needs_non_hmda_boundary_source') return 'needs non-HMDA boundary source'
  return status.replaceAll('_', ' ')
}

export function getMissingScoreSignalLabels(readiness: HyderabadPendingScoringReadiness | null | undefined): string[] {
  if (!readiness || readiness.promotionReady) return []
  const labels: Record<string, string> = {
    price_band: 'price band',
    rera_activity: 'RERA activity',
    infrastructure: 'infrastructure',
    satellite_growth: 'satellite growth',
    employment: 'employment',
    government_scheme: 'government scheme',
  }
  return readiness.missingEvidence
    .filter(key => key !== 'official_boundary')
    .map(key => labels[key] ?? key.replaceAll('_', ' '))
}

export function getIdentifiedSignalSourceLabels(inventory: HyderabadPendingSignalInventory | null | undefined): string[] {
  if (!inventory) return []
  return Object.values(inventory.signals)
    .filter(signal => signal.status === 'source_identified')
    .map(signal => signal.label && signal.sourceName ? `${signal.label}: ${signal.sourceName}` : signal.label ?? signal.sourceName)
    .filter((value): value is string => Boolean(value))
}
