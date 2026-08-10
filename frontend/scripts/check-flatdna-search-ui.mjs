import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8')

const page = read('src/pages/FlatProjectSearch.tsx')
const api = read('src/lib/api.ts')

for (const state of ["result?.outcome === 'MATCHED'", "result?.outcome === 'AMBIGUOUS'", "result?.outcome === 'NOT_FOUND'", 'unavailable &&']) {
  assert.ok(page.includes(state), `FlatDNA search UI must render state: ${state}`)
}

for (const copy of [
  'Which apartment are you checking?',
  'Search apartment or project name',
  'We don&apos;t have enough verified information for this project yet.',
  'Project search is temporarily unavailable.',
  'Choose the project you mean',
]) {
  assert.ok(page.includes(copy), `FlatDNA search UI must include: ${copy}`)
}

assert.ok(page.includes('setSelectedProject(candidate)'), 'AMBIGUOUS candidates must require an explicit user selection')
assert.ok(page.includes('disabled={!selectedProject || confirmed}'), 'AMBIGUOUS Continue must stay disabled until selection')
assert.ok(api.includes('encodeURIComponent(query.trim())'), 'search query must be safely encoded')
assert.ok(api.includes('/api/v1/flat/projects/search?q='), 'search must use the existing FlatDNA API')
assert.ok(!page.includes('registry.json'), 'frontend must not contain registry data')
assert.ok(!page.toLowerCase().includes('resolve_project'), 'frontend must not contain backend resolver logic')

console.log('FlatDNA search-state checks passed.')
