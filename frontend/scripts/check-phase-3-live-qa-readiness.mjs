import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const repoRoot = path.resolve(root, '..')

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) {
    console.error(`Phase 3 live QA readiness failed: missing ${relativePath}`)
    process.exit(1)
  }
  return fs.readFileSync(fullPath, 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Phase 3 live QA readiness failed: ${message}`)
    process.exit(1)
  }
}

const checklist = readRepo('docs/phase-3-live-qa-checklist.md')
const needed = readRepo('NEEDED.md')
const handoff = readRepo('docs/plotdna-next-phase-handoff.md')

const requiredRoutes = [
  '/card/HYD-PXX-070',
  '/card/HYD-YXX-060',
  '/card/HYD-AXX-075',
  '/card/HYD-BXX-064',
  '/card/peerzadiguda',
  '/c/HYD-PXX-070',
]

for (const route of requiredRoutes) {
  assert(checklist.includes(route), `checklist must include ${route}`)
}

const requiredChecks = [
  'Native share',
  'PNG download',
  'Clipboard fallback',
  'Unavailable forecast fields are hidden',
  'Founder Pass CTA routes to the existing Area Detail Rs 99 path',
  'Paid state comes from server entitlement',
  'Razorpay return re-checks report access',
  'TimesFM remains not started',
]

for (const item of requiredChecks) {
  assert(checklist.includes(item), `checklist must cover: ${item}`)
}

assert(checklist.includes('Vercel URL'), 'checklist must leave a Vercel URL slot for public QA')
assert(checklist.includes('iOS Safari') && checklist.includes('Android Chrome'), 'checklist must include real mobile browser targets')
assert(checklist.includes('Do not claim legal/title/approval certification'), 'checklist must preserve legal/title safety copy')
assert(needed.includes('Phase 3 live QA checklist'), 'NEEDED.md must point to the live QA checklist')
assert(handoff.includes('Phase 3 live QA checklist'), 'handoff must point to the live QA checklist')

console.log('Phase 3 live QA readiness findings')
console.table([
  { area: 'Public routes', status: `${requiredRoutes.length} required card URLs listed` },
  { area: 'Share behavior', status: 'native share, clipboard fallback, and PNG download listed' },
  { area: 'Dynamic card data', status: 'unavailable forecast fields must stay hidden' },
  { area: 'Founder Pass', status: 'Rs 99 path and server entitlement checks listed' },
  { area: 'Phase 4 boundary', status: 'TimesFM explicitly remains not started' },
])
console.log('Result: Phase 3 public/mobile/payment QA checklist is ready for Vercel validation.')
