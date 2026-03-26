import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, ChevronRight, Navigation, Zap, Map, TrendingUp,
  Shield, Activity, X, Clock, Satellite, Building2, AlertTriangle,
  ArrowRight, Paperclip, Link2,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { CITY_LIST, CITIES } from '@/data/cities'
import type { MicroMarket } from '@/types'
import { getScoreColor } from '@/lib/utils'
import { parseCoords, parseMapUrl, isShortMapUrl, isMapUrl, findNearestArea } from '@/lib/plotAnalysis'
import { resolveMapLink, analyzeBrochure } from '@/lib/api'

const FEATURES = [
  {
    icon: Activity,
    title: 'DNA Score',
    desc: 'A 0–100 score built from 7 signals — infrastructure, RERA, satellite, employment, and more.',
  },
  {
    icon: Map,
    title: 'Polygon Map',
    desc: 'Every micro-market drawn on a live map. Click any zone to see its full breakdown.',
  },
  {
    icon: TrendingUp,
    title: 'Growth Story',
    desc: 'See a 5-year outlook and key milestones driving value in each area.',
  },
  {
    icon: Shield,
    title: 'Risk Tiers',
    desc: 'Goldzone → Good Growth → Moderate → High Risk. Know before you invest.',
  },
]

export default function Landing() {
  const navigate  = useNavigate()
  const { setSelectedArea, setSearchCoords, setSelectedCitySlug } = useAppStore()

  const [query, setQuery]             = useState('')
  const [focused, setFocused]         = useState(false)
  const [activeCity, setActiveCity]   = useState('hyderabad')
  const [resolving, setResolving]     = useState(false)  // resolving short map link
  const [brochureLoading, setBrochureLoading] = useState(false)
  const [inputError, setInputError]   = useState('')
  const inputRef      = useRef<HTMLInputElement>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)

  // Gather all areas across all cities for search
  const allAreas: (MicroMarket & { citySlug: string })[] = Object.entries(CITIES).flatMap(
    ([slug, { areas }]) => areas.map(a => ({ ...a, citySlug: slug }))
  )

  const parsedCoords  = parseCoords(query)
  const parsedMapUrl  = parseMapUrl(query)
  const shortMapUrl   = isShortMapUrl(query)
  const isUrl         = isMapUrl(query)

  const results = query.trim() && !parsedCoords && !isUrl
    ? allAreas.filter(a => a.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []
  const showDropdown = focused && (results.length > 0 || parsedCoords !== null || parsedMapUrl !== null)

  function goToArea(area: MicroMarket & { citySlug: string }) {
    setSelectedCitySlug(area.citySlug)
    setSelectedArea(area)
    navigate('/map')
  }

  function goToCoords(coords: [number, number]) {
    const { area } = findNearestArea(coords[0], coords[1])
    setSearchCoords(coords)
    setSelectedArea(area)
    navigate('/map')
  }

  async function handleEnter() {
    setInputError('')
    // Direct coords
    if (parsedCoords) { goToCoords(parsedCoords); return }
    // Full map URL (parsed on frontend)
    if (parsedMapUrl) { goToCoords(parsedMapUrl); return }
    // Short map URL (needs backend resolution)
    if (shortMapUrl) {
      setResolving(true)
      const coords = await resolveMapLink(query.trim())
      setResolving(false)
      if (coords) { goToCoords(coords); return }
      setInputError('Could not resolve this link. Try copying the coordinates directly.')
      return
    }
    // Area name search
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
    // Reset file input so the same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function goToMap() {
    setSelectedCitySlug(activeCity)
    navigate('/map')
  }

  // Top areas for the selected preview city
  const previewAreas = [...(CITIES[activeCity]?.areas ?? [])].sort((a, b) => b.score - a.score).slice(0, 5)

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: '#050508', color: '#e8e8f0', fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00e676 0%, #00b36b 100%)',
              boxShadow: '0 0 20px #00e67640',
            }}
          >
            <span style={{ fontWeight: 900, color: '#000', fontSize: 13 }}>P</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: '#e8e8f0' }}>PlotDNA</span>
          <span
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px]"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', color: '#00e676' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#00e676]"
              style={{ boxShadow: '0 0 4px #00e676', animation: 'pulse 2s infinite' }}
            />
            Live · 6 Cities
          </span>
        </div>
        <button
          onClick={goToMap}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-mono transition-all"
          style={{
            background: 'rgba(0,230,118,0.1)',
            border: '1px solid rgba(0,230,118,0.3)',
            color: '#00e676',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,230,118,0.18)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,230,118,0.1)' }}
        >
          <Map size={12} />
          Open Map
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-5 pt-16 pb-10 text-center">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          style={{
            background: 'rgba(0,230,118,0.07)',
            border: '1px solid rgba(0,230,118,0.2)',
            fontSize: 10,
            color: '#00e676',
            letterSpacing: '0.12em',
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
            fontSize: 'clamp(26px, 5vw, 50px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            maxWidth: 680,
            color: '#f0f0fa',
          }}
        >
          Not sure whether a plot is<br />
          <span style={{ color: '#00e676' }}>truly worth buying?</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          style={{ fontSize: 14, color: '#666680', maxWidth: 520, marginTop: 18, lineHeight: 1.75 }}
        >
          PlotDNA decodes the past, present, and future of the location you are investing in —
          from infrastructure and growth signals to satellite history and forward-looking trends.
        </motion.p>

        {/* ── Search box ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
          className="relative w-full mt-10"
          style={{ maxWidth: 540 }}
        >
          <div
            style={{
              background: 'rgba(10,10,22,0.92)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${focused ? 'rgba(0,230,118,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: showDropdown ? '16px 16px 0 0' : 16,
              boxShadow: focused
                ? '0 0 0 1px rgba(0,230,118,0.1), 0 20px 56px rgba(0,0,0,0.6)'
                : '0 8px 32px rgba(0,0,0,0.5)',
              transition: 'border-color 0.2s, box-shadow 0.2s, border-radius 0.15s',
            }}
          >
            <div className="flex items-center px-5 py-4 gap-3">
              {resolving || brochureLoading ? (
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
                placeholder="Area name, lat/lng, or paste a map link..."
                value={query}
                onChange={e => { setQuery(e.target.value); setInputError('') }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 160)}
                onKeyDown={e => { if (e.key === 'Enter') handleEnter() }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: '#e8e8f0',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 14,
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
                disabled={brochureLoading}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: brochureLoading ? '#00e676' : '#444455',
                }}
              >
                <Paperclip size={12} />
              </button>

              <button
                onClick={handleEnter}
                disabled={resolving || brochureLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all"
                style={{
                  background: 'rgba(0,230,118,0.12)',
                  border: '1px solid rgba(0,230,118,0.3)',
                  color: '#00e676',
                  flexShrink: 0,
                  opacity: resolving || brochureLoading ? 0.5 : 1,
                }}
              >
                {resolving ? 'Resolving…' : brochureLoading ? 'Reading…' : 'Analyze'}
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
                      onMouseDown={() => goToCoords(coords)}
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

                {/* Short map link — show resolve option */}
                {shortMapUrl && (
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
                      onMouseDown={() => goToArea(area)}
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

        {/* ── City preview chips ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-10 w-full"
          style={{ maxWidth: 640 }}
        >
          {/* City selector */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {CITY_LIST.map(city => {
              const active = activeCity === city.slug
              return (
                <button
                  key={city.slug}
                  onClick={() => setActiveCity(city.slug)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-mono transition-all duration-150"
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

          {/* Top areas for selected city */}
          <div className="flex items-center justify-center flex-wrap gap-2">
            {previewAreas.map(area => {
              const color = getScoreColor(area.score)
              const areaWithCity = { ...area, citySlug: activeCity }
              return (
                <button
                  key={area.slug}
                  onClick={() => goToArea(areaWithCity)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[11px] font-mono transition-all"
                  style={{
                    background: `${color}12`,
                    border: `1px solid ${color}28`,
                    color,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}22` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}12` }}
                >
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
                fontSize: 'clamp(20px, 3.5vw, 34px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                color: '#f0f0fa',
                maxWidth: 560,
                margin: '0 auto',
              }}
            >
              Confused about whether to buy this plot?
            </h2>
            <p
              style={{
                fontSize: 13,
                color: '#555566',
                marginTop: 14,
                maxWidth: 480,
                margin: '14px auto 0',
                lineHeight: 1.7,
              }}
            >
              Most people buy plots based on a broker's word, a gut feeling, or
              a friend's tip. Nobody shows you the <em style={{ color: '#888899' }}>actual data</em> —
              what this land looked like 10 years ago, what changed, and where
              it's realistically heading.
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
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.18)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-4 relative z-10"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <Clock size={14} style={{ color: '#ef4444' }} />
                </div>
                <p style={{ fontSize: 9, color: '#ef4444', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                  10 Years Ago
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#ccccdd', marginBottom: 10 }}>
                  Open farmland. No road. No power.
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    'No metro connectivity',
                    'Sparse satellite density',
                    'Zero RERA registrations',
                    'Price: ₹800/sq.yd',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#ef444460' }} />
                      <span style={{ fontSize: 10, color: '#555566' }}>{item}</span>
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
                  background: 'rgba(0,230,118,0.05)',
                  border: '1px solid rgba(0,230,118,0.25)',
                  boxShadow: '0 0 32px rgba(0,230,118,0.06)',
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
                <p style={{ fontSize: 9, color: '#00e676', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Right Now
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#ccccdd', marginBottom: 10 }}>
                  Infrastructure arrived. Price tripled.
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    'Metro phase 2 under construction',
                    'Satellite: high-density buildup',
                    '38 active RERA projects',
                    'Price: ₹2,800/sq.yd',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#00e67660' }} />
                      <span style={{ fontSize: 10, color: '#666680' }}>{item}</span>
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
                  background: 'rgba(0,180,255,0.04)',
                  border: '1px solid rgba(0,180,255,0.15)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.25)' }}
                >
                  <Building2 size={14} style={{ color: '#00b4ff' }} />
                </div>
                <p style={{ fontSize: 9, color: '#00b4ff', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                  10 Years From Now
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#ccccdd', marginBottom: 10 }}>
                  Projected outlook based on signals
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    'Metro fully operational',
                    'IT corridor expansion likely',
                    'Estimated 3–4× price appreciation',
                    'Entry window: closing fast',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#00b4ff50' }} />
                      <span style={{ fontSize: 10, color: '#555566' }}>{item}</span>
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
            style={{ fontSize: 10, color: '#333344', letterSpacing: '0.16em', textTransform: 'uppercase' }}
          >
            What you get
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}
                >
                  <Icon size={14} style={{ color: '#00e676' }} />
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#ccccdd', marginBottom: 6 }}>{title}</p>
                <p style={{ fontSize: 10, color: '#444455', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 flex flex-col items-center gap-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#e8e8f0', letterSpacing: '-0.02em' }}>
          Ready to analyze a plot?
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={goToMap}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-[13px] font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #00e676 0%, #00b36b 100%)',
              color: '#000',
              boxShadow: '0 0 24px rgba(0,230,118,0.35)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 36px rgba(0,230,118,0.5)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(0,230,118,0.35)' }}
          >
            <Map size={14} />
            Open Full Map
          </button>
          <button
            onClick={() => { inputRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-[13px] transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#888899',
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
        className="px-6 py-5 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 10, color: '#2e2e42' }}
      >
        <span>PlotDNA · Real Estate Intelligence</span>
        <span>6 cities · {Object.values(CITIES).reduce((n, c) => n + c.areas.length, 0)} micro-markets</span>
      </footer>
    </div>
  )
}
