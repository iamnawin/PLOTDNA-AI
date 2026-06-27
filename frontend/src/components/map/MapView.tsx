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
import { getCityEntry } from '@/data/cities'
import { useAppStore, type MapStyleKey } from '@/store'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import {
  getHyderabadPendingSource,
  getHyderabadPendingScoringReadiness,
  getMissingScoreSignalLabels,
  getOfficialMatchDetails,
  getOfficialMatchLabel,
  getPendingSourceStatusLabel,
} from '@/lib/hyderabadPendingSources'
import type { ActiveProject } from '@/types'
import hyderabadSpecialUseRaw from '../../../../data/cities/hyderabad/special-use-areas.geojson?raw'
import hyderabadCoverageRaw from '../../../../data/cities/hyderabad/coverage-areas.geojson?raw'
import hyderabadCoverageBoundaryRaw from '../../../../data/cities/hyderabad/coverage-boundary.geojson?raw'

// ── Construction marker helpers ───────────────────────────────────────────────
const PROJECT_TYPE_COLOR: Record<string, string> = {
  metro:          '#3b82f6',
  highway:        '#f97316',
  flyover:        '#fb923c',
  it_park:        '#8b5cf6',
  residential:    '#14b8a6',
  commercial:     '#a855f7',
  hospital:       '#ef4444',
  airport:        '#0ea5e9',
  industrial:     '#eab308',
  infrastructure: '#64748b',
}

const PROJECT_TYPE_LABEL: Record<string, string> = {
  metro: 'Metro', highway: 'Highway', flyover: 'Flyover',
  it_park: 'IT Park', residential: 'Residential', commercial: 'Commercial',
  hospital: 'Hospital', airport: 'Airport', industrial: 'Industrial',
  infrastructure: 'Infrastructure',
}

const STATUS_LABEL: Record<string, string> = {
  planning: 'Planning', approved: 'Approved',
  under_construction: 'Under Construction', near_completion: 'Near Completion',
}
const STATUS_COLOR: Record<string, string> = {
  planning: '#64748b', approved: '#f59e0b',
  under_construction: '#3b82f6', near_completion: '#10b981',
}
const STATUS_OPACITY: Record<string, number> = {
  planning: 0.4, approved: 0.65,
  under_construction: 1.0, near_completion: 1.0,
}

interface ConstructionHover { x: number; y: number; project: ActiveProject }
interface SpecialUseHover { x: number; y: number; name: string; kind: string }

const EMPTY_FEATURE_COLLECTION = { type: 'FeatureCollection' as const, features: [] }
const HYDERABAD_SPECIAL_USE = JSON.parse(hyderabadSpecialUseRaw) as {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: { slug: string; name: string; kind: string; marketable: boolean }
    geometry: { type: 'Polygon'; coordinates: number[][][] }
  }>
}

// Voronoi coverage cells — [lng, lat] GeoJSON format, contiguous across the Hyderabad market boundary
const HYDERABAD_COVERAGE = JSON.parse(hyderabadCoverageRaw) as {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    id: string
    properties: {
      slug: string
      name: string
      boundaryKind: string
      boundaryConfidence?: string
      marketable: boolean
      contextOnly?: boolean
      outerZone?: boolean
      distKm?: number
      areaKm2?: number
    }
    geometry: { type: 'Polygon'; coordinates: number[][][] }
  }>
}

// Irregular product-defined flagship boundary polygon (NOT a GIS circle)
const HYDERABAD_FLAGSHIP_BOUNDARY = JSON.parse(hyderabadCoverageBoundaryRaw) as {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: Record<string, unknown>
    geometry: { type: 'Polygon'; coordinates: number[][][] }
  }>
}

// ── Basemap style definitions (all free, no API key) ─────────────────────────

