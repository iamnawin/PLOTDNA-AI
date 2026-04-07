/**
 * MarketPulseCard — Phase 2 live market sentiment.
 * Fetches from GET /api/v1/market-pulse/{country}/{area_slug}
 * Shows: sentiment gauge, positive/neutral/negative breakdown,
 * area vs city comparison, and scored news articles.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, Clock } from 'lucide-react'

interface SentimentArticle {
  title: string
  url: string
  source: string
  published_at: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentiment_score: number
}

interface MarketPulseData {
  area_slug: string
  country: string
  sentiment_score: number
  sentiment_label: 'positive' | 'neutral' | 'negative'
  city_sentiment_score?: number
  positive_count: number
  neutral_count: number
  negative_count: number
  articles: SentimentArticle[]
  last_updated?: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const SENTIMENT_CONFIG = {
  positive: { color: '#10b981', label: 'Positive',  Icon: TrendingUp  },
  neutral:  { color: '#f59e0b', label: 'Neutral',   Icon: Minus       },
  negative: { color: '#ef4444', label: 'Negative',  Icon: TrendingDown },
}

function timeAgo(raw: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw.slice(0, 10)
  const h = Math.floor((Date.now() - d.getTime()) / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Arc path for SVG gauge (semi-circle)
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const toRad = (a: number) => (a - 90) * (Math.PI / 180)
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

interface Props {
  citySlug: string
  areaSlug: string
  country?: string
}

export default function MarketPulseCard({ citySlug, areaSlug, country = 'india' }: Props) {
  const [data, setData] = useState<MarketPulseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function load(force = false) {
    force ? setRefreshing(true) : setLoading(true)
    setError(false)
    try {
      const res = await fetch(`${API_BASE}/api/v1/market-pulse/${country}/${areaSlug}`)
      if (!res.ok) throw new Error(res.statusText)
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [citySlug, areaSlug, country])

  if (loading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22 }}
        className="mb-10"
      >
        <SectionHeader refreshing={false} onRefresh={() => {}} />
        <div className="h-56 rounded-2xl animate-pulse" style={{ background: '#111120' }} />
      </motion.section>
    )
  }

  if (error || !data) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22 }}
        className="mb-10"
      >
        <SectionHeader refreshing={refreshing} onRefresh={() => load(true)} />
        <div
          className="p-6 rounded-2xl text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-[#444455] font-mono text-xs">Market pulse unavailable — Phase 2 backend not running.</p>
          <p className="text-[#2a2a3e] font-mono text-[10px] mt-1">POST /api/v1/market-pulse/{country}/{areaSlug}</p>
        </div>
      </motion.section>
    )
  }

  const cfg = SENTIMENT_CONFIG[data.sentiment_label]
  const score = data.sentiment_score
  // Gauge: -180° to 0° maps to 0–100
  const total = data.positive_count + data.neutral_count + data.negative_count || 1

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.22 }}
      className="mb-10"
    >
      <SectionHeader refreshing={refreshing} onRefresh={() => load(true)} />

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${cfg.color}22` }}
      >
        {/* Top: gauge + breakdown */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Sentiment gauge */}
          <div
            className="flex flex-col items-center justify-center py-8 px-6"
            style={{ background: `${cfg.color}06`, borderRight: '1px solid rgba(255,255,255,0.05)' }}
          >
            {/* SVG arc gauge */}
            <svg width={160} height={90} viewBox="0 0 160 90" className="overflow-visible" style={{ maxWidth: '100%' }}>
              {/* Background arc */}
              <path d={describeArc(80, 85, 60, -180, 0)} fill="none" stroke="#1a1a2e" strokeWidth={10} strokeLinecap="round" />
              {/* Danger zone (0–30) */}
              <path d={describeArc(80, 85, 60, -180, -126)} fill="none" stroke="#ef444420" strokeWidth={10} strokeLinecap="round" />
              {/* Neutral zone (30–60) */}
              <path d={describeArc(80, 85, 60, -126, -54)} fill="none" stroke="#f59e0b20" strokeWidth={10} strokeLinecap="round" />
              {/* Positive zone (60–100) */}
              <path d={describeArc(80, 85, 60, -54, 0)} fill="none" stroke="#10b98120" strokeWidth={10} strokeLinecap="round" />
              {/* Filled arc */}
              <motion.path
                d={describeArc(80, 85, 60, -180, -180 + (score / 100) * 180)}
                fill="none"
                stroke={cfg.color}
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 6px ${cfg.color}60)` }}
              />
              {/* Score text */}
              <text x={80} y={75} textAnchor="middle" fill={cfg.color}
                style={{ fontSize: 28, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>
                {score}
              </text>
            </svg>

            <p className="text-sm font-mono font-bold mt-1" style={{ color: cfg.color }}>{cfg.label} Sentiment</p>
            <p className="text-[9px] font-mono text-[#444455] mt-0.5">Market intelligence score</p>

            {/* vs City comparison */}
            {data.city_sentiment_score !== undefined && (
              <div className="mt-4 flex items-center gap-3">
                <div className="text-center">
                  <p className="text-lg font-mono font-bold" style={{ color: cfg.color }}>{score}</p>
                  <p className="text-[8px] font-mono text-[#444455]">This area</p>
                </div>
                <div className="text-[9px] font-mono text-[#333344]">vs</div>
                <div className="text-center">
                  <p className="text-lg font-mono font-bold text-[#555566]">{data.city_sentiment_score}</p>
                  <p className="text-[8px] font-mono text-[#444455]">City avg</p>
                </div>
              </div>
            )}
          </div>

          {/* Signal breakdown */}
          <div className="flex flex-col justify-center px-6 py-8" style={{ background: 'rgba(255,255,255,0.015)' }}>
            <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest mb-4">Signal breakdown</p>

            {([
              ['positive', data.positive_count],
              ['neutral',  data.neutral_count],
              ['negative', data.negative_count],
            ] as const).map(([sentiment, count]) => {
              const c = SENTIMENT_CONFIG[sentiment]
              const pct = Math.round((count / total) * 100)
              const SIcon = c.Icon
              return (
                <div key={sentiment} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <SIcon size={9} style={{ color: c.color }} />
                      <span className="text-[9px] font-mono text-[#666680]">{c.label}</span>
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: c.color }}>{count} signals</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a2e' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: c.color, boxShadow: `0 0 4px ${c.color}40` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>
              )
            })}

            <p className="text-[8px] font-mono text-[#333344] mt-1">
              Based on {total} signals · NewsAPI + Gemini scoring
            </p>
          </div>
        </div>

        {/* Articles with sentiment badges */}
        {data.articles.length > 0 && (
          <div className="divide-y divide-white/5">
            {data.articles.slice(0, 5).map((article, i) => {
              const ac = SENTIMENT_CONFIG[article.sentiment]
              const AIcon = ac.Icon
              return (
                <motion.a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center gap-3 px-4 py-3 group transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.01)', textDecoration: 'none', display: 'flex' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.01)' }}
                >
                  {/* Sentiment icon */}
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${ac.color}12` }}
                  >
                    <AIcon size={10} style={{ color: ac.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono text-[#888899] group-hover:text-[#ccccdd] transition-colors leading-snug line-clamp-1">
                      {article.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={8} className="text-[#2a2a3e]" />
                      <span className="text-[8px] font-mono text-[#2a2a3e]">{timeAgo(article.published_at)}</span>
                      <span className="text-[8px] font-mono text-[#222233]">· {article.source}</span>
                    </div>
                  </div>

                  {/* Score pill */}
                  <span
                    className="text-[8px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ background: `${ac.color}12`, color: ac.color, border: `1px solid ${ac.color}20` }}
                  >
                    {article.sentiment_score}
                  </span>

                  <ExternalLink
                    size={9}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                    style={{ color: ac.color }}
                  />
                </motion.a>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center gap-1.5 px-5 py-2.5"
          style={{ background: '#0a0a14', borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <Activity size={9} className="text-[#222233]" />
          <p className="text-[9px] font-mono text-[#222233]">
            NewsAPI + Gemini sentiment · {data.last_updated ? `Updated ${timeAgo(data.last_updated)}` : 'Phase 2 live intelligence'}
          </p>
        </div>
      </div>
    </motion.section>
  )
}

function SectionHeader({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <Activity size={11} className="text-[#555566]" />
        <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest">Market Pulse</h2>
        <span className="flex items-center gap-1 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
          <span className="text-[9px] font-mono text-[#6366f1]">live</span>
        </span>
        <span
          className="text-[8px] font-mono px-1.5 py-0.5 rounded ml-1"
          style={{ background: '#6366f115', color: '#6366f1', border: '1px solid #6366f125' }}
        >
          Phase 2
        </span>
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 text-[10px] font-mono text-[#444455] hover:text-[#888899] transition-colors disabled:opacity-40"
      >
        <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
        Refresh
      </button>
    </div>
  )
}
