import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, Zap, ChevronRight, Navigation, Layers, Map, Satellite, Globe, Sun, Box, Lock, ChevronUp, Car, Clock, Eye, Menu, HardHat } from 'lucide-react'
import { useAppStore } from '@/store'
import { getCityEntry, CITY_LIST } from '@/data/cities'
import type { MicroMarket, RecommendationGoal } from '@/types'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { parseCoords, parseMapUrl, isShortMapUrl, isMapUrl, findNearestArea } from '@/lib/plotAnalysis'
import { getRecommendationGoalMeta, rankAreasForGoal } from '@/lib/recommendations'
import { resolveMapLink } from '@/lib/api'
import ScoreCard from '@/components/score/ScoreCard'
import PlotAnalysisCard from '@/components/score/PlotAnalysisCard'
import SpatialView from '@/components/view/SpatialView'
import ViewModeToggle, { type ViewMode } from '@/components/view/ViewModeToggle'

const RISK_TIERS = [
  { color: '#ef4444', label: 'High Risk',    range: '0–40'   },
  { color: '#f59e0b', label: 'Moderate',     range: '41–65'  },
  { color: '#22c55e', label: 'Good Growth',  range: '66–85'  },
  { color: '#10b981', label: 'Goldzone',     range: '86–100' },
]

