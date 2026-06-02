import fs from 'node:fs'
import path from 'node:path'

const areaDetailPath = path.join(process.cwd(), 'src', 'pages', 'AreaDetail.tsx')
const areaDetail = fs.readFileSync(areaDetailPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Area compare highlight check failed: ${message}`)
    process.exit(1)
  }
}

assert(areaDetail.includes('aria-label="Free area comparison"'), 'area page must expose a dedicated free compare panel')
assert(areaDetail.includes('Compare this area for free'), 'compare panel must use a clear feature headline')
assert(areaDetail.includes("source: 'area_compare_highlight'"), 'compare highlight CTA must be separately tracked')
assert(areaDetail.includes("navigate(`/compare?areas=${compareSlugs.join(',')}`)"), 'compare highlight must open the seeded compare page')

const compareSection = areaDetail.match(/aria-label="Free area comparison"[\s\S]*?<\/section>/)?.[0] ?? ''
assert(compareSection.includes('grid-cols-1') && compareSection.includes('sm:grid-cols-3'), 'compare choices must stack on mobile and expand on larger screens')
assert(compareSection.includes('w-full') && compareSection.includes('sm:w-auto'), 'compare CTA must be full-width on mobile and compact on wider screens')
assert(!compareSection.includes('hidden sm:'), 'compare highlight must remain visible on mobile')
assert(areaDetail.includes('grid grid-cols-1 gap-3 mt-4 sm:grid-cols-3'), 'area stats row must stack on mobile and use columns only from small screens up')

console.log('Area compare highlight check passed.')
