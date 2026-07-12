import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const landing = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/pages/Landing.tsx'), 'utf8')
const handler = landing.slice(landing.indexOf('async function handleOpenArea()'), landing.indexOf('async function handleEnter()'))

for (const token of ['isOpeningArea', 'setIsOpeningArea(true)', 'disabled={isOpeningArea}', 'Opening area…', 'animate-spin']) {
  assert.ok(landing.includes(token), `Open Area loading state missing: ${token}`)
}
assert.ok(handler.includes('if (isOpeningArea || !selectedLandInput) return'), 'Open Area must be idempotent')
assert.ok(handler.includes('setIsOpeningArea(false)'), 'Open Area must reset loading after failure')

console.log('Open Area loading state checks passed.')
