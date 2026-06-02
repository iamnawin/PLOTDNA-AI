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
assert(areaDetail.includes('filter: \'blur(10px)\''), 'locked analysis must be visually blurred')
assert(areaDetail.includes("userSelect: 'none'"), 'locked analysis must reduce easy copy from preview content')
assert(areaDetail.includes('pointerEvents: \'none\''), 'locked analysis preview must not expose clickable links/actions')

const lockedStart = areaDetail.indexOf('<LockedDnaAnalysis')
const satellite = areaDetail.indexOf('<SatelliteCompare')
assert(lockedStart > -1 && satellite > -1 && lockedStart < satellite, 'deep satellite/DNA analysis must sit inside the paid lock')

console.log('Area DNA paywall check passed.')
