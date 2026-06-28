# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Platform Vision

**PlotDNA is a scalable real estate intelligence platform for India and UAE — not a static city-list app.**

The platform decodes the "DNA" of any location (plot, micro-market, locality, district) and shows growth potential based on verifiable signals: infrastructure pipeline, population trends, RERA activity, satellite change, employment, and pricing velocity.

**Core design principle:** Accuracy and trust over fake precision. When data is incomplete, say so clearly. Never invent a score for an area that has no real data.

**Platform scope (in order of priority):**
1. Telangana (complete state coverage)
2. Andhra Pradesh (complete state coverage)
3. Phased pan-India expansion
4. UAE (Dubai, Abu Dhabi, Sharjah)

---

## Commands

```bash
# Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
npm run build        # tsc -b && vite build
npm run lint         # eslint .

# Frontend smoke tests (Node.js scripts, no test runner required)
# Run individual checks:
npm run test:hyderabad-production
npm run test:area-dna-paywall
npm run test:pdf-report-quality
npm run test:payment-recognition
npm run test:email-otp-contract
npm run test:landing-search-redesign
# Full list: see all "test:*" entries in frontend/package.json

# Backend (http://localhost:8000)
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Backend tests
python -m unittest discover -s tests -v
# Run a single test module:
python -m unittest tests.test_custom_report_leads -v

# Hyderabad coverage build + spatial validation
python scripts\build_hyderabad_coverage.py
python scripts\validate_hyderabad_coverage.py
```

TypeScript errors surface via `npm run build`. Backend OpenAPI docs at `http://localhost:8000/docs`.

---

## Architecture

### Current state: Hybrid (frontend static data + live backend)
Static area data lives in `frontend/src/data/` as TypeScript files. The FastAPI backend is **live at `https://plotdna-api.onrender.com`** and serves auth, entitlements, verdicts, AVM, market pulse, RERA, brochure parsing, and AI chat routes. In dev, `VITE_API_URL` overrides the default to `http://localhost:8000`. The app also runs as a Capacitor native mobile app — `frontend/src/lib/runtime.ts` detects the platform via `Capacitor.isNativePlatform()`.

### Data flow (current)
```
frontend/src/data/{city}.ts   →  cities.ts registry  →  Zustand store  →  MapView + UI
data/cities/{city}/*.json     →  location/resolver.ts  (coordinate → locality resolution)
                                  (CITIES, getCityEntry,  (useAppStore)
                                   getAllAreas, etc.)
```

### Data flow (target architecture)
```
User input (lat/lng | map click | address | shared link)
    ↓
Location Intelligence Layer  (resolver.ts → future: backend API)
    ↓
5-tier fallback resolution   (exact → nearby → cluster → regional → uncovered)
    ↓
Locality dataset lookup      (static JSON now → PostGIS/Supabase future)
    ↓
Deterministic score engine   (signal weights × verified data → DNA score)
    ↓
Confidence label             (verified / nearby-estimate / regional-only / uncovered)
    ↓
UI render
```

### Key files

