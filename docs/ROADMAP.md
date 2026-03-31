# PlotDNA - Product Roadmap

> **Mission:** AI-powered property location intelligence. Help users make better land and property decisions using live market, infra, trust, and news signals.
>
> **Target:** India-first -> UAE/Dubai -> Bangkok/Thailand

---

## Current State

- 6 cities live: Hyderabad, Bangalore, Mumbai, Chennai, Pune, Delhi NCR
- MapLibre GL map with polygon overlays, hover tooltips, tier filtering
- DNA Score with both stored market data and live coordinate scoring
- AreaDetail page: score breakdown, signal bars, growth timeline, 5-year outlook
- Source links, AI verdict card, live news integration, and coordinate-based plot analysis
- City switcher, multiple basemap styles, 3D tilt, mobile responsive
- Hyderabad, Bangalore, Mumbai, and Chennai expanded to resolver-grade coverage with stored localities, aliases, clusters, projects, sources, and verdict support

**Current gap:** PlotDNA is now a hybrid system, but market truth is still duplicated across frontend and backend. Hyderabad, Bangalore, Mumbai, and Chennai now have resolver-grade locality support, while Pune and Delhi NCR still need the same structure.

---

## 2026 Status Update

### What is complete

- PlotDNA is no longer static-only
- Live coordinate scoring exists through `backend/app/api/routes/score.py`
- AI verdict and live news flows exist in the product
- Hyderabad remains the deepest city in the system, with Bangalore, Mumbai, and Chennai now following as resolver-grade markets
- Hyderabad, Bangalore, Mumbai, and Chennai currently have stored localities, aliases, clusters, projects, and full verdict coverage

### What is next

- Move market truth into one canonical backend-owned market catalog
- Remove duplication across frontend data files, source maps, and backend verdict fallbacks
- Port the resolver-grade city model next to Pune, then Delhi NCR
- Add explicit coverage tiers so fully supported micro-markets are distinct from starter or dynamic-coordinate-only coverage

### Expansion reference

- See `docs/ALL_INDIA_EXPANSION_PLAN.md` for the all-India architecture and rollout plan

---

## Intelligence Architecture (WorldMonitor-Inspired)

