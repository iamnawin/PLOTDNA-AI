import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.join(process.cwd(), 'src')
const analytics = readFileSync(path.join(root, 'lib/analytics.ts'), 'utf8')
const landing = readFileSync(path.join(root, 'pages/Landing.tsx'), 'utf8')
const shell = readFileSync(path.join(root, 'features/areaStory/AreaStoryShell.tsx'), 'utf8')
const pass = readFileSync(path.join(root, 'features/areaStory/screens/PassScreen.tsx'), 'utf8')
const report = readFileSync(path.join(root, 'lib/buyerReport.ts'), 'utf8')
const copy = `${analytics}\n${landing}\n${shell}\n${pass}\n${report}`

for (const event of [
  'location_selected', 'open_area_started', 'open_area_completed', 'open_area_failed',
  'resolver_succeeded', 'resolver_failed', 'area_opened', 'screen_viewed',
  'area_pass_generated', 'buyer_report_downloaded', 'feedback_submitted',
]) assert.ok(copy.includes(event), `missing beta analytics event: ${event}`)

assert.ok(analytics.includes('anonymousId: getBrowserId()'), 'events need an anonymous browser id')
assert.ok(analytics.includes('sessionId: getSessionId()'), 'events need a session id')
assert.ok(shell.includes("trackEvent('screen_viewed'"), 'screen events must be centralized in AreaStoryShell')
assert.ok(report.indexOf("doc.save(`plotdna-buyer-report-") < report.indexOf("trackEvent('buyer_report_downloaded'"), 'PDF tracking must happen after save')
assert.ok(pass.includes('Was this useful before visiting the plot?'), 'final screen needs anonymous feedback')

console.log('Beta product analytics checks passed.')
