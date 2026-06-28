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
const spatialView = read('src/components/view/SpatialView.tsx')
const mapView = read('src/components/map/MapView.tsx')
const scoring = read('src/lib/utils.ts')
const locationResolver = read('src/lib/landIdentity/locationResolver.ts')
const types = read('src/lib/landIdentity/types.ts')
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
assert(types.includes("| 'drop_pin'"), 'LocationInputType must support drop_pin')

for (const token of [
  'isDropPinMode',
  'handleDroppedPin',
  'Drop Pin',
  'Cancel Drop Pin',
  'Click the map to drop an exact land pin.',
  'Pin dropped. Location Intelligence is available for this exact point.',
  "inputType: 'drop_pin'",
  "inputValue: 'Dropped pin'",
]) {
  assert(home.includes(token), `Home Phase 1B drop-pin wiring missing: ${token}`)
}

assert(
  home.includes('featureFlags.enableLandIdentityFlow') && home.includes('setIsDropPinMode'),
  'Drop Pin mode must be guarded by enableLandIdentityFlow',
)
assert(
  home.includes('setSearchCoords([coords.lat, coords.lng])') || home.includes('setSearchCoords(droppedCoords)'),
  'Dropped pin must use existing searchCoords red-pin path',
)
assert(
  home.includes('dropPinMode={featureFlags.enableLandIdentityFlow && isDropPinMode}'),
  'Home must pass dropPinMode only when land identity flow is enabled',
)

for (const token of [
  'dropPinMode?: boolean',
  'onMapClick?:',
  'dropPinMode={dropPinMode}',
  'onMapClick={onMapClick}',
]) {
  assert(spatialView.includes(token), `SpatialView optional Drop Pin prop missing: ${token}`)
}

for (const token of [
  'interface MapViewProps',
  'dropPinMode?: boolean',
  'onMapClick?: (coords: { lat: number; lng: number }) => void',
  'if (dropPinMode && onMapClick)',
  'onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng })',
]) {
  assert(mapView.includes(token), `MapView optional Drop Pin support missing: ${token}`)
}

assert(!mapView.includes('LocationIntelligencePanel'), 'Phase 1B must not wire LocationIntelligencePanel into MapView')
assert(scoring.includes('infrastructure: 25'), 'existing frontend scoring weights changed or missing')
assert(scoring.includes('export function computeDNAScore'), 'existing frontend score function changed or missing')
assert(
  locationResolver.includes('Survey number not confirmed from current map data.'),
  'Drop Pin Location Intelligence must retain survey-not-confirmed default',
)

console.log('Land Identity Phase 1B checks passed')
