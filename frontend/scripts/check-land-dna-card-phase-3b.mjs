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
assert(card.includes('PlotDNA Score') && card.includes('Risk Level'), 'card must show score and risk')
assert(card.includes('GrowthForecastCard'), 'card must reuse GrowthForecastCard when forecast is available')
assert(card.includes('Connectivity signal') && card.includes('Nearby development signal'), 'card must include required signal sections')
assert(card.includes('PlotDNA provides location intelligence signals, not legal/title/approval certification'), 'card must include caution line')
assert(card.includes('Unlock Founder Pass - Rs 99 Lifetime Early Access'), 'card must include Founder Pass CTA copy')
assert(scoreCard.includes('featureFlags.enableLandDnaCard') && scoreCard.includes('Share Land DNA Card'), 'ScoreCard must expose gated share entry')
assert(plotAnalysisCard.includes('featureFlags.enableLandDnaCard') && plotAnalysisCard.includes('Share Land DNA Card'), 'PlotAnalysisCard must expose gated share entry')
assert(!/paymentStatus|paid|refunded|card_limit|watchlist|can_compare/i.test(combined), 'Phase 3B must not implement Founder Pass gating/payment state')
assert(!/social feed|comments|likes|followers/i.test(combined), 'Phase 3B must not become a social platform')

console.log('Land DNA Card Phase 3B checks passed')
