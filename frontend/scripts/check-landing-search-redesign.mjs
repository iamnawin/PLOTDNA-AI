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
assert(landing.includes('grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]'), 'search shell must stack actions on mobile and align on desktop')
assert(landing.includes('min-h-[58px]'), 'input area must have stable tap-friendly height')
assert(landing.includes('Search area, coordinates, map link'), 'placeholder should be shorter and fit mobile')
assert(landing.includes('grid-cols-[44px_1fr]'), 'search input should have a structured icon/input layout')
assert(landing.includes('grid grid-cols-2 gap-2 sm:flex'), 'search actions must be two columns on mobile and inline on wider screens')

console.log('Landing search redesign check passed.')
