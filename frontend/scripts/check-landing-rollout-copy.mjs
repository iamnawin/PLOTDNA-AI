import fs from 'node:fs'
import path from 'node:path'

const landingPath = path.join(process.cwd(), 'src', 'pages', 'Landing.tsx')
const preloaderPath = path.join(process.cwd(), 'src', 'components', 'ui', 'DnaRoutePreloader.tsx')
const readmePath = path.resolve(process.cwd(), '..', 'README.md')

const landing = fs.readFileSync(landingPath, 'utf8')
const preloader = fs.readFileSync(preloaderPath, 'utf8')
const readme = fs.readFileSync(readmePath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Landing rollout copy check failed: ${message}`)
    process.exit(1)
  }
}

assert(landing.includes('Hyderabad live'), 'nav badge must say Hyderabad live')
assert(landing.includes('Know if the plot is worth buying'), 'hero must use a direct buyer-value headline')
assert(!landing.includes('before you trust the pitch'), 'hero must avoid the confusing broker-pitch line')
assert(preloader.includes('Reading market signals before you commit capital'), 'loader must include investor-context guidance')
assert(preloader.includes('Checking growth, access, risk, and price context'), 'loader must explain the signal mix')
assert(!landing.includes('Live{" \\u00B7 "}<span className="font-display font-bold">{CITY_LIST.length}</span> Cities'), 'landing must not claim all configured cities are live')
assert(landing.includes('Other city rollouts are coming soon'), 'landing must explain non-Hyderabad cities are coming soon')
assert(landing.includes('Coming soon'), 'city chips must expose coming-soon status')
assert(landing.includes('Hyderabad is live for release'), 'landing must state the launch-market scope')
assert(landing.includes('showSignalPreview'), 'non-launch cities must use a separate preview branch')

assert(readme.includes('Hyderabad is the live public release market'), 'README must state Hyderabad is the live release market')
assert(readme.includes('Coming-soon markets'), 'README must document coming-soon markets')
assert(readme.includes('Rs 99 instant screening PDF'), 'README must document the Rs 99 report')
assert(readme.includes('Rs 499 custom buyer verification brief'), 'README must document the Rs 499 buyer brief')
assert(readme.includes('Admin/test flow for the Rs 499 buyer brief'), 'README must explain how to test the Rs 499 admin brief flow')
assert(readme.includes('POST /api/v1/entitlements/dev/activate'), 'README must document the local entitlement activation endpoint')
assert(readme.includes('ADMIN_ACCESS_USER_IDS'), 'README must document the production-safe admin allowlist')

console.log('Landing rollout copy check passed.')
