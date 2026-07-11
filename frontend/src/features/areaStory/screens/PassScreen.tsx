import { useRef, useState } from 'react'
import { Share2, Download, Copy } from 'lucide-react'
import type { MicroMarket } from '@/types'
import type { CityEntry } from '@/data/cities'
import LandDNACard from '@/components/landDna/LandDNACard'
import { featureFlags } from '@/lib/features'
import { getCachedEntitlements } from '@/lib/entitlements'
import { getLandDnaAccessState } from '@/lib/founderPass/landDnaPlan'
import { exportLandDnaCardPng, getLandDnaAreaCode, getLandDnaCardPath } from '@/lib/landDnaCard'

interface PassScreenProps {
  area: MicroMarket
  city: CityEntry
}

type ShareState = 'idle' | 'link-copied' | 'png-downloaded' | 'export-failed'

export default function PassScreen({ area, city }: PassScreenProps) {
  const [shareState, setShareState] = useState<ShareState>('idle')
  const cardRef = useRef<HTMLElement | null>(null)

  const cityName = city.meta.name
  const areaCode = getLandDnaAreaCode(cityName, area)
  const accessState = featureFlags.enableFounderPassGating
    ? getLandDnaAccessState(getCachedEntitlements())
    : null
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
        <p className="mt-1 text-xs text-slate-500">Premium shareable pass for smart buyers</p>
      </header>

      <LandDNACard
        area={area}
        cityName={cityName}
        accessState={accessState}
        cardRef={cardRef}
      />

      {shareState !== 'idle' && (
        <p className="mt-3 rounded-xl border border-emerald-300/18 bg-emerald-300/[0.08] px-3 py-2 text-center text-xs font-sans font-bold text-emerald-300">
          {shareState === 'link-copied' && 'Public Area Pass link copied.'}
          {shareState === 'png-downloaded' && 'PNG downloaded.'}
          {shareState === 'export-failed' && 'PNG export failed. Share link is still available.'}
        </p>
      )}

      <section className="mt-4 grid grid-cols-3 gap-2" aria-label="Area Pass actions">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl bg-emerald-400 px-2 py-2.5 text-[10px] font-sans font-black text-slate-950 transition-colors hover:bg-emerald-300"
        >
          <Share2 size={16} />
          Share Link
        </button>
        <button
          type="button"
          onClick={handleDownloadPng}
          className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2.5 text-[10px] font-sans font-black text-slate-100"
        >
          <Download size={16} />
          Download PNG
        </button>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2.5 text-[10px] font-sans font-black text-slate-100"
        >
          <Copy size={16} />
          Copy URL
        </button>
      </section>
    </div>
  )
}
