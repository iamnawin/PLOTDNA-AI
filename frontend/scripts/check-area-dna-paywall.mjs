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
assert(!areaDetail.includes("filter: 'blur(14px) saturate(0.78)'"), 'DNA sections must not be blurred')
assert(!areaDetail.includes("userSelect: 'none'"), 'DNA sections must not block normal user selection')
assert(!areaDetail.includes("pointerEvents: 'none'"), 'DNA sections must keep maps, links, and controls usable')
assert(!areaDetail.includes('area_dna_analysis_lock'), 'paid report events must not describe the app view as locked')

assert(areaDetail.includes('function ReportExportPanel'), 'area detail must define the PDF/export monetization panel')
assert(areaDetail.includes('function ReportDownloadNudge'), 'area detail must define the delayed PDF reminder popup')
assert(areaDetail.includes('aria-label="Download and print report options"'), 'export panel must be identifiable')
assert(areaDetail.includes('Full DNA view is free. Pay only when you need the PDF or buyer brief.'), 'export panel must explain the free app view')
assert(areaDetail.includes('Download / print copy'), 'Rs 99 flow must be tied to download/print copy')
assert(areaDetail.includes("openCustomReportRequest('instant_pdf_99', 'area_dna_export_cta')"), 'export CTA must route Rs 99 through the report flow')
assert(areaDetail.includes("openCustomReportRequest('custom_due_diligence_499', 'area_dna_export_cta')"), 'export CTA must route Rs 499 through the buyer brief flow')
assert(areaDetail.includes('Rs 99') && areaDetail.includes('Rs 499'), 'export panel must show both paid options')
assert(areaDetail.includes('Screenshots are not reliable delivery copies.'), 'popup must explain why the PDF matters versus screenshots')
assert(areaDetail.includes('area_report_pdf_nudge_shown'), 'popup impression must be logged')
assert(areaDetail.includes('area_report_free_preview_engaged'), 'deep free-preview consumption must be logged')
assert(areaDetail.includes("openCustomReportRequest('instant_pdf_99', 'area_pdf_timer_nudge')"), 'timer popup must route Rs 99 through the report flow')

const satellite = areaDetail.indexOf('<SatelliteCompare')
const signalTrend = areaDetail.indexOf('<SignalTrendPanel')
const sources = areaDetail.indexOf('Sources &amp; References')
const exportPanel = areaDetail.indexOf('<ReportExportPanel')
assert(satellite > -1 && signalTrend > -1 && sources > -1, 'deep DNA content must remain rendered in the page')
assert(exportPanel > sources, 'export CTA should appear after users can inspect sources and evidence')

console.log('Area DNA access check passed.')
