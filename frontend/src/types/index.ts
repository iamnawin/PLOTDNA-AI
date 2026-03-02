export type Category = 'Established' | 'High Growth' | 'Emerging' | 'Industrial'

export interface Signals {
  infrastructure: number
  population: number
  satellite: number
  rera: number
  employment: number
  priceVelocity: number
  govtScheme: number
}

export interface MicroMarket {
  slug: string
  name: string
  score: number
  category: Category
  center: [number, number]     // [lat, lng]
  polygon: [number, number][]  // [lat, lng] pairs for Leaflet
  signals: Signals
  highlights: string[]
  priceRange: string
  yoy: number                  // year-over-year % growth
}
