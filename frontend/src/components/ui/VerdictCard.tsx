import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { getAllAreas } from '@/data/cities'

interface VerdictData {
  verdict: 'buy' | 'hold' | 'wait' | 'avoid'
  confidence: number
  summary: string
  reasons: string[]
  risks: string[]
  suitable_for: 'investment' | 'end-use' | 'both'
  last_updated: string
  source: 'gemini' | 'fallback'
  resolution_tier: 'exact_locality' | 'nearby_micro_market' | 'context_area' | 'city_zone_cluster' | 'regional' | 'uncovered'
  resolution_label: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function buildFallbackVerdict(
  areaSlug: string,
  resolutionTier?: VerdictData['resolution_tier'],
  resolutionLabel?: string,
): VerdictData {
  const area = getAllAreas().find(item => item.slug === areaSlug)
  const areaName = area?.name ?? resolutionLabel ?? 'this area'

  return {
    verdict: 'hold',
    confidence: 0,
    summary: 'This is a basic PlotDNA check based on available area details. Use it for first screening, then verify the exact plot before paying token.',
    reasons: [],
    risks: [],
    suitable_for: 'both',
    last_updated: new Date().toISOString(),
    source: 'fallback',
    resolution_tier: resolutionTier ?? 'exact_locality',
    resolution_label: resolutionLabel ?? areaName,
  }
}

interface Props {
  citySlug: string
  areaSlug: string
  resolutionTier?: VerdictData['resolution_tier']
  resolutionLabel?: string
}

const BUYER_QUESTIONS = [
  ['Can I lose money here?', 'Yes, if you overpay.', 'If the seller already added future growth into the price, your profit can reduce.'],
  ['Is this area growing?', 'Looks positive.', 'Nearby roads, housing activity, and demand from nearby areas can help.'],
  ['Safe to shortlist?', 'Yes, after checks.', 'Check papers, approval, road access, and final price before token.'],
  ['Why we say this?', 'Nearby activity looks decent.', 'But the exact plot still matters more than the area name.'],
]

export default function VerdictCard({ citySlug, areaSlug, resolutionTier, resolutionLabel }: Props) {
  const [data, setData] = useState<VerdictData>(() => buildFallbackVerdict(areaSlug, resolutionTier, resolutionLabel))

  useEffect(() => {
    const params = new URLSearchParams()
    if (resolutionTier) params.set('resolution_tier', resolutionTier)
    if (resolutionLabel?.trim()) params.set('resolution_label', resolutionLabel.trim())
    const query = params.toString()
    const url = `${API_BASE}/api/verdict/${citySlug}/${areaSlug}${query ? `?${query}` : ''}`
    let cancelled = false

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(response.statusText)
        return response.json() as Promise<VerdictData>
      })
      .then(payload => { if (!cancelled) setData(payload) })
      .catch(() => {
        if (!cancelled) setData(buildFallbackVerdict(areaSlug, resolutionTier, resolutionLabel))
      })

    return () => { cancelled = true }
  }, [areaSlug, citySlug, resolutionLabel, resolutionTier])

  const hasLiveAiNote = data.source === 'gemini'

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck size={11} className="text-slate-400" />
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hasLiveAiNote ? 'AI note' : 'PlotDNA note'}</h2>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
        <p className="text-xs leading-relaxed text-slate-400">
          {hasLiveAiNote ? data.summary : 'This is a basic PlotDNA check based on available area details. Use it for first screening, then verify the exact plot before paying token.'}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {BUYER_QUESTIONS.map(([question, answer, detail]) => (
          <div key={question} className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
            <p className="text-[10px] font-bold text-slate-500">{question}</p>
            <p className="mt-1 text-sm font-black text-slate-100">{answer}</p>
            <p className="mt-1 text-[11px] leading-4 text-slate-400">{detail}</p>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
