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
const locationPanel = read('src/components/location/LocationIntelligencePanel.tsx')
const surveyPanel = read('src/components/survey/SurveyResolverPanel.tsx')
const surveyResolver = read('src/lib/landIdentity/surveyResolver.ts')
const mapView = read('src/components/map/MapView.tsx')
const scoring = read('src/lib/utils.ts')

assert(home.includes("import SurveyResolverPanel from '@/components/survey/SurveyResolverPanel'"), 'Home must import SurveyResolverPanel')
assert(home.includes('const [showSurveyResolver, setShowSurveyResolver] = useState(false)'), 'Home must own Survey Resolver open state')
assert(
  home.includes('featureFlags.enableLandIdentityFlow &&') && home.includes('featureFlags.enableSurveyResolver &&'),
  'Survey Resolver must be gated by enableLandIdentityFlow and enableSurveyResolver',
)
assert(home.includes('onSurveyResult={handleSurveyResult}'), 'Home must receive Survey Resolver result safely')

assert(locationPanel.includes('onOpenSurveyResolver?: () => void'), 'LocationIntelligencePanel must expose an optional Survey Resolver callback')
assert(locationPanel.includes("action === 'Check Survey Details' ? onOpenSurveyResolver : undefined"), 'Check Survey Details must use the optional callback')
assert(locationPanel.includes('Survey Number Status'), 'LocationIntelligencePanel must keep Survey Number Status visible')

for (const label of [
  'I know the survey number',
  'I know the village / mandal',
  'I only know this pin',
  'I know venture/layout name',
  'I have documents',
]) {
  assert(surveyPanel.includes(label), `Survey Resolver missing mode label: ${label}`)
}

for (const copy of [
  'Official verification is still required',
  'This pin gives location context, but survey identity requires cadastral or official land-record verification.',
  'Layout or venture name captured. Approval and survey linkage require verification.',
  'Document upload and extraction will be added in a later phase.',
  'PlotDNA does not certify title or legal ownership',
]) {
  assert(surveyPanel.includes(copy) || surveyResolver.includes(copy), `Safe copy missing: ${copy}`)
}

assert(!surveyResolver.includes("status: 'confirmed'"), 'Phase 2A resolver must not return confirmed status')
assert(!surveyPanel.includes('fetch('), 'Survey Resolver must not call external APIs')
assert(!surveyPanel.includes('axios'), 'Survey Resolver must not call external APIs')
assert(!surveyPanel.includes('type="file"'), 'Phase 2A must not upload/process documents')

assert(!mapView.includes('SurveyResolverPanel'), 'MapView must not wire Survey Resolver directly')
assert(scoring.includes('infrastructure: 25'), 'existing frontend scoring weights changed or missing')
assert(scoring.includes('export function computeDNAScore'), 'existing frontend score function changed or missing')

console.log('Land Identity Phase 2A checks passed')
