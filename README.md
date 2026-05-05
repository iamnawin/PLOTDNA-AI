 
<div align="center">

<img src="frontend/public/plotdna-logo.png" alt="PlotDNA logo" width="120" />

**PlotDNA - Decode any plot before you buy.**

PlotDNA is a hybrid real-estate intelligence product for selected Indian micro-markets.
It combines curated locality data, resolver-based coordinate matching, and a growing backend
for dynamic analysis.

</div>

---

## What PlotDNA is today

PlotDNA is strongest as a **supported-zones intelligence product**, not yet as a
fully dynamic "any plot in India" engine.

Current product model:

- curated micro-market coverage across selected cities
- coordinate and map-link input that resolves into supported locality context
- stored market profiles for supported areas
- some backend-driven dynamic analysis and verdict flows

The current system is best described as:

`user input -> resolver -> supported locality or cluster -> stored market profile -> optional dynamic enrichment`

If a searched point is outside supported coverage, the product should be treated as
approximate or unsupported rather than exact.

---

## Architectural reality

PlotDNA currently has two layers:

### 1. Curated market intelligence

This is the stronger part of the product today.

- city datasets and market narratives live in `frontend/src/data/*.ts`
- resolver-grade city geometry and aliases live in `data/cities/<city>/`
- supported areas can show score, narrative, projects, sources, and area detail UI

### 2. Dynamic analysis

This exists, but it is not yet the sole source of truth.

- backend scoring routes can analyze coordinates
- resolver logic can map coordinates to exact, nearby, cluster, or uncovered context
- some verdict and live-analysis flows use backend services

What is **not** true yet:

- all of market truth comes from one backend-owned canonical catalog
- every searched point in India gets equally reliable locality intelligence
- pricing, RERA, infra, and satellite freshness are fully automated for all supported cities

---

## Coverage model

PlotDNA should be read through explicit support tiers:

- **Tier A: Full micro-market support**
  - polygon-defined locality
  - stored market profile
  - area detail experience
  - sources / projects / verdict support
- **Tier B: Resolver or cluster support**
  - approximate supported-market context
  - partial confidence
  - not exact point-level locality truth
- **Tier C: Dynamic coordinate-only support**
  - coordinate analysis without curated locality intelligence
  - should not be presented as equal to Tier A

See [docs/COVERAGE_TIERS.md](docs/COVERAGE_TIERS.md).

---

## Current supported markets

Resolver-grade support currently exists for:

- Hyderabad
- Bangalore
- Mumbai
- Chennai
- Pune
- Delhi NCR
- Vijayawada Capital Region
- Visakhapatnam

Starter coverage also exists for:

- Dubai

These cities have resolver datasets under `data/cities/` and bundled market datasets in
`frontend/src/data/`.

---

## What the repo does well now

- strong demoable product vision
- polished map and area-detail UI
- curated city storytelling
- resolver-based locality matching for supported cities
- hybrid coordinate-to-market flow
- investor-style presentation of score, outlook, and narrative

---

## What is still incomplete

The repo is not yet a fully accurate nationwide intelligence engine.

Key gaps:

- market truth is still duplicated across frontend and backend paths
- backend area/catalog APIs are not yet the canonical source of truth
- fresh data pipelines are incomplete
- exact-location intelligence outside supported zones is limited
- support tiers are stronger than nationwide claims

The main architecture plan for fixing that lives in
[docs/ALL_INDIA_EXPANSION_PLAN.md](docs/ALL_INDIA_EXPANSION_PLAN.md).

---

## Repository layout

```text
frontend/
  src/
    components/             UI components
    data/                   bundled city and market datasets
    lib/                    API helpers, resolver, analysis helpers
    pages/                  landing, home, area detail, brochure flows

backend/
  app/
    api/routes/             FastAPI routes
    services/               scoring, verdict, routing, and helpers

data/
  cities/                   resolver-grade city geometry, aliases, clusters

docs/
  ROADMAP.md
  ALL_INDIA_EXPANSION_PLAN.md
  COVERAGE_TIERS.md
```

---

## Local development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Runs at `http://localhost:8000`.

### Important truth about local dev

- the frontend can run by itself because much of the current product is still bundled static data
- the backend is needed for the dynamic flows that do exist
- this mixed setup is part of the current transition state, not the desired end architecture

---

## Mobile release status

Capacitor work exists here as an implementation path, but release readiness still depends on
honest product copy, backend verification, and native smoke testing.

Release prep docs:

- [docs/android-release-checklist.md](docs/android-release-checklist.md)
- [docs/ios-release-checklist.md](docs/ios-release-checklist.md)

---

## Recommended next engineering move

The highest-value technical next step is:

1. move market truth into one canonical backend-owned catalog
2. make frontend consume that catalog through backend APIs
3. keep support tiers explicit while dynamic coverage matures

That migration direction is already outlined in
[docs/ALL_INDIA_EXPANSION_PLAN.md](docs/ALL_INDIA_EXPANSION_PLAN.md).
