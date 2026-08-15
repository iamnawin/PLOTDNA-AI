import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8')

const features = read('src/lib/features.ts')
assert.ok(
  features.includes('value === undefined ? fallback : value === "true"'),
  'FlatDNA must preserve exact-string parsing when a flag is configured',
)
assert.ok(
  features.includes('enableFlatDna: fromEnv("VITE_ENABLE_FLAT_DNA", import.meta.env.PROD)'),
  'enableFlatDna must default on only for production builds',
)

const enabled = (value, fallback = false) => value === undefined ? fallback : value === 'true'
for (const value of ['', 'false', 'TRUE', '1', 'yes']) {
  assert.equal(enabled(value), false, `${String(value)} must not enable FlatDNA`)
}
assert.equal(enabled(undefined), false, 'missing local flag must keep FlatDNA disabled')
assert.equal(enabled(undefined, true), true, 'missing production flag must enable the released FlatDNA flow')
assert.equal(enabled('false', true), false, 'explicit false must remain the production rollback')
assert.equal(enabled('true'), true, 'the exact literal true must enable FlatDNA')

const envExample = read('.env.example')
assert.match(envExample, /^VITE_ENABLE_FLAT_DNA=false$/m)

const app = read('src/App.tsx')
const entry = read('src/pages/PropertyEntry.tsx')
const flatSearch = read('src/pages/FlatProjectSearch.tsx')
const api = read('src/lib/api.ts')

assert.ok(app.includes('featureFlags.enableFlatDna ? <FlatProjectSearch /> : <Navigate to="/" replace />'), 'direct /flat access must be feature gated')
assert.ok(entry.includes('featureFlags.enableFlatDna ? ('), 'PropertyDNA entry must feature gate the FlatDNA action')
assert.ok(api.includes('/api/v1/flat/projects/search?q='), 'FlatDNA search must call the existing backend endpoint')
assert.ok(!flatSearch.includes('registry.json'), 'FlatDNA UI must not ship registry data')
assert.ok(!flatSearch.includes('resolver'), 'FlatDNA UI must not implement resolver logic')

for (const route of [
  '/',
  '/plot',
  '/flat',
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

console.log('FlatDNA frontend feature-boundary checks passed.')
