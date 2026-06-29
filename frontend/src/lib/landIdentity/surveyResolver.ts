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
  status: 'not_found' | 'possible_match' | 'confirmed' | 'manual_verification_required'
  surveyNumber?: string
  subdivisionNumber?: string
  district?: string
  mandal?: string
  village?: string
  confidence: Exclude<ConfidenceLevel, 'unknown'>
  source: 'user_input' | 'cadastral_overlay' | 'document_extraction' | 'manual_review' | 'unknown'
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
  if (request.mode === 'known_survey_number' && request.surveyNumber?.trim()) {
    const providedTypes = request.documentIds?.length
      ? `Provided detail type: ${request.documentIds.join(', ')}.`
      : 'Provided detail type not selected.'

    return {
      status: 'manual_verification_required',
      surveyNumber: request.surveyNumber.trim(),
      subdivisionNumber: request.subdivisionNumber?.trim() || undefined,
      district: request.district?.trim() || undefined,
      mandal: request.mandal?.trim() || undefined,
      village: request.village?.trim() || undefined,
      confidence: 'low',
      source: 'user_input',
      notes: [
        'Land detail captured. Official verification required.',
        providedTypes,
      ],
    }
  }

  if (request.mode === 'known_village_mandal') {
    return {
      status: 'manual_verification_required',
      district: request.district?.trim() || undefined,
      mandal: request.mandal?.trim() || undefined,
      village: request.village?.trim() || undefined,
      confidence: request.mandal?.trim() && request.village?.trim() ? 'medium' : 'low',
      source: 'user_input',
      notes: [
        'Village/mandal context captured. Survey number still required.',
        'PlotDNA does not certify title or legal ownership. Treat this as a land-intelligence workflow, not a legal certificate.',
      ],
    }
  }

  if (request.mode === 'layout_or_venture_name') {
    return {
      status: 'manual_verification_required',
      confidence: 'low',
      source: 'user_input',
      notes: [
        'Layout or venture name captured. Approval and survey linkage require verification.',
        'PlotDNA does not certify title or legal ownership. Treat this as a land-intelligence workflow, not a legal certificate.',
      ],
    }
  }

  if (request.mode === 'pin_only') {
    return {
      status: 'manual_verification_required',
      confidence: 'low',
      source: 'unknown',
      notes: [
        'This pin gives location context, but survey identity requires cadastral or official land-record verification.',
        'PlotDNA does not certify title or legal ownership. Treat this as a land-intelligence workflow, not a legal certificate.',
      ],
    }
  }

  if (request.mode === 'document_upload') {
    return {
      status: 'manual_verification_required',
      confidence: 'low',
      source: 'manual_review',
      notes: [
        'Document upload and extraction will be added in a later phase.',
        'PlotDNA does not certify title or legal ownership. Treat this as a land-intelligence workflow, not a legal certificate.',
      ],
    }
  }

  return createManualSurveyPlaceholder(['Survey number was not provided or cannot be inferred from current map data.'])
}
