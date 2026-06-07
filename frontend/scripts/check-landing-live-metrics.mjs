import fs from 'node:fs'
import path from 'node:path'

const landingPath = path.join(process.cwd(), 'src', 'pages', 'Landing.tsx')
const landing = fs.readFileSync(landingPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Landing live metrics check failed: ${message}`)
    process.exit(1)
  }
}

assert(landing.includes('const liveAreaCount = CITIES.hyderabad.areas.length'), 'live area count must come from the live Hyderabad dataset')
assert(!landing.includes('const LIVE_NOW_COUNT = '), 'landing must not hardcode live-now user count')
assert(landing.includes('const MIN_LIVE_NOW_COUNT = 143'), 'landing live-now count must start at the 143 launch floor')
assert(landing.includes('Math.max(MIN_LIVE_NOW_COUNT, liveMetrics?.liveUsers ?? 0)'), 'landing must never show live users below the 143 launch floor')
assert(landing.includes('getPublicMetrics'), 'landing must request public live user metrics')
assert(landing.includes('liveMetrics?.liveUsers'), 'bottom strip must render live users from backend metrics when available')
assert(!landing.includes('liveMetrics?.liveUsers ?? 1'), 'bottom strip must not fall back to 1 or show zero-start behavior')
assert(landing.includes('LIVE NOW'), 'bottom strip must show live-now label')
assert(landing.includes('AREAS LIVE'), 'bottom strip must show the accurate live area count label')
assert(landing.includes('liveAreaCount.toLocaleString'), 'live area count must render from computed data')

console.log('Landing live metrics check passed.')
