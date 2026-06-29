import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Growth Forecast Phase 3A check failed: ${message}`)
    process.exit(1)
  }
}

const features = read('src/lib/features.ts')
const card = read('src/components/forecast/GrowthForecastCard.tsx')
const forecast = read('src/lib/forecast/growthForecast.ts')
const scoreCard = read('src/components/score/ScoreCard.tsx')
const plotAnalysisCard = read('src/components/score/PlotAnalysisCard.tsx')
const landDnaCard = read('src/components/landDna/LandDNACard.tsx')
const combinedNewSurface = [card, forecast, scoreCard, plotAnalysisCard, landDnaCard].join('\n')

assert(
  features.includes('enableGrowthForecastCard: fromEnv("VITE_ENABLE_GROWTH_FORECAST_CARD")'),
  'Growth Forecast card must be behind VITE_ENABLE_GROWTH_FORECAST_CARD',
)
assert(card.includes('Growth Forecast'), 'card must use Growth Forecast label')
assert(card.includes('Expected 6-Month Growth'), 'card must label 6-month range as Expected Growth')
assert(card.includes('Expected 12-Month Growth'), 'card must label 12-month range as Expected Growth')
assert(forecast.includes('not a guaranteed return'), 'forecast disclaimer must reject guaranteed returns')
assert(forecast.includes('getGrowthForecastForArea') && forecast.includes('return forecast?.forecast_available ? forecast : null'), 'helper must return null when forecast is unavailable')
assert(scoreCard.includes('featureFlags.enableGrowthForecastCard') && scoreCard.includes('getGrowthForecastForArea(area.slug)'), 'ScoreCard must gate forecast by feature flag and explicit area payload')
assert(plotAnalysisCard.includes('featureFlags.enableGrowthForecastCard') && plotAnalysisCard.includes('getGrowthForecastForArea(staticArea.slug)'), 'PlotAnalysisCard must gate forecast by feature flag and explicit area payload')
assert(landDnaCard.includes('featureFlags.enableGrowthForecastCard') && landDnaCard.includes('getGrowthForecastForArea(area.slug)'), 'LandDNACard must also gate forecast reuse by Growth Forecast feature flag')
assert(!/TimesFM|timesfm/i.test(combinedNewSurface), 'Phase 3A must not integrate TimesFM')
assert(!/Market Forecast/.test(combinedNewSurface), 'user-facing copy must not say Market Forecast')
assert(!/Momentum/.test(combinedNewSurface), 'user-facing copy must not say Momentum')
assert(!/\bbelt\b/i.test(combinedNewSurface), 'new Growth Forecast user-facing copy must not use belt')
assert(!/score\s*[+\-*/=]/i.test(forecast), 'forecast helper must not change score formulas')

console.log('Growth Forecast Phase 3A checks passed')
