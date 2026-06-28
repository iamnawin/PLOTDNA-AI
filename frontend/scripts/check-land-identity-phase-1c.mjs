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

const envMapping = {
  enableLandIdentityFlow: 'VITE_ENABLE_LAND_IDENTITY_FLOW',
  enableLocationIntelligencePanel: 'VITE_ENABLE_LOCATION_INTELLIGENCE_PANEL',
  enableSurveyResolver: 'VITE_ENABLE_SURVEY_RESOLVER',
  enableTrustSignals: 'VITE_ENABLE_TRUST_SIGNALS',
  enableMicroZoneMatching: 'VITE_ENABLE_MICRO_ZONE_MATCHING',
}

assert(features.includes('const fromEnv = (key: string): boolean'), 'features must use an explicit env parser')
assert(features.includes('import.meta.env[key] === "true"'), 'only the exact string "true" may enable a flag')
assert(!features.includes('NODE_ENV'), 'feature flags must not enable by NODE_ENV')

for (const [flag, envKey] of Object.entries(envMapping)) {
  assert(features.includes(`${flag}: fromEnv("${envKey}")`), `${flag} must read ${envKey}`)
}

function evaluateFlags(env) {
  const flagLines = Object.entries(envMapping)
    .map(([flag, envKey]) => `${flag}: fromEnv("${envKey}")`)
    .join(',')
  const source = `
    const importMeta = { env: ${JSON.stringify(env)} };
    const fromEnv = (key) => importMeta.env[key] === "true";
    return { ${flagLines} };
  `

  return Function(source)()
}

const defaultFlags = evaluateFlags({})
for (const [flag] of Object.entries(envMapping)) {
  assert(defaultFlags[flag] === false, `${flag} must default false when env is missing`)
}

const enabledFlags = evaluateFlags({
  VITE_ENABLE_LAND_IDENTITY_FLOW: 'true',
  VITE_ENABLE_LOCATION_INTELLIGENCE_PANEL: 'true',
  VITE_ENABLE_SURVEY_RESOLVER: 'true',
  VITE_ENABLE_TRUST_SIGNALS: 'true',
  VITE_ENABLE_MICRO_ZONE_MATCHING: 'true',
})
for (const [flag] of Object.entries(envMapping)) {
  assert(enabledFlags[flag] === true, `${flag} must enable when env is "true"`)
}

const nonTrueFlags = evaluateFlags({
  VITE_ENABLE_LAND_IDENTITY_FLOW: 'TRUE',
  VITE_ENABLE_LOCATION_INTELLIGENCE_PANEL: '1',
  VITE_ENABLE_SURVEY_RESOLVER: 'yes',
  VITE_ENABLE_TRUST_SIGNALS: 'false',
  VITE_ENABLE_MICRO_ZONE_MATCHING: '',
})
for (const [flag] of Object.entries(envMapping)) {
  assert(nonTrueFlags[flag] === false, `${flag} must stay false unless env is exactly "true"`)
}

const home = read('src/pages/Home.tsx')
assert(
  home.includes('dropPinMode={featureFlags.enableLandIdentityFlow && isDropPinMode}'),
  'Drop Pin must remain gated by enableLandIdentityFlow',
)
assert(
  home.includes('featureFlags.enableLandIdentityFlow') && home.includes('featureFlags.enableLocationIntelligencePanel'),
  'Location Intelligence must remain gated by both flags',
)

const mapView = read('src/components/map/MapView.tsx')
assert(!mapView.includes('LocationIntelligencePanel'), 'MapView must not wire Location Intelligence directly')

const scoring = read('src/lib/utils.ts')
assert(scoring.includes('infrastructure: 25'), 'existing frontend scoring weights changed or missing')
assert(scoring.includes('export function computeDNAScore'), 'existing frontend score function changed or missing')

console.log('Land Identity Phase 1C checks passed')
