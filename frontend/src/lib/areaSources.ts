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
  'electronic-city': [
    { title: 'Electronics City Industrial Township — KEONICS',   url: 'https://www.keonics.in/',                                                     type: 'gov'      },
    { title: 'Electronic City Metro & Access Updates — Deccan Herald', url: 'https://www.deccanherald.com/',                                        type: 'news'     },
    { title: 'Electronic City Property Market — 99acres',        url: 'https://www.99acres.com/property-in-electronic-city-bangalore-ffid',         type: 'data'     },
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

const MUMBAI_SOURCE_OVERRIDES: Record<string, AreaSource[]> = {
  'airoli': [
    { title: 'Airoli Node Development - CIDCO / NMMC', url: 'https://cidco.maharashtra.gov.in/', type: 'gov' },
    { title: 'Airoli Commercial Growth - ET Realty', url: 'https://realty.economictimes.indiatimes.com/', type: 'news' },
    { title: 'Airoli Property Market - 99acres', url: 'https://www.99acres.com/property-in-airoli-mumbai-ffid', type: 'data' },
  ],
  'vashi': [
    { title: 'Vashi Node Planning - CIDCO', url: 'https://cidco.maharashtra.gov.in/', type: 'gov' },
    { title: 'Vashi Market Trends - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Vashi/residential-real-estate-Vashi', type: 'data' },
  ],
  'seawoods': [
    { title: 'Seawoods Station Area - CIDCO', url: 'https://cidco.maharashtra.gov.in/', type: 'gov' },
    { title: 'Seawoods Property Market - 99acres', url: 'https://www.99acres.com/property-in-seawoods-mumbai-ffid', type: 'data' },
  ],
  'nerul': [
    { title: 'Nerul Node Planning - CIDCO', url: 'https://cidco.maharashtra.gov.in/', type: 'gov' },
    { title: 'Nerul Property Trends - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Nerul/residential-real-estate-Nerul', type: 'data' },
  ],
  'ulwe': [
    { title: 'Ulwe Airport Influence Zone - CIDCO', url: 'https://cidco.maharashtra.gov.in/', type: 'gov' },
    { title: 'Ulwe Property Market - 99acres', url: 'https://www.99acres.com/property-in-ulwe-mumbai-ffid', type: 'data' },
  ],
  'dombivli-east': [
    { title: 'Dombivli East Regional Planning - MMRDA', url: 'https://mmrda.maharashtra.gov.in/', type: 'gov' },
    { title: 'Dombivli East Property Market - 99acres', url: 'https://www.99acres.com/property-in-dombivli-east-mumbai-ffid', type: 'data' },
  ],
  'kalyan-west': [
    { title: 'Kalyan Regional Planning - MMRDA', url: 'https://mmrda.maharashtra.gov.in/', type: 'gov' },
    { title: 'Kalyan West Property Trends - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Kalyan-West/residential-real-estate-Kalyan-West', type: 'data' },
  ],
  'mira-road': [
    { title: 'Mira Bhayandar Planning - MBMC', url: 'https://www.mbmc.gov.in/', type: 'gov' },
    { title: 'Mira Road Property Market - 99acres', url: 'https://www.99acres.com/property-in-mira-road-mumbai-ffid', type: 'data' },
  ],
  'andheri-east': [
    { title: 'Andheri East Civic Zone - BMC', url: 'https://portal.mcgm.gov.in/', type: 'gov' },
    { title: 'Andheri East Property Trends - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Andheri-East/residential-real-estate-Andheri-East', type: 'data' },
  ],
  'bandra-kurla-complex': [
    { title: 'BKC Planning Updates - MMRDA', url: 'https://mmrda.maharashtra.gov.in/', type: 'gov' },
    { title: 'BKC Office Market - Knight Frank', url: 'https://www.knightfrank.co.in/research', type: 'research' },
  ],
  'worli': [
    { title: 'Worli Coastal Road and Connector Updates - MMRDA', url: 'https://mmrda.maharashtra.gov.in/', type: 'gov' },
    { title: 'Worli Luxury Market - 99acres', url: 'https://www.99acres.com/property-in-worli-mumbai-ffid', type: 'data' },
  ],
  'chembur': [
    { title: 'Chembur Transit and Planning - MMRDA', url: 'https://mmrda.maharashtra.gov.in/', type: 'gov' },
    { title: 'Chembur Property Trends - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Chembur/residential-real-estate-Chembur', type: 'data' },
  ],
  'kandivali-east': [
    { title: 'Kandivali East Civic Zone - BMC', url: 'https://portal.mcgm.gov.in/', type: 'gov' },
    { title: 'Kandivali East Property Market - 99acres', url: 'https://www.99acres.com/property-in-kandivali-east-mumbai-ffid', type: 'data' },
  ],
  'borivali-west': [
    { title: 'Borivali West Civic Zone - BMC', url: 'https://portal.mcgm.gov.in/', type: 'gov' },
    { title: 'Borivali West Property Trends - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Borivali-West/residential-real-estate-Borivali-West', type: 'data' },
  ],
}

const HYDERABAD_SOURCE_OVERRIDES: Record<string, AreaSource[]> = {
  ameenpur: [
    { title: 'Ameenpur HMDA Master Plan References', url: 'https://hmda.telangana.gov.in/master-plan', type: 'gov' },
    { title: 'Ameenpur Residential Market - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Ameenpur/residential-real-estate-Ameenpur', type: 'data' },
    { title: 'Ameenpur Growth Updates - Hyderabad News', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  mokila: [
    { title: 'Mokila HMDA Layout Zone', url: 'https://hmda.telangana.gov.in/', type: 'gov' },
    { title: 'Mokila Plots and Villas - 99acres', url: 'https://www.99acres.com/property-in-mokila-hyderabad-ffid', type: 'data' },
    { title: 'Mokila West Corridor Updates - Hyderabad News', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  bibinagar: [
    { title: 'Bibinagar East Corridor Planning - HMDA', url: 'https://hmda.telangana.gov.in/master-plan', type: 'gov' },
    { title: 'Bibinagar Property Trends - 99acres', url: 'https://www.99acres.com/property-in-bibinagar-hyderabad-ffid', type: 'data' },
    { title: 'Bibinagar Corridor Updates - Hyderabad News', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  tellapur: [
    { title: 'Tellapur HMDA Growth Corridor', url: 'https://hmda.telangana.gov.in/master-plan', type: 'gov' },
    { title: 'Tellapur Residential Market - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Tellapur/residential-real-estate-Tellapur', type: 'data' },
    { title: 'Tellapur Infrastructure Updates - Hyderabad News', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  ghatkesar: [
    { title: 'Ghatkesar East Growth Belt - HMDA', url: 'https://hmda.telangana.gov.in/master-plan', type: 'gov' },
    { title: 'Ghatkesar Property Market - 99acres', url: 'https://www.99acres.com/property-in-ghatkesar-hyderabad-ffid', type: 'data' },
    { title: 'Ghatkesar NH-163 Corridor Updates', url: 'https://www.deccanchronicle.com/nation/current-affairs', type: 'news' },
  ],
  yacharam: [
    { title: 'Yacharam Industrial Corridor - TSIIC', url: 'https://www.tsiic.telangana.gov.in/', type: 'gov' },
    { title: 'Yacharam Property Listings - 99acres', url: 'https://www.99acres.com/property-in-yacharam-hyderabad-ffid', type: 'data' },
    { title: 'Yacharam South Corridor Updates - Hyderabad News', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  medchal: [
    { title: 'Medchal North Growth Corridor - HMDA', url: 'https://hmda.telangana.gov.in/master-plan', type: 'gov' },
    { title: 'Medchal Property Trends - 99acres', url: 'https://www.99acres.com/property-in-medchal-hyderabad-ffid', type: 'data' },
    { title: 'Medchal Logistics and Industrial Updates', url: 'https://www.thehansindia.com/telangana', type: 'news' },
  ],
  shamshabad: [
    { title: 'RGIA Airport Corridor - Official', url: 'https://www.hyderabad.aero/', type: 'gov' },
    { title: 'Shamshabad Property Market - 99acres', url: 'https://www.99acres.com/property-in-shamshabad-hyderabad-ffid', type: 'data' },
    { title: 'Shamshabad Airport Corridor Updates', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  patancheru: [
    { title: 'Patancheru Industrial Area - TSIIC', url: 'https://www.tsiic.telangana.gov.in/', type: 'gov' },
    { title: 'Patancheru Residential Trends - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Patancheru/residential-real-estate-Patancheru', type: 'data' },
    { title: 'Patancheru Industrial Belt Updates', url: 'https://www.deccanchronicle.com/nation/current-affairs', type: 'news' },
  ],
  peerzadiguda: [
    { title: 'Peerzadiguda East Zone Planning - HMDA', url: 'https://hmda.telangana.gov.in/master-plan', type: 'gov' },
    { title: 'Peerzadiguda Property Market - 99acres', url: 'https://www.99acres.com/property-in-peerzadiguda-hyderabad-ffid', type: 'data' },
    { title: 'Peerzadiguda Metro and East Zone Updates', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  'rajendra-nagar': [
    { title: 'Rajendra Nagar Growth Zone - HMDA', url: 'https://hmda.telangana.gov.in/master-plan', type: 'gov' },
    { title: 'Rajendra Nagar Residential Market - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Rajendra-Nagar/residential-real-estate-Rajendra-Nagar', type: 'data' },
    { title: 'Rajendra Nagar Corridor Updates', url: 'https://www.thehansindia.com/telangana', type: 'news' },
  ],
  kompally: [
    { title: 'Kompally North Corridor - HMDA', url: 'https://hmda.telangana.gov.in/master-plan', type: 'gov' },
    { title: 'Kompally Property Trends - 99acres', url: 'https://www.99acres.com/property-in-kompally-hyderabad-ffid', type: 'data' },
    { title: 'Kompally Residential Growth - Hyderabad News', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  'lb-nagar': [
    { title: 'LB Nagar Metro Corridor - HMRL', url: 'https://hmrl.telangana.gov.in/', type: 'gov' },
    { title: 'LB Nagar Property Market - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-LB-Nagar/residential-real-estate-LB-Nagar', type: 'data' },
    { title: 'LB Nagar East Hyderabad Updates', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  madhapur: [
    { title: 'Madhapur Metro and Civic Corridor - HMRL', url: 'https://hmrl.telangana.gov.in/', type: 'gov' },
    { title: 'Madhapur Residential Market - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Madhapur/residential-real-estate-Madhapur', type: 'data' },
    { title: 'Madhapur IT Corridor Updates', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  kukatpally: [
    { title: 'Kukatpally Metro Connectivity - HMRL', url: 'https://hmrl.telangana.gov.in/', type: 'gov' },
    { title: 'Kukatpally Property Trends - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Kukatpally/residential-real-estate-Kukatpally', type: 'data' },
    { title: 'Kukatpally Township and Retail Updates', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  miyapur: [
    { title: 'Miyapur Metro and West Corridor - HMRL', url: 'https://hmrl.telangana.gov.in/', type: 'gov' },
    { title: 'Miyapur Property Market - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Miyapur/residential-real-estate-Miyapur', type: 'data' },
    { title: 'Miyapur Residential Growth - Hyderabad News', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  'banjara-hills': [
    { title: 'Banjara Hills Civic Zone - GHMC', url: 'https://www.ghmc.gov.in/', type: 'gov' },
    { title: 'Banjara Hills Luxury Market - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Banjara-Hills/residential-real-estate-Banjara-Hills', type: 'data' },
    { title: 'Banjara Hills Premium Market Updates', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  'jubilee-hills': [
    { title: 'Jubilee Hills Civic Zone - GHMC', url: 'https://www.ghmc.gov.in/', type: 'gov' },
    { title: 'Jubilee Hills Luxury Market - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Jubilee-Hills/residential-real-estate-Jubilee-Hills', type: 'data' },
    { title: 'Jubilee Hills Premium Market Updates', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  manikonda: [
    { title: 'Manikonda West IT Corridor - HMDA', url: 'https://hmda.telangana.gov.in/master-plan', type: 'gov' },
    { title: 'Manikonda Property Trends - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Manikonda/residential-real-estate-Manikonda', type: 'data' },
    { title: 'Manikonda Residential Growth - Hyderabad News', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  somajiguda: [
    { title: 'Somajiguda Central Zone - GHMC', url: 'https://www.ghmc.gov.in/', type: 'gov' },
    { title: 'Somajiguda Property Market - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Somajiguda/residential-real-estate-Somajiguda', type: 'data' },
    { title: 'Somajiguda Central Business District Updates', url: 'https://www.thehansindia.com/telangana', type: 'news' },
  ],
  begumpet: [
    { title: 'Begumpet Metro and Civic Zone - HMRL', url: 'https://hmrl.telangana.gov.in/', type: 'gov' },
    { title: 'Begumpet Property Market - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Begumpet/residential-real-estate-Begumpet', type: 'data' },
    { title: 'Begumpet Central Hyderabad Updates', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  secunderabad: [
    { title: 'Secunderabad Transit and Civic Zone - GHMC', url: 'https://www.ghmc.gov.in/', type: 'gov' },
    { title: 'Secunderabad Property Trends - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Secunderabad/residential-real-estate-Secunderabad', type: 'data' },
    { title: 'Secunderabad Rail and Metro Updates', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
  uppal: [
    { title: 'Uppal Metro Corridor - HMRL', url: 'https://hmrl.telangana.gov.in/', type: 'gov' },
    { title: 'Uppal Property Market - MagicBricks', url: 'https://www.magicbricks.com/property-for-sale-rent-in-Uppal/residential-real-estate-Uppal', type: 'data' },
    { title: 'Uppal East Corridor Updates - Hyderabad News', url: 'https://timesofindia.indiatimes.com/city/hyderabad', type: 'news' },
  ],
}

// ── Exports ───────────────────────────────────────────────────────────────────

/**
 * Returns area-specific sources merged with the correct city's regulatory defaults.
 * Always pass citySlug so Delhi areas show RERA Delhi instead of RERA Telangana.
 */
export function getAreaSources(slug: string, citySlug = 'hyderabad'): AreaSource[] {
  const overrideSpecific = HYDERABAD_SOURCE_OVERRIDES[slug] ?? MUMBAI_SOURCE_OVERRIDES[slug]
  const specific     = overrideSpecific ?? AREA_SOURCES[slug] ?? []
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
