import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd(), '..')
const localitiesPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'localities.json')
const coveragePath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'coverage-areas.geojson')
const boundaryPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'coverage-boundary.geojson')
const aliasesPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'aliases.json')
const hyderabadDataPath = path.join(process.cwd(), 'src', 'data', 'hyderabad.ts')
const productionHelperPath = path.join(process.cwd(), 'src', 'lib', 'cityProduction.ts')
const priorityPath = path.join(process.cwd(), 'src', 'data', 'hyderabadPriority.ts')
const areaSourcesPath = path.join(process.cwd(), 'src', 'lib', 'areaSources.ts')
const mapViewPath = path.join(process.cwd(), 'src', 'components', 'map', 'MapView.tsx')

const localities = JSON.parse(fs.readFileSync(localitiesPath, 'utf8').replace(/^\uFEFF/, ''))
const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
const boundary = JSON.parse(fs.readFileSync(boundaryPath, 'utf8'))
const aliases = JSON.parse(fs.readFileSync(aliasesPath, 'utf8').replace(/^\uFEFF/, ''))
const hyderabadSource = fs.readFileSync(hyderabadDataPath, 'utf8')
const productionHelper = fs.existsSync(productionHelperPath)
  ? fs.readFileSync(productionHelperPath, 'utf8')
  : ''
const prioritySource = fs.existsSync(priorityPath) ? fs.readFileSync(priorityPath, 'utf8') : ''
const areaSources = fs.readFileSync(areaSourcesPath, 'utf8')
const mapView = fs.readFileSync(mapViewPath, 'utf8')

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
const coverageSlugs = new Set(coverage.features.map(feature => feature.properties?.slug).filter(Boolean))
const missingAliases = [...coverageSlugs].filter(slug => !Object.hasOwn(aliases, slug))
assert(missingAliases.length === 0, `coverage cells missing aliases: ${missingAliases.join(', ')}`)
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

console.log(`Hyderabad production check passed: ${localities.length} localities, ${coverage.features.length} contiguous cells, ${confidenceMentions} confidence records, ${prioritySlugs.length} verified priority slugs.`)
