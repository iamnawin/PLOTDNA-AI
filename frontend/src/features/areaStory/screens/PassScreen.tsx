import { useRef, useState } from 'react'
import { ArrowRight, Share2, Download, Copy } from 'lucide-react'
import type { MicroMarket } from '@/types'
import type { CityEntry } from '@/data/cities'
import LandDNACard from '@/components/landDna/LandDNACard'
import BuyerReportButton from '@/components/ui/BuyerReportButton'
import { getCachedEntitlements } from '@/lib/entitlements'
import { getLandDnaAccessState } from '@/lib/founderPass/landDnaPlan'
import { exportLandDnaCardPng, getLandDnaAreaCode, getLandDnaCardPath } from '@/lib/landDnaCard'
import { getReportPaymentLink } from '@/lib/paymentLinks'

interface PassScreenProps {
  area: MicroMarket
  city: CityEntry
  usesNearbySignals?: boolean
}

type ShareState = 'idle' | 'link-copied' | 'png-downloaded' | 'export-failed'

export default function PassScreen({ area, city, usesNearbySignals }: PassScreenProps) {
  const [shareState, setShareState] = useState<ShareState>('idle')
  const [paymentError, setPaymentError] = useState(false)
  const cardRef = useRef<HTMLElement | null>(null)

  const cityName = city.meta.name
  const areaCode = getLandDnaAreaCode(cityName, area)
  const accessState = getLandDnaAccessState(getCachedEntitlements())
  const paymentLink = getReportPaymentLink('instant_pdf_99')
  const publicUrl = `${window.location.origin}${getLandDnaCardPath(cityName, area)}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${area.name} Area Pass by PlotDNA`,
          text: `Check the PlotDNA location intelligence card for ${area.name}, ${cityName}.`,
          url: publicUrl,
        })
        return
      } catch {
        // Native share unavailable, cancelled, or blocked — link stays usable below.
      }
    }
    await navigator.clipboard.writeText(publicUrl)
    setShareState('link-copied')
  }

  async function handleCopyUrl() {
    await navigator.clipboard.writeText(publicUrl)
    setShareState('link-copied')
  }

  async function handleDownloadPng() {
    if (!cardRef.current) return
    try {
      await exportLandDnaCardPng(cardRef.current, areaCode)
      setShareState('png-downloaded')
    } catch {
      setShareState('export-failed')
    }
  }

  return (
    <div>
      <header className="mb-4">
        <p className="font-display text-xl font-black leading-tight text-slate-50">Area Pass</p>
        <p className="mt-1 text-xs text-slate-400">Your premium, share-ready buyer summary</p>
      </header>

      <LandDNACard
        area={area}
        cityName={cityName}
        cardRef={cardRef}
      />

      {accessState.upgradeRequired && (
        <section className="mt-4" aria-label="Founder Pass">
          {paymentLink ? (
            <a
              href={paymentLink}
              className="btn-3d-reflective relative inline-flex min-h-[76px] w-full touch-manipulation items-center justify-between gap-3 overflow-hidden rounded-xl bg-[linear-gradient(115deg,#f59e0b_0%,#facc15_24%,#2dd4bf_62%,#38bdf8_100%)] px-5 text-left text-slate-950 active:translate-y-0.5"
            >
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-900/70">Founder Pass · One-time unlock</span>
                <span className="mt-1 block text-base font-black leading-tight">Unlock Founder Pass — ₹99 Lifetime Access</span>
                <span className="mt-1 block text-[10px] font-bold text-slate-900/65">More Area Pass cards, buyer reports, and comparisons</span>
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950/15"><ArrowRight size={19} /></span>
            </a>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPaymentError(true)}
                className="btn-3d-reflective relative inline-flex min-h-[76px] w-full touch-manipulation items-center justify-between gap-3 overflow-hidden rounded-xl bg-[linear-gradient(115deg,#f59e0b_0%,#facc15_24%,#2dd4bf_62%,#38bdf8_100%)] px-5 text-left text-slate-950 active:translate-y-0.5"
              >
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-900/70">Founder Pass · One-time unlock</span>
                  <span className="mt-1 block text-base font-black leading-tight">Unlock Founder Pass — ₹99 Lifetime Access</span>
                  <span className="mt-1 block text-[10px] font-bold text-slate-900/65">More Area Pass cards, buyer reports, and comparisons</span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950/15"><ArrowRight size={19} /></span>
              </button>
              {paymentError && <p className="mt-2 rounded-xl border border-amber-200/20 bg-amber-200/[0.08] px-3 py-2 text-center text-xs text-amber-100">Payment link is temporarily unavailable. Please try again soon.</p>}
            </>
          )}
        </section>
      )}

      {shareState !== 'idle' && (
        <p className="mt-3 rounded-xl border border-emerald-300/18 bg-emerald-300/[0.08] px-3 py-2 text-center text-xs font-sans font-bold text-emerald-300">
          {shareState === 'link-copied' && 'Public Area Pass link copied.'}
          {shareState === 'png-downloaded' && 'PNG downloaded.'}
          {shareState === 'export-failed' && 'PNG export failed. Share link is still available.'}
        </p>
      )}

      <section className="mb-[calc(1rem+env(safe-area-inset-bottom))] mt-5 sm:mb-0" aria-label="Area Pass actions">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-black text-slate-200">Share or save this pass</p>
          <p className="text-[10px] text-slate-500">4 actions</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-h-12 min-w-0 touch-manipulation items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 text-xs font-sans font-black text-slate-950 transition-colors active:scale-[0.99]"
        >
          <Share2 size={16} /> Share Link
        </button>
        <BuyerReportButton area={area} cityName={cityName} citySlug={city.meta.slug} usesNearbySignals={usesNearbySignals} className="flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.08] px-3 text-xs font-black text-emerald-200 active:scale-[0.99]" />
        <button
          type="button"
          onClick={handleDownloadPng}
          className="inline-flex min-h-11 min-w-0 touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[11px] font-sans font-black text-slate-100 active:scale-[0.99]"
        >
          <Download size={16} /> Download PNG
        </button>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="inline-flex min-h-11 min-w-0 touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[11px] font-sans font-black text-slate-100 active:scale-[0.99]"
        >
          <Copy size={16} /> Copy URL
        </button>
        </div>
      </section>
    </div>
  )
}
