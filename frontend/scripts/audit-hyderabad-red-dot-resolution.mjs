import fs from 'node:fs'
import path from 'node:path'

const frontendRoot = process.cwd().endsWith(`${path.sep}frontend`)
  ? process.cwd()
  : path.join(process.cwd(), 'frontend')
const repoRoot = path.resolve(frontendRoot, '..')
const dataRoot = path.join(repoRoot, 'data', 'cities', 'hyderabad')

const city = readJson(path.join(dataRoot, 'city.json'))
const catalog = readJson(path.join(repoRoot, 'data', 'catalog', 'hyderabad.json'))
const coverage = readJson(path.join(dataRoot, 'coverage-areas.geojson'))
const expansion = readJson(path.join(dataRoot, 'expansion-zones.geojson'))

const safeNearbyRadiusKm = city.nearbyMicroMarketRadiusKm ?? 5

const testPoints = [
  { label: 'Aminpur / Ameenpur', lat: 17.5222, lng: 78.3159, expectation: 'scored' },
  { label: 'Beeramguda / Kardhanur fixed pin', lat: 17.51524, lng: 78.29184, expectation: 'scored' },
  { label: 'Kardhanur village', lat: 17.517, lng: 78.289, expectation: 'scored' },
  { label: 'Ramachandrapuram', lat: 17.5198, lng: 78.303, expectation: 'scored' },
  { label: 'Patancheru', lat: 17.5333, lng: 78.2645, expectation: 'scored' },
  { label: 'BHEL', lat: 17.493, lng: 78.3005, expectation: 'scored' },
  { label: 'Miyapur', lat: 17.4933, lng: 78.3915, expectation: 'scored' },
  { label: 'Bachupally', lat: 17.547, lng: 78.355, expectation: 'scored' },
  { label: 'Nizampet', lat: 17.5183, lng: 78.3827, expectation: 'scored' },
  { label: 'Tellapur', lat: 17.463, lng: 78.292, expectation: 'scored' },
  { label: 'Kokapet', lat: 17.3947, lng: 78.3438, expectation: 'scored' },
  { label: 'Narsingi', lat: 17.3883, lng: 78.3566, expectation: 'scored' },
  { label: 'Shamshabad / Airport corridor', lat: 17.2512, lng: 78.4377, expectation: 'scored' },
  { label: 'Rajendranagar / Attapur', lat: 17.3544, lng: 78.4284, expectation: 'scored' },
  { label: 'Uppal', lat: 17.4058, lng: 78.5591, expectation: 'scored' },
  { label: 'Ghatkesar', lat: 17.455, lng: 78.74, expectation: 'scored' },
  { label: 'Ghatkesar west / Aushapur edge', lat: 17.4508, lng: 78.6853, expectation: 'pending' },
  { label: 'Kompally', lat: 17.5384, lng: 78.487, expectation: 'scored' },
  { label: 'Medchal', lat: 17.6297, lng: 78.4814, expectation: 'scored' },
  { label: 'Shamirpet', lat: 17.5949, lng: 78.573, expectation: 'scored' },
  { label: 'LB Nagar / Hayathnagar', lat: 17.345, lng: 78.552, expectation: 'scored' },
  { label: 'Sangareddy-facing western side', lat: 17.66, lng: 77.86, expectation: 'pending' },
  { label: 'Vikarabad-facing western side', lat: 17.42, lng: 77.52, expectation: 'pending' },
  { label: 'Bhongir-facing eastern side', lat: 17.515, lng: 78.8856, expectation: 'pending' },
  { label: 'Farooqnagar / Mahbubnagar-facing southern side', lat: 16.98, lng: 78.15, expectation: 'pending' },
]

const scoredAreas = catalog.areas
  .filter(area => Number.isFinite(area.score) && Array.isArray(area.polygon))
  .map(area => ({
    slug: area.slug,
    name: area.name,
    center: area.center,
    polygon: area.polygon,
    score: area.score,
  }))

const contextCells = coverage.features
  .filter(feature => feature.properties?.contextOnly)
  .map(feature => featureFromGeoJson(feature))
  .filter(Boolean)

const expansionZones = expansion.features
  .filter(feature => feature.properties?.coverage_type === 'generated_expansion')
  .map(feature => featureFromGeoJson(feature))
  .filter(Boolean)

const results = testPoints.map(auditPoint)
const failures = results.filter(result => result.severity === 'fail')
const warnings = results.filter(result => result.severity === 'warn')

console.log(`Hyderabad red-dot resolver regression audit`)
console.log(`Safe nearby scored-market radius: ${safeNearbyRadiusKm}km`)
console.log(`Points audited: ${results.length}`)
console.log('')

for (const result of results) {
  console.log(`${statusIcon(result)} ${result.label}`)
  console.log(`  Input lat/lng: ${formatCoord(result.lat)}, ${formatCoord(result.lng)}`)
  console.log(`  Containing scored polygon: ${formatArea(result.containingScored)}`)
  console.log(`  Containing pending/context/generated polygon: ${formatArea(result.containingContext ?? result.containingExpansion)}`)
  console.log(`  Nearest scored market: ${formatArea(result.nearestScored)} (${result.nearestScored.distanceKm.toFixed(2)}km)`)
  console.log(`  Final resolved result: ${result.finalName}`)
  console.log(`  Final result type: ${result.finalType}`)
  console.log(`  UI would show score: ${yesNo(result.uiShowsScore)}`)
  console.log(`  UI would show Data pending: ${yesNo(result.uiShowsDataPending)}`)
  console.log(`  Reason: ${result.reason}`)
  if (result.warning) console.log(`  Warning: ${result.warning}`)
  console.log('')
}