| File | Purpose |
|------|---------|
| `frontend/src/data/cities.ts` | City registry — `CITIES`, `getCityEntry()`, `getAllAreas()`, `getCityForArea()` |
| `frontend/src/store/index.ts` | Zustand store — `selectedArea`, `selectedCitySlug`, `mapStyleKey`, `is3D`, `searchCoords`, `showConstruction`, `recommendationGoal`, etc. |
| `frontend/src/types/index.ts` | Core types: `MicroMarket`, `Signals`, `Livability`, `CityMeta`, `Category`, `ActiveProject`, `RecommendationGoal` |
| `frontend/src/lib/utils.ts` | Score → color/label/bg helpers + `SIGNAL_LABELS` + `SIGNAL_WEIGHTS` |
| `frontend/src/lib/plotAnalysis.ts` | `parseCoords()`, `findNearestArea()`, `getGrowthMilestones()`, `getOutlook()` |
| `frontend/src/lib/areaSources.ts` | Per-area research source links shown in AreaDetail |
| `frontend/src/lib/location/resolver.ts` | Coordinate → locality resolution (5-tier fallback) |
| `frontend/src/lib/location/classifier.ts` | Converts `ResolutionCandidates` → `LocalityResolution` with tier + reason |
| `frontend/src/lib/location/contracts.ts` | `LocalityResolution`, `ResolutionTier`, `DataConfidence` types |
| `frontend/src/lib/entitlements.ts` | Client-side entitlement state, local cache, and backend sync logic |
| `frontend/src/lib/paymentLinks.ts` | Razorpay payment link generation and payment status polling |
| `frontend/src/lib/analytics.ts` | Vercel Analytics event helpers |
| `frontend/src/lib/customBuyerBrief.ts` | Custom buyer brief form state and submission logic |
| `frontend/src/components/map/MapView.tsx` | MapLibre GL map with polygon layers, hover tooltip, coordinate pin |
| `frontend/src/components/ui/CustomReportLeadModal.tsx` | Rs 99/Rs 499 payment capture modal |
| `frontend/src/components/ui/EmailGateModal.tsx` | OTP email gate for access restoration |
| `backend/app/services/location_resolver.py` | Backend coordinate → locality resolver (mirrors frontend resolver) |
| `backend/app/services/custom_report_leads.py` | Lead/payment JSONL store, Razorpay webhook handling, entitlement activation |
| `backend/app/services/entitlements_store.py` | Server-side entitlement CRUD keyed by `user_id` |
| `backend/app/services/market_catalog.py` | Loads and queries the area/locality catalog for backend resolution |
| `backend/app/services/scoring_engine.py` | Weighted signal aggregation → deterministic DNA score |
| `backend/app/api/routes/leads.py` | `/api/leads/*` — Razorpay webhook, self-confirm (being disabled), recovery |
| `backend/app/api/routes/entitlements.py` | `/api/entitlements/*` — check/grant/restore entitlements |
| `backend/app/api/routes/auth.py` | `/api/auth/*` — OTP send/verify, session identity |

### Map library
The map uses **MapLibre GL** via `react-map-gl` (NOT Leaflet). Basemaps are free tiles (CartoCDN dark/light, ArcGIS satellite, OpenTopoMap terrain) — no API key needed.

### Critical coordinate convention
Data files store coordinates as `[lat, lng]`. MapLibre GL requires `[lng, lat]`.
**Always flip** when passing to MapLibre: `[area.center[1], area.center[0]]` or `polygon.map(([lat, lng]) => [lng, lat])`.

---

## DNA Score System

Score is a 0–100 integer derived from 7 signals with fixed weights. **Scores must be deterministic — derived from real data, not AI-generated guesses.**

| Signal | Weight |
|--------|--------|
| infrastructure | 25% |
| population | 20% |
| satellite | 20% |
| rera | 15% |
| employment | 10% |
| priceVelocity | 5% |
| govtScheme | 5% |

Score tiers:
- 86–100 → Goldzone (`#10b981` emerald)
- 66–85 → Good Growth (`#22c55e` green)
- 41–65 → Moderate (`#f59e0b` amber)
- 0–40 → High Risk (`#ef4444` red)

**Scoring rules (non-negotiable):**
- Never fabricate a signal value. If data is missing, mark that signal as `null` and exclude it from the weighted average.
- A locality with fewer than 4 verified signals must show a confidence badge: `"Limited data — score may not reflect full picture"`.
- Score confidence levels: `verified` | `partial` | `estimated` | `uncovered`.

---

## Location Intelligence Architecture

### Input types supported
Every input type must resolve through the same 5-tier fallback pipeline:

| Input type | Example |
|------------|---------|
| Latitude/longitude | `17.4485, 78.3908` |
| Map click | User taps a point on MapLibre canvas |
| Shared location link | Google Maps URL, Plus Code, what3words |
| Address / locality name | "Kokapet, Hyderabad" |
| District / state search | "Rangareddy district, Telangana" |

### 5-tier fallback resolution

