import { create } from 'zustand'
import type { MicroMarket } from '@/types'

interface AppStore {
  selectedArea: MicroMarket | null
  hoveredSlug: string | null
  setSelectedArea: (area: MicroMarket | null) => void
  setHoveredSlug: (slug: string | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  selectedArea: null,
  hoveredSlug: null,
  setSelectedArea: (area) => set({ selectedArea: area }),
  setHoveredSlug: (slug) => set({ hoveredSlug: slug }),
}))
