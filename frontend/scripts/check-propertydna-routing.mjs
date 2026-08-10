import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8')

const app = read('src/App.tsx')
const entry = read('src/pages/PropertyEntry.tsx')
const tabs = read('src/features/areaStory/AreaStoryTabBar.tsx')
const brochure = read('src/pages/BrochurePage.tsx')

assert.ok(app.includes('path="/" element={<PropertyEntry />}'), '/ must render the PropertyDNA entry')
assert.ok(app.includes('path="/plot" element={<Landing />}'), '/plot must preserve the existing PlotDNA landing')
assert.ok(app.includes('path="/flat" element={<FlatRoute />}'), '/flat must use the feature-gated FlatDNA route')
assert.ok(entry.includes('to="/plot"'), 'Plot mode must open /plot')
assert.ok(entry.includes('to="/flat"'), 'enabled Flat mode must open /flat')
assert.ok(tabs.includes("step === 'check' ? '/plot'"), 'PlotDNA Check navigation must return to /plot')
assert.ok(brochure.includes("navigate('/plot')"), 'PlotDNA brochure back action must return to /plot')

for (const route of ['/map', '/area/:slug/:step', '/area/:slug', '/card/:shareSlug', '/c/:shareSlug', '/compare', '/brochure']) {
  assert.ok(app.includes(`path="${route}"`), `existing route must remain registered: ${route}`)
}

console.log('PropertyDNA routing checks passed.')
