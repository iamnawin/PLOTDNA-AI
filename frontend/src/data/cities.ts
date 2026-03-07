import type { MicroMarket, CityMeta } from '@/types'
import { hyderabadAreas, cityMeta as hydMeta } from './hyderabad'
import { bangaloreAreas, cityMeta as blrMeta } from './bangalore'
import { mumbaiAreas, cityMeta as mumMeta } from './mumbai'
import { chennaiAreas, cityMeta as chnMeta } from './chennai'
import { puneAreas, cityMeta as pneMeta } from './pune'
import { delhiAreas, cityMeta as delMeta } from './delhi'

export interface CityEntry {
  meta: CityMeta
  areas: MicroMarket[]
}

export const CITIES: Record<string, CityEntry> = {
  hyderabad: { meta: hydMeta, areas: hyderabadAreas },
  bangalore: { meta: blrMeta, areas: bangaloreAreas },
  mumbai:    { meta: mumMeta, areas: mumbaiAreas },
  chennai:   { meta: chnMeta, areas: chennaiAreas },
  pune:      { meta: pneMeta, areas: puneAreas },
  delhi:     { meta: delMeta, areas: delhiAreas },
}

export const CITY_LIST: CityMeta[] = [
  hydMeta, blrMeta, mumMeta, chnMeta, pneMeta, delMeta,
]

export function getCityEntry(slug: string): CityEntry {
  return CITIES[slug] ?? CITIES.hyderabad
}

/** Flat list of every area across all cities — used for slug lookup and coord search */
export function getAllAreas(): MicroMarket[] {
  return Object.values(CITIES).flatMap(c => c.areas)
}

/** Find which city an area slug belongs to */
export function getCityForArea(slug: string): CityEntry | undefined {
  return Object.values(CITIES).find(c => c.areas.some(a => a.slug === slug))
}
