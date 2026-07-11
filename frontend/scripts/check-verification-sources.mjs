import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  } else {
    console.log(`PASS: ${message}`)
  }
}

const filePath = path.join(__dirname, '../src/lib/verificationSources.ts')
const src = readFileSync(filePath, 'utf-8')

assert(src.includes('export function getVerificationSources'), 'exports getVerificationSources')
assert(src.includes('export function getBuyerModeForCategory'), 'exports getBuyerModeForCategory')
assert(src.includes("from '@/lib/areaSources'") || src.includes("from '../lib/areaSources'") || src.includes("getAreaSources"), 'consumes getAreaSources')

const expectedIds = ['rera', 'land_records', 'market_value', 'planning', 'encumbrance', 'site_visit']
for (const id of expectedIds) {
  assert(new RegExp(`id:\\s*['"]${id}['"]`).test(src), `card shell '${id}' is present`)
}

// Each shell entry should carry a non-empty warning and statusLabel string literal near its id.
const shellBlocks = src.split(/id:\s*['"]/).slice(1)
assert(shellBlocks.length >= expectedIds.length, 'found at least 6 card shell blocks')
for (const block of shellBlocks) {
  const id = block.split(/['"]/)[0]
  if (!expectedIds.includes(id)) continue
  const chunk = block.slice(0, 700)
  assert(/warning:\s*['"][^'"]+['"]/.test(chunk), `card '${id}' has a non-empty warning`)
  assert(/statusLabel:\s*['"][^'"]+['"]/.test(chunk), `card '${id}' has a non-empty statusLabel`)
}

// getBuyerModeForCategory mapping coverage
assert(src.includes("'Established'"), "getBuyerModeForCategory covers 'Established'")
assert(src.includes("'High Growth'"), "getBuyerModeForCategory covers 'High Growth'")
assert(src.includes("'Emerging'"), "getBuyerModeForCategory covers 'Emerging'")
assert(src.includes("'Industrial'"), "getBuyerModeForCategory covers 'Industrial'")

if (process.exitCode === 1) {
  console.error('\nSome checks failed.')
  process.exit(1)
}
console.log('\nAll verification source registry checks passed.')
