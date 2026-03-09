export interface AreaSource {
  title: string
  url:   string
  type:  'gov' | 'news' | 'research' | 'data'
}

// ── Area-specific sources ─────────────────────────────────────────────────────

const AREA_SOURCES: Record<string, AreaSource[]> = {

  // ── Hyderabad ──────────────────────────────────────────────────────────────
  'adibatla': [
    { title: 'Fab City SEZ — TSIIC Official',                    url: 'https://www.tsiic.telangana.gov.in/fabcity.html',                             type: 'gov'      },
    { title: 'Adibatla Aerospace & Defence Corridor — HMDA',     url: 'https://hmda.telangana.gov.in/',                                              type: 'gov'      },
    { title: 'Adibatla Emerges as New IT Destination — ToI',     url: 'https://timesofindia.com/city/hyderabad',                                     type: 'news'     },
  ],
  'tukkuguda': [
    { title: 'NIMZ — National Investment & Manufacturing Zone',  url: 'https://dpiit.gov.in/industrial-infrastructure/nimz',                        type: 'gov'      },
    { title: 'Tukkuguda Data Centre Growth — HT',                url: 'https://www.hindustantimes.com/cities/hyderabad-news',                        type: 'news'     },
    { title: 'Tukkuguda Plots — 99acres',                        url: 'https://www.99acres.com/property-in-tukkuguda-hyderabad-ffid',                type: 'data'     },
  ],
  'kokapet': [
    { title: 'Kokapet — HMDA Layout & Auction Data',             url: 'https://hmda.telangana.gov.in/',                                              type: 'gov'      },
    { title: 'Kokapet Luxury Real Estate Surge — ToI',           url: 'https://timesofindia.com/city/hyderabad',                                     type: 'news'     },
    { title: 'Kokapet Price Index — 99acres',                    url: 'https://www.99acres.com/property-in-kokapet-hyderabad-ffid',                  type: 'data'     },
  ],
  'financial-district': [
    { title: 'Financial District HMDA Master Plan',              url: 'https://hmda.telangana.gov.in/master-plan',                                   type: 'gov'      },
    { title: "India's Emerging Wall Street — ToI",               url: 'https://timesofindia.com/city/hyderabad',                                     type: 'news'     },
    { title: 'Commercial Real Estate Hyderabad — JLL',           url: 'https://www.jll.co.in/en/research',                                           type: 'research' },
    { title: 'Financial District Office Market — Knight Frank',  url: 'https://www.knightfrank.co.in/research',                                     type: 'research' },
  ],
  'gachibowli': [
    { title: 'HITEC City & Gachibowli IT Corridor — TSIIC',     url: 'https://www.tsiic.telangana.gov.in/',                                         type: 'gov'      },
    { title: 'Gachibowli Infrastructure Investment',             url: 'https://www.deccanchronicle.com/',                                            type: 'news'     },
    { title: 'Gachibowli Residential Price Trends — MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Gachibowli/residential-real-estate-Gachibowli', type: 'data' },
  ],
  'hitec-city': [
    { title: 'HITEC City Hyderabad — TSIIC',                     url: 'https://www.tsiic.telangana.gov.in/',                                         type: 'gov'      },
    { title: 'HITEC City Employment Report — NASSCOM',           url: 'https://nasscom.in/knowledge-center/publications',                            type: 'research' },
    { title: 'HITEC City Office Rentals — JLL India',            url: 'https://www.jll.co.in/en/research',                                           type: 'research' },
  ],
  'kondapur': [
    { title: 'Kondapur Residential Growth — MagicBricks',        url: 'https://www.magicbricks.com/property-for-sale-rent-in-Kondapur/residential-real-estate-Kondapur', type: 'data' },
    { title: 'Kondapur Infrastructure Update — ToI',             url: 'https://timesofindia.com/city/hyderabad',                                     type: 'news'     },
  ],
  'narsingi': [
    { title: 'Narsingi HMDA Layout',                             url: 'https://hmda.telangana.gov.in/',                                              type: 'gov'      },
    { title: 'Narsingi Real Estate Rising — 99acres',            url: 'https://www.99acres.com/property-in-narsingi-hyderabad-ffid',                 type: 'data'     },
  ],
  'shadnagar': [
    { title: 'Shadnagar Industrial Development — TSIIC',         url: 'https://www.tsiic.telangana.gov.in/',                                         type: 'gov'      },
    { title: 'Shadnagar Plots Investment Analysis — 99acres',    url: 'https://www.99acres.com/property-in-shadnagar-hyderabad-ffid',                type: 'data'     },
  ],
  'shankarpally': [
    { title: 'Shankarpally HMDA Layout Zone',                    url: 'https://hmda.telangana.gov.in/',                                              type: 'gov'      },
    { title: 'Shankarpally Affordable Plots — 99acres',          url: 'https://www.99acres.com/property-in-shankarpally-hyderabad-ffid',             type: 'data'     },
  ],

  // ── Bangalore ─────────────────────────────────────────────────────────────
  'devanahalli': [
    { title: 'KIADB Aerospace SEZ — Devanahalli',                url: 'https://www.kiadb.in/',                                                       type: 'gov'      },
    { title: 'BIAL — Kempegowda International Airport',          url: 'https://www.bengaluruairport.com/',                                           type: 'gov'      },
    { title: 'Devanahalli Price Trends — MagicBricks',           url: 'https://www.magicbricks.com/property-for-sale-rent-in-Devanahalli/residential-real-estate-Devanahalli', type: 'data' },
    { title: 'Devanahalli Real Estate — 99acres',                url: 'https://www.99acres.com/property-in-devanahalli-bangalore-ffid',              type: 'data'     },
  ],
  'sarjapur-road': [
    { title: 'BDA Sarjapur Road Development Plan',               url: 'https://bda.kar.nic.in/',                                                     type: 'gov'      },
    { title: 'Sarjapur Road IT Corridor Growth — ToI',           url: 'https://timesofindia.com/city/bengaluru',                                     type: 'news'     },
    { title: 'Sarjapur Road Price Index — 99acres',              url: 'https://www.99acres.com/property-in-sarjapur-road-bangalore-ffid',            type: 'data'     },
  ],
  'whitefield': [
    { title: 'ITPB — Whitefield IT Park, KIADB',                 url: 'https://www.kiadb.in/',                                                       type: 'gov'      },
    { title: 'Whitefield Metro Phase 2 Update — Deccan Herald',  url: 'https://www.deccanherald.com/',                                               type: 'news'     },
    { title: 'Whitefield Property Market — 99acres',             url: 'https://www.99acres.com/property-in-whitefield-bangalore-ffid',               type: 'data'     },
  ],
  'hebbal': [
    { title: 'BBMP Hebbal Zone Regulations',                     url: 'https://bbmp.gov.in/',                                                        type: 'gov'      },
    { title: 'Hebbal Lake & North Bangalore Development — BDA',  url: 'https://bda.kar.nic.in/',                                                     type: 'gov'      },
    { title: 'Hebbal Office & Residential — 99acres',            url: 'https://www.99acres.com/property-in-hebbal-bangalore-ffid',                   type: 'data'     },
  ],
  'hsr-layout': [
    { title: 'BBMP HSR Layout Zone',                             url: 'https://bbmp.gov.in/',                                                        type: 'gov'      },
    { title: 'HSR Layout Price Trends — MagicBricks',            url: 'https://www.magicbricks.com/property-for-sale-rent-in-HSR-Layout/residential-real-estate-HSR-Layout', type: 'data' },
  ],
  'koramangala': [
    { title: 'BBMP Koramangala Zone',                            url: 'https://bbmp.gov.in/',                                                        type: 'gov'      },
    { title: 'Koramangala Startup Hub — NASSCOM India',          url: 'https://nasscom.in/',                                                         type: 'research' },
    { title: 'Koramangala Property Rates — 99acres',             url: 'https://www.99acres.com/property-in-koramangala-bangalore-ffid',              type: 'data'     },
  ],
  'yelahanka': [
    { title: 'Yelahanka BDA Layout',                             url: 'https://bda.kar.nic.in/',                                                     type: 'gov'      },
    { title: 'Yelahanka North Bangalore Growth — ToI',           url: 'https://timesofindia.com/city/bengaluru',                                     type: 'news'     },
    { title: 'Yelahanka Affordable Housing — 99acres',           url: 'https://www.99acres.com/property-in-yelahanka-bangalore-ffid',                type: 'data'     },
  ],

  // ── Mumbai ────────────────────────────────────────────────────────────────
  'panvel': [
    { title: 'CIDCO Panvel Node Development',                    url: 'https://cidco.maharashtra.gov.in/',                                           type: 'gov'      },
    { title: 'Navi Mumbai International Airport — CIDCO',        url: 'https://nmia.aero/',                                                          type: 'gov'      },
    { title: 'Panvel Property Market — 99acres',                 url: 'https://www.99acres.com/property-in-panvel-navi-mumbai-ffid',                 type: 'data'     },
  ],
  'kharghar': [
    { title: 'CIDCO Kharghar Layout',                            url: 'https://cidco.maharashtra.gov.in/',                                           type: 'gov'      },
    { title: 'Kharghar Central Park & Amenities',                url: 'https://cidco.maharashtra.gov.in/',                                           type: 'gov'      },
    { title: 'Kharghar Price Index — MagicBricks',               url: 'https://www.magicbricks.com/property-for-sale-rent-in-Kharghar/residential-real-estate-Kharghar', type: 'data' },
  ],
  'badlapur': [
    { title: 'MMRDA Badlapur Development Plan',                  url: 'https://mmrda.maharashtra.gov.in/',                                           type: 'gov'      },
    { title: 'Badlapur Affordable Housing — 99acres',            url: 'https://www.99acres.com/property-in-badlapur-thane-ffid',                     type: 'data'     },
  ],
  'powai': [
    { title: 'MIDC Powai Industrial Area',                       url: 'https://www.midcindia.org/',                                                  type: 'gov'      },
    { title: 'IIT Bombay Research Park — SINE',                  url: 'https://www.sineiitb.org/',                                                   type: 'research' },
    { title: 'Powai Property Trends — MagicBricks',              url: 'https://www.magicbricks.com/property-for-sale-rent-in-Powai/residential-real-estate-Powai', type: 'data' },
  ],
  'thane-west': [
    { title: 'TMC Thane Municipal Corporation Plan',             url: 'https://www.thanecity.gov.in/',                                               type: 'gov'      },
    { title: 'Thane West Price Index — 99acres',                 url: 'https://www.99acres.com/property-in-thane-west-ffid',                         type: 'data'     },
  ],
  'goregaon-east': [
    { title: 'MMRDA Goregaon Development',                       url: 'https://mmrda.maharashtra.gov.in/',                                           type: 'gov'      },
    { title: 'Goregaon East Price Trends — 99acres',             url: 'https://www.99acres.com/property-in-goregaon-east-mumbai-ffid',               type: 'data'     },
  ],

  // ── Chennai ───────────────────────────────────────────────────────────────
  'kelambakkam': [
    { title: 'CMDA Kelambakkam Zone',                            url: 'https://www.cmdachennai.gov.in/',                                             type: 'gov'      },
    { title: 'OMR IT Corridor — TIDCO Tamil Nadu',               url: 'https://www.tidco.com/',                                                      type: 'gov'      },
    { title: 'Kelambakkam Property — 99acres',                   url: 'https://www.99acres.com/property-in-kelambakkam-chennai-ffid',                type: 'data'     },
  ],
  'guduvanchery': [
    { title: 'CMDA Guduvanchery Layout',                         url: 'https://www.cmdachennai.gov.in/',                                             type: 'gov'      },
    { title: 'Guduvanchery Affordable Plots — 99acres',          url: 'https://www.99acres.com/property-in-guduvanchery-chennai-ffid',               type: 'data'     },
  ],
  'sholinganallur': [
    { title: 'CMDA Sholinganallur IT Zone',                      url: 'https://www.cmdachennai.gov.in/',                                             type: 'gov'      },
    { title: 'Sholinganallur OMR Price — MagicBricks',           url: 'https://www.magicbricks.com/property-for-sale-rent-in-Sholinganallur/residential-real-estate-Sholinganallur', type: 'data' },
  ],
  'perumbakkam': [
    { title: 'TNHB Perumbakkam Housing Project',                 url: 'https://www.tnhb.gov.in/',                                                    type: 'gov'      },
    { title: 'Perumbakkam Real Estate — 99acres',                url: 'https://www.99acres.com/property-in-perumbakkam-chennai-ffid',                type: 'data'     },
  ],
  'porur': [
    { title: 'CMDA Porur Zone Development',                      url: 'https://www.cmdachennai.gov.in/',                                             type: 'gov'      },
    { title: 'Porur Price Index — MagicBricks',                  url: 'https://www.magicbricks.com/property-for-sale-rent-in-Porur/residential-real-estate-Porur', type: 'data' },
  ],
  'ambattur': [
    { title: 'SIPCOT Ambattur Industrial Estate',                url: 'https://www.sipcot.com/',                                                     type: 'gov'      },
    { title: 'Ambattur Property Rates — 99acres',                url: 'https://www.99acres.com/property-in-ambattur-chennai-ffid',                   type: 'data'     },
  ],

  // ── Pune ──────────────────────────────────────────────────────────────────
  'hinjewadi': [
    { title: 'MIDC Hinjewadi IT Park',                           url: 'https://www.midcindia.org/',                                                  type: 'gov'      },
    { title: 'Rajiv Gandhi Infotech Park — MCCIA',               url: 'https://www.mcciapune.com/',                                                  type: 'research' },
    { title: 'Hinjewadi Property Market — 99acres',              url: 'https://www.99acres.com/property-in-hinjewadi-pune-ffid',                     type: 'data'     },
  ],
  'kharadi': [
    { title: 'EON IT Park Kharadi — MIDC',                       url: 'https://www.midcindia.org/',                                                  type: 'gov'      },
    { title: 'Kharadi Residential Growth — 99acres',             url: 'https://www.99acres.com/property-in-kharadi-pune-ffid',                       type: 'data'     },
  ],
  'undri': [
    { title: 'PMRDA Undri Peripheral Zone',                      url: 'https://pmrda.gov.in/',                                                       type: 'gov'      },
    { title: 'Undri Affordable Housing — 99acres',               url: 'https://www.99acres.com/property-in-undri-pune-ffid',                         type: 'data'     },
  ],
  'wakad': [
    { title: 'PCMC Wakad Zone',                                  url: 'https://www.pcmcindia.gov.in/',                                               type: 'gov'      },
    { title: 'Wakad Residential Rates — MagicBricks',            url: 'https://www.magicbricks.com/property-for-sale-rent-in-Wakad/residential-real-estate-Wakad', type: 'data' },
  ],
  'baner': [
    { title: 'PMC Baner Zone Regulations',                       url: 'https://pmc.gov.in/',                                                         type: 'gov'      },
    { title: 'Baner Price Index — 99acres',                      url: 'https://www.99acres.com/property-in-baner-pune-ffid',                         type: 'data'     },
  ],
  'hadapsar': [
    { title: 'PMC Hadapsar Industrial & Residential Zone',       url: 'https://pmc.gov.in/',                                                         type: 'gov'      },
    { title: 'Hadapsar Property Trends — 99acres',               url: 'https://www.99acres.com/property-in-hadapsar-pune-ffid',                      type: 'data'     },
  ],

  // ── Delhi NCR ─────────────────────────────────────────────────────────────
  'noida-sector-150': [
    { title: 'Noida Authority — Sector 150 Sports City',         url: 'https://noidaauthority.in/',                                                  type: 'gov'      },
    { title: 'YEIDA — Yamuna Expressway Industrial Authority',   url: 'https://www.yamunaexpresswayauthority.com/',                                  type: 'gov'      },
    { title: 'Noida Sector 150 Price Trends — 99acres',          url: 'https://www.99acres.com/property-in-sector-150-noida-ffid',                   type: 'data'     },
  ],
  'greater-noida-west': [
    { title: 'Greater Noida Authority Official Site',            url: 'https://greaternoidaauthority.in/',                                           type: 'gov'      },
    { title: 'Greater Noida West Market — 99acres',              url: 'https://www.99acres.com/property-in-greater-noida-west-ffid',                 type: 'data'     },
    { title: 'Greater Noida West — MagicBricks',                 url: 'https://www.magicbricks.com/property-for-sale-rent-in-Greater-Noida-West/residential-real-estate-Greater-Noida-West', type: 'data' },
  ],
  'dwarka-expressway': [
    { title: 'NHAI — Dwarka Expressway Project',                 url: 'https://nhai.gov.in/',                                                        type: 'gov'      },
    { title: 'Haryana RERA — Dwarka Expressway Projects',        url: 'https://hrera.in/',                                                           type: 'gov'      },
    { title: 'Dwarka Expressway Property — MagicBricks',         url: 'https://www.magicbricks.com/property-for-sale/residential-real-estate/dwarka-expressway-gurgaon', type: 'data' },
  ],
  'yamuna-expressway': [
    { title: 'YEIDA — Yamuna Expressway Industrial Dev. Auth.',  url: 'https://www.yamunaexpresswayauthority.com/',                                  type: 'gov'      },
    { title: 'Yamuna Expressway Real Estate Trends — 99acres',   url: 'https://www.99acres.com/property-in-yamuna-expressway-ffid',                  type: 'data'     },
  ],
  'sohna-road': [
    { title: 'Haryana RERA — Sohna Road Projects',               url: 'https://hrera.in/',                                                           type: 'gov'      },
    { title: 'HSVP Sohna Development Authority',                 url: 'https://hsvphry.org.in/',                                                     type: 'gov'      },
    { title: 'Sohna Road Gurgaon — MagicBricks',                 url: 'https://www.magicbricks.com/property-for-sale/residential-real-estate/sohna-road-gurgaon', type: 'data' },
  ],
  'faridabad-new-town': [
    { title: 'HSVP Faridabad — Urban Development Authority',     url: 'https://hsvphry.org.in/',                                                     type: 'gov'      },
    { title: 'DMIC — Delhi Mumbai Industrial Corridor Node',     url: 'https://www.dmicproject.com/',                                                type: 'gov'      },
    { title: 'Faridabad Smart City Mission',                     url: 'https://smartcities.gov.in/city/faridabad',                                   type: 'gov'      },
    { title: 'Faridabad Property Rates — 99acres',               url: 'https://www.99acres.com/property-in-faridabad-ffid',                          type: 'data'     },
  ],
}

