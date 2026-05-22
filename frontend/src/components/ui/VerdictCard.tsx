/**
 * VerdictCard — AI-generated "Should you buy here?" verdict.
 * Fetches from /api/verdict/{city}/{area} with Gemini Flash.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Clock, Sparkles } from 'lucide-react'

interface VerdictData {
  verdict: 'buy' | 'hold' | 'wait' | 'avoid'
  confidence: number
  summary: string
  reasons: string[]
  risks: string[]
  suitable_for: 'investment' | 'end-use' | 'both'
  last_updated: string
  source: 'gemini' | 'fallback'
  resolution_tier: 'exact_locality' | 'nearby_micro_market' | 'city_zone_cluster' | 'uncovered'
  resolution_label: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const VERDICT_CONFIG = {
  buy:   { label: 'Buy Signal',  color: '#10b981', bg: '#10b98115', desc: 'Strong fundamentals \u2014 consider buying' },
  hold:  { label: 'Hold',        color: '#22c55e', bg: '#22c55e15', desc: 'Good area \u2014 wait for right price'     },
  wait:  { label: 'Wait & Watch',color: '#f59e0b', bg: '#f59e0b15', desc: 'Area maturing \u2014 revisit in 12\u201318 months' },
  avoid: { label: 'Avoid Now',   color: '#ef4444', bg: '#ef444415', desc: 'Risk outweighs reward currently'      },
}

const SUITABLE_LABELS = {
  investment: '📈 Investment',
  'end-use':  '🏡 End-Use',
  both:       '📈 Investment + 🏡 End-Use',
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
        if (!cancelled) setError(true)
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
          <Brain size={11} className="text-slate-400" />
          <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">AI Verdict</h2>
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
          <Brain size={11} className="text-slate-400" />
          <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">AI Verdict</h2>
        </div>
        <div
          className="p-6 rounded-2xl text-center glass-panel"
        >
          <p className="text-slate-400 font-sans text-xs">AI verdict unavailable{" \u2014 "}start backend or add GEMINI_API_KEY.</p>
          <p className="text-slate-500 font-sans text-[10px] mt-1">cd backend && uvicorn app.main:app --reload</p>
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
        <Brain size={11} className="text-slate-400" />
        <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">AI Verdict</h2>
        <span
          className="text-[8px] font-sans font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)', color: '#6366f1' }}
        >
          <Sparkles size={8} />
          Gemini Flash
        </span>
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

          <div className="text-right">
            {/* Confidence meter */}
            <p className="text-2xl font-mono font-bold" style={{ color: cfg.color }}>{data.confidence}%</p>
            <p className="text-[9px] font-sans text-slate-400">confidence</p>
            {/* Mini bar */}
            <div className="h-1 w-20 rounded-full overflow-hidden mt-1.5 ml-auto bg-slate-900/50" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cfg.color }}
                initial={{ width: 0 }}
                animate={{ width: `${data.confidence}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Summary + suitability */}
        <div className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <p className="text-sm font-sans text-slate-300 leading-relaxed mb-3">{data.summary}</p>
          <span
            className="text-[10px] font-sans font-medium px-2.5 py-1 rounded-full"
            style={{ background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}25` }}
          >
            Suitable for: {SUITABLE_LABELS[data.suitable_for]}
          </span>
          {data.resolution_tier !== 'exact_locality' && (
            <p className="text-[10px] font-sans text-slate-500 mt-2">
              Resolution context: {data.resolution_label}
            </p>
          )}
        </div>

        {/* Reasons + Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Reasons */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-3">
              <CheckCircle2 size={11} className="text-emerald-500" />
              <p className="text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider">Reasons to Consider</p>
            </div>
            <ul className="space-y-2">
              {data.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <TrendingUp size={10} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] font-sans text-slate-400">{r}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-3">
              <AlertTriangle size={11} className="text-amber-500" />
              <p className="text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider">Things to Watch</p>
            </div>
            <ul className="space-y-2">
              {data.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] font-sans text-slate-400">{r}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-1.5 px-5 py-2.5"
          style={{ background: 'rgba(10, 10, 20, 0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Clock size={9} className="text-slate-500" />
          <p className="text-[9px] font-sans text-slate-500">
            {data.source === 'gemini' ? 'Generated by Gemini Flash' : 'Fallback analysis'}
            {data.last_updated ? (
              <>
                {" \u00B7 "}
                <span className="font-sans">{timeAgo(data.last_updated)}</span>
              </>
            ) : ''}
          </p>
          <span className="ml-auto text-[9px] font-sans text-slate-500">AI analysis{" \u2014 "}verify before buying</span>
        </div>
      </div>
    </motion.section>
  )
}
