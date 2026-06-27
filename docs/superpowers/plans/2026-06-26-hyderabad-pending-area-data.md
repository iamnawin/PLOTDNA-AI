# Hyderabad Pending Area Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Hyderabad `data-pending` placeholders with sourced, auditable area details and promote areas to scored market cells only after verified boundaries and signals exist.

**Architecture:** Keep pending areas honest until data is sourced. First create a reproducible source-audit dataset for every context cell using official Telangana TGRAC HMDA/GHMC village boundaries where available, then add source metadata to the UI/API path before any scoring promotion.

**Tech Stack:** Python standard library scripts, ArcGIS REST JSON, existing Hyderabad GeoJSON/JSON data, Vite/React checks.

---

**Status update - 2026-06-27:** TGRAC source evidence is now attached for every pending cell without promoting them to scored localities. `scripts/audit_hyderabad_pending_context.py` matches 47 cells to the HMDA/GHMC TGRAC village layer and 28 cells to the statewide TGRAC village layer. `scripts/fetch_hyderabad_tgrac_pending_boundaries.py` writes `data/cities/hyderabad/tgrac-pending-village-boundaries.geojson` with 73 unique official village polygons covering the 75 matched pending rows. Map hovers and coordinate analysis cards now show official village attributes plus the missing score-signal categories.

**Scoring gate update - 2026-06-27:** `scripts/audit_hyderabad_pending_scoring_readiness.py` writes `data/cities/hyderabad/pending-scoring-readiness.json`. All 75 pending cells have official boundary evidence, 0 are promotion-ready, and all 75 remain blocked by missing price/RERA/infrastructure/satellite/employment/government-scheme signal decks.

### Task 1: Build Pending Area Source Audit

**Files:**
- Create: `scripts/audit_hyderabad_pending_context.py`
- Create: `data/cities/hyderabad/pending-context-sources.json`
- Modify: `frontend/scripts/check-hyderabad-production.mjs`

- [x] **Step 1: Write a failing production guard**

Guard that `pending-context-sources.json` exists, has every context cell, and records source status for each.

- [x] **Step 2: Implement the audit script**

Read `coverage-areas.geojson`, extract `contextOnly` cells, query TGRAC HMDA/GHMC layer 9 by centroid point, fall back to statewide TGRAC Village Boundary layer 27 when needed, and write one row per pending area with matched village, mandal, district, source URL, and status.

- [x] **Step 3: Run the script**

Run: `python scripts\audit_hyderabad_pending_context.py`

- [x] **Step 4: Verify**

Run: `npm run test:hyderabad-production`

### Task 2: Surface Pending Source Details

**Files:**
- Modify: `frontend/src/components/map/MapView.tsx`
- Modify: `frontend/src/components/score/PlotAnalysisCard.tsx`
- Create: `frontend/src/lib/hyderabadPendingSources.ts`
- Create: `scripts/fetch_hyderabad_tgrac_pending_boundaries.py`
- Create: `data/cities/hyderabad/tgrac-pending-village-boundaries.geojson`
- Create: `scripts/audit_hyderabad_pending_scoring_readiness.py`
- Create: `data/cities/hyderabad/pending-scoring-readiness.json`
- Modify: `CLAUDE.md`

- [x] **Step 1: Add source fields to pending hover**

Show matched village/mandal/district where the audit found an official TGRAC hit; keep the “Data pending” status until score signals exist.

- [x] **Step 2: Add analysis card source details**

For context-area searches, show the same matched administrative context.

- [x] **Step 3: Verify UI contract**

Run: `npm run test:hyderabad-production`, `npm run lint`, and `npm run build`.

Verified:
- `python scripts\fetch_hyderabad_tgrac_pending_boundaries.py`
- `npm run test:hyderabad-production`
- `npm run test:hyderabad-location-search`
- `python scripts\validate_hyderabad_coverage.py`
- `PYTHONPATH=backend python -m unittest backend.tests.test_hyderabad_coverage backend.tests.test_location_search backend.tests.test_catalog_backed_resolution`
- `npm run lint`
- `npm run build`

### Task 3: Promote Verified Areas Only After Signal Data

**Files:**
- Modify only after source and scoring inputs are ready.

- [x] **Step 1: Define minimum scoring evidence**

Require sourced boundary or official admin match plus price/rera/infrastructure/satellite signal deck before removing pending status.

Implemented with `data/cities/hyderabad/pending-scoring-readiness.json`. Required evidence is official boundary, price band, RERA activity, infrastructure, satellite growth, employment, and government scheme signal. No pending context cell is promotion-ready yet.

- [ ] **Step 2: Add scored records in batches**

Promote batches of verified areas from `contextOnly` to scored market records, with tests proving no nearby-score substitution or invented polygon precision.
