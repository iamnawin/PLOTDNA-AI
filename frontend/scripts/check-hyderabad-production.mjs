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
const storePath = path.join(process.cwd(), 'src', 'store', 'index.ts')

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
assert(mapView.includes('boundaryConfidence'), 'context-only hover metadata must preserve boundary confidence')
assert(mapView.includes('areaKm2'), 'context-only hover metadata must preserve approximate area size')
assert(mapView.includes('data-pending'), 'context/no-data polygon styling must use a pending-data visual token')
assert(mapView.includes('broadGenerated'), 'large generated scored cells must be explicitly flagged instead of treated as precise polygons')
assert(mapView.includes("['==', ['get', 'broadGenerated'], 1], 0.16"), 'large generated scored cells must stay below primary scored fill strength')
assert(mapView.includes("['==', ['get', 'broadGenerated'], 1], 0.74"), 'large generated scored cell borders must be readable without dominating')
assert(mapView.includes('Generated broad market cell'), 'large generated scored cell tooltip must explain the boundary precision limit')

console.log(`Hyderabad production check passed: ${localities.length} localities, ${coverage.features.length} contiguous cells, ${confidenceMentions} confidence records, ${prioritySlugs.length} verified priority slugs.`)
