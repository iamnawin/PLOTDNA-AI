# PlotDNA — Product Roadmap

> **Mission:** Scalable real estate intelligence platform for India and UAE. Decode the DNA of any location — plot, micro-market, locality, district — using verifiable signals, honest data confidence labels, and deterministic scoring.
>
> **Expansion order:** Telangana → Andhra Pradesh → Pan-India → UAE → Thailand

---

## Guiding Principles

1. **Accuracy over coverage** — A small verified dataset beats a large fabricated one.
2. **Honest fallback** — If exact data is unavailable, label it explicitly. Never show a score with no real basis.
3. **Deterministic scoring** — DNA scores come from real data. AI is used for summarization and verdicts only, never for generating signal values.
4. **Platform not a list** — Every architectural decision must scale to 10,000 localities, not 20.
5. **Trust first** — Users are making financial decisions. Approximation labels are non-negotiable.

---

## Current State (May 2026)

- **8 cities live:** Hyderabad, Bangalore, Mumbai, Chennai, Pune, Delhi NCR, Vijayawada, Visakhapatnam
- MapLibre GL map with polygon overlays, hover tooltips, tier filtering, 3D tilt
- DNA Score: 7 signals, fixed weights, 4 tier bands
- 4-tier location resolver: exact → nearby → cluster → uncovered
- AreaDetail: score breakdown, signal bars, growth timeline, 5-year outlook, source links
- `Locate me` geolocation flow on landing with approximation labels
- PDF lead capture (email gate after 5s on AreaDetail)
- All 8 cities have resolver-grade JSON data (localities, aliases, clusters, city config)

**Current gap:** Coverage is limited to 8 cities with ~20–40 localities each. This is inadequate for a real production platform. Telangana alone has 33 districts and hundreds of relevant micro-markets outside the current Hyderabad dataset. The resolver pipeline is architecturally sound but needs scale.

---

## Location Intelligence Architecture

Every user input type — lat/lng, map click, address text, shared link — feeds into the same resolution pipeline:

```
User input
    ↓
Input normalizer (parse lat/lng | geocode address | decode share link)
    ↓
5-tier resolver
    ↓
Score engine (verified signals only, null = excluded from weighted avg)
    ↓
Confidence label assignment
    ↓
UI render

────────────────────────────────────────────────────────────
Tier 1: EXACT        point-in-polygon hit → "Verified data"
Tier 2: NEARBY       within radius of centroid → "Nearby estimate — Xkm from {locality}"
Tier 3: CLUSTER      district/zone boundary → "Regional estimate — limited data"
Tier 4: REGIONAL     supported state, no sub-district → "No local data yet"
Tier 5: UNCOVERED    outside all supported regions → "Not covered yet"
────────────────────────────────────────────────────────────
```

**Rules:**
- Tier 2+ always shows an approximation label. Never silently present as exact.
- Score only shown for Tier 1 and Tier 2. Tier 3+ shows macro signals only.
- Localities with fewer than 4 verified signals show a warning badge, never a clean score.
- `dataConfidence` field required on every `MicroMarket`: `"verified"` | `"partial"` | `"estimated"` | `"uncovered"`

---

## Phase 1 — Foundation ✅ Complete

| Deliverable | Status |
|-------------|--------|
| MapLibre GL map, polygon overlays, tier filtering | ✅ |
| DNA score system (7 signals, weighted, 4 tiers) | ✅ |
| 8 cities with static data | ✅ |
| 4-tier resolver (exact/nearby/cluster/uncovered) | ✅ |
| AreaDetail page (score, timeline, outlook, sources) | ✅ |
| `Locate me` geolocation flow, approximation labels | ✅ |
| PDF email gate after 5s | ✅ |

---

## Phase 2 — Complete Telangana

**Goal:** Full Telangana state coverage. Every district resolvable at Tier 3 minimum. Hyderabad urban area at Tier 1 for 200+ localities.

### 2A — Hyderabad urban deep coverage

