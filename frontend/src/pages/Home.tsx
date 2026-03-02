import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, Zap, ChevronRight, Navigation, Layers } from 'lucide-react'
import { useAppStore } from '@/store'
import { hyderabadAreas } from '@/data/hyderabad'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { parseCoords, findNearestArea } from '@/lib/plotAnalysis'
import MapView from '@/components/map/MapView'
import ScoreCard from '@/components/score/ScoreCard'
import PlotAnalysisCard from '@/components/score/PlotAnalysisCard'
import type { MicroMarket } from '@/types'

const RISK_TIERS = [
  { color: '#ef4444', label: 'High Risk',    range: '0–40'   },
  { color: '#f59e0b', label: 'Moderate',     range: '41–65'  },
  { color: '#22c55e', label: 'Good Growth',  range: '66–85'  },
  { color: '#10b981', label: 'Goldzone',     range: '86–100' },
]

const sorted = [...hyderabadAreas].sort((a, b) => b.score - a.score)
const TOP_SUGGESTIONS = sorted.slice(0, 4)
const AVG_DNA = Math.round(hyderabadAreas.reduce((s, a) => s + a.score, 0) / hyderabadAreas.length)

export default function Home() {
  const { selectedArea, highlightTier, searchCoords, is3D, setSelectedArea, setHighlightTier, setSearchCoords, setIs3D } = useAppStore()
  const [searchQuery, setSearchQuery]     = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const parsedCoords   = parseCoords(searchQuery)
  const searchResults: MicroMarket[] = searchQuery.trim() && !parsedCoords
    ? sorted.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : []
  const showDropdown   = searchFocused && (searchResults.length > 0 || parsedCoords !== null)
  const coordAnalysis  = searchCoords ? findNearestArea(searchCoords[0], searchCoords[1]) : null

  const sidebarList = highlightTier
    ? sorted.filter(a => getScoreLabel(a.score) === highlightTier)
    : sorted

  function selectArea(area: MicroMarket) {
    setSelectedArea(area)
    setSearchQuery('')
    setSearchFocused(false)
  }

  function triggerCoordAnalysis(coords: [number, number]) {
    const { area } = findNearestArea(coords[0], coords[1])
    setSearchCoords(coords)
    setSelectedArea(area)
    setSearchQuery('')
    setSearchFocused(false)
  }

  function toggleTier(label: string) {
    setHighlightTier(highlightTier === label ? null : label)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050508]">

      {/* ── Map fills 100% of screen ── */}
      <div className="absolute inset-0 z-0">
        <MapView />
      </div>

      {/* ── Edge vignette for depth ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(5,5,10,0.62) 100%)' }}
      />

      {/* ═══════════════════════════════════════════════
          TOP-LEFT: Logo watermark
      ════════════════════════════════════════════════ */}
      <div className="absolute top-5 left-5 z-[1000] flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #00e676 0%, #00b36b 100%)',
            boxShadow: '0 0 24px #00e67650, 0 2px 8px #00000060',
          }}
        >
          <span className="font-display font-black text-black text-sm leading-none">P</span>
        </div>
        <div>
          <p className="font-display font-bold text-[#e8e8f0] text-[15px] leading-tight tracking-tight">PlotDNA</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              className="w-1.5 h-1.5 rounded-full bg-[#00e676]"
              style={{ boxShadow: '0 0 5px #00e676', animation: 'pulse 2s infinite' }}
            />
            <span className="text-[9px] font-mono text-[#00e676] uppercase tracking-[0.14em]">Live</span>
            <span className="text-[9px] font-mono text-[#444455]">· Hyderabad</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          TOP-RIGHT: Stats pill
      ════════════════════════════════════════════════ */}
      <div
        className="absolute top-5 right-5 z-[1000] flex items-center gap-4 px-4 py-2.5 rounded-xl"
        style={{
          background: 'rgba(5,5,10,0.78)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div className="text-center">
          <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest">Markets</p>
          <p className="text-[15px] font-mono font-bold text-[#e8e8f0] leading-tight">{hyderabadAreas.length}</p>
        </div>
        <div className="w-px h-6 bg-[#1e1e2e]" />
        <div className="text-center">
          <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest">Avg DNA</p>
          <p className="text-[15px] font-mono font-bold text-[#22c55e] leading-tight">{AVG_DNA}</p>
        </div>
        <div className="w-px h-6 bg-[#1e1e2e]" />
        <div className="text-center">
          <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest">City</p>
          <p className="text-[11px] font-mono font-semibold text-[#888899] leading-tight">HYD</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          CENTER TOP: Search + Suggestions
      ════════════════════════════════════════════════ */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[1002] w-[460px]">

        {/* Search bar */}
        <div className="relative">
          <div
            style={{
              background: 'rgba(8,8,18,0.90)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${searchFocused ? 'rgba(0,230,118,0.35)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: showDropdown ? '14px 14px 0 0' : 14,
              boxShadow: searchFocused
                ? '0 0 0 1px rgba(0,230,118,0.08), 0 16px 48px rgba(0,0,0,0.55)'
                : '0 4px 24px rgba(0,0,0,0.45)',
              transition: 'border-color 0.2s, box-shadow 0.2s, border-radius 0.15s',
            }}
          >
            <div className="flex items-center px-4 py-3 gap-3">
              <Search
                size={14}
                style={{
                  color: searchFocused ? '#00e676' : '#555566',
                  transition: 'color 0.2s',
                  flexShrink: 0,
                }}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search area  or paste lat, lng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (parsedCoords) triggerCoordAnalysis(parsedCoords)
                    else if (searchResults.length > 0) selectArea(searchResults[0])
                  }
                }}
                className="flex-1 bg-transparent text-[#e8e8f0] font-mono text-sm outline-none placeholder:text-[#3a3a52]"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); inputRef.current?.focus() }}
                  className="text-[#555566] hover:text-[#e8e8f0] transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Dropdown results */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 right-0 top-full z-[1003] overflow-hidden"
                style={{
                  background: 'rgba(6,6,14,0.97)',
                  backdropFilter: 'blur(24px)',
                  borderLeft:   '1px solid rgba(0,230,118,0.25)',
                  borderRight:  '1px solid rgba(0,230,118,0.25)',
                  borderBottom: '1px solid rgba(0,230,118,0.25)',
                  borderRadius: '0 0 14px 14px',
                  boxShadow: '0 20px 48px rgba(0,0,0,0.6)',
                }}
              >
                {/* Coordinate analysis option */}
                {parsedCoords && (
                  <button
                    onMouseDown={() => triggerCoordAnalysis(parsedCoords)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                    style={{ borderBottom: searchResults.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <Navigation size={13} className="text-[#00e676] flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[12px] font-mono text-[#00e676]">Analyze this location</span>
                      <p className="text-[10px] font-mono text-[#444455] mt-0.5">
                        {parsedCoords[0].toFixed(4)}°N  {parsedCoords[1].toFixed(4)}°E · DNA score + growth story
                      </p>
                    </div>
                    <ChevronRight size={12} className="text-[#00e676]" />
                  </button>
                )}

                {/* Name-based results */}
                {searchResults.slice(0, 5).map((area, i) => {
                  const color = getScoreColor(area.score)
                  return (
                    <button
                      key={area.slug}
                      onMouseDown={() => selectArea(area)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
                      style={{ borderBottom: i < Math.min(searchResults.length, 5) - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}80` }} />
                      <span className="flex-1 text-[13px] font-mono text-[#ccccdd]">{area.name}</span>
                      <span className="text-[11px] font-mono text-[#666680] uppercase tracking-wide">{area.category}</span>
                      <span className="text-sm font-mono font-bold" style={{ color }}>{area.score}</span>
                      <ChevronRight size={12} className="text-[#333344]" />
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Suggested area chips */}
        <AnimatePresence>
          {!searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="flex items-center justify-center gap-2 mt-2.5"
            >
              {TOP_SUGGESTIONS.map((area) => {
                const color = getScoreColor(area.score)
                return (
                  <button
                    key={area.slug}
                    onClick={() => selectArea(area)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono transition-all"
                    style={{
                      background: `${color}16`,
                      border: `1px solid ${color}28`,
                      color,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${color}28`
                      e.currentTarget.style.borderColor = `${color}55`
                      e.currentTarget.style.boxShadow = `0 0 12px ${color}25`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${color}16`
                      e.currentTarget.style.borderColor = `${color}28`
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <Zap size={9} />
                    {area.name}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════
          LEFT: DNA Rankings panel
      ════════════════════════════════════════════════ */}
      <div
        className="absolute left-5 z-[999] flex flex-col rounded-xl overflow-hidden"
        style={{
          top: 78,
          bottom: 76,
          width: 220,
          background: 'rgba(5,5,10,0.82)',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Panel header */}
        <div
          className="px-4 pt-3.5 pb-3 flex-shrink-0"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'linear-gradient(180deg, rgba(0,230,118,0.05) 0%, transparent 100%)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-0.5 h-3.5 rounded-full bg-[#00e676]"
              style={{ boxShadow: '0 0 8px #00e67680' }}
            />
            <p className="text-[9px] font-mono text-[#00e676] uppercase tracking-[0.14em]">
              Ranked by DNA Score
            </p>
          </div>
          {highlightTier && (
            <p className="text-[9px] font-mono text-[#555566] mt-1 pl-2.5">
              {highlightTier} · {sidebarList.length} area{sidebarList.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Area list */}
        <div className="flex-1 overflow-y-auto">
          {sidebarList.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[11px] font-mono text-[#333344] text-center px-4">
                No areas in<br />this tier
              </p>
            </div>
          ) : (
            sidebarList.map((area, idx) => {
              const color = getScoreColor(area.score)
              const isSelected = selectedArea?.slug === area.slug
              const globalRank = sorted.findIndex(a => a.slug === area.slug) + 1
              return (
                <button
                  key={area.slug}
                  onClick={() => setSelectedArea(isSelected ? null : area)}
                  className="w-full text-left transition-all duration-150"
                  style={{
                    padding: '9px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.025)',
                    background: isSelected ? `${color}0d` : 'transparent',
                    borderLeft: isSelected ? `2px solid ${color}` : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-[#2a2a3e] w-4 text-right flex-shrink-0">
                      {highlightTier ? idx + 1 : globalRank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[11px] font-mono truncate leading-tight"
                        style={{ color: isSelected ? '#e8e8f0' : '#9999aa' }}
                      >
                        {area.name}
                      </p>
                      <p className="text-[9px] text-[#333344] font-mono uppercase tracking-wide mt-0.5">
                        {area.category}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-[13px] font-mono font-bold" style={{ color }}>
                        {area.score}
                      </span>
                      <div className="w-8 h-[2px] bg-[#161626] rounded-full mt-1 ml-auto">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${area.score}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          RIGHT: Plot analysis (coords) or Score card (click)
      ════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {searchCoords && coordAnalysis ? (
          <PlotAnalysisCard
            key="plot-analysis"
            coords={searchCoords}
            area={coordAnalysis.area}
            distKm={coordAnalysis.distKm}
            onClose={() => { setSearchCoords(null); setSelectedArea(null) }}
          />
        ) : selectedArea ? (
          <ScoreCard
            key={`score-${selectedArea.slug}`}
            area={selectedArea}
            onClose={() => setSelectedArea(null)}
          />
        ) : null}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════
          BOTTOM RIGHT: 3D / 2D view toggle
      ════════════════════════════════════════════════ */}
      <button
        onClick={() => setIs3D(!is3D)}
        className="absolute bottom-5 right-5 z-[999] flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300"
        style={{
          background: is3D ? 'rgba(0,230,118,0.12)' : 'rgba(5,5,10,0.88)',
          backdropFilter: 'blur(22px)',
          border: is3D ? '1px solid rgba(0,230,118,0.4)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: is3D ? '0 0 20px rgba(0,230,118,0.2), 0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        <Layers size={13} style={{ color: is3D ? '#00e676' : '#666680' }} />
        <span
          className="text-[11px] font-mono font-semibold tracking-wide"
          style={{ color: is3D ? '#00e676' : '#666680' }}
        >
          {is3D ? '3D' : '2D'}
        </span>
        <span className="text-[9px] font-mono text-[#333344]">
          {is3D ? 'TILT ON' : 'TILT OFF'}
        </span>
      </button>

      {/* ═══════════════════════════════════════════════
          BOTTOM CENTER: Risk tier legend (clickable)
      ════════════════════════════════════════════════ */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[999] flex items-center p-1 gap-1 rounded-full"
        style={{
          background: 'rgba(5,5,10,0.88)',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
        }}
      >
        {RISK_TIERS.map((tier) => {
          const isActive = highlightTier === tier.label
          return (
            <button
              key={tier.label}
              onClick={() => toggleTier(tier.label)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full transition-all duration-200"
              style={{
                background: isActive ? `${tier.color}1e` : 'transparent',
                border: isActive ? `1px solid ${tier.color}45` : '1px solid transparent',
                boxShadow: isActive ? `0 0 12px ${tier.color}20` : 'none',
              }}
            >
              <div
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{
                  background: isActive ? `${tier.color}cc` : `${tier.color}44`,
                  border: `1.5px solid ${tier.color}`,
                  boxShadow: isActive ? `0 0 7px ${tier.color}70` : 'none',
                  transition: 'all 0.2s',
                }}
              />
              <span
                className="text-[10px] font-mono whitespace-nowrap transition-colors duration-200"
                style={{ color: isActive ? tier.color : '#666680' }}
              >
                {tier.label}
              </span>
              <span
                className="text-[9px] font-mono transition-colors duration-200"
                style={{ color: isActive ? `${tier.color}88` : '#2e2e42' }}
              >
                {tier.range}
              </span>
            </button>
          )
        })}

        {/* Clear filter hint */}
        <AnimatePresence>
          {highlightTier && (
            <motion.button
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              onClick={() => setHighlightTier(null)}
              className="flex items-center gap-1 px-2 py-2 text-[#555566] hover:text-[#e8e8f0] transition-colors overflow-hidden"
            >
              <X size={11} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
