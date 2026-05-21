# PlotDNA App Feature Map

This document maps every active product feature to the files that own it. Use it as the first place to check when changing a flow, debugging a production issue, or planning the next feature.

Last updated: 2026-05-21

## Product Summary

PlotDNA is a real estate intelligence app for India and UAE. It combines curated micro-market data, map search, live OpenStreetMap signals, brochure location extraction, AI verdicts, news sentiment, valuation estimates, and report gating.

The app has four user-facing routes:

| Route | Purpose | Primary file |
| --- | --- | --- |
| `/` | Landing and search entry | `frontend/src/pages/Landing.tsx` |
| `/map` | Main map/search workspace | `frontend/src/pages/Home.tsx` |
| `/area/:slug` | Full micro-market analysis report | `frontend/src/pages/AreaDetail.tsx` |
| `/brochure` | Standalone brochure upload analysis | `frontend/src/pages/BrochurePage.tsx` |

Global route wiring lives in `frontend/src/App.tsx`.

## Deployment And Runtime

| Concern | File / setting | Notes |
| --- | --- | --- |
| Frontend API base URL | `frontend/src/lib/runtime.ts` | Production web defaults to `https://plotdna-api.onrender.com`; native app also uses Render unless `VITE_API_URL` is set. |
| Frontend API wrapper | `frontend/src/lib/api.ts` | Owns calls for map-link resolution, brochure analysis, and live coordinate scoring. |
| Backend app setup | `backend/app/main.py` | Registers all FastAPI route modules and CORS. |
| Backend config | `backend/app/core/config.py` | Loads `.env` settings for Gemini, GEE, Redis, Supabase, OSM cache, auth, and country support. |
| Env example | `.env.example` | Documents Vercel `VITE_API_URL`, Render `GEMINI_API_KEY`, OSM cache, GEE, Supabase, Redis. |

Production checks completed on 2026-05-21:

| Flow | Status | Evidence |
| --- | --- | --- |
| Render health | Working | `GET /health` returned `{ "status": "ok", "version": "1.0.0" }`. |
| Map URL resolver | Working | Full Google Maps URL with `19.0760,72.8777` returned matching lat/lng. |
| OSM scoring | Working | First call returned live score `90`; repeat call returned `freshness: "cached"`. |
| Brochure upload route | Backend reachable, AI quota blocked | Production reached Gemini, but Gemini returned quota exceeded. |

## Search, Map Links, And Coordinate Entry

### User Flow

Users can paste an area name, coordinates, a full Google Maps URL, OpenStreetMap URL, Apple Maps URL, or a short/shared map link. The app attempts local coordinate parsing first, then calls the backend resolver when a URL requires expansion.

### Frontend Files

| File | Responsibility |
| --- | --- |
| `frontend/src/pages/Landing.tsx` | Landing search input, initial map-link handling, navigation into `/map`. |
| `frontend/src/pages/Home.tsx` | Main search state, shared map-link handling, city/sidebar UI, mobile layout behavior. |
| `frontend/src/lib/plotAnalysis.ts` | `parseMapUrl`, `parseCoords`, `isMapUrl`, `isShortMapUrl`, fallback analysis helpers. |
| `frontend/src/lib/api.ts` | `resolveMapLink(url)` calls `/api/utils/resolve-map-link`. |
| `frontend/src/components/score/PlotAnalysisCard.tsx` | Shows coordinate analysis side panel after a pin/search resolves. |

### Backend Files

| File | Responsibility |
| --- | --- |
| `backend/app/api/routes/utils.py` | `GET /api/utils/resolve-map-link`; expands short links, parses coordinates, geocodes location text when needed. |

### Known Rules

- Full URLs with embedded coordinates should be parsed without backend expansion.
- Short links like `maps.app.goo.gl` need backend expansion.
- If no coordinates can be extracted, the UI should tell the user to paste the full URL or coordinates.

## Main Map Workspace