```
Tier 1: EXACT MATCH
  Condition: coordinate is inside a known polygon (point-in-polygon)
             OR address resolves to a verified locality slug
  Output: Full PlotDNA dataset for that locality
  Label: "Verified data" (no approximation warning)

Tier 2: NEARBY MATCH
  Condition: no exact polygon hit, but within nearbyMicroMarketRadiusKm
             of a verified locality centroid
  Output: Nearest locality's dataset
  Label: "Nearby estimate — {distance}km from {locality}"
  Rule: Do not present the matched locality as the user's actual location

Tier 3: CLUSTER / ZONE FALLBACK
  Condition: no nearby match, but inside a district/zone catchment area
  Output: Zone-level aggregated signals (e.g., "Rangareddy South Zone")
  Label: "Regional estimate — limited data for this exact location"
  Rule: Show only signals with district-level confidence; suppress others

Tier 4: REGIONAL / STATE FALLBACK
  Condition: inside a supported state (Telangana / AP / India / UAE)
             but no sub-district data
  Output: State/city-level macro summary only
  Label: "No micro-market data yet for this area"
  Rule: Show infrastructure context and expansion timeline

Tier 5: UNCOVERED
  Condition: outside all supported regions
  Output: "PlotDNA does not cover this area yet"
  Label: Honest message with expansion roadmap reference
  Rule: Never fabricate any score or estimate for uncovered areas
```

### Resolver files per region
Each region (state / major city) must have:
```
data/regions/{region}/
├── city.json        — center, zoom, coverage radius, buffer distances
├── localities.json  — per-locality center + polygon (GeoJSON)
├── aliases.json     — { localitySlug: [aliasStrings] } for name normalization
├── clusters.json    — zone cluster definitions (North/South/East/West/Central)
└── districts.json   — district boundaries for Tier 3 fallback
```

### Address / name resolution pipeline
```
User input (text)
    ↓
1. Alias lookup in aliases.json (fast, offline)
    ↓ no match
2. Fuzzy match against known locality names (Levenshtein, ≥85% threshold)
    ↓ no match
3. Geocode via Nominatim (rate-limited: 1 req/sec, cache all results)
    ↓ returns lat/lng
4. Feed lat/lng into 5-tier fallback resolver
```

---

## Coverage Roadmap

### Phase 1 (current): 8 major cities — static data
- Hyderabad, Bangalore, Mumbai, Chennai, Pune, Delhi, Vijayawada, Vizag
- Data: static JSON/GeoJSON and TypeScript city entries
- Resolver: coordinate and address fallback through exact / nearby / cluster / uncovered paths
- Status: live frontend with backend services for auth, entitlements, search, and reports

