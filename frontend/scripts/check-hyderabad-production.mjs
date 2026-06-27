import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd(), '..')
const localitiesPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'localities.json')
const coveragePath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'coverage-areas.geojson')
const boundaryPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'coverage-boundary.geojson')
const aliasesPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'aliases.json')
const pendingSourcesPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'pending-context-sources.json')
const pendingBoundariesPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'tgrac-pending-village-boundaries.geojson')
const pendingScoringReadinessPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'pending-scoring-readiness.json')
const pendingSignalInventoryPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'pending-signal-inventory.json')
const pendingPriceSignalsPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'pending-price-signals.json')
const hyderabadDataPath = path.join(process.cwd(), 'src', 'data', 'hyderabad.ts')
const productionHelperPath = path.join(process.cwd(), 'src', 'lib', 'cityProduction.ts')
const priorityPath = path.join(process.cwd(), 'src', 'data', 'hyderabadPriority.ts')
const areaSourcesPath = path.join(process.cwd(), 'src', 'lib', 'areaSources.ts')
const mapViewPath = path.join(process.cwd(), 'src', 'components', 'map', 'MapView.tsx')
const plotAnalysisCardPath = path.join(process.cwd(), 'src', 'components', 'score', 'PlotAnalysisCard.tsx')
const plotAnalysisPath = path.join(process.cwd(), 'src', 'lib', 'plotAnalysis.ts')
const pendingSourceHelperPath = path.join(process.cwd(), 'src', 'lib', 'hyderabadPendingSources.ts')
const storePath = path.join(process.cwd(), 'src', 'store', 'index.ts')

const localities = JSON.parse(fs.readFileSync(localitiesPath, 'utf8').replace(/^\uFEFF/, ''))
const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
const boundary = JSON.parse(fs.readFileSync(boundaryPath, 'utf8'))
const aliases = JSON.parse(fs.readFileSync(aliasesPath, 'utf8').replace(/^\uFEFF/, ''))
const pendingSources = fs.existsSync(pendingSourcesPath)
  ? JSON.parse(fs.readFileSync(pendingSourcesPath, 'utf8').replace(/^\uFEFF/, ''))
  : null
const pendingBoundaries = fs.existsSync(pendingBoundariesPath)
  ? JSON.parse(fs.readFileSync(pendingBoundariesPath, 'utf8').replace(/^\uFEFF/, ''))
  : null
const pendingScoringReadiness = fs.existsSync(pendingScoringReadinessPath)
  ? JSON.parse(fs.readFileSync(pendingScoringReadinessPath, 'utf8').replace(/^\uFEFF/, ''))
  : null
const pendingSignalInventory = fs.existsSync(pendingSignalInventoryPath)
  ? JSON.parse(fs.readFileSync(pendingSignalInventoryPath, 'utf8').replace(/^\uFEFF/, ''))
  : null
const pendingPriceSignals = fs.existsSync(pendingPriceSignalsPath)
  ? JSON.parse(fs.readFileSync(pendingPriceSignalsPath, 'utf8').replace(/^\uFEFF/, ''))
  : null
const hyderabadSource = fs.readFileSync(hyderabadDataPath, 'utf8')
const productionHelper = fs.existsSync(productionHelperPath)
  ? fs.readFileSync(productionHelperPath, 'utf8')
  : ''
