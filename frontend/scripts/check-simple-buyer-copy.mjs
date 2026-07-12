import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src')
const files = [
  'components/ui/VerdictCard.tsx',
  'features/areaStory/screens/VerdictScreen.tsx',
  'features/areaStory/screens/AreaDetailsScreen.tsx',
  'lib/areaStoryBrief.ts',
  'lib/buyerReport.ts',
].map(file => readFileSync(path.join(root, file), 'utf8'))
const copy = files.join('\n')

for (const phrase of [
  'You can consider this area, but don’t rush.',
  'Nearest match used',
  'Yes, if you overpay.',
  'Looks positive.',
  'Yes, after checks.',
  'Nearby activity looks decent.',
  'Where you may lose money',
  'Some details are available, but not everything.',
]) assert.ok(copy.includes(phrase), `simple buyer copy missing: ${phrase}`)

for (const phrase of ['growth signals', 'resolution context', 'rule-based PlotDNA fallback', 'directional confidence', 'source coverage', 'fallback intelligence']) {
  assert.ok(!copy.toLowerCase().includes(phrase), `technical buyer copy remains: ${phrase}`)
}

console.log('Simple buyer copy checks passed.')
