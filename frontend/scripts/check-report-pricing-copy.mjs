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

const pricingMatch = areaDetail.match(/function ReportExportPanel[\s\S]*?function ReportDownloadNudge/)
assert(pricingMatch, 'download and print report pricing surface must exist')

const pricing = pricingMatch[0]
const rs99Count = (pricing.match(/Rs 99/g) ?? []).length
const rs499Count = (pricing.match(/Rs 499/g) ?? []).length

assert(rs99Count === 1, `Rs 99 should appear once in the pricing section, found ${rs99Count}`)
assert(rs499Count === 1, `Rs 499 should appear once in the pricing section, found ${rs499Count}`)
assert(pricing.includes('Get PDF'), 'Rs 99 CTA should describe the action')
assert(pricing.includes('Download / print copy'), 'Rs 99 package should be tied to export, not app viewing')
assert(pricing.includes('Request buyer brief'), 'Rs 499 CTA should describe the action')
assert(pricing.includes('Full DNA view is free. Pay only when you need the PDF or buyer brief.'), 'pricing copy must keep in-app DNA viewing free')
assert(!areaDetail.includes('aria-label="Investment report options"'), 'paid report options must not be repeated as a separate section')
assert(!areaDetail.includes('Unlock full DNA analysis'), 'pricing copy must not reintroduce the old full-DNA blocker')

console.log('Report pricing copy check passed.')
