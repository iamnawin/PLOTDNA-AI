import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const repoRoot = path.resolve(root, '..')

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) {
    console.error(`Hyderabad data quality check failed: missing ${relativePath}`)
    process.exit(1)
  }
  return fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '')
}

function readJson(relativePath) {
  return JSON.parse(readRepo(relativePath))
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Hyderabad data quality check failed: ${message}`)
    process.exit(1)
  }
}

function parseHyderabadAreas(source) {
  const matches = [...source.matchAll(/\.\.\.locality\("([^"]+)"\)/g)]
  return matches.map((match, index) => {
    const slug = match[1]
    const start = match.index ?? 0
    const end = index + 1 < matches.length
      ? matches[index + 1].index ?? source.length
      : source.indexOf('\n]', start)
    const block = source.slice(start, end > start ? end : undefined)
    const numberField = (name) => {
      const field = block.match(new RegExp(`"?${name}"?\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`))
      return field ? Number(field[1]) : null
    }
    const stringField = (name) => {
      const field = block.match(new RegExp(`"?${name}"?\\s*:\\s*"([^"]*)"`))
      return field ? field[1] : null
    }

    return {
      slug,
      score: numberField('score'),
      dataConfidence: stringField('dataConfidence'),
      signalsAvailable: numberField('signalsAvailable'),
    }
  })
}

const localities = readJson('data/cities/hyderabad/localities.json')
const coverage = readJson('data/cities/hyderabad/coverage-areas.geojson')
const readiness = readJson('data/cities/hyderabad/pending-scoring-readiness.json')
const promotionReport = readJson('data/cities/hyderabad/pending-promotion-report.json')
const priceSignals = readJson('data/cities/hyderabad/pending-price-signals.json')
const infrastructureSignals = readJson('data/cities/hyderabad/pending-infrastructure-signals.json')
const hyderabadSource = readRepo('frontend/src/data/hyderabad.ts')
const recommendationsSource = readRepo('frontend/src/lib/recommendations.ts')
const prioritySource = readRepo('frontend/src/data/hyderabadPriority.ts')

const areas = parseHyderabadAreas(hyderabadSource)
const areaSlugs = new Set(areas.map((area) => area.slug))
const scoredCoverageSlugs = new Set(
  coverage.features
    .filter((feature) => !feature.properties?.contextOnly)
    .map((feature) => feature.properties?.slug)
    .filter(Boolean),
)
const contextCells = coverage.features.filter((feature) => feature.properties?.contextOnly)
const missingScoredCoverageRecords = [...scoredCoverageSlugs].filter((slug) => !areaSlugs.has(slug))
const weakAreas = areas.filter((area) => (area.signalsAvailable ?? 0) < 4)
const estimatedAreas = areas.filter((area) => area.dataConfidence === 'estimated')
const weakPrioritySlugs = weakAreas.filter((area) => prioritySource.includes(`'${area.slug}'`))
const verifiedPriceSignals = priceSignals.priceSignals.filter((signal) => signal.status === 'verified')
const verifiedInfrastructureSignals = infrastructureSignals.infrastructureSignals.filter((signal) => signal.status === 'verified')

assert(Array.isArray(localities), 'Hyderabad localities must be an array')
assert(areas.length === localities.length, `frontend Hyderabad records must match localities.json: expected ${localities.length}, found ${areas.length}`)
assert(missingScoredCoverageRecords.length === 0, `scored coverage cells missing frontend records: ${missingScoredCoverageRecords.join(', ')}`)
assert(weakAreas.length > 0, 'weak estimated area guard must have records to police')
assert(weakAreas.every((area) => area.dataConfidence === 'estimated'), `weak areas must stay estimated: ${weakAreas.map((area) => `${area.slug}:${area.dataConfidence}`).join(', ')}`)
assert(weakPrioritySlugs.length === 0, `weak estimated areas must not be priority verified slugs: ${weakPrioritySlugs.map((area) => area.slug).join(', ')}`)
assert(readiness.summary?.pendingContextCellCount === contextCells.length, `pending readiness must cover every context cell: expected ${contextCells.length}, found ${readiness.summary?.pendingContextCellCount}`)
assert(readiness.summary?.promotionReadyCount === readiness.areaAudits.filter((audit) => audit.promotionReady).length, 'pending readiness promotion summary must match ready rows')
assert(readiness.areaAudits.every((audit) => !audit.promotionReady || audit.missingEvidence?.length === 0), 'promotion-ready pending cells must have no missing evidence')
assert(promotionReport.summary?.pendingContextCellCount === contextCells.length, `pending promotion report must cover every context cell: expected ${contextCells.length}, found ${promotionReport.summary?.pendingContextCellCount}`)
assert(promotionReport.summary?.promotionReadyCount === readiness.summary?.promotionReadyCount, 'pending promotion report must match scoring-readiness promotion count')
assert(promotionReport.promotionReadyRows?.length === promotionReport.summary?.promotionReadyCount, 'promotion-ready rows must match promotion summary')
assert(promotionReport.areaPromotionRows?.every((row) => !row.promotionReady || row.missingEvidence?.length === 0), 'promotion-ready report rows must have no missing evidence')
assert(promotionReport.summary?.verifiedEvidenceCounts?.price_band === verifiedPriceSignals.length, 'promotion report must preserve verified price-band evidence count')
assert(promotionReport.summary?.verifiedEvidenceCounts?.infrastructure === verifiedInfrastructureSignals.length, 'promotion report must preserve verified infrastructure evidence count')
assert(
  promotionReport.summary?.verifiedEvidenceCounts?.rera_activity + promotionReport.summary?.missingEvidenceCounts?.rera_activity === contextCells.length,
  'promotion report must account for every RERA evidence row',
)
assert(recommendationsSource.includes('getRecommendationConfidenceFactor'), 'recommendations must apply confidence-aware ranking')
assert(recommendationsSource.includes('Math.min(adjustedScore, 58)'), 'estimated/weak records must be capped below recommendation-leader range')
assert(recommendationsSource.includes('Limited source depth'), 'weak ranked records must surface a caution')

const estimatedBySignals = estimatedAreas.reduce((counts, area) => {
  const key = String(area.signalsAvailable ?? 'missing')
  counts[key] = (counts[key] ?? 0) + 1
  return counts
}, {})

console.log('Hyderabad data quality findings')
console.table([
  { area: 'Frontend market records', status: `${areas.length}/${localities.length} localities covered` },
  { area: 'Scored coverage cells', status: `${scoredCoverageSlugs.size} cells, ${missingScoredCoverageRecords.length} missing records` },
  { area: 'Pending context cells', status: `${contextCells.length} blocked, ${readiness.summary.promotionReadyCount} promotion-ready` },
  { area: 'Promotion evidence', status: `${promotionReport.summary.verifiedEvidenceCounts.price_band} price, ${promotionReport.summary.verifiedEvidenceCounts.infrastructure} infrastructure, ${promotionReport.summary.promotionReadyCount} ready` },
  { area: 'Estimated scored records', status: `${estimatedAreas.length} total (${JSON.stringify(estimatedBySignals)})` },
  { area: 'Weak scored records', status: `${weakAreas.length} capped in recommendations` },
])
console.log(`Weak records: ${weakAreas.map((area) => `${area.slug}:${area.signalsAvailable}/7`).join(', ')}`)
