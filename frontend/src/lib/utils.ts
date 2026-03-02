export function getScoreColor(score: number): string {
  if (score >= 86) return '#10b981'  // emerald — Goldzone
  if (score >= 66) return '#22c55e'  // green   — Good Growth
  if (score >= 41) return '#f59e0b'  // amber   — Moderate
  return '#ef4444'                   // red     — High Risk
}

export function getScoreLabel(score: number): string {
  if (score >= 86) return 'Goldzone'
  if (score >= 66) return 'Good Growth'
  if (score >= 41) return 'Moderate'
  return 'High Risk'
}

export function getScoreBg(score: number): string {
  if (score >= 86) return 'rgba(16, 185, 129, 0.12)'
  if (score >= 66) return 'rgba(34, 197, 94, 0.12)'
  if (score >= 41) return 'rgba(245, 158, 11, 0.12)'
  return 'rgba(239, 68, 68, 0.12)'
}

export const SIGNAL_LABELS: Record<string, string> = {
  infrastructure: 'Infrastructure',
  population: 'Population Growth',
  satellite: 'Satellite Growth',
  rera: 'RERA Activity',
  employment: 'Employment Hub',
  priceVelocity: 'Price Velocity',
  govtScheme: 'Govt Schemes',
}

export const SIGNAL_WEIGHTS: Record<string, number> = {
  infrastructure: 25,
  population: 20,
  satellite: 20,
  rera: 15,
  employment: 10,
  priceVelocity: 5,
  govtScheme: 5,
}
