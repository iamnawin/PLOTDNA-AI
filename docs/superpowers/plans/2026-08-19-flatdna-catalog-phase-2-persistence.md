# FlatDNA Catalog Phase 2 Persistence Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the additive PostgreSQL and Python domain foundation for ingestion runs, immutable catalog snapshots, atomic publications, phase-level registrations, independent statuses, sourced warnings, match assessments, and immutable review versions.

**Architecture:** Migration `0002` extends the current seven-table FlatDNA registry without replacing it. Existing project UUIDs and RERA-reference UUIDs remain stable; RERA references are backfilled into phase-level registrations using the same UUIDs. Customer behavior continues to use the existing registry until a later validated snapshot is atomically published.

**Tech Stack:** PostgreSQL, SQLAlchemy, Pydantic v2, Python unittest, existing `uv` workflow.

---

## File Map

- Create `backend/migrations/0002_flatdna_catalog.up.sql`: additive catalog schema and safe backfill.
- Create `backend/migrations/0002_flatdna_catalog.down.sql`: reverse only Phase 2 objects and columns.
- Create `backend/app/services/flatdna/catalog_models.py`: independent status and persistence contract models.
- Create `backend/tests/test_flatdna_catalog_models.py`: domain invariants.
- Create `backend/tests/test_flatdna_catalog_migration_contract.py`: migration structure, rollback, and backfill contract.
- Modify `backend/scripts/propertydna_db.py`: apply ordered up migrations rather than only migration `0001`.
- Modify `backend/tests/test_propertydna_db_operator.py`: ordered migration-chain behavior.
- Modify `docs/superpowers/specs/2026-08-19-flatdna-hyderabad-catalog-design.md`: Phase 2 receipt.

## Task 1: Define independent catalog domain contracts

**Files:**
- Create: `backend/app/services/flatdna/catalog_models.py`
- Test: `backend/tests/test_flatdna_catalog_models.py`

- [ ] **Step 1: Write failing model tests**

Cover:

- `UNRESOLVED` cannot be `SEARCHABLE`.
- `PARTIALLY_RESOLVED + SEARCHABLE` requires unique registration, resolved project/promoter identity, no duplicate suspicion, and only location uncertainty.
- `UNSUPPORTED` requires resolved identity and an exclusion reason.
- `SUPPORTED` requires `current_review_id` and current freshness.
- Resolved regulatory warnings require explicit resolution evidence.
- Customer location labels map to exact, approximate, locality-level, or verifying wording.

Use the wished-for API:

```python
CatalogProjectState(
    review_status="REVIEW_REQUIRED",
    identity_status="UNRESOLVED",
    project_status="UNKNOWN",
    catalog_status="SEARCHABLE",
    location_precision="UNKNOWN",
)
```

Expected: Pydantic validation error.

- [ ] **Step 2: Verify RED**

```powershell
uv --directory backend run --with-requirements requirements.txt python -m unittest tests.test_flatdna_catalog_models -v
```

Expected: import failure because `catalog_models.py` does not exist.

- [ ] **Step 3: Implement minimal strict models**

Define these exact enums:

```python
class CatalogReviewStatus(str, Enum):
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    SUPPORTED = "SUPPORTED"
    UNSUPPORTED = "UNSUPPORTED"

class IdentityStatus(str, Enum):
    RESOLVED = "RESOLVED"
    PARTIALLY_RESOLVED = "PARTIALLY_RESOLVED"
    UNRESOLVED = "UNRESOLVED"

class ProjectStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    WITHDRAWN = "WITHDRAWN"
    LAPSED = "LAPSED"
    UNKNOWN = "UNKNOWN"

class CatalogStatus(str, Enum):
    SEARCHABLE = "SEARCHABLE"
    QUARANTINED = "QUARANTINED"
    HIDDEN = "HIDDEN"

class RegulatoryFlag(str, Enum):
    REVOKED = "REVOKED"
    DEFAULTER = "DEFAULTER"
    LITIGATION_REPORTED = "LITIGATION_REPORTED"
    OTHER_WARNING = "OTHER_WARNING"
```

Add strict `CatalogProjectState`, `MatchAssessment`, `RegulatoryWarning`, `CatalogMetrics`, `CatalogSnapshot`, and `ProjectReview` models. Store internal confidence in integer basis points from 0 through 10,000. Do not expose a public numeric-confidence formatter.

- [ ] **Step 4: Verify GREEN**

Run the focused command. Expected: all catalog model tests pass.

## Task 2: Add migration contract tests before SQL

**Files:**
- Create: `backend/tests/test_flatdna_catalog_migration_contract.py`

- [ ] **Step 1: Write failing migration contract tests**

Require migration `0002` to create exactly these new tables:

```text
flat_ingestion_runs
flat_source_records
flat_catalog_snapshots
flat_catalog_publications
flat_project_registrations
flat_project_reviews
flat_regulatory_warnings
flat_match_assessments
flat_catalog_project_versions
```

Assert:

- Both migrations are transaction wrapped.
- Up/down files exist.
- The down migration drops only Phase 2 tables/columns/functions/triggers.
- `flat_catalog_publications` has a partial unique current-publication index.
- Snapshot project versions use snapshot plus registration as the primary identity.
- Authority plus normalized RERA number is unique.
- Registration backfill copies `flat_rera_references.id` unchanged.
- Independent status checks contain every approved enum value.
- Review and warning constraints are present.
- No delete, truncate, or update touches existing FlatDNA evidence or claim rows.

- [ ] **Step 2: Verify RED**

```powershell
uv --directory backend run --with-requirements requirements.txt python -m unittest tests.test_flatdna_catalog_migration_contract -v
```

