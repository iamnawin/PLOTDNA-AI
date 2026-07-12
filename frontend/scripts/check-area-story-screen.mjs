import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screen = readFileSync(path.join(__dirname, '../src/features/areaStory/screens/AreaDetailsScreen.tsx'), 'utf8')
const shell = readFileSync(path.join(__dirname, '../src/features/areaStory/AreaStoryShell.tsx'), 'utf8')

assert.match(shell, /step === 'details'.*AreaDetailsScreen/, 'active details route renders AreaDetailsScreen')

for (const copy of [
  'Area Story',
  'What is happening here?',
  'Roads and nearby development',
  'Why buyers may be interested',
  'Where you may lose money',
  'What this means for a buyer',
  'Documents',
  'Approvals',
  'Site Reality',
  'Price Sanity',
  'Where to verify this',
  'Buyer action recommendation',
]) {
  assert.ok(screen.includes(copy) || (['Documents', 'Approvals', 'Site Reality', 'Price Sanity'].includes(copy) && screen.includes('VERIFICATION_GROUPS')), `Area Story includes ${copy}`)
}

for (const action of ['Download Buyer Report', 'Generate Area Pass', 'Compare Areas']) {
  assert.ok(!screen.includes(action), `Area Story must not repeat final-screen action: ${action}`)
}

assert.match(screen, /target="_blank"/)
assert.match(screen, /rel="noopener noreferrer"/)
console.log('Area Story screen checks passed.')
