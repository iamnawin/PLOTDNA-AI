export type Category = 'Established' | 'High Growth' | 'Emerging' | 'Industrial'
export type RecommendationGoal = 'balanced' | 'growth' | 'affordable' | 'defensive' | 'livable'
export type DataConfidence = 'verified' | 'partial' | 'estimated' | 'uncovered'

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
  infrastructure: number | null
  population: number | null
  satellite: number | null
  rera: number | null
  employment: number | null
  priceVelocity: number | null
  govtScheme: number | null
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
  center: [number, number]
  polygon: [number, number][]
  signals: Signals
  livability?: Livability
  highlights: string[]
  priceRange: string
  yoy: number
  activeProjects?: ActiveProject[]
  dataConfidence?: DataConfidence
  dataAsOf?: string
  signalsAvailable?: number
  boundaryKind?: 'administrative' | 'locality_boundary' | 'generated_market_cell'
  boundaryConfidence?: 'exact' | 'approximate' | 'broad'
  scorePrecision?: 'verified' | 'locality_model' | 'estimated'
}
