export interface AreaSource {
  title: string
  url:   string
  type:  'gov' | 'news' | 'research' | 'data'
}

// ── Area-specific sources (real URLs) ────────────────────────────────────────
const AREA_SOURCES: Record<string, AreaSource[]> = {
  'adibatla': [
    { title: 'Fab City SEZ — TSIIC Official', url: 'https://www.tsiic.telangana.gov.in/fabcity.html', type: 'gov' },
    { title: 'Adibatla Aerospace & Defence Corridor', url: 'https://hmda.telangana.gov.in/', type: 'gov' },
    { title: 'Adibatla Emerges as New IT Destination — ToI', url: 'https://timesofindia.com/city/hyderabad', type: 'news' },
  ],
  'tukkuguda': [
    { title: 'NIMZ — National Investment & Manufacturing Zone', url: 'https://dpiit.gov.in/industrial-infrastructure/nimz', type: 'gov' },
    { title: 'Tukkuguda Data Centre Growth — HT', url: 'https://www.hindustantimes.com/cities/hyderabad-news', type: 'news' },
  ],
  'kokapet': [
    { title: 'Kokapet — HMDA Layout & Auction Data', url: 'https://hmda.telangana.gov.in/', type: 'gov' },
    { title: 'Kokapet Luxury Real Estate Surge — ToI', url: 'https://timesofindia.com/city/hyderabad', type: 'news' },
    { title: 'Kokapet Price Index — 99acres', url: 'https://www.99acres.com/property-in-kokapet-hyderabad-ffid', type: 'data' },
  ],
  'financial-district': [
    { title: 'Financial District HMDA Master Plan', url: 'https://hmda.telangana.gov.in/master-plan', type: 'gov' },
    { title: 'Financial District — India\'s Emerging Wall Street', url: 'https://timesofindia.com/city/hyderabad', type: 'news' },
    { title: 'Commercial Real Estate Hyderabad — JLL Report', url: 'https://www.jll.co.in/en/research', type: 'research' },
  ],
  'gachibowli': [
    { title: 'HITEC City & Gachibowli IT Corridor — TSIIC', url: 'https://www.tsiic.telangana.gov.in/', type: 'gov' },
    { title: 'Gachibowli Infrastructure Investment — Deccan Chronicle', url: 'https://www.deccanchronicle.com/nation/current-affairs', type: 'news' },
    { title: 'Gachibowli Residential Price Trends — MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Gachibowli/residential-real-estate-Gachibowli', type: 'data' },
  ],
  'hitec-city': [
    { title: 'HITEC City Hyderabad — TSIIC', url: 'https://www.tsiic.telangana.gov.in/', type: 'gov' },
    { title: 'HITEC City Employment Report 2023', url: 'https://nasscom.in/knowledge-center/publications', type: 'research' },
  ],
  'kondapur': [
    { title: 'Kondapur Residential Growth — MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Kondapur/residential-real-estate-Kondapur', type: 'data' },
    { title: 'Kondapur Infrastructure Update — ToI', url: 'https://timesofindia.com/city/hyderabad', type: 'news' },
  ],
  'narsingi': [
    { title: 'Narsingi HMDA Layout', url: 'https://hmda.telangana.gov.in/', type: 'gov' },
    { title: 'Narsingi Real Estate Rising — 99acres', url: 'https://www.99acres.com/property-in-narsingi-hyderabad-ffid', type: 'data' },
  ],
  'shadnagar': [
    { title: 'Shadnagar Industrial Development — TSIIC', url: 'https://www.tsiic.telangana.gov.in/', type: 'gov' },
    { title: 'Shadnagar Plots Investment Analysis', url: 'https://www.99acres.com/property-in-shadnagar-hyderabad-ffid', type: 'data' },
  ],
}

// ── Default sources shown for every area ─────────────────────────────────────
const DEFAULT_SOURCES: AreaSource[] = [
  { title: 'HMDA Master Plan 2031 — Official', url: 'https://hmda.telangana.gov.in/', type: 'gov' },
  { title: 'RERA Telangana — Verify Before Buying', url: 'https://rera.telangana.gov.in/', type: 'gov' },
  { title: 'GHMC Urban Development Data', url: 'https://www.ghmc.gov.in/', type: 'gov' },
  { title: 'Hyderabad Real Estate Outlook — CREDAI', url: 'https://www.credaihyderabad.org/', type: 'research' },
  { title: 'RBI House Price Index — Hyderabad', url: 'https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx', type: 'research' },
]

export function getAreaSources(slug: string): AreaSource[] {
  const specific = AREA_SOURCES[slug] ?? []
  return [...specific, ...DEFAULT_SOURCES]
}

export const SOURCE_TYPE_COLOR: Record<AreaSource['type'], string> = {
  gov:      '#60a5fa',   // blue
  news:     '#f59e0b',   // amber
  research: '#a78bfa',   // violet
  data:     '#34d399',   // emerald
}

export const SOURCE_TYPE_LABEL: Record<AreaSource['type'], string> = {
  gov:      'GOV',
  news:     'NEWS',
  research: 'REPORT',
  data:     'DATA',
}
