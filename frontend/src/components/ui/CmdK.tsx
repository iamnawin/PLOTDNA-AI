/**
 * CmdK — global Cmd+K / Ctrl+K search palette.
 * Fuzzy-searches all cities + areas and navigates on selection.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Building2, X } from 'lucide-react'
import { getAllAreas, CITY_LIST } from '@/data/cities'
import { getScoreColor } from '@/lib/utils'

interface Result {
  type: 'city' | 'area'
  label: string
  sub: string
  slug: string
  score?: number
  href: string
}

function buildIndex(): Result[] {
  const results: Result[] = []
  CITY_LIST.forEach(city => {
    results.push({ type: 'city', label: city.name, sub: 'City', slug: city.slug, href: `/?city=${city.slug}` })
  })
  getAllAreas().forEach(area => {
    results.push({
      type: 'area',
      label: area.name,
      sub: area.category,
      slug: area.slug,
      score: area.score,
      href: `/area/${area.slug}`,
    })
  })
  return results
}

const ALL_RESULTS = buildIndex()

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t.includes(q)) return true
  // character-by-character fuzzy
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++
  }
  return qi === q.length
}

export default function CmdK() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = query.trim()
    ? ALL_RESULTS.filter(r => fuzzyMatch(query, r.label) || fuzzyMatch(query, r.sub))
    : ALL_RESULTS.slice(0, 8)

  const close = useCallback(() => { setOpen(false); setQuery(''); setSelected(0) }, [])

  const go = useCallback((href: string) => {
    close()
    navigate(href)
  }, [close, navigate])

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [close])

  // Focus input when opened
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  // Arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) go(results[selected].href)
  }

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh]"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden"
        style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Search size={15} className="text-[#555566] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search cities or areas…"
            className="flex-1 bg-transparent text-[#e8e8f0] font-mono text-sm outline-none placeholder-[#333344]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#444455] hover:text-[#888899]">
              <X size={13} />
            </button>
          )}
          <kbd className="text-[9px] font-mono text-[#333344] px-1.5 py-0.5 rounded" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[55vh] md:max-h-80 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="text-center text-[#333344] font-mono text-xs py-8">No results for "{query}"</p>
          ) : (
            results.map((r, i) => {
              const isSelected = i === selected
              const scoreColor = r.score ? getScoreColor(r.score) : '#555566'
              return (
                <button
                  key={`${r.type}-${r.slug}`}
                  data-idx={i}
                  onClick={() => go(r.href)}
                  onMouseEnter={() => setSelected(i)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isSelected ? `${scoreColor}18` : '#1a1a2e' }}
                  >
                    {r.type === 'city'
                      ? <Building2 size={13} style={{ color: isSelected ? '#22c55e' : '#444455' }} />
                      : <MapPin    size={13} style={{ color: isSelected ? scoreColor : '#444455' }} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-[#e8e8f0] truncate">{r.label}</p>
                    <p className="text-[10px] font-mono text-[#444455]">{r.sub}</p>
                  </div>

                  {r.score !== undefined && (
                    <span className="text-sm font-mono font-bold flex-shrink-0" style={{ color: scoreColor }}>
                      {r.score}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-4 px-4 py-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: '#0a0a14' }}
        >
          <span className="text-[9px] font-mono text-[#222233]">↑↓ navigate</span>
          <span className="text-[9px] font-mono text-[#222233]">↵ open</span>
          <span className="text-[9px] font-mono text-[#222233]">esc close</span>
          <span className="ml-auto text-[9px] font-mono text-[#222233]">{results.length} results</span>
        </div>
      </div>
    </div>
  )
}
