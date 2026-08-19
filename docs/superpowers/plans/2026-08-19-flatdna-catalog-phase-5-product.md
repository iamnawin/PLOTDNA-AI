# FlatDNA Catalog Phase 5 Product Release Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a default-off published-catalog API and customer UI path with snapshot-consistent metrics, independent statuses, source/freshness metadata, safe location wording, warnings, and honest reviewed-vs-registry labels.

**Architecture:** New catalog endpoints read only the active publication and its immutable project versions. Existing 14-project endpoints remain unchanged. Separate backend/frontend flags default false, so the catalog path cannot affect production until Phase 4 database acceptance and an explicit release decision.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic v2, React 19, TypeScript, Tailwind v4, unittest, static frontend contract checks, `pnpm`.

---

## File Map

- Create `backend/app/services/flatdna/catalog_query.py`: published-only status/search/detail reads.
- Modify `backend/app/api/routes/flat.py`: separately gated catalog endpoints and public payloads.
- Modify `backend/app/core/config.py` and `.env.example`: `ENABLE_FLATDNA_CATALOG=false`.
- Create `backend/tests/test_flatdna_catalog_api.py`: feature gate, snapshot consistency, payload, and failure behavior.
- Modify `frontend/src/lib/features.ts`: default-off frontend catalog flag.
- Modify `frontend/src/lib/api.ts`: catalog status/search/detail contracts.
- Modify `frontend/src/pages/FlatProjectSearch.tsx`: conditional source/coverage copy and badges while preserving existing pilot behavior.
- Modify `frontend/scripts/check-flatdna-search-ui.mjs`: static release-path assertions.
- Modify `docs/superpowers/specs/2026-08-19-flatdna-hyderabad-catalog-design.md`: Phase 5 code receipt and disabled-release state.

## Tasks

1. Write failing repository/API tests for published-only queries, same-snapshot metrics/results, independent statuses, warnings, and default-off 404 behavior.
2. Implement minimal parameterized PostgreSQL reads and new `/catalog/status`, `/catalog/projects/search`, and `/catalog/projects/{registration_id}` endpoints.
3. Write failing frontend contract assertions for approved copy, `Listed in TG-RERA records`, `FlatDNA Reviewed`, source date, historical-review state, and catalog feature flag.
4. Add conditional frontend API/data flow without changing the existing pilot path when the flag is false.
5. Run backend suite, frontend FlatDNA checks, lint, build, independent review, and `git diff --check`.
6. Update the design receipt, commit `feat: add gated FlatDNA catalog product path`, and push `origin HEAD`.

## Phase 5 Completion Boundary

Phase 5 code is complete when the default-off API/UI path, tests, review, receipt, commit, and push are complete. Customer release remains blocked while `ENABLE_FLATDNA_CATALOG` and `VITE_ENABLE_FLATDNA_CATALOG` are false and until Phase 4 database acceptance succeeds.