### Hyderabad flagship coverage status
- Hyderabad now uses an irregular product boundary, not a circular/radius disk.
- Generated coverage contains 310 contiguous cells across about 11,947 sq km, including the 65-70 km outskirts belt.
- Scored market cells currently cover 235 locality catalog entries with verified/partial score data; the full Hyderabad locality catalog remains the source for address aliases and scored market records.
- Extra context-only cells subdivide the outer belt using OSM place centroids plus supplemental backlog/Nominatim-checked centroids. These cells are deliberately marked `contextOnly: true`, `marketable: false`, and `boundaryConfidence: approximate`.
- Context-only cells must not be shown as official village, ward, cadastral, HMDA, or GHMC boundaries. They are temporary display subdivisions to avoid giant fake chunks; official TGRAC village polygons are stored as source evidence for validation, not as the rendered PlotDNA market shape.
- Context-cell coordinate/address search now returns an honest non-scored context result (`tier: "context"`, `precision: "context_area"`, `scorePrecision: "unscored_context"`) instead of substituting a nearby scored market.
- The map must open with all Hyderabad scored coverage visible. Tier filters are optional user actions; when a filter is active, non-matching scored polygons must remain visibly filled/bordered instead of becoming dark satellite holes.
- Context-only/no-score polygons must be styled as muted pending-data areas, not saturated primary coverage. They should stay visually subordinate at overview zoom, highlight only the specific pending cell under the cursor, and show a "Data pending" card on hover or click with the approximate area name, boundary confidence, area size, and a clear note that PlotDNA will validate that exact area before assigning a score; double-clicking them must not route to a scored AreaDetail page.
- Pending context cells now have a source audit at `data/cities/hyderabad/pending-context-sources.json`: 75 context cells audited, 47 matched to Telangana TGRAC `HMDA ORR GHMC Village Boundary`, 28 matched to statewide TGRAC `Village Boundary`, and 0 remain without official village/admin context.
- TGRAC-matched pending cells also have reproducible local boundary evidence at `data/cities/hyderabad/tgrac-pending-village-boundaries.geojson`: 73 unique official village polygons cover the 75 matched pending rows because some pending cells share the same official source feature. These are source evidence only, not PlotDNA scored market polygons.
- Hyderabad pending hover/search cards must show their own detail state for every visible pending polygon: official village/mandal/district plus revenue/division/admin/DMV/source identifiers where available, and the missing score-signal categories that keep the area data-pending.
- `data/cities/hyderabad/pending-scoring-readiness.json` is the promotion gate: all 75 pending cells have official boundary evidence, 0 are promotion-ready, and all 75 remain blocked by missing price/RERA/infrastructure/satellite/employment/government-scheme signal decks.
- `data/cities/hyderabad/pending-signal-inventory.json` records the source path for the six required pending score signals for all 75 pending cells. Its `source_identified` status is explanatory only; it must not be treated as verified signal evidence or used to assign a PlotDNA score.
- `data/cities/hyderabad/pending-price-signals.json` records exact-area Telangana Registration unit-rate evidence for pending cells where the official village/mandal/district names could be matched. As of 2026-06-27, 41 of 75 pending cells have verified official price-band rows; this verifies only the price signal and does not unlock scoring by itself.
- Large scored cells with `boundaryConfidence: "broad"` are generated market cells, not precise locality boundaries. They must render below primary scored polygon strength and their tooltip must explicitly say the polygon is a generated broad market cell until sourced boundaries replace them.
- Phase 1 coverage validation now emits `.omx/artifacts/hyderabad-coverage-report.json` with pending-detail readiness metrics: 75 context cells, 75 official matches, 75 scoring-readiness rows, 75 signal inventories, 0 promotion-ready rows, 41 verified price signals, and 2 verified infrastructure signals. Treat those verified signal counts as partial evidence only; they do not promote a pending cell until every required signal deck is verified.
- Remaining Hyderabad data work: attach verified score signal decks, then promote batches only when the exact-area scoring evidence is complete.

### Phase 2: Complete Telangana
- All 33 districts of Telangana
- Priority micro-markets: HMDA zone, Outer Ring Road corridor, Warangal, Nizamabad, Karimnagar, Khammam
- Data sources: RERA Telangana API, HMDA GIS, OpenStreetMap, satellite imagery
- Resolver: polygon-based district boundaries for Tier 3 fallback
- Deliverable: Tier 1 exact match for 200+ Hyderabad localities + Tier 3 for all Telangana districts

### Phase 3: Complete Andhra Pradesh
- All 26 districts of AP
- Priority: Amaravati corridor, Vizag metro, Tirupati, Guntur, Krishna district
- Data sources: RERA AP, AP CRDA GIS, OpenStreetMap
- Deliverable: District-level Tier 3 fallback statewide + micro-market data for major cities

### Phase 4: Pan-India expansion (phased)
Priority order based on real estate activity:
1. NCR (Gurugram, Noida, Faridabad)
2. Bengaluru (complete BBMP + BDA zone)
3. Pune (complete PMC + PCMC zone)
4. Mumbai MMR (Thane, Navi Mumbai, Kalyan)
5. Chennai (complete CMDA zone)
6. Tier-2 cities: Coimbatore, Kochi, Ahmedabad, Jaipur, Lucknow, Indore

### Phase 5: UAE expansion
- Dubai (DLD zones, RERA UAE data)
- Abu Dhabi (ADFZA zones)
- Sharjah
- Data sources: Dubai REST API, Dubai Pulse open data, OSM UAE
- Currency: AED; coordinates WGS84 same convention

---

## Data Sources and Integration Plan

