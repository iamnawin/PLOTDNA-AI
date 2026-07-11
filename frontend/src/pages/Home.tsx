import { useCallback, useRef, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, Zap, ChevronRight, Navigation, Layers, Map, Satellite, Globe, Sun, Box, Lock, ChevronUp, Car, Clock, Eye, Menu, HardHat, FileText, TrendingUp } from 'lucide-react'
import { useAppStore } from '@/store'
import { getCityEntry, CITY_LIST } from '@/data/cities'
import type { MicroMarket, RecommendationGoal } from '@/types'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { parseCoords, parseMapUrl, isShortMapUrl, isMapUrl, findNearestArea } from '@/lib/plotAnalysis'
import { getRecommendationGoalMeta, rankAreasForGoal } from '@/lib/recommendations'
import { resolveMapLink, resolveLocation, searchLocationAddress } from '@/lib/api'
import type { LocalityResolution } from '@/lib/location/contracts'
import { searchLocalAreas } from '@/lib/location/search'
import { getCityProductionProfile } from '@/lib/cityProduction'
import { featureFlags } from '@/lib/features'
import { buildAreaStoryPath } from '@/features/areaStory/areaStoryNav'
import { createInitialLocationIntelligence } from '@/lib/landIdentity/locationResolver'
import type { LocationInputType, LocationIntelligence } from '@/lib/landIdentity/types'
import ScoreCard from '@/components/score/ScoreCard'
import PlotAnalysisCard from '@/components/score/PlotAnalysisCard'
import BrochureUploadCard from '@/components/ui/BrochureUploadCard'
import AssistantDock from '@/components/ui/AssistantDock'
import LocationIntelligencePanel from '@/components/location/LocationIntelligencePanel'
import SurveyResolverPanel from '@/components/survey/SurveyResolverPanel'
import type { SurveyResolverResult } from '@/lib/landIdentity/surveyResolver'
import SpatialView from '@/components/view/SpatialView'
import { type ViewMode } from '@/components/view/ViewModeToggle'

const RISK_TIERS = [
  { color: '#ef4444', label: 'High Risk',    short: 'H', range: '0-40'   },
  { color: '#f59e0b', label: 'Moderate',     short: 'M', range: '41-65'  },
  { color: '#22c55e', label: 'Good Growth',  short: 'G', range: '66-85'  },
  { color: '#10b981', label: 'Goldzone',     short: 'Z', range: '86-100' },
]

const ANALYZE_STEPS = [
  'Finding the exact land area...',
  'Checking roads and nearby development...',
  'Checking price and money risk...',
  'Preparing your buyer verdict...',
]

const LAST_MAP_STATE_KEY = 'plotdna:last-map-state'

interface AreaReportNavigationState {
  fallbackContext?: {
    tier: 'exact_locality' | 'nearby_micro_market' | 'context_area' | 'city_zone_cluster' | 'regional' | 'uncovered'
    displayLabel: string
    precisionLabel: 'exact' | 'approximate' | 'broad' | 'none'
    coords?: [number, number]
    districtSlug?: string | null
    districtName?: string | null
    stateSlug?: string | null
  }
}