Expected: failure because migration `0002` does not exist.

## Task 3: Implement migration `0002`

**Files:**
- Create: `backend/migrations/0002_flatdna_catalog.up.sql`
- Create: `backend/migrations/0002_flatdna_catalog.down.sql`

- [ ] **Step 1: Create the additive up migration**

Use existing four-digit numbering and `BEGIN`/`COMMIT`. Create the nine Phase 2 tables with explicit foreign keys, checks, timestamps, and indexes. Key rules:

```sql
CREATE UNIQUE INDEX flat_catalog_publications_current_channel_idx
    ON flat_catalog_publications (channel)
    WHERE superseded_at IS NULL;

ALTER TABLE flat_projects
    ADD COLUMN review_status text NOT NULL DEFAULT 'REVIEW_REQUIRED',
    ADD COLUMN identity_status text NOT NULL DEFAULT 'UNRESOLVED',
    ADD COLUMN project_status text NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN catalog_status text NOT NULL DEFAULT 'QUARANTINED',
    ADD COLUMN current_review_id uuid;

INSERT INTO flat_project_registrations (
    id, canonical_project_id, authority_code, source_registration_number,
    normalized_rera_number, registration_name
)
SELECT rera.id, rera.project_id, rera.authority_code, rera.registration_number,
       rera.normalized_registration_number, project.canonical_name
FROM flat_rera_references rera
JOIN flat_projects project ON project.id = rera.project_id;
```

Backfill existing supported identities to `RESOLVED + SEARCHABLE + REVIEW_REQUIRED`. Do not mark them newly `SUPPORTED` until review-version reconciliation in Phase 4.

Create a deferred project-review constraint trigger that rejects `review_status='SUPPORTED'` unless `current_review_id` belongs to the same project and is unexpired. Historical review rows must reject update and delete.

- [ ] **Step 2: Create the complete down migration**

Drop Phase 2 triggers/functions, remove the five new `flat_projects` columns, and drop the nine Phase 2 tables in reverse dependency order. Do not touch the original seven tables or their rows.

- [ ] **Step 3: Verify migration contracts**

Run the focused migration tests. Expected: all pass.

- [ ] **Step 4: Run migration validation checks**

Verify foreign-key targets, defaults on new non-null columns, rollback symmetry, destructive-operation scope, naming, and idempotent apply/down/reapply behavior on `FLATDNA_TEST_DATABASE_URL` when configured. If the disposable URL is absent, record the integration tests as skipped rather than using production.

## Task 4: Teach the guarded database operator the ordered migration chain

**Files:**
- Modify: `backend/scripts/propertydna_db.py`
- Modify: `backend/tests/test_propertydna_db_operator.py`

- [ ] **Step 1: Write failing operator tests**

Assert the operator discovers `0001` then `0002`, plans both in order, and never references a down migration. Existing safe confirmation, read-only inspection, and secret-redaction behavior must remain unchanged.

- [ ] **Step 2: Verify RED**

```powershell
uv --directory backend run --with-requirements requirements.txt python -m unittest tests.test_propertydna_db_operator -v
```

Expected: ordered-chain assertion fails because the operator currently stores one `UP_MIGRATION`.

- [ ] **Step 3: Implement the minimal migration chain**

Replace the singleton with an immutable ordered tuple:

```python
UP_MIGRATIONS = tuple(sorted((BACKEND_ROOT / "migrations").glob("*.up.sql")))
```

Inspection and migration planning must parse all up migrations in order. Applying remains one guarded operator action and never loads down migrations.

- [ ] **Step 4: Verify GREEN**

Run the operator tests and the original migration-contract tests. Expected: all pass.

## Task 5: Verify Phase 2 and record its receipt

**Files:**
- Modify: `docs/superpowers/specs/2026-08-19-flatdna-hyderabad-catalog-design.md`

- [ ] **Step 1: Run complete verification**

```powershell
uv --directory backend run --with-requirements requirements.txt python -m unittest discover -s tests
git diff --check
```

Also run apply/down/reapply against `FLATDNA_TEST_DATABASE_URL` if configured. Never substitute production.

- [ ] **Step 2: Add the Phase 2 receipt**

Record created schema boundaries, registration UUID backfill, independent status defaults, tests and skips, and confirmation that no catalog publication or production database mutation occurred.

- [ ] **Step 3: Request independent review**

The reviewer must check migration safety, status constraints, review drift prevention, backfill identity preservation, and ordered operator behavior. Fix every Critical or Important issue.

- [ ] **Step 4: Commit and push Phase 2**

```powershell
git add backend/migrations/0002_flatdna_catalog.up.sql backend/migrations/0002_flatdna_catalog.down.sql backend/app/services/flatdna/catalog_models.py backend/tests/test_flatdna_catalog_models.py backend/tests/test_flatdna_catalog_migration_contract.py backend/scripts/propertydna_db.py backend/tests/test_propertydna_db_operator.py docs/superpowers/plans/2026-08-19-flatdna-catalog-phase-2-persistence.md docs/superpowers/specs/2026-08-19-flatdna-hyderabad-catalog-design.md
git commit -m "feat: add FlatDNA catalog persistence foundation" -m "Constraint: New catalog data remains unpublished until Phase 4 validation and atomic promotion." -m "Confidence: High" -m "Tested: Full backend suite, migration contracts, operator safety tests, and disposable PostgreSQL checks when configured."
git push origin HEAD
```

## Phase 2 Completion Boundary

Phase 2 is complete when additive schema contracts, domain invariants, registration UUID preservation, ordered migration tooling, rollback definitions, tests, review, design receipt, commit, and push are complete. It does not acquire TG-RERA data or publish a customer catalog.
