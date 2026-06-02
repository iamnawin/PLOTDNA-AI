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
assert(areaDetail.includes('function ReportDownloadNudge'), 'area detail must define the delayed PDF reminder popup')
assert(areaDetail.includes('function TimedDnaAccessGate'), 'area detail must define the timed access gate')
assert(areaDetail.includes('aria-label="Download and print report options"'), 'export panel must be identifiable')
assert(areaDetail.includes('Preview the DNA, then unlock the complete in-app view and PDF.'), 'export panel must explain timed preview access')
assert(areaDetail.includes('Full app + PDF'), 'Rs 99 flow must unlock the app and PDF together')
assert(areaDetail.includes('Full app + buyer brief'), 'Rs 499 flow must unlock app viewing and buyer brief together')
assert(areaDetail.includes("openCustomReportRequest('instant_pdf_99', 'area_dna_export_cta')"), 'export CTA must route Rs 99 through the report flow')
assert(areaDetail.includes("openCustomReportRequest('custom_due_diligence_499', 'area_dna_export_cta')"), 'export CTA must route Rs 499 through the buyer brief flow')
assert(areaDetail.includes('Rs 99') && areaDetail.includes('Rs 499'), 'export panel must show both paid options')
assert(areaDetail.includes('Screenshots are not reliable delivery copies.'), 'popup must explain why the PDF matters versus screenshots')
assert(areaDetail.includes('area_report_pdf_nudge_shown'), 'popup impression must be logged')
assert(areaDetail.includes('area_report_free_preview_engaged'), 'deep free-preview consumption must be logged')
assert(areaDetail.includes('area_report_preview_locked'), 'timed preview lock must be logged')
assert(areaDetail.includes('delayMs: 30000'), 'timed preview lock must happen after 30 seconds')
assert(areaDetail.includes("openCustomReportRequest('instant_pdf_99', 'area_pdf_timer_nudge')"), 'timer popup must route Rs 99 through the report flow')
assert(areaDetail.includes("openCustomReportRequest('instant_pdf_99', 'area_dna_timed_lock')"), 'timed lock must route Rs 99 through the report flow')
assert(areaDetail.includes("openCustomReportRequest('custom_due_diligence_499', 'area_dna_timed_lock')"), 'timed lock must route Rs 499 through the buyer brief flow')
assert(areaDetail.includes("reason: 'custom_buyer_brief_flow'"), 'Rs 499 flow must clear the timed app lock')
assert(areaDetail.includes("filter: 'blur(14px) saturate(0.78)'"), 'timed lock must blur protected DNA sections after preview')
assert(areaDetail.includes("opacity: 0.95"), 'timed lock must preserve a recognizable preview behind the overlay')

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
