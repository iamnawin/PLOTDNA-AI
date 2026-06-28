export const featureFlags = {
  enableLandIdentityFlow: false,
  enableLocationIntelligencePanel: false,
  enableSurveyResolver: false,
  enableTrustSignals: false,
  enableMicroZoneMatching: false,
} as const

export type FeatureFlagName = keyof typeof featureFlags
