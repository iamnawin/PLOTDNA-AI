import type { jsPDF as JsPdfDocument } from 'jspdf'
import type { MicroMarket } from '@/types'
import { buildAreaStoryBrief, SELLER_QUESTIONS, VERIFICATION_GROUPS } from '@/lib/areaStoryBrief'
import { getLandDnaAreaCode } from '@/lib/landDnaCard'
import { getScoreLabel } from '@/lib/utils'

export interface BuyerReportOptions {
  area: MicroMarket
  cityName: string
  citySlug: string
  usesNearbySignals?: boolean
}

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 15
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const FOOTER = 'PlotDNA provides buyer-side location intelligence signals, not legal/title/approval certification.'

const COLORS = {
  background: [4, 10, 24] as const,
  panel: [10, 20, 38] as const,
  panelStrong: [12, 28, 44] as const,
  border: [31, 52, 73] as const,
  text: [226, 232, 240] as const,
  muted: [148, 163, 184] as const,
  soft: [100, 116, 139] as const,
  green: [45, 212, 191] as const,
  amber: [251, 191, 36] as const,
  cyan: [56, 189, 248] as const,
}

function riskLabel(score: number) {
  if (score >= 80) return 'Lower risk'
  if (score >= 60) return 'Medium risk'
  return 'Higher risk'
}

function fillPage(doc: JsPdfDocument) {
  doc.setFillColor(...COLORS.background)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')
}

function writeWrapped(doc: JsPdfDocument, value: string, x: number, y: number, width: number, options: { size?: number; color?: readonly [number, number, number]; style?: 'normal' | 'bold'; lineHeight?: number } = {}) {
  const size = options.size ?? 8
  const lineHeight = options.lineHeight ?? size * 0.42
  doc.setFont('helvetica', options.style ?? 'normal')
  doc.setFontSize(size)
  doc.setTextColor(...(options.color ?? COLORS.text))
  const lines = doc.splitTextToSize(value, width)
  doc.text(lines, x, y)
  return y + lines.length * lineHeight
}

function brandHeader(doc: JsPdfDocument, page: number, title?: string) {
  doc.setFillColor(16, 185, 129)
  doc.roundedRect(MARGIN, 11, 10, 10, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(2, 6, 23)
  doc.text('P', MARGIN + 3.4, 17.8)
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(13)
  doc.text('PlotDNA', MARGIN + 14, 19)
  if (title) {
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.muted)
    doc.text(title, PAGE_WIDTH - MARGIN, 18, { align: 'right' })
  }
  doc.setDrawColor(...COLORS.border)
  doc.line(MARGIN, 25, PAGE_WIDTH - MARGIN, 25)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...COLORS.soft)
  doc.text(FOOTER, MARGIN, PAGE_HEIGHT - 10)
  doc.text(`${page} / 4`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' })
}

function sectionTitle(doc: JsPdfDocument, title: string, y: number, color: readonly [number, number, number] = COLORS.green) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...color)
  doc.text(title, MARGIN, y)
  return y + 6
}

function card(doc: JsPdfDocument, x: number, y: number, width: number, height: number, tone: 'normal' | 'green' | 'amber' = 'normal') {
  const fill = tone === 'green' ? COLORS.panelStrong : tone === 'amber' ? [30, 25, 14] as const : COLORS.panel
  const border = tone === 'green' ? [20, 96, 81] as const : tone === 'amber' ? [97, 73, 16] as const : COLORS.border
  doc.setFillColor(fill[0], fill[1], fill[2])
  doc.setDrawColor(border[0], border[1], border[2])
  doc.roundedRect(x, y, width, height, 3, 3, 'FD')
}

function bulletList(doc: JsPdfDocument, items: readonly string[], x: number, y: number, width: number, options: { size?: number; gap?: number; limit?: number } = {}) {
  const size = options.size ?? 7.2
  const gap = options.gap ?? 2
  for (const item of items.slice(0, options.limit ?? items.length)) {
    doc.setFillColor(...COLORS.green)
    doc.circle(x + 1, y - 1.1, 0.65, 'F')
    y = writeWrapped(doc, item, x + 4, y, width - 4, { size, color: COLORS.text, lineHeight: size * 0.43 }) + gap
  }
  return y
}

