import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
      await navigator.share({
        title: `${area.name} Area Pass by PlotDNA`,
        text: `Check the PlotDNA location intelligence card for ${area.name}, ${cityName}.`,
        url: publicUrl,
      })
      return
    }
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
    <main className="min-h-[100dvh] bg-[#050914] px-4 py-6">
      <LandDNACard
        area={area}
        cityName={cityName}
        accessState={accessState}
        onShare={handleShare}
        onDownloadPng={handleDownloadPng}
        cardRef={cardRef}
      />
      {shareState !== 'idle' && (
        <p className="mt-3 text-center text-xs text-emerald-300">
          {shareState === 'link-copied' && 'Public Area Pass link copied.'}
          {shareState === 'png-downloaded' && 'PNG downloaded.'}
          {shareState === 'export-failed' && 'PNG export failed. Share link is still available.'}
        </p>
      )}
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
