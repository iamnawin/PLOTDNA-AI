import hyderabadPendingSourcesRaw from '../../../data/cities/hyderabad/pending-context-sources.json?raw'

export interface HyderabadPendingOfficialMatch {
  villageName?: string
  mandalName?: string
  districtName?: string
  revenueName?: string
  divisionName?: string
  admin?: string
  dmvCode?: string
  fid?: number
}

export interface HyderabadPendingSourceAudit {
  slug: string
  status: string
  officialMatches?: HyderabadPendingOfficialMatch[]
}

const HYDERABAD_PENDING_SOURCES = JSON.parse(hyderabadPendingSourcesRaw) as {
  sourceAudits: HyderabadPendingSourceAudit[]
}

export const HYDERABAD_PENDING_SOURCE_BY_SLUG: Record<string, HyderabadPendingSourceAudit> = Object.fromEntries(
  HYDERABAD_PENDING_SOURCES.sourceAudits.map(audit => [audit.slug, audit]),
)

export function getHyderabadPendingSource(slug: string | null | undefined): HyderabadPendingSourceAudit | null {
  if (!slug) return null
  return HYDERABAD_PENDING_SOURCE_BY_SLUG[slug] ?? null
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
    typeof match.fid === 'number' ? `TGRAC FID: ${match.fid}` : null,
  ].filter((value): value is string => Boolean(value))
}

export function getPendingSourceStatusLabel(status: string | null | undefined): string | null {
  if (!status) return 'needs non-HMDA boundary source'
  if (status === 'tgrac_village_matched') return 'official boundary source'
  if (status === 'needs_non_hmda_boundary_source') return 'needs non-HMDA boundary source'
  return status.replaceAll('_', ' ')
}
