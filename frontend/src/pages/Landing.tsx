import { useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, ChevronRight, Navigation, Zap, Map, TrendingUp,
  Shield, Activity, X, Clock, Satellite, Building2, AlertTriangle,
  ArrowRight, Paperclip, Link2,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { CITY_LIST, CITIES } from '@/data/cities'
import type { MicroMarket, RecommendationGoal } from '@/types'
import { getScoreColor } from '@/lib/utils'
import { parseCoords, parseMapUrl, isShortMapUrl, isMapUrl, findNearestArea } from '@/lib/plotAnalysis'
import { resolveMapLink, analyzeBrochure, resolveLocation } from '@/lib/api'
import { getGoalTopAreas, getRecommendationGoalMeta } from '@/lib/recommendations'
import { getCityProductionProfile } from '@/lib/cityProduction'
import { trackEvent } from '@/lib/analytics'
import DnaRoutePreloader from '@/components/ui/DnaRoutePreloader'

const FEATURE_CARDS = [
  {
    icon: Activity,
    title: 'Coordinate-level context',
    desc: 'Analyze a location using infrastructure, RERA, satellite, price, and growth signals.',
  },
  {
    icon: Map,
    title: 'City polygon maps',
    desc: 'Open supported city maps and inspect locality-level market boundaries.',
  },
  {
    icon: TrendingUp,
    title: 'Past, present, future view',
    desc: 'Understand what changed, what matters now, and where the area may be heading.',
  },
  {
    icon: Shield,
    title: 'Due diligence starter',
    desc: 'Quickly classify locations into Good Growth, Moderate, Watchlist, or High Risk.',
  },
]

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
  const [resolving, setResolving]     = useState(false)
  const [brochureLoading, setBrochureLoading] = useState(false)
  const [locating, setLocating]       = useState(false)
  const [inputError, setInputError]   = useState('')
  const [dnaLoading, setDnaLoading]   = useState(false)
  const [dnaLoaderRunId, setDnaLoaderRunId] = useState(0)
  const inputRef      = useRef<HTMLInputElement>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const pendingNavRef = useRef<(() => void) | null>(null)

  function goToCoordWithLoader(navFn: () => void) {
    pendingNavRef.current = navFn
    setDnaLoaderRunId(id => id + 1)
    setDnaLoading(true)
  }

  const handleDnaLoaderComplete = useCallback(() => {
    setDnaLoading(false)
    const pendingNav = pendingNavRef.current
    pendingNavRef.current = null
    pendingNav?.()
  }, [])

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

  function goToCoords(coords: [number, number]) {
    const localAnalysis = findNearestArea(coords[0], coords[1])
    goToCoordWithLoader(() => {
      if (localAnalysis.citySlug) setSelectedCitySlug(localAnalysis.citySlug)
      setSearchCoords(coords)
      setSelectedArea(localAnalysis.shouldSelectArea ? localAnalysis.area : null)
      navigate('/map')
    })

    resolveLocation(coords[0], coords[1]).then(res => {
      if (res) {
        if (res.tier === 'regional') {
          pendingNavRef.current = () => {
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
          }
        } else {
          const backendAnalysis = findNearestArea(coords[0], coords[1], {}, res)
          pendingNavRef.current = () => {
            if (backendAnalysis.citySlug) setSelectedCitySlug(backendAnalysis.citySlug)
            setSearchCoords(coords)
            setSelectedArea(backendAnalysis.shouldSelectArea ? backendAnalysis.area : null)
            navigate('/map')
          }
        }
      }
    }).catch(() => {})
  }

  async function handleEnter() {
    setInputError('')
    if (parsedCoords) { goToCoords(parsedCoords); return }
    if (parsedMapUrl) { goToCoords(parsedMapUrl); return }
    if (shortMapUrl || backendMapUrl) {
      setResolving(true)
      const result = await resolveMapLink(query.trim())
      setResolving(false)
      if (result.coords) { goToCoords(result.coords); return }
      setInputError(result.detail ?? (
        result.reason === 'backend_unreachable'
          ? 'Map links need backend access to resolve. Raw coordinates still work.'
          : result.reason === 'timeout'
            ? 'Timed out while expanding this short link. Try again in a few seconds or paste the full map URL.'
            : 'Could not extract coordinates from this map link. Try copying the coordinates directly.'
      ))
      return
    }
    if (results.length > 0) { goToArea(results[0]); return }
  }

  async function handleBrochureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBrochureLoading(true)
    setInputError('')
    const result = await analyzeBrochure(file)
    setBrochureLoading(false)
    if (result) {
      goToCoords([result.lat, result.lng])
    } else {
      setInputError('Could not extract location from this file. Try a clearer image or paste the address.')
    }
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
        goToCoords(coords)
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
        setInputError('Location request timed out. Try again or enter latitude and longitude manually.')
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 60_000,
      },
    )
  }

  function goToMap() {
    setSelectedCitySlug(activeCity)
    navigate('/map')
  }

  const activeCityEntry = CITIES[activeCity] ?? CITIES.hyderabad
  const activeCityProfile = getCityProductionProfile(activeCityEntry.meta, activeCityEntry.areas)
  const previewAreas = getGoalTopAreas(activeCityEntry.areas, recommendationGoal, 5)
  const goalMeta = getRecommendationGoalMeta(recommendationGoal)
  const showSignalPreview = activeCity === 'hyderabad'
  const GOAL_OPTIONS: RecommendationGoal[] = ['balanced', 'growth', 'affordable', 'defensive', 'livable']

  return (
    <>
    <DnaRoutePreloader key={dnaLoaderRunId} active={dnaLoading} onComplete={handleDnaLoaderComplete} />

    <div
      className="min-h-screen w-full flex flex-col font-sans"
      style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}
    >
      <nav className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <img
            src="/plotdna-logo.png"
            alt="PlotDNA"
            className="w-8 h-8 rounded-xl object-cover"
            style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
          />
          <span className="font-display" style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>PlotDNA</span>
          <span
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-sans"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontWeight: 600 }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#10b981]"
              style={{ boxShadow: '0 0 4px #10b981', animation: 'pulse 2s infinite' }}
            />
            Hyderabad live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              trackEvent('landing_investment_cta_clicked', { destination: 'compare', citySlug: 'hyderabad' })
              navigate('/compare')
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] transition-all cursor-pointer font-sans"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              fontWeight: 600,
              letterSpacing: '0.01em',
            }}
          >
            <TrendingUp size={12} />
            Compare
          </button>
          <button
            onClick={goToMap}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] transition-all cursor-pointer font-sans"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981',
              fontWeight: 600,
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.18)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.1)' }}
          >
            <Map size={12} />
            Open Map
          </button>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center px-5 pt-16 pb-10 text-center">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 font-sans"
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.18)',
            fontWeight: 600,
            fontSize: 10,
            color: '#10b981',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <Zap size={10} />
          {activeCityProfile.isFlagship ? activeCityProfile.label : 'Investment screening intelligence'}{" \u00B7 "}{activeCityEntry.meta.name}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="font-display"
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 1.08,
            maxWidth: 780,
            color: 'var(--text-main)',
          }}
        >
          Know if the plot is worth buying
          <br />
          <span style={{ color: '#10b981' }}>before you commit capital.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 680, marginTop: 22, lineHeight: 1.7, letterSpacing: '-0.01em' }}
        >
          Hyderabad land intelligence that helps you compare micro-markets, understand growth signals, and prepare the right verification checklist before you talk to brokers. PlotDNA is buyer-side screening, not a replacement for legal or title diligence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
          className="relative w-full mt-12"
          style={{ maxWidth: 680 }}
        >
          <div
            className="glass-panel"
            style={{
              border: `1px solid ${focused ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: showDropdown ? '20px 20px 0 0' : 20,
              boxShadow: focused
                ? '0 0 20px 0 rgba(16, 185, 129, 0.15), 0 12px 40px rgba(0, 0, 0, 0.5)'
                : '0 8px 32px rgba(0, 0, 0, 0.35)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div className="flex flex-wrap items-center px-5 py-4 gap-3 sm:flex-nowrap sm:px-6 sm:py-5">
              {resolving || brochureLoading || locating ? (
                <Activity
                  size={16}
                  style={{ color: '#10b981', flexShrink: 0, animation: 'spin 1s linear infinite' }}
                />
              ) : isUrl ? (
                <Link2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              ) : (
                <Search
                  size={16}
                  style={{ color: focused ? '#10b981' : '#444455', transition: 'color 0.2s', flexShrink: 0 }}
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
                  flex: 1,
                  minWidth: 180,
                  background: 'transparent',
                  color: '#e8e8f0',
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

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
                onChange={handleBrochureUpload}
              />
              <button
                title="Upload a property brochure (PDF or image)"
                onClick={() => fileInputRef.current?.click()}
                disabled={brochureLoading || locating}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all flex-shrink-0 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: brochureLoading ? '#10b981' : '#444455',
                  opacity: brochureLoading || locating ? 0.5 : 1,
                }}
              >
                <Paperclip size={12} />
              </button>

              <button
                title="Allow location permission and analyze your current coordinates"
                onClick={handleLocateMe}
                disabled={resolving || brochureLoading || locating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] transition-all cursor-pointer font-sans"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: locating ? '#10b981' : 'var(--text-muted)',
                  flexShrink: 0,
                  opacity: resolving || brochureLoading || locating ? 0.55 : 1,
                  fontWeight: 700,
                }}
              >
                <Navigation size={11} />
                {locating ? 'Locating...' : 'Locate me'}
              </button>

              <button
                onClick={handleEnter}
                disabled={resolving || brochureLoading || locating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-all cursor-pointer font-sans"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#041e15',
                  flexShrink: 0,
                  opacity: resolving || brochureLoading || locating ? 0.5 : 1,
                  fontWeight: 700,
                  boxShadow: '0 0 24px rgba(16, 185, 129, 0.25)',
                }}
              >
                {resolving ? 'Resolving…' : brochureLoading ? 'Reading…' : 'Analyze'}
                <ChevronRight size={11} />
              </button>
            </div>
          </div>

          <p className="mt-3 px-2 text-xs leading-5 text-slate-500">
            Buyer screening only. Verify title, RERA, zoning, approvals, access, and latest pricing independently before committing capital.
          </p>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 right-0 top-full z-50 overflow-hidden"
                style={{
                  background: 'rgba(6, 6, 16, 0.95)',
                  backdropFilter: 'blur(24px)',
                  borderLeft: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRight: '1px solid rgba(16, 185, 129, 0.25)',
                  borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '0 0 16px 16px',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.7)',
                }}
              >
                {(parsedCoords || parsedMapUrl) && (() => {
                  const coords = parsedCoords ?? parsedMapUrl!
                  return (
                    <button
                      onMouseDown={() => goToCoords(coords)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors cursor-pointer"
                      style={{ borderBottom: results.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      {parsedMapUrl ? <Link2 size={13} style={{ color: '#10b981', flexShrink: 0 }} /> : <Navigation size={13} style={{ color: '#10b981', flexShrink: 0 }} />}
                      <div className="flex-1">
                        <span style={{ fontSize: 12, color: '#10b981' }}>Analyze this location</span>
                        <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                          <span className="font-mono">{coords[0].toFixed(4)}°N  {coords[1].toFixed(4)}°E</span>{" \u00B7 "}DNA score + growth story
                        </p>
                      </div>
                      <ChevronRight size={12} style={{ color: '#10b981' }} />
                    </button>
                  )
                })()}

                {(shortMapUrl || backendMapUrl) && (
                  <button
                    onMouseDown={handleEnter}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors cursor-pointer"
                    style={{ borderBottom: results.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                  >
                    <Link2 size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div className="flex-1">
                      <span style={{ fontSize: 12, color: '#10b981' }}>Resolve map link</span>
                      <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                        Extract coordinates and analyze location
                      </p>
                    </div>
                    <ChevronRight size={12} style={{ color: '#10b981' }} />
                  </button>
                )}

                {results.map((area, i) => {
                  const color = getScoreColor(area.score)
                  const areaWithCity = { ...area, citySlug: area.citySlug }
                  return (
                    <button
                      key={area.slug}
                      onMouseDown={() => goToArea(areaWithCity)}
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
                      <span className="font-display" style={{ fontSize: 13, fontWeight: 700, color }}>{area.score}</span>
                      <ChevronRight size={11} style={{ color: '#333344' }} />
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {inputError && (
            <p style={{ fontSize: 10, color: '#ef4444', marginTop: 8, textAlign: 'center' }}>
              {inputError}
            </p>
          )}
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
          className="mt-10 w-full"
          style={{ maxWidth: 640 }}
        >
          <div className="mb-6">
            <p
              className="font-display"
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'var(--text-main)',
              }}
            >
              Hyderabad is live for release. More cities are next.
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                letterSpacing: '-0.01em',
                maxWidth: 560,
                margin: '8px auto 0',
              }}
            >
              Use Hyderabad now for buyer-side micro-market screening. Other city rollouts are coming soon and are shown here so users understand the expansion roadmap.
            </p>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-2 mb-4">
            {CITY_LIST.map(city => {
              const active = activeCity === city.slug
              const isLaunchCity = city.slug === 'hyderabad'
              return (
                <button
                  key={city.slug}
                  onClick={() => setActiveCity(city.slug)}
                  className="px-4 py-2 rounded-full text-[11px] transition-all duration-300 cursor-pointer font-sans"
                  style={{
                    background: active
                      ? isLaunchCity ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.10)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: active
                      ? isLaunchCity ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.22)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    color: active ? isLaunchCity ? '#10b981' : '#cbd5e1' : '#94a3b8',
                    backdropFilter: 'blur(8px)',
                    boxShadow: active && isLaunchCity ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
                    fontWeight: 600,
                  }}
                >
                  {city.name === 'Delhi NCR' ? 'Delhi' : city.name}
                  {isLaunchCity ? (
                    <span style={{ marginLeft: 6, color: active ? '#a7f3d0' : '#10b981' }}>Flagship</span>
                  ) : (
                    <span style={{ marginLeft: 6, color: active ? '#cbd5e1' : '#64748b' }}>Coming soon</span>
                  )}
                </button>
              )
            })}
          </div>

          {showSignalPreview ? (
            <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              ['Covered', activeCityProfile.totalLocalities],
              ['Verified', activeCityProfile.verifiedCount],
              ['Project zones', activeCityProfile.activeProjectCount],
              ['Priority target', activeCityProfile.priorityTarget],
            ].map(([metric, value]) => (
              <div
                key={metric}
                className="rounded-xl px-3 py-2"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p className="font-display" style={{ fontSize: 17, fontWeight: 800, color: '#e8e8f0' }}>{value}</p>
                <p style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{metric}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center flex-wrap gap-2 mb-4">
            {GOAL_OPTIONS.map(goal => {
              const active = goal === recommendationGoal
              return (
                <button
                  key={goal}
                  onClick={() => setRecommendationGoal(goal)}
                  className="px-3.5 py-1.5 rounded-full text-[11px] transition-all duration-300 cursor-pointer font-sans"
                  style={{
                    background: active ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: active ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                    color: active ? '#3b82f6' : '#64748b',
                    fontWeight: 500,
                  }}
                >
                  {getRecommendationGoalMeta(goal).shortLabel}
                </button>
              )
            })}
          </div>

          <p
            className="text-center mb-3 font-sans"
            style={{ fontSize: 10, color: 'var(--text-soft)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            Best matches in {CITIES[activeCity]?.meta.name} for {goalMeta.label}
          </p>

          <div className="flex items-center justify-center flex-wrap gap-2">
            {previewAreas.map(({ area, matchScore, reasons }) => {
              const color = getScoreColor(area.score)
              const areaWithCity = { ...area, citySlug: activeCity }
              return (
                <button
                  key={area.slug}
                  onClick={() => goToArea(areaWithCity)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] transition-all duration-300 cursor-pointer font-sans"
                  style={{
                    background: `${color}10`,
                    border: `1px solid ${color}20`,
                    color,
                    backdropFilter: 'blur(4px)',
                    fontWeight: 500,
                  }}
                  onMouseEnter={e => { 
                    (e.currentTarget as HTMLButtonElement).style.background = `${color}20`;
                    (e.currentTarget as HTMLButtonElement).style.transform = `scale(1.03)`;
                  }}
                  onMouseLeave={e => { 
                    (e.currentTarget as HTMLButtonElement).style.background = `${color}10`;
                    (e.currentTarget as HTMLButtonElement).style.transform = `scale(1)`;
                  }}
                  title={`${matchScore}/100 match \u00B7 ${reasons[0]?.value ?? ''}`}
                >
                  <span className="font-display" style={{ fontWeight: 700, color: '#e8e8f0' }}>{matchScore}</span>
                  <span style={{ color: `${color}88` }}>match</span>
                  <span className="font-display" style={{ fontWeight: 700 }}>{area.score}</span>
                  <span style={{ color: `${color}bb` }}>{"\u00B7"}</span>
                  {area.name}
                </button>
              )
            })}
          </div>
            </>
          ) : (
            <div
              className="mx-auto rounded-2xl px-5 py-5 text-left"
              style={{
                maxWidth: 560,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p
                className="font-display"
                style={{ fontSize: 18, fontWeight: 800, color: '#e8e8f0', letterSpacing: '-0.035em' }}
              >
                {activeCityEntry.meta.name} is coming soon.
              </p>
              <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.65, color: 'var(--text-muted)' }}>
                We are keeping the first public release focused on Hyderabad so the score, report, and verification workflow stay clear. {activeCityEntry.meta.name} will open after its source deck, locality confidence, and buyer checklist reach release quality.
              </p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  ['Status', 'Roadmap'],
                  ['Access', 'Waitlist'],
                  ['Reports', 'Not live'],
                ].map(([metric, value]) => (
                  <div
                    key={metric}
                    className="rounded-xl px-3 py-2"
                    style={{
                      background: 'rgba(15, 23, 42, 0.55)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <p className="font-display" style={{ fontSize: 15, fontWeight: 800, color: '#cbd5e1' }}>{value}</p>
                    <p style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{metric}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveCity('hyderabad')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] transition-all cursor-pointer font-sans"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#10b981',
                  fontWeight: 700,
                }}
              >
                View live Hyderabad market
                <ArrowRight size={12} />
              </button>
            </div>
          )}
        </motion.div>
      </section>

      <section
        className="px-5 py-16"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-3xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-center mb-14"
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5 font-sans"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.18)',
                fontWeight: 600,
                fontSize: 10,
                color: '#ef4444',
                letterSpacing: '0.05em',
              }}
            >
              <AlertTriangle size={10} />
              THE REAL PROBLEM
            </div>
            <h2
              className="font-display"
              style={{
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

          <div className="relative">

            <div
              className="absolute top-10 left-0 right-0 hidden md:block"
              style={{ height: 1, background: 'linear-gradient(90deg, rgba(239,68,68,0.3) 0%, rgba(0,230,118,0.4) 50%, rgba(0,180,255,0.3) 100%)' }}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0 }}
                className="glass-panel glass-panel-hover relative rounded-2xl p-5"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-4 relative z-10"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <Clock size={14} style={{ color: '#ef4444' }} />
                </div>
                <p style={{ fontWeight: 600, fontSize: 9, color: '#ef4444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  10 YEARS AGO
                </p>
                <p className="font-display" style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: 8 }}>
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

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="glass-panel glass-panel-hover relative rounded-2xl p-5"
                style={{
                  borderColor: 'rgba(16, 185, 129, 0.35)',
                  boxShadow: '0 12px 40px rgba(16, 185, 129, 0.08)',
                }}
              >
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[9px] font-sans"
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {"\u00B7"} TODAY {"\u00B7"}
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                >
                  <Satellite size={14} style={{ color: '#10b981' }} />
                </div>
                <p style={{ fontWeight: 600, fontSize: 9, color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  RIGHT NOW
                </p>
                <p className="font-display" style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: 8 }}>
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
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#10b98160' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-soft)', lineHeight: 1.45 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-4 flex items-center gap-2 px-3.5 py-2 rounded-xl"
                  style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                >
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>DNA Score</span>
                  <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginLeft: 'auto' }}>82</span>
                  <span style={{ fontSize: 9, color: '#10b981', fontWeight: 600 }}>Good Growth</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="glass-panel glass-panel-hover relative rounded-2xl p-5"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)' }}
                >
                  <Building2 size={14} style={{ color: '#3b82f6' }} />
                </div>
                <p style={{ fontWeight: 600, fontSize: 9, color: '#3b82f6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  5-10 YEAR VIEW
                </p>
                <p className="font-display" style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: 8 }}>
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
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#3b82f650' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-soft)', lineHeight: 1.45 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center justify-center gap-3 mt-12"
          >
            <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans"
              style={{
                background: 'rgba(16, 185, 129, 0.07)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: 11,
                color: '#10b981',
              }}
            >
              <span>PlotDNA decodes all of this for any area you search</span>
              <ArrowRight size={11} />
            </div>
            <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
          </motion.div>

        </div>
      </section>

      <section
        className="px-5 py-14"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.25)' }}
      >
        <div className="max-w-3xl mx-auto">
          <p
            className="text-center mb-8 font-sans"
            style={{ fontWeight: 600, fontSize: 11, color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            What you get
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURE_CARDS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass-panel glass-panel-hover rounded-2xl p-5"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.18)' }}
                >
                  <Icon size={14} style={{ color: '#10b981' }} />
                </div>
                <p className="font-display" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: 8 }}>{title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65, letterSpacing: '-0.01em' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 flex flex-col items-center gap-5 font-sans" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.04em' }}>
          Ready to analyze a plot?
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={goToMap}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer font-sans"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#041e15',
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.25)',
              fontWeight: 800,
            }}
          >
            <Map size={13} />
            Open Interactive Map
          </button>
          <button
            onClick={() => { inputRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] transition-all cursor-pointer font-sans"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            Search Location
          </button>
        </div>
      </section>
    </div>
    </>
  )
}
