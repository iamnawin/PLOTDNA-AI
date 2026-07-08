import fs from 'node:fs'
import path from 'node:path'

const comparePath = path.join(process.cwd(), 'src', 'pages', 'CompareAreas.tsx')
const compare = fs.readFileSync(comparePath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Compare return navigation check failed: ${message}`)
    process.exit(1)
  }
}

assert(compare.includes('TrendingUp, X') || compare.includes('X,'), 'compare page must import the X icon for a top close control')
assert(compare.includes('returnToParam'), 'compare page must read an optional return target')
assert(compare.includes('isSafeReturnPath'), 'compare page must sanitize return targets before navigating')
assert(compare.includes('const dnaReturnPath ='), 'compare page must compute a full DNA return path')
assert(compare.includes("`/area/${selectedAreas[0]?.slug ?? 'adibatla'}`"), 'compare page must fall back to the first compared full DNA page')
assert(compare.includes('navigate(dnaReturnPath)'), 'compare page back and close actions must return to the full DNA page')
assert(compare.includes('aria-label="Close comparison and return to verdict"'), 'compare page must expose an accessible close button')
assert(compare.includes('<X size={15} />'), 'compare close control must render the cross icon')
assert(!compare.includes("onClick={() => navigate('/')}"), 'compare page must not send back navigation to the landing/home screen')
assert(!compare.includes('to="/map"'), 'compare page top-right control must not force users to the map when closing comparison')
assert(compare.includes('Which area is better for my money?'), 'compare page must use the buyer decision framing')
assert(compare.includes('Generate Area Pass'), 'compare page must bridge to the Area Pass screen')
assert(compare.includes('PlotDNA compare footer navigation'), 'compare page must include bottom app navigation')

console.log('Compare return navigation check passed.')
