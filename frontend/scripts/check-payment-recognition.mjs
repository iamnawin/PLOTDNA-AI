import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const areaDetail = fs.readFileSync(path.join(root, 'src', 'pages', 'AreaDetail.tsx'), 'utf8')
const modal = fs.readFileSync(path.join(root, 'src', 'components', 'ui', 'CustomReportLeadModal.tsx'), 'utf8')
const api = fs.readFileSync(path.join(root, 'src', 'lib', 'api.ts'), 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Payment recognition check failed: ${message}`)
    process.exit(1)
  }
}

assert(areaDetail.includes('paymentReturnCheckPending'), 'area page must remember that the user left for Razorpay')
assert(areaDetail.includes("window.addEventListener('focus', checkReturnedPaymentAccess)"), 'area page must re-check paid access when the user returns to the tab')
assert(areaDetail.includes("document.addEventListener('visibilitychange', checkReturnedPaymentAccess)"), 'area page must re-check paid access after mobile browser visibility changes')
assert(areaDetail.includes("setPaymentReturnCheckPending(false)"), 'successful payment recognition must stop return polling')
assert(areaDetail.includes("source: 'razorpay_return_check'"), 'return recognition must be tracked separately from manual claims')
assert(modal.includes('<details'), 'Payment ID fallback must be hidden behind a disclosure instead of shown as the primary path')
assert(modal.includes('Having trouble? Use Payment ID fallback'), 'fallback disclosure must explain that Payment ID is only for trouble cases')
assert(modal.includes('Payment ID is only for direct Razorpay payments we cannot match automatically.'), 'fallback helper copy must make email/phone matching the normal path')
assert(!modal.includes('I completed payment'), 'client must not claim that payment completed')
assert(!modal.includes('selfConfirmCustomReportPayment'), 'payment modal must not call the disabled self-confirm endpoint')
assert(!api.includes('export async function selfConfirmCustomReportPayment'), 'API client must not expose unverified payment activation')
assert(modal.includes('Waiting for verified payment'), 'payment return state must explain that server verification controls access')

console.log('Payment recognition check passed.')
