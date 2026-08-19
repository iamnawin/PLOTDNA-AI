# FlatDNA Catalog Phase 3 Processing Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, offline catalog processor that converts sanitized TG-RERA-shaped records into normalized, deduplicated, scope-classified candidate snapshot projections with explicit identities, mapping precision, statuses, confidence dimensions, exclusions, and measurable coverage.

**Architecture:** A pure processing module accepts strict source records and an existing registry identity index. Exact authority-scoped registration numbers are the only automatic identity bridge. Similar names never merge separate registrations. Duplicate registrations quarantine affected rows. Production acquisition and database publication remain absent.

**Tech Stack:** Python 3, Pydantic v2, deterministic UUID5 identities for new imported registrations, unittest, JSON fixtures, `uv`.

---

## File Map

- Create `backend/app/services/flatdna/catalog_pipeline.py`: source contracts, normalization, identity resolution, scope/location mapping, metrics, and candidate snapshot build.
- Create `backend/tests/test_flatdna_catalog_pipeline.py`: identity, phase, quarantine, scope, location, and metric behavior.
- Create `data/staging/tgrera/README.md`: fixture-only and production-gate rules.
- Create `data/staging/tgrera/hyderabad-apartment-sample.json`: sanitized deterministic processing corpus.
- Create `scripts/build_flatdna_catalog.py`: offline dry-run builder; no database or network path.
- Modify `docs/superpowers/specs/2026-08-19-flatdna-hyderabad-catalog-design.md`: Phase 3 receipt.

## Task 1: Build source and projection contracts test-first

- [ ] Write failing tests for strict source fields, normalized registration numbers, deterministic IDs, separate phase registrations, and invalid partial identity.
- [ ] Run `uv --directory backend run --with-requirements requirements.txt python -m unittest tests.test_flatdna_catalog_pipeline -v` and confirm the missing-module failure.
- [ ] Implement `SourceCatalogRecord`, `ExistingRegistrationIdentity`, `CatalogProjection`, and `CandidateCatalogSnapshot` in `catalog_pipeline.py` using the Phase 2 enums.
- [ ] Re-run the focused tests and confirm GREEN.

Required source fields:

```python
SourceCatalogRecord(
    source_record_id=UUID(...),
    authority_code="TG_RERA",
    registration_number="P02400000001",
    project_name="Example Heights Phase 1",
    promoter_name="Example Developer",
    property_type="RESIDENTIAL_APARTMENT",
    project_status="ACTIVE",
    within_market=True,
    locality="Kokapet",
    latitude=None,
    longitude=None,
    coordinate_source=None,
)
```

## Task 2: Implement deterministic processing rules

- [ ] Write failing tests for duplicate registration quarantine, out-of-scope hiding, exact registry reuse, location-only partial resolution, and snapshot metrics.
- [ ] Verify RED for each behavior.
- [ ] Implement `build_candidate_snapshot(records, existing_identities, source_as_of, sequence)` with these rules:

```text
duplicate authority + normalized RERA number -> UNRESOLVED + QUARANTINED
missing project/promoter identity -> UNRESOLVED + QUARANTINED
non-apartment or outside market -> RESOLVED + UNSUPPORTED + HIDDEN
unique identity with exact/approximate coordinates -> RESOLVED + SEARCHABLE
unique identity with locality/unknown location -> PARTIALLY_RESOLVED + SEARCHABLE
existing exact registration -> preserve canonical project and registration UUIDs
different registrations with similar names -> remain separate
```

- [ ] Store project-name, duplicate, promoter, locality, and coordinate confidence independently in basis points.
- [ ] Calculate the Phase 2 `CatalogMetrics` fields—acquired, unique registration, apartment, in-geography, searchable, quarantined, excluded, identity, and reviewed counts—from the same candidate snapshot.
- [ ] Re-run focused tests and confirm GREEN.

## Task 3: Add the sanitized offline fixture and CLI

- [ ] Add a fixture containing a resolved apartment, location-only apartment, two separate phases, duplicate registration conflict, commercial exclusion, and outside-market exclusion.
- [ ] Add tests asserting the fixture is marked `TEST`, has no live-source claim, and produces deterministic output.
- [ ] Implement `scripts/build_flatdna_catalog.py` with `--fixture` and optional `--json-report`. It must not import SQLAlchemy, construct an engine, access the network, or accept a production mode.
- [ ] Run the CLI twice and prove byte-identical JSON reports.

## Task 4: Verify, review, document, commit, and push

- [ ] Run the full backend suite and `git diff --check`.
- [ ] Request independent review focused on accidental merging, public eligibility, confidence/status consistency, fixture safety, and deterministic metrics.
- [ ] Add the verified Phase 3 receipt and record that no database or production acquisition was used.
- [ ] Commit with subject `feat: build deterministic FlatDNA catalog pipeline` and push `origin HEAD`.

## Phase 3 Completion Boundary

Phase 3 is complete when deterministic offline processing, fixtures, metrics, tests, review, design receipt, commit, and push are complete. It does not acquire live TG-RERA records, apply migration `0002`, or publish a customer catalog.
