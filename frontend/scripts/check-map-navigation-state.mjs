import fs from 'node:fs'
import path from 'node:path'

const homePath = path.join(process.cwd(), 'src', 'pages', 'Home.tsx')
const areaDetailPath = path.join(process.cwd(), 'src', 'pages', 'AreaDetail.tsx')
const home = fs.readFileSync(homePath, 'utf8')
const areaDetail = fs.readFileSync(areaDetailPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Map navigation state check failed: ${message}`)
    process.exit(1)
  }
}

assert(home.includes("useState<ViewMode>('map')"), 'map screen must default to map view, not globe view')
assert(home.includes('restoreMapStateFromUrl'), 'map page must restore coordinate state from URL')
assert(home.includes('persistMapStateToUrl'), 'map page must persist analyzed coordinates to URL')
assert(home.includes("params.has('lat')") && home.includes("params.has('lng')"), 'map URL restore must not coerce missing lat/lng params to 0,0')
assert(home.includes('lat < -90') && home.includes('lng < -180'), 'map URL restore must reject out-of-range coordinates')
assert(home.includes('plotdna:last-map-state'), 'map page must cache last analyzed map state')
assert(home.includes('buildAreaReportState'), 'area report links must carry coordinate fallback state')
assert(home.includes('fallbackReportSlug') && home.includes('fallbackReportLabel'), 'coordinate panel must keep a visible report CTA even for unsupported coordinates')
assert(areaDetail.includes('getMapReturnPath'), 'area detail must compute a return path to the originating map state')
assert(areaDetail.includes('navigate(getMapReturnPath())'), 'area detail back navigation must preserve map state')
assert(areaDetail.includes('fallbackFromQuery'), 'area detail must recover fallback context after refresh')

console.log('Map navigation state check passed.')
