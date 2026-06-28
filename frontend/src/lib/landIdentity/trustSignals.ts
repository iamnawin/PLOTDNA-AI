import type { LandTrustSignals, LocationIntelligence } from './types'

export function buildInitialTrustSignals(locationIntelligence: LocationIntelligence | null): LandTrustSignals {
  const surveyNotes = locationIntelligence?.survey.message
    ? [locationIntelligence.survey.message]
    : ['Survey number not confirmed from current map data.']

  return {
    layoutApproval: {
      status: 'not_checked',
      confidence: 'unknown',
      notes: ['Approval signal not checked yet.'],
    },
    surveyIdentity: {
      status: locationIntelligence?.survey.surveyNumber ? 'manual_verification_required' : 'not_checked',
      district: locationIntelligence?.survey.district,
      mandal: locationIntelligence?.survey.mandal,
      village: locationIntelligence?.survey.village,
      surveyNumber: locationIntelligence?.survey.surveyNumber,
      subdivisionNumber: locationIntelligence?.survey.subdivisionNumber,
      confidence: locationIntelligence?.survey.confidence ?? 'unknown',
      notes: surveyNotes,
    },
    infrastructure: {
      status: 'not_checked',
      roadAccess: 'unknown',
      water: 'unknown',
      drainage: 'unknown',
      power: 'unknown',
      notes: ['Infrastructure readiness has not been checked for this exact point.'],
    },
    ownershipDocumentation: {
      status: 'manual_verification_required',
      availableDocs: [],
      missingDocs: ['Sale deed', 'Link documents', 'Encumbrance certificate', 'Layout approval records'],
      confidence: 'unknown',
      notes: ['Documentation confidence requires verified records.'],
    },
    developmentHistory: {
      status: 'not_checked',
      trend: 'unknown',
      confidence: 'unknown',
      notes: ['Development history has not been checked for this exact point.'],
    },
  }
}