### User Flow

The `/map` page is the main workspace. It lets users switch cities, search locations, use spatial/globe views, click map polygons, and open coordinate analysis.

### Files

| File | Responsibility |
| --- | --- |
| `frontend/src/pages/Home.tsx` | Main page state, city selection, search, sidebar, mobile layout, coordinate analysis panel. |
| `frontend/src/components/map/MapView.tsx` | MapLibre polygon map, construction project markers, tooltips, area click navigation. |
| `frontend/src/components/view/SpatialView.tsx` | Wrapper for map/globe view modes. |
| `frontend/src/components/view/GlobeView.tsx` | Canvas globe view focused on selected city/search coordinate. |
| `frontend/src/components/view/ViewModeToggle.tsx` | Switches map/globe view modes. |
| `frontend/src/components/ui/CmdK.tsx` | Global command palette and area search index. |

### Data Files

| File / folder | Responsibility |
| --- | --- |
| `frontend/src/data/*.ts` | Curated city and micro-market datasets. |
| `frontend/src/data/index.ts` | Aggregates city datasets and metadata. |
| `data/cities/*` | Resolver-grade aliases, districts, and cluster metadata. |
| `data/india/regions.json` | State/UT broad regional fallback. |
| `data/india/regional-markets.json` | Tier-2/Tier-3 regional catchments. |

## Coverage And Locality Resolution

### User Flow

When a coordinate is searched, PlotDNA decides whether it has exact locality support, a nearby supported market, a city cluster, regional coverage, or no coverage.

### Files

| File | Responsibility |
| --- | --- |
| `frontend/src/lib/location/resolver.ts` | Finds exact, nearby, cluster, district, regional, and uncovered candidates. |
| `frontend/src/lib/location/classifier.ts` | Converts candidates into a final resolution tier and display label. |
| `frontend/src/lib/location/contracts.ts` | Shared resolution tier/type contracts. |
| `frontend/src/lib/plotAnalysis.ts` | Maps resolver output into UI-friendly fallback result and growth/outlook helpers. |
| `docs/COVERAGE_TIERS.md` | Product rules for exact, nearby, dynamic, and regional coverage. |
| `docs/PHASE5_COVERAGE.md` | Ledger for metro support and regional fallback. |

### Current Coverage Model

| Tier | Meaning |
| --- | --- |
| Exact locality | Supported locality with curated market context. |
| Nearby micro-market | Coordinate is close enough to reuse nearby context, labeled approximate. |
| City cluster | Broad metro area context only. |
| Regional market | Broad regional/state/UT coverage only. |
| Uncovered | No reliable supported context. |

## Live OSM Coordinate Scoring

### User Flow

When a coordinate is selected, the frontend requests a backend score. The backend queries Overpass API for OSM features, computes PlotDNA signals, caches counts by rounded coordinate cell, and returns live/cached/stale status.

### Frontend Files

| File | Responsibility |
| --- | --- |
| `frontend/src/lib/api.ts` | `analyzeCoordinate(lat, lng)` calls `/api/score/analyze`; defines `LiveDNAResult`. |
| `frontend/src/components/score/PlotAnalysisCard.tsx` | Displays score, signal bars, confidence, OSM freshness, sparse-data fallback text. |
| `frontend/src/lib/utils.ts` | Score labels, colors, signal weights, score calculation helper. |

### Backend Files

| File | Responsibility |
| --- | --- |
| `backend/app/api/routes/score.py` | `POST /api/score/analyze`; coordinates OSM cache, Overpass fetch, scoring response. |
| `backend/app/services/overpass_service.py` | Builds Overpass queries, sends accepted headers, counts OSM features. |
| `backend/app/services/osm_cache.py` | JSON disk cache keyed to 3-decimal coordinate grid. |
| `backend/app/services/scoring_engine.py` | Converts raw OSM counts into 7 PlotDNA signals and final score. |

### Important Implementation Notes

