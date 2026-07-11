import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const card = readFileSync(path.join(__dirname, '../src/components/landDna/LandDNACard.tsx'), 'utf8')

for (const copy of ['Area Pass', 'Pass code', 'PlotDNA score', 'Verdict', 'Money range', 'Growth reason', 'Area signal proof', 'Top 3 checks before paying']) assert.ok(card.includes(copy), `card includes ${copy}`)
assert.ok(card.includes('border-dashed'), 'card uses a pass/ticket divider system')
assert.ok(card.includes('getLandDnaAreaCode'), 'card reuses the real pass code')
assert.ok(!card.includes('QR'), 'card does not add a fake QR code')
assert.ok(!card.includes('barcode'), 'card does not add a fake barcode')
console.log('Area Pass card layout checks passed.')
