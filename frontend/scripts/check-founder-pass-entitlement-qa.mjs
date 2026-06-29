import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const repoRoot = path.resolve(root, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function readRepo(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Founder Pass entitlement QA failed: ${message}`)
    process.exit(1)
  }
}

const plan = read('src/lib/founderPass/landDnaPlan.ts')
const page = read('src/pages/LandDNACardPage.tsx')
const card = read('src/components/landDna/LandDNACard.tsx')
const areaDetail = read('src/pages/AreaDetail.tsx')
const modal = read('src/components/ui/CustomReportLeadModal.tsx')
const entitlements = read('src/lib/entitlements.ts')
const api = read('src/lib/api.ts')
const paymentLinks = read('src/lib/paymentLinks.ts')
const backendLeads = readRepo('backend/app/api/routes/leads.py')
const backendEntitlements = readRepo('backend/app/api/routes/entitlements.py')
const backendLeadTests = readRepo('backend/tests/test_custom_report_leads.py')
const backendEntitlementTests = readRepo('backend/tests/test_report_entitlements.py')
const backendPaymentTests = readRepo('backend/tests/test_payment_reconciliation.py')

assert(plan.includes("subscription_active === true"), 'Founder Pass paid state must derive from server entitlement subscription_active')
assert(plan.includes("paymentStatus: founderActive ? 'paid' : 'unpaid'"), 'Founder Pass must not derive paid status from UI state')
assert(plan.includes('card_limit: 1') && plan.includes('card_limit: 100'), 'Founder Pass limits must stay explicit and finite')
assert(!/unlimited/i.test(plan), 'Founder Pass must not claim unlimited access')

assert(page.includes('featureFlags.enableFounderPassGating'), 'Founder Pass card state must be feature-gated')
assert(page.includes('getCachedEntitlements()'), 'Land DNA card page must read cached server entitlements')
assert(!page.includes('getEntitlements()'), 'Land DNA card page must not start a payment/entitlement network flow on share-page load')
assert(card.includes('href={`/area/${area.slug}`}'), 'Founder Pass CTA must reuse the existing area Rs 99 path')
assert(!card.includes('createReportPaymentLink') && !card.includes('recoverCustomReportPayment'), 'Founder Pass card must not create payment links directly')

assert(areaDetail.includes("checkReportAccess('instant_pdf_99')"), 'Existing Rs 99 path must check report access')
assert(areaDetail.includes('createReportPaymentLink(leadId)'), 'Existing Rs 99 path must use server-created payment links')
assert(areaDetail.includes('paymentReturnCheckPending'), 'Existing Rs 99 path must re-check access after Razorpay return')
assert(modal.includes('claimPaidAccess'), 'Existing Rs 99 path must support paid-access claim by email/phone')
assert(modal.includes('Payment ID is only for direct Razorpay payments we cannot match automatically.'), 'Payment ID must stay fallback-only copy')
assert(api.includes('/api/leads/custom-report/${encodeURIComponent(leadId)}/payment-link'), 'Frontend must use the traceable lead payment-link endpoint')
assert(api.includes('/api/leads/custom-report/recover-payment'), 'Frontend must keep verified recovery endpoint available')
assert(paymentLinks.includes("'instant_pdf_99'") && !paymentLinks.includes('founder_pass'), 'Founder Pass must reuse instant_pdf_99 rather than create a new package')
assert(!paymentLinks.includes('razorpay.me/@'), 'Generic Razorpay links must not be used')

assert(backendLeads.includes('@router.post("/custom-report/{lead_id}/payment-link"'), 'Backend must expose server-created payment links')
assert(backendLeads.includes('@router.post("/razorpay/webhook"'), 'Backend must keep Razorpay webhook verification')
assert(backendLeads.includes('@router.post("/custom-report/recover-payment"'), 'Backend must keep verified payment recovery')
assert(backendLeads.includes('Client payment confirmation is disabled'), 'Backend must keep self-confirm payment disabled')
assert(backendEntitlements.includes('@router.get("/report-access"'), 'Backend must expose report access checks')
assert(backendEntitlements.includes('@router.post("/claim-paid-access"'), 'Backend must expose paid-access claim checks')

assert(backendLeadTests.includes('test_razorpay_webhook_marks_existing_lead_paid_for_auto_access'), 'Backend tests must cover Razorpay webhook activation')
assert(backendLeadTests.includes('test_fabricated_payment_id_cannot_activate_access'), 'Backend tests must reject fabricated payment recovery')
assert(backendLeadTests.includes('Razorpay payment was not captured.') && backendLeadTests.includes('self.assertFalse(entitlements["subscription_active"])'), 'Backend tests must prove failed recovery does not activate access')
assert(backendEntitlementTests.includes('claim-paid-access'), 'Backend entitlement tests must cover paid-access claim')
assert(backendPaymentTests.includes('subscription_active'), 'Backend payment reconciliation tests must cover entitlement restoration')

console.log('Founder Pass Phase 3C entitlement QA findings')
console.table([
  { boundary: 'Share card', status: 'reads cached entitlements only' },
  { boundary: 'Upgrade CTA', status: 'routes to existing area Rs 99 flow' },
  { boundary: 'Payment package', status: 'reuses instant_pdf_99' },
  { boundary: 'Activation', status: 'requires server entitlement or Razorpay verification' },
  { boundary: 'Fallback', status: 'Payment ID remains verified recovery only' },
])
console.log('Result: Founder Pass gating, entitlement reuse, Rs 99 payment reuse, and no parallel payment flow checks passed.')
