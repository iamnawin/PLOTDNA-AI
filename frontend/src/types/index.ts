export type Category = 'Established' | 'High Growth' | 'Emerging' | 'Industrial'

export type ProjectType =
  | 'metro' | 'highway' | 'flyover' | 'it_park' | 'residential'
  | 'commercial' | 'hospital' | 'airport' | 'industrial' | 'infrastructure'

export type ProjectStatus = 'planning' | 'approved' | 'under_construction' | 'near_completion'

export interface ActiveProject {
  id: string
  name: string
  type: ProjectType
  status: ProjectStatus
  developer?: string
  investment?: string          // e.g. "₹3,500 Cr"
  expectedCompletion?: string  // e.g. "2026 Q3"
  coordinates: [number, number]  // [lat, lng]
  impact: 'high' | 'medium' | 'low'
  description?: string
}

export interface CityMeta {
  slug: string
  name: string
  center: [number, number]  // [lat, lng]
  zoom: number
}

export interface Signals {
  infrastructure: number
  population: number
  satellite: number
  rera: number
  employment: number
  priceVelocity: number
  govtScheme: number
}

export interface Livability {
  connectivity: number    // roads, metro, transit access
  amenities: number       // schools, hospitals, basic needs
  ecommerce: number       // online delivery accessibility
  entertainment: number   // malls, theaters, dining
  greenSpaces: number     // parks, lakes, open areas
}

export interface MicroMarket {
  slug: string
  name: string
  score: number
  category: Category
  center: [number, number]     // [lat, lng]
  polygon: [number, number][]  // [lat, lng] pairs for Leaflet
  signals: Signals
  livability?: Livability
  highlights: string[]
  priceRange: string
  yoy: number                  // year-over-year % growth
  activeProjects?: ActiveProject[]
}
