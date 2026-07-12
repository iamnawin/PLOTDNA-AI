import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const tabs = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/features/areaStory/AreaStoryTabBar.tsx'), 'utf8')
assert.ok(tabs.includes("step === 'check' ? '/'"), 'bottom Home nav must route to the main landing/search screen')
assert.ok(!tabs.includes("step === 'check' ? '/map'"), 'bottom Home nav must not route to Map Proof/map screen')

console.log('Home navigation route checks passed.')