const SATELLITE_SPEC: StyleSpecification = {
  version: 8,
  sources: {
    sat: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
    },
    roads: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
    },
    labels: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'sat-base',
      type: 'raster',
      source: 'sat',
      paint: {
        'raster-brightness-min': 0.11,
        'raster-brightness-max': 1,
        'raster-contrast': 0.12,
        'raster-saturation': -0.24,
      },
    },
    {
      id: 'sat-roads',
      type: 'raster',
      source: 'roads',
      paint: {
        'raster-opacity': 0.56,
        'raster-brightness-min': 0.12,
      },
    },
    {
      id: 'sat-labels',
      type: 'raster',
      source: 'labels',
      paint: {
        'raster-opacity': 0.76,
      },
    },
  ],
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

const DARK_SPEC: StyleSpecification = {
  version: 8,
  sources: {
    darkRaster: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  layers: [
    {
      id: 'dark-raster-base',
      type: 'raster',
      source: 'darkRaster',
      paint: {
        'raster-brightness-min': 0,
        'raster-brightness-max': 1,
        'raster-contrast': 0.04,
      },
    },
  ],
}

const MAP_STYLES: Record<MapStyleKey, string | StyleSpecification> = {
  dark:      DARK_SPEC,
  light:     'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: SATELLITE_SPEC,
  terrain:   TERRAIN_SPEC,
}

interface HoverInfo { x: number; y: number; slug: string }
interface ContextHoverInfo {
  x: number
  y: number
  name: string
  boundaryKind: string
  boundaryConfidence: string
  areaKm2: number | null
  sourceStatus: string | null
  officialMatchLabel: string | null
  officialMatchDetails: string[]
  missingScoreSignals: string[]
}

function getPolygonBounds(polygon: [number, number][]): [[number, number], [number, number]] {
  const lngs = polygon.map(([, lng]) => lng)
  const lats = polygon.map(([lat]) => lat)
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}

function closePolygonRing(polygon: [number, number][]): [number, number][] {
  const ring = polygon.map(([lat, lng]) => [lng, lat] as [number, number])
  if (ring.length === 0) return ring
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first])
  return ring
}

