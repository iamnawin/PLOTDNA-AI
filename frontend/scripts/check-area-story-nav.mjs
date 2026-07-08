import { buildAreaStoryPath, getNextStep, getPrevStep, isAreaStoryStep, AREA_STORY_STEPS } from '../src/features/areaStory/areaStoryNav.ts'

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  } else {
    console.log(`PASS: ${message}`)
  }
}

assert(AREA_STORY_STEPS.length === 7, 'has 7 story steps')
assert(buildAreaStoryPath('kokapet', 'verdict') === '/area/kokapet/verdict', 'builds verdict path')
assert(buildAreaStoryPath('kokapet', 'pass') === '/area/kokapet/pass', 'builds pass path')
assert(getNextStep('verdict') === 'money', 'verdict -> money')
assert(getNextStep('pass') === null, 'pass has no next step')
assert(getPrevStep('verdict') === 'check', 'verdict -> prev check')
assert(getPrevStep('check') === null, 'check has no prev step')
assert(isAreaStoryStep('money') === true, 'money is a valid step')
assert(isAreaStoryStep('bogus') === false, 'bogus is not a valid step')

if (process.exitCode === 1) {
  console.error('\nSome checks failed.')
  process.exit(1)
}
console.log('\nAll area story nav checks passed.')