- Overpass requires explicit `Accept: application/json` and a `User-Agent`; without these production may return zero/failure.
- Failed Overpass calls must not be cached as fresh zero-count scores.
- Response `freshness` can be `live`, `cached`, `stale`, or `unavailable`.
- OSM cache envs:
  - `OSM_CACHE_DIR`
  - `OSM_CACHE_TTL_SECONDS`

## Area Detail Report

### User Flow

Users open a micro-market detail page to inspect score, signal breakdown, market story, infrastructure, active projects, satellite view, AI verdict, market pulse, AVM, alternatives, sources, and PDF report export.

### Files

| File | Responsibility |
| --- | --- |
| `frontend/src/pages/AreaDetail.tsx` | Main report page, PDF generation, report gate, active projects, source sections, alternatives. |
| `frontend/src/components/ui/VerdictCard.tsx` | AI buy/hold/wait/avoid verdict. |
| `frontend/src/components/ui/MarketPulseCard.tsx` | Live market sentiment section. |
| `frontend/src/components/ui/AVMCard.tsx` | Automated valuation model card. |
| `frontend/src/components/ui/SatelliteCompare.tsx` | Satellite-style built-up growth timeline. |
| `frontend/src/components/ui/NewsSection.tsx` | City/area news display. |
| `frontend/src/components/ui/ScoreBadge.tsx` | Reusable score badge. |
| `frontend/src/components/ui/SignalBar.tsx` | Reusable signal bar. |
| `frontend/src/lib/areaSources.ts` | Area source links and labels. |
| `frontend/src/lib/recommendations.ts` | Goal-based alternatives and ranking logic. |

### Backend Files

| File | Responsibility |
| --- | --- |
| `backend/app/api/routes/verdict.py` | `GET /api/verdict/{city_slug}/{area_slug}`; builds fallback context and delegates AI verdict. |
| `backend/app/services/verdict_service.py` | Gemini-backed or fallback verdict generation and cache. |
| `backend/app/api/routes/market_pulse.py` | Market pulse, DLD proxy, and area comparison routes. |
| `backend/app/services/news_intel.py` | News sentiment scoring and cache. |
| `backend/app/api/routes/avm.py` | `GET /api/v1/avm/{country}/{area_slug}`. |
| `backend/app/services/avm_scorer.py` | AVM formulas and valuation projections. |

## Brochure Upload And Location Extraction

### User Flow

Users upload a PDF/image brochure. The backend sends the file to Gemini Vision to extract location and project data. If coordinates are present, they are returned directly; otherwise the extracted location is geocoded with Nominatim.

### Frontend Files

| File | Responsibility |
| --- | --- |
| `frontend/src/pages/BrochurePage.tsx` | Standalone brochure upload page, drag/drop, result display, RERA links. |
| `frontend/src/components/ui/BrochureUploadCard.tsx` | Reusable upload card version. |
| `frontend/src/lib/api.ts` | `analyzeBrochure(file)` calls `/api/utils/analyze-brochure`. |

### Backend Files

| File | Responsibility |
| --- | --- |
| `backend/app/api/routes/utils.py` | Current production endpoint `POST /api/utils/analyze-brochure`; location-focused extraction. |
| `backend/app/api/routes/brochure.py` | Legacy/v1 endpoint `POST /api/v1/analyze-brochure`; richer Phase 2 extraction contract. |
| `backend/app/services/brochure_parser.py` | Gemini parser service used by the v1 route. |

### Current Production Status

- Endpoint and env are wired.
- `GEMINI_API_KEY` is present on production because Gemini returned a quota error rather than a missing-key error.
- Current blocker is Gemini quota/billing, not frontend routing.
- Next improvement should add model/provider fallback and better quota error copy.

## AI Verdicts, Chat, And Future Voice Bot

### Current AI Files

