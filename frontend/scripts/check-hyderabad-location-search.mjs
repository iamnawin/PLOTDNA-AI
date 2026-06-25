import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const helperPath = path.join(root, 'src', 'lib', 'location', 'search.ts')
const api = fs.readFileSync(path.join(root, 'src', 'lib', 'api.ts'), 'utf8')
const home = fs.readFileSync(path.join(root, 'src', 'pages', 'Home.tsx'), 'utf8')
const contracts = fs.readFileSync(path.join(root, 'src', 'lib', 'location', 'contracts.ts'), 'utf8')
const resolver = fs.readFileSync(path.join(root, 'src', 'lib', 'location', 'resolver.ts'), 'utf8')
const plotAnalysis = fs.readFileSync(path.join(root, 'src', 'lib', 'plotAnalysis.ts'), 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Hyderabad location search check failed: ${message}`)
    process.exit(1)
  }
}

assert(fs.existsSync(helperPath), 'local alias and typo search helper must exist')
const helper = fs.readFileSync(helperPath, 'utf8')
assert(helper.includes('hyderabadAliasesJson'), 'local suggestions must consume Hyderabad aliases')
assert(helper.includes('similarity'), 'local suggestions must support bounded typo matching')
assert(api.includes('/api/utils/search-location'), 'API client must expose submitted address search')
assert(api.includes("'outside_market'"), 'API contract must preserve outside-market precision')
assert(api.includes("'context_area'"), 'API contract must preserve context-only precision')
assert(contracts.includes("'context'"), 'location resolution contract must include non-scored context tier')
assert(resolver.includes('hyderabadCoverageRaw'), 'frontend resolver must read Hyderabad coverage cells')
assert(resolver.includes('contextOnly'), 'frontend resolver must preserve context-only cells')
assert(plotAnalysis.includes('context_area'), 'plot analysis must map context tier to a non-selectable fallback')
assert(home.includes('searchLocationAddress'), 'map search submit must use backend geocoding when local matches fail')
assert(home.includes('outside the Hyderabad market coverage'), 'outside-market searches must not silently choose a nearby score')

console.log('Hyderabad location search check passed.')
