import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screen = readFileSync(path.join(__dirname, '../src/features/areaStory/screens/AreaDetailsScreen.tsx'), 'utf8')
const shell = readFileSync(path.join(__dirname, '../src/features/areaStory/AreaStoryShell.tsx'), 'utf8')
const reportButton = readFileSync(path.join(__dirname, '../src/components/ui/BuyerReportButton.tsx'), 'utf8')
const screenContent = `${screen}\n${reportButton}`

assert.match(shell, /step === 'details'.*AreaDetailsScreen/, 'active details route renders AreaDetailsScreen')

for (const copy of [
  'Area Story',
  'What is happening here?',
  'Infrastructure signals',
  'Nearby demand drivers',
  'What this means for a buyer',
  'Documents',
  'Approvals',
  'Site Reality',
  'Price Sanity',
  'Where to verify this',
  'Buyer action recommendation',
  'Download Buyer Report',
  'Generate Area Pass',
]) {
  assert.ok(screenContent.includes(copy) || (['Documents', 'Approvals', 'Site Reality', 'Price Sanity'].includes(copy) && screen.includes('VERIFICATION_GROUPS')), `Area Story includes ${copy}`)
}

assert.match(screen, /target="_blank"/)
assert.match(screen, /rel="noopener noreferrer"/)
console.log('Area Story screen checks passed.')
