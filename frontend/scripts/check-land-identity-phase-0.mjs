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

const features = read('src/lib/features.ts')
for (const flag of [
  'enableLandIdentityFlow',
  'enableLocationIntelligencePanel',
  'enableSurveyResolver',
  'enableTrustSignals',
  'enableMicroZoneMatching',
]) {
  assert(
    new RegExp(`${flag}:\\s*false`).test(features),
    `${flag} must exist and default to false`,
  )
}

const types = read('src/lib/landIdentity/types.ts')
for (const token of [
  'LocationIntelligence',
  'LandTrustSignals',
  'CoverageType',
  'SurveyStatus',
  'TrustSignalStatus',
]) {
  assert(types.includes(token), `land identity type missing: ${token}`)
}

const locationResolver = read('src/lib/landIdentity/locationResolver.ts')
assert(locationResolver.includes('createInitialLocationIntelligence'), 'location resolver stub missing')
assert(
  locationResolver.includes('Survey number not confirmed from current map data.'),
  'location resolver must use conservative survey copy',
)

const polygonMatcher = read('src/lib/landIdentity/polygonMatcher.ts')
for (const fn of ['isPointInsidePolygon', 'findContainingFlagshipBoundary', 'findContainingMicroZone']) {
  assert(polygonMatcher.includes(`function ${fn}`) || polygonMatcher.includes(`const ${fn}`), `${fn} missing`)
}

const surveyResolver = read('src/lib/landIdentity/surveyResolver.ts')
assert(surveyResolver.includes('manual_verification_required'), 'survey resolver must require manual verification')
assert(!surveyResolver.includes('confirmed_from_cadastral'), 'Phase 0 survey resolver must not confirm cadastral matches')

const trustSignals = read('src/lib/landIdentity/trustSignals.ts')
assert(trustSignals.includes('buildInitialTrustSignals'), 'trust signals stub missing')
assert(trustSignals.includes('manual_verification_required'), 'trust signals must stay conservative')

for (const path of [
  'src/components/location/LocationIntelligencePanel.tsx',
  'src/components/survey/SurveyResolverPanel.tsx',
  'src/components/trust/LandTrustCards.tsx',
]) {
  assert(read(path).trim().length > 0, `${path} must exist`)
}

const scoring = read('src/lib/utils.ts')
assert(scoring.includes('infrastructure: 25'), 'existing frontend scoring weights changed or missing')
assert(scoring.includes('export function computeDNAScore'), 'existing frontend score function changed or missing')

const mapView = read('src/components/map/MapView.tsx')
assert(!mapView.includes('LocationIntelligencePanel'), 'Phase 0 must not wire LocationIntelligencePanel into MapView')
assert(mapView.includes('searchCoords &&'), 'existing red searchCoords pin rendering missing')

const home = read('src/pages/Home.tsx')
assert(!home.includes('createInitialLocationIntelligence'), 'Phase 0 must not alter Home triggerCoordAnalysis flow')
assert(home.includes('function triggerCoordAnalysis'), 'existing triggerCoordAnalysis missing')

console.log('Land Identity Phase 0 checks passed')
