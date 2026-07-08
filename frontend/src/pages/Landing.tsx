import { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, ChevronRight, Navigation, Zap, Map, TrendingUp,
  Shield, Activity, X, Paperclip, Link2, MapPin, IndianRupee, FileSearch,
  CheckCircle2,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { CITIES } from '@/data/cities'
import type { MicroMarket } from '@/types'
import { getScoreColor } from '@/lib/utils'
import { parseCoords, parseMapUrl, isShortMapUrl, isMapUrl, findNearestArea } from '@/lib/plotAnalysis'
import { resolveMapLink, analyzeBrochure, resolveLocation } from '@/lib/api'
import { trackEvent } from '@/lib/analytics'
import { trackUserEvent } from '@/lib/entitlements'
import DnaRoutePreloader from '@/components/ui/DnaRoutePreloader'

const LAST_MAP_STATE_KEY = 'plotdna:last-map-state'

const BUYER_QUESTIONS = [
  { icon: Shield, title: 'Can I lose money here?', desc: 'Spot risk before it is too late.', color: '#fb7185' },
  { icon: TrendingUp, title: 'Is this area growing?', desc: 'See growth signs that matter.', color: '#22c55e' },
  { icon: IndianRupee, title: 'Is the broker price too high?', desc: 'Check fair value with local data.', color: '#f59e0b' },
  { icon: FileSearch, title: 'What should I verify before paying token?', desc: 'Know the must-check list.', color: '#a78bfa' },
]

const JOURNEY_STEPS = [
  { icon: Search, label: 'Check' },
  { icon: Shield, label: 'Verdict' },
  { icon: IndianRupee, label: 'Money' },
  { icon: Map, label: 'Map' },
  { icon: Activity, label: 'Compare' },
  { icon: FileSearch, label: 'Pass' },
]

type SelectedLandInput = {
  source: 'search' | 'google_maps_link' | 'locate_me' | 'drop_pin' | 'brochure'
  rawInput?: string
  lat?: number
  lng?: number
  areaName?: string
  city?: string
  area?: MicroMarket & { citySlug: string }
  isReadyToCheck: boolean
  statusMessage: string
}

export default function Landing() {
  const navigate  = useNavigate()
  const {
    setSelectedArea,
    setSearchCoords,
    setSelectedCitySlug,
  } = useAppStore()

  const [query, setQuery]             = useState('')
  const [focused, setFocused]         = useState(false)
  const [resolving, setResolving]     = useState(false)
  const [brochureLoading, setBrochureLoading] = useState(false)
  const [locating, setLocating]       = useState(false)
  const [inputError, setInputError]   = useState('')
  const [selectedLandInput, setSelectedLandInput] = useState<SelectedLandInput | null>(null)
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
  useEffect(() => {
    trackEvent('landing_viewed', { source: 'landing' })
    void trackUserEvent({ eventType: 'landing_viewed' })
  }, [])

  const parsedCoords  = parseCoords(query)
  const parsedMapUrl  = parseMapUrl(query)
  const shortMapUrl   = isShortMapUrl(query)
  const isUrl         = isMapUrl(query)
  const backendMapUrl = isUrl && !parsedMapUrl

  const results = query.trim() && !parsedCoords && !isUrl
    ? allAreas.filter(a => a.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []
  const showDropdown = focused && (results.length > 0 || parsedCoords !== null || parsedMapUrl !== null || shortMapUrl || backendMapUrl)
  const canCheckLand = selectedLandInput?.isReadyToCheck === true && !resolving && !brochureLoading && !locating

  function goToArea(area: MicroMarket & { citySlug: string }) {
    setSelectedCitySlug(area.citySlug)
    setSelectedArea(area)
    navigate(`/area/${area.slug}`)
  }

  function getCoordPreview(coords: [number, number]) {
    const localAnalysis = findNearestArea(coords[0], coords[1])
    return {
      areaName: localAnalysis.area?.name ?? localAnalysis.displayLabel ?? 'Exact coordinates',
      city: localAnalysis.citySlug ? (CITIES[localAnalysis.citySlug]?.meta.name ?? localAnalysis.citySlug) : activeCityEntry.meta.name,
    }
  }

  function selectAreaForCheck(area: MicroMarket & { citySlug: string }) {
    setSelectedLandInput({
      source: 'search',
      rawInput: area.name,
      areaName: area.name,
      city: CITIES[area.citySlug]?.meta.name ?? area.citySlug,
      area,
      isReadyToCheck: true,
      statusMessage: 'Area selected. Click Check My Land to continue.',
    })
    setQuery(area.name)
    setInputError('')
    setFocused(false)
  }

  function selectCoordsForCheck(
    coords: [number, number],
    source: SelectedLandInput['source'],
    rawInput: string,
    statusMessage: string,
  ) {
    const preview = getCoordPreview(coords)
    setSelectedLandInput({
      source,
      rawInput,
      lat: coords[0],
      lng: coords[1],
      areaName: preview.areaName,
      city: preview.city,
      isReadyToCheck: true,
      statusMessage,
    })
    setQuery(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`)
    setInputError('')
    setFocused(false)
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
    if (!query.trim()) {
      setInputError('Select land first. Search an area, paste a Google Maps link, use Locate Me, or drop a pin.')
      return
    }
    if (parsedCoords) {
      selectCoordsForCheck(parsedCoords, 'search', query.trim(), 'Coordinates found. Click Check My Land to continue.')
      return
    }
    if (parsedMapUrl) {
      selectCoordsForCheck(parsedMapUrl, 'google_maps_link', query.trim(), 'Google Maps location attached. Click Check My Land to decode this area.')
      return
    }
    if (shortMapUrl || backendMapUrl) {
      setResolving(true)
      const result = await resolveMapLink(query.trim())
      setResolving(false)
      if (result.coords) {
        selectCoordsForCheck(result.coords, 'google_maps_link', query.trim(), 'Google Maps location attached. Click Check My Land to decode this area.')
        return
      }
      setInputError(result.detail ?? (
        result.reason === 'backend_unreachable'
          ? 'Map links need backend access to resolve. Raw coordinates still work.'
          : result.reason === 'timeout'
            ? 'Timed out while expanding this short link. Try again in a few seconds or paste the full map URL.'
            : 'Could not extract coordinates from this map link. Try copying the coordinates directly.'
      ))
      return
    }
    if (results.length > 0) { selectAreaForCheck(results[0]); return }
    setInputError('No matching area found. Try a Hyderabad locality, Google Maps link, or coordinates.')
  }

  function handleCheckMyLand() {
    setInputError('')
    if (!selectedLandInput?.isReadyToCheck) {
      setInputError('Select land first. Search, paste link, locate me, or drop a pin.')
      return
    }
    if (selectedLandInput.area) {
      goToArea(selectedLandInput.area)
      return
    }
    if (typeof selectedLandInput.lat === 'number' && typeof selectedLandInput.lng === 'number') {
      goToCoords([selectedLandInput.lat, selectedLandInput.lng])
      return
    }
    setInputError('This selection is not ready yet. Try selecting the area again.')
  }

  async function handleBrochureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBrochureLoading(true)
    setInputError('')
    const result = await analyzeBrochure(file)
    setBrochureLoading(false)
    if (result) {
      selectCoordsForCheck(
        [result.lat, result.lng],
        'brochure',
        file.name,
        'Brochure location found. Click Check My Land to continue.',
      )
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
        selectCoordsForCheck(coords, 'locate_me', 'Current location', 'Location found. Click Check My Land to continue.')
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
    setSelectedCitySlug('hyderabad')
    setSelectedArea(null)
    setSearchCoords(null)
    try {
      window.localStorage.removeItem(LAST_MAP_STATE_KEY)
    } catch {
      // map still opens normally if storage is unavailable
    }
    navigate('/map')
  }

  const activeCityEntry = CITIES.hyderabad

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
          Hyderabad flagship {" \u00B7 "}{activeCityEntry.meta.name}
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
          <span style={{ color: '#10b981' }}>before you pay token.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 680, marginTop: 22, lineHeight: 1.7, letterSpacing: '-0.01em' }}
        >
          Check money risk, possible gain, broker price, and what to verify before you visit the site or pay an advance. PlotDNA is buyer-side screening, not legal or title approval.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.22 }}
          className="mt-4 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-sans font-bold uppercase tracking-[0.12em] text-emerald-300"
        >
          Don't buy on broker claims. Buy with PlotDNA.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
          className="relative w-full mt-10"
          style={{ maxWidth: 680 }}
        >
          <div
            aria-label="PlotDNA location search"
            className="rounded-[28px] p-2"
            style={{
              background: focused
                ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(56,189,248,0.08) 46%, rgba(15,23,42,0.92))'
                : 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(2,6,23,0.96))',
              border: `1px solid ${focused ? 'rgba(16, 185, 129, 0.48)' : 'rgba(148, 163, 184, 0.16)'}`,
              boxShadow: focused
                ? '0 0 0 1px rgba(16,185,129,0.18), 0 22px 70px rgba(0, 0, 0, 0.58), 0 0 42px rgba(16,185,129,0.13)'
                : '0 18px 54px rgba(0, 0, 0, 0.42)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
              <div
                className="grid min-h-[58px] grid-cols-[44px_1fr] items-center rounded-[22px] px-3"
                style={{
                  background: 'rgba(2,6,23,0.62)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.04]">
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
                      style={{ color: focused ? '#10b981' : '#64748b', transition: 'color 0.2s', flexShrink: 0 }}
                    />
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search area, paste Google Maps link, or enter coordinates"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setInputError(''); setSelectedLandInput(null) }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 160)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEnter() }}
                    className="min-w-0 flex-1 bg-transparent text-[14px] text-slate-100 outline-none placeholder:text-slate-500 sm:text-[15px]"
                  />
                  {query && (
                    <button
                      onClick={() => { setQuery(''); setInputError(''); setSelectedLandInput(null); inputRef.current?.focus() }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-200"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
                onChange={handleBrochureUpload}
              />
              <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                title="Upload a property brochure (PDF or image)"
                onClick={() => fileInputRef.current?.click()}
                disabled={brochureLoading || locating}
                className="flex min-h-[48px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-slate-400 transition-all hover:bg-white/[0.07] hover:text-slate-200 disabled:opacity-50 sm:w-12"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: brochureLoading ? '#10b981' : '#94a3b8',
                  opacity: brochureLoading || locating ? 0.5 : 1,
                }}
              >
                <Paperclip size={14} />
              </button>

              <button
                title="Allow location permission and prepare your current coordinates"
                onClick={handleLocateMe}
                disabled={resolving || brochureLoading || locating}
                className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-[11px] font-sans font-bold text-slate-300 transition-all hover:bg-white/[0.07] disabled:opacity-55"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: locating ? '#10b981' : '#cbd5e1',
                  flexShrink: 0,
                  opacity: resolving || brochureLoading || locating ? 0.55 : 1,
                  fontWeight: 700,
                }}
              >
                <Navigation size={12} />
                {locating ? 'Locating...' : 'Locate me'}
              </button>

              <button
                title="Drop a pin on the map"
                onClick={goToMap}
                disabled={resolving || brochureLoading || locating}
                className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-[11px] font-sans font-bold text-slate-300 transition-all hover:bg-white/[0.07] disabled:opacity-55"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: '#cbd5e1',
                  flexShrink: 0,
                  opacity: resolving || brochureLoading || locating ? 0.55 : 1,
                  fontWeight: 700,
                }}
              >
                <MapPin size={12} />
                Drop Pin
              </button>

              <button
                onClick={handleEnter}
                disabled={resolving || brochureLoading || locating}
                className="col-span-2 flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 px-5 text-[12px] font-sans font-black text-[#041e15] transition-all hover:bg-emerald-400 disabled:opacity-50 sm:col-span-1"
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
                {resolving ? 'Reading link...' : brochureLoading ? 'Reading...' : 'Search Area'}
                <ChevronRight size={12} />
              </button>
              </div>
            </div>

            <AnimatePresence>
              {selectedLandInput && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="mt-3 rounded-[22px] p-4 text-left"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(14,165,233,0.06))',
                    border: '1px solid rgba(45, 212, 191, 0.28)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                      <MapPin size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-sans font-bold uppercase tracking-[0.14em] text-emerald-300">
                          Selected location
                        </p>
                        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-sans font-bold text-emerald-200">
                          Ready to check
                        </span>
                      </div>
                      <p className="mt-2 truncate font-display text-lg font-black text-slate-50">
                        {selectedLandInput.areaName ?? 'Exact land point'}
                      </p>
                      <div className="mt-2 grid gap-1 text-[12px] leading-5 text-slate-400 sm:grid-cols-2">
                        <span>Source: {selectedLandInput.source.replaceAll('_', ' ')}</span>
                        <span>City: {selectedLandInput.city ?? activeCityEntry.meta.name}</span>
                        {typeof selectedLandInput.lat === 'number' && typeof selectedLandInput.lng === 'number' && (
                          <>
                            <span>Lat: {selectedLandInput.lat.toFixed(5)}</span>
                            <span>Lng: {selectedLandInput.lng.toFixed(5)}</span>
                          </>
                        )}
                      </div>
                      <p className="mt-2 text-[12px] font-sans font-semibold text-emerald-200">
                        {selectedLandInput.statusMessage}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleCheckMyLand}
              disabled={!canCheckLand}
              className="mt-3 flex min-h-[58px] w-full items-center justify-center gap-3 rounded-[22px] px-5 text-[16px] font-sans font-black transition-all disabled:cursor-not-allowed"
              style={{
                background: canCheckLand
                  ? 'linear-gradient(135deg, #2dd4bf, #22d3ee)'
                  : 'rgba(148, 163, 184, 0.12)',
                border: canCheckLand ? '1px solid rgba(45,212,191,0.55)' : '1px solid rgba(148,163,184,0.16)',
                color: canCheckLand ? '#021617' : '#64748b',
                boxShadow: canCheckLand ? '0 18px 42px rgba(34,211,238,0.18)' : 'none',
              }}
            >
              <CheckCircle2 size={18} />
              Check My Land
              <ChevronRight size={18} />
            </button>
          </div>

          <p className="mt-3 px-2 text-xs leading-5 text-slate-500">
            Buyer screening only. Verify title, RERA, zoning, approvals, access, and latest pricing before paying token.
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
                      onMouseDown={() => selectCoordsForCheck(
                        coords,
                        parsedMapUrl ? 'google_maps_link' : 'search',
                        query.trim(),
                        parsedMapUrl
                          ? 'Google Maps location attached. Click Check My Land to decode this area.'
                          : 'Coordinates found. Click Check My Land to continue.',
                      )}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors cursor-pointer"
                      style={{ borderBottom: results.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      {parsedMapUrl ? <Link2 size={13} style={{ color: '#10b981', flexShrink: 0 }} /> : <Navigation size={13} style={{ color: '#10b981', flexShrink: 0 }} />}
                      <div className="flex-1">
                        <span style={{ fontSize: 12, color: '#10b981' }}>Use this location</span>
                        <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                          <span className="font-mono">{coords[0].toFixed(4)}°N  {coords[1].toFixed(4)}°E</span>{" \u00B7 "}money risk + buyer verdict
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
                        Extract coordinates, then enable Check My Land
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
                      onMouseDown={() => selectAreaForCheck(areaWithCity)}
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.32 }}
          className="mt-10 w-full text-left"
          style={{ maxWidth: 860 }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <Zap size={15} />
            </div>
            <p className="font-display text-[22px] font-black text-slate-50">
              Why buyers use PlotDNA
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BUYER_QUESTIONS.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(145deg, rgba(15,23,42,0.88), rgba(8,13,28,0.96))',
                  border: '1px solid rgba(148,163,184,0.16)',
                }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
                  style={{
                    background: `${color}18`,
                    border: `1px solid ${color}55`,
                    color,
                  }}
                >
                  <Icon size={18} />
                </div>
                <p className="font-display text-[16px] font-black leading-snug text-slate-50">{title}</p>
                <p className="mt-2 text-[12px] leading-5 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-6 gap-2 rounded-[24px] border border-white/10 bg-slate-950/70 p-2">
            {JOURNEY_STEPS.map(({ icon: Icon, label }, index) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-center"
                style={{
                  background: index === 0 ? 'rgba(45,212,191,0.12)' : 'transparent',
                  color: index === 0 ? '#2dd4bf' : '#94a3b8',
                }}
              >
                <Icon size={17} />
                <span className="text-[10px] font-sans font-bold">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </section>

    </div>
    </>
  )
}