### Open / government datasets
| Source | Data | Use |
|--------|------|-----|
| RERA Telangana | Project registrations, builder history | `rera` signal |
| RERA AP | Project registrations | `rera` signal |
| MahaRERA, RERA Karnataka | Future states | `rera` signal |
| HMDA GIS | Layout approvals, zone maps | polygon boundaries |
| CRDA / DTCP | AP approvals | polygon boundaries |
| OpenStreetMap Overpass API | Roads, amenities, metro, schools | `infrastructure` signal |
| India Census 2011/2021 | Population density, growth | `population` signal |
| DIPP / CMIE | Employment zones, SEZs | `employment` signal |
| Ministry of Road Transport | NH / highway projects | `infrastructure` signal |
| Smart Cities Mission | Govt scheme projects | `govtScheme` signal |

### Commercial / semi-open datasets (future)
| Source | Data | Use |
|--------|------|-----|
| MagicBricks / 99acres (scrape / API) | Price trends, transaction volume | `priceVelocity` signal |
| Google Earth Engine | NDVI change, built-up expansion | `satellite` signal |
| Bhunaksha / Bhuvan | State cadastral maps | polygon boundaries |
| Dubai REST API | Transaction prices, rental index | UAE pricing |
| Dubai Pulse | Infrastructure, projects | UAE infrastructure |

### Satellite change detection
- Use Google Earth Engine Python SDK (async, background jobs)
- Cache all results — never recompute if cached data < 30 days old
- Signal: built-up area growth % over 3 and 5 years (NDVI delta + NDBI)
- Never make synchronous GEE calls in API routes

---

## Admin / Data Pipeline

### Adding a new locality (standard process)
1. Obtain polygon boundary — from OSM, HMDA GIS, or manually traced
2. Create entry in `data/regions/{state}/{city}/localities.json`
3. Add aliases to `aliases.json`
4. Collect and verify all 7 signal values from real data sources
5. Create `frontend/src/data/{city}.ts` entry with `MicroMarket` object
6. Set `dataConfidence` field: `"verified"` | `"partial"` | `"estimated"`
7. Register in `cities.ts` registry
8. Run build + resolver smoke test (check console for slug mismatches)

### Data confidence field (required on every MicroMarket)
```typescript
type DataConfidence = "verified" | "partial" | "estimated" | "uncovered";

interface MicroMarket {
  // ... existing fields ...
  dataConfidence: DataConfidence;
  dataAsOf: string;          // ISO date of last signal update
  signalsAvailable: number;  // how many of 7 signals have real data
}
```

### Signal freshness rules
- `verified`: all 7 signals sourced from real data, updated within 12 months
- `partial`: 4–6 signals verified, rest estimated from district averages
- `estimated`: fewer than 4 verified signals — must show warning badge in UI
- `uncovered`: no data — show Tier 5 message, never show a score

---

## Routing

Five routes (current):
- `/` — Landing page
- `/map` — Home (full map + sidebar)
- `/area/:slug` — AreaDetail; slug must match `MicroMarket.slug`
- `/compare` — CompareAreas side-by-side micro-market comparison
- `/brochure` — BrochurePage

Planned routes:
- `/district/:slug` — District-level Tier 3 summary page
- `/state/:slug` — State-level overview
- `/compare` — Side-by-side micro-market comparison
- `/search` — Unified search (lat/lng, address, locality, district)

---

## Conventions

- `@/` path alias → `frontend/src/`
- City slugs: lowercase, no spaces (`"hyderabad"`, `"delhi"`)
- Area slugs: lowercase-hyphenated (`"financial-district"`, `"bandra-kurla-complex"`)
- District slugs: `"rangareddy"`, `"krishna"`, `"east-godavari"`
- State slugs: `"telangana"`, `"andhra-pradesh"`, `"uae-dubai"`
- All coordinates in data: `[lat, lng]` WGS84
- Dark theme: `#0a0a0a` background, `IBM Plex Mono` monospace font
- No Tailwind utility classes in MapView — uses inline `style={{}}` objects

---