const prioritySource = fs.existsSync(priorityPath) ? fs.readFileSync(priorityPath, 'utf8') : ''
const areaSources = fs.readFileSync(areaSourcesPath, 'utf8')
const mapView = fs.readFileSync(mapViewPath, 'utf8')
const plotAnalysisCard = fs.readFileSync(plotAnalysisCardPath, 'utf8')
const plotAnalysis = fs.readFileSync(plotAnalysisPath, 'utf8')
const pendingSourceHelper = fs.readFileSync(pendingSourceHelperPath, 'utf8')
const storeSource = fs.readFileSync(storePath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Hyderabad production check failed: ${message}`)
    process.exit(1)
  }
}

const confidenceMentions = hyderabadSource.match(/"?dataConfidence"?:/g)?.length ?? 0

assert(Array.isArray(localities), 'localities.json must contain an array')
assert(localities.length >= 240, `expected at least 240 Hyderabad localities, found ${localities.length}`)
assert(confidenceMentions >= localities.length, `expected confidence metadata for every Hyderabad record, found ${confidenceMentions}`)
assert(coverage.type === 'FeatureCollection' && coverage.features.length >= 220, 'contiguous Hyderabad coverage must contain at least 220 selectable cells')
assert(boundary.type === 'FeatureCollection' && boundary.features.length === 1, 'Hyderabad must have one product market boundary')
const coverageSlugs = new Set(coverage.features
  .filter(feature => !feature.properties?.contextOnly)
  .map(feature => feature.properties?.slug)
  .filter(Boolean))
const missingAliases = [...coverageSlugs].filter(slug => !Object.hasOwn(aliases, slug))
assert(missingAliases.length === 0, `coverage cells missing aliases: ${missingAliases.join(', ')}`)
const contextFeatures = coverage.features.filter(feature => feature.properties?.contextOnly)
const missingAreaMetric = coverage.features.filter(feature => typeof feature.properties?.areaKm2 !== 'number')
const oversizedContext = contextFeatures.filter(feature => feature.properties.areaKm2 > 250)
assert(missingAreaMetric.length === 0, 'all Hyderabad coverage cells must include areaKm2')
assert(oversizedContext.length === 0, `context-only cells over 250 sq km: ${oversizedContext.map(feature => `${feature.properties.slug}:${feature.properties.areaKm2}`).join(', ')}`)
assert(pendingSources?.schemaVersion === 1, 'Hyderabad pending context source audit must exist')
assert(pendingSources.sourceAudits?.length === contextFeatures.length, `pending context source audit must cover every context cell: expected ${contextFeatures.length}, found ${pendingSources?.sourceAudits?.length ?? 0}`)
const pendingAuditSlugs = new Set(pendingSources.sourceAudits.map(audit => audit.slug))
const missingPendingAudits = contextFeatures
  .map(feature => feature.properties.slug)
  .filter(slug => !pendingAuditSlugs.has(slug))
assert(missingPendingAudits.length === 0, `context cells missing pending source audit rows: ${missingPendingAudits.join(', ')}`)
const pendingAuditsWithoutStatus = pendingSources.sourceAudits.filter(audit => !audit.status || !audit.sources?.length)
assert(pendingAuditsWithoutStatus.length === 0, `pending source audits missing status or sources: ${pendingAuditsWithoutStatus.map(audit => audit.slug).join(', ')}`)
const pendingAuditsWithoutOfficialMatch = pendingSources.sourceAudits.filter(audit => !audit.officialMatches?.length)
assert(pendingAuditsWithoutOfficialMatch.length === 0, `pending source audits missing official village/admin matches: ${pendingAuditsWithoutOfficialMatch.map(audit => audit.slug).join(', ')}`)
const unsupportedPendingStatuses = pendingSources.sourceAudits.filter(audit => !['tgrac_village_matched', 'tgrac_statewide_village_matched'].includes(audit.status))
assert(unsupportedPendingStatuses.length === 0, `pending source audits still need official boundary source: ${unsupportedPendingStatuses.map(audit => `${audit.slug}:${audit.status}`).join(', ')}`)
const officialMatchedAudits = pendingSources.sourceAudits.filter(audit => audit.officialMatches?.length)
const officialMatchKeys = new Set(officialMatchedAudits.map(audit => audit.officialMatches?.[0]?.sourceKey).filter(Boolean))
assert(pendingBoundaries?.type === 'FeatureCollection', 'TGRAC matched pending areas must have a local official-boundary GeoJSON')
assert(pendingBoundaries.features?.length === officialMatchKeys.size, `TGRAC official-boundary GeoJSON must contain one feature per matched official source key: expected ${officialMatchKeys.size}, found ${pendingBoundaries?.features?.length ?? 0}`)
const boundarySourceKeys = new Set(pendingBoundaries.features.map(feature => feature.properties?.sourceKey).filter(Boolean))
const missingBoundarySourceKeys = [...officialMatchKeys].filter(sourceKey => !boundarySourceKeys.has(sourceKey))
assert(missingBoundarySourceKeys.length === 0, `TGRAC matched pending areas missing official boundary geometries: ${missingBoundarySourceKeys.join(', ')}`)
const invalidBoundaryFeatures = pendingBoundaries.features.filter(feature => (
  !feature.properties?.sourceKey ||
  !feature.properties?.villageName ||
  !feature.properties?.mandalName ||
  !feature.properties?.districtName ||
  !feature.properties?.sourceUrl ||
  !feature.properties?.retrievedAt ||
  !feature.properties?.matchedPendingSlugs?.length ||
  !['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)
))
assert(invalidBoundaryFeatures.length === 0, `TGRAC boundary features missing source/detail metadata: ${invalidBoundaryFeatures.map(feature => feature.properties?.fid).join(', ')}`)
assert(pendingScoringReadiness?.schemaVersion === 1, 'Hyderabad pending scoring-readiness audit must exist')
assert(pendingScoringReadiness.areaAudits?.length === contextFeatures.length, `pending scoring-readiness audit must cover every context cell: expected ${contextFeatures.length}, found ${pendingScoringReadiness?.areaAudits?.length ?? 0}`)
const scoringAuditSlugs = new Set(pendingScoringReadiness.areaAudits.map(audit => audit.slug))
const missingScoringAudits = contextFeatures.map(feature => feature.properties.slug).filter(slug => !scoringAuditSlugs.has(slug))
assert(missingScoringAudits.length === 0, `context cells missing scoring-readiness rows: ${missingScoringAudits.join(', ')}`)
const requiredEvidence = ['official_boundary', 'price_band', 'rera_activity', 'infrastructure', 'satellite_growth', 'employment', 'government_scheme']
const scoringRowsMissingEvidence = pendingScoringReadiness.areaAudits.filter(audit => requiredEvidence.some(key => !audit.evidence?.[key]?.status))
assert(scoringRowsMissingEvidence.length === 0, `scoring-readiness rows missing required evidence statuses: ${scoringRowsMissingEvidence.map(audit => audit.slug).join(', ')}`)
assert(pendingSignalInventory?.schemaVersion === 1, 'Hyderabad pending signal inventory must exist')
assert(pendingSignalInventory.areaInventories?.length === contextFeatures.length, `pending signal inventory must cover every context cell: expected ${contextFeatures.length}, found ${pendingSignalInventory?.areaInventories?.length ?? 0}`)
const signalInventorySlugs = new Set(pendingSignalInventory.areaInventories.map(inventory => inventory.slug))
const missingSignalInventoryRows = contextFeatures.map(feature => feature.properties.slug).filter(slug => !signalInventorySlugs.has(slug))
assert(missingSignalInventoryRows.length === 0, `context cells missing pending signal inventory rows: ${missingSignalInventoryRows.join(', ')}`)
assert(Array.isArray(pendingSignalInventory.requiredSignals), 'pending signal inventory must declare required signal categories')
const missingInventoryRequiredSignals = requiredEvidence.filter(key => key !== 'official_boundary' && !pendingSignalInventory.requiredSignals.includes(key))
assert(missingInventoryRequiredSignals.length === 0, `pending signal inventory missing required signal categories: ${missingInventoryRequiredSignals.join(', ')}`)
const inventoriesMissingSignalRows = pendingSignalInventory.areaInventories.filter(inventory => pendingSignalInventory.requiredSignals.some(key => !inventory.signals?.[key]?.status))
assert(inventoriesMissingSignalRows.length === 0, `pending signal inventory rows missing signal statuses: ${inventoriesMissingSignalRows.map(inventory => inventory.slug).join(', ')}`)
const unsupportedInventoryStatuses = pendingSignalInventory.areaInventories
  .flatMap(inventory => Object.entries(inventory.signals ?? {}).map(([key, signal]) => ({ slug: inventory.slug, key, status: signal?.status })))
  .filter(signal => !['verified', 'source_identified', 'missing'].includes(signal.status))
assert(unsupportedInventoryStatuses.length === 0, `pending signal inventory has unsupported statuses: ${unsupportedInventoryStatuses.map(signal => `${signal.slug}:${signal.key}:${signal.status}`).join(', ')}`)
const signalRowsReadyWithoutVerifiedSignals = pendingSignalInventory.areaInventories.filter(inventory => inventory.signalDeckReady && pendingSignalInventory.requiredSignals.some(key => inventory.signals?.[key]?.status !== 'verified'))
assert(signalRowsReadyWithoutVerifiedSignals.length === 0, `pending signal inventory rows marked ready without all verified signals: ${signalRowsReadyWithoutVerifiedSignals.map(inventory => inventory.slug).join(', ')}`)
assert(pendingSignalInventory.summary?.signalDeckReadyCount === 0, 'pending signal inventory must not mark any area ready before exact-area signal decks are verified')
assert(pendingPriceSignals?.schemaVersion === 1, 'Hyderabad pending price signal audit must exist')
assert(Array.isArray(pendingPriceSignals.priceSignals), 'Hyderabad pending price signal audit must include priceSignals')
const verifiedPriceSignals = pendingPriceSignals.priceSignals.filter(signal => signal.status === 'verified')
assert(verifiedPriceSignals.length > 0, 'Hyderabad pending price signal audit must verify at least one exact-area official price row')
const invalidVerifiedPriceSignals = verifiedPriceSignals.filter(signal => (
  !signal.slug ||
  !signal.sourceUrl ||
  !signal.officialMatch?.villageName ||
  !signal.officialMatch?.mandalName ||
  !signal.officialMatch?.districtName ||
  typeof signal.summary?.apartmentValueMinPerSqft !== 'number' ||
  typeof signal.summary?.apartmentValueMaxPerSqft !== 'number' ||
  typeof signal.summary?.landValueMinPerSqYard !== 'number' ||
  typeof signal.summary?.landValueMaxPerSqYard !== 'number' ||
  !signal.summary?.effectiveDates?.length ||
  !signal.records?.length
))
assert(invalidVerifiedPriceSignals.length === 0, `verified pending price signals missing exact-area official values: ${invalidVerifiedPriceSignals.map(signal => signal.slug).join(', ')}`)
const incorrectlyReadyRows = pendingScoringReadiness.areaAudits.filter(audit => audit.promotionReady && requiredEvidence.some(key => audit.evidence?.[key]?.status !== 'verified'))
assert(incorrectlyReadyRows.length === 0, `pending rows marked promotion-ready without full verified evidence: ${incorrectlyReadyRows.map(audit => audit.slug).join(', ')}`)
assert(pendingScoringReadiness.summary?.promotionReadyCount === 0, 'pending context cells must not be promotion-ready until score signal decks are attached')
assert(productionHelper.includes('hyderabad'), 'city production helper must include a Hyderabad override')
assert(productionHelper.includes('Flagship production city'), 'Hyderabad must be labeled as the flagship production city')

const prioritySlugs = [...prioritySource.matchAll(/'([^']+)'/g)].map(match => match[1])
const uniquePrioritySlugs = new Set(prioritySlugs)

assert(prioritySlugs.length === 50, `expected 50 Hyderabad verified priority slugs, found ${prioritySlugs.length}`)
assert(uniquePrioritySlugs.size === 50, 'Hyderabad verified priority slugs must be unique')

const missingLocalities = prioritySlugs.filter(slug => !hyderabadSource.includes(`locality("${slug}")`))
assert(missingLocalities.length === 0, `priority slugs missing from Hyderabad data: ${missingLocalities.join(', ')}`)

const missingSourceDecks = prioritySlugs.filter(slug => {
  const sourceKey = new RegExp(`(^|\\n)\\s*(?:['"]${slug}['"]|${slug})\\s*:`, 'm')
  return !sourceKey.test(areaSources)
})
assert(missingSourceDecks.length === 0, `priority slugs missing area-specific source decks: ${missingSourceDecks.join(', ')}`)
assert(mapView.includes('special-use-fill'), 'map must render classified Hyderabad special-use areas')
assert(mapView.includes('generated_market_cell'), 'map must visibly distinguish broad generated coverage cells')
assert(mapView.includes('closePolygonRing(area.polygon)'), 'MapLibre coverage polygons must use closed GeoJSON rings')
assert(!mapView.includes(': 0.38'), 'context/no-data polygons must not use the old high-opacity fill')
assert(!mapView.includes("'#3b82f6' // bright blue"), 'context/no-data polygons must not render as bright blue primary coverage')
assert(mapView.includes("['==', ['get', 'dataState'], 'data-pending'], 0.07"), 'context/no-data fills must stay visually subordinate at overview zoom')
assert(mapView.includes("['==', ['get', 'dataState'], 'data-pending'], 0.42"), 'context/no-data borders must stay visually subordinate at overview zoom')
assert(mapView.includes("'#94a3b8'"), 'context/no-data polygons must use muted pending-data borders instead of saturated primary coverage blue')
assert(mapView.includes('1.75'), 'scored polygon borders must remain readable over satellite basemap')
assert(!storeSource.includes("highlightTier: 'Good Growth'"), 'Hyderabad map must not boot into a filtered tier view')
assert(storeSource.includes('highlightTier: null'), 'Hyderabad map must show all scored coverage by default')
assert(!mapView.includes("color: '#252535'"), 'dimmed scored polygons must not become near-black holes on satellite')
assert(!mapView.includes("['==', ['get', 'dimmed'], 1], 0.06"), 'dimmed scored polygon fills must remain visibly covered')
assert(mapView.includes("['==', ['get', 'dimmed'], 1], 0.18"), 'dimmed scored polygon fills must stay readable when filters are active')
assert(mapView.includes("['==', ['get', 'dimmed'], 1], 0.55"), 'dimmed scored polygon borders must stay readable when filters are active')
assert(mapView.includes('ContextHoverInfo'), 'context-only polygons must expose hover information instead of behaving like dead shapes')
assert(mapView.includes('showContextHover'), 'context-only polygons must share click and hover pending-data messaging')
assert(mapView.includes('setContextHoverSlug'), 'context-only polygons must visibly highlight the specific pending cell under the cursor')
assert(mapView.includes('Data pending'), 'context-only polygon hover must explain why no score is available')
assert(mapView.includes('PlotDNA will start validation for this area'), 'context-only pending message must tell users that exact-area validation is the next step')
assert(pendingSourceHelper.includes('pending-context-sources.json?raw'), 'context-only hover must load pending source audits through the shared helper')
assert(pendingSourceHelper.includes('pending-scoring-readiness.json?raw'), 'context-only hover must load pending scoring-readiness audits through the shared helper')
assert(pendingSourceHelper.includes('pending-signal-inventory.json?raw'), 'context-only hover must load pending signal inventory through the shared helper')
assert(mapView.includes('TGRAC village match'), 'context-only hover must expose official TGRAC village matches where available')
assert(mapView.includes('not available for this pending area yet'), 'context-only hover must explicitly label pending cells without official matches')
assert(mapView.includes('officialMatchLabel'), 'context-only hover must carry matched village/mandal/district labels')
assert(mapView.includes('officialMatchDetails'), 'context-only hover must carry matched official village attributes')
assert(mapView.includes('Missing score signals'), 'context-only hover must explain why official-boundary areas remain unscored')
assert(mapView.includes('Identified signal sources'), 'context-only hover must show identified source paths for pending scoring signals')
assert(mapView.includes('verifiedSignals'), 'context-only hover must show verified pending signal evidence when available')
assert(pendingSourceHelper.includes('official boundary source'), 'context-only hover must explain official boundary sourcing')
assert(pendingSourceHelper.includes('Price verified'), 'pending source helper must summarize verified official price-band evidence')
assert(pendingSourceHelper.includes('needs non-HMDA boundary source'), 'context-only hover must explain pending cells that still need another boundary source')
assert(mapView.includes('boundaryConfidence'), 'context-only hover metadata must preserve boundary confidence')
assert(mapView.includes('areaKm2'), 'context-only hover metadata must preserve approximate area size')
assert(mapView.includes('data-pending'), 'context/no-data polygon styling must use a pending-data visual token')
assert(mapView.includes('broadGenerated'), 'large generated scored cells must be explicitly flagged instead of treated as precise polygons')
assert(mapView.includes("['==', ['get', 'broadGenerated'], 1], 0.16"), 'large generated scored cells must stay below primary scored fill strength')
assert(mapView.includes("['==', ['get', 'broadGenerated'], 1], 0.74"), 'large generated scored cell borders must be readable without dominating')
assert(mapView.includes('Generated broad market cell'), 'large generated scored cell tooltip must explain the boundary precision limit')
assert(pendingSourceHelper.includes('pending-context-sources.json?raw'), 'coordinate analysis path must load pending source audits')
assert(pendingSourceHelper.includes('pending-signal-inventory.json?raw'), 'coordinate analysis path must load pending signal inventory')
assert(plotAnalysis.includes('contextOfficialMatchLabel'), 'coordinate fallback must carry matched official village context')
assert(plotAnalysisCard.includes('TGRAC village match'), 'coordinate analysis card must show matched official village context')
assert(plotAnalysisCard.includes('Missing score signals'), 'coordinate analysis card must show missing score-signal evidence for pending areas')
assert(plotAnalysisCard.includes('Identified signal sources'), 'coordinate analysis card must show identified source paths for pending scoring signals')
assert(plotAnalysisCard.includes('contextVerifiedSignals'), 'coordinate analysis card must show verified pending signal evidence when available')
assert(plotAnalysisCard.includes('official boundary source'), 'coordinate analysis card must explain official boundary sourcing')
assert(plotAnalysisCard.includes('needs non-HMDA boundary source'), 'coordinate analysis card must identify pending areas outside the HMDA/TGRAC layer')

console.log(`Hyderabad production check passed: ${localities.length} localities, ${coverage.features.length} contiguous cells, ${confidenceMentions} confidence records, ${prioritySlugs.length} verified priority slugs.`)
