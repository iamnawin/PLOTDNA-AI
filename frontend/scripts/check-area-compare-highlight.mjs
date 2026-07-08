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

assert(areaDetail.includes('function BuyerJourneyScreens'), 'area page must expose the new buyer journey screen stack')
assert(areaDetail.includes('id="area-feature-compare"'), 'buyer journey must expose a Compare Areas screen anchor')
assert(areaDetail.includes('Compare Areas'), 'compare screen must use a clear buyer-facing headline')
assert(areaDetail.includes("source: 'area_buyer_journey'"), 'compare CTA from the buyer journey must be separately tracked')
assert(areaDetail.includes('const comparePath = `/compare?${compareParams.toString()}`'), 'area detail must build a standalone compare route with return path')
assert(areaDetail.includes('navigate(comparePath)'), 'area detail compare CTAs must open the standalone compare screen')
assert(areaDetail.includes('returnTo: `/area/${area.slug}`'), 'compare route must preserve return to the source verdict screen')
assert(!areaDetail.includes("navigate(`/compare?areas=${compareSlugs.join(',')}`)"), 'area detail must not use the old compare URL builder')

const compareSection = areaDetail.match(/id="area-feature-compare"[\s\S]*?<\/BuyerScreenShell>/)?.[0] ?? ''
assert(compareSection.includes('Compare with my area'), 'compare screen must offer a direct compare CTA')
assert(compareSection.includes('sm:grid-cols-2'), 'compare preview choices must stack on mobile and split on larger screens')
assert(!compareSection.includes('hidden sm:'), 'compare screen must remain visible on mobile')
assert(areaDetail.includes('grid grid-cols-1 gap-3 mt-4 sm:grid-cols-3'), 'area stats row must stack on mobile and use columns only from small screens up')

console.log('Area compare highlight check passed.')
