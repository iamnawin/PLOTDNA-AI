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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
  },

]

export const cityMeta = {
  name: hydCity.name,
  slug: hydCity.slug,
  center: hydCity.center,
  zoom: hydCity.zoom,
  state: hydCity.state,
  totalAreas: hyderabadAreas.length,
}
