import fs from 'node:fs'
import path from 'node:path'

const areaDetailPath = path.join(process.cwd(), 'src', 'pages', 'AreaDetail.tsx')
const areaDetail = fs.readFileSync(areaDetailPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`PDF report quality check failed: ${message}`)
    process.exit(1)
  }
}

const instantMatch = areaDetail.match(/async function generatePDF[\s\S]*?doc\.save\(`PlotDNA_\$\{area\.name\.replace\(\/\\s\+\/g, '_'\)\}_Report\.pdf`\)/)
const customMatch = areaDetail.match(/async function generateCustomBuyerBriefPDF[\s\S]*?doc\.save\(`PlotDNA_\$\{area\.name\.replace\(\/\\s\+\/g, '_'\)\}_Custom_Buyer_Verification_Brief\.pdf`\)/)

assert(instantMatch, 'instant Rs 99 PDF generator must exist')
assert(customMatch, 'custom Rs 499 PDF generator must exist')

const instant = instantMatch[0]
const custom = customMatch[0]

assert((instant.match(/doc\.addPage\(\)/g) ?? []).length >= 2, 'Rs 99 PDF must be at least 3 pages')
assert(instant.includes("header('Source links and buyer checklist')"), 'Rs 99 PDF must include a dedicated source/checklist page')
assert(instant.includes('doc.textWithLink'), 'Rs 99 PDF source URLs must be clickable links')
assert(instant.includes('BUYER_DUE_DILIGENCE_CHECKLIST'), 'Rs 99 PDF must include buyer due-diligence checklist details')

assert(custom.includes("section('DNA signal graph')"), 'Rs 499 PDF must include a DNA signal graph section')
assert(custom.includes("section('Buyer context and notes')"), 'Rs 499 PDF must show the buyer-entered context near the start')
assert(custom.includes("section('Price sanity graph')"), 'Rs 499 PDF must include a price sanity graph')
assert(custom.includes("section('Document packet plan')"), 'Rs 499 PDF must include a document packet plan')
assert(custom.includes("section('Growth timeline')"), 'Rs 499 PDF must include a growth timeline section')
assert(custom.includes("section('Source links')"), 'Rs 499 PDF must include source links')
assert(custom.includes('doc.textWithLink'), 'Rs 499 PDF source URLs must be clickable links')
assert((custom.match(/footer\(\)/g) ?? []).length >= 3, 'Rs 499 PDF must produce a multi-page polished brief')

console.log('PDF report quality check passed.')
