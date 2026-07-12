import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const report = readFileSync(path.join(__dirname, '../src/lib/buyerReport.ts'), 'utf8')
const brief = readFileSync(path.join(__dirname, '../src/lib/areaStoryBrief.ts'), 'utf8')
const reportContent = `${report}\n${brief}`

assert.equal((report.match(/doc\.addPage\(\)/g) ?? []).length, 3, 'report defines an exact four-page structure')
for (const copy of [
  'PlotDNA Buyer',
  'Land Buying Check Report',
  'Roads and nearby development',
  'Why buyers may be interested',
  'Map Proof',
  'Documents',
  'Approvals',
  'Site Reality',
  'Price Sanity',
  'Where to verify',
  'How much information is available?',
  'PlotDNA is a buyer-side screening tool',
]) {
  assert.ok(reportContent.includes(copy), `buyer report includes ${copy}`)
}

assert.ok(!report.includes('N/A'), 'report hides unavailable values')
assert.match(report, /generateBuyerReportPdf/)
assert.match(report, /plotdna-buyer-report-\$\{areaCode\}\.pdf/)
console.log('Buyer Report PDF structure checks passed.')
