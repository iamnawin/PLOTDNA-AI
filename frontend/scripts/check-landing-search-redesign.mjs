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
assert(landing.includes('grid grid-cols-3 gap-2'), 'search actions must use one balanced three-tile row')
assert(landing.includes('min-h-[62px] min-w-0'), 'search actions must preserve mobile touch targets without overflowing')
assert(landing.includes('Choose an action once. PlotDNA starts the land check immediately.'), 'search actions must explain one-tap behavior')
assert(!landing.includes('Check My Land'), 'landing must not add a second confirmation tap')

console.log('Landing search redesign check passed.')
