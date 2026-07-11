import { useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { downloadBuyerReport } from '@/lib/buyerReport'

interface BuyerReportButtonProps {
  area: MicroMarket
  cityName: string
  citySlug: string
  usesNearbySignals?: boolean
  className: string
  children?: ReactNode
}

export default function BuyerReportButton({ area, cityName, citySlug, usesNearbySignals, className, children }: BuyerReportButtonProps) {
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setError(false)
    setDownloading(true)
    try {
      await downloadBuyerReport({ area, cityName, citySlug, usesNearbySignals })
    } catch {
      setError(true)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-w-0">
      <button type="button" onClick={handleDownload} disabled={downloading} className={className}>
        <Download size={16} />
        {downloading ? 'Preparing report...' : children ?? 'Download Buyer Report'}
      </button>
      {error && <p className="mt-2 text-center text-[11px] font-semibold text-rose-300">Could not generate report. Please try again.</p>}
    </div>
  )
}
