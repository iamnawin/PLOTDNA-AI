import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const repoRoot = path.resolve(root, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function readRepo(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Land DNA Card share QA failed: ${message}`)
    process.exit(1)
  }
}

function getAreaBlock(source, slug) {
  const marker = `...locality("${slug}")`
  const start = source.indexOf(marker)
  assert(start >= 0, `missing Hyderabad area block for ${slug}`)

  const next = source.indexOf('...locality("', start + marker.length)
  return source.slice(start, next >= 0 ? next : source.length)
}

function getNumber(block, field) {
  const match = block.match(new RegExp(`"${field}"\\s*:\\s*(\\d+)`))
  return match ? Number(match[1]) : null
}

function getFirstHighlight(block) {
  const match = block.match(/"highlights"\s*:\s*\[\s*"([^"]+)"/)
  return match?.[1] ?? null
}

function getAreaCode(cityName, areaName, score) {
  const city = cityName.slice(0, 3).toUpperCase()
  const areaCode = areaName
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X')
  return `${city}-${areaCode}-${String(score).padStart(3, '0')}`
}

const hyderabad = read('src/data/hyderabad.ts')
const forecast = read('src/lib/forecast/growthForecast.ts')
const cardLib = read('src/lib/landDnaCard.ts')
const card = read('src/components/landDna/LandDNACard.tsx')
const page = read('src/pages/LandDNACardPage.tsx')
const localities = JSON.parse(readRepo('data/cities/hyderabad/localities.json'))
const localityBySlug = new Map(localities.map(locality => [locality.slug, locality]))
const forecastSlugs = new Set([...forecast.matchAll(/^\s{2}([a-z0-9-]+):\s*\{/gm)].map(match => match[1]))

const samples = ['peerzadiguda', 'yapral', 'ameenpur', 'beeramguda']
const rows = samples.map(slug => {
  const locality = localityBySlug.get(slug)
  assert(locality, `missing locality JSON for ${slug}`)

  const block = getAreaBlock(hyderabad, slug)
  const score = getNumber(block, 'score')
  const infrastructure = getNumber(block, 'infrastructure')
  const connectivity = getNumber(block, 'connectivity')
  const highlight = getFirstHighlight(block)

  assert(Number.isFinite(score), `missing score for ${slug}`)
  assert(Number.isFinite(infrastructure), `missing infrastructure signal for ${slug}`)
  assert(Number.isFinite(connectivity), `missing connectivity signal for ${slug}`)
  assert(highlight, `missing development highlight for ${slug}`)

  return {
    slug,
    name: locality.name,
    code: getAreaCode('Hyderabad', locality.name, score),
    score,
    infrastructure,
    connectivity,
    forecast: forecastSlugs.has(slug),
  }
})

const peerzadiguda = rows.find(row => row.slug === 'peerzadiguda')
assert(peerzadiguda.code === 'HYD-PXX-070', 'Peerzadiguda public code must stay HYD-PXX-070')
assert(rows.find(row => row.slug === 'ameenpur')?.forecast, 'Ameenpur must keep configured forecast data')
assert(rows.find(row => row.slug === 'beeramguda')?.forecast, 'Beeramguda must keep configured forecast data')
assert(!rows.find(row => row.slug === 'peerzadiguda')?.forecast, 'Peerzadiguda must not show forecast rows without data')
assert(!rows.find(row => row.slug === 'yapral')?.forecast, 'Yapral must not show forecast rows without data')

assert(cardLib.includes('area.slug.toLowerCase() === normalized || areaCode.toLowerCase() === normalized'), 'card resolver must support slug and area-code URLs')
assert(cardLib.includes('INVALID_VALUES') && cardLib.includes('not available yet') && cardLib.includes('requires historical data'), 'metric filter must reject unavailable placeholders')
assert(card.includes('growthSignals.length > 0'), 'growth section must render only when forecast-backed metrics exist')
assert(!card.includes('Not available yet'), 'card UI must not render unavailable forecast copy')
assert(page.includes('navigator.share') && page.includes('navigator.clipboard.writeText'), 'share must keep native share plus clipboard fallback')
assert(page.includes('try {') && page.includes('await navigator.share') && page.includes('navigator.clipboard.writeText(publicUrl)'), 'native share failure must fall back to copying the public URL')
assert(page.includes("setMeta('og:title'") && page.includes("setMeta('og:description'") && page.includes("setMeta('twitter:card'"), 'share page must set basic OG/Twitter metadata')
assert(cardLib.includes('plotdna-area-pass-${areaCode}.png'), 'PNG export filename must include the public area code')

console.log('Land DNA Card Phase 3B share QA findings')
console.table(rows)
console.log('Result: dynamic metrics, code routes, slug fallback, hidden unavailable forecasts, share fallback, and PNG fallback checks passed.')
