import fs from 'node:fs'
import path from 'node:path'

const areaDetailPath = path.join(process.cwd(), 'src', 'pages', 'AreaDetail.tsx')
const areaDetail = fs.readFileSync(areaDetailPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Report pricing copy check failed: ${message}`)
    process.exit(1)
  }
}

const pricingMatch = areaDetail.match(/function ReportExportPanel[\s\S]*?function TimedDnaAccessGate/)
assert(pricingMatch, 'download and print report pricing surface must exist')

const pricing = pricingMatch[0]
const rs99Count = (pricing.match(/Rs 99/g) ?? []).length
const rs499Count = (pricing.match(/Rs 499/g) ?? []).length

assert(rs99Count === 1, `Rs 99 should appear once in the pricing section, found ${rs99Count}`)
assert(rs499Count === 0, `Rs 499 must not appear in the standard pricing section, found ${rs499Count}`)
assert(pricing.includes('complete buyer verification PDF'), 'pricing copy must explain that the download is the detailed buyer verification PDF')
assert(pricing.includes('One-time lifetime access'), 'pricing copy must explain the one-time lifetime purchase without payment placeholder wording')
assert(!pricing.includes('Checking access...'), 'testing flow must not show an entitlement/payment check placeholder on the Rs 99 card')
assert(!pricing.includes('Unlock lifetime access'), 'testing flow must not show payment/unlock placeholder copy on the Rs 99 card')
assert(!pricing.includes('one-time lifetime unlock'), 'testing flow must not show payment/unlock placeholder body copy on the Rs 99 card')
assert(pricing.includes('Regional PDF'), 'pricing section must expose language selection for printable reports')
assert(pricing.includes('source-of-truth PDF'), 'locked pricing copy must preserve source-of-truth wording')

const timedGateMatch = areaDetail.match(/function TimedDnaAccessGate[\s\S]*?async function loadPdfAsset/)
assert(timedGateMatch, 'timed access gate implementation must be inspectable')
const timedGate = timedGateMatch[0]
assert((timedGate.match(/Rs 99/g) ?? []).length === 1, 'timed lock must show one compact Rs 99 CTA')
assert(timedGate.includes('Continue for Rs 99 lifetime access'), 'timed lock should use a single compact Rs 99 CTA')
assert(timedGate.includes('<PreviewFeatureCarousel />'), 'timed lock should delegate included-feature education to the carousel')
assert(areaDetail.includes('DNA verdict') && areaDetail.includes('Source trail') && areaDetail.includes('Buyer checklist'), 'feature carousel should show included features without a second card')
assert(!timedGate.includes('Get lifetime access'), 'timed lock must not duplicate the export panel package card CTA')
assert(!timedGate.includes('Lifetime app + PDF'), 'timed lock must not duplicate the old package card label')
assert(!areaDetail.includes('aria-label="Investment report options"'), 'paid report options must not be repeated as a separate section')
assert(!areaDetail.includes('Unlock full DNA analysis'), 'pricing copy must not reintroduce the old full-DNA blocker')
assert(!pricing.includes('Full app + buyer brief'), 'standard pricing must not promote a second package')
assert(!pricing.includes('Unlock buyer brief'), 'standard pricing must not include the old buyer brief CTA')

console.log('Report pricing copy check passed.')
