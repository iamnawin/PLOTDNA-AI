import fs from 'node:fs'
import path from 'node:path'

const areaDetailPath = path.join(process.cwd(), 'src', 'pages', 'AreaDetail.tsx')
const areaDetail = fs.readFileSync(areaDetailPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Area feature navigation check failed: ${message}`)
    process.exit(1)
  }
}

assert(areaDetail.includes('const AREA_FEATURE_GUIDE'), 'area page must define a guided feature vocabulary')
for (const label of ['Verdict', 'Sources', 'Growth', 'Risk', 'Compare', 'PDF']) {
  assert(areaDetail.includes(`label: '${label}'`), `feature guide must include ${label}`)
}

assert(areaDetail.includes('function AreaFeatureNavigator'), 'area page must render a feature navigator')
assert(areaDetail.includes('aria-label="PlotDNA feature navigation"'), 'feature navigator must be discoverable')
assert(areaDetail.includes('sticky top-14'), 'feature navigator must stay available while scanning the report')
const normalAreaBranch = areaDetail.indexOf('const displayedConfidence')
const featureNavigatorRender = areaDetail.indexOf('<AreaFeatureNavigator', normalAreaBranch)
const heroRender = areaDetail.indexOf('className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12"', normalAreaBranch)
assert(featureNavigatorRender > -1 && heroRender > -1 && featureNavigatorRender < heroRender, 'feature navigator must render before the main hero card')
assert(areaDetail.includes('scrollIntoView({ behavior: \'smooth\''), 'feature nav clicks must smoothly scroll to sections')
assert(areaDetail.includes("trackEvent('area_feature_navigation_clicked'"), 'feature nav clicks must be tracked')
assert(areaDetail.includes('setHighlightedFeatureId(feature.id)'), 'feature nav must briefly highlight the target section')
assert(areaDetail.includes('layoutId="area-feature-active-pill"'), 'active feature pill must use shared layout motion')
assert(areaDetail.includes('layoutId="area-feature-reflection"'), 'feature navigator must include a reflective active sheen')
assert(areaDetail.includes('ease: [0.22, 1, 0.36, 1]'), 'feature navigator motion must use a smooth premium easing curve')

for (const id of [
  'id="area-feature-verdict"',
  'id="area-feature-sources"',
  'id="area-feature-growth"',
  'id="area-feature-risk"',
  'id="area-feature-compare"',
  'id="area-feature-pdf"',
]) {
  assert(areaDetail.includes(id), `${id} section anchor must exist`)
}

assert(areaDetail.includes('data-highlighted-feature='), 'feature sections must expose highlighted state')
assert(areaDetail.includes('function PreviewFeatureCarousel'), 'timed preview lock must use a compact feature carousel')
assert(areaDetail.includes('aria-label="Preview locked feature carousel"'), 'preview carousel must be accessible')
assert(areaDetail.includes('direction-aware'), 'preview carousel must document/use direction-aware motion')
assert(areaDetail.includes('AnimatePresence'), 'preview carousel must animate between selected feature slides')
assert(areaDetail.includes('setPreviewFeatureIndex'), 'preview carousel must allow next/back feature selection')
assert(areaDetail.includes('area_preview_feature_next'), 'preview carousel next action must be tracked')
assert(areaDetail.includes('area_preview_feature_previous'), 'preview carousel previous action must be tracked')
assert(areaDetail.includes('Buyer decision workflow'), 'preview lock must frame PlotDNA as a decision workflow')

console.log('Area feature navigation check passed.')