- Expand from ~40 localities to 200+ verified localities in HMDA zone
- Sources: HMDA GIS, OSM Overpass API, RERA Telangana
- Polygon accuracy: true point-in-polygon, not centroid proximity
- Every locality: all 7 signals populated from real data, `dataConfidence: "verified"`
- Priority corridors: Financial District, ORR west/north, Kompally, LB Nagar, Uppal, Shamshabad

### 2B — RERA Telangana integration

- Scrape active projects from TSRERA portal (monthly refresh)
- Map project coordinates → locality slugs
- Populate `rera` signal dynamically (replaces static estimate)
- Cache in Supabase, expose via `/api/v1/rera/telangana/{area_slug}`

### 2C — Telangana district fallback (Tier 3)

- 33 district boundary polygons (source: Bhunaksha / OSM admin-level-5)
- Aggregate signals per district from constituent localities or district-level estimates
- District pages: `/district/rangareddy`, `/district/warangal`, `/district/nizamabad`
- Infrastructure context: TSSIIC parks, town planning schemes, NH projects

### 2D — Priority micro-markets beyond Hyderabad

- Warangal (Kazipet, Hanamkonda, Warangal Urban)
- Nizamabad, Karimnagar, Khammam
- ORR growth corridor: Shadnagar, Tandur, Bibinagar, Bhongir, Raviryal

**Success criteria:**
- [ ] 200+ Tier 1 localities in Hyderabad urban
- [ ] 33 Tier 3 district fallbacks live
- [ ] `rera` signal dynamic for all Hyderabad localities
- [ ] `dataConfidence` + `dataAsOf` fields on every locality

---

## Phase 3 — Complete Andhra Pradesh

**Goal:** Full AP state coverage. 26 districts at Tier 3. Priority metros at Tier 1/2.

### 3A — Amaravati Capital Region
- CRDA zone boundaries, layout approvals
- Amaravati, Mangalagiri, Tadepalli, Undavalli, Guntur
- Source: AP CRDA GIS, RERA AP

### 3B — Vizag metro expansion
- Expand beyond current: VUDA zone, Bheemunipatnam, Kommadi, Madhurawada
- SEZ overlay: Vizag SEZ, NIMZ Nakkapalle
- Source: VUDA GIS, RERA AP

### 3C — Tirupati / Nellore / Krishna
- Tirupati + Srikalahasti growth corridor
- Nellore (NUDA zone)
- Krishna: Vijayawada expansion, Ibrahimpatnam, Gannavaram

### 3D — AP district fallback (Tier 3)
- 26 district boundary polygons
- District pages for all 26 AP districts

**Success criteria:**
- [ ] 150+ Tier 1 localities across AP major cities
- [ ] 26 Tier 3 district fallbacks live
- [ ] RERA AP integration (monthly refresh)

---

## Phase 4 — Intelligence Layer (runs parallel to geo expansion)

**Goal:** Live news, AI verdicts, dynamic pricing signal. Works across all covered localities.

### 4A — News Aggregation Service

```
backend/app/services/
  news_aggregator.py    ← fetch 30+ RSS feeds (India real estate news)
  entity_router.py      ← match articles to city/area slugs via alias map + fuzzy match
  news_cache.py         ← Redis 6h TTL per city
```

**RSS sources:**
- ET Realty, TOI Property, Moneycontrol RE, NDTV Property, Hindu BusinessLine
- Telangana Today, Deccan Chronicle (infra, TSRERA)
- Deccan Herald / Bangalore Mirror (Karnataka)
- MahaRERA, TSRERA, K-RERA news feeds
- The Hindu (AP edition)

### 4B — AI Verdict Endpoint

```
POST /api/v1/verdict/{city_slug}/{area_slug}
```

Flow:
1. Pull area signals from Supabase
2. Pull recent news (7 days) from Redis cache
3. Build structured prompt → Gemini Flash API
4. Return `{ summary, reasons_to_buy[3], risks[3], verdict, confidence }`
5. Cache: Redis 24h TTL

Verdict format:
```json
{
  "verdict": "buy" | "hold" | "wait" | "avoid",
  "confidence": 72,
  "summary": "...",
  "reasons": ["Metro Phase 2 station confirmed 800m away"],
  "risks": ["Oversupply risk in 2-3 years"],
  "suitable_for": "investment" | "end-use" | "both",
  "data_confidence": "verified" | "partial" | "estimated",
  "last_updated": "2026-05-11T10:00:00Z"
}
```

