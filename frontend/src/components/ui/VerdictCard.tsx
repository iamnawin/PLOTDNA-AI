/**
 * VerdictCard — AI-generated "Should you buy here?" verdict.
 * Fetches from /api/verdict/{city}/{area} with Gemini Flash.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Clock } from 'lucide-react'
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

const VERDICT_CONFIG = {
  buy:   { label: 'Worth checking', color: '#10b981', bg: '#10b98115', desc: 'Looks okay, but check the exact plot' },
  hold:  { label: 'Check carefully', color: '#22c55e', bg: '#22c55e15', desc: 'Consider only if the price and papers are right' },
  wait:  { label: 'Do not rush', color: '#f59e0b', bg: '#f59e0b15', desc: 'Check more before making a decision' },
  avoid: { label: 'Avoid for now', color: '#ef4444', bg: '#ef444415', desc: 'Too many concerns for a quick decision' },
}

const SUITABLE_LABELS = {
  investment: 'Investment',
  'end-use':  'End-use',
  both:       'Investment + End-use',
}

function buildFallbackVerdict(
  areaSlug: string,
  resolutionTier?: VerdictData['resolution_tier'],
  resolutionLabel?: string,
): VerdictData {
  const area = getAllAreas().find(item => item.slug === areaSlug)
  const score = area?.score ?? 0
  const verdict: VerdictData['verdict'] =
    score >= 78 ? 'buy' :
    score >= 60 ? 'hold' :
    score >= 45 ? 'wait' :
    'avoid'
  const confidence = area?.dataConfidence === 'verified' ? 72 : area?.dataConfidence === 'partial' ? 58 : 45
  const areaName = area?.name ?? resolutionLabel ?? 'this area'
  const priceRange = area?.priceRange ? ` Current quoted band: ${area.priceRange}.` : ''
  const highlights = area?.highlights?.slice(0, 2) ?? []

  return {
    verdict,
    confidence,
    summary: `You can consider ${areaName}, but don’t rush.${priceRange} First check the road, papers, approval, and price before paying token.`,
    reasons: highlights.length > 0
      ? highlights
      : ['Nearby roads, housing activity, and demand can help.', 'The exact plot still matters more than the area name.'],
    risks: [
      'Check the exact plot papers, approval, road access, and current price.',
      'Ground conditions can change, so visit the site before paying token.',
    ],
    suitable_for: 'both',
    last_updated: new Date().toISOString(),
    source: 'fallback',
    resolution_tier: resolutionTier ?? 'exact_locality',
    resolution_label: resolutionLabel ?? areaName,
  }
}

function timeAgo(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface Props {
  citySlug: string
  areaSlug: string
  resolutionTier?: VerdictData['resolution_tier']
  resolutionLabel?: string
}

export default function VerdictCard({
  citySlug,
  areaSlug,
  resolutionTier,
  resolutionLabel,
}: Props) {
  const [data, setData] = useState<VerdictData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (resolutionTier) params.set('resolution_tier', resolutionTier)
    if (resolutionLabel?.trim()) params.set('resolution_label', resolutionLabel.trim())
    const query = params.toString()
    const url = `${API_BASE}/api/verdict/${citySlug}/${areaSlug}${query ? `?${query}` : ''}`
    let cancelled = false

    const loadVerdict = async () => {
      setLoading(true)
      setError(false)

      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(response.statusText)
        const payload = await response.json() as VerdictData
        if (!cancelled) setData(payload)
      } catch {
        if (!cancelled) setData(buildFallbackVerdict(areaSlug, resolutionTier, resolutionLabel))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadVerdict()

    return () => {
      cancelled = true
    }
  }, [citySlug, areaSlug, resolutionLabel, resolutionTier])

  if (loading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck size={11} className="text-slate-400" />
          <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">Buyer verdict</h2>
        </div>
        <div className="h-52 rounded-2xl animate-pulse glass-panel" />
      </motion.section>
    )
  }

  if (error || !data) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck size={11} className="text-slate-400" />
          <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">Buyer verdict</h2>
        </div>
        <div
          className="p-6 rounded-2xl text-center glass-panel"
        >
          <p className="text-slate-400 font-sans text-xs">We could not load this check right now. Check the road, papers, approval, and price before shortlisting.</p>
        </div>
      </motion.section>
    )
  }

  const cfg = VERDICT_CONFIG[data.verdict]

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-10"
    >
      <div className="flex items-center gap-2 mb-5">
        <ShieldCheck size={11} className="text-slate-400" />
        <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">Buyer verdict</h2>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden" style={{ borderColor: `${cfg.color}25` }}>
        {/* Verdict header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: cfg.bg, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div>
            <p className="text-xl font-display font-black tracking-tight" style={{ color: cfg.color }}>{cfg.label}</p>
            <p className="text-[10px] font-sans text-slate-400 mt-0.5">{cfg.desc}</p>
          </div>

          <p className="max-w-32 text-right text-[10px] font-bold text-slate-400">Use this as a first check</p>
        </div>

        {/* Summary + suitability */}
        <div className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <p className="text-sm font-sans text-slate-300 leading-relaxed mb-3">You can consider this area, but don’t rush. First check the road, papers, approval, and price before paying token.</p>
          <span
            className="text-[10px] font-sans font-medium px-2.5 py-1 rounded-full"
            style={{ background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}25` }}
          >
            Suitable for: {SUITABLE_LABELS[data.suitable_for]}
          </span>
          {data.resolution_tier !== 'exact_locality' && (
            <p className="text-[10px] font-sans text-slate-500 mt-2">
              Nearest area used: {data.resolution_label}. Your exact plot still needs verification.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-white/5 p-4 sm:grid-cols-2">
          {[
            ['Can I lose money here?', 'Yes, if you overpay.', 'If the seller is already quoting a high future price, your profit can reduce.'],
            ['Is this area growing?', 'Looks positive.', 'Nearby roads, housing activity, and demand from nearby areas can help.'],
            ['Safe to shortlist?', 'Yes, but only after checks.', 'Check documents, approval, road access, and final price before token.'],
            ['Why we say this?', 'Nearby activity looks decent.', 'But the exact plot still matters more than the area name.'],
          ].map(([question, answer, detail]) => (
            <div key={question} className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
              <p className="text-[10px] font-bold text-slate-500">{question}</p>
              <p className="mt-1 text-sm font-black text-slate-100">{answer}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">{detail}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-1.5 px-5 py-2.5"
          style={{ background: 'rgba(10, 10, 20, 0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Clock size={9} className="text-slate-500" />
          <p className="text-[9px] font-sans text-slate-500">
            {data.source === 'gemini' ? 'Latest area check' : 'Saved area check'}
            {data.last_updated ? (
              <>
                {" \u00B7 "}
                <span className="font-sans">{timeAgo(data.last_updated)}</span>
              </>
            ) : ''}
          </p>
          <span className="ml-auto text-[9px] font-sans text-slate-500">Verify before paying token</span>
        </div>
      </div>
    </motion.section>
  )
}
