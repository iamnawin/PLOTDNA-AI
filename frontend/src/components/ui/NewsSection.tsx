/**
 * NewsSection — "What Changed Recently" live news feed.
 * Fetches from /api/news/{city}/{area}, falls back to city-level news.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, ExternalLink, Clock, RefreshCw } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  published_at: string
  summary: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// Credibility color by source name (rough categorisation)
function sourceColor(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('economic') || s.includes('business') || s.includes('mint') || s.includes('hindu')) return '#22c55e'
  if (s.includes('ndtv') || s.includes('moneycontrol') || s.includes('financial')) return '#f59e0b'
  return '#6366f1'
}

function timeAgo(raw: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw.slice(0, 16)
  const diff = Date.now() - d.getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

interface Props {
  citySlug: string
  areaSlug: string
  accentColor: string
}

export default function NewsSection({ citySlug, areaSlug, accentColor }: Props) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function load(forceRefresh = false) {
    forceRefresh ? setRefreshing(true) : setLoading(true)
    setError(false)
    try {
      const url = `${API_BASE}/api/news/${citySlug}/${areaSlug}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      // If area-specific returns nothing, fall back to city-level
      try {
        const res = await fetch(`${API_BASE}/api/news/${citySlug}?limit=8`)
        const data = await res.json()
        setItems(data.items ?? [])
      } catch {
        setError(true)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [citySlug, areaSlug])

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mb-10"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Newspaper size={11} className="text-[#555566]" />
          <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest">
            What Changed Recently
          </h2>
          {/* Live dot */}
          <span className="flex items-center gap-1 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[9px] font-mono text-[#22c55e]">live</span>
          </span>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-[10px] font-mono text-[#444455] hover:text-[#888899] transition-colors disabled:opacity-40"
        >
          <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#111120' }} />
          ))}
        </div>
      ) : error ? (
        <div
          className="p-6 rounded-xl text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-[#444455] font-mono text-xs">Backend not connected — start the FastAPI server to see live news.</p>
          <p className="text-[#2a2a3e] font-mono text-[10px] mt-1">cd backend && uvicorn app.main:app --reload</p>
        </div>
      ) : items.length === 0 ? (
        <div
          className="p-6 rounded-xl text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-[#444455] font-mono text-xs">No recent news found for this area.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const sc = sourceColor(item.source)
            return (
              <motion.a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-start gap-3 p-3.5 rounded-xl group transition-all duration-150 block"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.borderColor = `${accentColor}20`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                }}
              >
                {/* Source badge */}
                <span
                  className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                  style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}25` }}
                >
                  {item.source.split(' ')[0].toUpperCase()}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-mono text-[#aaaabc] group-hover:text-[#e8e8f0] transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock size={9} className="text-[#333344]" />
                    <span className="text-[9px] font-mono text-[#333344]">{timeAgo(item.published_at)}</span>
                    <span className="text-[9px] font-mono text-[#222233]">· {item.source}</span>
                  </div>
                </div>

                <ExternalLink
                  size={10}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity mt-0.5"
                  style={{ color: accentColor }}
                />
              </motion.a>
            )
          })}
        </div>
      )}

      <p className="text-[9px] font-mono text-[#1e1e30] mt-3">
        Live aggregation from 20+ India RE sources · Updated every 6 hours
      </p>
    </motion.section>
  )
}
