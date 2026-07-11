import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const sourcePath = path.join(__dirname, '../src/lib/investmentReport.ts')
const source = readFileSync(sourcePath, 'utf-8')
assert.match(source, /export function getBuyerRecommendation/, 'getBuyerRecommendation is exported')

const { getBuyerRecommendation } = await import('../src/lib/investmentReport.ts')

assert.equal(
  getBuyerRecommendation('Buy', 'verified'),
  'Shortlist, but verify documents and price before token.',
  'Buy verdict returns shortlist copy'
)

assert.equal(
  getBuyerRecommendation('Investigate', 'partial'),
  'Proceed carefully. Good area signals, but do not overpay.',
  'Investigate verdict returns proceed-carefully copy'
)

assert.equal(
  getBuyerRecommendation('Wait', 'partial'),
  'Avoid token until documents, access, and pricing are verified.',
  'Wait verdict returns avoid-token copy'
)

assert.match(
  getBuyerRecommendation('Avoid', 'partial'),
  /^Avoid token until documents, access, and pricing are verified\./,
  'Avoid verdict returns avoid-token copy (same or stronger wording)'
)

assert.equal(
  getBuyerRecommendation('Buy', 'estimated'),
  'Do not decide from PlotDNA alone. Use this only as early screening.',
  'estimated confidence overrides verdict with data-pending copy'
)

assert.equal(
  getBuyerRecommendation('Buy', 'uncovered'),
  'Do not decide from PlotDNA alone. Use this only as early screening.',
  'uncovered confidence overrides verdict with data-pending copy'
)

console.log('\nAll buyer recommendation checks passed.')
