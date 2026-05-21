import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, ChevronRight, Navigation, Zap, Map, TrendingUp,
  Shield, Activity, X, Clock, Satellite, Building2, AlertTriangle,
  ArrowRight, Paperclip, Link2, MapPin, Route,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { CITY_LIST, CITIES } from '@/data/cities'
import type { MicroMarket, RecommendationGoal } from '@/types'
import { getScoreColor } from '@/lib/utils'
import { parseCoords, parseMapUrl, isShortMapUrl, isMapUrl, findNearestArea } from '@/lib/plotAnalysis'
import { resolveMapLink, analyzeBrochure } from '@/lib/api'
import { consumeSearchAccess, type EntitlementsResponse } from '@/lib/entitlements'
import { getGoalTopAreas, getRecommendationGoalMeta } from '@/lib/recommendations'
import EmailGateModal from '@/components/ui/EmailGateModal'

const PAIN_POINTS = [
  { icon: Clock, value: '10+ hrs', label: 'research saved', desc: 'Broker calls, map checks, RERA lookup, infra notes, and area comparisons start from one coordinate.' },
  { icon: AlertTriangle, value: '7 signals', label: 'risk screened', desc: 'Infrastructure, population, satellite density, RERA, employment, price movement, and scheme context.' },
  { icon: TrendingUp, value: '5-year', label: 'growth view', desc: 'A directional future read before you spend serious money or visit the wrong land parcel.' },
]

const FEATURES = [
  {
    icon: MapPin,
    title: 'Coordinate-level context',
    desc: 'Analyze a location using infrastructure, RERA, satellite, price, and growth signals.',
  },
  {
    icon: Map,
    title: 'City polygon maps',
    desc: 'Open supported city maps and inspect locality-level market boundaries.',
  },
  {
    icon: Satellite,
    title: 'Past, present, future view',
    desc: 'Understand what changed, what matters now, and where the area may be heading.',
  },
  {
    icon: Shield,
    title: 'Due diligence starter',
    desc: 'Quickly classify locations into Good Growth, Moderate, Watchlist, or High Risk.',
  },
]

const cardSurface = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015)), #0b0f14',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
}

