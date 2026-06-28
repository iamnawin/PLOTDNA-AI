import type { ConfidenceLevel } from './types'

export type SurveyResolverMode =
  | 'known_survey_number'
  | 'known_village_mandal'
  | 'pin_only'
  | 'layout_or_venture_name'
  | 'document_upload'

export type SurveyResolverRequest = {
  mode: SurveyResolverMode
  state?: string
  district?: string
  mandal?: string
  village?: string
  surveyNumber?: string
  subdivisionNumber?: string
  lat?: number
  lng?: number
  layoutName?: string
  documentIds?: string[]
}

export type SurveyResolverResult = {
  status: 'not_found' | 'possible_match' | 'manual_verification_required'
  surveyNumber?: string
  subdivisionNumber?: string
  district?: string
  mandal?: string
  village?: string
  confidence: Exclude<ConfidenceLevel, 'unknown'>
  source: 'user_input' | 'document_extraction' | 'manual_review' | 'unknown'
  notes: string[]
}

export function createManualSurveyPlaceholder(notes: string[] = []): SurveyResolverResult {
  return {
    status: 'manual_verification_required',
    confidence: 'low',
    source: 'unknown',
    notes: notes.length > 0
      ? notes
      : ['Survey identity requires cadastral or official record verification.'],
  }
}

export function resolveSurveyFromUserInput(request: SurveyResolverRequest): SurveyResolverResult {
  if (request.mode !== 'known_survey_number' || !request.surveyNumber?.trim()) {
    return createManualSurveyPlaceholder(['Survey number was not provided or cannot be inferred from current map data.'])
  }

  return {
    status: 'possible_match',
    surveyNumber: request.surveyNumber.trim(),
    subdivisionNumber: request.subdivisionNumber?.trim() || undefined,
    district: request.district?.trim() || undefined,
    mandal: request.mandal?.trim() || undefined,
    village: request.village?.trim() || undefined,
    confidence: 'medium',
    source: 'user_input',
    notes: ['User-provided survey context. Official/cadastral verification is still required.'],
  }
}
