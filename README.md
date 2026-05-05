#
<div align="center">

<img width="104" height="104" alt="plotDNA logo2" src="https://github.com/user-attachments/assets/512d1ef5-4b11-46f1-bf8f-1a27e0650900" />


**PlotDNA - Decode any plot before you buy.**

PlotDNA is a hybrid real-estate intelligence product for selected micro-markets.
It combines curated locality data, resolver-based coordinate matching, and a growing backend
for dynamic analysis.

[![Coverage](https://img.shields.io/badge/Coverage-8%20resolver--grade%20India%20markets%20%2B%20Dubai%20starter-00e676?style=flat-square&labelColor=050508)](#current-supported-markets)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?style=flat-square&labelColor=050508)](#repository-layout)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&labelColor=050508)](#repository-layout)
[![Mobile](https://img.shields.io/badge/Mobile-Capacitor%20path-119eff?style=flat-square&labelColor=050508)](#mobile-release-status)

</div>

---

## At a glance

| Area | Current reality |
|---|---|
| Product shape | Supported-zones intelligence product |
| Strongest mode | Curated micro-market coverage |
| Dynamic capability | Coordinate analysis and resolver-based enrichment |
| Coverage quality | Uneven by support tier |
| Architecture state | Hybrid transition, not yet backend-canonical |
| Next major step | Move market truth into one backend-owned catalog |

---

## What PlotDNA is today

PlotDNA is strongest as a **supported-zones intelligence product**, not yet a
fully dynamic "any plot in India" engine.

Current product model:

- curated micro-market coverage across selected markets
- coordinate and map-link input that resolves into supported locality context
- stored market profiles for supported areas
- selective backend-driven dynamic analysis and verdict flows

The current system is best described as:

`user input -> resolver -> supported locality or cluster -> stored market profile -> optional dynamic enrichment`

If a searched point is outside supported coverage, the product should be treated as
approximate or unsupported rather than exact.

---

## Architectural reality

PlotDNA currently operates as two layers.

### Curated market intelligence

This is the stronger part of the product today.

- city datasets and market narratives live in `frontend/src/data/*.ts`
- resolver-grade city geometry and aliases live in `data/cities/<city>/`
- supported areas can show score, narrative, projects, sources, and area-detail UI

### Dynamic analysis

This exists, but it is not yet the sole source of truth.

- backend scoring routes can analyze coordinates
- resolver logic can map coordinates to exact, nearby, cluster, or uncovered context
- some verdict and live-analysis flows use backend services

What is **not** true yet:

- all market truth comes from one backend-owned canonical catalog
- every searched point gets equally reliable locality intelligence
- pricing, RERA, infra, and satellite freshness are fully automated across all markets

---

## Coverage model

PlotDNA should be read through explicit support tiers.

| Tier | Meaning | What users should expect |
|---|---|---|
| Tier A | Full micro-market support | polygon-defined locality, stored profile, sources, projects, verdict support |
| Tier B | Resolver or cluster support | approximate supported-market context, not exact point-native truth |
| Tier C | Dynamic coordinate-only support | point analysis without full curated locality intelligence |

See [docs/COVERAGE_TIERS.md](docs/COVERAGE_TIERS.md).

---

## Current supported markets

### Resolver-grade coverage

- Hyderabad
- Bangalore
- Mumbai
- Chennai
- Pune
- Delhi NCR
- Vijayawada Capital Region
- Visakhapatnam

### Starter coverage

- Dubai

Resolver data lives under `data/cities/`. Bundled market datasets currently live in
`frontend/src/data/`.

---

## What the repo already does well

- strong demoability and product framing
- polished map and area-detail UI
- curated city storytelling
- resolver-based locality matching for supported markets
- hybrid coordinate-to-market flow
- investor-style score, outlook, and narrative presentation

---

## What is still incomplete

The repo is not yet a fully accurate nationwide intelligence engine.

Key gaps:

- market truth is still duplicated across frontend and backend paths
- backend area/catalog APIs are not yet the canonical source of truth
- fresh data pipelines are incomplete
- exact-location intelligence outside supported zones is limited
- support tiers are stronger than current marketing claims if phrased too broadly

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

Capacitor work exists here as an implementation path, but release readiness still depends on:

- honest product copy
- backend verification
- native smoke testing
- platform-specific icon and store-prep follow-through

Release prep docs:

- [docs/android-release-checklist.md](docs/android-release-checklist.md)
- [docs/ios-release-checklist.md](docs/ios-release-checklist.md)

---

## Recommended next engineering move

The highest-value technical next step is:

1. move market truth into one canonical backend-owned catalog
2. make the frontend consume that catalog through backend APIs
3. keep support tiers explicit while dynamic coverage matures

That migration direction is already outlined in
[docs/ALL_INDIA_EXPANSION_PLAN.md](docs/ALL_INDIA_EXPANSION_PLAN.md).
