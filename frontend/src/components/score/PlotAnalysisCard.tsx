import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, Navigation, ArrowRight, TrendingUp, AlertTriangle, Satellite, MapPin, Info, SearchX } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import {
  getGrowthMilestones,
  getOutlook,
  type Milestone,
} from '@/lib/plotAnalysis'
import ScoreBadge from '@/components/ui/ScoreBadge'

interface Props {
  coords: [number, number]
  area: MicroMarket
  distKm: number
  withinCoverage: boolean
  onClose: () => void
}

interface ReverseGeoResult {
  locality: string   // e.g. "Banjara Hills"
  city: string       // e.g. "Hyderabad"
  state: string      // e.g. "Telangana"
}

const PHASE_COLOR: Record<Milestone['phase'], string> = {
  baseline: '#2e2e42',
  early:    '#f59e0b',
  growth:   '#22c55e',
  boom:     '#10b981',
  now:      '#00e676',
}

export default function PlotAnalysisCard({ coords, area, distKm, withinCoverage, onClose }: Props) {
  const navigate = useNavigate()
  const color      = getScoreColor(area.score)
  const label      = getScoreLabel(area.score)
  const milestones = getGrowthMilestones(area)
  const outlook    = getOutlook(area)

  const [geo, setGeo] = useState<ReverseGeoResult | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coords[0]}&lon=${coords[1]}&format=json`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      }
    )
      .then(r => r.json())
      .then(data => {
        const addr = data.address ?? {}
        const locality =
          addr.suburb ?? addr.neighbourhood ?? addr.city_district ??
          addr.county ?? addr.town ?? addr.village ?? ''
        const city  = addr.city ?? addr.state_district ?? ''
        const state = addr.state ?? ''
        setGeo({ locality, city, state })
      })
      .catch(() => {/* nominatim unavailable — silently ignore */})
    return () => controller.abort()
  }, [coords[0], coords[1]])

  const r            = 40
  const circumference = 2 * Math.PI * r
  const dashOffset    = circumference - (area.score / 100) * circumference

  const confidenceColor =
    outlook.confidence === 'High'   ? '#10b981' :
    outlook.confidence === 'Medium' ? '#f59e0b' : '#ef4444'

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-0 right-0 h-full w-[360px] z-[1000] flex flex-col overflow-hidden"
      style={{
        background: 'rgba(4, 4, 10, 0.95)',
        backdropFilter: 'blur(28px)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'linear-gradient(180deg, rgba(0,230,118,0.04) 0%, transparent 100%)',
        }}
      >
        {/* Top row: label + close */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Navigation size={10} className="text-[#00e676]" />
              <p className="text-[9px] font-mono text-[#00e676] uppercase tracking-[0.14em]">
                Coordinate Detected
              </p>
            </div>
            <p className="font-mono text-[12px] text-[#555566] leading-tight tracking-wide">
              {coords[0].toFixed(5)}°N &nbsp; {coords[1].toFixed(5)}°E
            </p>
            {/* Resolved locality from reverse geocode */}
            {geo && (
              <p className="text-[11px] font-mono text-[#aaaabc] mt-1.5">
                {[geo.locality, geo.city, geo.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#444455] hover:text-[#e8e8f0] transition-colors mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Transparency strip */}
        <div
          className="mx-5 mb-4 rounded-xl overflow-hidden"
          style={{
            border: `1px solid ${withinCoverage ? 'rgba(255,255,255,0.07)' : 'rgba(239,68,68,0.2)'}`,
            background: withinCoverage ? 'rgba(255,255,255,0.025)' : 'rgba(239,68,68,0.04)',
          }}
        >
          {withinCoverage ? (
            <>
              {/* Nearest area row */}
              <div
                className="flex items-center gap-2.5 px-3 py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <MapPin size={10} style={{ color, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-mono text-[#333344] uppercase tracking-widest mb-0.5">
                    Nearest Supported Area
                  </p>
                  <p className="text-[12px] font-mono font-semibold text-[#ccccdd] truncate">
                    {area.name}
                  </p>
                </div>
                <div
                  className="px-2 py-0.5 rounded-full text-[8px] font-mono flex-shrink-0"
                  style={{ background: `${color}14`, border: `1px solid ${color}28`, color }}
                >
                  {distKm} km away
                </div>
              </div>
              <div className="flex items-start gap-2 px-3 py-2.5">
                <Info size={9} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                <p className="text-[9px] font-mono text-[#555566] leading-relaxed">
                  Analysis is for the nearest mapped micro-market.
                  Exact coordinate-level DNA is coming soon.
                </p>
              </div>
            </>
          ) : (
            /* NOT COVERED — one compact row */
            <div className="flex items-center gap-2.5 px-3 py-3">
              <SearchX size={11} style={{ color: '#ef4444', flexShrink: 0 }} />
              <p className="text-[9px] font-mono text-[#555566] leading-relaxed">
                {geo?.locality ?? 'This location'} is not in our coverage yet.
                Nearest: <span style={{ color: '#888899' }}>{area.name}</span> ({distKm} km away).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Not covered body: no analysis shown, no misleading fallback ── */}
      {!withinCoverage && (
        <div className="flex-1 flex items-center justify-center px-6">
          <p
            className="text-center font-mono"
            style={{ fontSize: 10, color: '#2e2e42', lineHeight: 1.7 }}
          >
            Coverage for this area is coming soon.<br />
            Try searching a supported micro-market from the map.
          </p>
        </div>
      )}

      {/* ── Scrollable body — only shown when within coverage ── */}
      {withinCoverage && <div className="flex-1 overflow-y-auto">

        {/* Score row */}
        <div
          className="flex items-center gap-4 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <svg width={90} height={90} viewBox="0 0 90 90">
              <circle cx={45} cy={45} r={r} fill="none" stroke="#1a1a2e" strokeWidth={6} />
              <motion.circle
                cx={45} cy={45} r={r}
                fill="none"
                stroke={color}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                transform="rotate(-90 45 45)"
                style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
              />
              <text x={45} y={42} textAnchor="middle" fill={color}
                style={{ fontSize: 22, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>
                {area.score}
              </text>
              <text x={45} y={55} textAnchor="middle" fill="#555566"
                style={{ fontSize: 8, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 1 }}>
                DNA
              </text>
            </svg>
          </div>

          {/* Meta */}
          <div>
            <ScoreBadge score={area.score} />
            <p className="text-base font-mono font-bold mt-1.5" style={{ color }}>{label}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingUp size={12} style={{ color }} />
              <span className="text-xs font-mono" style={{ color }}>+{area.yoy}% YoY</span>
            </div>
            <p className="text-[11px] font-mono text-[#555566] mt-0.5">{area.priceRange}</p>
          </div>
        </div>

        {/* ── 15-Year Growth Story ── */}
        <div
          className="px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Satellite size={10} className="text-[#555566]" />
            <p className="text-[9px] font-mono text-[#444455] uppercase tracking-[0.14em]">
              15-Year Growth Story
            </p>
          </div>

          {/* Timeline track */}
          <div className="relative">
            {/* Connector */}
            <div
              className="absolute h-px bg-[#1a1a2e]"
              style={{ top: 7, left: 7, right: 7 }}
            />
            {/* Active progress fill */}
            <motion.div
              className="absolute h-px"
              style={{
                top: 7, left: 7,
                background: `linear-gradient(90deg, #2e2e42, ${color})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: 'calc(100% - 14px)' }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
            />

            <div className="flex items-start justify-between relative">
              {milestones.map((m, i) => {
                const c = PHASE_COLOR[m.phase]
                const isNow = m.phase === 'now'
                return (
                  <div
                    key={m.year}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / milestones.length}%` }}
                  >
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 + i * 0.12, type: 'spring', stiffness: 400, damping: 20 }}
                      className="w-3.5 h-3.5 rounded-full border-2 mb-2 relative z-[1] flex-shrink-0"
                      style={{
                        borderColor: c,
                        backgroundColor: isNow ? c : '#050508',
                        boxShadow: isNow ? `0 0 10px ${c}90` : 'none',
                      }}
                    />
                    <p
                      className="text-[9px] font-mono text-center"
                      style={{ color: isNow ? c : '#444455' }}
                    >
                      {m.year}
                    </p>
                    <p className="text-[8px] font-mono text-center leading-tight mt-0.5 text-[#2e2e42] px-0.5">
                      {m.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-[8px] font-mono text-[#252535] mt-3 italic leading-relaxed">
            Estimated from infrastructure signals · Satellite imagery in Phase 3
          </p>
        </div>

        {/* ── 5-Year Outlook ── */}
        <div
          className="px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <p className="text-[9px] font-mono text-[#444455] uppercase tracking-[0.14em] mb-3">
            5-Year Forecast
          </p>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#666680]">Projected price growth</span>
              <span className="text-sm font-mono font-bold" style={{ color }}>{outlook.range}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#666680]">Signal confidence</span>
              <span className="text-[11px] font-mono font-semibold" style={{ color: confidenceColor }}>
                {outlook.confidence}
              </span>
            </div>

            {/* Headline callout */}
            <div
              className="mt-2 px-3 py-2.5 rounded-lg"
              style={{
                background: `${color}0c`,
                border: `1px solid ${color}1e`,
              }}
            >
              <p className="text-[11px] font-mono text-[#aaaabc] leading-relaxed">
                {outlook.headline}
              </p>
            </div>
          </div>

          {/* Key drivers */}
          {outlook.drivers.length > 0 && (
            <div className="mt-3">
              <p className="text-[9px] font-mono text-[#333344] uppercase tracking-wider mb-2">
                Key drivers
              </p>
              <ul className="space-y-1.5">
                {outlook.drivers.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] font-mono text-[#666680]">
                    <span
                      className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── RERA Warning ── */}
        <div className="px-5 py-4">
          <div
            className="flex items-start gap-2.5 p-3 rounded-lg"
            style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.18)',
            }}
          >
            <AlertTriangle size={12} className="text-[#f59e0b] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-mono text-[#f59e0b] mb-1">
                Verify RERA Before Buying
              </p>
              <p className="text-[9px] font-mono text-[#666680] leading-relaxed">
                The DNA score reflects area-level growth signals, not individual project quality.
                Always check RERA registration status of the specific plot or flat before purchase
                at <span className="text-[#f59e0b]">rera.telangana.gov.in</span>
              </p>
            </div>
          </div>
        </div>

      </div>}

      {/* ── CTA (only when within coverage) ── */}
      {withinCoverage && (
        <div
          className="p-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <button
            onClick={() => navigate(`/area/${area.slug}`)}
            className="w-full flex flex-col items-center justify-center gap-0.5 py-3 px-4 rounded-lg font-mono transition-all"
            style={{
              background: `linear-gradient(135deg, ${color}22, ${color}10)`,
              border: `1px solid ${color}40`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${color}22` }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${color}22, ${color}10)` }}
          >
            <span className="flex items-center gap-2 text-sm font-semibold" style={{ color }}>
              View full analysis for this zone
              <ArrowRight size={13} />
            </span>
            <span className="text-[9px] text-[#444455]">
              Nearest micro-market: {area.name}
            </span>
          </button>
        </div>
      )}
    </motion.div>
  )
}