export async function generateBuyerReportPdf({ area, cityName, citySlug, usesNearbySignals = false }: BuyerReportOptions) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const areaCode = getLandDnaAreaCode(cityName, area)
  const brief = buildAreaStoryBrief(area, citySlug, usesNearbySignals)
  const generatedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  // Page 1: cover and buyer verdict
  fillPage(doc)
  brandHeader(doc, 1)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.green)
  doc.text('BUYER-SIDE LOCATION INTELLIGENCE', MARGIN, 39)
  doc.setFontSize(22)
  doc.setTextColor(...COLORS.text)
  doc.text('PlotDNA Buyer', MARGIN, 53)
  doc.text('Due-Diligence Report', MARGIN, 64)
  doc.setFontSize(18)
  doc.text(area.name, MARGIN, 84)
  writeWrapped(doc, `${cityName}  |  ${areaCode}  |  Generated ${generatedDate}`, MARGIN, 92, CONTENT_WIDTH, { size: 8, color: COLORS.muted, style: 'bold' })
  if (brief.fallbackWarning) {
    card(doc, MARGIN, 101, CONTENT_WIDTH, 17, 'amber')
    writeWrapped(doc, brief.fallbackWarning, MARGIN + 5, 109, CONTENT_WIDTH - 10, { size: 7.5, color: COLORS.amber, style: 'bold' })
  }
  const verdictY = brief.fallbackWarning ? 126 : 105
  card(doc, MARGIN, verdictY, CONTENT_WIDTH, 45, 'green')
  writeWrapped(doc, 'Buyer verdict', MARGIN + 6, verdictY + 9, 55, { size: 7, color: COLORS.green, style: 'bold' })
  writeWrapped(doc, `${brief.summary.verdict}: ${getScoreLabel(area.score)}`, MARGIN + 6, verdictY + 20, 92, { size: 16, color: COLORS.text, style: 'bold' })
  writeWrapped(doc, brief.summary.nextVerification, MARGIN + 6, verdictY + 30, CONTENT_WIDTH - 12, { size: 8, color: COLORS.muted })

  const metricsY = verdictY + 53
  const metricWidth = (CONTENT_WIDTH - 9) / 4
  const metrics = [
    ['PlotDNA score', `${area.score}/100`, COLORS.green],
    ['Risk level', riskLabel(area.score), COLORS.amber],
    ['Confidence', brief.confidence.label, COLORS.cyan],
    ['Best for', brief.summary.bestFor, COLORS.text],
  ] as const
  metrics.forEach(([label, value, color], index) => {
    const x = MARGIN + index * (metricWidth + 3)
    card(doc, x, metricsY, metricWidth, 38)
    writeWrapped(doc, label, x + 4, metricsY + 8, metricWidth - 8, { size: 6.5, color: COLORS.muted, style: 'bold' })
    writeWrapped(doc, value, x + 4, metricsY + 19, metricWidth - 8, { size: index === 0 ? 13 : 8.5, color, style: 'bold', lineHeight: 4 })
  })
  let y = metricsY + 48
  y = sectionTitle(doc, 'Buyer action summary', y)
  card(doc, MARGIN, y, CONTENT_WIDTH, 31)
  writeWrapped(doc, brief.recommendation, MARGIN + 5, y + 10, CONTENT_WIDTH - 10, { size: 10, color: COLORS.text, style: 'bold' })
  writeWrapped(doc, 'Verify access, approvals, documents, boundaries, and the current quote before paying token.', MARGIN + 5, y + 21, CONTENT_WIDTH - 10, { size: 7.5, color: COLORS.muted })

  // Page 2: area story, infrastructure, demand, and money risk
  doc.addPage()
  fillPage(doc)
  brandHeader(doc, 2, `${area.name} | Area Story`)
  y = 35
  y = sectionTitle(doc, 'What is happening here?', y)
  card(doc, MARGIN, y, CONTENT_WIDTH, 34, 'green')
  writeWrapped(doc, brief.story, MARGIN + 5, y + 9, CONTENT_WIDTH - 10, { size: 8, color: COLORS.text, lineHeight: 3.7 })
  y += 43
  y = sectionTitle(doc, 'Infrastructure signals', y)
  const signalWidth = (CONTENT_WIDTH - 4) / 2
  brief.signals.forEach((signal, index) => {
    const x = MARGIN + (index % 2) * (signalWidth + 4)
    const rowY = y + Math.floor(index / 2) * 35
    card(doc, x, rowY, signalWidth, 31)
    writeWrapped(doc, signal.title, x + 4, rowY + 7, signalWidth - 8, { size: 7.5, color: COLORS.text, style: 'bold' })
    writeWrapped(doc, signal.status, x + 4, rowY + 14, signalWidth - 8, { size: 6.5, color: COLORS.cyan, style: 'bold' })
    writeWrapped(doc, signal.meaning, x + 4, rowY + 21, signalWidth - 8, { size: 6.2, color: COLORS.muted, lineHeight: 2.7 })
  })
  y += 76
  y = sectionTitle(doc, 'Nearby demand drivers', y)
  y = bulletList(doc, brief.demandDrivers, MARGIN, y, CONTENT_WIDTH, { size: 7, limit: 4 }) + 2
  y = sectionTitle(doc, 'Money and risk', y, COLORS.amber)
  card(doc, MARGIN, y, CONTENT_WIDTH, 44, 'amber')
  writeWrapped(doc, `Price range: ${area.priceRange}`, MARGIN + 5, y + 9, 80, { size: 8, color: COLORS.text, style: 'bold' })
  if (Number.isFinite(area.yoy) && (area.dataConfidence === 'verified' || area.dataConfidence === 'partial')) {
    writeWrapped(doc, `Current gain signal: +${area.yoy}% YoY`, MARGIN + 94, y + 9, 78, { size: 8, color: COLORS.green, style: 'bold' })
  }
  writeWrapped(doc, `Why this area may gain value: ${brief.summary.mainUpside}`, MARGIN + 5, y + 19, CONTENT_WIDTH - 10, { size: 7, color: COLORS.text, lineHeight: 3 })
  writeWrapped(doc, `Where buyer may lose money: ${brief.summary.mainRisk}`, MARGIN + 5, y + 31, CONTENT_WIDTH - 10, { size: 7, color: COLORS.amber, lineHeight: 3 })

  // Page 3: map proof and grouped verification
  doc.addPage()
  fillPage(doc)
  brandHeader(doc, 3, `${area.name} | Map Proof and Checks`)
  y = 35
  y = sectionTitle(doc, 'Map Proof', y)
  card(doc, MARGIN, y, CONTENT_WIDTH, 42, 'green')
  writeWrapped(doc, 'Structured locality proof', MARGIN + 5, y + 9, 75, { size: 9, color: COLORS.text, style: 'bold' })
  writeWrapped(doc, `Selected area: ${area.name}`, MARGIN + 5, y + 18, 80, { size: 7.5, color: COLORS.muted })
  writeWrapped(doc, `Resolution: ${usesNearbySignals ? 'Nearby / fallback locality signals' : 'Selected locality record'}`, MARGIN + 5, y + 26, 95, { size: 7.5, color: COLORS.muted })
  writeWrapped(doc, `Locality centre: ${area.center[1].toFixed(5)} N, ${area.center[0].toFixed(5)} E`, MARGIN + 105, y + 18, 68, { size: 7.5, color: COLORS.muted })
  writeWrapped(doc, 'No synthetic map image is included. Use the in-app Map Proof screen for the interactive boundary view.', MARGIN + 105, y + 27, 68, { size: 6.5, color: COLORS.soft, lineHeight: 2.8 })
  y += 51
  y = sectionTitle(doc, 'What to verify before paying token', y)
  const groupWidth = (CONTENT_WIDTH - 4) / 2
  VERIFICATION_GROUPS.forEach((group, index) => {
    const x = MARGIN + (index % 2) * (groupWidth + 4)
    const rowY = y + Math.floor(index / 2) * 72
    card(doc, x, rowY, groupWidth, 68)
    writeWrapped(doc, group.title, x + 4, rowY + 8, groupWidth - 8, { size: 8.5, color: COLORS.green, style: 'bold' })
    bulletList(doc, group.items, x + 4, rowY + 17, groupWidth - 8, { size: 6.6, gap: 1.5, limit: 6 })
  })

  // Page 4: seller questions, verification sources, confidence, and disclaimer
  doc.addPage()
  fillPage(doc)
  brandHeader(doc, 4, `${area.name} | Buyer Verification Guide`)
  y = 35
  y = sectionTitle(doc, 'Ask seller or broker', y)
  y = bulletList(doc, SELLER_QUESTIONS, MARGIN, y, CONTENT_WIDTH, { size: 6.9, gap: 1.5 }) + 2
  y = sectionTitle(doc, 'Where to verify', y)
  const shownSources = brief.sources.slice(0, 6)
  shownSources.forEach((source, index) => {
    const sourceY = y + index * 20
    card(doc, MARGIN, sourceY, CONTENT_WIDTH, 17)
    writeWrapped(doc, `${source.title} | ${source.statusLabel}`, MARGIN + 4, sourceY + 6, 78, { size: 6.8, color: COLORS.text, style: 'bold' })
    writeWrapped(doc, source.description, MARGIN + 4, sourceY + 12, 82, { size: 5.7, color: COLORS.muted, lineHeight: 2.4 })
    writeWrapped(doc, source.url ?? source.warning, MARGIN + 94, sourceY + 7, 80, { size: 5.4, color: source.url ? COLORS.cyan : COLORS.soft, lineHeight: 2.3 })
  })
  y += shownSources.length * 20 + 4
  y = sectionTitle(doc, 'Confidence explanation', y, COLORS.amber)
  card(doc, MARGIN, y, CONTENT_WIDTH, 27, 'amber')
  writeWrapped(doc, `${brief.confidence.label} confidence: ${brief.confidence.description}. Exact plot documents, access, live transactions, and current pricing still require independent confirmation.`, MARGIN + 5, y + 9, CONTENT_WIDTH - 10, { size: 7.2, color: COLORS.text, lineHeight: 3.2 })
  y += 35
  y = sectionTitle(doc, 'Final disclaimer', y)
  writeWrapped(doc, 'PlotDNA is a buyer-side screening tool, not a legal opinion, title certificate, approval certificate, valuation, or promise of appreciation. Verify documents, access, approvals, boundaries, and latest pricing with official sources and qualified professionals before paying token or purchasing.', MARGIN, y, CONTENT_WIDTH, { size: 6.7, color: COLORS.muted, lineHeight: 2.9 })

  return { doc, areaCode }
}

export async function downloadBuyerReport(options: BuyerReportOptions) {
  const { doc, areaCode } = await generateBuyerReportPdf(options)
  doc.save(`plotdna-buyer-report-${areaCode}.pdf`)
}
