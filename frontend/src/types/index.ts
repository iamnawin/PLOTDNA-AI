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
}
