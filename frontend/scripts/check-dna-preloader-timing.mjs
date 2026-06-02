import fs from 'node:fs'
import path from 'node:path'

const preloaderPath = path.join(process.cwd(), 'src', 'components', 'ui', 'DnaRoutePreloader.tsx')
const preloader = fs.readFileSync(preloaderPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`DNA preloader timing check failed: ${message}`)
    process.exit(1)
  }
}

const stepDurationMatch = preloader.match(/const\s+STEP_READ_MS\s*=\s*(\d+)/)
const completionDelayMatch = preloader.match(/const\s+COMPLETE_DELAY_MS\s*=\s*(\d+)/)

assert(stepDurationMatch, 'loader must use a named STEP_READ_MS timing constant')
assert(completionDelayMatch, 'loader must use a named COMPLETE_DELAY_MS timing constant')

const stepDuration = Number(stepDurationMatch[1])
const completionDelay = Number(completionDelayMatch[1])

assert(stepDuration >= 1100, 'each loader message must stay visible long enough to read')
assert(completionDelay >= 450, 'final loader state must not disappear immediately')
assert(preloader.includes('window.setInterval'), 'loader must continue to advance through DNA steps')
assert(preloader.includes('STEP_READ_MS'), 'loader interval must use the readable step timing constant')
assert(preloader.includes('COMPLETE_DELAY_MS'), 'loader completion must use the readable completion delay constant')

console.log('DNA preloader timing check passed.')
