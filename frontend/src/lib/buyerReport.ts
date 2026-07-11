import type { MicroMarket } from '@/types'
import { getConfidenceMeta } from '@/lib/cityProduction'
import { getInvestmentReportSummary, BUYER_DUE_DILIGENCE_CHECKLIST } from '@/lib/investmentReport'
import { getLandDnaAreaCode } from '@/lib/landDnaCard'
import { getAreaSources } from '@/lib/areaSources'
import { getScoreLabel } from '@/lib/utils'

export interface BuyerReportOptions {
  area: MicroMarket
  cityName: string
  citySlug: string
  usesNearbySignals?: boolean
}

const SELLER_QUESTIONS = [
  'Which exact survey number and sub-division is this property under?',
  'Can you show the complete title chain and latest encumbrance certificate?',
  'Which authority approved this layout or project?',
  'If RERA does not apply, can you give the reason in writing?',
  'What recent registered transaction supports this quoted price?',
  'What is the exact road width and access-road status at the property?',
]

function riskLabel(score: number) {
  if (score >= 80) return 'Lower risk'
  if (score >= 60) return 'Medium risk'
  return 'Higher risk'
}

export async function downloadBuyerReport({ area, cityName, citySlug, usesNearbySignals = false }: BuyerReportOptions) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const summary = getInvestmentReportSummary(area)
  const confidence = getConfidenceMeta(area.dataConfidence)
  const areaCode = getLandDnaAreaCode(cityName, area)
  const sources = getAreaSources(area.slug, citySlug).filter(source => source.url)
  const pageWidth = 210
  const pageHeight = 297
  const margin = 16
  const contentWidth = pageWidth - margin * 2
  let y = 18

  const addPageIfNeeded = (height = 12) => {
    if (y + height <= pageHeight - 18) return
    doc.addPage()
    doc.setFillColor(4, 10, 24)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    y = 18
  }

  const text = (value: string, size = 9, color: [number, number, number] = [203, 213, 225], style: 'normal' | 'bold' = 'normal', indent = 0) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(value, contentWidth - indent)
    addPageIfNeeded(lines.length * (size * 0.42) + 3)
    doc.text(lines, margin + indent, y)
    y += lines.length * (size * 0.42) + 3
  }

  const section = (title: string) => {
    addPageIfNeeded(15)
    y += 3
    doc.setDrawColor(30, 64, 86)
    doc.line(margin, y, pageWidth - margin, y)
    y += 7
    text(title.toUpperCase(), 8, [45, 212, 191], 'bold')
  }

  const bullet = (value: string) => text(`- ${value}`, 8.5, [203, 213, 225], 'normal', 3)

  doc.setFillColor(4, 10, 24)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  doc.setFillColor(16, 185, 129)
  doc.roundedRect(margin, 10, 11, 11, 2, 2, 'F')
  doc.setTextColor(2, 6, 23)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('P', margin + 3.8, 17.5)
  doc.setTextColor(241, 245, 249)
  doc.setFontSize(18)
  doc.text('PlotDNA', margin + 15, 18)
  y = 29
  text('BUYER DUE-DILIGENCE REPORT', 8, [94, 234, 212], 'bold')
  text(area.name, 22, [248, 250, 252], 'bold')
  text(`${cityName}  |  ${areaCode}`, 9, [148, 163, 184], 'bold')
  text(`Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 8, [100, 116, 139])

  if (usesNearbySignals) {
    y += 2
    text('This report uses nearby locality signals, not exact plot-level verification.', 9, [253, 230, 138], 'bold')
  }

  section('Buyer verdict')
  text(`${summary.verdict}: ${getScoreLabel(area.score)}`, 15, [52, 211, 153], 'bold')
  text(summary.bestFor, 9, [226, 232, 240], 'bold')
  text(summary.nextVerification, 9)

  section('Buyer snapshot')
  bullet(`PlotDNA score: ${area.score}/100`)
  bullet(`Risk level: ${riskLabel(area.score)}`)
  bullet(`Money range: ${area.priceRange}`)
  if (Number.isFinite(area.yoy) && (area.dataConfidence === 'verified' || area.dataConfidence === 'partial')) bullet(`Current gain signal: +${area.yoy}% YoY`)
  bullet(`Confidence: ${confidence.label}. ${confidence.description}`)

  section('Why this area may gain value')
  area.highlights.filter(Boolean).slice(0, 4).forEach(bullet)

  section('Where the buyer may lose money')
  bullet(summary.mainRisk)
  bullet('A strong locality signal does not confirm title, approvals, access, or the fairness of the seller quote.')
  if (area.dataConfidence === 'estimated' || area.dataConfidence === 'uncovered') {
    bullet('Treat this result as early screening because source coverage is limited.')
  }

  section('What to verify before paying token')
  BUYER_DUE_DILIGENCE_CHECKLIST.slice(0, 10).forEach(bullet)

  section('Ask the seller or broker')
  SELLER_QUESTIONS.forEach(bullet)

  section('Where to verify')
  sources.slice(0, 8).forEach(source => {
    text(source.title, 8.5, [226, 232, 240], 'bold')
    text(source.url, 7.5, [125, 211, 252])
  })
  text('These links are references for the buyer to check. PlotDNA does not claim that every linked source has verified this property.', 8, [148, 163, 184])

  section('Confidence explanation')
  text(`${confidence.label} confidence`, 10, [253, 230, 138], 'bold')
  text(`${confidence.description}. Exact property documents, live transaction evidence, access, and current pricing still require independent verification.`, 8.5)

  section('Disclaimer')
  text('PlotDNA is a buyer-side screening tool, not a legal opinion, title certificate, approval certificate, valuation, or promise of appreciation. Verify documents, access, approvals, boundaries, and latest pricing with official sources and qualified professionals before paying token or purchasing.', 8, [148, 163, 184])

  doc.save(`plotdna-buyer-report-${areaCode}.pdf`)
}
