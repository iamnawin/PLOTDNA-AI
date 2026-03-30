# All-India Expansion Plan

## Purpose

PlotDNA currently works best in Hyderabad, Bangalore, and Mumbai because those are now the three resolver-grade locality layers in the repo:

- `data/cities/hyderabad/*`
- `data/cities/bangalore/*`
- `data/cities/mumbai/*`
- `frontend/src/data/hyderabad.ts`
- `frontend/src/data/bangalore.ts`
- `frontend/src/data/mumbai.ts`

The goal of this plan is to move PlotDNA from a Hyderabad-first, partly hardcoded setup to a scalable all-India micro-market intelligence platform.

## Current Reality

PlotDNA already has two different systems:

1. `Dynamic coordinate analysis`
   - Backend route: `backend/app/api/routes/score.py`
   - Scoring logic: `backend/app/services/scoring_engine.py`
   - Uses OSM / Overpass signals around any coordinate.
   - Works for any point, but only produces approximate point-level signals.

2. `Stored micro-market intelligence`
   - Frontend city registry: `frontend/src/data/cities.ts`
   - Per-city datasets: `frontend/src/data/*.ts`
   - Hyderabad, Bangalore, and Mumbai resolver data: `data/cities/<city>/*`
   - Backend fallback verdict data: `backend/app/api/routes/verdict.py`
   - Provides locality name, polygons, price range, YoY, highlights, projects, and source links.

The current product is mostly:

`coordinates -> resolver -> stored locality -> stored market intelligence -> verdict/news UI`

This means PlotDNA is not fully dynamic today. It is a hybrid system.

## Why Coordinates Alone Are Not Enough

Coordinates can help PlotDNA estimate:

- infrastructure
- employment
- density / population proxy
- construction activity
- rough score

Coordinates alone cannot reliably produce:

- exact micro-market identity
- locality boundaries
- price range
- YoY appreciation
- curated active projects
- source links
- stable market narrative

Because of that, PlotDNA still needs stored area definitions for any market it wants to present confidently.

## Product Principle

PlotDNA should remain a hybrid system:

- `Stored market catalog` for structure and consistency
- `Dynamic point analysis` for freshness and exact-location enrichment

Do not try to replace the market catalog with pure coordinate scoring.

## Target Architecture

```text
User input
-> coordinates / map URL / place text
-> locality resolver
-> canonical market catalog match
-> backend loads stored market profile
-> live coordinate analyzer adds fresh point-level signals
-> verdict layer combines stored + live context
-> frontend renders one unified result
```

## Required Data Model

PlotDNA needs one canonical market schema shared across all metros.

Each locality record should include:

- `city_slug`
- `locality_slug`
- `name`
- `center`
- `polygon`
- `aliases`
- `cluster_id`
- `score`
- `signals`
- `livability`
- `price_range`
- `yoy`
- `highlights`
- `active_projects`
- `source_links`
- `coverage_status`
- `last_updated`

## Structural Problems To Fix First

### 1. Frontend and backend both store market truth

The same market intelligence currently exists in multiple places:

- `frontend/src/data/*.ts`
- `frontend/src/lib/areaSources.ts`
- `backend/app/api/routes/verdict.py`

This will not scale across India.

### 2. Only Hyderabad, Bangalore, and Mumbai are resolver-grade cities today

Only Hyderabad, Bangalore, and Mumbai currently have:

- locality polygons
- alias mapping
- cluster mapping

Chennai, Pune, and Delhi still have area datasets, but not the same resolver structure.

### 3. Backend area APIs are not yet the real source of truth

`backend/app/api/routes/areas.py` is still a stub, so the frontend mostly depends on bundled static data.

## Recommended Migration Direction

### Phase 1: Normalize Hyderabad, Bangalore, and Mumbai as the reference implementation

Use Hyderabad, Bangalore, and Mumbai as the current template for the final system.

Goals:

- move Hyderabad, Bangalore, and Mumbai market records into one canonical backend-owned dataset
- keep polygons, aliases, and clusters together with the market records
- stop duplicating Hyderabad, Bangalore, and Mumbai values across frontend and backend
- make frontend fetch resolver-grade city data instead of bundling all of it locally