// ── Per-city default sources ──────────────────────────────────────────────────
// Every area in a city shows these as base references.
// Regulatory (RERA) links are city-specific — no more Telangana RERA for Delhi areas!

const CITY_DEFAULT_SOURCES: Record<string, AreaSource[]> = {
  hyderabad: [
    { title: 'HMDA Master Plan 2031 — Official',          url: 'https://hmda.telangana.gov.in/master-plan',         type: 'gov'      },
    { title: 'RERA Telangana — Verify Before Buying',     url: 'https://rera.telangana.gov.in/',                    type: 'gov'      },
    { title: 'Hyderabad Real Estate Outlook — CREDAI',    url: 'https://www.credaihyderabad.org/',                  type: 'research' },
    { title: 'RBI House Price Index — Hyderabad',         url: 'https://www.rbi.org.in/',                           type: 'research' },
  ],
  bangalore: [
    { title: 'BBMP & BDA Development Plans — Official',   url: 'https://bbmp.gov.in/',                              type: 'gov'      },
    { title: 'RERA Karnataka — Verify Before Buying',     url: 'https://rera.karnataka.gov.in/',                    type: 'gov'      },
    { title: 'Bangalore IT Sector Report — NASSCOM',      url: 'https://nasscom.in/',                               type: 'research' },
    { title: 'RBI House Price Index — Bangalore',         url: 'https://www.rbi.org.in/',                           type: 'research' },
  ],
  mumbai: [
    { title: 'MMRDA Development Plan 2036',               url: 'https://mmrda.maharashtra.gov.in/',                 type: 'gov'      },
    { title: 'MahaRERA — Verify Before Buying',           url: 'https://maharerait.mahaonline.gov.in/',             type: 'gov'      },
    { title: 'Mumbai Real Estate Outlook — CREDAI MCHI',  url: 'https://credai-mchi.com/',                          type: 'research' },
    { title: 'RBI House Price Index — Mumbai',            url: 'https://www.rbi.org.in/',                           type: 'research' },
  ],
  chennai: [
    { title: 'CMDA Second Master Plan — Official',        url: 'https://www.cmdachennai.gov.in/',                   type: 'gov'      },
    { title: 'RERA Tamil Nadu — Verify Before Buying',    url: 'https://www.tnrera.in/',                            type: 'gov'      },
    { title: 'Chennai Real Estate Outlook — CREDAI TN',   url: 'https://credai.org/',                               type: 'research' },
    { title: 'RBI House Price Index — Chennai',           url: 'https://www.rbi.org.in/',                           type: 'research' },
  ],
  pune: [
    { title: 'PMRDA Development Plan 2035',               url: 'https://pmrda.gov.in/',                             type: 'gov'      },
    { title: 'MahaRERA — Pune Projects',                  url: 'https://maharerait.mahaonline.gov.in/',             type: 'gov'      },
    { title: 'Pune Real Estate — CREDAI Pune Metro',      url: 'https://credaipunemetro.org/',                      type: 'research' },
    { title: 'RBI House Price Index — Pune',              url: 'https://www.rbi.org.in/',                           type: 'research' },
  ],
  delhi: [
    { title: 'DDA Master Plan Delhi 2041',                url: 'https://dda.gov.in/planning/master-plan',           type: 'gov'      },
    { title: 'RERA Delhi — Verify Before Buying',         url: 'https://rera.delhi.gov.in/',                        type: 'gov'      },
    { title: 'Haryana RERA (Gurgaon / Faridabad)',        url: 'https://hrera.in/',                                 type: 'gov'      },
    { title: 'UP RERA (Noida / Greater Noida)',           url: 'https://www.up-rera.in/',                           type: 'gov'      },
    { title: 'Delhi NCR Market Report — CREDAI NCR',      url: 'https://www.credaincr.com/',                        type: 'research' },
    { title: 'RBI House Price Index — Delhi NCR',         url: 'https://www.rbi.org.in/',                           type: 'research' },
  ],
}

// ── Exports ───────────────────────────────────────────────────────────────────

/**
 * Returns area-specific sources merged with the correct city's regulatory defaults.
 * Always pass citySlug so Delhi areas show RERA Delhi instead of RERA Telangana.
 */
export function getAreaSources(slug: string, citySlug = 'hyderabad'): AreaSource[] {
  const specific     = AREA_SOURCES[slug] ?? []
  const cityDefaults = CITY_DEFAULT_SOURCES[citySlug] ?? CITY_DEFAULT_SOURCES.hyderabad
  return [...specific, ...cityDefaults]
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
