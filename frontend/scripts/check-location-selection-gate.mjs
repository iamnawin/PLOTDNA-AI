import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const landing = readFileSync(path.join(root, 'src/pages/Landing.tsx'), 'utf8')
const home = readFileSync(path.join(root, 'src/pages/Home.tsx'), 'utf8')
const map = readFileSync(path.join(root, 'src/components/map/MapView.tsx'), 'utf8')

for (const token of ['selectedLandInput', 'Selected location', 'Open Area', 'selectCoords(coords', 'selectArea(area']) {
  assert.ok(landing.includes(token), `landing selection gate missing: ${token}`)
}
const locateHandler = landing.slice(landing.indexOf('function handleLocateMe()'), landing.indexOf('async function handlePasteLink'))
assert.ok(locateHandler.includes("selectCoords(coords, 'locate_me'"), 'Locate Me must select coordinates')
assert.ok(!locateHandler.includes('navigate('), 'Locate Me must not navigate')
assert.ok(home.includes('setSearchCoords(droppedCoords)'), 'Drop Pin must select coordinates')
assert.ok(!map.includes('handleDblClick'), 'map double click must not bypass Open Area')

console.log('Location selection gate checks passed.')
