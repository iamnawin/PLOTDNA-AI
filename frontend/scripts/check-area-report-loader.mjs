import fs from 'node:fs'
import path from 'node:path'

const homePath = path.join(process.cwd(), 'src', 'pages', 'Home.tsx')
const scoreCardPath = path.join(process.cwd(), 'src', 'components', 'score', 'ScoreCard.tsx')
const plotAnalysisPath = path.join(process.cwd(), 'src', 'components', 'score', 'PlotAnalysisCard.tsx')
const preloaderPath = path.join(process.cwd(), 'src', 'components', 'ui', 'DnaRoutePreloader.tsx')

const home = fs.readFileSync(homePath, 'utf8')
const scoreCard = fs.readFileSync(scoreCardPath, 'utf8')
const plotAnalysis = fs.readFileSync(plotAnalysisPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Area report loader check failed: ${message}`)
    process.exit(1)
  }
}

assert(fs.existsSync(preloaderPath), 'shared DNA route preloader component must exist')
assert(home.includes('DnaRoutePreloader'), 'map page must render the DNA preloader')
assert(home.includes('openAreaReportWithLoader'), 'map page must route area reports through the loader')
assert(scoreCard.includes('onOpenAreaReport'), 'selected-area score card must receive an area-report loader callback')
assert(plotAnalysis.includes('onOpenAreaReport'), 'coordinate analysis card must receive an area-report loader callback')
assert(!scoreCard.includes('navigate(`/area/${area.slug}`)'), 'score card must not navigate directly without preloader')
assert(!plotAnalysis.includes('navigate(`/area/${staticArea.slug}`'), 'plot analysis card must not navigate static area directly without preloader')
assert(!plotAnalysis.includes("navigate(`/area/${resolvedFallback.districtSlug || 'warangal'}`"), 'plot analysis card must not navigate regional area directly without preloader')

console.log('Area report loader check passed.')
