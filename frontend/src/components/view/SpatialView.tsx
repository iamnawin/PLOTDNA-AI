import MapView from '@/components/map/MapView'
import GlobeView from '@/components/view/GlobeView'
import type { LocalityFallbackResult } from '@/lib/plotAnalysis'
import type { ViewMode } from '@/components/view/ViewModeToggle'

interface Props {
  mode: ViewMode
  citySlug: string
  cityName: string
  cityCenter: [number, number]
  fallback: LocalityFallbackResult | null
  coords: [number, number] | null
  globeSidebarExpanded?: boolean
  dropPinMode?: boolean
  onCityClick?: (slug: string, center: [number, number]) => void
  onMapClick?: (coords: { lat: number; lng: number }) => void
}

export default function SpatialView({
  mode,
  citySlug,
  cityName,
  cityCenter,
  fallback,
  coords,
  globeSidebarExpanded = false,
  dropPinMode = false,
  onCityClick,
  onMapClick,
}: Props) {
  if (mode === 'globe') {
    return (
      <GlobeView
        citySlug={citySlug}
        cityName={cityName}
        cityCenter={cityCenter}
        fallback={fallback}
        coords={coords}
        sidebarExpanded={globeSidebarExpanded}
        onCityClick={onCityClick}
      />
    )
  }

  return <MapView dropPinMode={dropPinMode} onMapClick={onMapClick} />
}
