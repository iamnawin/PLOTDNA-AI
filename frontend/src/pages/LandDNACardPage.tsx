import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LandDNACard from '@/components/landDna/LandDNACard'
import { featureFlags } from '@/lib/features'
import { getCachedEntitlements } from '@/lib/entitlements'
import { getLandDnaAccessState } from '@/lib/founderPass/landDnaPlan'
import { CITIES } from '@/data/cities'

function findAreaBySlug(slug: string | undefined) {
  if (!slug) return null
  for (const entry of Object.values(CITIES)) {
    const area = entry.areas.find(candidate => candidate.slug === slug)
    if (area) return { area, cityName: entry.meta.name }
  }
  return null
}

export default function LandDNACardPage() {
  const { shareSlug } = useParams()
  const match = useMemo(() => findAreaBySlug(shareSlug), [shareSlug])
  const [copied, setCopied] = useState(false)

  if (!featureFlags.enableLandDnaCard) {
    return <Message title="Land DNA Card is not enabled yet." />
  }

  if (!match) {
    return <Message title="Land DNA Card not found." />
  }

  const { area, cityName } = match
  const accessState = featureFlags.enableFounderPassGating
    ? getLandDnaAccessState(getCachedEntitlements())
    : null

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: `${area.name} Land DNA Card`, url })
      return
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
  }

  return (
    <main className="min-h-[100dvh] bg-[#050914] px-4 py-6">
      <LandDNACard area={area} cityName={cityName} accessState={accessState} onShare={handleShare} />
      {copied && <p className="mt-3 text-center text-xs text-emerald-300">Share link copied.</p>}
    </main>
  )
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
