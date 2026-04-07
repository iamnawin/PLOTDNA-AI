import { useState } from 'react'
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { StyleSpecification } from 'maplibre-gl'
import { Satellite, Sparkles, Navigation, TrendingUp, Clock } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { getScoreColor } from '@/lib/utils'
import { getGrowthMilestones, type Milestone } from '@/lib/plotAnalysis'

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
    },
  },
  layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
}

const PHASE_CONFIG: Record<Milestone['phase'], {
  zoom: number
  filter: string
  year: string
  era: string
  caption: string
  growth: string
}> = {
  baseline: {
    zoom: 10,
    filter: 'grayscale(1) brightness(0.45) sepia(0.6) contrast(0.80)',
    year: '~2009',
    era: 'Agricultural',
    caption: 'Open fields, sparse roads',
    growth: '0%',
  },
  early: {
    zoom: 11,
    filter: 'grayscale(0.75) brightness(0.58) sepia(0.45) contrast(0.88)',
    year: '~2013',
    era: 'Early Infra',
    caption: 'Initial roads laid',
    growth: '22%',
  },
  growth: {
    zoom: 12,
    filter: 'grayscale(0.5) brightness(0.70) sepia(0.28) contrast(0.93)',
    year: '~2018',
    era: 'Growth Phase',
    caption: 'Plots & roads emerging',
    growth: '54%',
  },
  boom: {
    zoom: 13,
    filter: 'grayscale(0.18) brightness(0.82) sepia(0.12) contrast(0.98)',
    year: '~2021',
    era: 'Boom',
    caption: 'Rapid construction',
    growth: '78%',
  },
  now: {
    zoom: 13,
    filter: 'none',
    year: '2024',
    era: 'Present',
    caption: 'Current density',
    growth: '100%',
  },
}

function makeCircle(lat: number, lng: number, radiusKm: number, points = 64) {
  const coords: [number, number][] = []
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const dlat  = (radiusKm / 111.32) * Math.cos(angle)
    const dlng  = (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)
    coords.push([lng + dlng, lat + dlat])
  }
  return {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [coords] },
      properties: {},
    }],
  }
}

interface Props {
  area:    MicroMarket
  coords?: [number, number]
}

const RADIUS_KM = 5

