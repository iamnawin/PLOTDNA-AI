import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, ChevronRight, Navigation, Zap, Map, TrendingUp,
  Shield, Activity, X, Link2, MapPin, IndianRupee, FileSearch, LoaderCircle,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { CITIES } from '@/data/cities'
import type { MicroMarket } from '@/types'
import { getScoreColor } from '@/lib/utils'
import { parseCoords, parseMapUrl, isShortMapUrl, isMapUrl, findNearestArea } from '@/lib/plotAnalysis'
import { resolveMapLink, resolveLocation } from '@/lib/api'
import { trackEvent } from '@/lib/analytics'
import { trackUserEvent } from '@/lib/entitlements'
import { buildAreaStoryPath } from '@/features/areaStory/areaStoryNav'

const LAST_MAP_STATE_KEY = 'plotdna:last-map-state'

const BUYER_QUESTIONS = [
  { icon: Shield, title: 'Can I lose money here?', desc: 'Spot risk before it is too late.', color: '#fb7185' },
  { icon: TrendingUp, title: 'Is this area growing?', desc: 'See growth signs that matter.', color: '#22c55e' },
  { icon: IndianRupee, title: 'Is the broker price too high?', desc: 'Check fair value with local data.', color: '#f59e0b' },
  { icon: FileSearch, title: 'What should I verify before paying token?', desc: 'Know the must-check list.', color: '#a78bfa' },
]

