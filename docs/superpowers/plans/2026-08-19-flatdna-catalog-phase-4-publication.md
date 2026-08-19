# FlatDNA Catalog Phase 4 Validation and Publication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the validation, 14-project reconciliation, atomic publication, rollback, and failure-injection boundaries required before a catalog snapshot can affect customers.

**Architecture:** Pure validators create deterministic receipts before persistence. A narrow PostgreSQL publisher uses one transaction and row locking to supersede the current pointer and insert the next publication. The production database operator remains unchanged until migration `0002` passes real disposable PostgreSQL apply/down/reapply testing.

**Tech Stack:** Python 3, Pydantic v2, SQLAlchemy, PostgreSQL SQL, unittest, `uv`.

---

## File Map

- Create `backend/app/services/flatdna/catalog_validation.py`: snapshot gate and 14-project reconciliation.
- Create `backend/app/services/flatdna/catalog_publication.py`: atomic publish/rollback repository.
- Create `backend/tests/test_flatdna_catalog_validation.py`: metric, status, migration, and receipt checks.
- Create `backend/tests/test_flatdna_catalog_publication.py`: transaction, lock, rollback, and failure injection.
- Create `scripts/validate_flatdna_catalog_release.py`: offline validation/reconciliation receipt command.
- Modify `docs/production-database-operations.md`: Phase 4 code/readiness boundary.
- Modify `docs/superpowers/specs/2026-08-19-flatdna-hyderabad-catalog-design.md`: Phase 4 implementation receipt and blocked database evidence.

## Task 1: Snapshot publication gate

- [ ] Write failing tests for metric reconciliation, unique registration IDs, unresolved searchable rows, unknown-location searchable rows, source/snapshot mismatch, and deterministic validation receipt.
- [ ] Verify RED.
- [ ] Implement `validate_candidate_snapshot(snapshot) -> ValidationReceipt` with immutable findings and a SHA-256 receipt over canonical JSON.
- [ ] Verify GREEN.

## Task 2: Existing 14-project reconciliation

- [ ] Write failing tests comparing expected registry UUIDs, registration UUIDs, evidence-source UUIDs, claim-evidence UUIDs, developer relationships, and customer-visible identity against observed migration rows.
- [ ] Implement `reconcile_registry_migration(bundle, observed) -> MigrationReconciliation`.
- [ ] Require exactly 14 reconciled projects and zero missing, extra, reassigned, or behavior-changing rows before `passed=True`.
- [ ] Verify GREEN.

## Task 3: Atomic publication and rollback

- [ ] Write failing transaction tests proving current-pointer row locking, validated snapshot precondition, one-transaction supersede/insert, rollback linkage, and complete rollback on injected insert failure.
- [ ] Implement `PostgresCatalogPublisher.publish(...)` and `.rollback(...)` using `Engine.begin()` and parameterized SQL only.
- [ ] Keep this service unreachable from existing production commands until disposable database validation passes.
- [ ] Verify GREEN.

## Task 4: Release receipt CLI and phase verification

- [ ] Add an offline CLI that validates the sanitized candidate snapshot and the committed 14-project registry, emits no database/network action, and writes an optional JSON receipt.
- [ ] Run the full backend suite, CLI, and `git diff --check`.
- [ ] Request independent correctness/security review and fix all Critical/Important findings.
- [ ] Update the design receipt with verified test counts and the explicit missing `FLATDNA_TEST_DATABASE_URL` acceptance evidence.
- [ ] Commit with subject `feat: add FlatDNA publication safety gates` and push `origin HEAD`.

## Phase 4 Completion Boundary

Phase 4 code is implementation-complete when validation, reconciliation, publication, rollback, failure tests, review, design receipt, commit, and push are complete. Phase 4 release acceptance remains blocked until migration `0002` passes apply/down/reapply and publication/rollback against a disposable PostgreSQL database. The configured production URL must never be used as a substitute.
