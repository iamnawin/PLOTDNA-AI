import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const landing = readFileSync(path.join(__dirname, '../src/pages/Landing.tsx'), 'utf8')
const home = readFileSync(path.join(__dirname, '../src/pages/Home.tsx'), 'utf8')

const locateHandler = landing.slice(landing.indexOf('function handleLocateMe()'), landing.indexOf('async function handlePasteLink'))
assert.ok(locateHandler.includes("goToCoords(coords)"), 'Locate Me must start the existing coordinate check immediately')
assert.ok(!locateHandler.includes('selectCoordsForCheck'), 'Locate Me must not require a second Check My Land tap')

const dropdown = landing.slice(landing.indexOf('{results.map'), landing.indexOf('</motion.div>', landing.indexOf('{results.map')))
assert.ok(dropdown.includes('goToArea(areaWithCity)'), 'area suggestion must open the verdict in one tap')

assert.ok(!home.includes('openAreaReportWithLoader'), 'DNA report CTA must not route through an extra loader stage')
assert.ok(home.includes('const openAreaReport = useCallback'), 'Home must expose direct report navigation')

console.log('One-tap buyer navigation checks passed.')