type SelectedLandInput = {
  source: 'search' | 'google_maps_link' | 'locate_me' | 'drop_pin'
  rawInput?: string
  lat?: number
  lng?: number
  areaName?: string
  city?: string
  area?: MicroMarket & { citySlug: string }
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
  const [locating, setLocating]       = useState(false)
  const [inputError, setInputError]   = useState('')
  const [selectedLandInput, setSelectedLandInput] = useState<SelectedLandInput | null>(null)
  const [isOpeningArea, setIsOpeningArea] = useState(false)
  const inputRef      = useRef<HTMLInputElement>(null)

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
  function selectArea(area: MicroMarket & { citySlug: string }) {
    setSelectedLandInput({ source: 'search', rawInput: area.name, areaName: area.name, city: CITIES[area.citySlug]?.meta.name ?? area.citySlug, area })
    setQuery(area.name)
    setInputError('')
    setFocused(false)
  }

  function selectCoords(coords: [number, number], source: SelectedLandInput['source'], rawInput?: string) {
    const preview = findNearestArea(coords[0], coords[1])
    setSelectedLandInput({
      source,
      rawInput,
      lat: coords[0],
      lng: coords[1],
      areaName: preview.area?.name ?? preview.displayLabel ?? 'Exact coordinates',
      city: preview.citySlug ? (CITIES[preview.citySlug]?.meta.name ?? preview.citySlug) : CITIES.hyderabad.meta.name,
    })
    setQuery(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`)
    setInputError('')
    setFocused(false)
  }

  function openArea(area: MicroMarket & { citySlug: string }) {
    setSelectedCitySlug(area.citySlug)
    setSelectedArea(area)
    navigate(buildAreaStoryPath(area.slug, 'verdict'))
  }

  async function openCoords(coords: [number, number]) {
    // Resolve against the backend first — it has the full district/cluster/context
    // dataset. The local `findNearestArea` fallback is bundled static data only and
    // can pick the wrong nearest area near coverage edges. Previously the loader's
    // fixed animation timer fired navigation before this network call could return,
    // so the more accurate backend result was silently dropped. Now navigation
    // always waits for whichever result actually lands.
    const res = await resolveLocation(coords[0], coords[1]).catch(() => null)
        if (res && res.tier === 'regional') {
          const districtSlug = res.districtSlug || 'warangal'
          navigate(buildAreaStoryPath(districtSlug, 'verdict'), {
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
          return
        }
        const analysis = findNearestArea(coords[0], coords[1], {}, res)
        if (analysis.citySlug) setSelectedCitySlug(analysis.citySlug)
        setSearchCoords(coords)
        setSelectedArea(analysis.shouldSelectArea ? analysis.area : null)
        if (analysis.area) {
          const params = new URLSearchParams({
            fromLat: coords[0].toFixed(6),
            fromLng: coords[1].toFixed(6),
            fromCity: analysis.citySlug ?? 'hyderabad',
            fromLabel: analysis.displayLabel,
            fromTier: analysis.tier,
            fromPrecision: analysis.precisionLabel,
          })
          navigate(`${buildAreaStoryPath(analysis.area.slug, 'verdict')}?${params.toString()}`, {
            state: {
              fallbackContext: {
                tier: analysis.tier,
                displayLabel: analysis.displayLabel,
                precisionLabel: analysis.precisionLabel,
                coords,
              },
            },
          })
          return
        }
        navigate('/map')
  }

  async function handleOpenArea() {
    if (isOpeningArea || !selectedLandInput) return
    setInputError('')
    setIsOpeningArea(true)
    try {
      if (selectedLandInput.area) {
        openArea(selectedLandInput.area)
        return
      }
      if (typeof selectedLandInput.lat === 'number' && typeof selectedLandInput.lng === 'number') {
        await openCoords([selectedLandInput.lat, selectedLandInput.lng])
        return
      }
      throw new Error('Selection is missing coordinates')
    } catch {
      setInputError('Could not open this area right now. Try again.')
      setIsOpeningArea(false)
    }
  }

  async function handleEnter() {
    setInputError('')
    if (!query.trim()) {
      setInputError('Select land first. Search an area, paste a Google Maps link, use Locate Me, or drop a pin.')
      return
    }
    if (parsedCoords) {
      selectCoords(parsedCoords, 'search', query.trim())
      return
    }
    if (parsedMapUrl) {
      selectCoords(parsedMapUrl, 'google_maps_link', query.trim())
      return
    }
    if (shortMapUrl || backendMapUrl) {
      setResolving(true)
      const result = await resolveMapLink(query.trim())
      setResolving(false)
      if (result.coords) {
        selectCoords(result.coords, 'google_maps_link', query.trim())
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
    if (results.length > 0) { selectArea(results[0]); return }
    setInputError('No matching area found. Try a Hyderabad locality, Google Maps link, or coordinates.')
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
        selectCoords(coords, 'locate_me', 'Current location')
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

  async function handlePasteLink() {
    setInputError('')
    try {
      const value = await navigator.clipboard.readText()
      if (!value.trim()) {
        setInputError('Clipboard is empty. Paste a Google Maps link in the search field.')
        return
      }
      const pastedValue = value.trim()
      setQuery(pastedValue)
      const directCoords = parseCoords(pastedValue) ?? parseMapUrl(pastedValue)
      if (directCoords) {
        selectCoords(directCoords, 'google_maps_link', pastedValue)
        return
      }
      if (isMapUrl(pastedValue)) {
        setResolving(true)
        const result = await resolveMapLink(pastedValue)
        setResolving(false)
        if (result.coords) {
          selectCoords(result.coords, 'google_maps_link', pastedValue)
          return
        }
        setInputError(result.detail ?? 'Could not extract coordinates from this map link.')
        return
      }
      setInputError('Clipboard does not contain a supported Google Maps link or coordinates.')
    } catch {
      setInputError('Paste a Google Maps link in the search field.')
      inputRef.current?.focus()
    }
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
    <div
      className="min-h-[100dvh] w-full flex flex-col font-sans"
      style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}
    >
      <nav className="flex flex-shrink-0 items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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

      <section className="flex flex-1 flex-col items-center px-4 pb-8 pt-9 text-center sm:justify-center sm:px-5 sm:pb-10 sm:pt-16">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 hidden items-center gap-2 rounded-full px-3 py-1.5 font-sans sm:inline-flex"
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
            letterSpacing: '-0.035em',
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
          Check money risk, area growth, broker price, and what to verify before you visit.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
          className="relative mt-7 w-full sm:mt-10"
          style={{ maxWidth: 680 }}
        >
          <div
            aria-label="PlotDNA location search"
            className="rounded-[28px] p-2.5"
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
            <div className="grid grid-cols-1 gap-2.5">
              <div
                className="grid min-h-12 grid-cols-[38px_1fr] items-center rounded-xl px-2.5"
                style={{
                  background: 'rgba(2,6,23,0.62)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.04]">
                  {resolving || locating ? (
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

              <div className="grid grid-cols-3 gap-2">
              <button
                title="Allow location permission and prepare your current coordinates"
                onClick={handleLocateMe}
                disabled={resolving || locating}
                className={`flex min-h-[62px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 text-[11px] font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 active:scale-[0.98] disabled:opacity-55 ${locating ? 'border-emerald-300/35 bg-emerald-400/12 text-emerald-200' : 'border-emerald-300/15 bg-emerald-400/[0.055] text-slate-200 hover:border-emerald-300/30 hover:bg-emerald-400/10'}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-300">
                  <Navigation size={14} strokeWidth={2} />
                </span>
                <span className="truncate">{locating ? 'Locating' : 'Locate me'}</span>
              </button>

              <button
                title="Drop a pin on the map"
                onClick={goToMap}
                disabled={resolving || locating}
                className="flex min-h-[62px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-cyan-300/15 bg-cyan-400/[0.05] px-1.5 text-[11px] font-bold text-slate-200 transition-all hover:border-cyan-300/30 hover:bg-cyan-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 active:scale-[0.98] disabled:opacity-55"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
                  <MapPin size={14} strokeWidth={2} />
                </span>
                <span className="truncate">Drop pin</span>
              </button>

              <button
                type="button"
                onClick={handlePasteLink}
                disabled={resolving || locating}
                className="flex min-h-[62px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-violet-300/15 bg-violet-400/[0.05] px-1.5 text-[11px] font-bold text-slate-200 transition-all hover:border-violet-300/30 hover:bg-violet-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 active:scale-[0.98] disabled:opacity-55"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-300">
                  <Link2 size={14} strokeWidth={2} />
                </span>
                <span className="truncate">Paste link</span>
              </button>
              </div>
            </div>

            <AnimatePresence>
              {selectedLandInput && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-3 rounded-xl p-3 text-left" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(14,165,233,0.06))', border: '1px solid rgba(45, 212, 191, 0.28)' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300"><MapPin size={17} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">Selected location</p>
                      <p className="mt-1 truncate font-display text-lg font-black text-slate-50">{selectedLandInput.areaName ?? 'Exact land point'}</p>
                      <div className="flex flex-wrap gap-x-3 text-[11px] leading-5 text-slate-400">
                        <span>{selectedLandInput.city ?? CITIES.hyderabad.meta.name}</span>
                        {typeof selectedLandInput.lat === 'number' && typeof selectedLandInput.lng === 'number' && <><span>Lat: {selectedLandInput.lat.toFixed(5)}</span><span>Lng: {selectedLandInput.lng.toFixed(5)}</span></>}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={handleOpenArea} disabled={isOpeningArea} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-black text-slate-950 disabled:cursor-wait disabled:opacity-70">
                    {isOpeningArea ? <><LoaderCircle size={17} className="animate-spin" />Opening area…</> : <>Open Area<ChevronRight size={18} /></>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            {!selectedLandInput && <p className="mt-3 text-[11px] leading-4 text-slate-500">Select a location first — search, locate, paste link, or drop pin.</p>}
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
                      onMouseDown={() => selectCoords(coords, parsedMapUrl ? 'google_maps_link' : 'search', query.trim())}
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
                        Extract coordinates, then open the buyer verdict
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
                      onMouseDown={() => selectArea(areaWithCity)}
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
              Try “Kokapet”, paste coordinates, or paste a Google Maps link
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.32 }}
          className="mt-6 w-full text-left"
          style={{ maxWidth: 640 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <Zap size={13} className="text-cyan-300" />
            <p className="text-[11px] font-sans font-bold uppercase tracking-[0.12em] text-slate-400">
              Why buyers use PlotDNA
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BUYER_QUESTIONS.map(({ icon: Icon, title, color }) => (
              <div
                key={title}
                className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center"
                style={{
                  background: 'rgba(15,23,42,0.55)',
                  border: '1px solid rgba(148,163,184,0.14)',
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: `${color}18`, border: `1px solid ${color}45`, color }}
                >
                  <Icon size={14} />
                </div>
                <p className="text-[10.5px] font-sans font-bold leading-tight text-slate-300">{title}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </section>

    </div>
    </>
  )
}
