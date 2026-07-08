import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Copy, Download, Share2, Sparkles } from 'lucide-react'
import LandDNACard from '@/components/landDna/LandDNACard'
import { featureFlags } from '@/lib/features'
import { getCachedEntitlements } from '@/lib/entitlements'
import { getLandDnaAccessState } from '@/lib/founderPass/landDnaPlan'
import { exportLandDnaCardPng, findLandDnaCardMatch, getLandDnaCardPath } from '@/lib/landDnaCard'

type ShareState = 'idle' | 'link-copied' | 'png-downloaded' | 'export-failed'

export default function LandDNACardPage() {
  const { shareSlug } = useParams()
  const match = useMemo(() => findLandDnaCardMatch(shareSlug), [shareSlug])
  const [shareState, setShareState] = useState<ShareState>('idle')
  const cardRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!match) return
    document.title = `${match.area.name} Area Pass | PlotDNA`
    setMeta('description', `Location intelligence signals for ${match.area.name}, ${match.city.meta.name}.`)
    setMeta('og:title', `${match.area.name} Area Pass | PlotDNA`)
    setMeta('og:description', `Location intelligence signals for ${match.area.name}, ${match.city.meta.name}.`)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', `${match.area.name} Area Pass | PlotDNA`)
    setMeta('twitter:description', `Location intelligence signals for ${match.area.name}, ${match.city.meta.name}.`)
  }, [match])

  if (!featureFlags.enableLandDnaCard) {
    return <Message title="Land DNA Card is not enabled yet." />
  }

  if (!match) {
    return <Message title="Land DNA Card not found." />
  }

  const { area, city, areaCode } = match
  const cityName = city.meta.name
  const accessState = featureFlags.enableFounderPassGating
    ? getLandDnaAccessState(getCachedEntitlements())
    : null
  const publicPath = getLandDnaCardPath(cityName, area)
  const publicUrl = `${window.location.origin}${publicPath}`

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
        // If native share is unavailable, cancelled, or blocked, keep the public link usable.
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
    <main className="min-h-[100dvh] body px-4 pb-28 pt-5 text-slate-100">
      <div className="mx-auto max-w-[760px]">
        <header className="mb-4 flex items-center justify-between gap-3">
          <Link
            to={`/area/${area.slug}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300"
            aria-label="Back to verdict"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2.5">
            <img src="/plotdna-logo.png" alt="PlotDNA" className="h-7 w-7 rounded-lg object-cover" />
            <div>
              <p className="text-sm font-display font-black leading-tight text-slate-50">Area Pass</p>
              <p className="text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">PlotDNA</p>
            </div>
          </div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/18 bg-emerald-300/[0.08] text-emerald-300">
            <BadgeCheck size={17} />
          </span>
        </header>

        <section className="mb-4 rounded-2xl border border-cyan-300/16 bg-cyan-300/[0.06] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
              <Sparkles size={19} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black leading-tight text-slate-50">Shareable buyer summary for {area.name}</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Send the simple area verdict, score, risk, and checks without forcing someone to read the full report first.
              </p>
            </div>
          </div>
        </section>

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

        <section className="mt-4 grid gap-2 sm:grid-cols-3" aria-label="Area Pass actions">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-sans font-black text-slate-950 transition-colors hover:bg-cyan-200"
          >
            <Share2 size={16} />
            Share Link
          </button>
          <button
            type="button"
            onClick={handleDownloadPng}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-sans font-black text-slate-100"
          >
            <Download size={16} />
            Download PNG
          </button>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-sans font-black text-slate-100"
          >
            <Copy size={16} />
            Copy URL
          </button>
        </section>
      </div>

      <nav
        aria-label="PlotDNA Area Pass footer navigation"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto grid max-w-[640px] grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-slate-950/92 p-2 shadow-[0_18px_44px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        <Link to={`/area/${area.slug}`} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-sans font-black text-slate-500">
          <BadgeCheck size={15} />
          Verdict
        </Link>
        <Link to={`/compare?areas=${area.slug}&returnTo=${encodeURIComponent(`/area/${area.slug}`)}`} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-sans font-black text-slate-500">
          <Sparkles size={15} />
          Compare
        </Link>
        <span className="flex flex-col items-center gap-1 rounded-xl bg-emerald-400/14 px-2 py-2 text-[10px] font-sans font-black text-emerald-300">
          <BadgeCheck size={15} />
          Pass
        </span>
      </nav>
    </main>
  )
}

function setMeta(name: string, content: string) {
  const selector = name.startsWith('og:') ? `meta[property="${name}"]` : `meta[name="${name}"]`
  const attribute = name.startsWith('og:') ? 'property' : 'name'
  let tag = document.head.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, name)
    document.head.appendChild(tag)
  }
  tag.content = content
}

function Message({ title }: { title: string }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#050914] px-4 text-center text-slate-100">
      <div>
        <p className="text-lg font-bold">{title}</p>
        <Link to="/map" className="mt-3 inline-block text-sm font-bold text-emerald-300">Back to map</Link>
      </div>
    </main>
  )
}
