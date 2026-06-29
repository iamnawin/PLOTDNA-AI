import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Land DNA Card Phase 3B check failed: ${message}`)
    process.exit(1)
  }
}

const features = read('src/lib/features.ts')
const app = read('src/App.tsx')
const page = read('src/pages/LandDNACardPage.tsx')
const card = read('src/components/landDna/LandDNACard.tsx')
const cardLib = read('src/lib/landDnaCard.ts')
const scoreCard = read('src/components/score/ScoreCard.tsx')
const plotAnalysisCard = read('src/components/score/PlotAnalysisCard.tsx')
const combined = [page, card, cardLib, scoreCard, plotAnalysisCard].join('\n')

assert(
  features.includes('enableLandDnaCard: fromEnv("VITE_ENABLE_LAND_DNA_CARD")'),
  'Land DNA Card must be behind VITE_ENABLE_LAND_DNA_CARD',
)
assert(app.includes('/card/:shareSlug') && app.includes('/c/:shareSlug') && app.includes('featureFlags.enableLandDnaCard'), 'card routes must exist and be feature-gated')
assert(page.includes('navigator.share') && page.includes('navigator.clipboard.writeText'), 'share page must use Web Share API with copy fallback')
assert(page.includes('exportLandDnaCardPng') && cardLib.includes('toPng'), 'card page must provide PNG export fallback')
assert(cardLib.includes('getLandDnaAreaCode') && cardLib.includes('findLandDnaCardMatch'), 'card must generate and resolve unique public area-code links')
assert(card.includes('Area Pass / Land DNA Card'), 'card must present the Area Pass concept')
assert(card.includes('PlotDNA Score') && card.includes('Risk Level'), 'card must show score and risk')
assert(cardLib.includes('getGrowthForecastForArea') || card.includes('getGrowthForecastForArea'), 'card must use forecast data for long-term outlook when available')
assert(cardLib.includes('forecastMultiple'), 'card metrics must derive long-term outlook from forecast data when available')
assert(card.includes('featureFlags.enableGrowthForecastCard'), 'card forecast reuse must respect the Growth Forecast feature flag')
assert(cardLib.includes('Infrastructure Readiness'), 'card must include infrastructure readiness')
assert(cardLib.includes('Connectivity Signal') && cardLib.includes('Nearby Development Signal'), 'card must include required signal sections')
assert(cardLib.includes('5-Year Growth Outlook') && cardLib.includes('10-Year Growth Outlook'), 'card must include indicative long-term outlook sections')
assert(card.includes('growthSignals.length > 0'), 'growth outlook row must be conditional')
assert(cardLib.includes('isMetricAvailable') && cardLib.includes('.filter(metric => metric.available)'), 'metrics must be availability-filtered')
assert(!card.includes('Not available yet') && !card.includes('requires historical data'), 'shared card must not render unavailable metric placeholders')
assert(card.includes('PlotDNA provides location intelligence signals, not legal/title/approval certification'), 'card must include caution line')
assert(card.includes('Unlock Founder Pass - Rs 99 Lifetime Access'), 'card must include Founder Pass CTA copy')
assert(scoreCard.includes('featureFlags.enableLandDnaCard') && scoreCard.includes('getLandDnaCardPathForArea') && scoreCard.includes('Share Land DNA Card'), 'ScoreCard must expose gated area-code share entry')
assert(plotAnalysisCard.includes('featureFlags.enableLandDnaCard') && plotAnalysisCard.includes('getLandDnaCardPathForArea') && plotAnalysisCard.includes('Share Land DNA Card'), 'PlotAnalysisCard must expose gated area-code share entry')
assert(!/createReportPaymentLink|recoverCustomReportPayment|razorpay/i.test(combined), 'Phase 3B must not create a parallel payment flow')
assert(!/social feed|comments|likes|followers/i.test(combined), 'Phase 3B must not become a social platform')

console.log('Land DNA Card Phase 3B checks passed')
