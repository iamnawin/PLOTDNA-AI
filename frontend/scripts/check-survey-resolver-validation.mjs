import { validateSurveyLandDetail } from '../src/lib/landIdentity/surveyResolver.ts'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

assert(
  !validateSurveyLandDetail('Survey number', 'PB-773820').valid,
  'Survey number must reject passbook-looking values',
)
assert(
  validateSurveyLandDetail('Khata / passbook number', 'PB-773820').valid,
  'Khata / passbook number must accept passbook-looking values',
)
assert(
  validateSurveyLandDetail('Survey number', '76/2').valid,
  'Survey number must accept survey-number-looking values',
)
assert(
  validateSurveyLandDetail('Layout / venture name', 'Green Valley Layout').valid,
  'Layout / venture name must accept name-looking values',
)

console.log('Survey Resolver validation checks passed')
