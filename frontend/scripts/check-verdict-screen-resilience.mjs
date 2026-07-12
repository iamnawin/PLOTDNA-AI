import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src')
const screen = readFileSync(path.join(root, 'features/areaStory/screens/VerdictScreen.tsx'), 'utf8')
const card = readFileSync(path.join(root, 'components/ui/VerdictCard.tsx'), 'utf8')
const copy = `${screen}\n${card}`

for (const phrase of [
  'Check carefully',
  'Can consider, but verify before token.',
  'You can consider this area, but don’t rush.',
  "['Score', `${area.score}/100`]",
  "['Risk', getRiskLabel(area.score)]",
  "['Price', area.priceRange]",
  "['Details', confidenceMeta.label]",
  'PlotDNA note',
  'AI note',
  'What should I do next?',
  'See Money View',
  'Nearest match used',
]) assert.ok(copy.includes(phrase), `verdict screen requirement missing: ${phrase}`)

for (const phrase of ['AI analysis unavailable', 'rule-based', 'fallback intelligence', 'resolution context']) {
  assert.ok(!copy.toLowerCase().includes(phrase.toLowerCase()), `broken-state language remains: ${phrase}`)
}

assert.ok(card.includes('.catch(() =>'), 'API failure must keep the local PlotDNA verdict')
assert.ok(card.includes('buildFallbackVerdict(areaSlug, resolutionTier, resolutionLabel)'), 'API failure must restore local verdict data')

console.log('Verdict screen resilience checks passed.')
