import Map, { Source, Layer } from 'react-map-gl/maplibre'
import type { StyleSpecification } from 'maplibre-gl'
import { Satellite, Clock, Sparkles } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { getScoreColor } from '@/lib/utils'
import { getGrowthMilestones } from '@/lib/plotAnalysis'

// ESRI World Imagery — free, no API key required
const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
    },
  },
  layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
}

interface Props {
  area: MicroMarket
}

export default function SatelliteCompare({ area }: Props) {
  const color      = getScoreColor(area.score)
  const milestones = getGrowthMilestones(area)
  const lng        = area.center[1]  // MapLibre uses [lng, lat]
  const lat        = area.center[0]

  // Area polygon as GeoJSON for "Now" map overlay
  const geojson = {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [area.polygon.map(([pLat, pLng]) => [pLng, pLat])],
      },
      properties: {},
    }],
  }

  return (
    <div className="mb-10">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <Satellite size={12} className="text-[#555566]" />
        <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest">
          Satellite Growth — Before &amp; Now
        </h2>
      </div>

      {/* Side-by-side maps */}
      <div className="grid grid-cols-2 gap-4">

        {/* ── THEN ~2009 (monochrome context view) ── */}
        <div>
          <div
            className="relative rounded-xl overflow-hidden"
            style={{ height: 210 }}
          >
            {/* Grayscale + sepia filter = "vintage satellite" illusion */}
            <div
              style={{
                position: 'absolute', inset: 0,
                filter: 'grayscale(1) brightness(0.52) sepia(0.5) contrast(0.88)',
              }}
            >
              <div style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
                <Map
                  mapStyle={SATELLITE_STYLE}
                  initialViewState={{ longitude: lng, latitude: lat, zoom: 11 }}
                  style={{ width: '100%', height: '100%' }}
                  scrollZoom={false}
                  dragPan={false}
                  dragRotate={false}
                  doubleClickZoom={false}
                  touchZoomRotate={false}
                  keyboard={false}
                  attributionControl={false}
                />
              </div>
            </div>

            {/* Overlay label */}
            <div
              className="absolute top-3 left-3 z-[1] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{
                background: 'rgba(5,5,10,0.82)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Clock size={9} className="text-[#666680]" />
              <div>
                <p className="text-[9px] font-mono text-[#888899]">~2009</p>
                <p className="text-[8px] font-mono text-[#444455]">Low density context</p>
              </div>
            </div>

            {/* Scan line effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
              }}
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-px bg-[#1a1a2e]" />
            <span className="text-[9px] font-mono text-[#333344]">Agricultural / Sparse</span>
            <div className="flex-1 h-px bg-[#1a1a2e]" />
          </div>
        </div>

        {/* ── NOW 2024 (colour satellite + polygon) ── */}
        <div>
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              height: 210,
              border: `1px solid ${color}35`,
              boxShadow: `0 0 24px ${color}12`,
            }}
          >
            <div style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
              <Map
                mapStyle={SATELLITE_STYLE}
                initialViewState={{ longitude: lng, latitude: lat, zoom: 14 }}
                style={{ width: '100%', height: '100%' }}
                scrollZoom={false}
                dragPan={false}
                dragRotate={false}
                doubleClickZoom={false}
                touchZoomRotate={false}
                keyboard={false}
                attributionControl={false}
              >
                <Source type="geojson" data={geojson}>
                  <Layer
                    id="sat-fill"
                    type="fill"
                    paint={{ 'fill-color': color, 'fill-opacity': 0.14 }}
                  />
                  <Layer
                    id="sat-border"
                    type="line"
                    paint={{ 'line-color': color, 'line-width': 2, 'line-opacity': 0.9 }}
                  />
                </Source>
              </Map>
            </div>

            {/* Overlay label */}
            <div
              className="absolute top-3 left-3 z-[1] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{
                background: `${color}18`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${color}40`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
              <div>
                <p className="text-[9px] font-mono" style={{ color }}>2024 · LIVE</p>
                <p className="text-[8px] font-mono text-[#555566]">Current state</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-px" style={{ background: `${color}30` }} />
            <span className="text-[9px] font-mono" style={{ color: `${color}90` }}>Roads · Buildings · Growth</span>
            <div className="flex-1 h-px" style={{ background: `${color}30` }} />
          </div>
        </div>
      </div>

      {/* Growth progression bar */}
      <div
        className="mt-4 p-4 rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest">
            Est. Development Progression
          </p>
          <span className="text-[11px] font-mono font-bold" style={{ color }}>
            +{Math.round(area.signals.satellite * 0.42)}% coverage
          </span>
        </div>

        <div className="flex items-end gap-1">
          {milestones.map((m, i) => {
            const heightPct = 20 + ((i + 1) / milestones.length) * 80
            const isLast = i === milestones.length - 1
            return (
              <div key={m.year} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: heightPct * 0.5,
                    background: isLast ? color : `${color}${Math.round(((i + 1) / milestones.length) * 140 + 60).toString(16).padStart(2, '0')}`,
                    boxShadow: isLast ? `0 0 8px ${color}60` : 'none',
                  }}
                />
                <p className="text-[7px] font-mono text-[#333344]">{m.year}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Phase 3 teaser */}
      <div
        className="mt-3 flex items-start gap-2.5 p-3 rounded-lg"
        style={{
          background: 'rgba(0,230,118,0.04)',
          border: '1px solid rgba(0,230,118,0.1)',
        }}
      >
        <Sparkles size={10} className="text-[#00e676] flex-shrink-0 mt-0.5" />
        <p className="text-[9px] font-mono text-[#444455] leading-relaxed">
          <span className="text-[#00e676] font-semibold">Phase 3 —</span>{' '}
          Animated year-by-year satellite timelapse (2009–2024) via Google Earth Engine, showing exact building density, road expansion &amp; greenery loss for this micro-market.
        </p>
      </div>
    </div>
  )
}
