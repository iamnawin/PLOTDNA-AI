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
assert(landing.includes('before you pay token'), 'hero must use buyer payment-risk language')
assert(!landing.includes('before you trust the pitch'), 'hero must avoid the confusing broker-pitch line')
assert(!landing.includes('Before you visit the plot, check the area DNA.'), 'landing must not include the old long problem section')
assert(!landing.includes('Land buyers do not lose money only on bad plots'), 'landing must avoid the removed explainer-page framing')
assert(!landing.includes('Hidden access risk'), 'landing must not show long problem cards on the compact home screen')
assert(landing.includes('Can I lose money here?'), 'landing must keep simple buyer question cards')
assert(landing.includes('Is the broker price too high?'), 'landing must use layman buyer money language')
assert(landing.includes('selectedLandInput'), 'landing must keep explicit selected land state')
assert(landing.includes('Check My Land'), 'landing must expose Check My Land as the journey gate')
assert(landing.includes('disabled={!canCheckLand}'), 'Check My Land must stay disabled until a selected land input is ready')
assert(landing.includes('Location found. Click Check My Land to continue.'), 'Locate Me must prepare a preview instead of navigating directly')
assert(landing.includes('Google Maps location attached. Click Check My Land'), 'map links must prepare a preview instead of navigating directly')
assert(preloader.includes('Finding the area'), 'loader must start with a short area check')
assert(preloader.includes('Checking money risk'), 'loader must explain the buyer risk check briefly')
assert(!preloader.includes('before you commit capital'), 'loader must avoid investor jargon')
assert(!landing.includes('Live{" \\u00B7 "}<span className="font-display font-bold">{CITY_LIST.length}</span> Cities'), 'landing must not claim all configured cities are live')
assert(!landing.includes('Other city rollouts are coming soon'), 'landing must not show roadmap copy on the compact home screen')
assert(!landing.includes('Hyderabad is live for release'), 'landing must not show release-scope copy on the compact home screen')
assert(!landing.includes('showSignalPreview'), 'landing must not keep the removed city-preview branch')

assert(readme.includes('Hyderabad is the live public release market'), 'README must state Hyderabad is the live release market')
assert(readme.includes('Coming-soon markets'), 'README must document coming-soon markets')
assert(readme.includes('Rs 99 source-of-truth screening PDF'), 'README must document the Rs 99 report')
assert(readme.includes('Rs 499 custom buyer verification brief'), 'README must document the Rs 499 buyer brief')
assert(readme.includes('Admin/test flow for the Rs 499 buyer brief'), 'README must explain how to test the Rs 499 admin brief flow')
assert(readme.includes('POST /api/v1/entitlements/dev/activate'), 'README must document the local entitlement activation endpoint')
assert(readme.includes('ADMIN_ACCESS_USER_IDS'), 'README must document the production-safe admin allowlist')

console.log('Landing rollout copy check passed.')