export default function Home() {
  const navigate = useNavigate()
  const {
    selectedArea,
    highlightTier,
    searchCoords,
    is3D,
    mapStyleKey,
    selectedCitySlug,
    showConstruction,
    recommendationGoal,
    setSelectedArea,
    setHighlightTier,
    setSearchCoords,
    setIs3D,
    setMapStyleKey,
    setSelectedCitySlug,
    setShowConstruction,
    setRecommendationGoal,
  } = useAppStore()
  const [searchQuery, setSearchQuery]         = useState('')
  const [searchFocused, setSearchFocused]     = useState(false)
  const [showLayers, setShowLayers]           = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [searchError, setSearchError]         = useState('')
  const [resolvingUrl, setResolvingUrl]       = useState(false)
  const [viewMode, setViewMode]               = useState<ViewMode>('map')
  const inputRef = useRef<HTMLInputElement>(null)

  const { areas: cityAreas, meta: cityMeta } = getCityEntry(selectedCitySlug)
  const recommendedAreas = rankAreasForGoal(cityAreas, recommendationGoal)
  const sorted = recommendedAreas.map(({ area }) => area)
  const AVG_DNA = Math.round(cityAreas.reduce((s, a) => s + a.score, 0) / cityAreas.length)
  const cityShortCode = cityMeta.name === 'Delhi NCR'
    ? 'DEL'
    : cityMeta.name.slice(0, 3).toUpperCase()
  const goalMeta = getRecommendationGoalMeta(recommendationGoal)
  const GOAL_OPTIONS: RecommendationGoal[] = ['balanced', 'growth', 'affordable', 'defensive', 'livable']

  const parsedCoords   = parseCoords(searchQuery)
  const parsedMapUrl   = parseMapUrl(searchQuery)
  const shortMapUrl    = isShortMapUrl(searchQuery)
  const isUrl          = isMapUrl(searchQuery)
  const searchResults: MicroMarket[] = searchQuery.trim() && !parsedCoords && !isUrl
    ? sorted.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : []
  const showDropdown   = searchFocused && (searchResults.length > 0 || parsedCoords !== null || parsedMapUrl !== null || shortMapUrl)
  const coordAnalysis  = searchCoords ? findNearestArea(searchCoords[0], searchCoords[1]) : null

  const sidebarList = highlightTier
    ? recommendedAreas.filter(({ area }) => getScoreLabel(area.score) === highlightTier)
    : recommendedAreas

  function handleCityChange(slug: string) {
    setSelectedCitySlug(slug)
    setShowMobileSidebar(false)
  }

  function selectArea(area: MicroMarket) {
    setSelectedArea(area)
    setSearchQuery('')
    setSearchFocused(false)
    setSearchError('')
  }

  function triggerCoordAnalysis(coords: [number, number]) {
    const analysis = findNearestArea(coords[0], coords[1])
    if (analysis.citySlug) setSelectedCitySlug(analysis.citySlug)
    setSearchCoords(coords)
    setSelectedArea(analysis.shouldSelectArea ? analysis.area : null)
    setSearchQuery('')
    setSearchFocused(false)
    setSearchError('')
  }

  async function handleSearchSubmit() {
    setSearchError('')
    if (parsedCoords) {
      triggerCoordAnalysis(parsedCoords)
      return
    }
    if (parsedMapUrl) {
      triggerCoordAnalysis(parsedMapUrl)
      return
    }
    if (shortMapUrl) {
      setResolvingUrl(true)
      const result = await resolveMapLink(searchQuery.trim())
      setResolvingUrl(false)
      if (result.coords) {
        triggerCoordAnalysis(result.coords)
        return
      }
      setSearchError(result.detail ?? (
        result.reason === 'backend_unreachable'
          ? 'Short map links need backend access to resolve. Full map URLs and raw coordinates still work.'
          : result.reason === 'timeout'
            ? 'Timed out while expanding this short link. Try again in a few seconds or paste the full map URL.'
            : 'Could not extract coordinates from this map link. Try the full URL or raw coordinates.'
      ))
      return
    }
    if (searchResults.length > 0) {
      selectArea(searchResults[0])
    }
  }

  function toggleTier(label: string) {
    setHighlightTier(highlightTier === label ? null : label)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050508]">

      {/* ── Map fills 100% of screen ── */}
      <div className="absolute inset-0 z-0">
        <SpatialView
          mode={viewMode}
          citySlug={selectedCitySlug}
          cityName={cityMeta.name}
          cityCenter={cityMeta.center}
          fallback={coordAnalysis}
          coords={searchCoords}
        />
      </div>

      {/* ── Edge vignette for depth ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(5,5,10,0.62) 100%)' }}
      />

      {/* ═══════════════════════════════════════════════
          TOP-LEFT: Logo watermark + mobile hamburger
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
            <span className="text-[9px] font-mono text-[#444455]">· {cityMeta.name}</span>
          </div>
        </div>
        {/* Mobile hamburger — visible only on small screens */}
        <button
          className="md:hidden ml-2 flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: 'rgba(5,5,10,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={() => setShowMobileSidebar(v => !v)}
        >
          <Menu size={14} style={{ color: '#888899' }} />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════
          TOP-RIGHT: Stats pill (hidden on mobile)
      ════════════════════════════════════════════════ */}
      <div
        className="absolute top-5 right-5 z-[1000] hidden md:flex items-center gap-4 px-4 py-2.5 rounded-xl"
        style={{
          background: 'rgba(5,5,10,0.78)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div className="text-center">
          <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest">Markets</p>
          <p className="text-[15px] font-mono font-bold text-[#e8e8f0] leading-tight">{cityAreas.length}</p>
        </div>
        <div className="w-px h-6 bg-[#1e1e2e]" />
        <div className="text-center">
          <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest">Avg DNA</p>
          <p className="text-[15px] font-mono font-bold text-[#22c55e] leading-tight">{AVG_DNA}</p>
        </div>
        <div className="w-px h-6 bg-[#1e1e2e]" />
        <div className="text-center">
          <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest">City</p>
          <p className="text-[11px] font-mono font-semibold text-[#888899] leading-tight">{cityShortCode}</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          CENTER TOP: Search + Suggestions
      ════════════════════════════════════════════════ */}
      <div className="absolute top-14 md:top-5 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[1002] md:w-[460px]">

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
                  color: resolvingUrl ? '#00e676' : searchFocused ? '#00e676' : '#555566',
                  transition: 'color 0.2s',
                  flexShrink: 0,
                }}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Area, lat/lng, or paste a map URL..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchError('') }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit() }}
                className="flex-1 bg-transparent text-[#e8e8f0] font-mono text-sm outline-none placeholder:text-[#3a3a52]"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchError(''); inputRef.current?.focus() }}
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
                {(parsedCoords || parsedMapUrl) && (
                  <button
                    onMouseDown={() => triggerCoordAnalysis(parsedCoords ?? parsedMapUrl!)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                    style={{ borderBottom: searchResults.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <Navigation size={13} className="text-[#00e676] flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[12px] font-mono text-[#00e676]">Analyze this location</span>
                      <p className="text-[10px] font-mono text-[#444455] mt-0.5">
                        {(parsedCoords ?? parsedMapUrl)![0].toFixed(4)}°N  {(parsedCoords ?? parsedMapUrl)![1].toFixed(4)}°E · DNA score + growth story
                      </p>
                    </div>
                    <ChevronRight size={12} className="text-[#00e676]" />
                  </button>
                )}

                {shortMapUrl && (
                  <button
                    onMouseDown={handleSearchSubmit}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                    style={{ borderBottom: searchResults.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <Navigation size={13} className="text-[#00e676] flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[12px] font-mono text-[#00e676]">
                        {resolvingUrl ? 'Resolving map link…' : 'Resolve map link'}
                      </span>
                      <p className="text-[10px] font-mono text-[#444455] mt-0.5">
                        Extract coordinates, then analyze the location
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

        {searchError && (
          <p className="text-center mt-2 text-[10px] font-mono text-[#ef4444]">
            {searchError}
          </p>
        )}

        {/* City selector + top area chips */}
        <AnimatePresence>
          {!searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="mt-2"
            >
              {/* City pills row */}
              <div className="flex items-center justify-center gap-1.5 mb-2">
                {CITY_LIST.map(city => {
                  const isActive = selectedCitySlug === city.slug
                  return (
                    <button
                      key={city.slug}
                      onClick={() => handleCityChange(city.slug)}
                      className="px-3 py-1.5 rounded-full text-[10px] font-mono transition-all duration-150"
                      style={{
                        background: isActive ? 'rgba(0,230,118,0.12)' : 'rgba(5,5,10,0.82)',
                        border: isActive ? '1px solid rgba(0,230,118,0.4)' : '1px solid rgba(255,255,255,0.07)',
                        color: isActive ? '#00e676' : '#666680',
                        boxShadow: isActive ? '0 0 10px rgba(0,230,118,0.15)' : 'none',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      {city.name === 'Delhi NCR' ? 'Delhi' : city.name}
                    </button>
                  )
                })}
              </div>
              {/* Top area chips */}
              <div className="flex items-center justify-center gap-2">
                {recommendedAreas.slice(0, 4).map(({ area, matchScore }: { area: MicroMarket; matchScore: number }) => {
                  const color = getScoreColor(area.score)
                  return (
                    <button
                      key={area.slug}
                      onClick={() => navigate(`/area/${area.slug}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono transition-all"
                      style={{ background: `${color}16`, border: `1px solid ${color}28`, color }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${color}28`; e.currentTarget.style.boxShadow = `0 0 12px ${color}25` }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = `${color}16`; e.currentTarget.style.boxShadow = 'none' }}
                      title={`${matchScore}/100 match`}
                    >
                      <Zap size={9} />
                      {area.name}
                      <span className="text-[9px]" style={{ color: '#e8e8f0' }}>{matchScore}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════
          LEFT: DNA Rankings panel
      ════════════════════════════════════════════════ */}
      {/* Mobile sidebar overlay backdrop */}
      {showMobileSidebar && (
        <div
          className="absolute inset-0 z-[998] md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      <div
        className={`absolute left-5 z-[999] flex-col rounded-xl overflow-hidden ${showMobileSidebar ? 'flex' : 'hidden'} md:flex`}
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
              Recommended for {goalMeta.shortLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {GOAL_OPTIONS.map(goal => {
              const active = goal === recommendationGoal
              return (
                <button
                  key={goal}
                  onClick={() => setRecommendationGoal(goal)}
                  className="px-2 py-1 rounded-full text-[9px] font-mono transition-all"
                  style={{
                    background: active ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.03)',
                    border: active ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    color: active ? '#00e676' : '#666680',
                  }}
                >
                  {getRecommendationGoalMeta(goal).shortLabel}
                </button>
              )
            })}
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
            sidebarList.map(({ area, matchScore, reasons }, idx) => {
              const color = getScoreColor(area.score)
              const isSelected = selectedArea?.slug === area.slug
              const globalRank = recommendedAreas.findIndex(({ area: rankedArea }) => rankedArea.slug === area.slug) + 1
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
                        {reasons[0]?.label}: {reasons[0]?.value}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-[13px] font-mono font-bold" style={{ color }}>
                        {matchScore}
                      </span>
                      <div className="w-8 h-[2px] bg-[#161626] rounded-full mt-1 ml-auto">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${matchScore}%`, backgroundColor: color }}
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
            key={`plot-analysis-${searchCoords[0]}-${searchCoords[1]}`}
            coords={searchCoords}
            fallback={coordAnalysis}
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
          BOTTOM RIGHT: Layer / View switcher
      ════════════════════════════════════════════════ */}
      <div className="absolute z-[1001] flex flex-col items-end gap-2" style={{ bottom: 88, right: 20 }}>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />

        {/* Trigger pill */}
        <button
          onClick={() => setShowLayers(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200"
          style={{
            background: showLayers ? 'rgba(0,230,118,0.12)' : 'rgba(5,5,10,0.92)',
            backdropFilter: 'blur(22px)',
            border: showLayers ? '1px solid rgba(0,230,118,0.4)' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: showLayers
              ? '0 0 20px rgba(0,230,118,0.18), 0 4px 24px rgba(0,0,0,0.55)'
              : '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <Layers size={13} style={{ color: showLayers ? '#00e676' : '#666680' }} />
          <span className="text-[11px] font-mono font-semibold" style={{ color: showLayers ? '#00e676' : '#aaaabc' }}>
            Layers
          </span>
          <ChevronUp
            size={10}
            style={{
              color: showLayers ? '#00e676' : '#444455',
              transform: showLayers ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </button>

        {/* Dropdown panel — opens UPWARD */}
        <AnimatePresence>
          {showLayers && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 bottom-full mb-2 rounded-xl overflow-hidden"
              style={{
                width: 228,
                background: 'rgba(6,6,16,0.97)',
                backdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
              }}
            >
              {/* ── Basemap section ── */}
              <div
                className="px-3.5 pt-3 pb-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <p className="text-[8px] font-mono text-[#333344] uppercase tracking-[0.16em] mb-2">
                  Basemap Style
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { key: 'dark',      Icon: Map,       label: 'Standard'  },
                    { key: 'satellite', Icon: Satellite,  label: 'Satellite' },
                    { key: 'terrain',   Icon: Globe,      label: 'Terrain'   },
                    { key: 'light',     Icon: Sun,        label: 'Light'     },
                  ] as const).map(({ key, Icon, label }) => {
                    const active = mapStyleKey === key
                    return (
                      <button
                        key={key}
                        onClick={() => setMapStyleKey(key)}
                        className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg transition-all duration-150"
                        style={{
                          background: active ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.03)',
                          border: active ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.05)',
                          boxShadow: active ? '0 0 10px rgba(0,230,118,0.12)' : 'none',
                        }}
                      >
                        <Icon size={15} style={{ color: active ? '#00e676' : '#555566' }} />
                        <span
                          className="text-[9px] font-mono"
                          style={{ color: active ? '#00e676' : '#555566' }}
                        >
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── 3D toggle ── */}
              <button
                onClick={() => setIs3D(!is3D)}
                className="w-full flex items-center justify-between px-3.5 py-3 transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div className="flex items-center gap-2.5">
                  <Box size={12} style={{ color: is3D ? '#00e676' : '#555566' }} />
                  <span className="text-[11px] font-mono" style={{ color: is3D ? '#00e676' : '#888899' }}>
                    3D Tilt View
                  </span>
                </div>
                {/* Toggle pill */}
                <div
                  className="relative w-8 h-4.5 rounded-full transition-all duration-250"
                  style={{
                    width: 30, height: 16,
                    background: is3D ? 'rgba(0,230,118,0.25)' : 'rgba(255,255,255,0.08)',
                    border: is3D ? '1px solid rgba(0,230,118,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div
                    className="absolute top-0.5 rounded-full transition-all duration-250"
                    style={{
                      width: 10, height: 10,
                      top: 2,
                      left: is3D ? 16 : 2,
                      backgroundColor: is3D ? '#00e676' : '#555566',
                      boxShadow: is3D ? '0 0 6px #00e67680' : 'none',
                    }}
                  />
                </div>
              </button>

              {/* ── Construction Sites toggle ── */}
              <button
                onClick={() => setShowConstruction(!showConstruction)}
                className="w-full flex items-center justify-between px-3.5 py-3 transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div className="flex items-center gap-2.5">
                  <HardHat size={12} style={{ color: showConstruction ? '#f97316' : '#555566' }} />
                  <div className="text-left">
                    <span className="text-[11px] font-mono block" style={{ color: showConstruction ? '#f97316' : '#888899' }}>
                      Construction Sites
                    </span>
                    <span className="text-[8px] font-mono text-[#333344]">Active projects &amp; pipeline</span>
                  </div>
                </div>
                <div
                  style={{
                    width: 30, height: 16,
                    background: showConstruction ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.08)',
                    border: showConstruction ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 9999,
                    position: 'relative',
                  }}
                >
                  <div style={{
                    width: 10, height: 10,
                    position: 'absolute',
                    top: 2, left: showConstruction ? 16 : 2,
                    borderRadius: '50%',
                    backgroundColor: showConstruction ? '#f97316' : '#555566',
                    boxShadow: showConstruction ? '0 0 6px #f9731680' : 'none',
                    transition: 'all 0.25s',
                  }} />
                </div>
              </button>

              {/* ── Locked / Coming soon ── */}
              <div className="px-3.5 pt-2.5 pb-3">
                <p className="text-[8px] font-mono text-[#252535] uppercase tracking-[0.16em] mb-1.5">
                  Phase 3 — Coming Soon
                </p>
                {([
                  { Icon: Eye,  label: 'Street View 360°'  },
                  { Icon: Car,  label: 'Traffic Overlay'   },
                  { Icon: Clock,label: 'Historical Imagery' },
                ] as const).map(({ Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 py-1.5 opacity-35"
                  >
                    <Icon size={11} className="text-[#444455]" />
                    <span className="text-[10px] font-mono text-[#444455] flex-1">{label}</span>
                    <Lock size={9} className="text-[#2a2a3e]" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════
          BOTTOM CENTER: Risk tier legend (clickable)
      ════════════════════════════════════════════════ */}
      <div
        className="absolute bottom-5 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[999] flex items-center p-1 gap-1 rounded-full overflow-x-auto"
        style={{
          background: 'rgba(5,5,10,0.88)',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        } as React.CSSProperties}
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
