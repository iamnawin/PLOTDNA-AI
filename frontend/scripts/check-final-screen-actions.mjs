import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/features/areaStory/screens')
const verdict = readFileSync(path.join(root, 'VerdictScreen.tsx'), 'utf8')
const details = readFileSync(path.join(root, 'AreaDetailsScreen.tsx'), 'utf8')
const pass = readFileSync(path.join(root, 'PassScreen.tsx'), 'utf8')

for (const action of ['Download Buyer Report', 'Generate Area Pass', 'Compare Areas']) {
  assert.ok(!verdict.includes(action), `Verdict must not repeat final-screen action: ${action}`)
  assert.ok(!details.includes(action), `Details must not repeat final-screen action: ${action}`)
}
assert.ok(pass.includes('BuyerReportButton'), 'final Area Pass screen must keep Buyer Report download')
assert.ok(!pass.includes('Compare Areas'), 'final Area Pass screen must not repeat the preceding Compare screen')
assert.ok(pass.includes('<LandDNACard'), 'final screen must render the generated Area Pass')

console.log('Final-screen action placement checks passed.')
