import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  } else {
    console.log(`PASS: ${message}`)
  }
}

const appTsx = readFileSync(path.join(__dirname, '../src/App.tsx'), 'utf-8')
assert(appTsx.includes('/area/:slug/:step'), 'App.tsx registers the area story shell route')
assert(appTsx.includes('LegacyAreaRedirect'), 'App.tsx redirects the legacy /area/:slug route into the story shell')
assert(appTsx.includes('path="/area/:slug"'), 'App.tsx still registers the legacy /area/:slug route')

const shellTsx = readFileSync(path.join(__dirname, '../src/features/areaStory/AreaStoryShell.tsx'), 'utf-8')
assert(shellTsx.includes('AreaStoryTabBar'), 'AreaStoryShell renders the tab bar')
assert(shellTsx.includes('Navigate to="/map"'), 'AreaStoryShell redirects to /map when area is missing')

const tabBarTsx = readFileSync(path.join(__dirname, '../src/features/areaStory/AreaStoryTabBar.tsx'), 'utf-8')
assert(tabBarTsx.includes("'check', 'verdict', 'money', 'map', 'compare', 'pass'"), 'tab bar has all 6 expected tabs in order')

if (process.exitCode === 1) {
  console.error('\nSome checks failed.')
  process.exit(1)
}
console.log('\nAll area story shell checks passed.')