export default function Landing() {
  const navigate  = useNavigate()
  const {
    recommendationGoal,
    setRecommendationGoal,
    setSelectedArea,
    setSearchCoords,
    setSelectedCitySlug,
  } = useAppStore()

  const [query, setQuery]             = useState('')
  const [focused, setFocused]         = useState(false)
  const [activeCity, setActiveCity]   = useState('hyderabad')
  const [resolving, setResolving]     = useState(false)  // resolving short map link
  const [brochureLoading, setBrochureLoading] = useState(false)
  const [locating, setLocating]       = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisMessage, setAnalysisMessage] = useState('Decoding location DNA...')
  const [inputError, setInputError]   = useState('')
  const [emailGateOpen, setEmailGateOpen] = useState(false)
  const [entitlements, setEntitlements] = useState<EntitlementsResponse | null>(null)
  const inputRef      = useRef<HTMLInputElement>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const pendingSearchActionRef = useRef<null | (() => void)>(null)

  // Gather all areas across all cities for search
  const allAreas: (MicroMarket & { citySlug: string })[] = Object.entries(CITIES).flatMap(
    ([slug, { areas }]) => areas.map(a => ({ ...a, citySlug: slug }))
  )

  const parsedCoords  = parseCoords(query)
  const parsedMapUrl  = parseMapUrl(query)
  const shortMapUrl   = isShortMapUrl(query)
  const isUrl         = isMapUrl(query)
  const backendMapUrl = isUrl && !parsedMapUrl

  const results = query.trim() && !parsedCoords && !isUrl
    ? allAreas.filter(a => a.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []
  const showDropdown = focused && (results.length > 0 || parsedCoords !== null || parsedMapUrl !== null || shortMapUrl || backendMapUrl)

  function goToArea(area: MicroMarket & { citySlug: string }) {
    setSelectedCitySlug(area.citySlug)
    setSelectedArea(area)
    navigate(`/area/${area.slug}`)
  }

  function analyzeCoords(coords: [number, number], message = 'Decoding location DNA...') {
    setAnalysisMessage(message)
    setAnalysisLoading(true)
    const analysis = findNearestArea(coords[0], coords[1])
    if (analysis.citySlug) setSelectedCitySlug(analysis.citySlug)
    setSearchCoords(coords)
    setSelectedArea(analysis.shouldSelectArea ? analysis.area : null)
    window.setTimeout(() => {
      navigate('/map')
    }, 650)
  }

  async function requireSearchAccess(action: () => void) {
    setInputError('')
    const result = await consumeSearchAccess()
    if (result.status === 'ok') {
      setEntitlements(result.entitlements)
      action()
      return
    }
    if (result.status === 'email_required') {
      pendingSearchActionRef.current = action
      setEntitlements(result.entitlements)
      setEmailGateOpen(true)
      return
    }
    setInputError(result.message)
  }

  function handleEmailUnlocked(nextEntitlements: EntitlementsResponse) {
    setEntitlements(nextEntitlements)
    setEmailGateOpen(false)
    const pending = pendingSearchActionRef.current
    pendingSearchActionRef.current = null
    pending?.()
  }

  async function handleEnter() {
    setInputError('')
    // Direct coords
    if (parsedCoords) { analyzeCoords(parsedCoords); return }
    // Full map URL (parsed on frontend)
    if (parsedMapUrl) { analyzeCoords(parsedMapUrl, 'Extracting map coordinates...'); return }
    // Map URLs without embedded coordinates need backend redirect/geocode resolution.
    if (shortMapUrl || backendMapUrl) {
      setResolving(true)
      const result = await resolveMapLink(query.trim())
      setResolving(false)
      if (result.coords) { analyzeCoords(result.coords, 'Resolved map link. Opening analysis...'); return }
      setInputError(result.detail ?? (
        result.reason === 'backend_unreachable'
          ? 'Map links need backend access to resolve. Raw coordinates still work.'
          : result.reason === 'timeout'
            ? 'Timed out while expanding this short link. Try again in a few seconds or paste the full map URL.'
            : 'Could not extract coordinates from this map link. Try copying the coordinates directly.'
      ))
      return
    }
    // Area name search
    if (results.length > 0) { await requireSearchAccess(() => goToArea(results[0])); return }
  }

  async function handleBrochureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBrochureLoading(true)
    setInputError('')
    const result = await analyzeBrochure(file)
    setBrochureLoading(false)
    if (result) {
      analyzeCoords([result.lat, result.lng], 'Brochure location found. Opening analysis...')
    } else {
      setInputError('Could not extract location from this file. Try a clearer image or paste the address.')
    }
    // Reset file input so the same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleLocateMe() {
    setInputError('')
    if (!navigator.geolocation) {
      setInputError('Location permission is not available in this browser. Enter latitude and longitude manually.')
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
        setQuery(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`)
        analyzeCoords(coords, 'Location found. Opening analysis...')
      },
      error => {
        setLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setInputError('Location permission was denied. Allow location access or enter latitude and longitude manually.')
          return
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          setInputError('Could not detect your location right now. Check device location services and try again.')
          return
        }
        setInputError('Could not get your location in time. Check location services, then try Locate me again.')
      },
      {
        enableHighAccuracy: false,
        timeout: 25_000,
        maximumAge: 300_000,
      },
    )
  }

  function goToMap() {
    setSelectedCitySlug(activeCity)
    navigate('/map', { state: { initialViewMode: 'map' } })
  }

  function openCityMap(citySlug: string) {
    setActiveCity(citySlug)
    setSelectedCitySlug(citySlug)
    setSelectedArea(null)
    setSearchCoords(null)
    navigate('/map', { state: { initialViewMode: 'map' } })
  }

  const previewAreas = getGoalTopAreas(CITIES[activeCity]?.areas ?? [], recommendationGoal, 5)
  const goalMeta = getRecommendationGoalMeta(recommendationGoal)
  const GOAL_OPTIONS: RecommendationGoal[] = ['balanced', 'growth', 'affordable', 'defensive', 'livable']

  return (
    <>
    <AnimatePresence>
      {analysisLoading && (
        <motion.div
          key="analysis-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 50% 35%, rgba(0,230,118,0.14), transparent 34%), #050508',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="relative mb-6 h-20 w-20 rounded-full"
            style={{
              border: '1px solid rgba(0,230,118,0.18)',
              boxShadow: '0 0 50px rgba(0,230,118,0.18)',
            }}
          >
            <div
              className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full"
              style={{ background: '#00e676', boxShadow: '0 0 18px #00e676' }}
            />
            <div
              className="absolute inset-3 rounded-full"
              style={{ border: '1px solid rgba(0,188,212,0.18)' }}
            />
          </motion.div>
          <div className="mb-3 flex items-center gap-2">
            <img
              src="/plotdna-logo.png"
              alt="PlotDNA"
              className="h-8 w-8 rounded-xl object-cover"
              style={{ boxShadow: '0 0 22px rgba(0,230,118,0.35)' }}
            />
            <span className="text-sm font-bold tracking-[-0.02em] text-[#e8e8f0]">PlotDNA</span>
          </div>
          <p className="text-center text-[12px] font-mono text-[#00e676]">{analysisMessage}</p>
          <p className="mt-2 text-center text-[9px] font-mono uppercase tracking-[0.18em] text-[#333344]">
            Preparing coordinate analysis
          </p>
        </motion.div>
      )}
    </AnimatePresence>

    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: 'var(--font-body)' }}
    >
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <img
            src="/plotdna-logo.png"
            alt="PlotDNA"
            className="w-8 h-8 rounded-xl object-cover"
            style={{ boxShadow: '0 0 20px #00e67640' }}
          />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>PlotDNA</span>
          <span
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px]"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', color: '#00e676' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#00e676]"
              style={{ boxShadow: '0 0 4px #00e676', animation: 'pulse 2s infinite' }}
            />
            Live · {CITY_LIST.length} Cities
          </span>
        </div>
        <button
          onClick={goToMap}
          className="mobile-tap flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] transition-all"
          style={{
            background: 'rgba(0,230,118,0.1)',
            border: '1px solid rgba(0,230,118,0.3)',
            color: '#00e676',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,230,118,0.18)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,230,118,0.1)' }}
        >
          <Map size={12} />
          Open Map
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-5 pt-10 sm:pt-16 pb-10 text-center">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex max-w-full items-center justify-center gap-2 px-3 py-1.5 rounded-full mb-6 text-center"
          style={{
            background: 'rgba(0,230,118,0.07)',
            border: '1px solid rgba(0,230,118,0.2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: '#00e676',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <Zap size={10} />
          REAL ESTATE INVESTMENT INTELLIGENCE · INDIA
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(44px, 7vw, 88px)',
            fontWeight: 800,
            letterSpacing: '-0.06em',
            lineHeight: 0.96,
            maxWidth: 780,
            color: 'var(--text-main)',
          }}
        >
          Decode the real potential
          <span style={{ color: '#00e676' }}> of any land parcel.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 680, marginTop: 22, lineHeight: 1.7, letterSpacing: '-0.01em' }}
        >
          PlotDNA analyzes infrastructure, growth signals, satellite context, RERA activity, and location patterns to help you judge land before you buy.
        </motion.p>

        {/* ── Search box ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
          className="relative w-full mt-12"
          style={{ maxWidth: 680 }}
        >
          <div
            style={{
              background: 'rgba(11,15,20,0.82)',
              backdropFilter: 'blur(26px)',
              border: `1px solid ${focused ? 'rgba(0,230,118,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: showDropdown ? '18px 18px 0 0' : 18,
              boxShadow: focused
                ? '0 0 0 1px rgba(0,230,118,0.12), 0 24px 64px rgba(0,0,0,0.58)'
                : '0 16px 48px rgba(0,0,0,0.42)',
              transition: 'border-color 0.2s, box-shadow 0.2s, border-radius 0.15s',
            }}
          >
            <div className="landing-search-row flex flex-wrap items-center px-5 py-4 gap-3 sm:flex-nowrap sm:px-6 sm:py-5">
              {resolving || brochureLoading || locating || analysisLoading ? (
                <Activity
                  size={16}
                  style={{ color: '#00e676', flexShrink: 0, animation: 'spin 1s linear infinite' }}
                />
              ) : isUrl ? (
                <Link2 size={16} style={{ color: '#00e676', flexShrink: 0 }} />
              ) : (
                <Search
                  size={16}
                  style={{ color: focused ? '#00e676' : '#444455', transition: 'color 0.2s', flexShrink: 0 }}
                />
              )}
              <input
                ref={inputRef}
                type="text"
                placeholder="Search area, coordinates, or paste a map link"
                value={query}
                onChange={e => { setQuery(e.target.value); setInputError('') }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 160)}
                onKeyDown={e => { if (e.key === 'Enter') handleEnter() }}
                style={{
                  flex: '1 1 260px',
                  minWidth: 0,
                  background: 'transparent',
                  color: '#e8e8f0',
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  outline: 'none',
                  border: 'none',
                }}
              />
              {query && (
                <button onClick={() => { setQuery(''); setInputError(''); inputRef.current?.focus() }} style={{ color: '#444455' }}>
                  <X size={14} />
                </button>
              )}

              {/* Hidden file input for brochure */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
                onChange={handleBrochureUpload}
              />
              {/* Brochure upload button */}
              <button
                title="Upload a property brochure (PDF or image)"
                onClick={() => fileInputRef.current?.click()}
                disabled={brochureLoading || locating || analysisLoading}
                className="mobile-icon-button mobile-tap flex items-center justify-center w-7 h-7 rounded-lg transition-all flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: brochureLoading ? '#00e676' : '#444455',
                  opacity: brochureLoading || locating || analysisLoading ? 0.5 : 1,
                }}
              >
                <Paperclip size={12} />
              </button>

              <button
                title="Allow location permission and analyze your current coordinates"
                onClick={handleLocateMe}
                disabled={resolving || brochureLoading || locating || analysisLoading}
                className="mobile-action-button mobile-tap flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: locating ? '#00e676' : 'var(--text-muted)',
                  flexShrink: 0,
                  opacity: resolving || brochureLoading || locating || analysisLoading ? 0.55 : 1,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                }}
              >
                <Navigation size={11} />
                {locating ? 'Locating...' : 'Locate me'}
              </button>

              <button
                onClick={handleEnter}
                disabled={resolving || brochureLoading || analysisLoading}
                className="mobile-action-button mobile-tap flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #00E676, #00C267)',
                  border: '1px solid rgba(0,230,118,0.35)',
                  color: '#03130A',
                  flexShrink: 0,
                  opacity: resolving || brochureLoading || analysisLoading ? 0.5 : 1,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 800,
                  boxShadow: '0 0 24px rgba(0,230,118,0.22)',
                }}
              >
                {resolving ? 'Resolving…' : brochureLoading ? 'Reading…' : analysisLoading ? 'Opening...' : 'Analyze'}
                <ChevronRight size={11} />
              </button>
            </div>
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 right-0 top-full z-50 overflow-hidden"
                style={{
                  background: 'rgba(6,6,16,0.97)',
                  backdropFilter: 'blur(24px)',
                  borderLeft: '1px solid rgba(0,230,118,0.25)',
                  borderRight: '1px solid rgba(0,230,118,0.25)',
                  borderBottom: '1px solid rgba(0,230,118,0.25)',
                  borderRadius: '0 0 16px 16px',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.7)',
                }}
              >
                {(parsedCoords || parsedMapUrl) && (() => {
                  const coords = parsedCoords ?? parsedMapUrl!
                  return (
                    <button
                      onMouseDown={() => { analyzeCoords(coords) }}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
                      style={{ borderBottom: results.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      {parsedMapUrl ? <Link2 size={13} style={{ color: '#00e676', flexShrink: 0 }} /> : <Navigation size={13} style={{ color: '#00e676', flexShrink: 0 }} />}
                      <div className="flex-1">
                        <span style={{ fontSize: 12, color: '#00e676' }}>Analyze this location</span>
                        <p style={{ fontSize: 10, color: '#444455', marginTop: 2 }}>
                          {coords[0].toFixed(4)}°N  {coords[1].toFixed(4)}°E · DNA score + growth story
                        </p>
                      </div>
                      <ChevronRight size={12} style={{ color: '#00e676' }} />
                    </button>
                  )
                })()}

                {/* Map links without coordinates — show resolve option */}
                {(shortMapUrl || backendMapUrl) && (
                  <button
                    onMouseDown={handleEnter}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
                    style={{ borderBottom: results.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                  >
                    <Link2 size={13} style={{ color: '#00e676', flexShrink: 0 }} />
                    <div className="flex-1">
                      <span style={{ fontSize: 12, color: '#00e676' }}>Resolve map link</span>
                      <p style={{ fontSize: 10, color: '#444455', marginTop: 2 }}>
                        Extract coordinates and analyze location
                      </p>
                    </div>
                    <ChevronRight size={12} style={{ color: '#00e676' }} />
                  </button>
                )}

                {results.map((area, i) => {
                  const color = getScoreColor(area.score)
                  return (
                    <button
                      key={area.slug}
                      onMouseDown={() => { void requireSearchAccess(() => goToArea(area)) }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                      style={{ borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}80` }}
                      />
                      <span style={{ flex: 1, fontSize: 13, color: '#ccccdd' }}>{area.name}</span>
                      <span style={{ fontSize: 10, color: '#555566', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {area.citySlug}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color }}>{area.score}</span>
                      <ChevronRight size={11} style={{ color: '#333344' }} />
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          {inputError && (
            <p style={{ fontSize: 10, color: '#ef4444', marginTop: 8, textAlign: 'center' }}>
              {inputError}
            </p>
          )}
          {/* Hint text */}
          {!query && !inputError && (
            <p style={{ fontSize: 10, color: '#2e2e42', marginTop: 10, textAlign: 'center' }}>
              Try "Kokapet", paste coords like 17.44, 78.38, paste a Google Maps link, or upload a brochure
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-3"
          style={{ maxWidth: 760 }}
        >
          {PAIN_POINTS.map(({ icon: Icon, value, label, desc }) => (
            <div
              key={label}
              className="rounded-2xl p-4 text-left"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(0,230,118,0.10)', border: '1px solid rgba(0,230,118,0.22)' }}
                >
                  <Icon size={14} className="text-[#00e676]" />
                </div>
                <div>
                  <p className="text-lg font-black text-[#e8e8f0]" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>{value}</p>
                  <p className="text-[9px] font-mono uppercase tracking-[0.14em] text-[#00e676]">{label}</p>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-[#657086]" style={{ fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ── City preview chips ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="hidden"
          style={{ maxWidth: 640 }}
        >
          {/* City selector */}
          <div className="mobile-scroll-row flex items-center justify-start sm:justify-center gap-2 mb-4 overflow-x-auto px-1">
            {CITY_LIST.map(city => {
              const active = activeCity === city.slug
              return (
                <button
                  key={city.slug}
                  onClick={() => setActiveCity(city.slug)}
                  className="mobile-tap flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-mono transition-all duration-150"
                  style={{
                    background: active ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)',
                    border: active ? '1px solid rgba(0,230,118,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    color: active ? '#00e676' : '#555566',
                    boxShadow: active ? '0 0 10px rgba(0,230,118,0.15)' : 'none',
                  }}
                >
                  {city.name === 'Delhi NCR' ? 'Delhi' : city.name}
                </button>
              )
            })}
          </div>

          <div className="mobile-scroll-row flex items-center justify-start sm:justify-center gap-2 mb-4 overflow-x-auto px-1">
            {GOAL_OPTIONS.map(goal => {
              const active = goal === recommendationGoal
              return (
                <button
                  key={goal}
                  onClick={() => setRecommendationGoal(goal)}
                  className="mobile-tap flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-mono transition-all duration-150"
                  style={{
                    background: active ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.03)',
                    border: active ? '1px solid rgba(0,230,118,0.35)' : '1px solid rgba(255,255,255,0.07)',
                    color: active ? '#00e676' : '#666680',
                  }}
                >
                  {getRecommendationGoalMeta(goal).shortLabel}
                </button>
              )
            })}
          </div>

          <p
            className="text-center mb-3"
            style={{ fontSize: 10, color: '#444455', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            Best matches in {CITIES[activeCity]?.meta.name} for {goalMeta.label}
          </p>

          {/* Top areas for selected city */}
          <div className="mobile-scroll-row flex items-center justify-start sm:justify-center gap-2 overflow-x-auto px-1">
            {previewAreas.map(({ area, matchScore, reasons }) => {
              const color = getScoreColor(area.score)
              const areaWithCity = { ...area, citySlug: activeCity }
              return (
                <button
                  key={area.slug}
                  onClick={() => goToArea(areaWithCity)}
                  className="mobile-tap flex flex-shrink-0 items-center gap-2 px-3.5 py-2 rounded-full text-[11px] font-mono transition-all"
                  style={{
                    background: `${color}12`,
                    border: `1px solid ${color}28`,
                    color,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}22` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}12` }}
                  title={`${matchScore}/100 match · ${reasons[0]?.value ?? ''}`}
                >
                  <span style={{ fontWeight: 700, color: '#e8e8f0' }}>{matchScore}</span>
                  <span style={{ color: `${color}88` }}>match</span>
                  <span style={{ fontWeight: 700 }}>{area.score}</span>
                  <span style={{ color: `${color}bb` }}>·</span>
                  {area.name}
                </button>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          WHY THIS EXISTS — problem + before/after
      ═══════════════════════════════════════════════ */}
      <section
        className="px-5 py-16"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-3xl mx-auto">

          {/* Problem hook */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-center mb-14"
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: '#ef4444',
                letterSpacing: '0.1em',
              }}
            >
              <AlertTriangle size={10} />
              THE REAL PROBLEM
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 800,
                letterSpacing: '-0.055em',
                lineHeight: 1.2,
                color: 'var(--text-main)',
                maxWidth: 660,
                margin: '0 auto',
              }}
            >
              Land decisions should not depend on guesswork.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: 'var(--text-muted)',
                marginTop: 16,
                maxWidth: 620,
                margin: '14px auto 0',
                lineHeight: 1.7,
                letterSpacing: '-0.01em',
              }}
            >
              Most buyers rely on broker claims, gut feeling, or friend suggestions. PlotDNA brings the missing layer: location data, growth signals, infrastructure context, and risk indicators.
            </p>
          </motion.div>

          {/* Before / Now / Future timeline */}
          <div className="relative">

            {/* Connecting line */}
            <div
              className="absolute top-10 left-0 right-0 hidden md:block"
              style={{ height: 1, background: 'linear-gradient(90deg, rgba(239,68,68,0.3) 0%, rgba(0,230,118,0.4) 50%, rgba(0,180,255,0.3) 100%)' }}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* 10 years ago */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0 }}
                className="relative rounded-2xl p-5"
                style={{
                  ...cardSurface,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-4 relative z-10"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <Clock size={14} style={{ color: '#ef4444' }} />
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#ef4444', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                  10 YEARS AGO
                </p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: 8 }}>
                  Past Context
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
                  Open farmland. Limited access. No strong infrastructure signal.
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    'Sparse satellite density',
                    'Low connectivity',
                    'Few formal registrations',
                    'Early-stage pricing',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#ef444460' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-soft)', lineHeight: 1.45 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Today */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative rounded-2xl p-5"
                style={{
                  ...cardSurface,
                  border: '1px solid rgba(0,230,118,0.28)',
                }}
              >
                {/* "You are here" badge */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-mono"
                  style={{
                    background: 'rgba(0,230,118,0.15)',
                    border: '1px solid rgba(0,230,118,0.4)',
                    color: '#00e676',
                    letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  · TODAY ·
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)' }}
                >
                  <Satellite size={14} style={{ color: '#00e676' }} />
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#00e676', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                  RIGHT NOW
                </p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: 8 }}>
                  Current Signals
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
                  Infrastructure activity, registrations, and nearby development begin changing the area profile.
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    'Road and metro activity nearby',
                    'Higher satellite-visible buildup',
                    'RERA and project movement',
                    'Price momentum visible',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#00e67660' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-soft)', lineHeight: 1.45 }}>{item}</span>
                    </div>
                  ))}
                </div>
                {/* DNA score badge */}
                <div
                  className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}
                >
                  <span style={{ fontSize: 10, color: '#444455' }}>DNA Score</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#00e676', marginLeft: 'auto' }}>82</span>
                  <span style={{ fontSize: 9, color: '#00e676' }}>Good Growth</span>
                </div>
              </motion.div>

              {/* 10 years from now */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="relative rounded-2xl p-5"
                style={{
                  ...cardSurface,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.25)' }}
                >
                  <Building2 size={14} style={{ color: '#00b4ff' }} />
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#00b4ff', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                  5-10 YEAR VIEW
                </p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: 8 }}>
                  Future Outlook
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
                  A forward-looking view based on infrastructure, demand, employment, and growth signals.
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    'Connectivity improvement likely',
                    'Demand corridors expanding',
                    'Entry window may narrow',
                    'Risk depends on execution',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#00b4ff50' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-soft)', lineHeight: 1.45 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>

          {/* Bridge line */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center justify-center gap-3 mt-12"
          >
            <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{
                background: 'rgba(0,230,118,0.07)',
                border: '1px solid rgba(0,230,118,0.2)',
                fontSize: 11,
                color: '#00e676',
              }}
            >
              <span>PlotDNA decodes all of this for any area you search</span>
              <ArrowRight size={11} />
            </div>
            <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
          </motion.div>

        </div>
      </section>

      {/* ── Feature grid ── */}
      <section
        className="px-5 py-14"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.25)' }}
      >
        <div className="max-w-3xl mx-auto">
          <p
            className="text-center mb-8"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00e676', letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            What you get
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  ...cardSurface,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}
                >
                  <Icon size={14} style={{ color: '#00e676' }} />
                </div>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: 8 }}>{title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65, letterSpacing: '-0.01em' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="px-5 py-14"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-2 text-center">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00e676', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Open A City Polygon Map
            </p>
            <h2 className="font-display text-2xl font-black text-[#e8e8f0] sm:text-3xl" style={{ letterSpacing: '-0.04em' }}>
              Choose a city. Then zoom into the exact market.
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#8b95a7]" style={{ fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>
              Start from supported city maps and open locality-level analysis for investment signals, risk, and future growth view.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CITY_LIST.map((city) => {
              const areaCount = CITIES[city.slug]?.areas.length ?? 0
              return (
                <button
                  key={city.slug}
                  onClick={() => openCityMap(city.slug)}
                  className="group rounded-2xl p-4 text-left transition-all"
                  style={{
                    ...cardSurface,
                  }}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl"
                        style={{ background: 'rgba(0,230,118,0.10)', border: '1px solid rgba(0,230,118,0.24)' }}
                      >
                        <Map size={16} className="text-[#00e676]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#f4f7fb]" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>{city.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#657086]" style={{ fontFamily: 'var(--font-body)' }}>{areaCount} supported zones</p>
                      </div>
                    </div>
                    <ChevronRight size={15} className="mt-2 text-[#333344] transition-colors group-hover:text-[#00e676]" />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: 'rgba(0,230,118,0.055)', border: '1px solid rgba(0,230,118,0.13)' }}>
                    <Route size={12} className="text-[#00e676]" />
                    <span className="text-[10px] font-mono text-[#00e676] tracking-[0.04em]">Open polygon map</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 flex flex-col items-center gap-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.04em' }}>
          Ready to analyze a plot?
        </p>
        <div className="flex w-full max-w-sm flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4">
          <button
            onClick={goToMap}
            className="mobile-tap flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #00E676, #00C267)',
              color: '#03130A',
              boxShadow: '0 0 24px rgba(0,230,118,0.22)',
              fontFamily: 'var(--font-body)',
              fontWeight: 800,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 36px rgba(0,230,118,0.5)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(0,230,118,0.35)' }}
          >
            <Map size={14} />
            Open Full Map
          </button>
          <button
            onClick={() => { inputRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="mobile-tap flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#888899' }}
          >
            <Search size={13} />
            Search an Area
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 10, color: '#2e2e42' }}
      >
        <span>PlotDNA · Real Estate Intelligence</span>
        <span>{CITY_LIST.length} cities · {Object.values(CITIES).reduce((n, c) => n + c.areas.length, 0)} micro-markets</span>
      </footer>
      <EmailGateModal
        open={emailGateOpen}
        entitlements={entitlements}
        onClose={() => {
          setEmailGateOpen(false)
          pendingSearchActionRef.current = null
        }}
        onUnlocked={handleEmailUnlocked}
      />
    </div>
    </>
  )
}







