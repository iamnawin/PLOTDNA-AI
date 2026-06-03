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

assert(!areaDetail.includes("openCustomReportRequest('instant_pdf_99'"), 'AreaDetail must not route instant PDF testing through the old payment request handler')
assert(!areaDetail.includes("openCustomReportRequest('custom_due_diligence_499'"), 'AreaDetail must not expose the old custom buyer brief payment CTA in the standard report surface')
assert(!areaDetail.includes("Unlock buyer brief"), 'standard report surface must not show the old buyer brief unlock action')
assert(areaDetail.includes('Download test PDF'), 'standard report surface must expose direct PDF testing instead')
assert(areaDetail.includes("paymentRequired={selectedReportPackage === 'custom_due_diligence_499' ? false : selectedReportPaymentRequired}"), 'Rs 499 modal must explicitly bypass payment-required state')
assert(areaDetail.includes("canGenerateBrief={selectedReportPackage === 'custom_due_diligence_499'}"), 'Rs 499 modal must always enable preview generation')
assert(modal.includes("canGenerateBrief ? 'Prepare preview brief'"), 'custom modal submit button must not ask for a payment link when preview generation is enabled')
assert(!modal.includes('onGenerateBrief(leadInput)'), 'custom preview must not auto-download the PDF when lead context is submitted')
assert(modal.includes("canGenerateBrief ? 'Brief ready'"), 'custom preview confirmation must tell the user the PDF is ready to download')
assert(modal.includes('Download custom brief'), 'custom preview must expose one explicit download action after submit')

console.log('Custom buyer brief preview check passed.')
