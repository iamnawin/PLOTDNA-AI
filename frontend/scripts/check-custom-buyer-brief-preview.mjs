import fs from 'node:fs'
import path from 'node:path'

const areaDetailPath = path.join(process.cwd(), 'src', 'pages', 'AreaDetail.tsx')
const modalPath = path.join(process.cwd(), 'src', 'components', 'ui', 'CustomReportLeadModal.tsx')

const areaDetail = fs.readFileSync(areaDetailPath, 'utf8')
const modal = fs.readFileSync(modalPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Custom buyer brief preview check failed: ${message}`)
    process.exit(1)
  }
}

const customBypassMatch = areaDetail.match(
  /if\s*\(\s*packageInterest\s*===\s*'custom_due_diligence_499'\s*\)\s*{([\s\S]*?)\n\s*}/,
)

assert(customBypassMatch, 'AreaDetail must branch custom buyer brief requests before payment handling')

const customBypass = customBypassMatch[1]

assert(customBypass.includes('setSelectedReportPaymentRequired(false)'), 'Rs 499 preview must disable payment required')
assert(customBypass.includes('setCustomReportOpen(true)'), 'Rs 499 preview must open the lead/context modal')
assert(!customBypass.includes('checkReportAccess'), 'Rs 499 preview must not call entitlement access check')
assert(!customBypass.includes('openReportPaymentLink'), 'Rs 499 preview must not open Razorpay')
assert(areaDetail.includes("Preview Rs 499 brief"), 'Rs 499 pricing CTA must be a preview action, not a payment action')
assert(areaDetail.includes("Preview custom buyer verification brief"), 'summary CTA must clearly preview the custom brief')
assert(areaDetail.includes("paymentRequired={selectedReportPackage === 'custom_due_diligence_499' ? false : selectedReportPaymentRequired}"), 'Rs 499 modal must explicitly bypass payment-required state')
assert(areaDetail.includes("canGenerateBrief={selectedReportPackage === 'custom_due_diligence_499'}"), 'Rs 499 modal must always enable preview generation')
assert(modal.includes("canGenerateBrief ? 'Generate preview brief'"), 'custom modal submit button must not ask for a payment link when preview generation is enabled')
assert(modal.includes('onGenerateBrief(leadInput)'), 'custom preview must generate the PDF after the lead context is submitted')
assert(modal.includes("canGenerateBrief ? 'Preview generated'"), 'custom preview confirmation must not read like a manual payment request')

console.log('Custom buyer brief preview check passed.')
