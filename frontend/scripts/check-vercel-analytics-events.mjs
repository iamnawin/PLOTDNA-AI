import fs from 'node:fs'
import path from 'node:path'

const analyticsPath = path.join(process.cwd(), 'src', 'lib', 'analytics.ts')
const analytics = fs.readFileSync(analyticsPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Vercel analytics event check failed: ${message}`)
    process.exit(1)
  }
}

assert(analytics.includes("import { track as trackVercelEvent } from '@vercel/analytics'"), 'analytics helper must import Vercel custom-event tracking')
assert(analytics.includes('trackVercelEvent(name, contextualPayload)'), 'analytics helper must send contextual custom events to Vercel Analytics')
assert(analytics.includes('/api/analytics/events'), 'analytics helper must keep backend analytics storage')

console.log('Vercel analytics event check passed.')
