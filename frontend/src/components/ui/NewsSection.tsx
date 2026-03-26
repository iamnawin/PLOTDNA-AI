/**
 * NewsSection — "What Changed Recently in {area}"
 * Shows 3 items per page. Filters by area name relevance first.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, ExternalLink, Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  published_at: string
  summary: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const PAGE_SIZE = 3

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

/** Keep only items whose title/summary mentions any meaningful word from the area name. */
function filterByArea(items: NewsItem[], areaName: string): NewsItem[] {
  const words = areaName.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  if (words.length === 0) return items
  return items.filter(item => {
    const text = `${item.title} ${item.summary}`.toLowerCase()
    return words.some(w => text.includes(w))
  })
}

interface Props {
  citySlug:    string
  areaSlug:    string
  areaName:    string
  accentColor: string
}

export default function NewsSection({ citySlug, areaSlug, areaName, accentColor }: Props) {
  const [allItems, setAllItems]   = useState<NewsItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [isFallback, setIsFallback] = useState(false)  // true = city-level fallback
  const [page, setPage]           = useState(0)

  async function load(forceRefresh = false) {
    forceRefresh ? setRefreshing(true) : setLoading(true)
    setError(false)
    setPage(0)
    try {
      const res = await fetch(`${API_BASE}/api/news/${citySlug}/${areaSlug}`)
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const raw: NewsItem[] = data.items ?? []
      const filtered = filterByArea(raw, areaName)
      if (filtered.length > 0) {
        setAllItems(filtered)
        setIsFallback(false)
      } else {
        // Nothing area-specific — fall back to city news, still filter
        const cityRes = await fetch(`${API_BASE}/api/news/${citySlug}?limit=20`)
        const cityData = await cityRes.json()
        const cityItems: NewsItem[] = cityData.items ?? []
        const cityFiltered = filterByArea(cityItems, areaName)
        setAllItems(cityFiltered.length > 0 ? cityFiltered : cityItems.slice(0, 9))
        setIsFallback(cityFiltered.length === 0)
      }
    } catch {
      try {
        const res = await fetch(`${API_BASE}/api/news/${citySlug}?limit=20`)
        const data = await res.json()
        const raw: NewsItem[] = data.items ?? []
        const filtered = filterByArea(raw, areaName)
        setAllItems(filtered.length > 0 ? filtered : raw.slice(0, 9))
        setIsFallback(filtered.length === 0)
      } catch {
        setError(true)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [citySlug, areaSlug, areaName])

  const totalPages = Math.ceil(allItems.length / PAGE_SIZE)
  const pageItems  = allItems.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Newspaper size={11} className="text-[#555566]" />
          <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest">
            What Changed Recently in
          </h2>
          <span className="text-xs font-mono font-semibold" style={{ color: accentColor }}>
            {areaName}
          </span>
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

      {/* Fallback notice */}
      {isFallback && !loading && !error && (
        <div
          className="mb-3 px-3 py-2 rounded-lg text-[9px] font-mono text-[#444455]"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          No area-specific news found — showing general real estate news for the region.
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
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
      ) : allItems.length === 0 ? (
        <div
          className="p-6 rounded-xl text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-[#444455] font-mono text-xs">No recent news found for {areaName}.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {pageItems.map((item, i) => {
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
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = `${accentColor}20`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                  }}
                >
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 px-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 text-[10px] font-mono text-[#444455] hover:text-[#888899] transition-colors disabled:opacity-25"
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <span className="text-[9px] font-mono text-[#2e2e42]">
                {page + 1} / {totalPages}
                <span className="ml-2 text-[#1e1e30]">({allItems.length} articles)</span>
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="flex items-center gap-1 text-[10px] font-mono text-[#444455] hover:text-[#888899] transition-colors disabled:opacity-25"
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          )}
        </>
      )}

      <p className="text-[9px] font-mono text-[#1e1e30] mt-3">
        Live aggregation from 20+ India RE sources · Updated every 6 hours
      </p>
    </motion.section>
  )
}
