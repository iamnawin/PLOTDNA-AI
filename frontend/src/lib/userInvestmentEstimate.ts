export interface UserInvestmentEstimateInput {
  pricePerSqft: number
  plotSizeSqft: number
  baseEstimatedPricePerSqft: number
  fiveYearProjectedPricePerSqft?: number
  yoy: number
}

export interface UserInvestmentEstimate {
  currentValue: number
  fiveYearValue: number
  tenYearValue: number
  fiveYearProfit: number
  tenYearProfit: number
  fiveYearProfitPct: number
  tenYearProfitPct: number
  fiveYearPricePerSqft: number
  tenYearPricePerSqft: number
}

function positiveNumber(value: number | undefined) {
  const normalized = Number(value)
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 0
}

function roundCurrency(value: number) {
  return Math.round(value)
}

function roundPct(value: number) {
  return Math.round(value)
}

export function buildUserInvestmentEstimate(input: UserInvestmentEstimateInput): UserInvestmentEstimate {
  const pricePerSqft = positiveNumber(input.pricePerSqft)
  const plotSizeSqft = positiveNumber(input.plotSizeSqft)
  const basePrice = positiveNumber(input.baseEstimatedPricePerSqft) || pricePerSqft
  const currentValue = roundCurrency(pricePerSqft * plotSizeSqft)

  if (!pricePerSqft || !plotSizeSqft || !basePrice || !currentValue) {
    return {
      currentValue: 0,
      fiveYearValue: 0,
      tenYearValue: 0,
      fiveYearProfit: 0,
      tenYearProfit: 0,
      fiveYearProfitPct: 0,
      tenYearProfitPct: 0,
      fiveYearPricePerSqft: 0,
      tenYearPricePerSqft: 0,
    }
  }

  const projectedFiveYearPrice = positiveNumber(input.fiveYearProjectedPricePerSqft)
  const yoy = Math.max(0, Math.min(24, positiveNumber(input.yoy)))
  const fallbackFiveYearGrowth = 1 + Math.min(0.75, (yoy / 100) * 2.6)
  const fiveYearGrowth = projectedFiveYearPrice
    ? Math.max(1, projectedFiveYearPrice / basePrice)
    : fallbackFiveYearGrowth

  const fiveYearPricePerSqft = roundCurrency(pricePerSqft * fiveYearGrowth)
  const fiveYearValue = roundCurrency(fiveYearPricePerSqft * plotSizeSqft)
  const fiveYearProfit = Math.max(0, fiveYearValue - currentValue)
  const fiveYearProfitPct = roundPct((fiveYearProfit / currentValue) * 100)

  const moderatedSecondLeg = 1 + Math.min(0.55, Math.max(0.12, (fiveYearGrowth - 1) * (5 / 6)))
  const tenYearProjectedPricePerSqft = fiveYearPricePerSqft * moderatedSecondLeg
  const tenYearPricePerSqft = roundCurrency(tenYearProjectedPricePerSqft)
  const tenYearValue = roundCurrency(tenYearProjectedPricePerSqft * plotSizeSqft)
  const tenYearProfit = Math.max(0, tenYearValue - currentValue)
  const tenYearProfitPct = roundPct((tenYearProfit / currentValue) * 100)

  return {
    currentValue,
    fiveYearValue,
    tenYearValue,
    fiveYearProfit,
    tenYearProfit,
    fiveYearProfitPct,
    tenYearProfitPct,
    fiveYearPricePerSqft,
    tenYearPricePerSqft,
  }
}
