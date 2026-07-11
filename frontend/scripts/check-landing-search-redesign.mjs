import fs from 'node:fs'
import path from 'node:path'

const landingPath = path.join(process.cwd(), 'src', 'pages', 'Landing.tsx')
const landing = fs.readFileSync(landingPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Landing search redesign check failed: ${message}`)
    process.exit(1)
  }
}

assert(landing.includes('aria-label="PlotDNA location search"'), 'landing search must expose a named search surface')
assert(landing.includes('rounded-[28px]'), 'landing search should use a distinctive rounded premium shell')
assert(landing.includes('grid grid-cols-1 gap-2.5'), 'search shell must keep the input and actions in a compact vertical flow')
assert(landing.includes('min-h-12'), 'input area must have stable tap-friendly height')
assert(landing.includes('Search area, paste Google Maps link'), 'placeholder should explain the supported mobile inputs')
assert(landing.includes('grid-cols-[38px_1fr]'), 'search input should use a compact icon/input layout')
assert(landing.includes('grid grid-cols-3 overflow-hidden rounded-xl'), 'search actions must use one compact segmented row')
assert(landing.includes('min-h-11 min-w-0'), 'search actions must preserve mobile touch targets without overflowing')
assert(landing.includes('Select land first — search, locate, paste link, or drop pin.'), 'disabled gate must explain how to select land')

console.log('Landing search redesign check passed.')
