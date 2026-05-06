# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

PlotDNA is a real estate investment intelligence platform for India. It shows a "DNA score" (0–100) for land micro-markets across 8 cities, with polygon map overlays, signal breakdowns, and coordinate-based plot analysis. All data is currently static (TypeScript files in the frontend).

## Commands

```bash
# Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
npm run build        # tsc -b && vite build
npm run lint         # eslint .

# Mobile (Capacitor)
# 1) Build web assets
# 2) Add platform once, then sync on changes
cd frontend
npm run cap:prepare
npm run cap:add:android
npm run cap:open:android

# Backend (http://localhost:8000) — stubs only, not required for frontend dev
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

No test suite exists yet. TypeScript errors surface via `npm run build`.

## Architecture

### Frontend-only for now
All real data lives in `frontend/src/data/` as TypeScript files. The FastAPI backend (`backend/`) exists but all routes return empty stubs — the frontend does not call it in production. API client is at `frontend/src/lib/api.ts` (unused in Phase 1).

### Data flow
```
frontend/src/data/{city}.ts   →  cities.ts registry  →  Zustand store  →  MapView + UI
data/cities/{city}/*.json     →  location/resolver.ts  (coordinate → locality resolution)
                                  (CITIES, getCityEntry,  (useAppStore)
                                   getAllAreas, etc.)
```

### Key files

| File | Purpose |
|------|---------|
| `frontend/src/data/cities.ts` | City registry — `CITIES`, `getCityEntry()`, `getAllAreas()`, `getCityForArea()` |
| `frontend/src/store/index.ts` | Single Zustand store — `selectedArea`, `selectedCitySlug`, `mapStyleKey`, `is3D`, `searchCoords`, `showConstruction`, `recommendationGoal`, etc. |
| `frontend/src/types/index.ts` | Core types: `MicroMarket`, `Signals`, `Livability`, `CityMeta`, `Category`, `ActiveProject`, `RecommendationGoal` |
| `frontend/src/lib/utils.ts` | Score → color/label/bg helpers + `SIGNAL_LABELS` + `SIGNAL_WEIGHTS` |
| `frontend/src/lib/plotAnalysis.ts` | `parseCoords()`, `findNearestArea()`, `getGrowthMilestones()`, `getOutlook()` |
| `frontend/src/lib/areaSources.ts` | Per-area research source links shown in AreaDetail |
| `frontend/src/lib/location/resolver.ts` | Coordinate → locality resolution (4-tier: exact → nearby → cluster → uncovered) |
| `frontend/src/lib/location/classifier.ts` | Converts `ResolutionCandidates` → `LocalityResolution` with tier + reason |
| `frontend/src/lib/location/contracts.ts` | `LocalityResolution` and `ResolutionTier` types |
| `frontend/src/components/map/MapView.tsx` | MapLibre GL map with polygon layers, hover tooltip, coordinate pin |

### Map library
The map uses **MapLibre GL** via `react-map-gl` (NOT Leaflet — ignore Leaflet references in older docs). Basemaps are free tiles (CartoCDN dark/light, ArcGIS satellite, OpenTopoMap terrain) — no API key needed.

### Critical coordinate convention
Data files store coordinates as `[lat, lng]`. MapLibre GL requires `[lng, lat]`.
**Always flip** when passing to MapLibre: `[area.center[1], area.center[0]]` or `polygon.map(([lat, lng]) => [lng, lat])`.

### DNA Score system
Score is a 0–100 integer derived from 7 signals with fixed weights:

| Signal | Weight |
|--------|--------|
| infrastructure | 25% |
| population | 20% |
| satellite | 20% |
| rera | 15% |
| employment | 10% |
| priceVelocity | 5% |
| govtScheme | 5% |

Score tiers (used for color-coding and filtering):
- 86–100 → Goldzone (`#10b981` emerald)
- 66–85 → Good Growth (`#22c55e` green)
- 41–65 → Moderate (`#f59e0b` amber)
- 0–40 → High Risk (`#ef4444` red)

### Location resolution system
`frontend/src/lib/location/resolver.ts` resolves a (lat, lng) coordinate to a locality through four tiers:
1. **exact** — name alias matches AND coordinate is inside the polygon (or within `exactLocalityBufferKm`)
2. **nearby** — within `nearbyMicroMarketRadiusKm` of a known micro-market centroid
3. **cluster** — inside a city's coverage radius; returns a zone cluster (e.g. `hyderabad:south`)
4. **uncovered** — outside all city catchment areas

Each city with resolver-grade coverage has four JSON files under `data/cities/{city}/`:
- `city.json` — center, zoom, coverage/central radii, buffer distances
- `localities.json` — per-locality center + polygon (used for exact matching)
- `aliases.json` — `{ localitySlug: [aliasStrings] }` for name normalization
- `clusters.json` — zone-based cluster definitions (Central/North/South/East/West)

In dev mode the resolver logs mismatches between `localities.json` slugs and the frontend `MicroMarket` slugs to the console.

### Adding a new city
1. Create `frontend/src/data/{city}.ts` — export `cityMeta: CityMeta` and `{city}Areas: MicroMarket[]`
2. Register it in `frontend/src/data/cities.ts` — add to `CITIES` and `CITY_LIST`
3. Create `data/cities/{city}/` with `city.json`, `localities.json`, `aliases.json`, `clusters.json`
4. Import and register the four JSON files in `frontend/src/lib/location/resolver.ts` (`SPECIAL_CITY_DATASETS`)
5. Optionally add area-specific sources to `frontend/src/lib/areaSources.ts`

### Routing
Four routes:
- `/` — Landing page
- `/map` — Home (full map + sidebar)
- `/area/:slug` — AreaDetail (full analysis page); slug must match `MicroMarket.slug`
- `/brochure` — BrochurePage (brochure upload/analysis)

## Conventions

- `@/` path alias → `frontend/src/`
- City slugs: lowercase, no spaces (`"hyderabad"`, `"delhi"`)
- Area slugs: lowercase-hyphenated (`"financial-district"`, `"bandra-kurla-complex"`)
- All coordinates in data: `[lat, lng]` WGS84
- Dark theme: `#0a0a0a` background, `IBM Plex Mono` monospace font throughout UI
- No Tailwind utility classes in MapView — uses inline `style={{}}` objects (MapLibre renders outside React tree)

## Environment Variables (backend only)

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_KEY=
GEE_SERVICE_ACCOUNT=
GEE_KEY_FILE=
GEMINI_API_KEY=
REDIS_URL=redis://localhost:6379
```

Place `.env` at the project root (`PlotDNA/.env`). Backend config reads `../env` relative to `backend/`.

## Current State

- 9 cities live with static data: Hyderabad, Bangalore, Mumbai, Chennai, Pune, Delhi, Vijayawada, Vizag, Dubai (starter pack)
- All 8 cities have resolver-grade JSON data under `data/cities/`
- Map: polygon overlays, hover tooltips, tier filtering, 3D tilt, 4 basemap styles, city switcher
- AreaDetail: full score breakdown, signal bars, growth timeline, 5-year outlook, source links, PDF export
- Location resolver: 4-tier coordinate → locality resolution (exact/nearby/cluster/uncovered)
- Backend routes: all stubs — not used by frontend yet
- No test suite

## Recent Changes (May 2026)

- Mobile layout stability: switched full-screen containers/panels to `100dvw` and applied `env(safe-area-inset-*)` offsets to reduce overflow + alignment issues on notched devices.
- Dubai starter dataset: added `frontend/src/data/dubai.ts` and registered it in `frontend/src/data/cities.ts`.
- Landing geolocation flow: the search bar now includes a `Locate me` action that requests browser geolocation, fills the detected coordinates, and enables coordinate-led analysis.
- Coordinate analysis UX: detected-coordinate analysis opens with a PlotDNA-branded loading state, then routes to the nearest/fallback analysis without quota-gating the full-analysis page.
- Coordinate honesty rule: when a detected coordinate only maps to a nearby or fallback locality, UI must label it as approximate instead of presenting the matched micro-market as exact.
- PDF report lead capture: the full analysis page remains browsable, but `Download PDF` now requires an email unless the user already has email/subscription entitlement. After five seconds on the page, the PDF CTA is highlighted with a report-download prompt.

## Roadmap Notes (Capacitor + Monetization)

Target: ship PlotDNA as a device-friendly app via Capacitor, with **3 free searches** per user then a **subscription** unlock.

Implementation principle: all metering/entitlements must be enforced server-side (backend), with App Store / Play Store receipt verification.

Backend MVP endpoints added:
- `POST /api/v1/auth/anonymous` → `{ user_id, access_token }`
- `GET /api/v1/entitlements` → remaining free runs + subscription status
- `POST /api/v1/entitlements/consume` → consume a run (returns 402 when quota is exhausted)
- `POST /api/v1/entitlements/dev/activate` → dev-only helper to simulate an active subscription
- `POST /api/v1/entitlements/email` → attach an email to unlock beyond the free quota (temporary MVP replacement for subscriptions)
- Auth note: the MVP bearer token is an HMAC-signed payload implemented with Python stdlib; it is intentionally lightweight and not a full JWT/OAuth system.
- Render note: FastAPI file-upload routes in `backend/app/api/routes/utils.py` require `python-multipart` to be present in both backend requirements files or app startup will fail.
- Frontend gating: landing and home search flows now call the backend anonymous-auth + entitlements endpoints, consume one free search per search-led analysis/open action, and show an email capture modal after the free quota is exhausted.
- Report gating: do not gate `/area/:slug` navigation for coordinate fallback flows. Use email capture at PDF export time instead.
- Mobile search refinement: the city and recommendation chip rows under the search bar are touch-scroll friendly on mobile, the duplicate supported-cities strip above the bottom dock is removed, and full-analysis CTA clicks now consume search access just like direct coordinate analysis.
- Mobile runtime note: native Capacitor builds default to https://plotdna-api.onrender.com when VITE_API_URL is not supplied, while web dev still defaults to http://localhost:8000.
- App identity assets: shared icon and splash SVG sources now live in `frontend/public/icon.svg` and `frontend/public/splash.svg`, with follow-up native Android wiring documented in `docs/android-release-checklist.md`.
- What-if roadmap: the next MVP order is documented in `docs/next-roadmap.md` with `POST /api/v1/what-if`, an `AreaDetail` panel, deterministic rules first, and LLM summary second.
- Android native baseline: `frontend/android/` is now generated and tracked, with brand colors in `android/app/src/main/res/values/colors.xml`, dark launcher background, and a modern SplashScreen theme using the launcher icon.