| File | Responsibility |
| --- | --- |
| `backend/app/api/routes/ai.py` | Authenticated chat endpoint at `POST /api/ai/chat`. |
| `backend/app/services/ai_provider.py` | Shared JSON helpers for Gemini and NVIDIA provider calls. |
| `backend/app/services/verdict_service.py` | Area verdict generation with Gemini-first, NVIDIA-second fallback. |
| `frontend/src/components/ui/VerdictCard.tsx` | Displays AI verdict on area detail. |
| `backend/app/core/config.py` | Gemini, NVIDIA, and provider ordering envs. |

### Provider Fallback

The app no longer depends on one Gemini model for area verdicts. Verdict generation reads `AI_PROVIDER_ORDER`, tries configured Gemini models first, then NVIDIA chat models when `NVIDIA_API_KEY` is present. If all external providers fail, the deterministic PlotDNA fallback verdict still returns a usable response.

Brochure upload still uses Gemini Vision because it must read PDF/image files. The brochure path now tries multiple Gemini brochure models and returns a clear quota message when the Gemini account limit is exhausted.

```env
AI_PROVIDER_ORDER=gemini,nvidia
GEMINI_VERDICT_MODELS=gemini-1.5-flash,gemini-2.0-flash-lite
GEMINI_BROCHURE_MODELS=gemini-2.0-flash,gemini-2.0-flash-lite,gemini-1.5-flash
NVIDIA_API_KEY=your_nvidia_key_in_render_only
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_CHAT_MODELS=moonshotai/kimi-k2.6
NVIDIA_SAFETY_MODEL=nvidia/nemotron-3-content-safety
```

### Nemotron Content Safety Role

`nvidia/nemotron-3-content-safety` should be used as a guard layer, not the main assistant:

1. Check user text/voice transcript before sending to the main model.
2. Check assistant response before returning or speaking it.
3. Block or rewrite unsafe content.

For voice, the future chain should be:

`speech-to-text -> safety check -> chat model -> safety check -> text-to-speech`

## Auth, Search Limits, And Report Gate

### User Flow

Anonymous users get limited searches/report actions. Users can attach email to unlock/continue usage. Dev activation exists for local/testing.

### Files

| File | Responsibility |
| --- | --- |
| `frontend/src/lib/entitlements.ts` | Anonymous session, token storage, usage consume, email attach. |
| `frontend/src/components/ui/EmailGateModal.tsx` | Email capture modal. |
| `frontend/src/pages/AreaDetail.tsx` | Report download gate and PDF preparation. |
| `backend/app/api/routes/auth.py` | `POST /api/v1/auth/anonymous`. |
| `backend/app/api/routes/entitlements.py` | Usage, consume, email attach, dev activate. |
| `backend/app/services/entitlements_store.py` | Entitlement persistence abstraction. |

## Market Pulse, News, And Sentiment

### Files

| File | Responsibility |
| --- | --- |
| `frontend/src/components/ui/MarketPulseCard.tsx` | Frontend sentiment gauge and articles. |
| `backend/app/api/routes/market_pulse.py` | `GET /api/v1/market-pulse/{country}/{area_slug}` plus comparison endpoints. |
| `backend/app/services/news_intel.py` | Area-level scored news and sentiment. |
| `backend/app/api/routes/news.py` | City/area news list and refresh routes. |
| `backend/app/services/news_aggregator.py` | RSS/news aggregation. |

## AVM And Price Intelligence

### Files

| File | Responsibility |
| --- | --- |
| `frontend/src/components/ui/AVMCard.tsx` | Displays value/sqft, confidence range, yield, payback, five-year projection. |
| `backend/app/api/routes/avm.py` | API wrapper for AVM response. |
| `backend/app/services/avm_scorer.py` | India/UAE valuation formulas and adjustments. |

## India And UAE Data Routes

### India

