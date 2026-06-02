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
assert(!api.includes("throw new Error(errorBody.detail ?? 'Could not submit request. Please try again.')"), 'custom report submit must not throw raw detail values')

console.log('Custom report error message check passed.')
