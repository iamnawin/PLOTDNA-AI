import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, Zap, ChevronRight, Navigation, Layers, Map, Satellite, Globe, Sun, Box, Lock, ChevronUp, Car, Clock, Eye, Menu, HardHat, FileText } from 'lucide-react'
import { useAppStore } from '@/store'
import { getCityEntry, CITY_LIST } from '@/data/cities'
import type { MicroMarket, RecommendationGoal } from '@/types'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { parseCoords, parseMapUrl, isShortMapUrl, isMapUrl, findNearestArea } from '@/lib/plotAnalysis'
import { getRecommendationGoalMeta, rankAreasForGoal } from '@/lib/recommendations'
import { resolveMapLink, resolveLocation } from '@/lib/api'
import type { LocalityResolution } from '@/lib/location/contracts'
import { getCityProductionProfile } from '@/lib/cityProduction'
import ScoreCard from '@/components/score/ScoreCard'
import PlotAnalysisCard from '@/components/score/PlotAnalysisCard'
import BrochureUploadCard from '@/components/ui/BrochureUploadCard'
import AssistantDock from '@/components/ui/AssistantDock'
import SpatialView from '@/components/view/SpatialView'
import { type ViewMode } from '@/components/view/ViewModeToggle'

const RISK_TIERS = [
  { color: '#ef4444', label: 'High Risk',    range: '0-40'   },
  { color: '#f59e0b', label: 'Moderate',     range: '41-65'  },
  { color: '#22c55e', label: 'Good Growth',  range: '66-85'  },
  { color: '#10b981', label: 'Goldzone',     range: '86-100' },
]