export default function MapView() {
  const mapRef      = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate    = useNavigate()

  const {
    selectedArea,
    hoveredSlug,
    highlightTier,
    searchCoords,
    is3D,
    mapStyleKey,
    selectedCitySlug,
    showConstruction,
    setSelectedArea,
    setHoveredSlug,
  } = useAppStore()

  const { areas, meta: cityMeta } = getCityEntry(selectedCitySlug)

  const [hoverInfo, setHoverInfo]             = useState<HoverInfo | null>(null)
  const [contextHover, setContextHover]       = useState<ContextHoverInfo | null>(null)
  const [contextHoverSlug, setContextHoverSlug] = useState<string | null>(null)
  const [constructionHover, setConstructionHover] = useState<ConstructionHover | null>(null)
  const [specialUseHover, setSpecialUseHover] = useState<SpecialUseHover | null>(null)

  const constructionProjects = useMemo(() =>
    showConstruction ? areas.flatMap(a => a.activeProjects ?? []) : [],
    [areas, showConstruction],
  )
  const specialUseGeojson = selectedCitySlug === 'hyderabad'
    ? HYDERABAD_SPECIAL_USE
    : EMPTY_FEATURE_COLLECTION
  const flagshipBoundaryGeojson = selectedCitySlug === 'hyderabad'
    ? HYDERABAD_FLAGSHIP_BOUNDARY
    : EMPTY_FEATURE_COLLECTION

  // ── Fly to coordinate pin ─────────────────────────────────────────────────
  useEffect(() => {
    if (!searchCoords || !mapRef.current) return
    mapRef.current.flyTo({
      center: [searchCoords[1], searchCoords[0]], // MapLibre: [lng, lat]
      zoom: mapStyleKey === 'satellite' ? 17.2 : 14,
      duration: 1500,
      essential: true,
    })
  }, [mapStyleKey, searchCoords])

  // ── Fly to selected area (sidebar / chip click) ───────────────────────────
  useEffect(() => {
    if (!selectedArea || !mapRef.current) return
    const width = containerRef.current?.clientWidth ?? window.innerWidth
    const padding = width >= 1200
      ? { top: 190, right: 520, bottom: 120, left: 300 }
      : width >= 768
        ? { top: 160, right: 320, bottom: 110, left: 240 }
        : { top: 130, right: 40, bottom: 120, left: 40 }
    mapRef.current.fitBounds(getPolygonBounds(selectedArea.polygon), {
      padding,
      maxZoom: mapStyleKey === 'satellite' ? 15.8 : 14.8,
      duration: 1300,
      essential: true,
    })
  }, [mapStyleKey, selectedArea])

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

  // ── Fly to city center when city changes ─────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.flyTo({
      center: [cityMeta.center[1], cityMeta.center[0]],
      zoom: cityMeta.zoom,
      duration: 1500,
      essential: true,
    })
  }, [selectedCitySlug]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── GeoJSON: rebuild when selection / hover / filter changes ──────────────
  const geojson = useMemo(() => {
    // Hyderabad: use Voronoi coverage cells so the entire market boundary is filled
    if (selectedCitySlug === 'hyderabad') {
      const areaBySlug: Record<string, typeof areas[0]> = Object.fromEntries(areas.map(a => [a.slug, a]))
      const features = HYDERABAD_COVERAGE.features.map(feature => {
        const coverageProps = feature.properties as {
          name?: string
          contextOnly?: boolean
          outerZone?: boolean
          boundaryKind?: string
          boundaryConfidence?: string
          areaKm2?: number
        }
        const slug = feature.id as string
        const area = areaBySlug[slug]
        const hasScore = !!area
        const tierMatch = highlightTier === null || (area ? getScoreLabel(area.score) === highlightTier : false)
        const isContext = !!coverageProps.contextOnly
        const areaKm2 = coverageProps.areaKm2 ?? null
        const boundaryConfidence = coverageProps.boundaryConfidence ?? (isContext ? 'approximate' : 'broad')
        const broadGenerated = hasScore && !isContext && boundaryConfidence === 'broad' && typeof areaKm2 === 'number' && areaKm2 > 50
        const color = hasScore
          ? getScoreColor(area!.score)
          : '#64748b'
        return {
          type: 'Feature' as const,
          id: slug,
          geometry: feature.geometry, // already [lng, lat] GeoJSON format
          properties: {
            slug,
            name:      coverageProps.name ?? area?.name ?? slug.replaceAll('-', ' '),
            score:     area?.score ?? -1,
            color,
            selected:  selectedArea?.slug === slug ? 1 : 0,
            hovered:   hoveredSlug === slug || contextHoverSlug === slug ? 1 : 0,
            dimmed:    hasScore && !tierMatch ? 1 : 0,
            noData:    !hasScore ? 1 : 0,
            contextOnly: isContext ? 1 : 0,
            broadGenerated: broadGenerated ? 1 : 0,
            outerZone: coverageProps.outerZone ? 1 : 0,
            boundaryKind: coverageProps.boundaryKind ?? 'generated_market_cell',
            boundaryConfidence,
            areaKm2,
            dataState: isContext || !hasScore ? 'data-pending' : 'scored',
          },
        }
      })
      return { type: 'FeatureCollection' as const, features }
    }

    // All other cities: existing behaviour using area.polygon from static data
    return {
      type: 'FeatureCollection' as const,
      features: areas.map(area => {
        const tierMatch = highlightTier === null || getScoreLabel(area.score) === highlightTier
        return {
          type: 'Feature' as const,
          id: area.slug,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [closePolygonRing(area.polygon)],
          },
          properties: {
            slug:     area.slug,
            score:    area.score,
            color:    tierMatch ? getScoreColor(area.score) : '#252535',
            selected: selectedArea?.slug === area.slug ? 1 : 0,
            hovered:  hoveredSlug === area.slug ? 1 : 0,
            dimmed:   tierMatch ? 0 : 1,
            boundaryKind: area.boundaryKind ?? 'locality_boundary',
          },
        }
      }),
    }
  }, [selectedArea, hoveredSlug, contextHoverSlug, highlightTier, areas, selectedCitySlug])

  const showContextHover = useCallback((feature: NonNullable<MapLayerMouseEvent['features']>[number], point: { x: number; y: number }) => {
    const slug = String(feature.properties?.slug ?? '')
    const audit = getHyderabadPendingSource(slug)
    const readiness = getHyderabadPendingScoringReadiness(slug)
    const officialMatch = audit?.officialMatches?.[0]
    const officialMatchLabel = getOfficialMatchLabel(officialMatch)
    const officialMatchDetails = getOfficialMatchDetails(officialMatch)
    const missingScoreSignals = getMissingScoreSignalLabels(readiness)
    setHoveredSlug(null)
    setHoverInfo(null)
    setContextHoverSlug(slug)
    setContextHover({
      x: point.x,
      y: point.y,
      name: String(feature.properties?.name ?? 'Hyderabad context area'),
      boundaryKind: String(feature.properties?.boundaryKind ?? 'place_context_cell'),
      boundaryConfidence: String(feature.properties?.boundaryConfidence ?? 'approximate'),
      areaKm2: typeof feature.properties?.areaKm2 === 'number'
        ? feature.properties.areaKm2
        : null,
      sourceStatus: getPendingSourceStatusLabel(audit?.status),
      officialMatchLabel,
      officialMatchDetails,
      missingScoreSignals,
    })
  }, [setHoveredSlug])

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const feat = e.features?.[0]
    if (!feat) return
    if (feat.layer.id === 'special-use-fill') {
      setSelectedArea(null)
      setContextHover(null)
      setContextHoverSlug(null)
      return
    }
    const slug = feat.properties?.slug as string
    const area = areas.find(a => a.slug === slug)
    if (area) {
      setSelectedArea(area)
      setContextHover(null)
      setContextHoverSlug(null)
      return
    }
    if (feat.properties?.dataState === 'data-pending') {
      setSelectedArea(null)
      showContextHover(feat, e.point)
    }
  }, [setSelectedArea, areas, showContextHover])

  const handleDblClick = useCallback((e: MapLayerMouseEvent) => {
    if (e.features?.[0]?.layer.id === 'special-use-fill') return
    const slug = e.features?.[0]?.properties?.slug as string | undefined
    const area = slug ? areas.find(a => a.slug === slug) : null
    if (area) navigate(`/area/${slug}`)
  }, [areas, navigate])

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0]
    if (feature?.layer.id === 'special-use-fill') {
      setHoveredSlug(null)
      setHoverInfo(null)
      setContextHover(null)
      setContextHoverSlug(null)
      setSpecialUseHover({
        x: e.point.x,
        y: e.point.y,
        name: String(feature.properties?.name ?? 'Special-use area'),
        kind: String(feature.properties?.kind ?? 'non_marketable'),
      })
      return
    }
    setSpecialUseHover(null)
    const slug = feature?.properties?.slug ?? null
    const area = slug ? areas.find(a => a.slug === slug) : null
    if (slug && area) {
      setHoveredSlug(slug)
      setHoverInfo({ x: e.point.x, y: e.point.y, slug })
      setContextHover(null)
      setContextHoverSlug(null)
    } else if (slug && feature?.properties?.dataState === 'data-pending') {
      showContextHover(feature, e.point)
    } else {
      setHoveredSlug(null)
      setHoverInfo(null)
      setContextHover(null)
      setContextHoverSlug(null)
    }
  }, [areas, setHoveredSlug, showContextHover])

  const handleMouseLeave = useCallback(() => {
    setHoveredSlug(null)
    setHoverInfo(null)
    setContextHover(null)
    setContextHoverSlug(null)
    setSpecialUseHover(null)
  }, [setHoveredSlug])

  // ── Compute hover tooltip area ───────────────────────────────────────────────
  const tooltipArea = hoverInfo ? areas.find(a => a.slug === hoverInfo.slug) : null

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
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
        onError={(event) => console.error('[maplibre]', event.error)}
        interactiveLayerIds={['special-use-fill', 'area-fill']}
        cursor={hoveredSlug || specialUseHover || contextHover ? 'pointer' : 'grab'}
        doubleClickZoom={false}
      >
        {/* ── Area polygons ── */}
        <Source id="areas" type="geojson" data={geojson}>

          {/* Fill */}
          <Layer
            id="area-fill"
            type="fill"
            paint={{
              'fill-color': ['get', 'color'],
              'fill-opacity': [
                'case',
                ['all', ['==', ['get', 'dataState'], 'data-pending'], ['==', ['get', 'hovered'], 1]], 0.18,
                ['==', ['get', 'selected'], 1], 0.52,
                ['==', ['get', 'hovered'], 1], 0.40,
                ['==', ['get', 'dimmed'], 1], 0.18,
                ['==', ['get', 'dataState'], 'data-pending'], 0.07,
                ['==', ['get', 'broadGenerated'], 1], 0.16,
                0.30,
              ],
            }}
          />

          {/* Border */}
          <Layer
            id="area-border"
            type="line"
            paint={{
              'line-color': [
                'case',
                ['==', ['get', 'dataState'], 'data-pending'], '#94a3b8',
                ['get', 'color'],
              ],
              'line-width': [
                'case',
                ['==', ['get', 'selected'], 1], 3.0,
                ['==', ['get', 'hovered'], 1], 2.4,
                ['==', ['get', 'dataState'], 'data-pending'], 1.05,
                ['==', ['get', 'broadGenerated'], 1], 1.35,
                1.75,
              ],
              'line-opacity': [
                'case',
                ['all', ['==', ['get', 'dataState'], 'data-pending'], ['==', ['get', 'hovered'], 1]], 0.82,
                ['==', ['get', 'dataState'], 'data-pending'], 0.42,
                ['==', ['get', 'dimmed'], 1], 0.55,
                ['==', ['get', 'broadGenerated'], 1], 0.74,
                0.96,
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

        {/* Flagship boundary — irregular product-defined outer limit (not a GIS circle) */}
        <Source id="flagship-boundary" type="geojson" data={flagshipBoundaryGeojson}>
          <Layer
            id="flagship-boundary-line"
            type="line"
            paint={{
              'line-color': '#6366f1',
              'line-width': 1.2,
              'line-dasharray': [4, 3],
              'line-opacity': 0.40,
            }}
          />
        </Source>

        {/* Classified land overlays market cells so it is not mistaken for a residential hole. */}
        <Source id="special-use" type="geojson" data={specialUseGeojson}>
          <Layer
            id="special-use-fill"
            type="fill"
            paint={{ 'fill-color': '#38bdf8', 'fill-opacity': 0.22 }}
          />
          <Layer
            id="special-use-border"
            type="line"
            paint={{
              'line-color': '#7dd3fc',
              'line-width': 1.5,
              'line-dasharray': [2, 1.5],
              'line-opacity': 0.9,
            }}
          />
        </Source>

        {/* ── Construction activity markers ── */}
        {constructionProjects.map(proj => {
          const c       = PROJECT_TYPE_COLOR[proj.type] ?? '#64748b'
          const opacity = STATUS_OPACITY[proj.status] ?? 1
          const isPulsing = proj.status === 'under_construction' || proj.status === 'near_completion'
          return (
            <Marker
              key={proj.id}
              longitude={proj.coordinates[1]}
              latitude={proj.coordinates[0]}
              anchor="center"
            >
              <div
                style={{ position: 'relative', width: 20, height: 20, cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (!rect) return
                  setConstructionHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, project: proj })
                }}
                onMouseMove={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (!rect) return
                  setConstructionHover(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null)
                }}
                onMouseLeave={() => setConstructionHover(null)}
              >
                {isPulsing && (
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: 20, height: 20,
                    borderRadius: '50%',
                    border: `1.5px solid ${c}90`,
                    animation: `construction-pulse ${proj.status === 'near_completion' ? '1.6s' : '2.4s'} ease-out infinite`,
                  }} />
                )}
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 11, height: 11,
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: '2px solid rgba(5,5,10,0.9)',
                  opacity,
                  boxShadow: `0 0 10px ${c}80`,
                }} />
              </div>
            </Marker>
          )
        })}

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

      {specialUseHover && (
        <div style={{
          position: 'absolute',
          left: Math.max(8, Math.min(specialUseHover.x + 16, window.innerWidth - 248)),
          top: Math.max(10, specialUseHover.y - 32),
          width: 232,
          pointerEvents: 'none',
          zIndex: 220,
          padding: '11px 13px',
          borderRadius: 10,
          border: '1px solid rgba(125,211,252,0.38)',
          background: 'rgba(5,12,20,0.96)',
          boxShadow: '0 14px 36px rgba(0,0,0,0.55)',
        }}>
          <p style={{ margin: 0, color: '#e0f2fe', fontSize: 12, fontWeight: 700 }}>
            {specialUseHover.name}
          </p>
          <p style={{ margin: '5px 0 0', color: '#7dd3fc', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}>
            {specialUseHover.kind.replaceAll('_', ' ')} · not scored as residential market land
          </p>
        </div>
      )}

      {contextHover && (
        <div style={{
          position: 'absolute',
          left: Math.max(8, Math.min(contextHover.x + 16, window.innerWidth - 260)),
          top: Math.max(10, contextHover.y - 44),
          width: 244,
          pointerEvents: 'none',
          zIndex: 220,
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.40)',
          background: 'rgba(8,12,18,0.96)',
          boxShadow: '0 14px 36px rgba(0,0,0,0.55)',
        }}>
          <p style={{ margin: 0, color: '#e5e7eb', fontSize: 12, fontWeight: 700 }}>
            {contextHover.name}
          </p>
          <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.45 }}>
            Data pending - inside Hyderabad flagship coverage. PlotDNA will start validation for this area before assigning an exact score.
          </p>
          <p style={{ margin: '7px 0 0', color: '#cbd5e1', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.45 }}>
            {contextHover.officialMatchLabel
              ? `TGRAC village match: ${contextHover.officialMatchLabel}`
              : 'TGRAC village match: not available for this pending area yet.'}
          </p>
          {contextHover.officialMatchDetails.length > 0 && (
            <div style={{ marginTop: 7, color: '#94a3b8', fontSize: 8, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.45 }}>
              {contextHover.officialMatchDetails.map(detail => (
                <p key={detail} style={{ margin: '2px 0 0' }}>{detail}</p>
              ))}
            </div>
          )}
          {contextHover.missingScoreSignals.length > 0 && (
            <p style={{ margin: '7px 0 0', color: '#fbbf24', fontSize: 8, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.45 }}>
              Missing score signals: {contextHover.missingScoreSignals.join(', ')}
            </p>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
            <span style={{
              color: '#cbd5e1',
              background: 'rgba(148,163,184,0.12)',
              border: '1px solid rgba(148,163,184,0.24)',
              borderRadius: 5,
              padding: '2px 6px',
              fontSize: 8,
              fontFamily: 'IBM Plex Mono, monospace',
              textTransform: 'uppercase',
            }}>
              {contextHover.boundaryConfidence}
            </span>
            {contextHover.sourceStatus && (
              <span style={{
                color: '#cbd5e1',
                background: 'rgba(148,163,184,0.12)',
                border: '1px solid rgba(148,163,184,0.24)',
                borderRadius: 5,
                padding: '2px 6px',
                fontSize: 8,
                fontFamily: 'IBM Plex Mono, monospace',
                textTransform: 'uppercase',
              }}>
                {contextHover.sourceStatus.replaceAll('_', ' ')}
              </span>
            )}
            {contextHover.areaKm2 !== null && (
              <span style={{
                color: '#cbd5e1',
                background: 'rgba(148,163,184,0.12)',
                border: '1px solid rgba(148,163,184,0.24)',
                borderRadius: 5,
                padding: '2px 6px',
                fontSize: 8,
                fontFamily: 'IBM Plex Mono, monospace',
              }}>
                ~{contextHover.areaKm2.toFixed(1)} km2
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Construction project tooltip ── */}
      {constructionHover && (() => {
        const { x: cx, y: cy, project } = constructionHover
        const c   = PROJECT_TYPE_COLOR[project.type] ?? '#64748b'
        const sc  = STATUS_COLOR[project.status] ?? '#64748b'
        const TW  = 244
        const tx  = Math.min(cx + 16, window.innerWidth - TW - 24)
        const ty  = Math.max(8, cy - 72)
        return (
          <div style={{
            position: 'absolute', left: tx, top: ty,
            width: TW, pointerEvents: 'none', zIndex: 300,
            background: 'rgba(5,5,10,0.97)', backdropFilter: 'blur(28px)',
            border: `1px solid ${c}35`, borderRadius: 12,
            padding: '12px 14px', boxShadow: `0 16px 48px rgba(0,0,0,0.8)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fontWeight: 700,
                color: c, background: `${c}18`, border: `1px solid ${c}35`,
                borderRadius: 4, padding: '2px 6px',
              }}>
                {PROJECT_TYPE_LABEL[project.type] ?? project.type}
              </span>
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fontWeight: 700,
                color: sc, background: `${sc}18`, border: `1px solid ${sc}35`,
                borderRadius: 4, padding: '2px 6px',
              }}>
                {STATUS_LABEL[project.status] ?? project.status}
              </span>
              {project.impact === 'high' && (
                <span style={{
                  fontFamily: 'IBM Plex Mono, monospace', fontSize: 7, fontWeight: 700,
                  color: '#f59e0b', background: '#f59e0b18', border: '1px solid #f59e0b35',
                  borderRadius: 4, padding: '2px 6px',
                }}>HIGH IMPACT</span>
              )}
            </div>
            <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#e8e8f0', fontWeight: 700, lineHeight: 1.3, margin: '0 0 5px' }}>
              {project.name}
            </p>
            {project.description && (
              <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#666680', lineHeight: 1.5, margin: '0 0 8px' }}>
                {project.description}
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {project.investment && (
                <div>
                  <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 7, color: '#444455', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Investment</p>
                  <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#e8e8f0', fontWeight: 700, margin: 0 }}>{project.investment}</p>
                </div>
              )}
              {project.expectedCompletion && (
                <div>
                  <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 7, color: '#444455', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>ETA</p>
                  <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#aaaabc', margin: 0 }}>{project.expectedCompletion}</p>
                </div>
              )}
            </div>
            {project.developer && (
              <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#555566', marginTop: 7 }}>
                by {project.developer}
              </p>
            )}
          </div>
        )
      })()}

      {/* ── Hover tooltip ─────────────────────────────────────────────────────── */}
      {tooltipArea && hoverInfo && (() => {
        const c    = getScoreColor(tooltipArea.score)
        const lbl  = getScoreLabel(tooltipArea.score)
        const TW   = Math.min(224, window.innerWidth - 16)  // tooltip width px
        const left = (hoverInfo.x + TW + 20) > window.innerWidth
          ? Math.max(8, hoverInfo.x - TW - 12)
          : Math.min(hoverInfo.x + 16, window.innerWidth - TW - 8)
        const top  = Math.max(10, Math.min(hoverInfo.y - 24, window.innerHeight - 260))
        const signalEntries = Object.entries(tooltipArea.signals)
        const tooltipCoverage = selectedCitySlug === 'hyderabad'
          ? HYDERABAD_COVERAGE.features.find(feature => feature.properties.slug === tooltipArea.slug)
          : null
        const tooltipAreaKm2 = tooltipCoverage?.properties.areaKm2
        const isTooltipBroadGenerated = tooltipCoverage?.properties.boundaryConfidence === 'broad'
          && typeof tooltipAreaKm2 === 'number'
          && tooltipAreaKm2 > 50

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
                  {tooltipArea.category} · {cityMeta.name}
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
            {isTooltipBroadGenerated && (
              <p style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 8,
                color: '#fbbf24',
                background: 'rgba(251,191,36,0.10)',
                border: '1px solid rgba(251,191,36,0.22)',
                borderRadius: 5,
                padding: '5px 7px',
                lineHeight: 1.35,
                margin: '0 0 8px',
              }}>
                Generated broad market cell - score is available, but the displayed polygon is not a precise locality boundary.
              </p>
            )}

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
