import fs from 'node:fs'
import path from 'node:path'

const apiPath = path.join(process.cwd(), 'src', 'lib', 'api.ts')
const modalPath = path.join(process.cwd(), 'src', 'components', 'ui', 'CustomReportLeadModal.tsx')

const api = fs.readFileSync(apiPath, 'utf8')
const modal = fs.readFileSync(modalPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Custom report error message check failed: ${message}`)
    process.exit(1)
  }
}

assert(modal.includes("if (!name.trim())"), 'custom report form must validate missing name before submitting')
assert(modal.includes('Enter your name'), 'missing-name validation must show readable text')
assert(api.includes('function formatApiErrorMessage'), 'API client must normalize non-string error details')
assert(api.includes('Array.isArray(detail)'), 'API client must handle FastAPI validation detail arrays')
assert(api.includes("throw new Error(formatApiErrorMessage"), 'custom report submit must throw a formatted Error message')
assert(api.includes("isAbortTimeoutError"), 'API client must recognize browser abort timeout errors')
assert(api.includes('Lead capture timed out'), 'API client must show a readable lead timeout message')
assert(!api.includes("throw new Error(errorBody.detail ?? 'Could not submit request. Please try again.')"), 'custom report submit must not throw raw detail values')
assert(modal.includes('canGenerateBrief && isLeadCaptureTimeout'), 'custom buyer brief preview must not block local PDF prep on lead timeout')
assert(modal.includes('preview_'), 'custom buyer brief preview must create a local preview id when lead capture times out')
assert(!modal.includes("setError(err instanceof Error ? err.message : 'Could not submit request. Please try again.')"), 'custom modal must not blindly show raw submit errors')
assert(modal.includes('Check paid access'), 'Rs 99 modal must let returning paid users check by email and phone')
assert(modal.includes('We check your email and phone first'), 'payment recovery must explain email/phone matching before payment ID fallback')
assert(modal.includes('Payment ID fallback'), 'payment ID must be positioned as an optional fallback, not the primary path')
assert(modal.includes('Welcome back'), 'matched paid users must see a welcome-back state')
assert(modal.includes('setPaidAccessMatched'), 'modal must keep matched paid access state separate from lead submission')

console.log('Custom report error message check passed.')
