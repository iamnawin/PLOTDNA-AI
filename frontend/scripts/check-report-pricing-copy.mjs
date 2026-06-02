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

const pricingMatch = areaDetail.match(/<section\s+aria-label="Investment report options"[\s\S]*?<CustomReportLeadModal/)
assert(pricingMatch, 'investment report options section must exist')

const pricing = pricingMatch[0]
const rs99Count = (pricing.match(/Rs 99/g) ?? []).length
const rs499Count = (pricing.match(/Rs 499/g) ?? []).length

assert(rs99Count === 1, `Rs 99 should appear once in the pricing section, found ${rs99Count}`)
assert(rs499Count === 1, `Rs 499 should appear once in the pricing section, found ${rs499Count}`)
assert(pricing.includes('Unlock instant PDF'), 'Rs 99 CTA should not repeat the price')
assert(pricing.includes('Preview buyer brief'), 'Rs 499 CTA should not repeat the price')

console.log('Report pricing copy check passed.')
