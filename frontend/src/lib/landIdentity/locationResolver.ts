import type { LocationInputType, LocationIntelligence } from './types'

export const SURVEY_NOT_CONFIRMED_MESSAGE = 'Survey number not confirmed from current map data.'

export function createInitialLocationIntelligence(input: {
  inputType: LocationInputType
  inputValue?: string
  lat?: number
  lng?: number
  reverseGeocodedAddress?: string
}): LocationIntelligence {
  const hasPin = typeof input.lat === 'number' && typeof input.lng === 'number'

  return {
    inputType: input.inputType,
    inputValue: input.inputValue,
    lat: input.lat,
    lng: input.lng,
    insideCoverage: undefined,
    flagshipRegion: undefined,
    reverseGeocodedAddress: input.reverseGeocodedAddress,
    survey: {
      status: hasPin ? 'not_available' : 'not_requested',
      confidence: 'unknown',
      message: SURVEY_NOT_CONFIRMED_MESSAGE,
    },
    approvalSignals: {
      status: 'not_checked',
      confidence: 'unknown',
    },
    infrastructure: {
      status: 'not_checked',
    },
    developmentHistory: {
      status: 'not_checked',
      trend: 'unknown',
    },
    ownershipDocumentation: {
      status: 'not_checked',
      confidence: 'unknown',
    },
    riskFlags: hasPin ? ['Survey number not confirmed'] : [],
  }
}
