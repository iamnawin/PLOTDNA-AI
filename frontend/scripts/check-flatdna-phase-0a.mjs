import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8')

const features = read('src/lib/features.ts')
assert.ok(
  features.includes('import.meta.env[key] === "true"'),
  'FlatDNA must reuse the exact-string feature flag parser',
)
assert.ok(
  features.includes('enableFlatDna: fromEnv("VITE_ENABLE_FLAT_DNA")'),
  'enableFlatDna must map to VITE_ENABLE_FLAT_DNA',
)

const enabled = (value) => value === 'true'
for (const value of [undefined, '', 'false', 'TRUE', '1', 'yes']) {
  assert.equal(enabled(value), false, `${String(value)} must not enable FlatDNA`)
}
assert.equal(enabled('true'), true, 'the exact literal true must enable FlatDNA')

const envExample = read('.env.example')
assert.match(envExample, /^VITE_ENABLE_FLAT_DNA=false$/m)

const app = read('src/App.tsx')
const publicSurfaces = [
  ['src/App.tsx', app],
  ['src/pages/Landing.tsx', read('src/pages/Landing.tsx')],
  ['src/pages/Home.tsx', read('src/pages/Home.tsx')],
]
for (const [file, source] of publicSurfaces) {
  assert.ok(!source.includes('enableFlatDna'), `${file} must not consume the FlatDNA flag`)
  assert.ok(!source.includes('/api/v1/flat'), `${file} must not call the FlatDNA API`)
}
assert.ok(!app.includes('path="/flat'), 'App.tsx must not expose a FlatDNA route')

for (const route of [
  '/',
  '/map',
  '/area/:slug/:step',
  '/area/:slug',
  '/card/:shareSlug',
  '/c/:shareSlug',
  '/compare',
  '/brochure',
]) {
  assert.ok(app.includes(`path="${route}"`), `existing route must remain registered: ${route}`)
}

console.log('FlatDNA Phase 0 Batch 0A checks passed.')
