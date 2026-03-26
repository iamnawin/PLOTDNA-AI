import { useState } from 'react'
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { StyleSpecification } from 'maplibre-gl'
import { Satellite, Sparkles, Navigation } from 'lucide-react'
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

const PHASE_CONFIG: Record<Milestone['phase'], { zoom: number; filter: string; label: string; caption: string }> = {
  baseline: { zoom: 10, filter: 'grayscale(1) brightness(0.50) sepia(0.55) contrast(0.85)',         label: '~2009', caption: 'Agricultural / Sparse' },
  early:    { zoom: 11, filter: 'grayscale(0.8) brightness(0.6) sepia(0.4) contrast(0.9)',           label: '~2013', caption: 'Early Infrastructure' },
  growth:   { zoom: 12, filter: 'grayscale(0.5) brightness(0.72) sepia(0.25) contrast(0.95)',        label: '~2018', caption: 'Roads & Plots Emerging' },
  boom:     { zoom: 13, filter: 'grayscale(0.2) brightness(0.85) sepia(0.1) contrast(1.0)',          label: '~2021', caption: 'Rapid Construction' },
  now:      { zoom: 13, filter: 'none',                                                              label: '2024',  caption: 'Current State' },
}

/** Generate a GeoJSON circle polygon at [lat, lng] with given radius in km */
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
  coords?: [number, number]   // searched coordinate, overrides area.center when provided
}

const RADIUS_KM = 5