| Endpoint | File | Purpose |
| --- | --- | --- |
| `GET /api/india/rera/{state}/{rera_number}` | `backend/app/api/india/land_verify.py` | RERA verification stub/integration point. |
| `GET /api/india/land-record/{state}/{district}/{survey_number}` | `backend/app/api/india/land_verify.py` | Land record verification. |
| `GET /api/india/spatial` | `backend/app/api/india/land_verify.py` | Land-use/connectivity/legal spatial check. |
| `GET /api/india/infra-pipeline` | `backend/app/api/india/land_verify.py` | Infrastructure pipeline near coordinate. |

### UAE

| Endpoint | File | Purpose |
| --- | --- | --- |
| `GET /api/uae/transactions/{area_name}` | `backend/app/api/uae/dld_routes.py` | Dubai transaction prices. |
| `GET /api/uae/spatial` | `backend/app/api/uae/dld_routes.py` | UAE coordinate spatial verification. |
| `GET /api/uae/zones` | `backend/app/api/uae/dld_routes.py` | Major Dubai investment zones. |
| `GET /api/v1/dld/transactions/{area_name}` | `backend/app/api/routes/market_pulse.py` | DLD proxy route used by Phase 2 market data. |

## Satellite And Google Earth Engine

### Current Files

| File | Responsibility |
| --- | --- |
| `backend/app/api/routes/satellite.py` | Stub routes for timelapse and NDVI. |
| `frontend/src/components/ui/SatelliteCompare.tsx` | Frontend satellite-style comparison from curated milestones. |
| `backend/app/core/config.py` | `GEE_SERVICE_ACCOUNT`, `GEE_KEY_FILE`. |

### Intended Use

Google Earth Engine should be used for background/cached satellite-change signals, not direct live user requests:

- built-up growth
- vegetation change
- waterbody/green-buffer risk
- land conversion signals

OSM/Overpass remains the right source for roads, buildings, amenities, transit, offices, and shops.

## Mobile UI Responsibilities

| File | Responsibility |
| --- | --- |
| `frontend/src/pages/Home.tsx` | Mobile sidebar width, logo behavior, search panel, coordinate analysis overlay. |
| `frontend/src/components/score/PlotAnalysisCard.tsx` | Full-width mobile analysis drawer. |
| `frontend/src/pages/Landing.tsx` | Mobile-safe search entry and map-link path. |
| `frontend/src/pages/BrochurePage.tsx` | Mobile upload page layout. |

## Verification Commands

Frontend:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
```

Backend lightweight syntax:

```powershell
python -m compileall backend\app
```

Production smoke checks:

```powershell
Invoke-RestMethod -Uri https://plotdna-api.onrender.com/health

$body = @{ lat = 19.0760; lng = 72.8777 } | ConvertTo-Json
Invoke-RestMethod -Uri https://plotdna-api.onrender.com/api/score/analyze `
  -Method Post `
  -Body $body `
  -ContentType 'application/json'
```

Expected OSM cache behavior:

1. First coordinate score call should return `freshness: "live"` and a `cache.key`.
2. Immediate second call for the same rounded coordinate should return `freshness: "cached"` and `cache.hit: true`.

## Current Known Gaps

| Gap | Current impact | Likely next file(s) |
| --- | --- | --- |
| Gemini quota exhausted | Brochure upload can still fail when all Gemini Vision models are quota-blocked; users should search by address/map link/coords while quota resets. | `backend/app/api/routes/utils.py`, `backend/app/services/brochure_parser.py` |
| NVIDIA not configured on Render yet | Verdict fallback to NVIDIA only activates after `NVIDIA_API_KEY` is added to backend env. | `backend/app/services/ai_provider.py`, `backend/app/services/verdict_service.py`, `backend/app/core/config.py` |
| Backend dependencies not installed in local clone | Local FastAPI route smoke tests cannot run until `pip install -r backend/requirements.txt`. | `backend/requirements.txt` |
| GEE not connected to live scoring | Satellite is currently curated/stubbed rather than computed. | `backend/app/api/routes/satellite.py`, future GEE service |