## Environment Variables (backend)

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_KEY=
GEE_SERVICE_ACCOUNT=
GEE_KEY_FILE=
GEMINI_API_KEY=
REDIS_URL=redis://localhost:6379
NOMINATIM_USER_AGENT=plotdna/1.0
```

Place `.env` at the project root (`PlotDNA/.env`). Backend config reads `../env` relative to `backend/`.

---

## Current State (June 2026)

- 8 cities live with static data: Hyderabad, Bangalore, Mumbai, Chennai, Pune, Delhi, Vijayawada, Vizag
- All 8 cities have resolver-grade JSON data under `data/cities/`
- Map: polygon overlays, hover tooltips, tier filtering, 3D tilt, 4 basemap styles, city switcher
- Home Layout: unified control capsule (Map/Globe/Layers) centered bottom-center; upward Layers dropdown centered
- Assistant Chat: fully draggable FAB (`AssistantDock.tsx`) with Framer Motion, viewport-bound constraints, passive grab cursor cues, and z-index pass-through.
- AreaDetail: full score breakdown, signal bars, growth timeline, 5-year outlook, source links, PDF export, regional fallback view support.
- CompareAreas: side-by-side comparison of 2 selected micro-markets (`/compare` route).
- Gating / Paywall: frosted lead modal gates access to AreaDetail dashboards after 2 unique free searches (3rd unique check triggers lock). Rs 99 basic / Rs 499 compliance report tiers.
- Razorpay: webhook signature verification exists (`leads.py:83-115`); however, client self-confirm and prefix-only payment recovery remain as unverified unlock paths that should be removed before hard production enforcement.
- Email OTP: `EmailGateModal.tsx` → `auth.py` → OTP verify → session-bound entitlement.
- Offline Resiliency: lead gate unlocks locally if backend collection throws TypeError (e.g. offline/dev env).
- Location resolver: 4-tier coordinate → locality resolution (exact/nearby/cluster/uncovered)
- Backend live at `https://plotdna-api.onrender.com` serving auth, entitlements, verdicts, AVM, market pulse, RERA, brochure parsing, and AI chat routes.
- Hyderabad has 310 contiguous coverage cells: 235 scored market cells plus 75 context-only subdivisions for the outer flagship area. The map and search path no longer rely on a circular disk, hidden outer pizza-slice zones, nearby-score substitution for context-only areas, a default Good Growth filter that makes valid scored cells look uncovered, or non-interactive blue no-data polygons; context cells remain approximate until sourced village/admin boundaries replace them.
- Hyderabad pending scoring evidence as of 2026-06-27: all 75 context cells have official TGRAC/admin boundary matches; 41 have verified Telangana Registration price-band rows; 2 have verified HMDA Regional Ring Road Annexure B infrastructure rows. Promotion remains blocked for all 75 until RERA, satellite growth, employment, government-scheme, and any missing price/infrastructure evidence are verified per exact area.
- Frontend smoke tests: 27 `test:*` scripts under `frontend/scripts/` (Node.js, no test runner required).
- Active deployment branch: `main`
- Deployment note: commit `5983c1e` was pushed to `origin/main` and GitHub/Vercel recorded a successful generated deployment, but the public alias `https://plotdna-ai.vercel.app` did not update. Treat this as a Vercel project/domain/alias mismatch, not a code-build success signal, and push the next verified batch together only after the public alias is confirmed to contain the latest frontend bundle markers.

