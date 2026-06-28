import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()

function read(path) {
  return readFileSync(resolve(root, path), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const home = read('src/pages/Home.tsx')

for (const token of [
  "import { featureFlags } from '@/lib/features'",
  "import LocationIntelligencePanel from '@/components/location/LocationIntelligencePanel'",
  "createInitialLocationIntelligence",
  'setLocationIntelligence',
  'setShowLocationIntelligence',
  'function maybeOpenLocationIntelligence',
]) {
  assert(home.includes(token), `Home Phase 1A wiring missing: ${token}`)
}

assert(
  home.includes('featureFlags.enableLandIdentityFlow') && home.includes('featureFlags.enableLocationIntelligencePanel'),
  'Location Intelligence panel must be guarded by both feature flags',
)

for (const inputType of ['locate_me', 'place_search', 'area_search']) {
  assert(home.includes(`'${inputType}'`), `Phase 1A input type mapping missing: ${inputType}`)
}

assert(
  /function triggerCoordAnalysis\(coords: \[number, number\],/.test(home),
  'triggerCoordAnalysis should keep coords as the first argument and add optional metadata only',
)
assert(
  home.includes('setSearchCoords(coords)') && home.includes('maybeOpenLocationIntelligence'),
  'Location Intelligence should open only after the existing searchCoords red-pin update path',
)

const mapView = read('src/components/map/MapView.tsx')
assert(!mapView.includes('LocationIntelligencePanel'), 'Phase 1A must not wire LocationIntelligencePanel into MapView')

const scoring = read('src/lib/utils.ts')
assert(scoring.includes('infrastructure: 25'), 'existing frontend scoring weights changed or missing')
assert(scoring.includes('export function computeDNAScore'), 'existing frontend score function changed or missing')

const features = read('src/lib/features.ts')
assert(
  features.includes('enableLandIdentityFlow: fromEnv("VITE_ENABLE_LAND_IDENTITY_FLOW")'),
  'enableLandIdentityFlow must remain explicitly env-gated',
)
assert(
  features.includes('enableLocationIntelligencePanel: fromEnv("VITE_ENABLE_LOCATION_INTELLIGENCE_PANEL")'),
  'enableLocationIntelligencePanel must remain explicitly env-gated',
)
assert(features.includes('import.meta.env[key] === "true"'), 'feature flags must default false unless env is exactly "true"')

console.log('Land Identity Phase 1A checks passed')
