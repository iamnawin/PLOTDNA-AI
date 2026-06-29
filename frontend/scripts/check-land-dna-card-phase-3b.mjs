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
const scoreCard = read('src/components/score/ScoreCard.tsx')
const plotAnalysisCard = read('src/components/score/PlotAnalysisCard.tsx')
const combined = [page, card, scoreCard, plotAnalysisCard].join('\n')

assert(
  features.includes('enableLandDnaCard: fromEnv("VITE_ENABLE_LAND_DNA_CARD")'),
  'Land DNA Card must be behind VITE_ENABLE_LAND_DNA_CARD',
)
assert(app.includes('/card/:shareSlug') && app.includes('featureFlags.enableLandDnaCard'), 'card route must exist and be feature-gated')
assert(page.includes('navigator.share') && page.includes('navigator.clipboard.writeText'), 'share page must use Web Share API with copy fallback')
assert(card.includes('Area Pass / Land DNA Card'), 'card must present the Area Pass concept')
assert(card.includes('PlotDNA Score') && card.includes('Risk Level'), 'card must show score and risk')
assert(card.includes('getGrowthForecastForArea') && card.includes('forecastMultiple'), 'card must use forecast data for long-term outlook when available')
assert(card.includes('featureFlags.enableGrowthForecastCard'), 'card forecast reuse must respect the Growth Forecast feature flag')
assert(card.includes('Infrastructure Readiness'), 'card must include infrastructure readiness')
assert(card.includes('Connectivity Signal') && card.includes('Nearby Development Signal'), 'card must include required signal sections')
assert(card.includes('5-Year Growth Outlook') && card.includes('10-Year Growth Outlook'), 'card must include indicative long-term outlook sections')
assert(card.includes('PlotDNA provides location intelligence signals, not legal/title/approval certification'), 'card must include caution line')
assert(card.includes('Unlock the city with Rs 99'), 'card must include Founder Pass CTA copy')
assert(scoreCard.includes('featureFlags.enableLandDnaCard') && scoreCard.includes('Share Land DNA Card'), 'ScoreCard must expose gated share entry')
assert(plotAnalysisCard.includes('featureFlags.enableLandDnaCard') && plotAnalysisCard.includes('Share Land DNA Card'), 'PlotAnalysisCard must expose gated share entry')
assert(!/createReportPaymentLink|recoverCustomReportPayment|razorpay/i.test(combined), 'Phase 3B must not create a parallel payment flow')
assert(!/social feed|comments|likes|followers/i.test(combined), 'Phase 3B must not become a social platform')

console.log('Land DNA Card Phase 3B checks passed')
