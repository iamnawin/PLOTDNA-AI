export type LocationInputType =
  | 'locate_me'
  | 'area_search'
  | 'place_search'
  | 'drop_pin'
  | 'survey_search'

export type ConfidenceLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'unknown'

export type SurveyStatus =
  | 'not_requested'
  | 'not_available'
  | 'possible_match'
  | 'confirmed_from_cadastral'
  | 'manual_verification_required'

export type TrustSignalStatus =
  | 'not_checked'
  | 'found'
  | 'not_found'
  | 'partial'
  | 'risk'
  | 'manual_verification_required'

export type CoverageType =
  | 'flagship_boundary'
  | 'existing_market_polygon'
  | 'generated_expansion'
  | 'micro_zone'
  | 'admin_boundary'
  | 'survey_parcel'
  | 'excluded_area'

export type PlotDnaPolygon = {
  id: string
  name: string
  city: string
  coverageType: CoverageType
  source: string
  status: 'draft_review' | 'active' | 'manual_reviewed' | 'deprecated'
  confidence: Exclude<ConfidenceLevel, 'unknown'>
  notes?: string
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
}

export type LocationIntelligence = {
  inputType: LocationInputType
  inputValue?: string
  lat?: number
  lng?: number
  insideCoverage?: boolean
  flagshipRegion?: string
  matchedMicroZone?: {
    id: string
    name: string
    confidence: ConfidenceLevel
  }
  nearestLocality?: string
  reverseGeocodedAddress?: string
  survey: {
    status: SurveyStatus
    surveyNumber?: string
    subdivisionNumber?: string
    district?: string
    mandal?: string
    village?: string
    confidence: ConfidenceLevel
    message: string
  }
  approvalSignals: {
    status: 'not_checked' | 'available' | 'not_found' | 'needs_review'
    authority?: string
    confidence: ConfidenceLevel
  }
  infrastructure: {
    status: 'not_checked' | 'available' | 'partial'
    score?: number
  }
  developmentHistory: {
    status: 'not_checked' | 'available' | 'partial'
    trend?: 'slow' | 'moderate' | 'fast' | 'unknown'
  }
  ownershipDocumentation: {
    status:
      | 'not_checked'
      | 'documents_required'
      | 'partial'
      | 'manual_verification_required'
    confidence: ConfidenceLevel
  }
  riskFlags: string[]
}

export type LandTrustSignals = {
  layoutApproval: {
    status: TrustSignalStatus
    authority?: string
    approvalType?: string
    approvalNumber?: string
    confidence: ConfidenceLevel
    notes: string[]
  }
  surveyIdentity: {
    status: TrustSignalStatus
    district?: string
    mandal?: string
    village?: string
    surveyNumber?: string
    subdivisionNumber?: string
    confidence: ConfidenceLevel
    notes: string[]
  }
  infrastructure: {
    status: TrustSignalStatus
    roadAccess?: 'poor' | 'medium' | 'strong' | 'unknown'
    water?: 'unknown' | 'nearby' | 'available'
    drainage?: 'unknown' | 'nearby' | 'available'
    power?: 'unknown' | 'nearby' | 'available'
    transitScore?: number
    readinessScore?: number
    notes: string[]
  }
  ownershipDocumentation: {
    status: TrustSignalStatus
    availableDocs: string[]
    missingDocs: string[]
    confidence: ConfidenceLevel
    notes: string[]
  }
  developmentHistory: {
    status: TrustSignalStatus
    trend?: 'slow' | 'moderate' | 'fast' | 'unknown'
    nearbyGrowth?: string[]
    riskEvents?: string[]
    confidence: ConfidenceLevel
    notes: string[]
  }
}
