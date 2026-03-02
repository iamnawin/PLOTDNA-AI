import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import Map, {
  Source,
  Layer,
  Marker,
  type MapRef,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre'
import type { StyleSpecification } from 'maplibre-gl'
import { useNavigate } from 'react-router-dom'
import { hyderabadAreas, cityMeta } from '@/data/hyderabad'
import { useAppStore, type MapStyleKey } from '@/store'
import { getScoreColor, getScoreLabel } from '@/lib/utils'

// ── Basemap style definitions (all free, no API key) ─────────────────────────

const SATELLITE_SPEC: StyleSpecification = {
  version: 8,
  sources: {
    sat: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
    },
  },
  layers: [{ id: 'sat-base', type: 'raster', source: 'sat' }],
}

const TERRAIN_SPEC: StyleSpecification = {
  version: 8,
  sources: {
    topo: {
      type: 'raster',
      tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
    },
  },
  layers: [{ id: 'topo-base', type: 'raster', source: 'topo' }],
}

const MAP_STYLES: Record<MapStyleKey, string | StyleSpecification> = {
  dark:      'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light:     'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: SATELLITE_SPEC,
  terrain:   TERRAIN_SPEC,
}

interface HoverInfo { x: number; y: number; slug: string }

export default function MapView() {
  const mapRef   = useRef<MapRef>(null)
  const navigate = useNavigate()

  const {
    selectedArea,
    hoveredSlug,
    highlightTier,
    searchCoords,
    is3D,
    mapStyleKey,
    setSelectedArea,
    setHoveredSlug,
  } = useAppStore()

  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)

  // ── Fly to coordinate pin ─────────────────────────────────────────────────
  useEffect(() => {
    if (!searchCoords || !mapRef.current) return
    mapRef.current.flyTo({
      center: [searchCoords[1], searchCoords[0]], // MapLibre: [lng, lat]
      zoom: 14,
      duration: 1500,
      essential: true,
    })
  }, [searchCoords])

  // ── Fly to selected area (sidebar / chip click) ───────────────────────────
  useEffect(() => {
    if (!selectedArea || !mapRef.current) return
    mapRef.current.flyTo({
      center: [selectedArea.center[1], selectedArea.center[0]], // [lng, lat]
      zoom: 13,
      duration: 1200,
      essential: true,
    })
  }, [selectedArea])

  // ── 3D / 2D camera toggle ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.easeTo({
      pitch:   is3D ? 58 : 0,
      bearing: is3D ? -18 : 0,
      duration: 1000,
      essential: true,
    })
  }, [is3D])

  // ── GeoJSON: rebuild when selection / hover / filter changes ──────────────
  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: hyderabadAreas.map(area => {
      const tierMatch = highlightTier === null || getScoreLabel(area.score) === highlightTier
      return {
        type: 'Feature' as const,
        id: area.slug,
        geometry: {
          type: 'Polygon' as const,
          // GeoJSON is [lng, lat] — our data stores [lat, lng], so flip
          coordinates: [area.polygon.map(([lat, lng]) => [lng, lat])],
        },
        properties: {
          slug:     area.slug,
          score:    area.score,
          color:    tierMatch ? getScoreColor(area.score) : '#252535',
          selected: selectedArea?.slug === area.slug ? 1 : 0,
          hovered:  hoveredSlug === area.slug ? 1 : 0,
          dimmed:   tierMatch ? 0 : 1,
        },
      }
    }),
  }), [selectedArea, hoveredSlug, highlightTier])

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const feat = e.features?.[0]
    if (!feat) return
    const slug = feat.properties?.slug as string
    const area = hyderabadAreas.find(a => a.slug === slug)
    if (area) setSelectedArea(area)
  }, [setSelectedArea])

  const handleDblClick = useCallback((e: MapLayerMouseEvent) => {
    const slug = e.features?.[0]?.properties?.slug as string | undefined
    if (slug) navigate(`/area/${slug}`)
  }, [navigate])

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const slug = e.features?.[0]?.properties?.slug ?? null
    setHoveredSlug(slug)
    if (slug) {
      setHoverInfo({ x: e.point.x, y: e.point.y, slug })
    } else {
      setHoverInfo(null)
    }
  }, [setHoveredSlug])

  const handleMouseLeave = useCallback(() => {
    setHoveredSlug(null)
    setHoverInfo(null)
  }, [setHoveredSlug])

  // ── Compute hover tooltip area ───────────────────────────────────────────────
  const tooltipArea = hoverInfo ? hyderabadAreas.find(a => a.slug === hoverInfo.slug) : null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        mapStyle={MAP_STYLES[mapStyleKey]}
        initialViewState={{
          latitude:  cityMeta.center[0],
          longitude: cityMeta.center[1],
          zoom:      cityMeta.zoom,
          pitch:     0,
          bearing:   0,
        }}
        style={{ width: '100%', height: '100%' }}
        onClick={handleClick}
        onDblClick={handleDblClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={['area-fill']}
        cursor={hoveredSlug ? 'pointer' : 'grab'}
        doubleClickZoom={false}
      >
        {/* ── Area polygons ── */}
        <Source id="areas" type="geojson" data={geojson}>

          {/* Fill */}
          <Layer
            id="area-fill"
            type="fill"
            paint={{
              'fill-color':   ['get', 'color'],
              'fill-opacity': [
                'case',
                ['==', ['get', 'dimmed'],   1], 0.04,
                ['==', ['get', 'selected'], 1], 0.48,
                ['==', ['get', 'hovered'],  1], 0.36,
                0.22,
              ],
            }}
          />

          {/* Border */}
          <Layer
            id="area-border"
            type="line"
            paint={{
              'line-color': ['get', 'color'],
              'line-width': [
                'case',
                ['==', ['get', 'selected'], 1], 2.5,
                ['==', ['get', 'hovered'],  1], 2.0,
                1.2,
              ],
              'line-opacity': [
                'case',
                ['==', ['get', 'dimmed'], 1], 0.15,
                0.9,
              ],
            }}
          />

          {/* Glow halo on selected */}
          <Layer
            id="area-glow"
            type="line"
            paint={{
              'line-color':   ['get', 'color'],
              'line-width':   8,
              'line-opacity': [
                'case',
                ['==', ['get', 'selected'], 1], 0.18,
                ['==', ['get', 'hovered'],  1], 0.10,
                0,
              ],
              'line-blur': 6,
            }}
          />
        </Source>

        {/* ── Coordinate pin ── */}
        {searchCoords && (
          <Marker
            longitude={searchCoords[1]}
            latitude={searchCoords[0]}
            anchor="center"
          >
            <div style={{ position: 'relative', width: 40, height: 40 }}>
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 40, height: 40,
                borderRadius: '50%',
                border: '2px solid #ef4444',
                backgroundColor: 'rgba(239,68,68,0.1)',
                animation: 'pin-ping 1.6s ease-out infinite',
              }} />
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 40, height: 40,
                borderRadius: '50%',
                border: '2px solid #ef4444',
                backgroundColor: 'transparent',
                animation: 'pin-ping 1.6s ease-out 0.6s infinite',
              }} />
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 12, height: 12,
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                border: '2.5px solid #fff',
                boxShadow: '0 0 18px #ef444490, 0 2px 8px rgba(0,0,0,0.6)',
              }} />
            </div>
          </Marker>
        )}
      </Map>

      {/* ── Hover tooltip ─────────────────────────────────────────────────────── */}
      {tooltipArea && hoverInfo && (() => {
        const c    = getScoreColor(tooltipArea.score)
        const lbl  = getScoreLabel(tooltipArea.score)
        const TW   = 224  // tooltip width px
        const left = (hoverInfo.x + TW + 20) > window.innerWidth
          ? hoverInfo.x - TW - 12
          : hoverInfo.x + 16
        const top  = Math.max(10, Math.min(hoverInfo.y - 24, window.innerHeight - 260))
        const signalEntries = Object.entries(tooltipArea.signals)

        return (
          <div
            style={{
              position: 'absolute',
              left, top,
              width: TW,
              pointerEvents: 'none',
              zIndex: 200,
              background: 'rgba(5,5,10,0.97)',
              backdropFilter: 'blur(28px)',
              border: `1px solid ${c}35`,
              borderRadius: 14,
              padding: '12px 14px',
              boxShadow: `0 16px 48px rgba(0,0,0,0.75), 0 0 0 1px ${c}10`,
            }}
          >
            {/* ── Name + Score ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: '#e8e8f0', fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
                  {tooltipArea.name}
                </p>
                <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#555566', margin: '3px 0 0' }}>
                  {tooltipArea.category} · Hyderabad
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 24, color: c, fontWeight: 700, lineHeight: 1, margin: 0 }}>
                  {tooltipArea.score}
                </p>
                <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 7, color: `${c}80`, letterSpacing: '0.1em', margin: '2px 0 0', textTransform: 'uppercase' }}>
                  DNA Score
                </p>
              </div>
            </div>

            {/* ── Tier badge ── */}
            <span style={{
              display: 'inline-block',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 9, fontWeight: 700,
              color: c,
              background: `${c}15`,
              border: `1px solid ${c}30`,
              borderRadius: 5,
              padding: '2px 8px',
              marginBottom: 8,
            }}>
              {lbl}
            </span>

            {/* ── Divider ── */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />

            {/* ── Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#444455', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Price / sqft</p>
                <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#9999aa', margin: 0, lineHeight: 1.3 }}>{tooltipArea.priceRange}</p>
              </div>
              <div>
                <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#444455', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>YoY Growth</p>
                <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 15, color: c, fontWeight: 700, margin: 0 }}>+{tooltipArea.yoy}%</p>
              </div>
            </div>

            {/* ── Signal fingerprint bars ── */}
            <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 7, color: '#333344', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 5px' }}>
              Signal fingerprint
            </p>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
              {signalEntries.map(([key, val]) => (
                <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{
                    width: '100%', height: 28,
                    background: '#1a1a2e',
                    borderRadius: 3,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'flex-end',
                  }}>
                    <div style={{
                      width: '100%',
                      height: `${val}%`,
                      background: getScoreColor(val),
                      borderRadius: '2px 2px 0 0',
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
              {signalEntries.map(([key]) => (
                <div key={key} style={{ flex: 1, textAlign: 'center' }}>
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 6, color: '#2a2a3e', textTransform: 'uppercase' }}>
                    {key === 'infrastructure' ? 'Inf' : key === 'population' ? 'Pop' : key === 'satellite' ? 'Sat' : key === 'rera' ? 'REA' : key === 'employment' ? 'Emp' : key === 'priceVelocity' ? 'Prc' : 'Gov'}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Footer hint ── */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '8px 0 6px' }} />
            <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#333344', textAlign: 'center', margin: 0 }}>
              Click to select · Double-click for full analysis
            </p>
          </div>
        )
      })()}
    </div>
  )
}
