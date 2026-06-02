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
assert(areaDetail.includes("filter: 'blur(14px) saturate(0.78)'"), 'locked analysis must be strongly blurred but still recognizable')
assert(areaDetail.includes("userSelect: 'none'"), 'locked analysis must reduce easy copy from preview content')
assert(areaDetail.includes('pointerEvents: \'none\''), 'locked analysis preview must not expose clickable links/actions')
assert(areaDetail.includes('opacity: 0.8'), 'locked analysis preview must sit at 80% opacity')
assert(areaDetail.includes('className="pointer-events-none absolute inset-0 z-20 px-3"'), 'lock overlay must span the full gated section without blocking page scroll')
assert(areaDetail.includes('className="sticky top-5 flex min-h-[calc(100vh-40px)] items-center justify-center py-6 sm:top-8 sm:min-h-[calc(100vh-64px)]"'), 'unlock panel must float while users scroll the gated content')
assert(areaDetail.includes("background: 'linear-gradient(180deg, rgba(6,8,20,0.04), rgba(6,8,20,0.16) 42%, rgba(6,8,20,0.28))'"), 'locked analysis must reveal a transparent preview instead of a flat black wall')
assert(!areaDetail.includes('maxHeight: 760'), 'locked analysis must not clip the underlying paid content')
assert(!areaDetail.includes("overflow: 'hidden'"), 'locked analysis must allow the page to scroll through the gated content')
assert(!areaDetail.includes('aria-label="Investment report options"'), 'paid report choices should not repeat below the summary once they live in the lock overlay')

const lockedStart = areaDetail.indexOf('<LockedDnaAnalysis')
const satellite = areaDetail.indexOf('<SatelliteCompare')
assert(lockedStart > -1 && satellite > -1 && lockedStart < satellite, 'deep satellite/DNA analysis must sit inside the paid lock')

console.log('Area DNA paywall check passed.')