export default function SatelliteCompare({ area, coords }: Props) {
  const color      = getScoreColor(area.score)
  const milestones = getGrowthMilestones(area)
  const [activeIdx, setActiveIdx] = useState(0)
  const activeMilestone = milestones[activeIdx]
  const phaseConfig     = PHASE_CONFIG[activeMilestone.phase]

  // Centre: use searched coords if provided, otherwise area centre
  const lat = coords ? coords[0] : area.center[0]
  const lng = coords ? coords[1] : area.center[1]

  const radiusGeoJSON = makeCircle(lat, lng, RADIUS_KM)
  const areaGeoJSON   = {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [area.polygon.map(([pLat, pLng]) => [pLng, pLat])] },
      properties: {},
    }],
  }

  // "Now" map zoom: show ~5km context
  const nowZoom = 12.5

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Satellite size={12} className="text-[#555566]" />
          <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest">
            Satellite Growth — Before &amp; Now
          </h2>
        </div>
        {coords && (
          <span className="text-[9px] font-mono text-[#444455] flex items-center gap-1">
            <Navigation size={9} style={{ color }} />
            <span style={{ color }}>{coords[0].toFixed(4)}°N, {coords[1].toFixed(4)}°E</span>
            <span className="text-[#2e2e42] ml-1">· {RADIUS_KM} km radius</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* ── BEFORE (reactive to selected milestone) ── */}
        <div>
          <div className="relative rounded-xl overflow-hidden" style={{ height: 240 }}>
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
            {/* Scan-line texture */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
            }} />
            {/* Label */}
            <div className="absolute top-3 left-3 z-[1] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: 'rgba(5,5,10,0.82)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#555566]" />
              <div>
                <p className="text-[9px] font-mono text-[#888899]">{phaseConfig.label}</p>
                <p className="text-[8px] font-mono text-[#444455]">{activeMilestone.label}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-px bg-[#1a1a2e]" />
            <span className="text-[9px] font-mono text-[#333344]">{phaseConfig.caption}</span>
            <div className="flex-1 h-px bg-[#1a1a2e]" />
          </div>
        </div>

        {/* ── NOW — interactive, coordinate-centred, 5km radius ── */}
        <div>
          <div className="relative rounded-xl overflow-hidden"
            style={{ height: 240, border: `1px solid ${color}35`, boxShadow: `0 0 24px ${color}12` }}>
            <Map
              mapStyle={SATELLITE_STYLE}
              initialViewState={{ longitude: lng, latitude: lat, zoom: nowZoom }}
              style={{ width: '100%', height: '100%' }}
              scrollZoom={true}
              dragPan={true}
              dragRotate={false}
              doubleClickZoom={true}
              touchZoomRotate={true}
              keyboard={false}
              attributionControl={false}
            >
              {/* 5km radius fill */}
              <Source type="geojson" data={radiusGeoJSON}>
                <Layer id="radius-fill"   type="fill" paint={{ 'fill-color': color, 'fill-opacity': 0.07 }} />
                <Layer id="radius-border" type="line" paint={{ 'line-color': color, 'line-width': 1.5, 'line-opacity': 0.5, 'line-dasharray': [4, 3] }} />
              </Source>

              {/* Area polygon overlay */}
              <Source type="geojson" data={areaGeoJSON}>
                <Layer id="area-fill"   type="fill" paint={{ 'fill-color': color, 'fill-opacity': 0.12 }} />
                <Layer id="area-border" type="line" paint={{ 'line-color': color, 'line-width': 2, 'line-opacity': 0.9 }} />
              </Source>

              {/* Coordinate pin */}
              {coords && (
                <Marker longitude={lng} latitude={lat} anchor="center">
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: color,
                    border: '2px solid #fff',
                    boxShadow: `0 0 10px ${color}, 0 0 20px ${color}80`,
                  }} />
                </Marker>
              )}
            </Map>

            {/* Label */}
            <div className="absolute top-3 left-3 z-[1] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg pointer-events-none"
              style={{ background: `${color}18`, backdropFilter: 'blur(10px)', border: `1px solid ${color}40` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
              <div>
                <p className="text-[9px] font-mono" style={{ color }}>2024 · LIVE</p>
                <p className="text-[8px] font-mono text-[#555566]">{RADIUS_KM} km analysis radius</p>
              </div>
            </div>

            {/* Scroll hint */}
            <div className="absolute bottom-3 right-3 z-[1] px-2 py-1 rounded text-[8px] font-mono pointer-events-none"
              style={{ background: 'rgba(5,5,10,0.7)', color: '#444455' }}>
              scroll to zoom
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-px" style={{ background: `${color}30` }} />
            <span className="text-[9px] font-mono" style={{ color: `${color}90` }}>
              {coords ? `${RADIUS_KM} km around your pin` : 'Roads · Buildings · Growth'}
            </span>
            <div className="flex-1 h-px" style={{ background: `${color}30` }} />
          </div>
        </div>
      </div>

      {/* ── Development progression bars ── */}
      <div className="mt-4 p-4 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest">
            Est. Development Progression
            <span className="ml-2 normal-case tracking-normal text-[#2e2e42]">— click a year</span>
          </p>
          <span className="text-[11px] font-mono font-bold" style={{ color }}>
            +{Math.round(area.signals.satellite * 0.42)}% coverage
          </span>
        </div>

        <div className="flex items-end gap-1.5">
          {milestones.map((m, i) => {
            const heightPct = 20 + ((i + 1) / milestones.length) * 80
            const isActive  = i === activeIdx
            const isLast    = i === milestones.length - 1
            const hex       = Math.round(((i + 1) / milestones.length) * 140 + 60).toString(16).padStart(2, '0')
            const barColor  = isLast ? color : `${color}${hex}`
            return (
              <button key={m.year} onClick={() => setActiveIdx(i)} className="flex-1 flex flex-col items-center gap-1" title={`View ${m.year} — ${m.label}`}>
                <div className="w-full rounded-sm transition-all duration-300" style={{
                  height: heightPct * 0.52, background: barColor,
                  opacity: isActive ? 1 : 0.45,
                  transform: isActive ? 'scaleY(1.06)' : 'scaleY(1)',
                  transformOrigin: 'bottom',
                  boxShadow: isActive ? `0 0 14px ${barColor}90` : isLast ? `0 0 8px ${color}60` : 'none',
                  outline: isActive ? `2px solid ${barColor}` : '2px solid transparent',
                  outlineOffset: 2,
                }} />
                <p className="text-[7px] font-mono transition-colors duration-150" style={{ color: isActive ? color : '#444455' }}>{m.year}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300"
          style={{ background: `${color}0a`, border: `1px solid ${color}1e` }}>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <p className="text-[9px] font-mono text-[#666680]">
            <span style={{ color }} className="font-semibold">{activeMilestone.year}</span>
            {' — '}{activeMilestone.label} · {phaseConfig.caption}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2.5 p-3 rounded-lg"
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
