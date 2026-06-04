import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd(), '..')
const localitiesPath = path.join(repoRoot, 'data', 'cities', 'hyderabad', 'localities.json')
const hyderabadDataPath = path.join(process.cwd(), 'src', 'data', 'hyderabad.ts')
const productionHelperPath = path.join(process.cwd(), 'src', 'lib', 'cityProduction.ts')
const priorityPath = path.join(process.cwd(), 'src', 'data', 'hyderabadPriority.ts')
const areaSourcesPath = path.join(process.cwd(), 'src', 'lib', 'areaSources.ts')

const localities = JSON.parse(fs.readFileSync(localitiesPath, 'utf8').replace(/^\uFEFF/, ''))
const hyderabadSource = fs.readFileSync(hyderabadDataPath, 'utf8')
const productionHelper = fs.existsSync(productionHelperPath)
  ? fs.readFileSync(productionHelperPath, 'utf8')
  : ''
const prioritySource = fs.existsSync(priorityPath) ? fs.readFileSync(priorityPath, 'utf8') : ''
const areaSources = fs.readFileSync(areaSourcesPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Hyderabad production check failed: ${message}`)
    process.exit(1)
  }
}

const confidenceMentions = hyderabadSource.match(/"?dataConfidence"?:/g)?.length ?? 0

assert(Array.isArray(localities), 'localities.json must contain an array')
assert(localities.length === 240, `expected 240 Hyderabad localities, found ${localities.length}`)
assert(confidenceMentions >= 240, `expected confidence metadata for 240 Hyderabad records, found ${confidenceMentions}`)
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

console.log(`Hyderabad production check passed: ${localities.length} localities, ${confidenceMentions} confidence records, ${prioritySlugs.length} verified priority slugs.`)
