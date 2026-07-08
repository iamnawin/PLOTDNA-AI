export type AreaStoryStep = 'check' | 'verdict' | 'money' | 'map' | 'details' | 'compare' | 'pass'

interface AreaStoryStepConfig {
  step: AreaStoryStep
  label: string
  path: string
}

export const AREA_STORY_STEPS: AreaStoryStepConfig[] = [
  { step: 'check', label: 'Check', path: 'check' },
  { step: 'verdict', label: 'Verdict', path: 'verdict' },
  { step: 'money', label: 'Money', path: 'money' },
  { step: 'map', label: 'Map', path: 'map' },
  { step: 'details', label: 'Details', path: 'details' },
  { step: 'compare', label: 'Compare', path: 'compare' },
  { step: 'pass', label: 'Pass', path: 'pass' },
]

const STEP_ORDER: AreaStoryStep[] = AREA_STORY_STEPS.map(s => s.step)

export function isAreaStoryStep(value: string | undefined): value is AreaStoryStep {
  return typeof value === 'string' && (STEP_ORDER as string[]).includes(value)
}

export function buildAreaStoryPath(slug: string, step: AreaStoryStep): string {
  const config = AREA_STORY_STEPS.find(s => s.step === step)
  if (!config) throw new Error(`Unknown area story step: ${step}`)
  return `/area/${slug}/${config.path}`
}

export function getNextStep(step: AreaStoryStep): AreaStoryStep | null {
  const index = STEP_ORDER.indexOf(step)
  if (index === -1 || index === STEP_ORDER.length - 1) return null
  return STEP_ORDER[index + 1]
}

export function getPrevStep(step: AreaStoryStep): AreaStoryStep | null {
  const index = STEP_ORDER.indexOf(step)
  if (index <= 0) return null
  return STEP_ORDER[index - 1]
}
