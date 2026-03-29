import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, Navigation, ArrowRight, TrendingUp, AlertTriangle, Satellite, MapPin, Info, SearchX, Activity } from 'lucide-react'
import { getScoreColor, getScoreLabel, SIGNAL_LABELS, SIGNAL_WEIGHTS } from '@/lib/utils'
import {
  findNearestArea,
  getGrowthMilestones,
  getOutlook,
  type LocalityFallbackResult,
  type Milestone,
} from '@/lib/plotAnalysis'
import ScoreBadge from '@/components/ui/ScoreBadge'
import VerdictCard from '@/components/ui/VerdictCard'
import { analyzeCoordinate, type LiveDNAResult } from '@/lib/api'

interface Props {
  coords: [number, number]
  fallback: LocalityFallbackResult
  onClose: () => void
}

interface ReverseGeoResult {
  locality: string
  city: string
  state: string
}

const PHASE_COLOR: Record<Milestone['phase'], string> = {
  baseline: '#2e2e42',
  early: '#f59e0b',
  growth: '#22c55e',
  boom: '#10b981',
  now: '#00e676',
}

export default function PlotAnalysisCard({ coords, fallback, onClose }: Props) {
  const navigate = useNavigate()

  const [geo, setGeo] = useState<ReverseGeoResult | null>(null)
  const [liveData, setLiveData] = useState<LiveDNAResult | null>(null)
  const [liveLoading, setLiveLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coords[0]}&lon=${coords[1]}&format=json`,
      { signal: controller.signal, headers: { 'Accept-Language': 'en' } },
    )
      .then(r => r.json())
      .then(data => {
        const addr = data.address ?? {}
        const locality =
          addr.suburb ?? addr.neighbourhood ?? addr.city_district ??
          addr.county ?? addr.town ?? addr.village ?? ''
        const city = addr.city ?? addr.state_district ?? ''
        const state = addr.state ?? ''
        setGeo({ locality, city, state })
      })
      .catch(() => { /* Nominatim unavailable */ })
    return () => controller.abort()
  }, [coords])

  useEffect(() => {
    let cancelled = false
    analyzeCoordinate(coords[0], coords[1]).then(result => {
      if (cancelled) return
      setLiveData(result)
      setLiveLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [coords])

  const resolvedFallback = geo
    ? findNearestArea(coords[0], coords[1], { locality: geo.locality, city: geo.city })
    : fallback
  const staticArea = resolvedFallback.area
  const verdictArea = resolvedFallback.area
  const showFallbackVerdict =
    verdictArea !== null &&
    resolvedFallback.citySlug !== null &&
    resolvedFallback.tier !== 'uncovered'
  const hasStaticAreaContext =
    staticArea !== null &&
    (resolvedFallback.tier === 'exact_locality' || resolvedFallback.tier === 'nearby_micro_market')
  const isLive = liveData !== null
  const showAnalysisBody = isLive || hasStaticAreaContext
  const showScrollableBody = showAnalysisBody || showFallbackVerdict

  const displayScore = liveData?.score ?? (hasStaticAreaContext && staticArea ? staticArea.score : 0)
  const displayHighlights = liveData?.highlights ?? (hasStaticAreaContext && staticArea ? staticArea.highlights.slice(0, 3) : [])
  const milestones = hasStaticAreaContext && staticArea ? getGrowthMilestones(staticArea) : []
  const outlook = hasStaticAreaContext && staticArea ? getOutlook(staticArea) : null

  const color = getScoreColor(displayScore)
  const label = getScoreLabel(displayScore)

  const r = 40
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (displayScore / 100) * circumference

  const displayConfidence = (liveData?.confidence ?? outlook?.confidence ?? 'Low') as 'High' | 'Medium' | 'Low'
  const confidenceColor =
    displayConfidence === 'High' ? '#10b981' :
    displayConfidence === 'Medium' ? '#f59e0b' : '#ef4444'
  const liveSignals = liveData ? (Object.entries(liveData.signals) as [keyof typeof liveData.signals, number][]) : []

  const fallbackTitle =
    resolvedFallback.tier === 'exact_locality'
      ? 'Exact Locality Match'
      : resolvedFallback.tier === 'nearby_micro_market'
        ? 'Nearby Locality Match'
        : resolvedFallback.tier === 'city_zone_cluster'
          ? 'Broad Region Match'
          : 'Coverage Not Available'

  const fallbackDisplayLabel =
    resolvedFallback.tier === 'nearby_micro_market'
      ? `Nearby: ${resolvedFallback.displayLabel}`
      : resolvedFallback.tier === 'uncovered'
        ? 'Coverage not available'
        : resolvedFallback.displayLabel

  const fallbackPrecisionText =
    resolvedFallback.precisionLabel === 'exact'
      ? 'Exact locality'
      : resolvedFallback.precisionLabel === 'approximate'
        ? 'Approximate'
        : resolvedFallback.precisionLabel === 'broad'
          ? 'Broad region'
          : 'No coverage'

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
      <div
        className="flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'linear-gradient(180deg, rgba(0,230,118,0.04) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Navigation size={10} className="text-[#00e676]" />
              <p className="text-[9px] font-mono text-[#00e676] uppercase tracking-[0.14em]">
                Coordinate Detected
              </p>
            </div>
            <p className="font-mono text-[12px] text-[#555566] leading-tight tracking-wide">
              {coords[0].toFixed(5)} N &nbsp; {coords[1].toFixed(5)} E
            </p>
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

        <div
          className="mx-5 mb-4 rounded-xl overflow-hidden"
          style={{
            border: isLive
              ? 'rgba(0,230,118,0.2) solid 1px'
              : hasStaticAreaContext
                ? '1px solid rgba(255,255,255,0.07)'
                : '1px solid rgba(239,68,68,0.2)',
            background: isLive
              ? 'rgba(0,230,118,0.04)'
              : hasStaticAreaContext
                ? 'rgba(255,255,255,0.025)'
                : 'rgba(239,68,68,0.04)',
          }}
        >
          {isLive ? (
            <>
              <div
                className="flex items-center gap-2.5 px-3 py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <Activity size={10} style={{ color: '#00e676', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-mono text-[#333344] uppercase tracking-widest mb-0.5">
                    Live Coordinate Analysis
                  </p>
                  <p className="text-[11px] font-mono font-semibold text-[#aaaabc] truncate">
                    {fallbackDisplayLabel}
                  </p>
                </div>
                <div
                  className="px-2 py-0.5 rounded-full text-[8px] font-mono flex-shrink-0 uppercase tracking-wide"
                  style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: '#00e676' }}
                >
                  {liveData.freshness}
                </div>
              </div>
              <div className="flex items-start gap-2 px-3 py-2.5">
                <Info size={9} style={{ color: '#555566', flexShrink: 0, marginTop: 1 }} />
                <p className="text-[9px] font-mono text-[#555566] leading-relaxed">
                  Score derived from real transit, roads, offices and amenities near this coordinate.
                  Price velocity is a proxy and static micro-market context is shown only when the fallback tier is exact or safely nearby.
                </p>
              </div>
            </>
          ) : hasStaticAreaContext && staticArea ? (
            <>
              <div
                className="flex items-center gap-2.5 px-3 py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <MapPin size={10} style={{ color, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-mono text-[#333344] uppercase tracking-widest mb-0.5">
                    {fallbackTitle}
                  </p>
                  <p className="text-[12px] font-mono font-semibold text-[#ccccdd] truncate">
                    {fallbackDisplayLabel}
                  </p>
                </div>
                <div
                  className="px-2 py-0.5 rounded-full text-[8px] font-mono flex-shrink-0"
                  style={{ background: `${color}14`, border: `1px solid ${color}28`, color }}
                >
                  {fallbackPrecisionText}
                </div>
              </div>
              <div className="flex items-start gap-2 px-3 py-2.5">
                <Info size={9} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                <p className="text-[9px] font-mono text-[#555566] leading-relaxed">
                  {resolvedFallback.tier === 'exact_locality'
                    ? 'Reverse geocoding matched this supported locality, so PlotDNA can safely reuse static area context here.'
                    : 'This point is close enough to a supported micro-market to reuse its context, but it is still presented as approximate rather than exact.'}
                </p>
              </div>
            </>
          ) : liveLoading ? (
            <div className="flex items-center gap-2.5 px-3 py-3">
              <Activity size={11} style={{ color: '#00e676', flexShrink: 0 }} className="animate-pulse" />
              <p className="text-[9px] font-mono text-[#555566] animate-pulse">
                Analyzing coordinate via OpenStreetMap...
              </p>
            </div>
          ) : resolvedFallback.tier === 'city_zone_cluster' ? (
            <div className="flex items-center gap-2.5 px-3 py-3">
              <Info size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <p className="text-[9px] font-mono text-[#555566] leading-relaxed">
                {fallbackDisplayLabel} is available only as a broad region.
                PlotDNA is intentionally not substituting one micro-market here.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-3">
              <SearchX size={11} style={{ color: '#ef4444', flexShrink: 0 }} />
              <p className="text-[9px] font-mono text-[#555566] leading-relaxed">
                Coverage not available for this location.
                PlotDNA is intentionally not showing a fallback market.
              </p>
            </div>
          )}
        </div>
      </div>

      {!showScrollableBody && !liveLoading && (
        <div className="flex-1 flex items-center justify-center px-6">
          <p
            className="text-center font-mono"
            style={{ fontSize: 10, color: '#2e2e42', lineHeight: 1.7 }}
          >
            {resolvedFallback.tier === 'city_zone_cluster'
              ? `${fallbackDisplayLabel} is supported only at a broad region level right now.`
              : 'Coverage for this location is not available yet.'}
            <br />
            Start the backend for a live score or browse a supported micro-market on the map.
          </p>
        </div>
      )}

      {!showScrollableBody && liveLoading && (
        <div className="flex-1 flex items-center justify-center px-6">
          <p
            className="text-center font-mono animate-pulse"
            style={{ fontSize: 10, color: '#2e2e42', lineHeight: 1.7 }}
          >
            Fetching live signals...
          </p>
        </div>
      )}

      {showScrollableBody && (
        <div className="flex-1 overflow-y-auto">
          {showAnalysisBody && (
            <div
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
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
                    {displayScore}
                  </text>
                  <text x={45} y={55} textAnchor="middle" fill="#555566"
                    style={{ fontSize: 8, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 1 }}>
                    DNA
                  </text>
                </svg>
              </div>

              <div>
                <ScoreBadge score={displayScore} />
                <p className="text-base font-mono font-bold mt-1.5" style={{ color }}>{label}</p>
                {isLive ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Activity size={11} style={{ color: '#00e676' }} />
                    <span className="text-[10px] font-mono text-[#00e676]">Live OSM score</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-1">
                    <TrendingUp size={12} style={{ color }} />
                    <span className="text-xs font-mono" style={{ color }}>+{staticArea?.yoy ?? 0}% YoY</span>
                  </div>
                )}
                {isLive ? (
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: '#333344' }}>
                    Coordinate-level score. Static locality narratives appear only when the fallback tier is exact or safely nearby.
                  </p>
                ) : (
                  <p className="text-[11px] font-mono text-[#555566] mt-0.5">{staticArea?.priceRange}</p>
                )}
              </div>
            </div>
          )}

          {showFallbackVerdict && verdictArea && resolvedFallback.citySlug && (
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <VerdictCard
                citySlug={resolvedFallback.citySlug}
                areaSlug={verdictArea.slug}
                resolutionTier={resolvedFallback.tier}
                resolutionLabel={fallbackDisplayLabel}
              />
            </div>
          )}

          {isLive && !hasStaticAreaContext && (
            <>
              <div
                className="px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <p className="text-[9px] font-mono text-[#444455] uppercase tracking-[0.14em] mb-3">
                  Live Signal Breakdown
                </p>
                <div className="space-y-3">
                  {liveSignals.map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="text-[10px] font-mono text-[#888899]">{SIGNAL_LABELS[key] ?? key}</span>
                        <span className="text-[10px] font-mono text-[#666680]">{SIGNAL_WEIGHTS[key] ?? 0}% wt · {value}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a2e' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${value}%`, backgroundColor: getScoreColor(value) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <p className="text-[9px] font-mono text-[#444455] uppercase tracking-[0.14em] mb-3">
                  Coverage Context
                </p>
                <div
                  className="px-3 py-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[11px] font-mono text-[#e8e8f0]">
                    {fallbackDisplayLabel}
                  </p>
                  <p className="text-[10px] font-mono text-[#666680] mt-1 leading-relaxed">
                    {resolvedFallback.tier === 'city_zone_cluster'
                      ? 'The live score is valid for this coordinate, but PlotDNA only has broad city-zone context here. Area-level history and forecast sections are intentionally hidden.'
                      : 'The live score is valid for this coordinate, but PlotDNA does not have a reliable supported micro-market match for this location yet.'}
                  </p>
                </div>
              </div>
            </>
          )}

          {hasStaticAreaContext && staticArea && (
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

              <div className="relative">
                <div
                  className="absolute h-px bg-[#1a1a2e]"
                  style={{ top: 7, left: 7, right: 7 }}
                />
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
                    const milestoneColor = PHASE_COLOR[m.phase]
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
                            borderColor: milestoneColor,
                            backgroundColor: isNow ? milestoneColor : '#050508',
                            boxShadow: isNow ? `0 0 10px ${milestoneColor}90` : 'none',
                          }}
                        />
                        <p
                          className="text-[9px] font-mono text-center"
                          style={{ color: isNow ? milestoneColor : '#444455' }}
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
                Estimated from infrastructure signals. Satellite imagery arrives in Phase 3.
              </p>
            </div>
          )}

          {hasStaticAreaContext && staticArea && outlook && (
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
                    {displayConfidence}
                  </span>
                </div>

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

              {displayHighlights.length > 0 && (
                <div className="mt-3">
                  <p className="text-[9px] font-mono text-[#333344] uppercase tracking-wider mb-2">
                    {isLive ? 'Live signal highlights' : 'Key drivers'}
                  </p>
                  <ul className="space-y-1.5">
                    {displayHighlights.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] font-mono text-[#666680]">
                        <span
                          className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

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
                  The DNA score reflects location-level growth signals, not individual project quality.
                  Always check the specific plot or flat before purchase at <span className="text-[#f59e0b]">rera.telangana.gov.in</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasStaticAreaContext && staticArea && (
        <div
          className="p-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <button
            onClick={() => navigate(`/area/${staticArea.slug}`, {
              state: {
                fallbackContext: {
                  tier: resolvedFallback.tier,
                  displayLabel: fallbackDisplayLabel,
                  precisionLabel: resolvedFallback.precisionLabel,
                  coords,
                },
              },
            })}
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
                {fallbackPrecisionText}: {fallbackDisplayLabel}
              </span>
            </button>
          </div>
      )}
    </motion.div>
  )
}