const ANALYZE_STEPS = [
  'Reading satellite signals...',
  'Cross-referencing infrastructure data...',
  'Calculating DNA score...',
  'Mapping growth trajectory...',
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
  const [showBrochure, setShowBrochure]       = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [searchError, setSearchError]         = useState('')
  const [resolvingUrl, setResolvingUrl]       = useState(false)
  const [locating, setLocating]               = useState(false)
  const [viewMode, setViewMode]               = useState<ViewMode>('globe')
  const [globeSidebarExpanded, setGlobeSidebarExpanded] = useState(false)
  const [analyzingCoords, setAnalyzingCoords] = useState<[number, number] | null>(null)
  const [pendingCoords, setPendingCoords]     = useState<[number, number] | null>(null)
  const [analyzeStep, setAnalyzeStep]         = useState(0)
  const [backendResolution, setBackendResolution] = useState<LocalityResolution | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!analyzingCoords) return
    const interval = setInterval(() => setAnalyzeStep(s => (s + 1) % ANALYZE_STEPS.length), 520)
    return () => clearInterval(interval)
  }, [analyzingCoords])

  useEffect(() => {
    if (!searchCoords) {
      const timer = setTimeout(() => {
        setBackendResolution(null)
      }, 0)
      return () => clearTimeout(timer)
    }
    let active = true
    resolveLocation(searchCoords[0], searchCoords[1]).then(res => {
      if (active && res) {
        setBackendResolution(res)
      }
    }).catch(() => {})
    return () => {
      active = false
    }
  }, [searchCoords])

  const { areas: cityAreas, meta: cityMeta } = getCityEntry(selectedCitySlug)
  const cityProfile = getCityProductionProfile(cityMeta, cityAreas)
  const recommendedAreas = rankAreasForGoal(cityAreas, recommendationGoal)
  const sorted = recommendedAreas.map(({ area }) => area)
  const goalMeta = getRecommendationGoalMeta(recommendationGoal)
  const GOAL_OPTIONS: RecommendationGoal[] = ['balanced', 'growth', 'affordable', 'defensive', 'livable']

  const parsedCoords   = parseCoords(searchQuery)
  const parsedMapUrl   = parseMapUrl(searchQuery)
  const shortMapUrl    = isShortMapUrl(searchQuery)
  const isUrl          = isMapUrl(searchQuery)
  const backendMapUrl  = isUrl && !parsedMapUrl
  const searchResults: MicroMarket[] = searchQuery.trim() && !parsedCoords && !isUrl
    ? sorted.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : []
  const showDropdown   = searchFocused && (searchResults.length > 0 || parsedCoords !== null || parsedMapUrl !== null || shortMapUrl || backendMapUrl)
  const coordAnalysis  = searchCoords ? findNearestArea(searchCoords[0], searchCoords[1], {}, backendResolution) : null
  const isGlobeMode = viewMode === 'globe'
  const assistantContext = {
    page: 'map' as const,
    citySlug: selectedCitySlug,
    cityName: cityMeta.name,
    areaSlug: selectedArea?.slug ?? coordAnalysis?.area?.slug ?? null,
    areaName: selectedArea?.name ?? coordAnalysis?.area?.name ?? coordAnalysis?.displayLabel ?? null,
    coords: searchCoords ?? null,
    resolutionTier: coordAnalysis?.tier ?? null,
    resolutionLabel: coordAnalysis?.displayLabel ?? null,
    summary: selectedArea
      ? `${selectedArea.name} has a ${selectedArea.score}/100 DNA score and ${selectedArea.priceRange} price range.`
      : coordAnalysis?.area
        ? `${coordAnalysis.area.name} is the nearest supported locality.`
        : `${cityMeta.name} map view with no exact locality selected yet.`,
  }

  function handleViewModeChange(nextMode: ViewMode) {
    if (nextMode === 'globe') {
      setGlobeSidebarExpanded(false)
    }
    setViewMode(nextMode)
  }

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
    setSearchQuery('')
    setSearchFocused(false)
    setSearchError('')
    setSearchCoords(null)
    setSelectedArea(null)
    setPendingCoords(null)
    setAnalyzeStep(0)
    setAnalyzingCoords(coords)

    Promise.all([
      resolveLocation(coords[0], coords[1]).catch(() => null),
      new Promise(resolve => setTimeout(resolve, 2200))
    ]).then(([res]) => {
      setAnalyzingCoords(null)
      if (res && res.tier === 'regional') {
        const districtSlug = res.districtSlug || 'warangal'
        navigate(`/area/${districtSlug}`, {
          state: {
            fallbackContext: {
              tier: res.tier,
              displayLabel: `${res.districtName || 'Regional'} District Fallback`,
              precisionLabel: 'broad',
              coords,
              districtSlug: res.districtSlug,
              districtName: res.districtName,
              stateSlug: res.stateSlug,
            }
          }
        })
      } else {
        setViewMode('map')
        setMapStyleKey('satellite')
        setIs3D(false)
        setSearchCoords(coords)
      }
    })
  }

  function handleGlobeMarkerClick(slug: string) {
    setSelectedCitySlug(slug)
    setSearchCoords(null)
    setSelectedArea(null)
    setViewMode('map')
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
    if (shortMapUrl || backendMapUrl) {
      setResolvingUrl(true)
      const result = await resolveMapLink(searchQuery.trim())
      setResolvingUrl(false)
      if (result.coords) {
        triggerCoordAnalysis(result.coords)
        return
      }
      setSearchError(result.detail ?? (
        result.reason === 'backend_unreachable'
          ? 'Map links need backend access to resolve. Raw coordinates still work.'
          : result.reason === 'timeout'
            ? 'Timed out while expanding this short link. Try again in a few seconds or paste the full map URL.'
            : 'Could not extract coordinates from this map link. Try raw coordinates.'
      ))
      return
    }
    if (searchResults.length > 0) {
      selectArea(searchResults[0])
    }
  }

  function handleLocateMe() {
    setSearchError('')
    if (!navigator.geolocation) {
      setSearchError('Location permission is not available in this browser. Enter latitude and longitude manually.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      position => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ]
        setLocating(false)
        triggerCoordAnalysis(coords)
      },
      error => {
        setLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setSearchError('Location permission was denied. Allow location access or enter latitude and longitude manually.')
          return
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          setSearchError('Could not detect your location right now. Check device location services and try again.')
          return
        }
        setSearchError('Location request timed out. Try again or enter latitude and longitude manually.')
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    )
  }

  function toggleTier(label: string) {
    setHighlightTier(highlightTier === label ? null : label)
  }

  return (
    <div className="relative w-[100dvw] h-[100dvh] overflow-hidden bg-[#060814]">

      {/* ── Map fills 100% of screen ── */}
      <div className="absolute inset-0 z-0">
        <SpatialView
          mode={viewMode}
          citySlug={selectedCitySlug}
          cityName={cityMeta.name}
          cityCenter={cityMeta.center}
          fallback={coordAnalysis}
          coords={searchCoords}
          globeSidebarExpanded={globeSidebarExpanded}
          onCityClick={handleGlobeMarkerClick}
        />
      </div>

      {/* ── Edge vignette for depth ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(6, 8, 20, 0.65) 100%)' }}
      />

      {/* ═══════════════════════════════════════════════
          TOP-LEFT: Logo watermark + mobile hamburger
      ════════════════════════════════════════════════ */}
      <div
        className="absolute z-[1000] flex items-center gap-2.5"
        style={{
          top: 'calc(1.25rem + env(safe-area-inset-top))',
          left: 'calc(1.25rem + env(safe-area-inset-left))',
        }}
      >
        <img
          src="/plotdna-logo.png"
          alt="PlotDNA"
          className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
          style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0, 0, 0, 0.4)' }}
        />
        <div className="hidden sm:block">
          <p className="font-display font-bold text-slate-100 text-[15px] leading-tight tracking-tight">PlotDNA</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
              style={{ boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)', animation: 'pulse 2s infinite' }}
            />
            <span className="text-[9px] font-sans font-semibold text-emerald-400 uppercase tracking-[0.14em]">Live</span>
            <span className="text-[9px] font-sans text-slate-500">{" \u00B7 "}{cityMeta.name}</span>
            {cityProfile.isFlagship && (
              <span className="text-[8px] font-sans font-bold text-emerald-300 uppercase tracking-[0.12em]">Flagship</span>
            )}
          </div>
        </div>
        {/* Mobile hamburger — visible only on small screens */}
        <button
          className="md:hidden ml-2 flex items-center justify-center w-8 h-8 rounded-lg glass-panel-light"
          onClick={() => setShowMobileSidebar(v => !v)}
        >
          <Menu size={14} className="text-slate-400" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════
          TOP-RIGHT: Stats pill (hidden on mobile)
      ════════════════════════════════════════════════ */}
      <div
        className="absolute z-[1000] hidden md:flex items-center gap-4 px-4 py-2.5 rounded-xl glass-panel"
        style={{
          top: 'calc(1.25rem + env(safe-area-inset-top))',
          right: 'calc(1.25rem + env(safe-area-inset-right))',
        }}
      >
        <div className="text-center">
          <p className="text-[9px] font-sans font-semibold text-slate-500 uppercase tracking-widest">Covered</p>
          <p className="text-[15px] font-display font-bold text-slate-100 leading-tight">{cityProfile.totalLocalities}</p>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="text-center">
          <p className="text-[9px] font-sans font-semibold text-slate-500 uppercase tracking-widest">Avg DNA</p>
          <p className="text-[15px] font-display font-bold text-emerald-400 leading-tight">{cityProfile.averageScore}</p>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="text-center">
          <p className="text-[9px] font-sans font-semibold text-slate-500 uppercase tracking-widest">Verified</p>
          <p className="text-[15px] font-display font-bold text-slate-100 leading-tight">{cityProfile.verifiedCount}</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          CENTER TOP: Search + Suggestions
      ════════════════════════════════════════════════ */}
      <div className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] md:top-[calc(1.25rem+env(safe-area-inset-top))] left-[calc(0.75rem+env(safe-area-inset-left))] right-[calc(0.75rem+env(safe-area-inset-right))] md:left-1/2 md:right-auto md:-translate-x-1/2 z-[1002] md:w-[460px]">

        {/* Search bar */}
        <div className="relative">
          <div
            className="glass-panel transition-all duration-200"
            style={{
              border: searchFocused ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: showDropdown ? '16px 16px 0 0' : 16,
              boxShadow: searchFocused
                ? '0 0 25px rgba(16, 185, 129, 0.15), 0 16px 48px rgba(0, 0, 0, 0.6)'
                : '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
            }}
          >
            <div className="flex items-center px-4 py-3.5 gap-3">
              <Search
                size={14}
                style={{
                  color: resolvingUrl ? '#10b981' : searchFocused ? '#10b981' : '#64748b',
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
                className="flex-1 bg-transparent text-slate-100 font-sans text-sm outline-none placeholder:text-slate-500"
              />
              {!searchQuery && (
                <button
                  title="Locate me"
                  onClick={handleLocateMe}
                  disabled={resolvingUrl || locating}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer font-sans"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: locating ? '#10b981' : '#94a3b8',
                    flexShrink: 0,
                    opacity: resolvingUrl || locating ? 0.5 : 1,
                    fontWeight: 600,
                  }}
                >
                  <Navigation size={10} className={locating ? 'animate-pulse' : ''} />
                  {locating ? 'Locating...' : 'Locate'}
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchError(''); inputRef.current?.focus() }}
                  className="text-slate-500 hover:text-slate-200 transition-colors"
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
                  background: 'rgba(8, 12, 24, 0.95)',
                  backdropFilter: 'blur(24px)',
                  borderLeft:   '1px solid rgba(16, 185, 129, 0.3)',
                  borderRight:  '1px solid rgba(16, 185, 129, 0.3)',
                  borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '0 0 16px 16px',
                  boxShadow: '0 20px 48px rgba(0, 0, 0, 0.65)',
                }}
              >
                {/* Coordinate analysis option */}
                {(parsedCoords || parsedMapUrl) && (
                  <button
                    onMouseDown={() => triggerCoordAnalysis(parsedCoords ?? parsedMapUrl!)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
                    style={{ borderBottom: searchResults.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <Navigation size={13} className="text-emerald-400 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[12px] font-sans font-semibold text-emerald-400">Analyze this location</span>
                      <p className="text-[10px] font-sans text-slate-500 mt-0.5">
                        <span className="font-mono">{(parsedCoords ?? parsedMapUrl)![0].toFixed(4)}{"\u00B0N"}  {(parsedCoords ?? parsedMapUrl)![1].toFixed(4)}{"\u00B0E"}</span>{" \u00B7 "}DNA score + growth story
                      </p>
                    </div>
                    <ChevronRight size={12} className="text-emerald-400" />
                  </button>
                )}

                {(shortMapUrl || backendMapUrl) && (
                  <button
                    onMouseDown={handleSearchSubmit}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
                    style={{ borderBottom: searchResults.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <Navigation size={13} className="text-emerald-400 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[12px] font-sans font-semibold text-emerald-400">
                        {resolvingUrl ? 'Resolving map link...' : 'Resolve map link'}
                      </span>
                      <p className="text-[10px] font-sans text-slate-500 mt-0.5">
                        Extract coordinates, then analyze the location
                      </p>
                    </div>
                    <ChevronRight size={12} className="text-emerald-400" />
                  </button>
                )}

                {/* Name-based results */}
                {searchResults.slice(0, 5).map((area, i) => {
                  const color = getScoreColor(area.score)
                  return (
                    <button
                      key={area.slug}
                      onMouseDown={() => selectArea(area)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                      style={{ borderBottom: i < Math.min(searchResults.length, 5) - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                      <span className="flex-1 text-[13px] font-sans text-slate-300 font-medium">{area.name}</span>
                      <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wide font-semibold">{area.category}</span>
                      <span className="text-sm font-display font-bold" style={{ color }}>{area.score}</span>
                      <ChevronRight size={12} className="text-slate-600" />
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {searchError && (
          <p className="text-center mt-2 text-[10px] font-sans text-red-400 font-medium">
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
              className="mt-2.5"
            >
              {/* City pills row */}
              <div
                className="flex items-center gap-1.5 mb-2.5 overflow-x-auto md:justify-center"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {CITY_LIST.map(city => {
                  const isActive = selectedCitySlug === city.slug
                  return (
                    <button
                      key={city.slug}
                      onClick={() => handleCityChange(city.slug)}
                      className="px-3 py-1.5 rounded-full text-[10px] font-sans font-semibold transition-all duration-200 flex-shrink-0 hover:scale-[1.03] active:scale-[0.97]"
                      style={{
                        background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.45)',
                        border: isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                        color: isActive ? '#10b981' : '#94a3b8',
                        boxShadow: isActive ? '0 0 12px rgba(16, 185, 129, 0.15)' : 'none',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                      }}
                    >
                      {city.name === 'Delhi NCR' ? 'Delhi' : city.name}
                    </button>
                  )
                })}
              </div>
              {/* Top area chips */}
              <div
                className="flex items-center gap-2 overflow-x-auto md:justify-center"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {recommendedAreas.slice(0, 4).map(({ area, matchScore }: { area: MicroMarket; matchScore: number }) => {
                  const color = getScoreColor(area.score)
                  return (
                    <button
                      key={area.slug}
                      onClick={() => navigate(`/area/${area.slug}`)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-sans font-medium transition-all duration-200 flex-shrink-0 hover:scale-[1.03]"
                      style={{ background: `${color}16`, border: `1px solid ${color}28`, color }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${color}28`; e.currentTarget.style.boxShadow = `0 0 12px ${color}25` }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = `${color}16`; e.currentTarget.style.boxShadow = 'none' }}
                      title={`${matchScore}/100 match`}
                    >
                      <Zap size={9} />
                      {area.name}
                      <span className="text-[9px] font-display font-bold" style={{ color: '#f1f5f9' }}>{matchScore}</span>
                    </button>
                  )
                })}
                {/* Brochure AI chip */}
                <button
                  onClick={() => { setShowBrochure(v => !v); setSearchCoords(null); setSelectedArea(null) }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-sans font-medium transition-all duration-200 flex-shrink-0 hover:scale-[1.03]"
                  style={{
                    background: showBrochure ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.08)',
                    border: showBrochure ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    boxShadow: showBrochure ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none',
                  }}
                >
                  <FileText size={9} />
                  Brochure AI
                </button>
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
        className={`absolute z-[999] flex-col rounded-2xl overflow-hidden glass-panel ${showMobileSidebar ? 'flex' : 'hidden'} md:flex`}
        style={{
          left: showMobileSidebar ? 'calc(0.75rem + env(safe-area-inset-left))' : 'calc(1.25rem + env(safe-area-inset-left))',
          right: showMobileSidebar ? 'calc(0.75rem + env(safe-area-inset-right))' : 'auto',
          top: `calc(${isGlobeMode ? 106 : 78}px + env(safe-area-inset-top))`,
          bottom: isGlobeMode && !globeSidebarExpanded
            ? 'auto'
            : `calc(${isGlobeMode ? 128 : 76}px + env(safe-area-inset-bottom))`,
          width: showMobileSidebar ? 'auto' : (isGlobeMode ? 210 : 230),
        }}
      >
        {/* Panel header */}
        <div
          className="px-4 pt-3.5 pb-3 flex-shrink-0"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, transparent 100%)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-0.5 h-3.5 rounded-full bg-emerald-500"
                style={{ boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)' }}
              />
              <p className="text-[9px] font-sans font-bold text-emerald-400 uppercase tracking-[0.14em]">
                Recommended for {goalMeta.shortLabel}
              </p>
            </div>
            {isGlobeMode && (
              <button
                onClick={() => setGlobeSidebarExpanded(v => !v)}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: globeSidebarExpanded ? '#10b981' : '#64748b',
                }}
              >
                <ChevronUp
                  size={12}
                  style={{
                    transform: globeSidebarExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {GOAL_OPTIONS.map(goal => {
              const active = goal === recommendationGoal
              return (
                <button
                  key={goal}
                  onClick={() => setRecommendationGoal(goal)}
                  className="px-2 py-1 rounded-full text-[9px] font-sans font-semibold transition-all duration-150 hover:scale-[1.02]"
                  style={{
                    background: active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: active ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: active ? '#10b981' : '#94a3b8',
                  }}
                >
                  {getRecommendationGoalMeta(goal).shortLabel}
                </button>
              )
            })}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              { label: 'Verified', value: cityProfile.verifiedCount, tone: '#10b981' },
              { label: 'Partial', value: cityProfile.partialCount, tone: '#f59e0b' },
              { label: 'Estimated', value: cityProfile.estimatedCount, tone: '#38bdf8' },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-lg px-2 py-1.5"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <p className="text-[10px] font-display font-bold" style={{ color: item.tone }}>{item.value}</p>
                <p className="text-[7px] font-sans font-semibold uppercase tracking-[0.08em] text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
          {isGlobeMode && !globeSidebarExpanded && (
            <div className="mt-3 space-y-2">
              {recommendedAreas.slice(0, 2).map(({ area, matchScore }) => (
                <div
                  key={area.slug}
                  className="flex items-center justify-between rounded-lg px-2.5 py-2"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div>
                    <p className="text-[10px] font-sans font-medium text-slate-200">{area.name}</p>
                    <p className="text-[8px] font-sans text-slate-500">Top match</p>
                  </div>
                  <span className="text-[11px] font-display font-bold text-emerald-400">{matchScore}</span>
                </div>
              ))}
            </div>
          )}
          {highlightTier && (
            <p className="text-[9px] font-sans text-slate-500 mt-1 pl-2.5">
              {highlightTier} • {sidebarList.length} area{sidebarList.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Area list */}
        {(!isGlobeMode || globeSidebarExpanded) && (
          <div className="flex-1 overflow-y-auto">
          {sidebarList.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[11px] font-sans text-slate-500 text-center px-4">
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
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
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
                    <span className="text-[9px] font-sans text-slate-500 w-4 text-right flex-shrink-0">
                      {highlightTier ? idx + 1 : globalRank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[11.5px] font-sans font-medium truncate leading-tight"
                        style={{ color: isSelected ? '#f1f5f9' : '#cbd5e1' }}
                      >
                        {area.name}
                      </p>
                      <p className="text-[9px] text-slate-500 font-sans uppercase tracking-wide mt-0.5">
                        {reasons[0]?.label}: <span className="font-display font-bold">{reasons[0]?.value}</span>
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-[13px] font-display font-bold" style={{ color }}>
                        {matchScore}
                      </span>
                      <div className="w-8 h-[2px] bg-slate-900 rounded-full mt-1 ml-auto">
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
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          RIGHT: Plot analysis (coords) or Score card (click)
      ════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {showBrochure ? (
          <motion.div
            key="brochure-panel"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.25 }}
            className="absolute top-0 right-0 h-full z-[1010] overflow-y-auto"
            style={{ width: 'min(380px, 100vw)' }}
          >
            <div className="p-4 pt-16 min-h-full glass-panel"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={13} style={{ color: '#a5b4fc' }} />
                  <p className="text-xs font-sans font-bold text-[#a5b4fc] tracking-wide">Brochure Analyzer</p>
                </div>
                <button
                  onClick={() => setShowBrochure(false)}
                  className="text-slate-500 hover:text-slate-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <BrochureUploadCard />
            </div>
          </motion.div>
        ) : searchCoords && coordAnalysis ? (
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

      {/* ── Unified Map/Globe/Layers controls capsule ── */}
      <div
        className="absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 transform -translate-x-1/2 z-[1001] flex items-center gap-2 rounded-full p-1.5 glass-panel"
      >
        {/* View Mode Segmented Switch */}
        <div className="flex items-center bg-white/[0.02] p-1 rounded-full border border-white/5 shadow-inner">
          <button
            onClick={() => handleViewModeChange('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 text-[10px] uppercase tracking-wider font-bold ${viewMode === 'map' ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : 'border border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Map size={11} className={viewMode === 'map' ? 'text-emerald-400' : 'text-slate-500'} />
            <span>Map</span>
          </button>
          <button
            onClick={() => handleViewModeChange('globe')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 text-[10px] uppercase tracking-wider font-bold ${viewMode === 'globe' ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : 'border border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Globe size={11} className={viewMode === 'globe' ? 'text-emerald-400' : 'text-slate-500'} />
            <span>Globe</span>
          </button>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Layers Toggle Button */}
        <div className="relative">
          <button
            onClick={() => setShowLayers(v => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-300 text-[10px] uppercase tracking-wider font-bold border ${showLayers ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <Layers size={11} className={showLayers ? 'text-emerald-400' : 'text-slate-500'} />
            <span>Layers</span>
            <ChevronUp
              size={10}
              className={`transition-transform duration-200 ${showLayers ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`}
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
                className="absolute left-1/2 bottom-full mb-3 -translate-x-1/2 w-[228px] rounded-xl overflow-hidden glass-panel"
                style={{
                  background: 'rgba(8, 12, 24, 0.95)',
                  boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
                }}
              >
                {/* ── Basemap section ── */}
                <div
                  className="px-3.5 pt-3 pb-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="text-[8px] font-sans font-bold text-slate-500 uppercase tracking-[0.16em] mb-2">
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
                            background: active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.03)',
                            border: active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                            boxShadow: active ? '0 0 10px rgba(16, 185, 129, 0.12)' : 'none',
                          }}
                        >
                          <Icon size={15} style={{ color: active ? '#10b981' : '#64748b' }} />
                          <span
                            className="text-[9px] font-sans font-bold"
                            style={{ color: active ? '#10b981' : '#64748b' }}
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
                    <Box size={12} style={{ color: is3D ? '#10b981' : '#64748b' }} />
                    <span className="text-[11px] font-sans font-medium" style={{ color: is3D ? '#10b981' : '#cbd5e1' }}>
                      3D Tilt View
                    </span>
                  </div>
                  {/* Toggle pill */}
                  <div
                    className="relative w-8 h-4.5 rounded-full transition-all duration-250"
                    style={{
                      width: 30, height: 16,
                      background: is3D ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      border: is3D ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div
                      className="absolute top-0.5 rounded-full transition-all duration-250"
                      style={{
                        width: 10, height: 10,
                        top: 2,
                        left: is3D ? 16 : 2,
                        backgroundColor: is3D ? '#10b981' : '#64748b',
                        boxShadow: is3D ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none',
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
                    <HardHat size={12} style={{ color: showConstruction ? '#f97316' : '#64748b' }} />
                    <div className="text-left">
                      <span className="text-[11px] font-sans font-medium block" style={{ color: showConstruction ? '#f97316' : '#cbd5e1' }}>
                        Construction Sites
                      </span>
                      <span className="text-[8px] font-sans text-slate-500">Active projects &amp; pipeline</span>
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
                      backgroundColor: showConstruction ? '#f97316' : '#64748b',
                      boxShadow: showConstruction ? '0 0 6px rgba(249,115,22,0.5)' : 'none',
                      transition: 'all 0.25s',
                    }} />
                  </div>
                </button>

                {/* ── Locked / Coming soon ── */}
                <div className="px-3.5 pt-2.5 pb-3">
                  <p className="text-[8px] font-sans font-bold text-slate-600 uppercase tracking-[0.16em] mb-1.5">
                    Phase 3 — Coming Soon
                  </p>
                  {([
                    { Icon: Eye,  label: 'Street View 360\u00B0'  },
                    { Icon: Car,  label: 'Traffic Overlay'   },
                    { Icon: Clock,label: 'Historical Imagery' },
                  ] as const).map(({ Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2.5 py-1.5 opacity-35"
                    >
                      <Icon size={11} className="text-slate-500" />
                      <span className="text-[10px] font-sans text-slate-500 flex-1">{label}</span>
                      <Lock size={9} className="text-slate-700" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          BOTTOM CENTER: Risk tier legend (clickable)
      ════════════════════════════════════════════════ */}
      <div
        className="absolute bottom-5 left-5 z-[999] flex items-center p-1.5 gap-1.5 rounded-full overflow-x-auto glass-panel-light max-w-[calc(100vw-40px)]"
        style={{
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-full transition-all duration-200 hover:bg-white/5"
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
                className="text-[10px] font-sans font-semibold whitespace-nowrap transition-colors duration-200"
                style={{ color: isActive ? tier.color : '#64748b' }}
              >
                {tier.label}
              </span>
              <span
                className="text-[9px] font-display transition-colors duration-200"
                style={{ color: isActive ? `${tier.color}aa` : '#334155' }}
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
              className="flex items-center gap-1 px-2 py-2 text-slate-500 hover:text-slate-200 transition-colors overflow-hidden"
            >
              <X size={11} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>



      {/* ═══════════════════════════════════════════════
          TAP-TO-REVEAL: after analyze loader, before panel opens
      ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {pendingCoords && !searchCoords && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-[1001] cursor-pointer"
            onClick={() => {
              setSearchCoords(pendingCoords)
              setPendingCoords(null)
            }}
          >
            {/* Subtle vignette pulse to signal interactivity */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(16, 185, 129, 0.06) 100%)' }}
            />
            {/* Hint pill */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
              style={{ bottom: 'calc(112px + env(safe-area-inset-bottom))' }}
            >
              <div
                className="flex items-center gap-2.5 px-5 py-3 rounded-full"
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  backdropFilter: 'blur(18px)',
                  boxShadow: '0 0 28px rgba(16, 185, 129, 0.15)',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  style={{ boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)', animation: 'pulse 1.4s infinite' }}
                />
                <span className="text-[12px] font-sans font-semibold text-emerald-400">
                  Tap anywhere to view DNA analysis
                </span>
              </div>
              <p className="text-[9px] font-mono text-slate-500">
                {pendingCoords[0].toFixed(4)}{"\u00B0N"} &nbsp; {pendingCoords[1].toFixed(4)}{"\u00B0E"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════
          DNA LOADING OVERLAY: shown while analyzing coords
      ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {analyzingCoords && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-[2000] flex flex-col items-center justify-center"
            style={{ background: 'rgba(4, 6, 12, 0.96)', backdropFilter: 'blur(28px)' }}
          >
            {/* Spinning rings */}
            <div className="relative w-36 h-36 mb-7">
              {/* Outer ring slow */}
              <svg
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: '3.5s' }}
                viewBox="0 0 144 144"
              >
                <circle cx={72} cy={72} r={66} fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth={1.5} />
                <circle
                  cx={72} cy={72} r={66}
                  fill="none" stroke="#10b981" strokeWidth={2.5}
                  strokeDasharray="44 370" strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.7))' }}
                />
              </svg>
              {/* Middle ring reverse */}
              <svg
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: '2.2s', animationDirection: 'reverse' }}
                viewBox="0 0 144 144"
              >
                <circle cx={72} cy={72} r={50} fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth={1} />
                <circle
                  cx={72} cy={72} r={50}
                  fill="none" stroke="rgba(16, 185, 129, 0.45)" strokeWidth={1.5}
                  strokeDasharray="22 292" strokeLinecap="round"
                />
              </svg>
              {/* Inner dot ring */}
              <svg
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: '1.6s' }}
                viewBox="0 0 144 144"
              >
                <circle cx={72} cy={72} r={34} fill="none" stroke="rgba(16, 185, 129, 0.04)" strokeWidth={1} />
                <circle
                  cx={72} cy={72} r={34}
                  fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth={1}
                  strokeDasharray="12 201" strokeLinecap="round"
                />
              </svg>
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p
                    className="font-sans font-black text-emerald-400 leading-none"
                    style={{ fontSize: 20, textShadow: '0 0 20px rgba(16, 185, 129, 0.6)' }}
                  >
                    DNA
                  </p>
                  <p className="font-sans text-[8px] text-slate-500 tracking-[0.2em] mt-0.5 uppercase font-bold">
                    scan
                  </p>
                </div>
              </div>
            </div>

            {/* Status message */}
            <motion.p
              key={analyzeStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-[13px] font-sans font-semibold text-slate-200 mb-2 text-center px-8"
            >
              {ANALYZE_STEPS[analyzeStep]}
            </motion.p>
            <p className="text-[10px] font-mono text-slate-500">
              {analyzingCoords[0].toFixed(5)}{"\u00B0N"} &nbsp; {analyzingCoords[1].toFixed(5)}{"\u00B0E"}
            </p>

            {/* Progress bar */}
            <div
              className="mt-6 h-px rounded-full overflow-hidden"
              style={{ width: 160, background: 'rgba(255,255,255,0.05)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #10b981, #059669)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.2, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AssistantDock
        key={`assistant-${selectedCitySlug}-${selectedArea?.slug ?? coordAnalysis?.area?.slug ?? 'none'}`}
        context={assistantContext}
      />

    </div>
  )
}
