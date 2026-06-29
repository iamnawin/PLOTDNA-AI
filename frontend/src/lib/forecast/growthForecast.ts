export interface GrowthForecast {
  forecast_available: boolean
  title: string
  summary: string
  six_month_growth: { min: number; max: number; label: string }
  twelve_month_growth: { min: number; max: number; label: string }
  investment_example?: {
    amount: number
    estimated_value_min: number
    estimated_value_max: number
    label: string
  }
  confidence: 'Low' | 'Medium' | 'High'
  risk: 'Low' | 'Medium' | 'High'
  reason: string
  disclaimer: string
}

const configuredForecasts: Record<string, GrowthForecast> = {
  ameenpur: {
    forecast_available: true,
    title: 'Growth Forecast',
    summary: 'This area is showing positive growth signals.',
    six_month_growth: { min: 4, max: 7, label: '+4% to +7%' },
    twelve_month_growth: { min: 8, max: 14, label: '+8% to +14%' },
    investment_example: {
      amount: 5000000,
      estimated_value_min: 5400000,
      estimated_value_max: 5700000,
      label: 'If you invest Rs 50 lakh: Estimated value after 12 months may be around Rs 54 lakh to Rs 57 lakh.',
    },
    confidence: 'Medium',
    risk: 'Medium',
    reason: 'More buyers are showing interest in this area, nearby residential development is increasing, and recent price movement has been mostly positive.',
    disclaimer: 'This is only an estimated forecast, not a guaranteed return. Final value depends on the exact plot location, approvals, road access, legal status, and overall market conditions.',
  },
  beeramguda: {
    forecast_available: true,
    title: 'Growth Forecast',
    summary: 'This area is showing positive growth signals.',
    six_month_growth: { min: 4, max: 7, label: '+4% to +7%' },
    twelve_month_growth: { min: 8, max: 14, label: '+8% to +14%' },
    investment_example: {
      amount: 5000000,
      estimated_value_min: 5400000,
      estimated_value_max: 5700000,
      label: 'If you invest Rs 50 lakh: Estimated value after 12 months may be around Rs 54 lakh to Rs 57 lakh.',
    },
    confidence: 'Medium',
    risk: 'Medium',
    reason: 'More buyers are showing interest in this area, nearby residential development is increasing, and recent price movement has been mostly positive.',
    disclaimer: 'This is only an estimated forecast, not a guaranteed return. Final value depends on the exact plot location, approvals, road access, legal status, and overall market conditions.',
  },
}

export function getGrowthForecastForArea(areaSlug: string | null | undefined): GrowthForecast | null {
  if (!areaSlug) return null
  const forecast = configuredForecasts[areaSlug]
  return forecast?.forecast_available ? forecast : null
}
