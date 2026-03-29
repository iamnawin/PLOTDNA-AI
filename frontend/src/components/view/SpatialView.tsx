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
}

export default function SpatialView({ mode, citySlug, cityName, cityCenter, fallback, coords, globeSidebarExpanded = false }: Props) {
  if (mode === 'globe') {
    return (
      <GlobeView
        citySlug={citySlug}
        cityName={cityName}
        cityCenter={cityCenter}
        fallback={fallback}
        coords={coords}
        sidebarExpanded={globeSidebarExpanded}
      />
    )
  }

  return <MapView />
}
