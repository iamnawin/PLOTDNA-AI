const fromEnv = (key: string, fallback = false): boolean => {
  const value = import.meta.env[key]
  return value === undefined ? fallback : value === "true"
}

export const featureFlags = {
  enableFlatDna: fromEnv("VITE_ENABLE_FLAT_DNA", import.meta.env.PROD),
  enableLandIdentityFlow: fromEnv("VITE_ENABLE_LAND_IDENTITY_FLOW"),
  enableLocationIntelligencePanel: fromEnv("VITE_ENABLE_LOCATION_INTELLIGENCE_PANEL"),
  enableSurveyResolver: fromEnv("VITE_ENABLE_SURVEY_RESOLVER"),
  enableTrustSignals: fromEnv("VITE_ENABLE_TRUST_SIGNALS"),
  enableMicroZoneMatching: fromEnv("VITE_ENABLE_MICRO_ZONE_MATCHING"),
  enableGrowthForecastCard: fromEnv("VITE_ENABLE_GROWTH_FORECAST_CARD"),
  enableLandDnaCard: fromEnv("VITE_ENABLE_LAND_DNA_CARD"),
  enableFounderPassGating: fromEnv("VITE_ENABLE_FOUNDER_PASS_GATING"),
} as const

export type FeatureFlagName = keyof typeof featureFlags