### Hyderabad Land Identity Phase 0 guardrails
- This is an additive product layer. Before implementing, audit the current PlotDNA scoring logic, routes, map components, polygon rendering, search behavior, and data models.
- Phase 0 foundation is documented in `docs/land-identity-phase-0.md`. It adds feature flags, optional land-identity models, isolated stubs, and standalone UI scaffolds only; the new panels are intentionally not wired into `Home.tsx` or `MapView.tsx` yet.
- Do not rewrite or break existing PlotDNA scoring formulas, score labels, polygon rendering, green market polygons, Locate Me red-dot behavior, area search behavior, UI routes/pages, static polygon data, filters/toggles, carousel/cards/AreaDetail UI, infrastructure/market scoring, build/deployment setup, TypeScript shapes, or API/service contracts.
- Preserve existing data shapes and extend them with optional fields only. Never rename/remove fields that existing scores, cards, routes, or polygons depend on.
- Add new work behind feature flags where possible: `enableLandIdentityFlow`, `enableSurveyResolver`, `enableTrustSignals`, `enableMicroZoneMatching`, and `enableLocationIntelligencePanel`.
- New trust/survey/location intelligence fields must not affect existing PlotDNA score unless explicitly connected in a later verified scoring task.
- Prefer new isolated modules/components over direct core rewrites: `services/locationResolver.ts`, `services/polygonMatcher.ts`, `services/surveyResolver.ts`, `services/trustSignals.ts`, `components/location/LocationIntelligencePanel.tsx`, `components/survey/SurveyResolverPanel.tsx`, and `components/trust/LandTrustCards.tsx`.
- Map behavior protection: Locate Me keeps showing the existing red dot, area search keeps working, polygons and controls keep rendering, and the new Location Intelligence panel opens in addition to existing behavior, not instead of it.
- Survey and legal-trust language must stay conservative: never claim survey number, HMDA/DTCP/TG-bPASS approval, clear title, or ownership verification unless supported by official/cadastral/user-provided evidence.
- Phase 1A Location Intelligence wiring is intentionally UI-only and flag-gated. `Home.tsx` may create a safe `LocationIntelligence` object after existing Locate Me/search/area-search flows, but only when both `enableLandIdentityFlow` and `enableLocationIntelligencePanel` are true. The flags still default false, no survey resolver/drop-pin/trust scoring is wired, and the panel must keep showing conservative "not checked/not confirmed" defaults.
- Phase 1B Drop Pin mode is intentionally user-initiated and flag-gated. The Drop Pin control appears only when `enableLandIdentityFlow` is true, uses the existing `searchCoords` red-pin path, passes optional click props through `SpatialView` to `MapView`, and may open Location Intelligence only when both Location Intelligence flags are true. It must not alter polygon rendering, scoring, Hyderabad validation, or survey/approval/title claims.
- Phase 1C feature flag overrides are environment-only and exact-string gated. `frontend/src/lib/features.ts` may enable Land Identity flags only when the corresponding `VITE_ENABLE_*` variable equals `"true"`; never enable by `NODE_ENV`, never commit `.env.local`, and do not enable Survey Resolver or Trust Signals in production until their evidence workflows are complete.

---

## Production Readiness Checklist

### Accuracy
- [ ] All displayed scores derive from verifiable data (no AI-invented values)
- [ ] Every micro-market has `dataConfidence` and `dataAsOf` fields
- [ ] Approximation labels appear on Tier 2+ resolutions — never silently present as exact
- [ ] Missing signals excluded from weighted average (not treated as 0)
- [ ] Resolver logs slug mismatches in dev mode

### Trust
- [ ] "Nearby estimate" badge shown when Tier 2 resolution triggers
- [ ] "Regional only" badge shown when Tier 3 triggers
- [ ] "No data" message shown for Tier 4/5 — no placeholder score
- [ ] Source links provided for all signal data on AreaDetail page
- [ ] `dataAsOf` date displayed so users know data age

### Scalability
- [ ] Location resolution decoupled from frontend bundle (move to backend API)
- [ ] Locality polygons stored in PostGIS (not bundled JSON) beyond 500 localities
- [ ] Nominatim results cached in Redis (TTL: 30 days)
- [ ] GEE satellite jobs async + cached (TTL: 30 days)
- [ ] District/state boundary files lazy-loaded per viewport, not upfront

### Maintainability
- [ ] Single source of truth for each locality's data (one JSON file, not duplicated)
- [ ] Admin pipeline documented: how to add new locality, update signal, update polygon
- [ ] Resolver smoke test runnable in CI (slug mismatch detection)
- [ ] `dataConfidence` validated at build time — reject entries with 0 verified signals

---

## Non-Negotiable Rules

- **Never fabricate scores.** If real data does not exist for a location, do not assign a score. Show the honest tier message.
- **Never present a Tier 2+ resolution as exact.** Always label it.
- **Never add a city or locality without real signal data.** Placeholder entries erode trust.
- **Do not treat this as a static city-list app.** Every code decision should be compatible with 10,000 localities, not 20.
- **Do not make synchronous GEE calls** in any API route — always async/background.
- **Do not hardcode API keys** — always use `.env`.
- **Do not cache stale satellite data** beyond 30 days without refresh flag.
- **Do not store user PII** without explicit consent and privacy policy coverage.

