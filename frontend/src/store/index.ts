import { create } from 'zustand'
import type { MicroMarket } from '@/types'

export type MapStyleKey = 'dark' | 'satellite' | 'terrain' | 'light'

interface AppStore {
  selectedArea: MicroMarket | null
  hoveredSlug: string | null
  highlightTier: string | null
  searchCoords: [number, number] | null
  is3D: boolean
  mapStyleKey: MapStyleKey
  setSelectedArea: (area: MicroMarket | null) => void
  setHoveredSlug: (slug: string | null) => void
  setHighlightTier: (tier: string | null) => void
  setSearchCoords: (coords: [number, number] | null) => void
  setIs3D: (v: boolean) => void
  setMapStyleKey: (key: MapStyleKey) => void
}

export const useAppStore = create<AppStore>((set) => ({
  selectedArea: null,
  hoveredSlug: null,
  highlightTier: null,
  searchCoords: null,
  is3D: false,
  mapStyleKey: 'dark',
  setSelectedArea: (area) => set({ selectedArea: area }),
  setHoveredSlug: (slug) => set({ hoveredSlug: slug }),
  setHighlightTier: (tier) => set({ highlightTier: tier }),
  setSearchCoords: (coords) => set({ searchCoords: coords }),
  setIs3D: (v) => set({ is3D: v }),
  setMapStyleKey: (key) => set({ mapStyleKey: key }),
}))
