import { MapContainer, TileLayer, Polygon, Tooltip } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { hyderabadAreas, cityMeta } from '@/data/hyderabad'
import { useAppStore } from '@/store'
import { getScoreColor } from '@/lib/utils'
import type { MicroMarket } from '@/types'
import 'leaflet/dist/leaflet.css'

export default function MapView() {
  const { selectedArea, hoveredSlug, setSelectedArea, setHoveredSlug } = useAppStore()
  const navigate = useNavigate()

  function getPolygonStyle(area: MicroMarket) {
    const color = getScoreColor(area.score)
    const isSelected = selectedArea?.slug === area.slug
    const isHovered = hoveredSlug === area.slug

    return {
      color,
      weight: isSelected ? 2.5 : isHovered ? 2 : 1.5,
      fillColor: color,
      fillOpacity: isSelected ? 0.45 : isHovered ? 0.35 : 0.18,
      opacity: isSelected || isHovered ? 1 : 0.8,
    }
  }

  return (
    <MapContainer
      center={cityMeta.center}
      zoom={cityMeta.zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {hyderabadAreas.map((area) => (
        <Polygon
          key={area.slug}
          positions={area.polygon}
          pathOptions={getPolygonStyle(area)}
          eventHandlers={{
            click: () => {
              setSelectedArea(area)
            },
            dblclick: () => {
              navigate(`/area/${area.slug}`)
            },
            mouseover: () => setHoveredSlug(area.slug),
            mouseout: () => setHoveredSlug(null),
          }}
        >
          <Tooltip
            permanent={false}
            direction="top"
            className="plot-tooltip"
          >
            <div style={{ background: '#0d0d16', border: '1px solid #2a2a3e', borderRadius: 6, padding: '6px 10px', minWidth: 120 }}>
              <div style={{ color: '#e8e8f0', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, fontWeight: 600 }}>
                {area.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ color: getScoreColor(area.score), fontFamily: 'IBM Plex Mono, monospace', fontSize: 18, fontWeight: 700 }}>
                  {area.score}
                </span>
                <span style={{ color: '#666680', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase' }}>
                  DNA
                </span>
              </div>
            </div>
          </Tooltip>
        </Polygon>
      ))}
    </MapContainer>
  )
}
