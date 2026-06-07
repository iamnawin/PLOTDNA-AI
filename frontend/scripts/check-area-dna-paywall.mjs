import fs from 'node:fs'
import path from 'node:path'

const areaDetailPath = path.join(process.cwd(), 'src', 'pages', 'AreaDetail.tsx')
const areaDetail = fs.readFileSync(areaDetailPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Area DNA access check failed: ${message}`)
    process.exit(1)
  }
}

assert(!areaDetail.includes('function LockedDnaAnalysis'), 'area detail must not define a full-page DNA lock wrapper')
assert(!areaDetail.includes('<LockedDnaAnalysis'), 'deep DNA sections must not be wrapped in a lock overlay')
assert(!areaDetail.includes('Unlock full DNA analysis'), 'area detail must not show the old full DNA unlock blocker')
assert(!areaDetail.includes('area_dna_analysis_lock'), 'paid report events must not describe the app view as locked')

assert(areaDetail.includes('function ReportExportPanel'), 'area detail must define the PDF/export monetization panel')
assert(!areaDetail.includes('function ReportDownloadNudge'), '30-second lock replaces the delayed PDF reminder popup')
assert(areaDetail.includes('function TimedDnaAccessGate'), 'area detail must define the timed access gate')
assert(areaDetail.includes('aria-label="Download and print report options"'), 'export panel must be identifiable')
assert(areaDetail.includes('complete buyer verification PDF'), 'export panel must explain the detailed PDF path')
assert(areaDetail.includes('Preview time complete. Download the lifetime PDF.'), 'export panel must collapse into direct PDF test copy after preview')
assert(areaDetail.includes('Continue for Rs 99 lifetime access'), 'timed lock must use one compact lifetime CTA')
assert(areaDetail.includes('EmailGateModal'), 'area detail must render the email OTP gate for report/PDF access')
assert(areaDetail.includes("setSelectedReportSource(source)"), 'PDF actions must remember the intended download source before opening access flow')
assert(areaDetail.includes("openEmailGateForPdf('area_nav_pdf')"), 'top PDF button must open the OTP gate instead of downloading directly')
assert(areaDetail.includes("onDownloadPdf={() => openEmailGateForPdf('area_dna_export_cta')}"), 'export CTA must open the OTP gate before direct PDF testing')
assert(areaDetail.includes('void generateCustomBuyerBriefPDF(area'), 'test PDF flow must generate the detailed buyer verification PDF')
assert(!areaDetail.includes('void generatePDF(area)\n  }'), 'test PDF flow must not generate the shorter instant report')
assert(!areaDetail.includes("openCustomReportRequest('instant_pdf_99', 'area_dna_export_cta')"), 'export CTA must not route Rs 99 through the payment flow while PDF testing is enabled')
assert(!areaDetail.includes("openCustomReportRequest('custom_due_diligence_499', 'area_dna_export_cta')"), 'export CTA must not route a second paid report package')
const exportPanelMatch = areaDetail.match(/function ReportExportPanel[\s\S]*?function TimedDnaAccessGate/)
assert(exportPanelMatch, 'export panel implementation must be inspectable')
assert(exportPanelMatch[0].includes('Rs 99') && !exportPanelMatch[0].includes('Rs 499'), 'export panel must show one paid lifetime option')
assert(areaDetail.includes('Screenshots are not reliable delivery copies.'), 'lock must explain why the PDF matters versus screenshots')
assert(!areaDetail.includes('area_report_pdf_nudge_shown'), 'separate popup impression must not be logged when the timed lock is active')
assert(!areaDetail.includes('area_pdf_timer_nudge'), 'separate timer popup CTA must not remain active')
assert(areaDetail.includes('area_report_free_preview_engaged'), 'deep free-preview consumption must be logged')
assert(areaDetail.includes('area_report_preview_locked'), 'timed preview lock must be logged')
assert(areaDetail.includes('delayMs: 30000'), 'timed preview lock must happen after 30 seconds')
assert(areaDetail.includes("onUnlock={() => openEmailGateForPdf('area_dna_timed_lock')}"), 'timed lock must open the OTP gate before direct PDF testing')
assert(!areaDetail.includes("openCustomReportRequest('instant_pdf_99', 'area_dna_timed_lock')"), 'timed lock must not route Rs 99 through the payment flow while PDF testing is enabled')
assert(!areaDetail.includes("openCustomReportRequest('custom_due_diligence_499', 'area_dna_timed_lock')"), 'timed lock must show one Rs 99 unlock card, not the Rs 499 brief card')
assert(areaDetail.includes("filter: 'blur(14px) saturate(0.78)'"), 'timed lock must blur protected DNA sections after preview')
assert(areaDetail.includes("opacity: 0.95"), 'timed lock must preserve a recognizable preview behind the overlay')
assert(areaDetail.includes('DNA verdict') && areaDetail.includes('Source trail') && areaDetail.includes('Buyer checklist'), 'timed lock must preview included report features without adding another price card')

const timedGateMatch = areaDetail.match(/function TimedDnaAccessGate[\s\S]*?async function loadPdfAsset/)
assert(timedGateMatch, 'timed access gate implementation must be inspectable')
const timedGate = timedGateMatch[0]
assert((timedGate.match(/Rs 99/g) ?? []).length === 1, 'timed lock must show exactly one Rs 99 CTA')
assert(!timedGate.includes('Rs 499'), 'timed lock must not show a second Rs 499 price card')
assert(timedGate.includes('source-of-truth PDF'), 'timed lock must keep the source-of-truth PDF wording')
assert(!timedGate.includes('Lifetime app + PDF'), 'timed lock must not render a duplicate package card')
assert(!timedGate.includes('Checking access...'), 'timed lock must not show an entitlement/payment check placeholder while PDF testing is enabled')
assert(!timedGate.includes('Unlock lifetime access'), 'timed lock must not show payment/unlock placeholder copy while PDF testing is enabled')
assert(!timedGate.includes('One-time lifetime unlock'), 'timed lock must not show payment/unlock placeholder body copy while PDF testing is enabled')

const satellite = areaDetail.indexOf('<SatelliteCompare')
const signalTrend = areaDetail.indexOf('<SignalTrendPanel')
const verdict = areaDetail.indexOf('<VerdictCard')
const buyerChecklist = areaDetail.indexOf('Buyer Due-Diligence Checklist')
const exportPanel = areaDetail.indexOf('<ReportExportPanel')
const accessGate = areaDetail.indexOf('<TimedDnaAccessGate')
assert(satellite > -1 && signalTrend > -1 && verdict > -1 && buyerChecklist > -1 && accessGate > -1, 'deep DNA content must remain rendered in the page')
assert(verdict < exportPanel && exportPanel < buyerChecklist, 'export CTA should appear immediately after the AI verdict and before the checklist')
assert(exportPanel < accessGate && accessGate < buyerChecklist, 'timed gate should protect deep sections after the top export offer')

console.log('Area DNA access check passed.')
