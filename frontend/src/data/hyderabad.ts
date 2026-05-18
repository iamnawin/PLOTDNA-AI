import type { MicroMarket } from '@/types'
import hydCityJson from '../../../data/cities/hyderabad/city.json'
import hydLocalitiesJson from '../../../data/cities/hyderabad/localities.json'

interface HyderabadCityJson {
  slug: string
  name: string
  state: string
  center: [number, number]
  zoom: number
}

interface HyderabadLocalityJson {
  slug: string
  name: string
  center: [number, number]
  polygon: [number, number][]
}

const hydCity = hydCityJson as unknown as HyderabadCityJson
const hydLocalities = hydLocalitiesJson as unknown as HyderabadLocalityJson[]
const hydLocalityBySlug = new Map(hydLocalities.map(locality => [locality.slug, locality]))

function locality(slug: string): Pick<MicroMarket, 'slug' | 'name' | 'center' | 'polygon'> {
  const record = hydLocalityBySlug.get(slug)
  if (!record) throw new Error(`Missing Hyderabad locality data for ${slug}`)
  return {
    slug: record.slug,
    name: record.name,
    center: record.center,
    polygon: record.polygon,
  }
}

export const hyderabadAreas: MicroMarket[] = [
  {
    ...locality("adibatla"),
      "score": 88,
      "category": "Emerging",
      "signals": {
        "infrastructure": 92,
        "population": 85,
        "satellite": 90,
        "rera": 82,
        "employment": 95,
        "priceVelocity": 88,
        "govtScheme": 95
      },
      "livability": {
        "connectivity": 55,
        "amenities": 40,
        "ecommerce": 70,
        "entertainment": 25,
        "greenSpaces": 65
      },
      "highlights": [
        "Fab City government IT park - 1 lakh+ jobs pipeline",
        "Aerospace & defence manufacturing corridor",
        "ORR direct access at Node 13",
        "Lowest price-to-growth ratio in Hyderabad"
      ],
      "priceRange": "Rs3,500-5,200/sqft",
      "yoy": 35,
      "activeProjects": [
        {
          "id": "adb-001",
          "name": "Fab City Phase 2 - IT SEZ",
          "type": "it_park",
          "status": "under_construction",
          "developer": "TSIIC / Govt of Telangana",
          "investment": "Rs3,500 Cr",
          "expectedCompletion": "2026 Q3",
          "coordinates": [
            17.268,
            78.582
          ],
          "impact": "high",
          "description": "550-acre IT Special Economic Zone targeting 1 lakh+ jobs pipeline"
        },
        {
          "id": "adb-002",
          "name": "Aerospace & Defence SEZ",
          "type": "industrial",
          "status": "approved",
          "developer": "Govt of Telangana",
          "investment": "Rs1,200 Cr",
          "expectedCompletion": "2027 Q2",
          "coordinates": [
            17.258,
            78.568
          ],
          "impact": "high",
          "description": "Dedicated aerospace manufacturing cluster with HAL & DRDO partnerships"
        },
        {
          "id": "adb-003",
          "name": "ORR Node 13 Grade Separator",
          "type": "highway",
          "status": "near_completion",
          "developer": "NHAI / HMDA",
          "investment": "Rs180 Cr",
          "expectedCompletion": "2025 Q2",
          "coordinates": [
            17.278,
            78.554
          ],
          "impact": "medium",
          "description": "Outer Ring Road Node 13 grade separator and service road widening"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("tukkuguda"),
      "score": 84,
      "category": "Emerging",
      "signals": {
        "infrastructure": 88,
        "population": 82,
        "satellite": 86,
        "rera": 80,
        "employment": 85,
        "priceVelocity": 80,
        "govtScheme": 88
      },
      "livability": {
        "connectivity": 48,
        "amenities": 38,
        "ecommerce": 65,
        "entertainment": 22,
        "greenSpaces": 60
      },
      "highlights": [
        "NIMZ - National Investment & Manufacturing Zone",
        "Adjacent to Adibatla growth node",
        "Data centre corridor under development",
        "ORR Node 12 - 2.5km radius"
      ],
      "priceRange": "Rs3,200-4,800/sqft",
      "yoy": 30,
      "activeProjects": [
        {
          "id": "tuk-001",
          "name": "NIMZ Phase 1 Core Infrastructure",
          "type": "industrial",
          "status": "under_construction",
          "developer": "NICDC / TSIIC",
          "investment": "Rs2,800 Cr",
          "expectedCompletion": "2026 Q4",
          "coordinates": [
            17.228,
            78.582
          ],
          "impact": "high",
          "description": "National Investment & Manufacturing Zone - roads, water, and power grid setup"
        },
        {
          "id": "tuk-002",
          "name": "Hyperscale Data Centre Campus",
          "type": "commercial",
          "status": "approved",
          "developer": "NTT Data / CtrlS",
          "investment": "Rs900 Cr",
          "expectedCompletion": "2027 Q1",
          "coordinates": [
            17.22,
            78.572
          ],
          "impact": "high",
          "description": "100MW data centre with Tier 4 certification, 400 direct jobs"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("kokapet"),
      "score": 81,
      "category": "High Growth",
      "signals": {
        "infrastructure": 88,
        "population": 82,
        "satellite": 85,
        "rera": 78,
        "employment": 80,
        "priceVelocity": 70,
        "govtScheme": 68
      },
      "livability": {
        "connectivity": 78,
        "amenities": 72,
        "ecommerce": 88,
        "entertainment": 68,
        "greenSpaces": 45
      },
      "highlights": [
        "Radiance 15M township - city within a city",
        "ORR Node 7 frontage with direct access",
        "Phase IV Metro alignment planned",
        "Emerging luxury residential corridor"
      ],
      "priceRange": "Rs6,000-9,500/sqft",
      "yoy": 22,
      "activeProjects": [
        {
          "id": "kok-001",
          "name": "Metro Phase IV - Kokapet Extension",
          "type": "metro",
          "status": "approved",
          "developer": "HMRL / Govt of Telangana",
          "investment": "Rs4,200 Cr",
          "expectedCompletion": "2027 Q4",
          "coordinates": [
            17.393,
            78.338
          ],
          "impact": "high",
          "description": "Metro rail from Raidurg to Kokapet Node - 8.2 km elevated corridor"
        },
        {
          "id": "kok-002",
          "name": "Radiance 15M - Luxury Township",
          "type": "residential",
          "status": "under_construction",
          "developer": "Radiance Realty",
          "investment": "Rs1,800 Cr",
          "expectedCompletion": "2026 Q2",
          "coordinates": [
            17.384,
            78.326
          ],
          "impact": "medium",
          "description": "15 million sqft integrated township - apartments, villas, and commercial"
        },
        {
          "id": "kok-003",
          "name": "ORR Node 7 Commercial Hub",
          "type": "commercial",
          "status": "under_construction",
          "investment": "Rs650 Cr",
          "expectedCompletion": "2025 Q4",
          "coordinates": [
            17.376,
            78.314
          ],
          "impact": "medium",
          "description": "Grade-A office and retail complex at Outer Ring Road junction"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("shankarpally"),
      "score": 78,
      "category": "Emerging",
      "signals": {
        "infrastructure": 82,
        "population": 75,
        "satellite": 80,
        "rera": 72,
        "employment": 76,
        "priceVelocity": 70,
        "govtScheme": 80
      },
      "livability": {
        "connectivity": 52,
        "amenities": 42,
        "ecommerce": 55,
        "entertainment": 20,
        "greenSpaces": 88
      },
      "highlights": [
        "Eco-buffer zone - forest cover protects premium appeal",
        "NIMZ proximity driving residential demand",
        "Weekend resort & villa corridor boom",
        "ORR Node development approved"
      ],
      "priceRange": "Rs3,200-5,000/sqft",
      "yoy": 22,
      "activeProjects": [
        {
          "id": "sha-eco-001",
          "name": "Shankarpally Eco Township Access Road",
          "type": "highway",
          "status": "under_construction",
          "developer": "HMDA",
          "investment": "Rs160 Cr",
          "expectedCompletion": "2026 Q2",
          "coordinates": [
            17.372,
            78.18
          ],
          "impact": "medium",
          "description": "Connector road and junction improvements serving new villa communities emerging around the Shankarpally belt"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("narsingi"),
      "score": 76,
      "category": "High Growth",
      "signals": {
        "infrastructure": 80,
        "population": 75,
        "satellite": 78,
        "rera": 72,
        "employment": 75,
        "priceVelocity": 68,
        "govtScheme": 62
      },
      "livability": {
        "connectivity": 70,
        "amenities": 65,
        "ecommerce": 82,
        "entertainment": 60,
        "greenSpaces": 55
      },
      "highlights": [
        "Adjacency to Financial District at lower price point",
        "Township projects by Prestige & Lodha incoming",
        "Outer Ring Road Node 8 connectivity",
        "Rapid built-up expansion - 90% satellite growth"
      ],
      "priceRange": "Rs5,200-7,800/sqft",
      "yoy": 18,
      "activeProjects": [
        {
          "id": "nar-001",
          "name": "Prestige Somerville - Township",
          "type": "residential",
          "status": "under_construction",
          "developer": "Prestige Group",
          "investment": "Rs1,500 Cr",
          "expectedCompletion": "2026 Q3",
          "coordinates": [
            17.352,
            78.37
          ],
          "impact": "high",
          "description": "3,200 apartment units across 35 acres - Narsingi largest project"
        },
        {
          "id": "nar-002",
          "name": "Lodha Belmondo - Luxury Villas",
          "type": "residential",
          "status": "approved",
          "developer": "Lodha Group",
          "investment": "Rs900 Cr",
          "expectedCompletion": "2027 Q1",
          "coordinates": [
            17.342,
            78.356
          ],
          "impact": "medium",
          "description": "Low-density luxury villa community with 18-hole golf course"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("ameenpur"),
      "score": 75,
      "category": "Emerging",
      "signals": {
        "infrastructure": 78,
        "population": 72,
        "satellite": 76,
        "rera": 72,
        "employment": 74,
        "priceVelocity": 68,
        "govtScheme": 72
      },
      "livability": {
        "connectivity": 60,
        "amenities": 52,
        "ecommerce": 70,
        "entertainment": 35,
        "greenSpaces": 72
      },
      "highlights": [
        "ORR direct connectivity to HITEC City - 25 min",
        "Upcoming integrated township by Aparna Group",
        "Affordable luxury price band - high ROI potential",
        "HMDA Master Plan 2031 inclusion"
      ],
      "priceRange": "Rs3,600-5,500/sqft",
      "yoy": 20,
      "activeProjects": [
        {
          "id": "ame-001",
          "name": "Ameenpur Lakefront Township",
          "type": "residential",
          "status": "under_construction",
          "developer": "Private developer",
          "investment": "Rs780 Cr",
          "expectedCompletion": "2027 Q1",
          "coordinates": [
            17.492,
            78.289
          ],
          "impact": "medium",
          "description": "Mid-rise residential township planned to capture west-corridor spillover near the Ameenpur lake belt"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("mokila"),
      "score": 74,
      "category": "High Growth",
      "signals": {
        "infrastructure": 80,
        "population": 72,
        "satellite": 76,
        "rera": 70,
        "employment": 74,
        "priceVelocity": 67,
        "govtScheme": 62
      },
      "livability": {
        "connectivity": 48,
        "amenities": 38,
        "ecommerce": 55,
        "entertainment": 20,
        "greenSpaces": 82
      },
      "highlights": [
        "ORR extension planned through Mokila corridor",
        "Weekend & second-home market boom",
        "Gated villa community launches 2024-25",
        "Manjeera valley proximity - natural asset"
      ],
      "priceRange": "Rs3,800-5,500/sqft",
      "yoy": 20,
      "activeProjects": [
        {
          "id": "mok-001",
          "name": "Mokila Villa Cluster Phase 2",
          "type": "residential",
          "status": "under_construction",
          "developer": "Private developer",
          "investment": "Rs860 Cr",
          "expectedCompletion": "2027 Q3",
          "coordinates": [
            17.412,
            78.246
          ],
          "impact": "medium",
          "description": "Large villa-cluster expansion aimed at second-home and premium end-user demand along the Mokila corridor"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("bibinagar"),
      "score": 73,
      "category": "Emerging",
      "signals": {
        "infrastructure": 76,
        "population": 70,
        "satellite": 74,
        "rera": 70,
        "employment": 72,
        "priceVelocity": 65,
        "govtScheme": 72
      },
      "livability": {
        "connectivity": 55,
        "amenities": 45,
        "ecommerce": 58,
        "entertainment": 30,
        "greenSpaces": 50
      },
      "highlights": [
        "IIM Hyderabad campus proximity",
        "BHEL satellite township demand driver",
        "NH-163 national highway frontage",
        "Affordable entry - east Hyderabad corridor"
      ],
      "priceRange": "Rs2,400-3,800/sqft",
      "yoy": 18,
      "activeProjects": [
        {
          "id": "bib-001",
          "name": "Bibinagar Education and Medical Cluster",
          "type": "infrastructure",
          "status": "approved",
          "developer": "State agencies",
          "investment": "Rs640 Cr",
          "expectedCompletion": "2027 Q4",
          "coordinates": [
            17.484,
            78.804
          ],
          "impact": "medium",
          "description": "Institutional cluster supporting long-term demand around the east-corridor growth belt near Bibinagar"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("tellapur"),
      "score": 72,
      "category": "High Growth",
      "signals": {
        "infrastructure": 76,
        "population": 70,
        "satellite": 72,
        "rera": 68,
        "employment": 72,
        "priceVelocity": 65,
        "govtScheme": 58
      },
      "livability": {
        "connectivity": 65,
        "amenities": 60,
        "ecommerce": 78,
        "entertainment": 52,
        "greenSpaces": 58
      },
      "highlights": [
        "BHEL township - steady rental demand",
        "Metro Phase III alignment proposed",
        "KIMS Hospital corridor emerging",
        "IT corridor spillover from Miyapur"
      ],
      "priceRange": "Rs4,200-6,500/sqft",
      "yoy": 19,
      "activeProjects": [
        {
          "id": "tel-001",
          "name": "Tellapur Link Road Widening",
          "type": "highway",
          "status": "under_construction",
          "developer": "GHMC / HMDA",
          "investment": "Rs240 Cr",
          "expectedCompletion": "2026 Q1",
          "coordinates": [
            17.421,
            78.284
          ],
          "impact": "medium",
          "description": "Junction upgrades and road widening improving access to Lingampally, BHEL, and the ORR approach roads"
        },
        {
          "id": "tel-002",
          "name": "Tellapur Commercial Commons",
          "type": "commercial",
          "status": "approved",
          "developer": "Private consortium",
          "investment": "Rs850 Cr",
          "expectedCompletion": "2027 Q2",
          "coordinates": [
            17.414,
            78.269
          ],
          "impact": "medium",
          "description": "Neighborhood office, retail, and medical-services cluster aimed at capturing west-corridor spillover demand"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("ghatkesar"),
      "score": 71,
      "category": "Emerging",
      "signals": {
        "infrastructure": 74,
        "population": 68,
        "satellite": 72,
        "rera": 68,
        "employment": 70,
        "priceVelocity": 62,
        "govtScheme": 65
      },
      "livability": {
        "connectivity": 52,
        "amenities": 42,
        "ecommerce": 60,
        "entertainment": 28,
        "greenSpaces": 48
      },
      "highlights": [
        "Warangal NH-163 corridor - strategic location",
        "TSIIC industrial zone active",
        "Metro DPR east extension mentions Ghatkesar",
        "Lowest prices in east Hyderabad growth belt"
      ],
      "priceRange": "Rs2,600-3,800/sqft",
      "yoy": 17,
      "activeProjects": [
        {
          "id": "gha-001",
          "name": "Ghatkesar East Logistics Park",
          "type": "industrial",
          "status": "approved",
          "developer": "TSIIC",
          "investment": "Rs520 Cr",
          "expectedCompletion": "2027 Q2",
          "coordinates": [
            17.459,
            78.748
          ],
          "impact": "high",
          "description": "Warehouse and light-industrial cluster reinforcing NH-163 connectivity and east-corridor employment demand"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("yacharam"),
      "score": 69,
      "category": "Emerging",
      "signals": {
        "infrastructure": 72,
        "population": 65,
        "satellite": 70,
        "rera": 65,
        "employment": 68,
        "priceVelocity": 60,
        "govtScheme": 68
      },
      "livability": {
        "connectivity": 42,
        "amenities": 35,
        "ecommerce": 48,
        "entertainment": 18,
        "greenSpaces": 55
      },
      "highlights": [
        "Southern growth corridor - NIMZ spillover",
        "Pharma & logistics hub under planning",
        "NH-44 connectivity 8km",
        "Ultra-affordable entry - maximum upside window"
      ],
      "priceRange": "Rs2,200-3,500/sqft",
      "yoy": 15,
      "activeProjects": [
        {
          "id": "yac-001",
          "name": "Yacharam Pharma Logistics Hub",
          "type": "industrial",
          "status": "approved",
          "developer": "TSIIC",
          "investment": "Rs690 Cr",
          "expectedCompletion": "2027 Q3",
          "coordinates": [
            17.198,
            78.588
          ],
          "impact": "high",
          "description": "Land aggregation and trunk infrastructure for logistics and pharma-linked industrial demand in south Hyderabad"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("medchal"),
      "score": 68,
      "category": "High Growth",
      "signals": {
        "infrastructure": 72,
        "population": 65,
        "satellite": 70,
        "rera": 65,
        "employment": 65,
        "priceVelocity": 60,
        "govtScheme": 65
      },
      "livability": {
        "connectivity": 58,
        "amenities": 50,
        "ecommerce": 65,
        "entertainment": 35,
        "greenSpaces": 65
      },
      "highlights": [
        "HMDA extended master plan zone",
        "Pharma belt proximity - rental demand",
        "ORR Node 15 frontage",
        "Logistics park clearance received"
      ],
      "priceRange": "Rs3,800-5,500/sqft",
      "yoy": 15,
      "activeProjects": [
        {
          "id": "med-001",
          "name": "Medchal Logistics Park",
          "type": "industrial",
          "status": "under_construction",
          "developer": "Private logistics developer",
          "investment": "Rs730 Cr",
          "expectedCompletion": "2026 Q4",
          "coordinates": [
            17.626,
            78.492
          ],
          "impact": "high",
          "description": "Integrated warehousing and truck-terminal project leveraging Medchal's industrial and ORR adjacency"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("shamshabad"),
      "score": 66,
      "category": "High Growth",
      "signals": {
        "infrastructure": 70,
        "population": 62,
        "satellite": 68,
        "rera": 62,
        "employment": 65,
        "priceVelocity": 58,
        "govtScheme": 62
      },
      "livability": {
        "connectivity": 62,
        "amenities": 48,
        "ecommerce": 72,
        "entertainment": 38,
        "greenSpaces": 42
      },
      "highlights": [
        "Aerotropolis development plan - airport city",
        "Rajiv Gandhi International Airport corridor",
        "Logistics & warehousing boom",
        "NH-44 national highway direct frontage"
      ],
      "priceRange": "Rs3,500-5,200/sqft",
      "yoy": 14,
      "activeProjects": [
        {
          "id": "sha-001",
          "name": "RGIA Terminal 2 Expansion",
          "type": "airport",
          "status": "under_construction",
          "developer": "GMR Airports",
          "investment": "Rs5,500 Cr",
          "expectedCompletion": "2028 Q2",
          "coordinates": [
            17.237,
            78.418
          ],
          "impact": "high",
          "description": "New terminal doubling capacity to 75 million passengers/year"
        },
        {
          "id": "sha-002",
          "name": "Aerotropolis - Airport City",
          "type": "commercial",
          "status": "approved",
          "developer": "GMR Airports / HMDA",
          "investment": "Rs12,000 Cr",
          "expectedCompletion": "2030 Q1",
          "coordinates": [
            17.245,
            78.43
          ],
          "impact": "high",
          "description": "6,000-acre airport city with hotels, IT parks, logistics, and retail"
        },
        {
          "id": "sha-003",
          "name": "NH-44 6-Lane Widening",
          "type": "highway",
          "status": "near_completion",
          "developer": "NHAI",
          "investment": "Rs420 Cr",
          "expectedCompletion": "2025 Q3",
          "coordinates": [
            17.252,
            78.412
          ],
          "impact": "medium",
          "description": "National highway widening from 4 to 6 lanes with grade separators"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("financial-district"),
      "score": 62,
      "category": "Established",
      "signals": {
        "infrastructure": 65,
        "population": 55,
        "satellite": 60,
        "rera": 70,
        "employment": 85,
        "priceVelocity": 55,
        "govtScheme": 45
      },
      "livability": {
        "connectivity": 95,
        "amenities": 88,
        "ecommerce": 95,
        "entertainment": 90,
        "greenSpaces": 22
      },
      "highlights": [
        "IT employment hub - Amazon, Google, Microsoft",
        "Metro Phase II operational - direct access",
        "Premium rental yields 4-5% annually",
        "Limited land - growth constrained by saturation"
      ],
      "priceRange": "Rs8,500-12,000/sqft",
      "yoy": 8,
      "activeProjects": [
        {
          "id": "fd-001",
          "name": "Metro Phase IV - Financial District Station",
          "type": "metro",
          "status": "approved",
          "developer": "HMRL",
          "investment": "Rs1,100 Cr",
          "expectedCompletion": "2027 Q4",
          "coordinates": [
            17.424,
            78.364
          ],
          "impact": "high",
          "description": "New metro station connecting Financial District to extended Phase IV line"
        },
        {
          "id": "fd-002",
          "name": "Prestige South City - Mixed-Use Tower",
          "type": "commercial",
          "status": "under_construction",
          "developer": "Prestige Group",
          "investment": "Rs2,200 Cr",
          "expectedCompletion": "2026 Q1",
          "coordinates": [
            17.417,
            78.356
          ],
          "impact": "medium",
          "description": "40-floor Grade-A office tower with ground-level retail, 3M sqft"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("patancheru"),
      "score": 61,
      "category": "Industrial",
      "signals": {
        "infrastructure": 62,
        "population": 58,
        "satellite": 62,
        "rera": 62,
        "employment": 72,
        "priceVelocity": 52,
        "govtScheme": 55
      },
      "livability": {
        "connectivity": 55,
        "amenities": 45,
        "ecommerce": 62,
        "entertainment": 28,
        "greenSpaces": 38
      },
      "highlights": [
        "IDA Patancheru - major industrial zone",
        "Pharma & chemical belt - stable rental base",
        "Hyderabad-Pune highway NH-65 frontage",
        "Residential demand driven by 50k+ workers"
      ],
      "priceRange": "Rs2,800-4,200/sqft",
      "yoy": 9,
      "activeProjects": [
        {
          "id": "pat-001",
          "name": "Patancheru Industrial Cluster Expansion",
          "type": "industrial",
          "status": "under_construction",
          "developer": "TSIIC",
          "investment": "Rs1,100 Cr",
          "expectedCompletion": "2027 Q1",
          "coordinates": [
            17.536,
            78.235
          ],
          "impact": "high",
          "description": "Additional industrial sheds, utility lines, and internal roads extending the Patancheru manufacturing belt"
        },
        {
          "id": "pat-002",
          "name": "NH-65 Patancheru Service Road Upgrade",
          "type": "highway",
          "status": "near_completion",
          "developer": "NHAI",
          "investment": "Rs190 Cr",
          "expectedCompletion": "2025 Q4",
          "coordinates": [
            17.527,
            78.252
          ],
          "impact": "medium",
          "description": "Service road, junction, and drainage upgrades along the Patancheru stretch of NH-65"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("peerzadiguda"),
      "score": 70,
      "category": "Emerging",
      "signals": {
        "infrastructure": 74,
        "population": 68,
        "satellite": 71,
        "rera": 66,
        "employment": 70,
        "priceVelocity": 62,
        "govtScheme": 65
      },
      "livability": {
        "connectivity": 68,
        "amenities": 58,
        "ecommerce": 72,
        "entertainment": 48,
        "greenSpaces": 40
      },
      "highlights": [
        "Metro Blue Line end station - connectivity premium",
        "East IT SEZ proximity",
        "Nacharam industrial area demand driver",
        "East Hyderabad growth corridor node"
      ],
      "priceRange": "Rs2,800-4,500/sqft",
      "yoy": 16,
      "activeProjects": [
        {
          "id": "pee-001",
          "name": "Peerzadiguda East Access Upgrade",
          "type": "highway",
          "status": "under_construction",
          "developer": "GHMC",
          "investment": "Rs140 Cr",
          "expectedCompletion": "2025 Q4",
          "coordinates": [
            17.472,
            78.628
          ],
          "impact": "medium",
          "description": "Link-road and drainage upgrade improving approach access toward the eastern residential growth belt"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("rajendra-nagar"),
      "score": 58,
      "category": "Established",
      "signals": {
        "infrastructure": 60,
        "population": 55,
        "satellite": 58,
        "rera": 60,
        "employment": 62,
        "priceVelocity": 52,
        "govtScheme": 45
      },
      "livability": {
        "connectivity": 72,
        "amenities": 78,
        "ecommerce": 80,
        "entertainment": 72,
        "greenSpaces": 45
      },
      "highlights": [
        "Established residential - good schools & hospitals",
        "Near BHEL township & Outer Ring Road",
        "High density limits large new developments",
        "Stable market with modest appreciation"
      ],
      "priceRange": "Rs5,500-8,000/sqft",
      "yoy": 10,
      "activeProjects": [
        {
          "id": "raj-001",
          "name": "Rajendra Nagar Inner Ring Upgrade",
          "type": "highway",
          "status": "near_completion",
          "developer": "GHMC / HMDA",
          "investment": "Rs170 Cr",
          "expectedCompletion": "2025 Q3",
          "coordinates": [
            17.314,
            78.417
          ],
          "impact": "medium",
          "description": "Road strengthening, service-lane, and junction work supporting residential movement around Rajendra Nagar"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("kompally"),
      "score": 55,
      "category": "Established",
      "signals": {
        "infrastructure": 58,
        "population": 52,
        "satellite": 55,
        "rera": 58,
        "employment": 55,
        "priceVelocity": 48,
        "govtScheme": 42
      },
      "livability": {
        "connectivity": 62,
        "amenities": 68,
        "ecommerce": 70,
        "entertainment": 55,
        "greenSpaces": 52
      },
      "highlights": [
        "North Hyderabad established residential belt",
        "Traffic infrastructure gaps - commute friction",
        "Near ORR Node 12 but no direct access",
        "Moderate appreciation - low volatility"
      ],
      "priceRange": "Rs4,500-7,000/sqft",
      "yoy": 8,
      "activeProjects": [
        {
          "id": "kom-001",
          "name": "Kompally ORR Feeder Road Upgrade",
          "type": "highway",
          "status": "under_construction",
          "developer": "GHMC / HMDA",
          "investment": "Rs210 Cr",
          "expectedCompletion": "2026 Q2",
          "coordinates": [
            17.551,
            78.474
          ],
          "impact": "medium",
          "description": "Road widening and junction redesign to reduce congestion between Kompally, Suchitra, and ORR approaches"
        },
        {
          "id": "kom-002",
          "name": "Kompally Northgate Retail Plaza",
          "type": "commercial",
          "status": "approved",
          "developer": "Private developer",
          "investment": "Rs320 Cr",
          "expectedCompletion": "2027 Q1",
          "coordinates": [
            17.54,
            78.486
          ],
          "impact": "medium",
          "description": "Organized retail and office block planned along the north residential belt to improve local amenities"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("lb-nagar"),
      "score": 54,
      "category": "Established",
      "signals": {
        "infrastructure": 56,
        "population": 52,
        "satellite": 54,
        "rera": 56,
        "employment": 55,
        "priceVelocity": 48,
        "govtScheme": 40
      },
      "livability": {
        "connectivity": 78,
        "amenities": 82,
        "ecommerce": 85,
        "entertainment": 78,
        "greenSpaces": 32
      },
      "highlights": [
        "Metro Blue Line access - commuter connectivity",
        "Near Ramoji Film City - tourism premium",
        "High density & traffic limits growth ceiling",
        "Mature market - best for rental income"
      ],
      "priceRange": "Rs5,000-7,500/sqft",
      "yoy": 7,
      "activeProjects": [
        {
          "id": "lbn-001",
          "name": "LB Nagar Junction Flyover Upgrade",
          "type": "flyover",
          "status": "under_construction",
          "developer": "GHMC",
          "investment": "Rs260 Cr",
          "expectedCompletion": "2026 Q1",
          "coordinates": [
            17.349,
            78.551
          ],
          "impact": "high",
          "description": "Flyover ramp and traffic-channelization upgrade easing movement across the LB Nagar interchange"
        },
        {
          "id": "lbn-002",
          "name": "LB Nagar Transit Terminal Modernisation",
          "type": "infrastructure",
          "status": "approved",
          "developer": "TSRTC / GHMC",
          "investment": "Rs340 Cr",
          "expectedCompletion": "2027 Q2",
          "coordinates": [
            17.342,
            78.54
          ],
          "impact": "medium",
          "description": "Integrated bus terminal and passenger concourse upgrade supporting commuter demand in east Hyderabad"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("shadnagar"),
      "score": 79,
      "category": "Emerging",
      "signals": {
        "infrastructure": 82,
        "population": 75,
        "satellite": 80,
        "rera": 75,
        "employment": 78,
        "priceVelocity": 72,
        "govtScheme": 82
      },
      "livability": {
        "connectivity": 45,
        "amenities": 38,
        "ecommerce": 50,
        "entertainment": 22,
        "greenSpaces": 58
      },
      "highlights": [
        "PHARMA City - 68,000 acre industrial township",
        "NH-44 direct connectivity to city",
        "Airport 30km - logistics premium",
        "Lowest price point in high-growth corridor"
      ],
      "priceRange": "Rs2,800-4,200/sqft",
      "yoy": 25,
      "activeProjects": [
        {
          "id": "shd-001",
          "name": "Shadnagar Pharma City Connector",
          "type": "infrastructure",
          "status": "under_construction",
          "developer": "State agencies",
          "investment": "Rs610 Cr",
          "expectedCompletion": "2026 Q4",
          "coordinates": [
            17.071,
            78.223
          ],
          "impact": "high",
          "description": "Utility and road connectivity package strengthening the Shadnagar approach to the broader pharma-industrial corridor"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("gachibowli"),
      "score": 82,
      "category": "High Growth",
      "signals": {
        "infrastructure": 88,
        "population": 84,
        "satellite": 86,
        "rera": 78,
        "employment": 95,
        "priceVelocity": 72,
        "govtScheme": 70
      },
      "livability": {
        "connectivity": 82,
        "amenities": 80,
        "ecommerce": 90,
        "entertainment": 72,
        "greenSpaces": 55
      },
      "highlights": [
        "University of Hyderabad & ISB anchor employment",
        "Outer Ring Road junction - 20 min to airport",
        "Major IT campuses: TCS, Deloitte, Amazon",
        "Strong rental yield from tech workforce"
      ],
      "priceRange": "Rs7,500-12,000/sqft",
      "yoy": 14,
      "activeProjects": [
        {
          "id": "gac-001",
          "name": "Gachibowli Metro Extension",
          "type": "metro",
          "status": "approved",
          "developer": "HMRL / Govt of Telangana",
          "investment": "Rs2,100 Cr",
          "expectedCompletion": "2027 Q4",
          "coordinates": [
            17.441,
            78.35
          ],
          "impact": "high",
          "description": "Phase 2 metro extension connecting Gachibowli to Raidurg and Financial District"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("madhapur"),
      "score": 80,
      "category": "High Growth",
      "signals": {
        "infrastructure": 86,
        "population": 82,
        "satellite": 84,
        "rera": 76,
        "employment": 92,
        "priceVelocity": 70,
        "govtScheme": 68
      },
      "livability": {
        "connectivity": 85,
        "amenities": 82,
        "ecommerce": 92,
        "entertainment": 78,
        "greenSpaces": 48
      },
      "highlights": [
        "HITEC City adjacency - highest IT employment density",
        "Metro Line 1: Madhapur & Durgam Cheruvu stations",
        "Inorbit Mall, retail & entertainment hub",
        "Preferred rental market for IT professionals"
      ],
      "priceRange": "Rs7,000-11,500/sqft",
      "yoy": 12,
      "activeProjects": [
        {
          "id": "mad-001",
          "name": "Durgam Cheruvu Cable Bridge widening",
          "type": "highway",
          "status": "near_completion",
          "developer": "GHMC",
          "investment": "Rs85 Cr",
          "expectedCompletion": "2025 Q3",
          "coordinates": [
            17.448,
            78.385
          ],
          "impact": "medium",
          "description": "Widening of cable bridge improving connectivity between Madhapur and Jubilee Hills"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("kondapur"),
      "score": 78,
      "category": "Established",
      "signals": {
        "infrastructure": 82,
        "population": 80,
        "satellite": 80,
        "rera": 74,
        "employment": 85,
        "priceVelocity": 68,
        "govtScheme": 62
      },
      "livability": {
        "connectivity": 80,
        "amenities": 78,
        "ecommerce": 88,
        "entertainment": 68,
        "greenSpaces": 52
      },
      "highlights": [
        "Preferred residential zone for HITEC City workforce",
        "Metro station: Kondapur on Line 2 corridor",
        "High density of schools and hospitals",
        "Steady appreciation due to IT demand overspill"
      ],
      "priceRange": "Rs6,500-10,000/sqft",
      "yoy": 11,
      "activeProjects": [
        {
          "id": "kon-001",
          "name": "Kondapur Civic Spine Upgrade",
          "type": "flyover",
          "status": "under_construction",
          "developer": "GHMC",
          "investment": "Rs210 Cr",
          "expectedCompletion": "2026 Q2",
          "coordinates": [
            17.463,
            78.366
          ],
          "impact": "medium",
          "description": "Flyover and junction improvements across the Kondapur civic spine to ease movement toward HITEC City"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("kukatpally"),
      "score": 75,
      "category": "Established",
      "signals": {
        "infrastructure": 80,
        "population": 88,
        "satellite": 76,
        "rera": 72,
        "employment": 78,
        "priceVelocity": 65,
        "govtScheme": 60
      },
      "livability": {
        "connectivity": 88,
        "amenities": 82,
        "ecommerce": 90,
        "entertainment": 70,
        "greenSpaces": 42
      },
      "highlights": [
        "Metro Line 1 terminus - direct HITEC City connectivity",
        "KPHB - one of Hyderabad's largest planned townships",
        "Strong mid-income housing demand",
        "Forum Sujana Mall - major retail anchor"
      ],
      "priceRange": "Rs5,500-8,500/sqft",
      "yoy": 10,
      "activeProjects": [
        {
          "id": "kuk-001",
          "name": "KPHB Junction Mobility Upgrade",
          "type": "flyover",
          "status": "under_construction",
          "developer": "GHMC",
          "investment": "Rs290 Cr",
          "expectedCompletion": "2026 Q1",
          "coordinates": [
            17.493,
            78.404
          ],
          "impact": "high",
          "description": "Signal-free corridor and junction redesign focused on easing peak-hour traffic around the KPHB interchange"
        },
        {
          "id": "kuk-002",
          "name": "Kukatpally Commercial Annex",
          "type": "commercial",
          "status": "approved",
          "developer": "Private consortium",
          "investment": "Rs600 Cr",
          "expectedCompletion": "2027 Q3",
          "coordinates": [
            17.499,
            78.395
          ],
          "impact": "medium",
          "description": "New office and retail block extending the established commercial spine around KPHB and Forum Mall"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("miyapur"),
      "score": 70,
      "category": "Established",
      "signals": {
        "infrastructure": 75,
        "population": 82,
        "satellite": 72,
        "rera": 66,
        "employment": 72,
        "priceVelocity": 60,
        "govtScheme": 58
      },
      "livability": {
        "connectivity": 80,
        "amenities": 70,
        "ecommerce": 82,
        "entertainment": 58,
        "greenSpaces": 48
      },
      "highlights": [
        "Metro Line 1 western end - strong transit connectivity",
        "Affordable entry point near IT corridor",
        "Growing residential demand from Kukatpally overspill",
        "ORR access for airport and outskirts"
      ],
      "priceRange": "Rs4,500-7,000/sqft",
      "yoy": 10,
      "activeProjects": [
        {
          "id": "miy-001",
          "name": "Miyapur Multimodal Transit Hub",
          "type": "infrastructure",
          "status": "under_construction",
          "developer": "HMRL / TSRTC",
          "investment": "Rs420 Cr",
          "expectedCompletion": "2026 Q4",
          "coordinates": [
            17.498,
            78.352
          ],
          "impact": "high",
          "description": "Metro, bus, and parking integration project designed to improve commuter interchange efficiency at Miyapur"
        },
        {
          "id": "miy-002",
          "name": "Miyapur West Township Phase 1",
          "type": "residential",
          "status": "approved",
          "developer": "Private developer",
          "investment": "Rs950 Cr",
          "expectedCompletion": "2027 Q2",
          "coordinates": [
            17.49,
            78.34
          ],
          "impact": "medium",
          "description": "Large-format mid-income township adding residential supply along the west metro corridor"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("banjara-hills"),
      "score": 72,
      "category": "Established",
      "signals": {
        "infrastructure": 88,
        "population": 70,
        "satellite": 76,
        "rera": 60,
        "employment": 72,
        "priceVelocity": 58,
        "govtScheme": 50
      },
      "livability": {
        "connectivity": 82,
        "amenities": 95,
        "ecommerce": 92,
        "entertainment": 88,
        "greenSpaces": 60
      },
      "highlights": [
        "Most established premium residential address in Hyderabad",
        "High density of hospitals, fine dining, luxury retail",
        "Road No. 12 & 36 - commercial spine of the city",
        "Limited new supply keeps resale values stable"
      ],
      "priceRange": "Rs8,000-14,000/sqft",
      "yoy": 8,
      "activeProjects": [
        {
          "id": "ban-001",
          "name": "Banjara Hills Streetscape Upgrade",
          "type": "infrastructure",
          "status": "near_completion",
          "developer": "GHMC",
          "investment": "Rs95 Cr",
          "expectedCompletion": "2025 Q2",
          "coordinates": [
            17.419,
            78.439
          ],
          "impact": "low",
          "description": "Public realm, parking, and pedestrian improvements along the premium commercial-residential spine"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("jubilee-hills"),
      "score": 70,
      "category": "Established",
      "signals": {
        "infrastructure": 85,
        "population": 65,
        "satellite": 72,
        "rera": 56,
        "employment": 68,
        "priceVelocity": 55,
        "govtScheme": 48
      },
      "livability": {
        "connectivity": 80,
        "amenities": 92,
        "ecommerce": 90,
        "entertainment": 92,
        "greenSpaces": 65
      },
      "highlights": [
        "Ultra-premium micro-market - film industry & business elite",
        "PVP Square, Odyssey - entertainment hubs",
        "Durgam Cheruvu lakefront adds lifestyle premium",
        "Very limited new supply - high floor price"
      ],
      "priceRange": "Rs10,000-18,000/sqft",
      "yoy": 7,
      "activeProjects": [
        {
          "id": "jub-001",
          "name": "Jubilee Hills Checkpost Mobility Upgrade",
          "type": "flyover",
          "status": "approved",
          "developer": "GHMC",
          "investment": "Rs180 Cr",
          "expectedCompletion": "2026 Q3",
          "coordinates": [
            17.434,
            78.412
          ],
          "impact": "medium",
          "description": "Traffic-circulation improvement around the Jubilee Hills Checkpost and lakefront access corridors"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("manikonda"),
      "score": 74,
      "category": "Established",
      "signals": {
        "infrastructure": 78,
        "population": 80,
        "satellite": 76,
        "rera": 72,
        "employment": 80,
        "priceVelocity": 65,
        "govtScheme": 58
      },
      "livability": {
        "connectivity": 74,
        "amenities": 72,
        "ecommerce": 82,
        "entertainment": 58,
        "greenSpaces": 50
      },
      "highlights": [
        "IT corridor adjacency - Gachibowli 3 km, Financial District 5 km",
        "Affordable alternative to Gachibowli and Narsingi",
        "Fast-growing mid-income residential market",
        "TSRERA active - multiple new gated communities"
      ],
      "priceRange": "Rs5,000-8,000/sqft",
      "yoy": 12,
      "activeProjects": [
        {
          "id": "man-001",
          "name": "Manikonda Link Road Widening",
          "type": "highway",
          "status": "under_construction",
          "developer": "GHMC",
          "investment": "Rs180 Cr",
          "expectedCompletion": "2025 Q4",
          "coordinates": [
            17.409,
            78.387
          ],
          "impact": "medium",
          "description": "Road and junction widening improving travel times between Manikonda, Khajaguda, and Gachibowli"
        },
        {
          "id": "man-002",
          "name": "Khajaguda Tech Park Annex",
          "type": "it_park",
          "status": "approved",
          "developer": "Private developer",
          "investment": "Rs1,250 Cr",
          "expectedCompletion": "2027 Q4",
          "coordinates": [
            17.401,
            78.39
          ],
          "impact": "high",
          "description": "New office campus aimed at capturing overflow demand from the Financial District and Gachibowli corridors"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("somajiguda"),
      "score": 58,
      "category": "Established",
      "signals": {
        "infrastructure": 75,
        "population": 72,
        "satellite": 60,
        "rera": 44,
        "employment": 68,
        "priceVelocity": 40,
        "govtScheme": 38
      },
      "livability": {
        "connectivity": 88,
        "amenities": 85,
        "ecommerce": 88,
        "entertainment": 80,
        "greenSpaces": 42
      },
      "highlights": [
        "Central Hyderabad - mature commercial and residential mix",
        "Raj Bhavan, Hyderabad Public School proximity",
        "High livability but limited new development upside",
        "Stable resale market - low speculation risk"
      ],
      "priceRange": "Rs7,000-11,000/sqft",
      "yoy": 6,
      "activeProjects": [
        {
          "id": "som-001",
          "name": "Somajiguda Commercial Retrofit Cluster",
          "type": "commercial",
          "status": "under_construction",
          "developer": "Private developer",
          "investment": "Rs430 Cr",
          "expectedCompletion": "2026 Q4",
          "coordinates": [
            17.436,
            78.454
          ],
          "impact": "medium",
          "description": "Older office stock retrofit and retail refresh project reinforcing Somajiguda's central business relevance"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("begumpet"),
      "score": 55,
      "category": "Established",
      "signals": {
        "infrastructure": 72,
        "population": 68,
        "satellite": 58,
        "rera": 40,
        "employment": 65,
        "priceVelocity": 36,
        "govtScheme": 35
      },
      "livability": {
        "connectivity": 85,
        "amenities": 82,
        "ecommerce": 85,
        "entertainment": 76,
        "greenSpaces": 44
      },
      "highlights": [
        "Old airport area - central and well-connected",
        "Metro: Begumpet station on Green Line",
        "Mature market with stable but limited price growth",
        "Good for end-use, not high-appreciation investment"
      ],
      "priceRange": "Rs6,500-10,000/sqft",
      "yoy": 5,
      "activeProjects": [
        {
          "id": "beg-001",
          "name": "Begumpet Metro Plaza Redevelopment",
          "type": "commercial",
          "status": "approved",
          "developer": "Private developer",
          "investment": "Rs280 Cr",
          "expectedCompletion": "2027 Q1",
          "coordinates": [
            17.446,
            78.472
          ],
          "impact": "medium",
          "description": "Transit-linked retail and office redevelopment planned around the Begumpet metro influence zone"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("secunderabad"),
      "score": 62,
      "category": "Established",
      "signals": {
        "infrastructure": 76,
        "population": 74,
        "satellite": 62,
        "rera": 52,
        "employment": 70,
        "priceVelocity": 44,
        "govtScheme": 55
      },
      "livability": {
        "connectivity": 90,
        "amenities": 80,
        "ecommerce": 85,
        "entertainment": 72,
        "greenSpaces": 46
      },
      "highlights": [
        "Secunderabad Junction - rail hub connecting all of India",
        "Metro interchange: Red and Blue lines",
        "Cantonment area - planned, low-density green zones",
        "Undervalued vs Hyderabad core given connectivity"
      ],
      "priceRange": "Rs5,000-8,000/sqft",
      "yoy": 7,
      "activeProjects": [
        {
          "id": "sec-001",
          "name": "Secunderabad Station Redevelopment",
          "type": "infrastructure",
          "status": "under_construction",
          "developer": "Indian Railways",
          "investment": "Rs720 Cr",
          "expectedCompletion": "2027 Q1",
          "coordinates": [
            17.439,
            78.499
          ],
          "impact": "high",
          "description": "Station concourse, circulation, and passenger-area redevelopment centered on Secunderabad Junction"
        },
        {
          "id": "sec-002",
          "name": "Paradise Junction Mobility Deck",
          "type": "flyover",
          "status": "approved",
          "developer": "GHMC",
          "investment": "Rs260 Cr",
          "expectedCompletion": "2026 Q3",
          "coordinates": [
            17.442,
            78.493
          ],
          "impact": "medium",
          "description": "Traffic segregation and deck-style junction improvement targeting movement across the Paradise corridor"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("uppal"),
      "score": 68,
      "category": "Emerging",
      "signals": {
        "infrastructure": 72,
        "population": 78,
        "satellite": 68,
        "rera": 65,
        "employment": 65,
        "priceVelocity": 60,
        "govtScheme": 62
      },
      "livability": {
        "connectivity": 80,
        "amenities": 65,
        "ecommerce": 78,
        "entertainment": 55,
        "greenSpaces": 50
      },
      "highlights": [
        "Metro Line 1: Uppal station - eastern connectivity anchor",
        "Affordable eastern corridor with strong workforce demand",
        "Biodiversity Park and Ramoji Film City proximity",
        "Growing IT & pharma office demand in outer east"
      ],
      "priceRange": "Rs4,000-6,500/sqft",
      "yoy": 10,
      "activeProjects": [
        {
          "id": "upp-001",
          "name": "Uppal Metro East Access Upgrade",
          "type": "metro",
          "status": "near_completion",
          "developer": "HMRL",
          "investment": "Rs150 Cr",
          "expectedCompletion": "2025 Q3",
          "coordinates": [
            17.407,
            78.553
          ],
          "impact": "medium",
          "description": "Access roads, parking, and pedestrian improvements around the Uppal metro approach roads"
        },
        {
          "id": "upp-002",
          "name": "Pocharam Connector IT Campus",
          "type": "it_park",
          "status": "approved",
          "developer": "Private consortium",
          "investment": "Rs980 Cr",
          "expectedCompletion": "2027 Q4",
          "coordinates": [
            17.411,
            78.569
          ],
          "impact": "high",
          "description": "New east-corridor office campus targeting workforce demand spilling over from Uppal and Pocharam"
        }
      ],
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("hitec-city"),
    "score": 85,
    "category": "High Growth",
    "signals": { "infrastructure": 90, "population": 75, "satellite": 88, "rera": 80, "employment": 98, "priceVelocity": 82, "govtScheme": 78 },
    "livability": { "connectivity": 90, "amenities": 82, "ecommerce": 90, "entertainment": 80, "greenSpaces": 45 },
    "highlights": [
      "NASSCOM HQ and 600+ tech companies in walkable radius",
      "Cyber Towers, iLabs Centre, T-Hub innovation ecosystem",
      "Metro Line 1: HITEC City station — direct Ameerpet connectivity",
      "Highest office absorption rate in Hyderabad"
    ],
    "priceRange": "Rs9,500-14,000/sqft",
    "yoy": 18,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("nanakramguda"),
    "score": 77,
    "category": "High Growth",
    "signals": { "infrastructure": 82, "population": 70, "satellite": 78, "rera": 72, "employment": 85, "priceVelocity": 80, "govtScheme": 72 },
    "livability": { "connectivity": 78, "amenities": 68, "ecommerce": 82, "entertainment": 62, "greenSpaces": 55 },
    "highlights": [
      "Adjacent to Financial District — premium office spillover zone",
      "DLF Cybercity, Lanco Hills, and US Consulate precinct",
      "Outer Ring Road direct access at Node 7",
      "Fastest appreciating residential corridor in West Hyderabad"
    ],
    "priceRange": "Rs7,500-11,000/sqft",
    "yoy": 22,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("mehdipatnam"),
    "score": 73,
    "category": "Established",
    "signals": { "infrastructure": 78, "population": 78, "satellite": 70, "rera": 68, "employment": 72, "priceVelocity": 65, "govtScheme": 65 },
    "livability": { "connectivity": 85, "amenities": 80, "ecommerce": 82, "entertainment": 72, "greenSpaces": 38 },
    "highlights": [
      "Major bus terminus — connectivity to all parts of Hyderabad",
      "Metro Line 2 (Nagole-Raidurg): Mehdipatnam interchange",
      "Dense commercial hub — retail, F&B, healthcare cluster",
      "Affordable residential base for IT workforce commuting to FD"
    ],
    "priceRange": "Rs5,500-8,000/sqft",
    "yoy": 12,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("dilsukhnagar"),
    "score": 72,
    "category": "Established",
    "signals": { "infrastructure": 75, "population": 80, "satellite": 68, "rera": 70, "employment": 65, "priceVelocity": 65, "govtScheme": 62 },
    "livability": { "connectivity": 82, "amenities": 78, "ecommerce": 80, "entertainment": 70, "greenSpaces": 40 },
    "highlights": [
      "Metro Line 1 terminus — Dilsukhnagar station direct access",
      "One of Hyderabad's densest self-contained commercial pockets",
      "Strong rental yield for residential — workforce housing demand",
      "APSRTC depot and arterial road connectivity to ORR east"
    ],
    "priceRange": "Rs4,800-7,000/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("tolichowki"),
    "score": 70,
    "category": "Established",
    "signals": { "infrastructure": 75, "population": 72, "satellite": 68, "rera": 65, "employment": 70, "priceVelocity": 68, "govtScheme": 62 },
    "livability": { "connectivity": 80, "amenities": 75, "ecommerce": 80, "entertainment": 65, "greenSpaces": 42 },
    "highlights": [
      "Strategic mid-point between Financial District and old city",
      "Growing demand from Madhapur and Gachibowli IT workforce",
      "Metro Phase 2 proposed station — price discovery upside",
      "Film Nagar adjacency drives entertainment and hospitality supply"
    ],
    "priceRange": "Rs5,500-8,500/sqft",
    "yoy": 14,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("bachupally"),
    "score": 69,
    "category": "Emerging",
    "signals": { "infrastructure": 68, "population": 72, "satellite": 75, "rera": 65, "employment": 60, "priceVelocity": 70, "govtScheme": 62 },
    "livability": { "connectivity": 62, "amenities": 60, "ecommerce": 68, "entertainment": 40, "greenSpaces": 55 },
    "highlights": [
      "NH65 (Pune Highway) direct frontage — logistics advantage",
      "ICRISAT campus precinct drives knowledge economy cluster",
      "Affordable residential alternative to Miyapur and Chandanagar",
      "PVNR Expressway proposed extension to connect ORR north"
    ],
    "priceRange": "Rs4,200-6,200/sqft",
    "yoy": 16,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("hafeezpet"),
    "score": 69,
    "category": "Emerging",
    "signals": { "infrastructure": 70, "population": 68, "satellite": 72, "rera": 65, "employment": 68, "priceVelocity": 72, "govtScheme": 62 },
    "livability": { "connectivity": 68, "amenities": 65, "ecommerce": 72, "entertainment": 52, "greenSpaces": 50 },
    "highlights": [
      "Positioned between Miyapur metro and Kondapur IT corridor",
      "High appreciation potential from HITEC City employment spill",
      "Quiet residential character with improving social infrastructure",
      "Budget-friendly gateway to West Hyderabad growth corridor"
    ],
    "priceRange": "Rs5,000-7,500/sqft",
    "yoy": 15,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("malkajgiri"),
    "score": 67,
    "category": "Emerging",
    "signals": { "infrastructure": 70, "population": 72, "satellite": 68, "rera": 62, "employment": 60, "priceVelocity": 65, "govtScheme": 58 },
    "livability": { "connectivity": 72, "amenities": 68, "ecommerce": 72, "entertainment": 55, "greenSpaces": 42 },
    "highlights": [
      "Secunderabad outgrowth — dense established residential zone",
      "NH65 and Medchal Road connectivity to north growth corridors",
      "Municipal limits expansion driving plot regularisation activity",
      "Affordable entry point for Secunderabad employment proximity"
    ],
    "priceRange": "Rs4,000-6,000/sqft",
    "yoy": 11,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("balanagar"),
    "score": 66,
    "category": "Industrial",
    "signals": { "infrastructure": 72, "population": 65, "satellite": 68, "rera": 55, "employment": 75, "priceVelocity": 58, "govtScheme": 60 },
    "livability": { "connectivity": 70, "amenities": 58, "ecommerce": 65, "entertainment": 38, "greenSpaces": 40 },
    "highlights": [
      "APIIC Balanagar Industrial Area — 300+ manufacturing units",
      "BEL, ECIL, BHEL residential townships cluster",
      "Rail connectivity via Balanagar railway station",
      "Stable rental demand from blue-collar industrial workforce"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("bowenpally"),
    "score": 66,
    "category": "Established",
    "signals": { "infrastructure": 70, "population": 68, "satellite": 65, "rera": 62, "employment": 60, "priceVelocity": 65, "govtScheme": 58 },
    "livability": { "connectivity": 72, "amenities": 68, "ecommerce": 72, "entertainment": 55, "greenSpaces": 40 },
    "highlights": [
      "Secunderabad-Kompally arterial — high vehicular throughput",
      "Institutional cluster: TSPA, NIN, government offices",
      "Wholesale vegetable market — strong commercial footfall",
      "Undervalued residential corridor with metro Phase 2 upside"
    ],
    "priceRange": "Rs4,200-6,200/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("nizampet",),
    "score": 65,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 68, "satellite": 70, "rera": 60, "employment": 55, "priceVelocity": 65, "govtScheme": 58 },
    "livability": { "connectivity": 62, "amenities": 60, "ecommerce": 65, "entertainment": 42, "greenSpaces": 52 },
    "highlights": [
      "Affordable alternative to Kukatpally — 30% lower prices",
      "JNTU Kukatpally campus precinct drives student demand",
      "Ring Road connectivity improving last-mile access to IT hubs",
      "Rapid plot conversion activity from GHMC regularisation"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 13,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("kothapet"),
    "score": 65,
    "category": "Emerging",
    "signals": { "infrastructure": 68, "population": 72, "satellite": 65, "rera": 62, "employment": 58, "priceVelocity": 62, "govtScheme": 55 },
    "livability": { "connectivity": 68, "amenities": 65, "ecommerce": 70, "entertainment": 52, "greenSpaces": 42 },
    "highlights": [
      "East Hyderabad residential hub — affordable family housing",
      "Proximity to Dilsukhnagar commercial and LB Nagar metro",
      "Growing RERA project pipeline — mid-range apartment supply",
      "Inner Ring Road access to Nagole IT cluster"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("hayathnagar"),
    "score": 65,
    "category": "Emerging",
    "signals": { "infrastructure": 72, "population": 55, "satellite": 75, "rera": 60, "employment": 55, "priceVelocity": 70, "govtScheme": 65 },
    "livability": { "connectivity": 62, "amenities": 52, "ecommerce": 60, "entertainment": 35, "greenSpaces": 65 },
    "highlights": [
      "ORR east node — land appreciation play ahead of urbanisation",
      "Pharma city proximity (Genome Valley south extension corridor)",
      "Low density now, high land banking potential",
      "NH163 (Hyderabad-Vijayawada) direct access for logistics"
    ],
    "priceRange": "Rs2,800-4,500/sqft",
    "yoy": 20,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("jntu-kphb"),
    "score": 65,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 70, "satellite": 65, "rera": 60, "employment": 65, "priceVelocity": 62, "govtScheme": 58 },
    "livability": { "connectivity": 70, "amenities": 65, "ecommerce": 72, "entertainment": 52, "greenSpaces": 42 },
    "highlights": [
      "JNTU campus precinct — consistent student and faculty demand",
      "Metro Line 1: JNTU College station on Ameerpet-Miyapur corridor",
      "KPHB Colony established residential character, strong resale market",
      "Affordable Kukatpally adjacency — 15% discount to prime KPHB"
    ],
    "priceRange": "Rs4,500-6,800/sqft",
    "yoy": 11,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("chandanagar"),
    "score": 64,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 65, "satellite": 68, "rera": 60, "employment": 55, "priceVelocity": 68, "govtScheme": 55 },
    "livability": { "connectivity": 60, "amenities": 58, "ecommerce": 62, "entertainment": 40, "greenSpaces": 58 },
    "highlights": [
      "Emerging western residential corridor beyond Miyapur",
      "NH65 expressway proximity for Pune and Nagpur connectivity",
      "Low-density plotted development — large plot sizes still available",
      "Growing FD and HITEC City workforce residential demand"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 15,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("alwal"),
    "score": 64,
    "category": "Emerging",
    "signals": { "infrastructure": 68, "population": 70, "satellite": 65, "rera": 58, "employment": 55, "priceVelocity": 62, "govtScheme": 55 },
    "livability": { "connectivity": 68, "amenities": 62, "ecommerce": 68, "entertainment": 48, "greenSpaces": 45 },
    "highlights": [
      "Secunderabad outgrowth — affordable northeast residential pocket",
      "Railway station connectivity to Secunderabad junction",
      "Cantonment proximity driving quality infrastructure maintenance",
      "Price upside from Medchal Road development spill"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("nacharam"),
    "score": 62,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 65, "satellite": 62, "rera": 58, "employment": 62, "priceVelocity": 60, "govtScheme": 55 },
    "livability": { "connectivity": 65, "amenities": 60, "ecommerce": 65, "entertainment": 45, "greenSpaces": 48 },
    "highlights": [
      "Industrial-to-residential transition zone near Uppal",
      "IDA Nacharam — legacy pharma and light engineering units",
      "Affordable apartments attracting mid-income IT workforce",
      "Metro Phase 2 proposed alignment through Nacharam corridor"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("attapur"),
    "score": 61,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 65, "satellite": 62, "rera": 55, "employment": 58, "priceVelocity": 60, "govtScheme": 55 },
    "livability": { "connectivity": 65, "amenities": 62, "ecommerce": 65, "entertainment": 50, "greenSpaces": 42 },
    "highlights": [
      "Outer Ring Road south access at Node 4 — Shamshabad direction",
      "Rajendra Nagar and Attapur forming a mid-south residential cluster",
      "Affordable family housing with improving social infrastructure",
      "Price discovery underway from FD and Mehdipatnam demand spill"
    ],
    "priceRange": "Rs3,800-5,500/sqft",
    "yoy": 11,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("vanasthalipuram"),
    "score": 60,
    "category": "Emerging",
    "signals": { "infrastructure": 62, "population": 68, "satellite": 60, "rera": 55, "employment": 52, "priceVelocity": 58, "govtScheme": 52 },
    "livability": { "connectivity": 62, "amenities": 60, "ecommerce": 65, "entertainment": 45, "greenSpaces": 42 },
    "highlights": [
      "Densely populated affordable east Hyderabad locality",
      "Strong rental market serving LB Nagar and Dilsukhnagar workforce",
      "Ongoing GHMC road widening improving internal connectivity",
      "Entry-level plotted development for first-time buyers"
    ],
    "priceRange": "Rs3,200-5,000/sqft",
    "yoy": 9,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },

  {
    ...locality("dundigal"),
    "score": 51,
    "category": "Emerging",
    "signals": { "infrastructure": 55, "population": 45, "satellite": 60, "rera": 40, "employment": 45, "priceVelocity": 55, "govtScheme": 58 },
    "livability": { "connectivity": 48, "amenities": 40, "ecommerce": 48, "entertainment": 22, "greenSpaces": 70 },
    "highlights": [
      "IAF Dundigal Air Force Academy — strategic land constraint",
      "Long-range investment opportunity: north Hyderabad urbanisation front",
      "NH44 (Hyderabad-Delhi) direct access for logistics and connectivity",
      "Very low prices — highest risk-reward ratio in the metro region"
    ],
    "priceRange": "Rs1,800-3,000/sqft",
    "yoy": 18,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 7
  },
  {
    ...locality("ameerpet"),
    "score": 71,
    "category": "Established",
    "signals": { "infrastructure": 78, "population": 80, "satellite": 68, "rera": 60, "employment": 75, "priceVelocity": 65, "govtScheme": 55 },
    "livability": { "connectivity": 82, "amenities": 75, "ecommerce": 85, "entertainment": 70, "greenSpaces": 35 },
    "highlights": [
      "Major commercial transit hub - MMTS and metro interchange",
      "Dense office and retail ecosystem drives sustained rental demand",
      "NH65 and NH163 convergence enables city-wide connectivity",
      "Redevelopment wave as old buildings give way to mixed-use towers"
    ],
    "priceRange": "Rs7,500-12,000/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("punjagutta"),
    "score": 68,
    "category": "Established",
    "signals": { "infrastructure": 75, "population": 72, "satellite": 62, "rera": 55, "employment": 70, "priceVelocity": 60, "govtScheme": 50 },
    "livability": { "connectivity": 78, "amenities": 72, "ecommerce": 82, "entertainment": 68, "greenSpaces": 38 },
    "highlights": [
      "Premium commercial corridor adjacent to Banjara Hills",
      "High street retail concentration - footfall and brand presence",
      "Metro Blue Line station drives pedestrian traffic",
      "Upscale residential demand from corporate professionals"
    ],
    "priceRange": "Rs7,000-11,500/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("khairatabad"),
    "score": 65,
    "category": "Established",
    "signals": { "infrastructure": 72, "population": 70, "satellite": 60, "rera": 52, "employment": 65, "priceVelocity": 58, "govtScheme": 55 },
    "livability": { "connectivity": 76, "amenities": 70, "ecommerce": 80, "entertainment": 65, "greenSpaces": 40 },
    "highlights": [
      "State government offices create stable employment anchor",
      "Flyover access reduces commute times to HITEC City",
      "Cultural landmarks - Ganesh festival headquarters",
      "Established residential demand from government-sector workers"
    ],
    "priceRange": "Rs6,500-10,000/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("himayathnagar"),
    "score": 66,
    "category": "Established",
    "signals": { "infrastructure": 73, "population": 68, "satellite": 62, "rera": 55, "employment": 65, "priceVelocity": 62, "govtScheme": 48 },
    "livability": { "connectivity": 74, "amenities": 72, "ecommerce": 80, "entertainment": 65, "greenSpaces": 42 },
    "highlights": [
      "Premium micro-market between Banjara Hills and city centre",
      "High density of restaurants cafes and retail - strong walkability",
      "Proximity to Hyderabad Central University academic zone",
      "Steady appreciation driven by limited land supply"
    ],
    "priceRange": "Rs6,500-10,500/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("narayanguda"),
    "score": 62,
    "category": "Established",
    "signals": { "infrastructure": 68, "population": 75, "satellite": 58, "rera": 50, "employment": 60, "priceVelocity": 55, "govtScheme": 45 },
    "livability": { "connectivity": 70, "amenities": 68, "ecommerce": 75, "entertainment": 60, "greenSpaces": 38 },
    "highlights": [
      "Dense residential locality with mature social infrastructure",
      "Close to Osmania General Hospital - strong anchor for tenants",
      "Metro corridor station improving east-west connectivity",
      "Commercial street activity generates stable lease demand"
    ],
    "priceRange": "Rs5,500-8,500/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("abids"),
    "score": 60,
    "category": "Established",
    "signals": { "infrastructure": 68, "population": 72, "satellite": 55, "rera": 45, "employment": 65, "priceVelocity": 50, "govtScheme": 55 },
    "livability": { "connectivity": 72, "amenities": 75, "ecommerce": 80, "entertainment": 70, "greenSpaces": 30 },
    "highlights": [
      "Traditional commercial hub with strong retail history",
      "Proximity to Nampally railway station for intercity connectivity",
      "Redevelopment opportunities as ageing stock is replaced",
      "Government precinct anchor ensures stable demand base"
    ],
    "priceRange": "Rs5,000-8,000/sqft",
    "yoy": 5,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("nampally"),
    "score": 58,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 70, "satellite": 52, "rera": 42, "employment": 58, "priceVelocity": 48, "govtScheme": 58 },
    "livability": { "connectivity": 70, "amenities": 68, "ecommerce": 75, "entertainment": 60, "greenSpaces": 32 },
    "highlights": [
      "Nampally railway station - intercity rail hub and commuter anchor",
      "Exhibition grounds attract periodic commercial demand",
      "Old city gateway locality with improving road infrastructure",
      "Affordable entry point into central Hyderabad"
    ],
    "priceRange": "Rs4,800-7,500/sqft",
    "yoy": 5,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("masab-tank"),
    "score": 63,
    "category": "Established",
    "signals": { "infrastructure": 70, "population": 68, "satellite": 60, "rera": 52, "employment": 62, "priceVelocity": 58, "govtScheme": 48 },
    "livability": { "connectivity": 72, "amenities": 70, "ecommerce": 78, "entertainment": 65, "greenSpaces": 40 },
    "highlights": [
      "Upscale enclave between Banjara Hills and Mehdipatnam",
      "Green pockets around the tank offer rare open-space value",
      "Strong healthcare cluster - hospitals and diagnostic centres",
      "Premium residential demand from medical professionals"
    ],
    "priceRange": "Rs6,000-9,500/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("humayun-nagar"),
    "score": 61,
    "category": "Established",
    "signals": { "infrastructure": 68, "population": 65, "satellite": 58, "rera": 50, "employment": 60, "priceVelocity": 55, "govtScheme": 45 },
    "livability": { "connectivity": 70, "amenities": 65, "ecommerce": 75, "entertainment": 58, "greenSpaces": 42 },
    "highlights": [
      "Quiet residential enclave adjacent to Banjara Hills",
      "Well-established colony with mature tree cover",
      "Close to international schools and premium retail",
      "Limited new supply supports steady price appreciation"
    ],
    "priceRange": "Rs5,500-8,500/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("musheerabad"),
    "score": 58,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 72, "satellite": 52, "rera": 42, "employment": 55, "priceVelocity": 48, "govtScheme": 50 },
    "livability": { "connectivity": 68, "amenities": 62, "ecommerce": 72, "entertainment": 55, "greenSpaces": 32 },
    "highlights": [
      "Mixed residential-commercial pocket north of old city",
      "Close to Gandhi Hospital - major public health anchor",
      "Road widening projects improving connectivity",
      "Affordable pricing offers entry-level residential value"
    ],
    "priceRange": "Rs4,500-7,000/sqft",
    "yoy": 5,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("barkatpura"),
    "score": 60,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 68, "satellite": 55, "rera": 48, "employment": 58, "priceVelocity": 52, "govtScheme": 50 },
    "livability": { "connectivity": 70, "amenities": 65, "ecommerce": 72, "entertainment": 58, "greenSpaces": 35 },
    "highlights": [
      "Established residential locality near Hyderabad Central University",
      "Metro accessibility improving overall connectivity",
      "Commercial strip along main road adds rental diversity",
      "Stable demand from academic and government-sector residents"
    ],
    "priceRange": "Rs5,000-7,500/sqft",
    "yoy": 5,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("vidyanagar"),
    "score": 59,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 68, "satellite": 52, "rera": 45, "employment": 55, "priceVelocity": 50, "govtScheme": 48 },
    "livability": { "connectivity": 68, "amenities": 62, "ecommerce": 70, "entertainment": 55, "greenSpaces": 35 },
    "highlights": [
      "Educational hub locality with college-driven rental demand",
      "Close to Secunderabad railway junction",
      "Mature residential stock with steady lease occupancy",
      "Affordable flats attract young professionals and students"
    ],
    "priceRange": "Rs4,800-7,200/sqft",
    "yoy": 5,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("nallakunta"),
    "score": 58,
    "category": "Established",
    "signals": { "infrastructure": 63, "population": 70, "satellite": 52, "rera": 42, "employment": 55, "priceVelocity": 48, "govtScheme": 45 },
    "livability": { "connectivity": 68, "amenities": 60, "ecommerce": 70, "entertainment": 52, "greenSpaces": 32 },
    "highlights": [
      "Dense residential locality with strong community fabric",
      "Close to Secunderabad - dual metro accessibility",
      "Affordable mid-segment housing with stable occupancy",
      "Improving road infrastructure reducing commute times"
    ],
    "priceRange": "Rs4,500-7,000/sqft",
    "yoy": 5,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("kavadiguda"),
    "score": 60,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 68, "satellite": 55, "rera": 45, "employment": 58, "priceVelocity": 52, "govtScheme": 52 },
    "livability": { "connectivity": 70, "amenities": 62, "ecommerce": 72, "entertainment": 55, "greenSpaces": 35 },
    "highlights": [
      "Close to Secunderabad cantonment and railway station",
      "Mix of residential colonies and commercial activity",
      "Metro Blue Line station within walkable distance",
      "Government sector employment creates stable demand base"
    ],
    "priceRange": "Rs5,000-7,500/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("lakdikapul"),
    "score": 62,
    "category": "Established",
    "signals": { "infrastructure": 70, "population": 68, "satellite": 58, "rera": 48, "employment": 60, "priceVelocity": 55, "govtScheme": 55 },
    "livability": { "connectivity": 74, "amenities": 68, "ecommerce": 75, "entertainment": 62, "greenSpaces": 40 },
    "highlights": [
      "Prime location flanking Hussain Sagar lakefront",
      "Arterial road connectivity to both old and new city",
      "Metro Blue Line station improving commuter access",
      "Heritage and lifestyle value near Tank Bund promenade"
    ],
    "priceRange": "Rs5,500-8,500/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("koti"),
    "score": 57,
    "category": "Established",
    "signals": { "infrastructure": 62, "population": 75, "satellite": 50, "rera": 40, "employment": 60, "priceVelocity": 45, "govtScheme": 52 },
    "livability": { "connectivity": 68, "amenities": 72, "ecommerce": 80, "entertainment": 65, "greenSpaces": 28 },
    "highlights": [
      "Established commercial and retail hub of old Hyderabad",
      "Major bus terminal - regional connectivity anchor",
      "Dense electronics and wholesale market cluster",
      "Redevelopment potential as ageing commercial stock turns over"
    ],
    "priceRange": "Rs4,500-6,500/sqft",
    "yoy": 4,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("parsigutta"),
    "score": 63,
    "category": "Established",
    "signals": { "infrastructure": 70, "population": 65, "satellite": 58, "rera": 50, "employment": 62, "priceVelocity": 55, "govtScheme": 48 },
    "livability": { "connectivity": 72, "amenities": 68, "ecommerce": 75, "entertainment": 62, "greenSpaces": 38 },
    "highlights": [
      "Close to Banjara Hills commercial belt",
      "Mix of residential and light commercial - low vacancy",
      "Metro proximity drives footfall and rental uplift",
      "Undervalued relative to adjacent Jubilee Hills"
    ],
    "priceRange": "Rs5,800-9,000/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("chanchalguda"),
    "score": 55,
    "category": "Established",
    "signals": { "infrastructure": 60, "population": 70, "satellite": 48, "rera": 38, "employment": 52, "priceVelocity": 42, "govtScheme": 50 },
    "livability": { "connectivity": 62, "amenities": 60, "ecommerce": 70, "entertainment": 55, "greenSpaces": 30 },
    "highlights": [
      "Old city residential pocket with affordable entry pricing",
      "Close to Osmania General Hospital",
      "Improving road access to PVNR Expressway",
      "Value play for long-horizon buyers in inner Hyderabad"
    ],
    "priceRange": "Rs3,800-6,000/sqft",
    "yoy": 4,
    "dataConfidence": "estimated",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 4
  },
  {
    ...locality("bollaram"),
    "score": 62,
    "category": "Industrial",
    "signals": { "infrastructure": 68, "population": 60, "satellite": 65, "rera": 48, "employment": 72, "priceVelocity": 55, "govtScheme": 55 },
    "livability": { "connectivity": 62, "amenities": 55, "ecommerce": 60, "entertainment": 45, "greenSpaces": 42 },
    "highlights": [
      "Industrial estate anchor - stable blue-collar employment base",
      "IDPL campus and pharmaceutical units drive area economy",
      "Improving road links to Outer Ring Road",
      "Affordable residential pricing with long-term appreciation potential"
    ],
    "priceRange": "Rs4,000-6,000/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("suraram"),
    "score": 60,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 58, "satellite": 62, "rera": 45, "employment": 65, "priceVelocity": 52, "govtScheme": 50 },
    "livability": { "connectivity": 60, "amenities": 52, "ecommerce": 58, "entertainment": 42, "greenSpaces": 38 },
    "highlights": [
      "Industrial and logistics corridor proximity",
      "Improving road infrastructure to ORR and NH65",
      "Affordable pricing relative to inner-ring suburbs",
      "New residential layouts attracting young families"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("jeedimetla"),
    "score": 58,
    "category": "Industrial",
    "signals": { "infrastructure": 62, "population": 55, "satellite": 60, "rera": 42, "employment": 70, "priceVelocity": 48, "govtScheme": 52 },
    "livability": { "connectivity": 58, "amenities": 50, "ecommerce": 55, "entertainment": 40, "greenSpaces": 35 },
    "highlights": [
      "Major industrial estate with 500+ manufacturing units",
      "Stable employment for over 50000 workers",
      "Road widening improving access from Dundigal junction",
      "Affordable worker housing drives consistent rental demand"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("quthbullapur"),
    "score": 62,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 60, "satellite": 65, "rera": 50, "employment": 65, "priceVelocity": 55, "govtScheme": 55 },
    "livability": { "connectivity": 62, "amenities": 55, "ecommerce": 58, "entertainment": 45, "greenSpaces": 40 },
    "highlights": [
      "Municipal corporator zone with active infrastructure investment",
      "Industrial and residential mix providing employment diversity",
      "Expanding road connectivity to Medchal and Kompally",
      "New housing developments attracting migrant workforce"
    ],
    "priceRange": "Rs4,000-6,500/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("mallampet"),
    "score": 63,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 58, "satellite": 68, "rera": 52, "employment": 60, "priceVelocity": 58, "govtScheme": 58 },
    "livability": { "connectivity": 60, "amenities": 52, "ecommerce": 55, "entertainment": 42, "greenSpaces": 45 },
    "highlights": [
      "ORR Phase 3 connectivity unlocking large-format development",
      "Adjacent to Bachupally - spilling-over IT suburb demand",
      "Large land parcels available for gated community development",
      "Satellite imagery shows rapid built-up expansion in last 3 years"
    ],
    "priceRange": "Rs4,500-7,000/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("trimulgherry"),
    "score": 61,
    "category": "Established",
    "signals": { "infrastructure": 68, "population": 62, "satellite": 58, "rera": 45, "employment": 60, "priceVelocity": 55, "govtScheme": 48 },
    "livability": { "connectivity": 65, "amenities": 58, "ecommerce": 62, "entertainment": 50, "greenSpaces": 42 },
    "highlights": [
      "Secunderabad cantonment buffer - controlled development zone",
      "Defence housing layouts with secure gated environment",
      "Rail and metro access via Secunderabad junction",
      "Steady military-sector demand stabilises rental market"
    ],
    "priceRange": "Rs4,200-6,500/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("sainikpuri"),
    "score": 64,
    "category": "Established",
    "signals": { "infrastructure": 68, "population": 65, "satellite": 62, "rera": 52, "employment": 60, "priceVelocity": 58, "govtScheme": 55 },
    "livability": { "connectivity": 65, "amenities": 62, "ecommerce": 60, "entertainment": 50, "greenSpaces": 45 },
    "highlights": [
      "Defence quarter - secure well-maintained township environment",
      "Proximity to ECIL and electronics industry cluster",
      "Improving road access to Medchal ORR interchange",
      "Green cover and open plots - rare in north Hyderabad"
    ],
    "priceRange": "Rs4,500-7,000/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("gajularamaram"),
    "score": 60,
    "category": "Emerging",
    "signals": { "infrastructure": 62, "population": 58, "satellite": 62, "rera": 48, "employment": 58, "priceVelocity": 52, "govtScheme": 50 },
    "livability": { "connectivity": 58, "amenities": 52, "ecommerce": 55, "entertainment": 42, "greenSpaces": 38 },
    "highlights": [
      "Industrial zone with established small-scale manufacturing",
      "Close to Jeedimetla and Dundigal employment clusters",
      "Affordable housing attracting workforce migrants",
      "ORR connectivity improving long-term growth outlook"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("dullapally"),
    "score": 63,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 58, "satellite": 65, "rera": 52, "employment": 58, "priceVelocity": 58, "govtScheme": 60 },
    "livability": { "connectivity": 60, "amenities": 52, "ecommerce": 55, "entertainment": 42, "greenSpaces": 45 },
    "highlights": [
      "Near Kompally - catching spillover demand from saturated suburbs",
      "Large plotted development activity visible on satellite",
      "Medchal ORR access driving commuter residential demand",
      "Educational institutions attracting family-oriented migration"
    ],
    "priceRange": "Rs4,000-6,500/sqft",
    "yoy": 9,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("hakimpet"),
    "score": 60,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 60, "satellite": 60, "rera": 45, "employment": 58, "priceVelocity": 52, "govtScheme": 50 },
    "livability": { "connectivity": 62, "amenities": 55, "ecommerce": 58, "entertainment": 45, "greenSpaces": 42 },
    "highlights": [
      "Adjacent to Sainikpuri - defence-area infrastructure quality",
      "Commercial pocket on Secunderabad-Hakimpet road",
      "Developing residential market attracting young professionals",
      "Access to Bowenpally wholesale market hub"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("ecil"),
    "score": 66,
    "category": "Established",
    "signals": { "infrastructure": 70, "population": 68, "satellite": 65, "rera": 55, "employment": 62, "priceVelocity": 62, "govtScheme": 58 },
    "livability": { "connectivity": 68, "amenities": 65, "ecommerce": 65, "entertainment": 55, "greenSpaces": 45 },
    "highlights": [
      "Electronics Corporation of India campus - major government employer",
      "Established township infrastructure with decades of planned development",
      "Metro Green Line connectivity to HITEC City being extended",
      "Strong STEM workforce density supports sustained residential demand"
    ],
    "priceRange": "Rs5,000-7,500/sqft",
    "yoy": 9,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("maredpally"),
    "score": 64,
    "category": "Established",
    "signals": { "infrastructure": 72, "population": 65, "satellite": 62, "rera": 52, "employment": 60, "priceVelocity": 62, "govtScheme": 48 },
    "livability": { "connectivity": 70, "amenities": 65, "ecommerce": 68, "entertainment": 58, "greenSpaces": 45 },
    "highlights": [
      "Upscale north Secunderabad residential pocket",
      "Proximity to Secunderabad club and cantonment green zones",
      "Low traffic density and tree-lined streets - rare quality",
      "Strong demand from defence officers and government executives"
    ],
    "priceRange": "Rs5,500-8,500/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("neredmet"),
    "score": 62,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 62, "satellite": 62, "rera": 50, "employment": 58, "priceVelocity": 55, "govtScheme": 50 },
    "livability": { "connectivity": 62, "amenities": 58, "ecommerce": 60, "entertainment": 48, "greenSpaces": 40 },
    "highlights": [
      "Bridge locality between Malkajgiri and ECIL corridor",
      "Improving road links to NH44 and Medchal road",
      "Mid-segment residential with stable rental yields",
      "Education cluster proximity supports family demographic"
    ],
    "priceRange": "Rs4,200-6,500/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("yapral"),
    "score": 60,
    "category": "Emerging",
    "signals": { "infrastructure": 62, "population": 58, "satellite": 62, "rera": 48, "employment": 55, "priceVelocity": 52, "govtScheme": 52 },
    "livability": { "connectivity": 60, "amenities": 52, "ecommerce": 55, "entertainment": 42, "greenSpaces": 40 },
    "highlights": [
      "Developing suburb near Sainikpuri and Hakimpet",
      "Large plotted layouts attracting individual house buyers",
      "ORR proximity improving long-distance commuter appeal",
      "Affordable pricing with infrastructure investment pipeline"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("azamabad"),
    "score": 62,
    "category": "Industrial",
    "signals": { "infrastructure": 65, "population": 65, "satellite": 60, "rera": 50, "employment": 58, "priceVelocity": 55, "govtScheme": 50 },
    "livability": { "connectivity": 65, "amenities": 60, "ecommerce": 62, "entertainment": 50, "greenSpaces": 38 },
    "highlights": [
      "Industrial area adjacent to Malkajgiri residential hub",
      "Mixed residential-commercial street - diverse tenant base",
      "Metro Blue Line proximity improving connectivity",
      "Affordable pricing for inner-north Hyderabad location"
    ],
    "priceRange": "Rs4,500-6,800/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("lalaguda"),
    "score": 61,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 63, "satellite": 58, "rera": 48, "employment": 60, "priceVelocity": 52, "govtScheme": 50 },
    "livability": { "connectivity": 65, "amenities": 58, "ecommerce": 60, "entertainment": 48, "greenSpaces": 38 },
    "highlights": [
      "South Central Railway zone headquarters - major institutional anchor",
      "Railway colony township with stable government-sector demand",
      "Secunderabad junction walkability for commuter convenience",
      "Established neighbourhood with strong community infrastructure"
    ],
    "priceRange": "Rs4,200-6,500/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("bahadurpally"),
    "score": 65,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 52, "satellite": 72, "rera": 62, "employment": 55, "priceVelocity": 65, "govtScheme": 68 },
    "livability": { "connectivity": 55, "amenities": 45, "ecommerce": 48, "entertainment": 35, "greenSpaces": 52 },
    "highlights": [
      "Pharma City Phase 2 anchor driving massive employment migration",
      "HMDA-approved layouts seeing fastest price velocity in north HYD",
      "ORR Gachibowli spur extension in planning - transformative access",
      "Satellite data shows 38% built-up area increase in 3 years"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 14,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("moosapet"),
    "score": 62,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 65, "satellite": 60, "rera": 48, "employment": 62, "priceVelocity": 55, "govtScheme": 48 },
    "livability": { "connectivity": 65, "amenities": 60, "ecommerce": 62, "entertainment": 52, "greenSpaces": 38 },
    "highlights": [
      "Metro Blue Line station - direct connectivity to HITEC City",
      "JNTU proximity drives student and young-professional demand",
      "Affordable pricing for west-corridor commuters",
      "New commercial developments improving area character"
    ],
    "priceRange": "Rs4,500-7,000/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("moti-nagar"),
    "score": 63,
    "category": "Established",
    "signals": { "infrastructure": 68, "population": 65, "satellite": 60, "rera": 50, "employment": 63, "priceVelocity": 56, "govtScheme": 48 },
    "livability": { "connectivity": 68, "amenities": 62, "ecommerce": 65, "entertainment": 55, "greenSpaces": 40 },
    "highlights": [
      "Metro Blue Line - walkable station connectivity",
      "Buffer between Kukatpally and Balanagar industrial zone",
      "Established residential colony with mature amenities",
      "Affordable relative to adjacent Kukatpally and KPHB"
    ],
    "priceRange": "Rs4,800-7,200/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("dammaiguda"),
    "score": 62,
    "category": "Emerging",
    "signals": { "infrastructure": 62, "population": 55, "satellite": 65, "rera": 52, "employment": 55, "priceVelocity": 56, "govtScheme": 62 },
    "livability": { "connectivity": 55, "amenities": 48, "ecommerce": 50, "entertainment": 40, "greenSpaces": 45 },
    "highlights": [
      "Adjacent to Keesara ORR interchange - strategic corridor location",
      "Pharma City and defence land adjacency driving land value",
      "Active plotted development market with HMDA-approved layouts",
      "Satellite data shows rapid agricultural-to-residential conversion"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("boduppal"),
    "score": 65,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 65, "satellite": 70, "rera": 60, "employment": 55, "priceVelocity": 65, "govtScheme": 60 },
    "livability": { "connectivity": 60, "amenities": 58, "ecommerce": 62, "entertainment": 48, "greenSpaces": 42 },
    "highlights": [
      "ORR Phase 1 spur driving major development acceleration",
      "TSRTC bus depot and growing public transport connectivity",
      "Satellite shows 45% built-up expansion in past 5 years",
      "Affordable plotted development with proximity to Uppal IT Park"
    ],
    "priceRange": "Rs4,200-6,500/sqft",
    "yoy": 12,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("kapra"),
    "score": 63,
    "category": "Emerging",
    "signals": { "infrastructure": 63, "population": 62, "satellite": 65, "rera": 55, "employment": 55, "priceVelocity": 58, "govtScheme": 55 },
    "livability": { "connectivity": 60, "amenities": 55, "ecommerce": 58, "entertainment": 45, "greenSpaces": 40 },
    "highlights": [
      "East Hyderabad residential corridor catching IT suburb spillover",
      "ECIL proximity provides electronics-sector employment anchor",
      "Developing retail and commercial strip on main road",
      "Affordable family housing with improving connectivity"
    ],
    "priceRange": "Rs4,000-6,000/sqft",
    "yoy": 9,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("ramanthapur"),
    "score": 60,
    "category": "Established",
    "signals": { "infrastructure": 63, "population": 65, "satellite": 58, "rera": 48, "employment": 55, "priceVelocity": 52, "govtScheme": 48 },
    "livability": { "connectivity": 62, "amenities": 60, "ecommerce": 62, "entertainment": 50, "greenSpaces": 38 },
    "highlights": [
      "Metro Blue Line station improving city-wide connectivity",
      "Dense residential locality with established social infrastructure",
      "Commercial activity along main road supports local economy",
      "Affordable mid-segment housing with stable occupancy"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("mallapur"),
    "score": 61,
    "category": "Industrial",
    "signals": { "infrastructure": 63, "population": 62, "satellite": 62, "rera": 50, "employment": 55, "priceVelocity": 54, "govtScheme": 50 },
    "livability": { "connectivity": 60, "amenities": 55, "ecommerce": 58, "entertainment": 45, "greenSpaces": 38 },
    "highlights": [
      "Industrial-residential bridge locality east of Uppal",
      "IDA Mallapur estate providing employment anchor",
      "Improving road links to Nagaram ORR interchange",
      "Affordable pricing attracting industrial workforce settlers"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("kushaiguda"),
    "score": 62,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 65, "satellite": 60, "rera": 50, "employment": 58, "priceVelocity": 55, "govtScheme": 50 },
    "livability": { "connectivity": 65, "amenities": 62, "ecommerce": 62, "entertainment": 52, "greenSpaces": 38 },
    "highlights": [
      "Metro Blue Line station - high-frequency city connectivity",
      "Dense residential locality with mature marketplace",
      "Bridge between Uppal and Malkajgiri residential zones",
      "Stable rental demand from working-class professional segment"
    ],
    "priceRange": "Rs4,200-6,500/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("moula-ali"),
    "score": 60,
    "category": "Industrial",
    "signals": { "infrastructure": 62, "population": 60, "satellite": 60, "rera": 45, "employment": 65, "priceVelocity": 48, "govtScheme": 52 },
    "livability": { "connectivity": 58, "amenities": 52, "ecommerce": 55, "entertainment": 42, "greenSpaces": 35 },
    "highlights": [
      "Industrial zone with diverse manufacturing sector jobs",
      "NH163 connectivity to airport and eastern corridors",
      "Affordable worker housing with consistent rental occupancy",
      "Long-established locality with stable pricing history"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("musarambagh"),
    "score": 56,
    "category": "Established",
    "signals": { "infrastructure": 60, "population": 68, "satellite": 50, "rera": 38, "employment": 52, "priceVelocity": 42, "govtScheme": 48 },
    "livability": { "connectivity": 60, "amenities": 62, "ecommerce": 65, "entertainment": 52, "greenSpaces": 30 },
    "highlights": [
      "Old city residential area near Chaderghat bridge",
      "Dense mohalla-style housing with strong community character",
      "Osmania Medical College proximity - healthcare cluster",
      "Value play for old-city buyers seeking inner-ring pricing"
    ],
    "priceRange": "Rs3,200-5,000/sqft",
    "yoy": 4,
    "dataConfidence": "estimated",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 4
  },
  {
    ...locality("nagaram"),
    "score": 64,
    "category": "Emerging",
    "signals": { "infrastructure": 62, "population": 58, "satellite": 68, "rera": 58, "employment": 52, "priceVelocity": 62, "govtScheme": 62 },
    "livability": { "connectivity": 55, "amenities": 48, "ecommerce": 50, "entertainment": 40, "greenSpaces": 45 },
    "highlights": [
      "ORR Nagaram interchange driving major development activity",
      "IIT Hyderabad Research Park proximity - future tech hub",
      "Satellite data shows rapid peri-urban conversion",
      "Large-format HMDA-approved gated projects launched in 2025"
    ],
    "priceRange": "Rs3,800-6,000/sqft",
    "yoy": 11,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("keesara"),
    "score": 61,
    "category": "Emerging",
    "signals": { "infrastructure": 60, "population": 52, "satellite": 68, "rera": 55, "employment": 48, "priceVelocity": 60, "govtScheme": 62 },
    "livability": { "connectivity": 50, "amenities": 42, "ecommerce": 45, "entertainment": 35, "greenSpaces": 48 },
    "highlights": [
      "Keesara ORR interchange - gateway to eastern growth corridor",
      "Proximity to Genome Valley pharma cluster",
      "Affordable plotted development in GHMC limits",
      "Long-term appreciation expected as eastern corridor matures"
    ],
    "priceRange": "Rs2,800-4,500/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("pocharam"),
    "score": 63,
    "category": "Emerging",
    "signals": { "infrastructure": 63, "population": 55, "satellite": 68, "rera": 55, "employment": 58, "priceVelocity": 60, "govtScheme": 65 },
    "livability": { "connectivity": 52, "amenities": 45, "ecommerce": 48, "entertainment": 38, "greenSpaces": 45 },
    "highlights": [
      "Pocharam IT Park and SEZ - major employment generator",
      "GHMC-approved layouts with verified infrastructure development",
      "Satellite change detection shows 40% built-up growth 2021-2026",
      "ORR spur improving commuter access to HITEC City"
    ],
    "priceRange": "Rs3,000-5,000/sqft",
    "yoy": 11,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("saroornagar"),
    "score": 61,
    "category": "Established",
    "signals": { "infrastructure": 62, "population": 63, "satellite": 60, "rera": 50, "employment": 52, "priceVelocity": 54, "govtScheme": 52 },
    "livability": { "connectivity": 60, "amenities": 58, "ecommerce": 60, "entertainment": 48, "greenSpaces": 38 },
    "highlights": [
      "South-east Hyderabad residential hub near LB Nagar",
      "Metro Green Line proximity improving southern connectivity",
      "Established residential colony with mature amenities",
      "Affordable pricing relative to central south Hyderabad"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("ferozguda"),
    "score": 63,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 63, "satellite": 60, "rera": 52, "employment": 62, "priceVelocity": 55, "govtScheme": 50 },
    "livability": { "connectivity": 65, "amenities": 60, "ecommerce": 62, "entertainment": 52, "greenSpaces": 38 },
    "highlights": [
      "Bridge locality between Balanagar industrial zone and JNTU area",
      "Stable employment-driven residential demand",
      "Metro Blue Line improving north-south connectivity",
      "Affordable pricing for western-corridor residents"
    ],
    "priceRange": "Rs4,200-6,500/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("lalapet"),
    "score": 58,
    "category": "Established",
    "signals": { "infrastructure": 60, "population": 62, "satellite": 55, "rera": 45, "employment": 52, "priceVelocity": 50, "govtScheme": 45 },
    "livability": { "connectivity": 60, "amenities": 58, "ecommerce": 60, "entertainment": 48, "greenSpaces": 35 },
    "highlights": [
      "Established east Hyderabad residential locality",
      "Close to Ramanthapur Metro station",
      "Improving road links to Uppal and LB Nagar",
      "Affordable pricing for inner-east buyers"
    ],
    "priceRange": "Rs3,500-5,200/sqft",
    "yoy": 5,
    "dataConfidence": "estimated",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 4
  },
  {
    ...locality("pedda-amberpet"),
    "score": 62,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 64, "satellite": 60, "rera": 50, "employment": 58, "priceVelocity": 55, "govtScheme": 50 },
    "livability": { "connectivity": 65, "amenities": 62, "ecommerce": 62, "entertainment": 52, "greenSpaces": 38 },
    "highlights": [
      "Extension of Amberpet - catching urban spillover demand",
      "Metro Blue Line station improving connectivity",
      "Stable residential demand from east-corridor professionals",
      "Commercial street development increasing area vibrancy"
    ],
    "priceRange": "Rs4,200-6,500/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("uppal-kalan"),
    "score": 61,
    "category": "Emerging",
    "signals": { "infrastructure": 62, "population": 60, "satellite": 63, "rera": 52, "employment": 52, "priceVelocity": 56, "govtScheme": 55 },
    "livability": { "connectivity": 58, "amenities": 52, "ecommerce": 55, "entertainment": 42, "greenSpaces": 40 },
    "highlights": [
      "Uppal ORR interchange - eastern growth corridor access",
      "TSIIC industrial layout proximity driving employment",
      "Affordable plotted development with verified RERA projects",
      "Satellite data shows consistent residential expansion"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("tarnaka"),
    "score": 63,
    "category": "Established",
    "signals": { "infrastructure": 68, "population": 62, "satellite": 60, "rera": 50, "employment": 60, "priceVelocity": 56, "govtScheme": 52 },
    "livability": { "connectivity": 68, "amenities": 60, "ecommerce": 62, "entertainment": 52, "greenSpaces": 42 },
    "highlights": [
      "Defence Research and Development Organisation campus anchor",
      "Osmania University proximity drives academic rental demand",
      "Metro Blue Line connectivity improving commuter access",
      "Tree-lined defence-area streets offer rare green-suburb quality"
    ],
    "priceRange": "Rs4,500-7,000/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("habsiguda"),
    "score": 62,
    "category": "Established",
    "signals": { "infrastructure": 65, "population": 63, "satellite": 60, "rera": 50, "employment": 58, "priceVelocity": 55, "govtScheme": 50 },
    "livability": { "connectivity": 65, "amenities": 60, "ecommerce": 62, "entertainment": 52, "greenSpaces": 40 },
    "highlights": [
      "Adjacent to Tarnaka - DRDO and Osmania University demand spillover",
      "Metro Blue Line connectivity improving city-wide access",
      "Established residential colony with community amenities",
      "Stable demand from academic and defence professionals"
    ],
    "priceRange": "Rs4,200-6,500/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("amberpet"),
    "score": 64,
    "category": "Established",
    "signals": { "infrastructure": 68, "population": 68, "satellite": 62, "rera": 55, "employment": 60, "priceVelocity": 58, "govtScheme": 52 },
    "livability": { "connectivity": 68, "amenities": 65, "ecommerce": 68, "entertainment": 58, "greenSpaces": 40 },
    "highlights": [
      "Metro Blue Line station - high-frequency urban connectivity",
      "Dense residential hub with strong social infrastructure",
      "Close to LB Nagar commercial cluster and market",
      "Consistent appreciation driven by inner-east demand"
    ],
    "priceRange": "Rs5,000-7,500/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("malakpet"),
    "score": 58,
    "category": "Established",
    "signals": { "infrastructure": 62, "population": 70, "satellite": 52, "rera": 42, "employment": 55, "priceVelocity": 45, "govtScheme": 50 },
    "livability": { "connectivity": 62, "amenities": 68, "ecommerce": 70, "entertainment": 55, "greenSpaces": 30 },
    "highlights": [
      "Metro Blue Line station - central city connectivity",
      "Dense residential locality near Afzalgunj market hub",
      "Old city cultural character with improving infrastructure",
      "Affordable pricing for inner-south Hyderabad buyers"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 5,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("saidabad"),
    "score": 57,
    "category": "Established",
    "signals": { "infrastructure": 60, "population": 68, "satellite": 50, "rera": 40, "employment": 52, "priceVelocity": 42, "govtScheme": 48 },
    "livability": { "connectivity": 60, "amenities": 65, "ecommerce": 68, "entertainment": 52, "greenSpaces": 30 },
    "highlights": [
      "LB Nagar Metro terminal improving south connectivity",
      "Dense residential area near Mir Alam tank",
      "Affordable old-city adjacent housing",
      "Close to South Zone GHMC administrative offices"
    ],
    "priceRange": "Rs3,200-5,000/sqft",
    "yoy": 5,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("balapur"),
    "score": 59,
    "category": "Emerging",
    "signals": { "infrastructure": 60, "population": 58, "satellite": 60, "rera": 50, "employment": 48, "priceVelocity": 56, "govtScheme": 60 },
    "livability": { "connectivity": 52, "amenities": 48, "ecommerce": 50, "entertainment": 38, "greenSpaces": 42 },
    "highlights": [
      "ORR Phase 3 proximity improving southern access",
      "TSRTC bus depot and emerging transport hub",
      "Affordable plotted development attracting first-time buyers",
      "Improving social infrastructure as population grows"
    ],
    "priceRange": "Rs3,000-4,800/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("ibrahimpatnam"),
    "score": 57,
    "category": "Emerging",
    "signals": { "infrastructure": 58, "population": 52, "satellite": 62, "rera": 50, "employment": 45, "priceVelocity": 55, "govtScheme": 58 },
    "livability": { "connectivity": 48, "amenities": 42, "ecommerce": 45, "entertainment": 35, "greenSpaces": 48 },
    "highlights": [
      "Airport proximity - 15km from Rajiv Gandhi International",
      "IDP industrial zone providing employment anchor",
      "Agricultural land conversion to plotted development accelerating",
      "Long-term appreciation as southern corridor matures"
    ],
    "priceRange": "Rs2,500-4,000/sqft",
    "yoy": 9,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("turkayamjal"),
    "score": 56,
    "category": "Emerging",
    "signals": { "infrastructure": 58, "population": 50, "satellite": 62, "rera": 48, "employment": 42, "priceVelocity": 56, "govtScheme": 58 },
    "livability": { "connectivity": 45, "amenities": 40, "ecommerce": 42, "entertainment": 32, "greenSpaces": 45 },
    "highlights": [
      "Airport connectivity - 12km to terminal via NH44",
      "Affordable plotted development with large land parcels",
      "HMDA-approved layouts with long-term growth potential",
      "Southern logistics corridor future land bank play"
    ],
    "priceRange": "Rs2,200-3,800/sqft",
    "yoy": 9,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("maheshwaram"),
    "score": 57,
    "category": "Emerging",
    "signals": { "infrastructure": 58, "population": 48, "satellite": 65, "rera": 52, "employment": 48, "priceVelocity": 58, "govtScheme": 62 },
    "livability": { "connectivity": 45, "amenities": 40, "ecommerce": 42, "entertainment": 32, "greenSpaces": 45 },
    "highlights": [
      "Maheshwaram SEZ - pharma and manufacturing employment anchor",
      "Airport proximity driving land value appreciation",
      "Satellite data confirms rapid agricultural-to-residential conversion",
      "TSRTC bus connectivity to Shamshabad and LB Nagar"
    ],
    "priceRange": "Rs2,500-4,200/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("kothur"),
    "score": 55,
    "category": "Emerging",
    "signals": { "infrastructure": 55, "population": 45, "satellite": 62, "rera": 50, "employment": 42, "priceVelocity": 58, "govtScheme": 60 },
    "livability": { "connectivity": 40, "amenities": 35, "ecommerce": 38, "entertainment": 28, "greenSpaces": 42 },
    "highlights": [
      "Kothur industrial zone - emerging southern employment centre",
      "Proximity to Shadnagar ORR interchange",
      "Lowest entry pricing in greater Hyderabad metropolitan area",
      "Long-horizon land banking play for patient investors"
    ],
    "priceRange": "Rs1,800-3,200/sqft",
    "yoy": 10,
    "dataConfidence": "estimated",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 4
  },
  {
    ...locality("champapet"),
    "score": 60,
    "category": "Established",
    "signals": { "infrastructure": 63, "population": 68, "satellite": 55, "rera": 45, "employment": 55, "priceVelocity": 48, "govtScheme": 50 },
    "livability": { "connectivity": 62, "amenities": 65, "ecommerce": 68, "entertainment": 55, "greenSpaces": 35 },
    "highlights": [
      "Metro Green Line station improving north-south connectivity",
      "Established residential locality near Dilsukhnagar",
      "Improving road infrastructure reducing commute times",
      "Stable demand from working-class residential segment"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("bandlaguda"),
    "score": 58,
    "category": "Emerging",
    "signals": { "infrastructure": 60, "population": 60, "satellite": 58, "rera": 48, "employment": 50, "priceVelocity": 50, "govtScheme": 52 },
    "livability": { "connectivity": 55, "amenities": 52, "ecommerce": 55, "entertainment": 42, "greenSpaces": 38 },
    "highlights": [
      "South Hyderabad residential growth zone near Attapur",
      "Improving NH44 connectivity improving commuter access",
      "Affordable gated development attracting young families",
      "Developing commercial strip improving daily convenience"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("upparpally"),
    "score": 59,
    "category": "Emerging",
    "signals": { "infrastructure": 62, "population": 62, "satellite": 58, "rera": 48, "employment": 52, "priceVelocity": 52, "govtScheme": 52 },
    "livability": { "connectivity": 58, "amenities": 55, "ecommerce": 58, "entertainment": 45, "greenSpaces": 38 },
    "highlights": [
      "LB Nagar Metro proximity driving residential demand",
      "Developing commercial corridor on Upparpally road",
      "Affordable housing south of Attapur with improving connectivity",
      "HMDA-approved plotted developments increasing supply quality"
    ],
    "priceRange": "Rs3,800-5,800/sqft",
    "yoy": 7,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("karmanghat"),
    "score": 58,
    "category": "Established",
    "signals": { "infrastructure": 60, "population": 63, "satellite": 55, "rera": 45, "employment": 50, "priceVelocity": 48, "govtScheme": 50 },
    "livability": { "connectivity": 58, "amenities": 60, "ecommerce": 62, "entertainment": 48, "greenSpaces": 35 },
    "highlights": [
      "LB Nagar Metro zone - south Hyderabad connectivity anchor",
      "Established residential area with mature social infrastructure",
      "Close to LB Nagar commercial hub for daily needs",
      "Affordable pricing relative to inner-south Hyderabad"
    ],
    "priceRange": "Rs3,500-5,200/sqft",
    "yoy": 5,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("chandrayangutta"),
    "score": 53,
    "category": "Established",
    "signals": { "infrastructure": 58, "population": 65, "satellite": 48, "rera": 38, "employment": 48, "priceVelocity": 40, "govtScheme": 52 },
    "livability": { "connectivity": 55, "amenities": 62, "ecommerce": 65, "entertainment": 52, "greenSpaces": 30 },
    "highlights": [
      "Old city residential area with strong community character",
      "Improving road access to Falaknuma and old city core",
      "Affordable pricing for inner-south Hyderabad location",
      "Heritage value and cultural identity driving non-financial appeal"
    ],
    "priceRange": "Rs3,000-4,500/sqft",
    "yoy": 4,
    "dataConfidence": "estimated",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 4
  },
  {
    ...locality("falaknuma"),
    "score": 51,
    "category": "Established",
    "signals": { "infrastructure": 55, "population": 65, "satellite": 45, "rera": 35, "employment": 45, "priceVelocity": 38, "govtScheme": 55 },
    "livability": { "connectivity": 52, "amenities": 62, "ecommerce": 62, "entertainment": 55, "greenSpaces": 30 },
    "highlights": [
      "Falaknuma Palace heritage anchor driving tourism appeal",
      "Old city character with Nizam-era built environment",
      "Improving connectivity via Falaknuma Metro station planned",
      "Affordable entry pricing with cultural and heritage value"
    ],
    "priceRange": "Rs2,800-4,200/sqft",
    "yoy": 4,
    "dataConfidence": "estimated",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 4
  },
  {
    ...locality("santosh-nagar"),
    "score": 57,
    "category": "Established",
    "signals": { "infrastructure": 60, "population": 65, "satellite": 52, "rera": 42, "employment": 52, "priceVelocity": 45, "govtScheme": 50 },
    "livability": { "connectivity": 58, "amenities": 62, "ecommerce": 65, "entertainment": 52, "greenSpaces": 32 },
    "highlights": [
      "South Hyderabad residential locality near LB Nagar",
      "Metro Green Line proximity improving connectivity",
      "Close to Karmanghat industrial area employment",
      "Affordable mid-segment housing with stable occupancy"
    ],
    "priceRange": "Rs3,500-5,200/sqft",
    "yoy": 5,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("langar-houz"),
    "score": 58,
    "category": "Established",
    "signals": { "infrastructure": 62, "population": 65, "satellite": 52, "rera": 44, "employment": 52, "priceVelocity": 48, "govtScheme": 52 },
    "livability": { "connectivity": 60, "amenities": 62, "ecommerce": 68, "entertainment": 55, "greenSpaces": 32 },
    "highlights": [
      "South Hyderabad residential hub between Mehdipatnam and Attapur",
      "Metro Blue Line improving north-south access",
      "Mixed residential-commercial character with active street economy",
      "Affordable pricing near Falaknuma and old city border"
    ],
    "priceRange": "Rs3,800-5,500/sqft",
    "yoy": 5,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("mir-alam"),
    "score": 54,
    "category": "Established",
    "signals": { "infrastructure": 58, "population": 65, "satellite": 48, "rera": 36, "employment": 48, "priceVelocity": 38, "govtScheme": 52 },
    "livability": { "connectivity": 55, "amenities": 62, "ecommerce": 62, "entertainment": 50, "greenSpaces": 30 },
    "highlights": [
      "Mir Alam tank - rare open water body providing environmental value",
      "Old city residential character with heritage architecture",
      "Improving infrastructure as GHMC upgrades heritage zones",
      "Affordable entry point near Falaknuma for old-city buyers"
    ],
    "priceRange": "Rs2,800-4,200/sqft",
    "yoy": 4,
    "dataConfidence": "estimated",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 4
  },
  {
    ...locality("bandlaguda-jagir"),
    "score": 60,
    "category": "Emerging",
    "signals": { "infrastructure": 62, "population": 60, "satellite": 60, "rera": 50, "employment": 50, "priceVelocity": 52, "govtScheme": 55 },
    "livability": { "connectivity": 55, "amenities": 52, "ecommerce": 55, "entertainment": 42, "greenSpaces": 40 },
    "highlights": [
      "Adjacent to Tukkuguda ORR interchange improving south access",
      "HMDA plotted development activity increasing",
      "Satellite data shows growing residential footprint",
      "Affordable pricing in outer south Hyderabad growth belt"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("film-nagar"),
    "score": 68,
    "category": "Established",
    "signals": { "infrastructure": 72, "population": 62, "satellite": 65, "rera": 58, "employment": 72, "priceVelocity": 65, "govtScheme": 48 },
    "livability": { "connectivity": 72, "amenities": 70, "ecommerce": 75, "entertainment": 68, "greenSpaces": 42 },
    "highlights": [
      "Telugu film industry hub - major cultural and commercial ecosystem",
      "Celebrity residential demand drives premium land values",
      "Close to Jubilee Hills and Banjara Hills premium belt",
      "Consistent appreciation in land values over past decade"
    ],
    "priceRange": "Rs7,000-11,000/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("rethibowli"),
    "score": 65,
    "category": "Established",
    "signals": { "infrastructure": 70, "population": 60, "satellite": 62, "rera": 55, "employment": 68, "priceVelocity": 60, "govtScheme": 45 },
    "livability": { "connectivity": 70, "amenities": 65, "ecommerce": 72, "entertainment": 62, "greenSpaces": 38 },
    "highlights": [
      "Buffer zone between Mehdipatnam and Financial District",
      "IT commuter demand driving residential lease market",
      "Improving connectivity via outer ring access roads",
      "Premium pricing emerging as Financial District expands"
    ],
    "priceRange": "Rs6,000-9,500/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("shaikpet"),
    "score": 66,
    "category": "Established",
    "signals": { "infrastructure": 70, "population": 62, "satellite": 63, "rera": 56, "employment": 68, "priceVelocity": 62, "govtScheme": 46 },
    "livability": { "connectivity": 70, "amenities": 65, "ecommerce": 72, "entertainment": 62, "greenSpaces": 40 },
    "highlights": [
      "Close to Financial District and Nanakramguda IT cluster",
      "Premium residential demand from tech-sector professionals",
      "Improving road connectivity to Outer Ring Road",
      "Land-locked micro-market with limited new supply - supply constraint drives value"
    ],
    "priceRange": "Rs6,500-10,000/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("puppalaguda"),
    "score": 69,
    "category": "Emerging",
    "signals": { "infrastructure": 72, "population": 62, "satellite": 70, "rera": 62, "employment": 65, "priceVelocity": 70, "govtScheme": 65 },
    "livability": { "connectivity": 65, "amenities": 60, "ecommerce": 65, "entertainment": 55, "greenSpaces": 48 },
    "highlights": [
      "Emerging premium suburb between Narsingi and Financial District",
      "Satellite shows 50% built-up expansion in 5 years - fastest in west zone",
      "ORR access driving corporate resident influx",
      "HMDA master plan zone driving planned urban development"
    ],
    "priceRange": "Rs5,500-8,500/sqft",
    "yoy": 12,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("khajaguda"),
    "score": 72,
    "category": "High Growth",
    "signals": { "infrastructure": 75, "population": 65, "satellite": 72, "rera": 65, "employment": 70, "priceVelocity": 72, "govtScheme": 62 },
    "livability": { "connectivity": 72, "amenities": 65, "ecommerce": 68, "entertainment": 60, "greenSpaces": 48 },
    "highlights": [
      "HITEC City corridor premium - sub-market of Raidurgam cluster",
      "Tech park proximity within 2km - walk-to-work appeal",
      "ORR connectivity enabling mid-ring suburb upgrading",
      "Consistent RERA project pipeline verifies demand strength"
    ],
    "priceRange": "Rs6,000-9,500/sqft",
    "yoy": 12,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("raidurgam"),
    "score": 73,
    "category": "High Growth",
    "signals": { "infrastructure": 78, "population": 65, "satellite": 72, "rera": 65, "employment": 78, "priceVelocity": 72, "govtScheme": 58 },
    "livability": { "connectivity": 75, "amenities": 68, "ecommerce": 72, "entertainment": 65, "greenSpaces": 48 },
    "highlights": [
      "HITEC City gateway - Mindspace and Raheja IT parks walkable",
      "Premium residential demand from Microsoft Google Amazon workforce",
      "ORR exit driving corridor appreciation 15%+ annually",
      "Metro Blue Line connectivity extending tech zone residential premium"
    ],
    "priceRange": "Rs7,000-11,000/sqft",
    "yoy": 11,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("gopanpally"),
    "score": 68,
    "category": "Emerging",
    "signals": { "infrastructure": 72, "population": 62, "satellite": 70, "rera": 60, "employment": 65, "priceVelocity": 68, "govtScheme": 62 },
    "livability": { "connectivity": 65, "amenities": 58, "ecommerce": 62, "entertainment": 52, "greenSpaces": 48 },
    "highlights": [
      "ORR proximity - 5 mins to Financial District and Gachibowli",
      "Emerging premium suburb catching HITEC City demand overflow",
      "Satellite shows major gated development activity 2023-2026",
      "IIT Hyderabad proximity creates long-term academic employment anchor"
    ],
    "priceRange": "Rs5,500-8,500/sqft",
    "yoy": 11,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("nallagandla"),
    "score": 67,
    "category": "Emerging",
    "signals": { "infrastructure": 70, "population": 60, "satellite": 70, "rera": 60, "employment": 63, "priceVelocity": 68, "govtScheme": 62 },
    "livability": { "connectivity": 63, "amenities": 55, "ecommerce": 60, "entertainment": 50, "greenSpaces": 48 },
    "highlights": [
      "Outer Ring Road direct access - 10 mins to HITEC City",
      "Emerging township with large-format gated development",
      "Satellite imagery confirms rapid agricultural conversion to residential",
      "Affordable relative to Kondapur and Gachibowli - value proposition clear"
    ],
    "priceRange": "Rs5,000-7,800/sqft",
    "yoy": 11,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("serilingampally"),
    "score": 66,
    "category": "Emerging",
    "signals": { "infrastructure": 68, "population": 62, "satellite": 68, "rera": 58, "employment": 62, "priceVelocity": 65, "govtScheme": 60 },
    "livability": { "connectivity": 62, "amenities": 55, "ecommerce": 58, "entertainment": 48, "greenSpaces": 45 },
    "highlights": [
      "Serilingampally municipality - ORR western anchor point",
      "IIT Hyderabad and ISB proximity driving premium demand",
      "Affordable entry into the HITEC City orbit micro-market",
      "Active RERA-registered project pipeline verifies developer confidence"
    ],
    "priceRange": "Rs4,500-7,000/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("lingampally"),
    "score": 65,
    "category": "Emerging",
    "signals": { "infrastructure": 67, "population": 60, "satellite": 68, "rera": 57, "employment": 60, "priceVelocity": 64, "govtScheme": 60 },
    "livability": { "connectivity": 60, "amenities": 52, "ecommerce": 55, "entertainment": 45, "greenSpaces": 45 },
    "highlights": [
      "Metro Blue Line western terminus - HITEC City direct access",
      "ORR proximity enabling fast corporate-campus commute",
      "Affordable westward expansion catching Miyapur overflow demand",
      "Active gated community launches confirming growth momentum"
    ],
    "priceRange": "Rs4,200-6,500/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("beeramguda"),
    "score": 64,
    "category": "Emerging",
    "signals": { "infrastructure": 65, "population": 58, "satellite": 68, "rera": 55, "employment": 58, "priceVelocity": 62, "govtScheme": 62 },
    "livability": { "connectivity": 58, "amenities": 50, "ecommerce": 52, "entertainment": 42, "greenSpaces": 45 },
    "highlights": [
      "ORR western connector to Patancheru industrial zone",
      "Emerging residential hub catching Miyapur and Lingampally overflow",
      "Large plotted development activity with HMDA approvals",
      "Satellite data shows 42% built-up growth in 5-year window"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 11,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("gandipet"),
    "score": 62,
    "category": "Emerging",
    "signals": { "infrastructure": 60, "population": 48, "satellite": 65, "rera": 55, "employment": 50, "priceVelocity": 65, "govtScheme": 58 },
    "livability": { "connectivity": 52, "amenities": 45, "ecommerce": 48, "entertainment": 38, "greenSpaces": 55 },
    "highlights": [
      "Gandipet reservoir - pristine lake setting and green lung of west HYD",
      "Strict development controls protecting environmental character",
      "Growing demand from lifestyle-first buyers seeking nature proximity",
      "Emerging eco-resort and farmhouse community development"
    ],
    "priceRange": "Rs3,500-5,500/sqft",
    "yoy": 9,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("golconda"),
    "score": 60,
    "category": "Established",
    "signals": { "infrastructure": 62, "population": 58, "satellite": 55, "rera": 45, "employment": 55, "priceVelocity": 52, "govtScheme": 62 },
    "livability": { "connectivity": 58, "amenities": 55, "ecommerce": 55, "entertainment": 48, "greenSpaces": 42 },
    "highlights": [
      "Golconda Fort - UNESCO World Heritage buffer zone",
      "Tourism economy driving hospitality and retail demand",
      "Qutb Shahi tombs proximity - cultural and heritage anchor",
      "Improving road access between old city and western suburbs"
    ],
    "priceRange": "Rs4,000-6,500/sqft",
    "yoy": 6,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("yousufguda"),
    "score": 64,
    "category": "Established",
    "signals": { "infrastructure": 70, "population": 62, "satellite": 62, "rera": 55, "employment": 62, "priceVelocity": 58, "govtScheme": 48 },
    "livability": { "connectivity": 68, "amenities": 65, "ecommerce": 70, "entertainment": 60, "greenSpaces": 40 },
    "highlights": [
      "Premium residential pocket adjacent to Banjara Hills",
      "Low commercial density - quiet and desirable residential character",
      "Close to Jubilee Hills and Film Nagar cultural economy",
      "Consistent appreciation driven by limited land supply in inner west"
    ],
    "priceRange": "Rs5,500-8,500/sqft",
    "yoy": 8,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  },
  {
    ...locality("madinaguda"),
    "score": 66,
    "category": "Emerging",
    "signals": { "infrastructure": 68, "population": 62, "satellite": 68, "rera": 58, "employment": 62, "priceVelocity": 65, "govtScheme": 60 },
    "livability": { "connectivity": 62, "amenities": 55, "ecommerce": 58, "entertainment": 48, "greenSpaces": 45 },
    "highlights": [
      "ORR Miyapur interchange driving residential and commercial demand",
      "Metro Blue Line terminal increasing connectivity to HITEC City",
      "Active gated community development - multiple RERA-registered projects",
      "Satellite shows sustained 35%+ built-up area growth since 2020"
    ],
    "priceRange": "Rs4,500-7,200/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 6
  },
  {
    ...locality("osmansagar"),
    "score": 56,
    "category": "Emerging",
    "signals": { "infrastructure": 55, "population": 42, "satellite": 60, "rera": 45, "employment": 40, "priceVelocity": 60, "govtScheme": 58 },
    "livability": { "connectivity": 45, "amenities": 38, "ecommerce": 40, "entertainment": 30, "greenSpaces": 55 },
    "highlights": [
      "Osmansagar reservoir - protected water body with scenic character",
      "Low-density development zones protecting lake ecosystem",
      "Eco-tourism and farmhouse economy emerging around reservoir",
      "Long-term land bank value as water-body premium grows"
    ],
    "priceRange": "Rs2,500-4,000/sqft",
    "yoy": 8,
    "dataConfidence": "estimated",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 4
  },
  {
    ...locality("himayat-sagar"),
    "score": 55,
    "category": "Emerging",
    "signals": { "infrastructure": 52, "population": 40, "satellite": 58, "rera": 42, "employment": 38, "priceVelocity": 58, "govtScheme": 60 },
    "livability": { "connectivity": 42, "amenities": 35, "ecommerce": 38, "entertainment": 28, "greenSpaces": 55 },
    "highlights": [
      "Himayat Sagar twin reservoir system - rare environmental value",
      "Strict GHMC buffer zones limiting overdevelopment",
      "Farmhouse and weekend retreat demand driving large-plot sales",
      "Long-horizon appreciation as water-body scarcity premium builds"
    ],
    "priceRange": "Rs2,200-3,800/sqft",
    "yoy": 8,
    "dataConfidence": "estimated",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 4
  },
  {
    ...locality("chilukur"),
    "score": 54,
    "category": "Emerging",
    "signals": { "infrastructure": 52, "population": 40, "satellite": 58, "rera": 40, "employment": 38, "priceVelocity": 56, "govtScheme": 55 },
    "livability": { "connectivity": 40, "amenities": 35, "ecommerce": 38, "entertainment": 28, "greenSpaces": 52 },
    "highlights": [
      "Chilukur Balaji temple - pilgrimage anchor with daily footfall",
      "Close to Gandipet lake - dual environmental premium",
      "Low-density peaceful residential character near water bodies",
      "Entry-level pricing for buyers seeking outer-west lifestyle"
    ],
    "priceRange": "Rs2,000-3,500/sqft",
    "yoy": 7,
    "dataConfidence": "estimated",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 4
  },
  {
    ...locality("isnapur"),
    "score": 62,
    "category": "Emerging",
    "signals": { "infrastructure": 63, "population": 55, "satellite": 65, "rera": 55, "employment": 55, "priceVelocity": 60, "govtScheme": 62 },
    "livability": { "connectivity": 52, "amenities": 45, "ecommerce": 48, "entertainment": 38, "greenSpaces": 45 },
    "highlights": [
      "ORR Patancheru interchange - western industrial corridor access",
      "Medak road industrial zone providing stable employment",
      "Satellite shows growing plotted development and township activity",
      "Affordable western corridor option catching Miyapur overflow"
    ],
    "priceRange": "Rs3,000-5,000/sqft",
    "yoy": 10,
    "dataConfidence": "partial",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": 5
  }
]

export const cityMeta = {
  name: hydCity.name,
  slug: hydCity.slug,
  center: hydCity.center,
  zoom: hydCity.zoom,
  state: hydCity.state,
  totalAreas: hyderabadAreas.length,
}
