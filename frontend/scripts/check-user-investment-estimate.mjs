import assert from 'node:assert/strict'
import { buildUserInvestmentEstimate } from '../src/lib/userInvestmentEstimate.ts'

const estimate = buildUserInvestmentEstimate({
  pricePerSqft: 5500,
  plotSizeSqft: 1000,
  baseEstimatedPricePerSqft: 5500,
  fiveYearProjectedPricePerSqft: 7700,
  yoy: 14,
})

assert.equal(estimate.currentValue, 5500000)
assert.equal(estimate.fiveYearValue, 7700000)
assert.equal(estimate.tenYearValue, 10266667)
assert.equal(estimate.fiveYearProfit, 2200000)
assert.equal(estimate.tenYearProfit, 4766667)
assert.equal(estimate.fiveYearProfitPct, 40)
assert.equal(estimate.tenYearProfitPct, 87)
assert.equal(estimate.fiveYearPricePerSqft, 7700)
assert.equal(estimate.tenYearPricePerSqft, 10267)

const invalid = buildUserInvestmentEstimate({
  pricePerSqft: Number.NaN,
  plotSizeSqft: -50,
  baseEstimatedPricePerSqft: 5000,
  yoy: 12,
})

assert.equal(invalid.currentValue, 0)
assert.equal(invalid.fiveYearValue, 0)
assert.equal(invalid.tenYearValue, 0)
assert.equal(invalid.fiveYearProfitPct, 0)
assert.equal(invalid.tenYearProfitPct, 0)

console.log('User investment estimate check passed.')