export default function SatelliteCompare({ area, coords }: Props) {
  const color      = getScoreColor(area.score)
  const milestones = getGrowthMilestones(area)
  const [activeIdx, setActiveIdx] = useState(0)

  const lat = coords ? coords[0] : area.center[0]
  const lng = coords ? coords[1] : area.center[1]

  const activeMilestone = milestones[activeIdx]
  const phaseConfig     = PHASE_CONFIG[activeMilestone.phase]

  const radiusGeoJSON = makeCircle(lat, lng, RADIUS_KM)
  const areaGeoJSON   = {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [area.polygon.map(([pLat, pLng]) => [pLng, pLat])] },
      properties: {},
    }],
  }

  const coveragePct = Math.round(area.signals.satellite * 0.42)

  return (
    <div>
      {/* ── Section header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}15`, border: `1px solid ${color}28` }}
          >
            <Satellite size={14} style={{ color }} />
          </div>
          <div>
            <h2 className="text-sm font-mono font-semibold text-[#e8e8f0]">
              Satellite Growth
            </h2>
            <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest mt-0.5">
              Before &amp; Now · Visual Comparison
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {coords && (
            <span className="text-[9px] font-mono flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
              style={{ background: `${color}0e`, border: `1px solid ${color}25`, color: `${color}cc` }}>
              <Navigation size={8} />
              {coords[0].toFixed(4)}°N · {coords[1].toFixed(4)}°E
            </span>
          )}
          <span className="text-[9px] font-mono text-[#666680] flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <TrendingUp size={8} style={{ color }} />
            <span style={{ color }}>+{coveragePct}%</span> growth
          </span>
        </div>
      </div>

      {/* ── Era selector timeline ── */}
      <div className="flex items-stretch gap-0 mb-4 rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        {milestones.map((m, i) => {
          const cfg = PHASE_CONFIG[m.phase]
          const isActive = i === activeIdx
          const isLast = i === milestones.length - 1
          return (
            <button
              key={m.year}
              onClick={() => setActiveIdx(i)}
              className="flex-1 relative flex flex-col items-center py-3 px-2 transition-all duration-200"
              style={{
                background: isActive ? `${color}14` : 'transparent',
                borderRight: i < milestones.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              {isActive && (
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-full"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              )}
              <span className="text-[9px] font-mono font-bold mb-0.5"
                style={{ color: isActive ? color : '#444455' }}>
                {cfg.year}
              </span>
              <span className="text-[8px] font-mono" style={{ color: isActive ? '#888899' : '#2e2e42' }}>
                {cfg.era}
              </span>
              {isLast && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}`, animation: 'pulse 2s infinite' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Map comparison panels ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* BEFORE panel */}
        <div className="flex flex-col">
          <div className="relative rounded-2xl overflow-hidden"
            style={{ height: 220, border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Desaturated historical view */}
            <div key={`before-${activeIdx}`} style={{ position: 'absolute', inset: 0, filter: phaseConfig.filter }}>
              <div style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
                <Map
                  mapStyle={SATELLITE_STYLE}
                  initialViewState={{ longitude: lng, latitude: lat, zoom: phaseConfig.zoom }}
                  style={{ width: '100%', height: '100%' }}
                  scrollZoom={false} dragPan={false} dragRotate={false}
                  doubleClickZoom={false} touchZoomRotate={false} keyboard={false}
                  attributionControl={false}
                />
              </div>
            </div>

            {/* Scan-line texture for vintage effect */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
            }} />

            {/* Film grain vignette */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />

            {/* Era badge — top left */}
            <div className="absolute top-3 left-3 z-[1] flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(5,5,10,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Clock size={10} className="text-[#555566]" />
              <div>
                <p className="text-[10px] font-mono font-bold text-[#aaaabc]">{phaseConfig.year}</p>
                <p className="text-[8px] font-mono text-[#444455]">{activeMilestone.label}</p>
              </div>
            </div>

            {/* BEFORE label — top right */}
            <div className="absolute top-3 right-3 z-[1] px-2 py-1 rounded-lg"
              style={{ background: 'rgba(5,5,10,0.75)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[8px] font-mono text-[#555566] uppercase tracking-widest">Before</p>
            </div>

            {/* Growth stage badge — bottom */}
            <div className="absolute bottom-3 left-3 right-3 z-[1] flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(5,5,10,0.82)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#1a1a2e' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: phaseConfig.growth, background: `linear-gradient(90deg, #444455, #666680)` }} />
              </div>
              <span className="text-[9px] font-mono text-[#555566]">{phaseConfig.growth} built</span>
            </div>
          </div>

          {/* Caption */}
          <div className="flex items-center gap-2 mt-2.5 px-1">
            <div className="w-1 h-1 rounded-full bg-[#444455]" />
            <p className="text-[9px] font-mono text-[#444455]">{phaseConfig.caption}</p>
          </div>
        </div>

        {/* NOW panel */}
        <div className="flex flex-col">
          <div className="relative rounded-2xl overflow-hidden"
            style={{ height: 220, border: `1px solid ${color}40`, boxShadow: `0 0 32px ${color}18, 0 0 0 1px ${color}18` }}>

            <Map
              mapStyle={SATELLITE_STYLE}
              initialViewState={{ longitude: lng, latitude: lat, zoom: 12.5 }}
              style={{ width: '100%', height: '100%' }}
              scrollZoom={true} dragPan={true} dragRotate={false}
              doubleClickZoom={true} touchZoomRotate={true} keyboard={false}
              attributionControl={false}
            >
              {/* 5km radius ring */}
              <Source type="geojson" data={radiusGeoJSON}>
                <Layer id="radius-fill"   type="fill" paint={{ 'fill-color': color, 'fill-opacity': 0.06 }} />
                <Layer id="radius-border" type="line" paint={{ 'line-color': color, 'line-width': 1.5, 'line-opacity': 0.55, 'line-dasharray': [5, 3] }} />
              </Source>

              {/* Area polygon */}
              <Source type="geojson" data={areaGeoJSON}>
                <Layer id="area-fill"   type="fill" paint={{ 'fill-color': color, 'fill-opacity': 0.10 }} />
                <Layer id="area-border" type="line" paint={{ 'line-color': color, 'line-width': 2, 'line-opacity': 0.9 }} />
              </Source>

              {/* Coordinate pin */}
              {coords && (
                <Marker longitude={lng} latitude={lat} anchor="center">
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: color, border: '2.5px solid #fff',
                      boxShadow: `0 0 12px ${color}, 0 0 24px ${color}80`,
                    }} />
                    <div style={{
                      position: 'absolute', inset: -6, borderRadius: '50%',
                      border: `1px solid ${color}50`,
                      animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                    }} />
                  </div>
                </Marker>
              )}
            </Map>

            {/* Live badge — top left */}
            <div className="absolute top-3 left-3 z-[1] flex items-center gap-2 px-3 py-2 rounded-xl pointer-events-none"
              style={{ background: `${color}18`, backdropFilter: 'blur(12px)', border: `1px solid ${color}40` }}>
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}`, animation: 'pulse 2s infinite' }} />
              <div>
                <p className="text-[10px] font-mono font-bold" style={{ color }}>2024 · LIVE</p>
                <p className="text-[8px] font-mono text-[#555566]">{RADIUS_KM} km radius</p>
              </div>
            </div>

            {/* NOW label — top right */}
            <div className="absolute top-3 right-3 z-[1] pointer-events-none px-2 py-1 rounded-lg"
              style={{ background: `${color}15`, border: `1px solid ${color}35` }}>
              <p className="text-[8px] font-mono font-bold uppercase tracking-widest" style={{ color }}>Now</p>
            </div>

            {/* Scroll hint */}
            <div className="absolute bottom-3 right-3 z-[1] px-2 py-1 rounded-lg pointer-events-none"
              style={{ background: 'rgba(5,5,10,0.72)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[8px] font-mono text-[#444455]">scroll · zoom</p>
            </div>

            {/* Growth badge — bottom left */}
            <div className="absolute bottom-3 left-3 z-[1] flex items-center gap-2 px-3 py-2 rounded-lg pointer-events-none"
              style={{ background: 'rgba(5,5,10,0.82)', backdropFilter: 'blur(8px)', border: `1px solid ${color}25` }}>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#1a1a2e', width: 60 }}>
                <div className="h-full rounded-full" style={{ width: '100%', background: `linear-gradient(90deg, ${color}80, ${color})` }} />
              </div>
              <span className="text-[9px] font-mono font-bold" style={{ color }}>100% built</span>
            </div>
          </div>

          {/* Caption */}
          <div className="flex items-center gap-2 mt-2.5 px-1">
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
            <p className="text-[9px] font-mono" style={{ color: `${color}99` }}>
              {coords ? `${RADIUS_KM} km · interactive` : 'Roads · Buildings · Growth'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Development progression ── */}
      <div className="mt-5 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Progress track */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest">
              Est. Development Timeline
            </p>
            <span className="text-[11px] font-mono font-bold" style={{ color }}>
              +{coveragePct}% coverage
            </span>
          </div>

          {/* Bar graph */}
          <div className="flex items-end gap-1.5">
            {milestones.map((m, i) => {
              const isActive  = i === activeIdx
              const isLast    = i === milestones.length - 1
              const heightPct = 20 + ((i + 1) / milestones.length) * 80
              const opacity   = (i + 1) / milestones.length
              const barColor  = isLast ? color : `${color}${Math.round(opacity * 160 + 50).toString(16).padStart(2, '0')}`
              return (
                <button
                  key={m.year}
                  onClick={() => setActiveIdx(i)}
                  className="flex-1 flex flex-col items-center gap-1.5 group"
                  title={`${m.year} — ${m.label}`}
                >
                  <div className="w-full rounded-md transition-all duration-300"
                    style={{
                      height: heightPct * 0.48,
                      background: barColor,
                      opacity: isActive ? 1 : 0.35,
                      transform: isActive ? 'scaleY(1.08)' : 'scaleY(1)',
                      transformOrigin: 'bottom',
                      boxShadow: isActive ? `0 0 16px ${barColor}a0` : isLast ? `0 0 8px ${color}50` : 'none',
                      outline: isActive ? `2px solid ${barColor}` : '2px solid transparent',
                      outlineOffset: 2,
                    }} />
                  <p className="text-[7px] font-mono transition-colors duration-150"
                    style={{ color: isActive ? color : '#333344' }}>
                    {m.year}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Active milestone description */}
          <div className="mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300"
            style={{ background: `${color}0a`, border: `1px solid ${color}20` }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <p className="text-[9px] font-mono text-[#666680]">
              <span style={{ color }} className="font-semibold">{activeMilestone.year}</span>
              {' — '}{activeMilestone.label} · {PHASE_CONFIG[activeMilestone.phase].caption}
            </p>
          </div>
        </div>
      </div>

      {/* ── Phase 3 teaser ── */}
      <div className="mt-3 flex items-start gap-2.5 p-3.5 rounded-xl"
        style={{ background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.1)' }}>
        <Sparkles size={10} className="text-[#00e676] flex-shrink-0 mt-0.5" />
        <p className="text-[9px] font-mono text-[#444455] leading-relaxed">
          <span className="text-[#00e676] font-semibold">Phase 3 —</span>{' '}
          Animated year-by-year satellite timelapse (2009–2024) via Google Earth Engine, showing exact building density, road expansion &amp; greenery loss.
        </p>
      </div>
    </div>
  )
}
