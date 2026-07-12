import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const pass = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/features/areaStory/screens/PassScreen.tsx'), 'utf8')
assert.ok(pass.includes('whitespace-nowrap'), 'Founder Pass label must stay on one line')
assert.ok(pass.includes('<span className="sm:hidden">Unlock Founder Pass — ₹99</span>'), 'mobile Founder Pass label missing')
assert.ok(pass.includes('<span className="hidden sm:inline">Unlock Founder Pass — ₹99 Lifetime Access</span>'), 'larger-screen Founder Pass label missing')

console.log('Founder Pass mobile CTA checks passed.')
