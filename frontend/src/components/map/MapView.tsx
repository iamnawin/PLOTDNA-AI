import { useRef, useEffect, useMemo, useCallback } from 'react'
import Map, {
  Source,
  Layer,
  Marker,
  type MapRef,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre'
import { useNavigate } from 'react-router-dom'
import { hyderabadAreas, cityMeta } from '@/data/hyderabad'
import { useAppStore } from '@/store'
import { getScoreColor, getScoreLabel } from '@/lib/utils'

// Beautiful dark vector map — free, no API key
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export default function MapView() {
  const mapRef   = useRef<MapRef>(null)
  const navigate = useNavigate()

  const {
    selectedArea,
    hoveredSlug,
    highlightTier,
    searchCoords,
    is3D,
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
      mapStyle={MAP_STYLE}
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
          <div style={{ position: 'relative', width: 36, height: 36 }}>
            {/* Pulse ring 1 */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 36, height: 36,
              borderRadius: '50%',
              border: '1.5px solid #00e676',
              backgroundColor: 'rgba(0,230,118,0.08)',
              animation: 'pin-ping 1.6s ease-out infinite',
            }} />
            {/* Pulse ring 2 (staggered) */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 36, height: 36,
              borderRadius: '50%',
              border: '1.5px solid #00e676',
              backgroundColor: 'transparent',
              animation: 'pin-ping 1.6s ease-out 0.5s infinite',
            }} />
            {/* Center dot */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 10, height: 10,
              borderRadius: '50%',
              backgroundColor: '#00e676',
              border: '2px solid #050508',
              boxShadow: '0 0 14px #00e67690',
            }} />
          </div>
        </Marker>
      )}
    </Map>
  )
}
