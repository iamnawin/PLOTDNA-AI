import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Founder Pass Phase 3C check failed: ${message}`)
    process.exit(1)
  }
}

const features = read('src/lib/features.ts')
const plan = read('src/lib/founderPass/landDnaPlan.ts')
const page = read('src/pages/LandDNACardPage.tsx')
const card = read('src/components/landDna/LandDNACard.tsx')
const combined = [plan, page, card].join('\n')

assert(
  features.includes('enableFounderPassGating: fromEnv("VITE_ENABLE_FOUNDER_PASS_GATING")'),
  'Founder Pass gating must be behind VITE_ENABLE_FOUNDER_PASS_GATING',
)
assert(plan.includes('card_limit: 1'), 'free plan must limit cards to 1')
assert(plan.includes('card_limit: 100'), 'founder plan must use a configured finite card limit')
assert(plan.includes("requires_email: true"), 'plans must require email')
assert(plan.includes("paymentStatus: founderActive ? 'paid' : 'unpaid'"), 'paid status must come only from existing active entitlement')
assert(plan.includes("'unpaid' | 'paid' | 'failed' | 'refunded'"), 'payment status must stay explicit')
assert(plan.includes('Check one area free. Unlock the city for Rs 99.'), 'Founder Pass marketing line must be present')
assert(page.includes('getCachedEntitlements()') && page.includes('getLandDnaAccessState'), 'card page must reuse existing entitlement cache')
assert(card.includes('Founder Pass') && card.includes('Payment status:'), 'card must display plan/payment status when gating is enabled')
assert(card.includes('href={`/area/${area.slug}`}'), 'upgrade CTA must reuse existing area report Rs 99 path')
assert(!/unlimited/i.test(combined), 'Founder plan must not hardcode unlimited')
assert(!/localStorage\.setItem\([^)]*paid|paymentStatus:\s*'paid'/i.test(combined), 'Phase 3C must not fake paid state')
assert(!/createReportPaymentLink|recoverCustomReportPayment|razorpay/i.test(combined), 'Phase 3C must not create a parallel payment flow')

console.log('Founder Pass Phase 3C checks passed')