function parseMapState(search: string): { coords: [number, number] | null; citySlug: string | null } {
  const params = new URLSearchParams(search)
  if (!params.has('lat') || !params.has('lng')) {
    return { coords: null, citySlug: params.get('city') }
  }
  const lat = Number(params.get('lat'))
  const lng = Number(params.get('lng'))
  const citySlug = params.get('city')
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { coords: null, citySlug }
  }
  return { coords: [lat, lng], citySlug }
}

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [resolvingSearch, setResolvingSearch] = useState(false)
  const [locating, setLocating]               = useState(false)
  const [viewMode, setViewMode]               = useState<ViewMode>('map')
  const [globeSidebarExpanded, setGlobeSidebarExpanded] = useState(false)
  const [analyzingCoords, setAnalyzingCoords] = useState<[number, number] | null>(null)
  const [pendingCoords, setPendingCoords]     = useState<[number, number] | null>(null)
  const [analyzeStep, setAnalyzeStep]         = useState(0)
  const [backendResolution, setBackendResolution] = useState<LocalityResolution | null>(null)
  const [locationIntelligence, setLocationIntelligence] = useState<LocationIntelligence | null>(null)
  const [showLocationIntelligence, setShowLocationIntelligence] = useState(false)
  const [showSurveyResolver, setShowSurveyResolver] = useState(false)
  const [isDropPinMode, setIsDropPinMode] = useState(false)
  const [dropPinMessage, setDropPinMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const cityRailRef = useRef<HTMLDivElement>(null)
  const areaRailRef = useRef<HTMLDivElement>(null)
  const resetInitialTierRef = useRef(false)
  const restoredMapStateRef = useRef(false)

  useEffect(() => {
    if (resetInitialTierRef.current) return
    resetInitialTierRef.current = true
    if (highlightTier) {
      setHighlightTier(null)
    }
  }, [highlightTier, setHighlightTier])

  useEffect(() => {
    if (restoredMapStateRef.current) return
    restoredMapStateRef.current = true

    function restoreMapStateFromUrl() {
      const fromUrl = parseMapState(location.search)
      if (fromUrl.citySlug) {
        setSelectedCitySlug(fromUrl.citySlug)
      }
      if (fromUrl.coords) {
        setViewMode('map')
        setMapStyleKey('satellite')
        setIs3D(false)
        setSelectedArea(null)
        setSearchCoords(fromUrl.coords)
        return true
      }

      try {
        const raw = window.localStorage.getItem(LAST_MAP_STATE_KEY)
        if (!raw) return false
        const cached = JSON.parse(raw) as { coords?: [number, number]; citySlug?: string }
        if (!cached.coords || !Array.isArray(cached.coords)) return false
        if (cached.citySlug) setSelectedCitySlug(cached.citySlug)
        setViewMode('map')
        setMapStyleKey('satellite')
        setIs3D(false)
        setSelectedArea(null)
        setSearchCoords(cached.coords)
        return true
      } catch {
        return false
      }
    }

    restoreMapStateFromUrl()
  }, [location.search, setIs3D, setMapStyleKey, setSearchCoords, setSelectedArea, setSelectedCitySlug])

  useEffect(() => {
    if (!analyzingCoords) return
    const interval = setInterval(() => setAnalyzeStep(s => (s + 1) % ANALYZE_STEPS.length), 520)
    return () => clearInterval(interval)
  }, [analyzingCoords])

  useEffect(() => {
    if (viewMode === 'map' && mapStyleKey === 'dark') {
      setMapStyleKey('satellite')
    }
  }, [mapStyleKey, setMapStyleKey, viewMode])

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
  const goalMeta = getRecommendationGoalMeta(recommendationGoal)
  const GOAL_OPTIONS: RecommendationGoal[] = ['balanced', 'growth', 'affordable', 'defensive', 'livable']

  const parsedCoords   = parseCoords(searchQuery)
  const parsedMapUrl   = parseMapUrl(searchQuery)
  const shortMapUrl    = isShortMapUrl(searchQuery)
  const isUrl          = isMapUrl(searchQuery)
  const backendMapUrl  = isUrl && !parsedMapUrl
  const searchResults: MicroMarket[] = searchQuery.trim() && !parsedCoords && !isUrl
    ? searchLocalAreas(searchQuery, cityAreas, selectedCitySlug)
    : []
  const showDropdown   = searchFocused && (searchResults.length > 0 || parsedCoords !== null || parsedMapUrl !== null || shortMapUrl || backendMapUrl || resolvingSearch)
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
      ? `${selectedArea.name} has a ${selectedArea.score}/100 PlotDNA score and ${selectedArea.priceRange} price range.`
      : coordAnalysis?.area
        ? `${coordAnalysis.area.name} is the nearest supported locality.`
        : `${cityMeta.name} map view with no exact locality selected yet.`,
  }

  function handleViewModeChange(nextMode: ViewMode) {
    if (nextMode === 'map' && mapStyleKey === 'dark') {
      setMapStyleKey('satellite')
    }
    if (nextMode === 'globe') {
      setGlobeSidebarExpanded(false)
    }
    setViewMode(nextMode)
  }

  const sidebarList = highlightTier
    ? recommendedAreas.filter(({ area }) => getScoreLabel(area.score) === highlightTier)
    : recommendedAreas
  const tierCounts = RISK_TIERS.reduce<Record<string, number>>((counts, tier) => {
    counts[tier.label] = cityAreas.filter(area => getScoreLabel(area.score) === tier.label).length
    return counts
  }, {})

  function handleCityChange(slug: string) {
    setSelectedCitySlug(slug)
    if (viewMode === 'map' && mapStyleKey === 'dark') {
      setMapStyleKey('satellite')
    }
    setShowMobileSidebar(false)
  }

  function selectArea(area: MicroMarket) {
    setViewMode('map')
    setSelectedArea(area)
    setSearchCoords(null)
    setHighlightTier(null)
    setPendingCoords(null)
    setAnalyzingCoords(null)
    setShowBrochure(false)
    setSearchQuery('')
    setSearchFocused(false)
    setSearchError('')
    maybeOpenLocationIntelligence({
      inputType: 'area_search',
      inputValue: area.name,
    })
  }

  function handleDroppedPin(coords: { lat: number; lng: number }) {
    const droppedCoords: [number, number] = [coords.lat, coords.lng]
    setViewMode('map')
    setMapStyleKey('satellite')
    setIs3D(false)
    setSelectedArea(null)
    setSearchCoords(droppedCoords)
    setIsDropPinMode(false)
    setDropPinMessage('Pin dropped. Location Intelligence is available for this exact point.')
    persistMapStateToUrl(droppedCoords)
    maybeOpenLocationIntelligence({
      inputType: 'drop_pin',
      inputValue: 'Dropped pin',
      coords: droppedCoords,
    })
  }

  function maybeOpenLocationIntelligence(input: {
    inputType: LocationInputType
    inputValue?: string
    coords?: [number, number]
    reverseGeocodedAddress?: string
  }) {
    if (!featureFlags.enableLandIdentityFlow || !featureFlags.enableLocationIntelligencePanel) return

    const intelligence = createInitialLocationIntelligence({
      inputType: input.inputType,
      inputValue: input.inputValue,
      lat: input.coords?.[0],
      lng: input.coords?.[1],
      reverseGeocodedAddress: input.reverseGeocodedAddress,
    })
    setLocationIntelligence(intelligence)
    setShowLocationIntelligence(true)
    setShowSurveyResolver(false)
  }

  function handleSurveyResult(result: SurveyResolverResult) {
    setLocationIntelligence(current => {
      if (!current) return current

      return {
        ...current,
        survey: {
          ...current.survey,
          status: result.status === 'possible_match' ? 'possible_match' : 'manual_verification_required',
          surveyNumber: result.surveyNumber,
          subdivisionNumber: result.subdivisionNumber,
          district: result.district,
          mandal: result.mandal,
          village: result.village,
          confidence: result.confidence,
          message: result.surveyNumber
            ? 'Land detail captured from user input. Official verification is still required.'
            : 'Survey details captured. Official verification is still required.',
        },
      }
    })
  }

  function persistMapStateToUrl(coords: [number, number], citySlug = selectedCitySlug) {
    const params = new URLSearchParams()
    params.set('lat', coords[0].toFixed(6))
    params.set('lng', coords[1].toFixed(6))
    params.set('city', citySlug)
    navigate(`/map?${params.toString()}`, { replace: true })
    try {
      window.localStorage.setItem(LAST_MAP_STATE_KEY, JSON.stringify({ coords, citySlug }))
    } catch {
      // keep map usable if storage is unavailable
    }
  }

  function clearMapStateFromUrl() {
    if (location.search) {
      navigate('/map', { replace: true })
    }
  }

  const buildAreaReportState = useCallback((slug: string, state?: unknown) => {
    const reportState = state as AreaReportNavigationState | undefined
    const coords = reportState?.fallbackContext?.coords ?? searchCoords
    if (!coords) return { pathname: buildAreaStoryPath(slug, 'verdict') }

    const params = new URLSearchParams()
    params.set('fromLat', coords[0].toFixed(6))
    params.set('fromLng', coords[1].toFixed(6))
    params.set('fromCity', selectedCitySlug)
    if (reportState?.fallbackContext?.displayLabel) {
      params.set('fromLabel', reportState.fallbackContext.displayLabel)
    }
    if (reportState?.fallbackContext?.tier) {
      params.set('fromTier', reportState.fallbackContext.tier)
    }
    if (reportState?.fallbackContext?.precisionLabel) {
      params.set('fromPrecision', reportState.fallbackContext.precisionLabel)
    }

    return {
      pathname: buildAreaStoryPath(slug, 'verdict'),
      search: `?${params.toString()}`,
    }
  }, [searchCoords, selectedCitySlug])

  function triggerCoordAnalysis(coords: [number, number], locationInput?: {
    inputType?: LocationInputType
    inputValue?: string
    reverseGeocodedAddress?: string
  }) {
    const analysis = findNearestArea(coords[0], coords[1])
    const nextCitySlug = analysis.citySlug ?? selectedCitySlug
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
        persistMapStateToUrl(coords, nextCitySlug)
        navigate(buildAreaReportState(districtSlug, {
          fallbackContext: {
            tier: res.tier,
            displayLabel: `${res.districtName || 'Regional'} District Fallback`,
            precisionLabel: 'broad',
            coords,
            districtSlug: res.districtSlug,
            districtName: res.districtName,
            stateSlug: res.stateSlug,
          }
        }), {
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
        persistMapStateToUrl(coords, nextCitySlug)
        maybeOpenLocationIntelligence({
          inputType: locationInput?.inputType ?? 'place_search',
          inputValue: locationInput?.inputValue,
          coords,
          reverseGeocodedAddress: locationInput?.reverseGeocodedAddress,
        })
      }
    })
  }

  function handleGlobeMarkerClick(slug: string) {
    setSelectedCitySlug(slug)
    setSearchCoords(null)
    setSelectedArea(null)
    setViewMode('map')
  }

  const openAreaReport = useCallback((slug: string, state?: unknown) => {
    navigate(buildAreaReportState(slug, state), state ? { state } : undefined)
  }, [buildAreaReportState, navigate])

  async function handleSearchSubmit() {
    setSearchError('')
    if (parsedCoords) {
      triggerCoordAnalysis(parsedCoords, {
        inputType: 'place_search',
        inputValue: searchQuery.trim(),
      })
      return
    }
    if (parsedMapUrl) {
      triggerCoordAnalysis(parsedMapUrl, {
        inputType: 'place_search',
        inputValue: searchQuery.trim(),
      })
      return
    }
    if (shortMapUrl || backendMapUrl) {
      setResolvingUrl(true)
      const result = await resolveMapLink(searchQuery.trim())
      setResolvingUrl(false)
      if (result.coords) {
        triggerCoordAnalysis(result.coords, {
          inputType: 'place_search',
          inputValue: searchQuery.trim(),
        })
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
      return
    }
    if (searchQuery.trim()) {
      setResolvingSearch(true)
      const response = await searchLocationAddress(searchQuery.trim())
      setResolvingSearch(false)
      const result = response?.results[0]
      if (!result) {
        setSearchError('No matching Hyderabad locality or address was found. Try a landmark, PIN code, map link, or coordinates.')
        return
      }
      if (result.precision === 'outside_market') {
        setSearchError(`${result.displayName} is outside the Hyderabad market coverage. PlotDNA will not substitute a nearby Hyderabad score.`)
        return
      }
      if (result.resolution) setBackendResolution(result.resolution)
      triggerCoordAnalysis([result.lat, result.lng], {
        inputType: 'place_search',
        inputValue: searchQuery.trim(),
        reverseGeocodedAddress: result.displayName,
      })
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
        triggerCoordAnalysis(coords, { inputType: 'locate_me' })
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
    if ((tierCounts[label] ?? 0) === 0) return
    const nextTier = highlightTier === label ? null : label
    setHighlightTier(nextTier)
    if (nextTier && selectedArea && getScoreLabel(selectedArea.score) !== nextTier) {
      setSelectedArea(null)
    }
  }


  return (
    <div className="relative w-[100dvw] h-[100dvh] overflow-hidden bg-[#060814]">
      {/* ── Map fills 100% of screen ── */}
      {featureFlags.enableLandIdentityFlow &&
        featureFlags.enableLocationIntelligencePanel && (
          <LocationIntelligencePanel
            intelligence={locationIntelligence}
            open={showLocationIntelligence}
            onClose={() => setShowLocationIntelligence(false)}
            onOpenSurveyResolver={() => {
              setShowSurveyResolver(true)
              setShowLocationIntelligence(false)
            }}
          />
        )}
      {featureFlags.enableLandIdentityFlow &&
        featureFlags.enableSurveyResolver && (
          <SurveyResolverPanel
            open={showSurveyResolver}
            onClose={() => setShowSurveyResolver(false)}
            locationIntelligence={locationIntelligence}
            onSurveyResult={handleSurveyResult}
          />
        )}

      <div className="absolute inset-0 z-0">
        <SpatialView
          mode={viewMode}
          citySlug={selectedCitySlug}
          cityName={cityMeta.name}
          cityCenter={cityMeta.center}
          fallback={coordAnalysis}
          coords={searchCoords}
          globeSidebarExpanded={globeSidebarExpanded}
          dropPinMode={featureFlags.enableLandIdentityFlow && isDropPinMode}
          onCityClick={handleGlobeMarkerClick}
          onMapClick={handleDroppedPin}
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
      <div
        className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] md:top-[calc(1.25rem+env(safe-area-inset-top))] left-[calc(0.75rem+env(safe-area-inset-left))] right-[calc(0.75rem+env(safe-area-inset-right))] md:left-1/2 md:right-auto md:-translate-x-1/2 z-[1002]"
        style={{
          width: 'min(860px, calc(100vw - 420px))',
          maxWidth: 'calc(100vw - 1.5rem)',
          minWidth: 'min(460px, calc(100vw - 1.5rem))',
        }}
      >

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
                  color: resolvingUrl || resolvingSearch ? '#10b981' : searchFocused ? '#10b981' : '#64748b',
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearchSubmit()
                  }
                }}
                className="flex-1 bg-transparent text-slate-100 font-sans text-sm outline-none placeholder:text-slate-500"
              />
              {!searchQuery && (
                <button
                  title="Locate me"
                  onClick={handleLocateMe}
                  disabled={resolvingUrl || resolvingSearch || locating}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer font-sans"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: locating ? '#10b981' : '#94a3b8',
                    flexShrink: 0,
                    opacity: resolvingUrl || resolvingSearch || locating ? 0.5 : 1,
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
                    onMouseDown={() => triggerCoordAnalysis(parsedCoords ?? parsedMapUrl!, {
                      inputType: 'place_search',
                      inputValue: searchQuery.trim(),
                    })}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
                    style={{ borderBottom: searchResults.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <Navigation size={13} className="text-emerald-400 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[12px] font-sans font-semibold text-emerald-400">Check this location</span>
                      <p className="text-[10px] font-sans text-slate-500 mt-0.5">
                        <span className="font-mono">{(parsedCoords ?? parsedMapUrl)![0].toFixed(4)}{"\u00B0N"}  {(parsedCoords ?? parsedMapUrl)![1].toFixed(4)}{"\u00B0E"}</span>{" \u00B7 "}money risk + buyer verdict
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
              <div className="relative mb-2">
                <div
                  ref={cityRailRef}
                  className="flex items-center gap-1.5 overflow-x-auto"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    padding: '1px max(0.25rem, env(safe-area-inset-left)) 1px max(0.25rem, env(safe-area-inset-right))',
                    scrollPaddingInline: 12,
                  }}
                >
                  {CITY_LIST.map(city => {
                    const isActive = selectedCitySlug === city.slug
                    return (
                      <button
                        key={city.slug}
                        onClick={() => handleCityChange(city.slug)}
                        className="px-2.5 py-1.5 rounded-full text-[9px] sm:text-[10px] font-sans font-semibold transition-all duration-200 flex-shrink-0 hover:scale-[1.03] active:scale-[0.97]"
                        style={{
                          background: isActive ? 'rgba(16, 185, 129, 0.30)' : 'rgba(15, 23, 42, 0.80)',
                          border: isActive ? '1px solid rgba(16, 185, 129, 0.62)' : '1px solid rgba(148, 163, 184, 0.26)',
                          color: isActive ? '#34d399' : '#e2e8f0',
                          boxShadow: isActive ? '0 0 14px rgba(16, 185, 129, 0.28)' : '0 6px 16px rgba(0,0,0,0.26)',
                        }}
                      >
                        {city.name === 'Delhi NCR' ? 'Delhi' : city.name}
                      </button>
                    )
                  })}
                </div>
              </div>
              {/* Top area chips */}
              <div className="relative">
                <div
                  ref={areaRailRef}
                  className="flex items-center gap-2 overflow-x-auto"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    padding: '1px max(0.25rem, env(safe-area-inset-left)) 1px max(0.25rem, env(safe-area-inset-right))',
                    scrollPaddingInline: 12,
                  }}
                >
                  {sidebarList.slice(0, 6).map(({ area, matchScore }: { area: MicroMarket; matchScore: number }) => {
                    const color = getScoreColor(area.score)
                    const scoreValue = highlightTier ? area.score : matchScore
                    return (
                      <button
                        key={area.slug}
                        onClick={() => navigate(buildAreaStoryPath(area.slug, 'verdict'))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-sans font-bold transition-all duration-200 flex-shrink-0 hover:scale-[1.03]"
                        style={{
                          background: `linear-gradient(180deg, rgba(15,23,42,0.90), rgba(15,23,42,0.78)), ${color}2f`,
                          border: `1px solid ${color}70`,
                          color,
                          boxShadow: `0 8px 20px rgba(0,0,0,0.32), 0 0 14px ${color}24`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `linear-gradient(180deg, rgba(15,23,42,1), rgba(15,23,42,0.92)), ${color}44`; e.currentTarget.style.boxShadow = `0 8px 22px rgba(0,0,0,0.38), 0 0 18px ${color}38` }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = `linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.88)), ${color}2f`; e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.32), 0 0 14px ${color}24` }}
                        title={highlightTier ? `${area.score}/100 DNA score` : `${matchScore}/100 match`}
                      >
                        <Zap size={9} />
                        {area.name}
                        <span className="text-[9px] font-display font-bold" style={{ color: '#f8fafc' }}>{scoreValue}</span>
                      </button>
                    )
                  })}
                  {/* Brochure AI chip */}
                  <button
                    onClick={() => { setShowBrochure(v => !v); setSearchCoords(null); setSelectedArea(null) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-sans font-bold transition-all duration-200 flex-shrink-0 hover:scale-[1.03]"
                    style={{
                      background: showBrochure ? 'rgba(99, 102, 241, 0.32)' : 'rgba(15, 23, 42, 0.80)',
                      border: showBrochure ? '1px solid rgba(165, 180, 252, 0.64)' : '1px solid rgba(165, 180, 252, 0.42)',
                      color: '#dbe4ff',
                      boxShadow: showBrochure ? '0 0 14px rgba(99, 102, 241, 0.30)' : '0 8px 20px rgba(0,0,0,0.30)',
                    }}
                  >
                    <FileText size={9} />
                    Brochure AI
                  </button>
                </div>
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
          background: 'rgba(3, 7, 18, 0.74)',
          border: '1px solid rgba(148, 163, 184, 0.16)',
          boxShadow: '0 18px 48px rgba(0,0,0,0.38)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
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
                {highlightTier ? `${highlightTier} areas` : `Recommended for ${goalMeta.shortLabel}`}
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
                    background: active ? 'rgba(16, 185, 129, 0.22)' : 'rgba(15, 23, 42, 0.86)',
                    border: active ? '1px solid rgba(16, 185, 129, 0.52)' : '1px solid rgba(148, 163, 184, 0.18)',
                    color: active ? '#34d399' : '#cbd5e1',
                    boxShadow: active ? '0 0 12px rgba(16, 185, 129, 0.18)' : '0 5px 14px rgba(0,0,0,0.18)',
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
              {sidebarList.length === 0 ? (
                <div
                  className="rounded-lg px-2.5 py-3"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <p className="text-[10px] font-sans text-slate-500">No areas in this tier</p>
                </div>
              ) : (
                sidebarList.slice(0, 2).map(({ area, matchScore }) => {
                  const color = getScoreColor(area.score)
                  const value = highlightTier ? area.score : matchScore
                  return (
                    <button
                      key={area.slug}
                      onClick={() => setSelectedArea(selectedArea?.slug === area.slug ? null : area)}
                      className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-all hover:bg-white/[0.04]"
                      style={{
                        background: selectedArea?.slug === area.slug ? `${color}12` : 'rgba(255,255,255,0.02)',
                        border: selectedArea?.slug === area.slug ? `1px solid ${color}35` : '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-sans font-medium text-slate-200 truncate">{area.name}</p>
                        <p className="text-[8px] font-sans text-slate-500">
                          {highlightTier ? `${getScoreLabel(area.score)} DNA` : 'Top match'}
                        </p>
                      </div>
                      <span className="text-[11px] font-display font-bold" style={{ color }}>{value}</span>
                    </button>
                  )
                })
              )}
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
            fallbackReportSlug={recommendedAreas[0]?.area.slug ?? cityAreas[0]?.slug ?? 'adibatla'}
            fallbackReportLabel={recommendedAreas[0]?.area.name ?? cityAreas[0]?.name ?? cityMeta.name}
            onOpenAreaReport={openAreaReport}
            onClose={() => { setSearchCoords(null); setSelectedArea(null); clearMapStateFromUrl() }}
          />
        ) : selectedArea ? (
          <ScoreCard
            key={`score-${selectedArea.slug}`}
            area={selectedArea}
            onOpenAreaReport={openAreaReport}
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

        <button
          onClick={() => {
            const compareSeeds = [
              selectedArea?.slug,
              coordAnalysis?.area?.slug,
              ...recommendedAreas.slice(0, 3).map(({ area }) => area.slug),
            ].filter((slug, index, slugs): slug is string => Boolean(slug) && slugs.indexOf(slug) === index).slice(0, 3)
            navigate(`/compare?areas=${compareSeeds.join(',')}`)
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-300 text-[10px] uppercase tracking-wider font-bold bg-cyan-400/12 border border-cyan-400/25 text-cyan-200 hover:bg-cyan-400/18"
          title="Compare nearby areas"
        >
          <TrendingUp size={11} className="text-cyan-300" />
          <span>Compare</span>
        </button>

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
        {featureFlags.enableLandIdentityFlow && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsDropPinMode(active => {
                  const next = !active
                  setDropPinMessage('')
                  return next
                })
              }}
              aria-label={isDropPinMode ? 'Cancel Drop Pin' : 'Drop Pin'}
              title={isDropPinMode ? 'Cancel Drop Pin' : 'Drop Pin'}
              className="rounded-full border px-3.5 py-2 text-[10px] font-sans font-bold uppercase tracking-[0.12em] transition-all"
              style={{
                background: isDropPinMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(8, 12, 24, 0.72)',
                borderColor: isDropPinMode ? 'rgba(16, 185, 129, 0.5)' : 'rgba(148, 163, 184, 0.18)',
                color: isDropPinMode ? '#34d399' : '#cbd5e1',
                boxShadow: isDropPinMode ? '0 0 18px rgba(16,185,129,0.16)' : '0 10px 24px rgba(0,0,0,0.32)',
                backdropFilter: 'blur(14px)',
              }}
            >
              {isDropPinMode ? 'Cancel Pin' : 'Pin Land'}
            </button>
            {dropPinMessage && (
              <span className="hidden max-w-[min(78vw,340px)] rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-[10px] font-sans font-semibold text-slate-300 backdrop-blur sm:inline">
                {dropPinMessage}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          BOTTOM CENTER: Risk tier legend (clickable)
      ════════════════════════════════════════════════ */}
      <div
        className="absolute bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-5 left-[calc(0.75rem+env(safe-area-inset-left))] md:left-5 z-[999] flex items-center gap-1"
      >
        {RISK_TIERS.map((tier) => {
          const isActive = highlightTier === tier.label
          const count = tierCounts[tier.label] ?? 0
          const disabled = count === 0
          return (
            <button
              key={tier.label}
              onClick={() => toggleTier(tier.label)}
              disabled={disabled}
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-200 disabled:cursor-not-allowed select-none"
              style={{
                background: isActive ? tier.color : 'rgba(3, 7, 18, 0.72)',
                border: isActive ? `1px solid ${tier.color}` : '1px solid rgba(148, 163, 184, 0.16)',
                boxShadow: isActive ? `0 0 14px ${tier.color}70, inset 0 1px 0 rgba(255,255,255,0.2)` : '0 8px 22px rgba(0,0,0,0.28)',
                opacity: disabled ? 0.35 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              title={disabled ? `No ${tier.label} areas in ${cityMeta.name}` : `${count} ${tier.label} areas in ${cityMeta.name}`}
            >
              <span
                className="text-[10px] sm:text-[11px] font-sans font-black uppercase leading-none transition-colors duration-200"
                style={{ color: isActive ? '#0f172a' : '#cbd5e1' }}
              >
                {tier.short}
              </span>
            </button>
          )
        })}

        {/* Clear filter hint */}
        <AnimatePresence>
          {highlightTier && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setHighlightTier(null)}
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900/60 border border-white/5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X size={12} />
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
                  Tap anywhere to view land check
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
