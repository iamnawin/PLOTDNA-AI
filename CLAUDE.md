# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

PlotDNA is a real estate investment intelligence platform for India. It shows a "DNA score" (0–100) for land micro-markets across 6 cities, with polygon map overlays, signal breakdowns, and coordinate-based plot analysis. All data is currently static (TypeScript files in the frontend).

## Commands

```bash
# Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
npm run build        # tsc -b && vite build
npm run lint         # eslint .

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
                                  (CITIES, getCityEntry,  (useAppStore)
                                   getAllAreas, etc.)
```

### Key files

| File | Purpose |
|------|---------|
| `frontend/src/data/cities.ts` | City registry — `CITIES`, `getCityEntry()`, `getAllAreas()`, `getCityForArea()` |
| `frontend/src/store/index.ts` | Single Zustand store — `selectedArea`, `selectedCitySlug`, `mapStyleKey`, `is3D`, `searchCoords`, etc. |
| `frontend/src/types/index.ts` | Core types: `MicroMarket`, `Signals`, `Livability`, `CityMeta`, `Category` |
| `frontend/src/lib/utils.ts` | Score → color/label/bg helpers + `SIGNAL_LABELS` + `SIGNAL_WEIGHTS` |
| `frontend/src/lib/plotAnalysis.ts` | `parseCoords()`, `findNearestArea()`, `getGrowthMilestones()`, `getOutlook()` |
| `frontend/src/lib/areaSources.ts` | Per-area research source links shown in AreaDetail |
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

### Adding a new city
1. Create `frontend/src/data/{city}.ts` — export `cityMeta: CityMeta` and `{city}Areas: MicroMarket[]`
2. Register it in `frontend/src/data/cities.ts` — add to `CITIES` and `CITY_LIST`
3. Optionally add area-specific sources to `frontend/src/lib/areaSources.ts`

### Routing
Two routes: `/` (Home — full map + sidebar) and `/area/:slug` (AreaDetail — full analysis page). Slug must match `MicroMarket.slug` across all cities.

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

## Current State (Phase 1 complete + pan-India added)

- 6 cities live with static data: Hyderabad, Bangalore, Mumbai, Chennai, Pune, Delhi
- Map: polygon overlays, hover tooltips, tier filtering, 3D tilt, 4 basemap styles, city switcher
- AreaDetail: full score breakdown, signal bars, growth timeline, 5-year outlook, source links, PDF export
- Backend routes: all stubs — not used by frontend yet
- No test suite
