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
assert(customMatch, 'custom buyer PDF generator must exist')

const instant = instantMatch[0]
const custom = customMatch[0]

assert((instant.match(/doc\.addPage\(\)/g) ?? []).length >= 2, 'Rs 99 PDF must be at least 3 pages')
assert(instant.includes("header('Source links and buyer checklist')"), 'Rs 99 PDF must include a dedicated source/checklist page')
assert(instant.includes('doc.textWithLink'), 'Rs 99 PDF source URLs must be clickable links')
assert(instant.includes('BUYER_DUE_DILIGENCE_CHECKLIST'), 'Rs 99 PDF must include buyer due-diligence checklist details')
assert(instant.includes("section('Growth signal table')"), 'Rs 99 PDF must describe signals as growth, not weights')
assert(!instant.includes('% weight'), 'Rs 99 PDF must not print weight wording')
assert(instant.includes("section('Regional language note')"), 'Rs 99 PDF must include regional language guidance')
assert(instant.includes('Telugu'), 'Rs 99 PDF must mention Telugu PDF availability path')
assert(instant.includes("setText(15, 23, 42, 13, 'bold')"), 'Rs 99 PDF must use larger bold section lead text')

assert(custom.includes("section('DNA signal graph')"), 'custom PDF must include a DNA signal graph section')
assert(custom.includes('const drawSignalGraphPanel'), 'custom DNA signal graph must use a padded panel renderer')
assert(custom.includes("ensureSpace(SIGNAL_CONFIG.length * 9 + 28)"), 'custom DNA signal graph must reserve top/bottom breathing room')
assert(custom.includes("section('Buyer context and notes')"), 'custom PDF must show the buyer-entered context near the start')
assert(custom.includes("section('Price sanity graph')"), 'custom PDF must include a price sanity graph')
assert(custom.includes("section('Document packet plan')"), 'custom PDF must include a document packet plan')
assert(custom.includes("section('Growth timeline')"), 'custom PDF must include a growth timeline section')
assert(custom.includes("section('Location map snapshot')"), 'custom PDF must include a printable location map snapshot')
assert(custom.includes('Open live map for satellite inspection'), 'custom PDF map snapshot must link to a live map')
assert(custom.includes('PlotDNA growth inputs'), 'custom PDF signal panel must use growth wording')
assert(!custom.includes('% weight'), 'custom PDF must not print weight wording')
assert(custom.includes("section('Source links')"), 'custom PDF must include source links')
assert(custom.includes('doc.textWithLink'), 'custom PDF source URLs must be clickable links')
assert(custom.includes('drawChecklistRow'), 'custom PDF checklist must render printable checkbox rows')
assert(custom.includes("'Owner/date'"), 'custom PDF checklist must leave owner/date space for pen review')
assert(custom.includes("section('Source-of-truth closeout')"), 'custom PDF must end with a source-of-truth closeout note')
assert((custom.match(/footer\(\)/g) ?? []).length >= 3, 'custom PDF must produce a multi-page polished brief')

console.log('PDF report quality check passed.')
