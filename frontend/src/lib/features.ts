const fromEnv = (key: string): boolean => {
  return import.meta.env[key] === "true"
}

export const featureFlags = {
  enableLandIdentityFlow: fromEnv("VITE_ENABLE_LAND_IDENTITY_FLOW"),
  enableLocationIntelligencePanel: fromEnv("VITE_ENABLE_LOCATION_INTELLIGENCE_PANEL"),
  enableSurveyResolver: fromEnv("VITE_ENABLE_SURVEY_RESOLVER"),
  enableTrustSignals: fromEnv("VITE_ENABLE_TRUST_SIGNALS"),
  enableMicroZoneMatching: fromEnv("VITE_ENABLE_MICRO_ZONE_MATCHING"),
  enableGrowthForecastCard: fromEnv("VITE_ENABLE_GROWTH_FORECAST_CARD"),
  enableLandDnaCard: fromEnv("VITE_ENABLE_LAND_DNA_CARD"),
  enableFounderPassGating: fromEnv("VITE_ENABLE_FOUNDER_PASS_GATING"),
  enableAreaStoryShell: fromEnv("VITE_ENABLE_AREA_STORY_SHELL"),
} as const

export type FeatureFlagName = keyof typeof featureFlags
