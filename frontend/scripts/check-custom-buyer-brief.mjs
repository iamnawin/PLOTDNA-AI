import assert from 'node:assert/strict'
import { buildCustomBuyerVerificationBrief } from '../src/lib/customBuyerBrief.ts'

const area = {
  name: 'Beeramguda',
  slug: 'beeramguda',
  category: 'Emerging',
  score: 64,
  yoy: 11,
  priceRange: 'Rs3,500-5,500/sqft',
  dataConfidence: 'partial',
  highlights: [
    'ORR western connector to Patancheru industrial zone',
    'Emerging residential hub catching Miyapur and Lingampally overflow',
  ],
  signals: {
    infrastructure: 68,
    population: 72,
    satellite: 61,
    rera: 44,
    employment: 69,
    priceVelocity: 58,
    govtScheme: 55,
  },
}

const brief = buildCustomBuyerVerificationBrief(area, {
  name: 'Naveen',
  contact: 'naveen@example.com',
  budgetRange: 'Rs 50L-1Cr',
  timeline: '3-6 months',
  notes: 'Survey 42, broker quoted Rs 5,200/sqft, check access road.',
})

assert.equal(brief.title, 'Custom Buyer Verification Brief')
assert.match(brief.audience, /Naveen/)
assert.match(brief.areaLine, /Beeramguda/)
assert.ok(brief.sections.some(section => section.id === 'buyer_context'))
assert.ok(brief.sections.some(section => section.id === 'verification_priorities'))
assert.ok(brief.sections.some(section => section.id === 'seller_questions'))
assert.ok(brief.sections.some(section => section.id === 'price_sanity'))
assert.ok(brief.sections.some(section => section.id === 'next_actions'))
assert.ok(brief.sections.some(section => section.items.some(item => /RERA|title|access/i.test(item))))
assert.ok(brief.sections.some(section => section.items.some(item => /Survey 42/i.test(item))))
assert.ok(!brief.title.includes('Area Intelligence Report'))