const counts = countBy(results, result => result.finalType)
console.log('Summary:')
for (const [type, count] of Object.entries(counts)) {
  console.log(`  ${type}: ${count}`)
}
console.log(`  warnings: ${warnings.length}`)
console.log(`  failures: ${failures.length}`)

if (failures.length > 0) {
  console.error('')
  console.error(`Audit failed: ${failures.map(result => result.label).join('; ')}`)
  process.exit(1)
}

function auditPoint(point) {
  const containingScored = findContaining(scoredAreas, point.lat, point.lng)
  const containingContext = findContaining(contextCells, point.lat, point.lng)
  const containingExpansion = findContaining(expansionZones, point.lat, point.lng)
  const nearestScored = findNearest(scoredAreas, point.lat, point.lng)
  const safelyNearby = nearestScored.distanceKm <= safeNearbyRadiusKm

  let finalType = 'uncovered'
  let finalName = 'Uncovered / context-only pending state'
  let reason = 'No scored polygon, safe nearby scored market, context cell, or generated expansion zone was selected.'

  if (containingScored) {
    finalType = 'exact_scored'
    finalName = `${containingScored.name} (${containingScored.slug})`
    reason = 'Coordinate falls inside a scored Hyderabad polygon.'
  } else if (safelyNearby) {
    finalType = 'nearby_scored'
    finalName = `${nearestScored.name} (${nearestScored.slug})`
    reason = `Coordinate is within ${safeNearbyRadiusKm}km of a scored Hyderabad market.`
  } else if (containingContext) {
    finalType = 'pending_context'
    finalName = `${containingContext.name} (${containingContext.slug})`
    reason = 'Coordinate falls inside a pending/context-only cell and no scored market is safely nearby.'
  } else if (containingExpansion) {
    finalType = 'generated_expansion'
    finalName = `${containingExpansion.name} (${containingExpansion.slug})`
    reason = 'Coordinate falls inside a draft generated expansion zone and should show intelligence pending review.'
  }

  const uiShowsScore = finalType === 'exact_scored' || finalType === 'nearby_scored'
  const uiShowsDataPending = !uiShowsScore
  const pendingWonWithScoredNearby = ['pending_context', 'generated_expansion', 'uncovered'].includes(finalType) && safelyNearby
  const expectedScoredMissed = point.expectation === 'scored' && !uiShowsScore

  let severity = 'pass'
  let warning = ''
  if (pendingWonWithScoredNearby) {
    severity = 'fail'
    warning = `Pending/generated/context result won while ${nearestScored.name} is safely nearby at ${nearestScored.distanceKm.toFixed(2)}km.`
  } else if (expectedScoredMissed) {
    severity = 'fail'
    warning = 'Expected a scored or nearby-scored result for this named red-dot area, but the audit resolved it as pending/uncovered.'
  } else if (point.expectation === 'pending' && uiShowsScore) {
    severity = 'warn'
    warning = 'Outskirts check resolved to a scored market; verify this is intended before changing resolver behavior.'
  }

  return {
    ...point,
    containingScored,
    containingContext,
    containingExpansion,
    nearestScored,
    finalType,
    finalName,
    uiShowsScore,
    uiShowsDataPending,
    reason,
    severity,
    warning,
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''))
}

function featureFromGeoJson(feature) {
  const ring = feature.geometry?.coordinates?.[0]
  if (feature.geometry?.type !== 'Polygon' || !Array.isArray(ring)) return null

  const polygon = ring
    .filter(point => point.length >= 2)
    .map(point => [point[1], point[0]])
  if (polygon.length < 3) return null

  const center = centroid(polygon)
  return {
    slug: feature.properties?.slug ?? feature.properties?.id ?? feature.id ?? 'unknown',
    name: feature.properties?.name ?? feature.properties?.id ?? 'Unknown',
    boundaryKind: feature.properties?.boundaryKind ?? feature.properties?.coverage_type ?? null,
    boundaryConfidence: feature.properties?.boundaryConfidence ?? feature.properties?.confidence ?? null,
    center,
    polygon,
  }
}

function findContaining(areas, lat, lng) {
  return areas.find(area => pointInPolygon(lat, lng, area.polygon)) ?? null
}

function findNearest(areas, lat, lng) {
  let best = null
  for (const area of areas) {
    const distanceKm = distKm(lat, lng, area.center[0], area.center[1])
    if (!best || distanceKm < best.distanceKm) {
      best = { ...area, distanceKm }
    }
  }
  return best
}

function pointInPolygon(lat, lng, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i]
    const [latJ, lngJ] = polygon[j]
    const intersects =
      ((lngI > lng) !== (lngJ > lng)) &&
      (lat < ((latJ - latI) * (lng - lngI)) / ((lngJ - lngI) || Number.EPSILON) + latI)
    if (intersects) inside = !inside
  }
  return inside
}

function distKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371
  const toRad = degrees => (degrees * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function centroid(polygon) {
  const points = polygon[0][0] === polygon.at(-1)[0] && polygon[0][1] === polygon.at(-1)[1]
    ? polygon.slice(0, -1)
    : polygon
  return [
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length,
  ]
}

function formatArea(area) {
  if (!area) return 'none'
  return `${area.name} (${area.slug})`
}

function formatCoord(value) {
  return value.toFixed(5)
}

function yesNo(value) {
  return value ? 'yes' : 'no'
}

function statusIcon(result) {
  if (result.severity === 'fail') return '[FAIL]'
  if (result.severity === 'warn') return '[WARN]'
  return '[PASS]'
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}