PlotDNA borrows proven patterns from [WorldMonitor](https://github.com/koala73/worldmonitor), a production global intelligence platform, and adapts them for India real estate:

| WorldMonitor Pattern | PlotDNA Adaptation |
|---|---|
| RSS feed aggregation + circuit breakers | India real estate news: ET Realty, TOI, Hindu Business, NDTV, state RERA feeds |
| Entity correlation engine | Match area names ("Kokapet", "Whitefield") to relevant articles |
| Tiered AI fallback chain | Gemini Flash -> Groq -> OpenRouter -> cached fallback |
| Redis 24h caching per entity | AI verdicts + news digests per area slug |
| Scoring with velocity/trend regression | DNA Score + 6-month trend direction layer |
| Cmd+K command palette | Fast keyboard-driven city + locality search |
| Multi-variant architecture | Investor view / End-user view / NRI view from same codebase |
| Circuit breaker per source | Resilient scraping of RERA portals, news sites, pricing sources |

---

## Phase 1 - "Bring Alive" MVP

**Goal:** User searches a location and sees live news plus an AI verdict. This is the sales demo.

### 1a. Backend: News Aggregation Service

```text
backend/app/services/
  news_aggregator.py    <- fetch 25-30 RSS feeds (India real estate news)
  entity_router.py      <- match articles to city/area slugs
  news_cache.py         <- Redis 6h TTL per city
```

**RSS Sources (India real estate):**

- ET Realty (`economictimes.indiatimes.com/topic/real-estate`)
- TOI Property (`timesofindia.indiatimes.com/topic/real-estate`)
- Moneycontrol RE (`moneycontrol.com/real-estate`)
- NDTV Property (`ndtv.com/property`)
- Hindu Business Line
- Telangana Today (infra, TSRERA)
- Bangalore Mirror / Deccan Herald (Karnataka infra)
- MahaRERA, TSRERA, K-RERA news feeds

**Entity Routing:**

- Maintain synonym map: `"Kokapet" -> ["Kokapet", "kokapet", "Financial District West"]`
- Match article content to area slugs using regex + fuzzy match
- Route to city if no specific area match

### 1b. Backend: AI Verdict Endpoint

```text
POST /api/v1/verdict/{city_slug}/{area_slug}
```

**Request flow:**

1. Pull area signals from stored data
2. Pull recent news (last 7 days) from news cache
3. Build structured prompt -> Gemini Flash API
4. Return: `{ summary, reasons_to_buy[3], risks[3], verdict, confidence }`
5. Cache result with Redis 24h TTL

**Verdict format:**

```json
{
  "verdict": "buy" | "hold" | "wait" | "avoid",
  "confidence": 72,
  "summary": "...",
  "reasons": ["Metro Phase 2 station confirmed 800m away", "..."],
  "risks": ["Oversupply risk in 2-3 years", "..."],
  "suitable_for": "investment" | "end-use" | "both",
  "last_updated": "2026-03-09T10:00:00Z"
}
```

### 1c. Frontend: "What Changed Recently" Section

- New section in AreaDetail with live news cards from backend
- Shows the last 5-7 articles relevant to the area
- Source tag + date + link to original

### 1d. Frontend: AI Verdict Card

- Verdict badge (Buy/Hold/Wait/Avoid) with confidence meter
- 3 reasons + 3 risks in a split layout
- "Suitable for: Investment / End-use" tag
- Transparent "Powered by Gemini" label

### 1e. Frontend: Cmd+K Search

- Global keyboard shortcut: `Cmd+K` / `Ctrl+K`
- Fuzzy search across all 6 cities and all supported areas
- Navigate directly to area or city page

### Phase 1 Success Criteria

- [ ] 30+ India real estate RSS feeds aggregated and cached
- [ ] Entity router correctly tags 80%+ of articles to the right city
- [ ] AI verdict live for all Hyderabad areas
- [ ] "What changed recently" section shows on AreaDetail
- [ ] Cmd+K search works across all cities
- [ ] Vercel + Render deployed with page load under 3 seconds

---

## Phase 2 - Market Pulse

**Goal:** Show real price trend, transaction signal, and affordability.

### 2a. RERA Scraper

- Telangana (TSRERA): new project filings, approvals, delays
- Karnataka (K-RERA): project registrations
- Maharashtra (MahaRERA): project status + complaints
- Extract: project name, area, status, units, carpet area, price

### 2b. Price Intelligence

- Scrape 99acres / MagicBricks area-level listing prices weekly
- Track median price per sqft per area + trend
- Make `priceVelocity` dynamic instead of hardcoded

### 2c. Market Snapshot Section

- Current price band (median Rs/sqft)
- 6-month price trend (up / down / stable)
- RERA project count + delayed count
- Demand proxy: listing volume change

### Phase 2 Success Criteria

- [ ] RERA data live for 2+ states
- [ ] Price trend shown on AreaDetail
- [ ] DNA Score `priceVelocity` updated weekly from real data
- [ ] Market pulse section on area pages

---

## Phase 3 - Intelligence Upgrade

**Goal:** Full intelligence product with comparison, tracking, and alerts.

- Entity correlation: "Similar areas" suggestions per locality
- Location comparison: side-by-side area view
- Trend scoring: DNA Score direction arrows
- Watchlist + email alerts on score/news changes
- Infra pipeline tracker (metro, highway, airport expansions)
- GEE satellite integration: built-up area growth layer

---

## Phase 4 - UAE/Dubai Expansion

- Dubai locality intelligence (DLD transaction data)
- Area-level market pulse (price/sqft, rental yield)
- Project + permit signals
- AI verdict adapted for UAE context

---

## Phase 5 - Monetization

| Tier | Price | Features |
|---|---|---|
| Free | Rs0 | 5 area lookups/day, basic scores |
| Pro | Rs499/month | Unlimited lookups, AI verdicts, news feed, PDF export |
| Investor | Rs1499/month | Price alerts, watchlist, RERA tracker, comparison |
| API | Rs2999/month | Developer API access |
| B2B | Custom | Builder/Agent white-label + bulk access |

---

## Architecture Overview

```text
User -> Frontend (React + Vite + MapLibre GL)
         |
         |-- Stored market data -> map + DNA scores
         |
         `-- Backend API (FastAPI + Redis)
               |-- GET  /api/v1/news/{city_slug}
               |-- POST /api/v1/verdict/{city_slug}/{area_slug}
               |-- GET  /api/v1/market/{area_slug}       [Phase 2]
               `-- GET  /api/v1/rera/{state}/{area}      [Phase 2]
                    |
                    |-- Redis cache (6h news / 24h verdicts)
                    |-- Gemini Flash API (AI verdicts)
                    `-- RSS feeds x 30 sources
```

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + MapLibre GL |
| State | Zustand |
| Backend | FastAPI (Python 3.11) |
| Cache | Redis (Upstash free tier) |
| AI | Gemini Flash (primary) -> Groq (fallback) |
| DB | Supabase (Phase 2+) |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Key Conventions

- City slugs: lowercase no-spaces (`hyderabad`, `delhi`)
- Area slugs: lowercase-hyphenated (`financial-district`, `kokapet`)
- Coordinates: `[lat, lng]` in data files; flip to `[lng, lat]` for MapLibre
- Dark theme: `#0a0a0a` background, IBM Plex Mono font
- Branch names: `feat/`, `fix/`, `docs/` prefix + descriptive name
