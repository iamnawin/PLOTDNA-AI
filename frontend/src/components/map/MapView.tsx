import { useRef, useEffect, useMemo, useCallback } from 'react'
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
    setHoveredSlug(e.features?.[0]?.properties?.slug ?? null)
  }, [setHoveredSlug])

  const handleMouseLeave = useCallback(() => {
    setHoveredSlug(null)
  }, [setHoveredSlug])

  return (
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
            {/* Pulse ring 1 */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 40, height: 40,
              borderRadius: '50%',
              border: '2px solid #ef4444',
              backgroundColor: 'rgba(239,68,68,0.1)',
              animation: 'pin-ping 1.6s ease-out infinite',
            }} />
            {/* Pulse ring 2 (staggered) */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 40, height: 40,
              borderRadius: '50%',
              border: '2px solid #ef4444',
              backgroundColor: 'transparent',
              animation: 'pin-ping 1.6s ease-out 0.6s infinite',
            }} />
            {/* Center dot */}
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
  )
}
