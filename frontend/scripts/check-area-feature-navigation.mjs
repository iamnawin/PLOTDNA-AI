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
for (const label of ['Check', 'Verdict', 'Money', 'Map', 'Compare', 'Pass']) {
  assert(areaDetail.includes(`label: '${label}'`), `feature guide must include ${label}`)
}

assert(areaDetail.includes('function AreaFeatureNavigator'), 'area page must render a feature navigator')
assert(areaDetail.includes('aria-label="PlotDNA feature navigation"'), 'feature navigator must be discoverable')
assert(areaDetail.includes('fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))]'), 'feature navigator must behave like a mobile app bottom nav')
assert(areaDetail.includes('const container = useRef<HTMLDivElement>(null)'), 'area page must define a real scroll container ref')
assert(areaDetail.includes('const { scrollYProgress } = useScroll({ container })'), 'feature navigator must drive progress from the report scroll container')
assert(areaDetail.includes('useTransform(scrollYProgress, [0, 1], [\'0%\', \'100%\'])'), 'feature navigator must use the Motion vocabulary scroll-driven width mapping')
assert(areaDetail.includes('ref={container}'), 'area page must attach the scroll container ref to the report surface')
assert(areaDetail.includes('h-screen overflow-y-auto'), 'report surface must be a scrollable container for container-based useScroll')
assert(areaDetail.includes('progressWidth={reportProgressWidth}'), 'feature navigator must receive the container-driven progress width')
assert(areaDetail.includes('aria-hidden="true" className="mt-1.5 h-0.5 overflow-hidden rounded-full'), 'feature navigator must render a compact scroll progress indicator')
assert(areaDetail.includes('className="grid grid-cols-6 gap-1"'), 'feature nav must expose the six buyer screens as app tabs')
const normalAreaBranch = areaDetail.indexOf('const displayedConfidence')
const featureNavigatorRender = areaDetail.indexOf('<AreaFeatureNavigator', normalAreaBranch)
const buyerScreensRender = areaDetail.indexOf('<BuyerJourneyScreens', normalAreaBranch)
assert(featureNavigatorRender > -1 && buyerScreensRender > -1 && featureNavigatorRender < buyerScreensRender, 'feature navigator must render before the buyer screen stack')
assert(areaDetail.includes('container.current?.scrollTo({ top: 0, behavior: \'smooth\' })'), 'feature nav clicks must reset the active screen to the top')
assert(areaDetail.includes('const [activeAreaFeatureId, setActiveAreaFeatureId]'), 'area page must keep the selected buyer screen in state')
assert(areaDetail.includes('activeFeatureId === \'verdict\'') && areaDetail.includes('activeFeatureId === \'growth\'') && areaDetail.includes('activeFeatureId === \'sources\''), 'buyer journey must render one active screen at a time')
assert(areaDetail.includes("trackEvent('area_feature_navigation_clicked'"), 'feature nav clicks must be tracked')
assert(areaDetail.includes('setHighlightedFeatureId(feature.id)'), 'feature nav must briefly highlight the target section')
assert(areaDetail.includes('layoutId="area-feature-active-pill"'), 'active feature pill must use shared layout motion')
assert(areaDetail.includes('ease: [0.22, 1, 0.36, 1]'), 'feature navigator motion must use a smooth premium easing curve')
assert(areaDetail.includes('function BuyerJourneyScreens'), 'area page must define the six-screen buyer journey')
for (const phrase of ['PlotDNA Verdict', 'Money View', 'Map Proof', 'Area Details', 'Compare Areas', 'Area Pass']) {
  assert(areaDetail.includes(phrase), `buyer journey must include ${phrase}`)
}
assert(areaDetail.includes('<SatelliteCompare area={area} coords={coords ?? undefined} />'), 'Map Proof must reuse the existing satellite/map proof component')
assert(!areaDetail.includes('bg-[linear-gradient(rgba(34,211,238,0.08)_1px'), 'Map Proof must not use the placeholder grid graphic')

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