### Phase 2: Define one canonical catalog format

Create a single shared data contract for all cities.

Likely structure:

```text
data/cities/<city>/
  city.json
  localities.json
  aliases.json
  clusters.json
  market-data.json
  sources.json
```

Or, if fully backend-owned:

```text
backend/app/data/cities/<city>/
  city.json
  localities.json
  aliases.json
  clusters.json
  market-data.json
  sources.json
```

### Phase 3: Make backend the source of truth

The backend should serve:

- city list
- localities
- market detail
- source links
- project lists
- verdict inputs

The frontend should stop owning primary market facts.

### Phase 4: Generalize resolver support city by city

For each metro, add:

- `city.json`
- `localities.json`
- `aliases.json`
- `clusters.json`

Resolver logic in `frontend/src/lib/location/resolver.ts` should work from a generalized multi-city dataset rather than a Hyderabad-special path.

### Phase 5: Merge live scoring into market analysis

For a resolved locality:

- load stored market profile
- run live coordinate scoring when coordinates are available
- merge both views in the UI

Suggested product rule:

- stored market data defines the area story
- live score adds point-specific context and confidence adjustment

## Expansion Strategy

Do not expand state by state.

Expand city by city.

PlotDNA is a micro-market product, so the unit of expansion is:

- metro
- corridor
- locality

Recommended rollout order:

1. Hyderabad and Bangalore normalization
2. Mumbai
3. Chennai
4. Pune
5. Delhi NCR
7. Tier-2 metros after the main model is stable

## Minimum Requirements For Adding A New Metro

Before a new metro is considered supported, it should have:

- city metadata
- locality list
- polygons for supported localities
- alias mapping
- cluster grouping
- baseline market signals
- price range and YoY estimates
- at least basic active project coverage
- area-specific source links
- backend verdict coverage

Without these, the city should be treated as coordinate-score-only, not as fully supported market intelligence.

## Coverage Tiers

To avoid overclaiming, PlotDNA should explicitly classify market support:

### Tier A: Full micro-market support

- polygon-defined locality
- full stored profile
- projects
- sources
- verdict support

### Tier B: Resolver support only

- polygon or cluster support
- partial stored profile
- limited sources and project coverage

### Tier C: Dynamic coordinate support only

- live score available
- no curated locality intelligence yet

This prevents unsupported cities from looking equal to Hyderabad-level coverage.

## Recommended Backend APIs

PlotDNA should eventually expose real catalog-backed APIs such as:

- `GET /api/cities`
- `GET /api/cities/{city_slug}/localities`
- `GET /api/cities/{city_slug}/localities/{locality_slug}`
- `GET /api/cities/{city_slug}/localities/{locality_slug}/sources`
- `GET /api/cities/{city_slug}/localities/{locality_slug}/projects`
- `POST /api/score/analyze`
- `GET /api/verdict/{city_slug}/{locality_slug}`

## Refactor Order

Recommended implementation order:

1. Create canonical backend market schema
2. Migrate Hyderabad into that schema
3. Replace duplicated Hyderabad backend/frontend values with one source
4. Update frontend to fetch market data from backend
5. Generalize resolver loading for all cities
6. Port Chennai to the same structure
7. Repeat for remaining metros

## Non-Goals

This plan does not assume:

- fully automatic state-wide coverage
- zero manual curation
- deriving pricing and YoY from raw coordinates only
- replacing locality data with OSM scoring alone

## Success Criteria

PlotDNA is ready for real all-India expansion when:

- market truth exists in one canonical place
- frontend no longer duplicates core locality data
- resolver works from a generalized city dataset
- a new metro can be onboarded by filling a standard data package
- live coordinate scoring enriches localities instead of pretending to replace them

## Immediate Next Step

Use Hyderabad, Bangalore, and Mumbai as the migration template and refactor the app so:

- one canonical dataset powers resolver, area detail, sources, and verdicts
- frontend consumes that dataset through backend APIs
- future metros can be added without repeating the earlier Hyderabad-only hardcoding pattern