**Note:** AI generates the `verdict` and `summary`. It does NOT generate signal values. Signal values come only from real data sources.

### 4C — Market Pulse (Price Intelligence)

- Scrape 99acres / MagicBricks area-level listing prices (weekly)
- Track median price per sqft + 6-month trend direction
- Makes `priceVelocity` dynamic, not hardcoded
- RERA project count + delayed count per area
- Market snapshot section on AreaDetail

### 4D — Cmd+K Search

- Global keyboard shortcut: `Cmd+K` / `Ctrl+K`
- Fuzzy search: all cities, localities, districts
- Navigate directly to area/district/city page

**Success criteria:**
- [ ] 30+ RSS feeds aggregated, cached, entity-routed
- [ ] AI verdict live for all Hyderabad localities
- [ ] `priceVelocity` dynamic for 2+ states
- [ ] Cmd+K search working across all covered localities

---

## Phase 5 — Pan-India Expansion

**Goal:** Top real estate markets covered to Tier 1/2. All states/UTs covered to Tier 3 (district fallback).

| Market | Priority | Rationale |
|--------|----------|-----------|
| NCR (Gurugram, Noida, Greater Noida) | 1 | Highest transaction volume |
| Bengaluru (BBMP + BDA full zone) | 2 | IT corridor density, K-RERA active |
| Pune (PMC + PCMC) | 3 | Second-largest Maharashtra market |
| Mumbai MMR (Thane, Navi Mumbai, Kalyan) | 4 | Highest price velocity data |
| Chennai (CMDA full zone) | 5 | Stable demand, TNRERA active |
| Tier-2 cities | 6 | Coimbatore, Kochi, Ahmedabad, Jaipur, Lucknow, Indore |

**Data sources (pan-India):**
- RERA portals: MahaRERA, K-RERA, TNRERA, UP RERA, Haryana RERA
- State GIS: Bhunaksha, Bhuvan, DMIC corridor GIS
- OSM Overpass: amenities, roads, metro, schools, hospitals
- Census 2021: population density, urbanization
- Ministry of Road Transport: NH projects
- Smart Cities Mission: project pipeline

**Target:** 1,000+ Tier 1 localities across top 10 markets

**Implementation status:** Phase 5 now has full India regional fallback coverage for all 28 states and 8 union territories in `data/india/regions.json`, plus baseline resolver-grade support for the priority metros already in `data/cities/`. This is regional-only outside curated metro localities; it must not be treated as verified locality scoring until real market datasets are added.

---

## Phase 6 — UAE Expansion

**Goal:** Dubai, Abu Dhabi, Sharjah with DLD-verified pricing signals.

### Data sources
- Dubai REST API / Dubai Pulse (transaction prices, rental index, infrastructure)
- Dubai Land Department (DLD) zone boundaries
- Abu Dhabi City Municipality GIS
- RERA UAE (project registrations)
- OSM UAE

### Differences from India
- Currency: AED (display alongside INR for NRI cross-market comparison)
- RERA: different per emirate
- Coordinate convention: same WGS84 `[lat, lng]` storage
- New slugs: `"uae-dubai"`, `"uae-abudhabi"`, `"uae-sharjah"`

**Target:** Dubai DLD zones full coverage (Tier 1), Abu Dhabi zones Tier 2

---

## Phase 7 — Backend API + Admin Pipeline

**Goal:** Replace static frontend JSON with PostGIS-backed API. Enable dynamic scoring and admin data management.

### Architecture shifts
- Locality polygons → PostGIS `ST_Contains` point-in-polygon (replaces bundled JSON)
- Location resolver → FastAPI endpoint (`POST /api/v1/resolve`) replaces frontend `resolver.ts`
- Nominatim geocoding → backend proxy with Redis cache (TTL 30 days)
- GEE satellite jobs → Celery background queue, cached in Supabase
- RERA data → nightly scrape job, feeds `rera` signal automatically

