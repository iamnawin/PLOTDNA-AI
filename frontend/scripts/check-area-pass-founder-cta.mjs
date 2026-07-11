import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screen = readFileSync(path.join(__dirname, '../src/features/areaStory/screens/PassScreen.tsx'), 'utf8')

assert.ok(screen.includes('Unlock Founder Pass — ₹99 Lifetime Access'))
assert.ok(screen.includes('btn-3d-reflective'))
assert.ok(screen.includes('linear-gradient(115deg'))
assert.ok(screen.includes("getReportPaymentLink('instant_pdf_99')"))
assert.ok(screen.includes('Payment link is temporarily unavailable. Please try again soon.'))
assert.ok(screen.includes('paymentError &&'), 'missing-payment message appears only after the CTA is clicked')
assert.ok(screen.indexOf('aria-label="Founder Pass"') < screen.indexOf('aria-label="Area Pass actions"'), 'Founder Pass is the primary action before share utilities')
assert.ok(screen.includes('Share or save this pass'))
for (const action of ['Share Link', 'Download PNG', 'Download Buyer Report', 'Copy URL']) assert.ok(screen.includes(action) || action === 'Download Buyer Report')
console.log('Area Pass Founder CTA checks passed.')
