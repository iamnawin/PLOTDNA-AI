export type ReportPackage = 'instant_pdf_99' | 'custom_due_diligence_499'

const FALLBACK_RAZORPAY_LINK = 'https://razorpay.me/@naveentatikayala'

const PAYMENT_LINKS: Record<ReportPackage, string> = {
  instant_pdf_99: import.meta.env.VITE_RAZORPAY_PDF_LINK ?? '',
  custom_due_diligence_499: import.meta.env.VITE_RAZORPAY_CUSTOM_REPORT_LINK ?? '',
}

export function getReportPaymentLink(packageInterest: ReportPackage): string | null {
  const link = PAYMENT_LINKS[packageInterest]?.trim() || FALLBACK_RAZORPAY_LINK
  return link || null
}

export function openReportPaymentLink(packageInterest: ReportPackage): boolean {
  const link = getReportPaymentLink(packageInterest)
  if (!link || typeof window === 'undefined') return false

  window.open(link, '_blank', 'noopener,noreferrer')
  return true
}