### New endpoints
```
POST /api/v1/resolve           { lat, lng } or { address } → LocalityResolution
GET  /api/v1/locality/:slug    MicroMarket + signals + confidence
GET  /api/v1/district/:slug    District Tier 3 summary
GET  /api/v1/search            Autocomplete for locality/district/city
POST /api/v1/verdict/:slug     AI verdict (cached 24h)
GET  /api/v1/news/:city_slug   Latest news (cached 6h)
POST /api/v1/admin/locality    Add/update locality (authenticated)
POST /api/v1/admin/signal      Update individual signal (authenticated)
```

### Admin data pipeline
- Web UI: draw polygon → fill signal values + source URLs → set confidence → publish
- Signal update: source URL + value + as-of date required for each signal
- Validation: reject `dataConfidence: "verified"` if fewer than 4 signals have real data
- Audit log: who changed what signal, when, source URL

---

## Phase 8 — Monetization

| Tier | Price | Features |
|------|-------|---------|
| Free | ₹0 | Map view, locality overview, Tier 1–3 resolution |
| Pro | ₹499/mo | Full signal breakdown, PDF reports, comparison, watchlist |
| Investor | ₹1,499/mo | Price alerts, RERA tracker, NRI comparison, API |
| B2B | Custom | Builder/agent white-label, bulk export, SLA |

---

## Signal Data Sources and Refresh Cadence

| Signal | Weight | Primary Source | Refresh |
|--------|--------|----------------|---------|
| infrastructure | 25% | OSM Overpass + NHAI project data | 6 months |
| population | 20% | Census + GHSL satellite estimates | Yearly |
| satellite | 20% | Google Earth Engine NDBI/NDVI | 6 months |
| rera | 15% | State RERA portal (scrape) | Monthly |
| employment | 10% | CMIE + SEZ registry | Quarterly |
| priceVelocity | 5% | 99acres/MagicBricks (scrape) | Monthly |
| govtScheme | 5% | Smart Cities Mission + state portals | Quarterly |

---

## Production Readiness Gates

Before any new region ships:

**Accuracy**
- [ ] All scores derive from verifiable data — no AI-invented signal values
- [ ] Every locality has `dataConfidence`, `dataAsOf`, `signalsAvailable` fields
- [ ] Missing signals excluded from weighted average (not treated as 0)

**Trust**
- [ ] Tier 2+ resolutions show approximation labels — never silently presented as exact
- [ ] Localities with < 4 verified signals show warning badge, no clean score
- [ ] Source links on AreaDetail for all signal data

**Scalability**
- [ ] Locality polygons in PostGIS beyond 500 localities (not bundled JSON)
- [ ] Nominatim results cached in Redis (TTL 30 days)
- [ ] GEE satellite jobs async, cached 30 days

**Maintainability**
- [ ] Single source of truth per locality — no duplication across frontend/backend
- [ ] Admin pipeline documented: how to add locality, update signal, update polygon
- [ ] Resolver smoke test runs in CI (detects slug mismatches)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + MapLibre GL |
| State | Zustand |
| Backend | FastAPI (Python 3.11) |
| Cache | Redis (Upstash free tier → Redis Cloud at scale) |
| AI | Gemini Flash (verdicts/summaries) → Groq fallback |
| DB | Supabase (PostgreSQL + PostGIS) |
| Deploy | Vercel (frontend) + Render (backend) |
| Satellite | Google Earth Engine Python SDK (async, 30d cache) |
| Geocoding | Nominatim (1 req/sec, Redis cache 30d) |

---

## Key Conventions

- City slugs: lowercase, no spaces (`hyderabad`, `delhi`)
- Area slugs: lowercase-hyphenated (`financial-district`, `kokapet`)
- District slugs: `rangareddy`, `krishna`, `east-godavari`
- State slugs: `telangana`, `andhra-pradesh`, `uae-dubai`
- Coordinates in data: `[lat, lng]` WGS84 — flip to `[lng, lat]` for MapLibre
- Dark theme: `#0a0a0a` background, IBM Plex Mono font
- Branch names: `feat/`, `fix/`, `docs/` prefix

---

*Last updated: May 2026*
*Owner: Naveen / ZeroOrigins AI*
