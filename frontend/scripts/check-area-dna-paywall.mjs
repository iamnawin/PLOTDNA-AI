import fs from 'node:fs'
import path from 'node:path'

const areaDetailPath = path.join(process.cwd(), 'src', 'pages', 'AreaDetail.tsx')
const areaDetail = fs.readFileSync(areaDetailPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Area DNA paywall check failed: ${message}`)
    process.exit(1)
  }
}

assert(areaDetail.includes('function LockedDnaAnalysis'), 'area detail must define a reusable locked DNA analysis wrapper')
assert(areaDetail.includes("Unlock full DNA analysis"), 'lock overlay must clearly explain the paid unlock')
assert(areaDetail.includes("openCustomReportRequest('instant_pdf_99'"), 'lock overlay must route unlock through Rs 99 flow')
assert(areaDetail.includes("openCustomReportRequest('custom_due_diligence_499'"), 'lock overlay must expose the Rs 499 buyer brief flow')
assert(areaDetail.includes('Rs 99') && areaDetail.includes('Rs 499'), 'lock overlay must show both paid options together')
assert(areaDetail.includes('filter: \'blur(10px)\''), 'locked analysis must be visually blurred')
assert(areaDetail.includes("userSelect: 'none'"), 'locked analysis must reduce easy copy from preview content')
assert(areaDetail.includes('pointerEvents: \'none\''), 'locked analysis preview must not expose clickable links/actions')
assert(areaDetail.includes("background: 'linear-gradient(180deg, rgba(6,8,20,0.22)"), 'locked analysis must reveal a dim blurred preview instead of a flat black wall')
assert(!areaDetail.includes('aria-label="Investment report options"'), 'paid report choices should not repeat below the summary once they live in the lock overlay')

const lockedStart = areaDetail.indexOf('<LockedDnaAnalysis')
const satellite = areaDetail.indexOf('<SatelliteCompare')
assert(lockedStart > -1 && satellite > -1 && lockedStart < satellite, 'deep satellite/DNA analysis must sit inside the paid lock')

console.log('Area DNA paywall check passed.')
