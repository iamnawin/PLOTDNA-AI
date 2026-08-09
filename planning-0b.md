# FlatDNA Phase 0 — Batch 0B Implementation Plan

Status: ACCEPTED
Scope: minimum durable domain schema and persistence boundary only
Last updated: 2026-08-09

## Acceptance receipt — 2026-08-09

- Disposable Neon PostgreSQL 18.4 was confirmed isolated with zero existing
  non-system tables, FlatDNA acceptance schemas, or FlatDNA functions.
- All nine PostgreSQL integration tests executed without skips and passed twice from
  clean temporary schemas.
- Up migration, exactly seven empty tables, explicit UUID preservation, FK/CHECK/
  alias/RERA constraints, supported-project evidence triggers, down migration,
  complete cleanup, and clean reapplication passed against real PostgreSQL.
- Three integration tests were corrected only to wrap the constraint-violating
  `INSERT` inside their existing `IntegrityError` assertion. PostgreSQL raises the
  tested non-deferrable FK/UNIQUE errors at statement execution rather than waiting
  for `COMMIT`; no schema, migration, repository, or constraint behavior changed.
- Focused Batch 0B tests passed 19/19; Batch 0A backend tests passed 4/4; the complete
  backend suite passed 103/103 with all PostgreSQL tests executing.
- All planned frontend/PlotDNA smoke checks, build, lint, Render dependency
  resolution, lazy app import without `DATABASE_URL`, and `git diff --check` passed.
- Final disposable-target cleanup left zero user tables, zero acceptance schemas, and
  zero FlatDNA functions. Batch 0C had not started at acceptance.

## Batch 0B goal

Create the smallest durable Postgres/Supabase-backed FlatDNA identity schema and repository boundary needed by Batch 0C's curated Hyderabad registry and Batch 0D's deterministic resolver, while preserving every approved Batch 0A guarantee.

Batch 0B creates empty schema, domain contracts, validation rules, repository infrastructure, migrations, and tests. It does not create registry records, resolver logic, project APIs, or public UI.

## 1. Current persistence findings

### Production-oriented direction

- `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_KEY` already exist in the shared settings object (`backend/app/core/config.py:60-63`) and root example environment (`.env.example:43-46`). No new datastore setting is needed.
- The full backend dependency set already pins SQLAlchemy and PostgreSQL support (`backend/requirements.txt:11-14`). This is the correct base for a dedicated FlatDNA Postgres repository.
- The existing `supabase_writer.py` is not a general repository. It lazily creates a Supabase client and performs two narrow, non-fatal writes for brochure extractions and Phase 2 area scores (`backend/app/services/supabase_writer.py:1-4,12-84`). Batch 0B must not extend it into the FlatDNA domain layer.
- The Render dependency set explicitly excludes `psycopg2` and currently omits SQLAlchemy (`backend/requirements-render.txt:1-3`). Batch 0B must add the exact versions already pinned in the full requirements so the new persistence layer can run in the production image when later consumed.
- There is no committed migration framework or migration history. Adding Alembic for one additive migration would create unnecessary infrastructure. Use reviewed SQL up/down migrations with documented application and verification commands.

### Legacy/local-only stores that remain untouched

- Auth, OTP, entitlements, user events, and payment identity use a local SQLite database (`backend/app/services/entitlements_store.py:16-34,80-181`). This store is explicitly local-first and is not suitable for FlatDNA registry data.
- Analytics events append to JSONL (`backend/app/services/analytics_events.py:47-69`).
- Custom-report leads append to JSONL (`backend/app/services/custom_report_leads.py:189-220`).
- Existing brochure persistence is optional, fire-and-forget Supabase writing (`backend/app/api/routes/brochure.py:1-15,105-112`).
- Batch 0B must not migrate, mirror, rewrite, or couple FlatDNA to any of these stores.

### Existing identity conventions to reuse

- City and locality identities are stable lowercase slugs. `market_catalog.py` models `CityCatalogMeta.slug` and `MarketArea.slug`, loads `data/catalog/{city}.json`, and resolves an area by lowercase slug (`backend/app/services/market_catalog.py:58-69,92-123`).
- All ten planned Hyderabad launch locality slugs exist exactly once in `data/catalog/hyderabad.json`: `financial-district`, `kokapet`, `narsingi`, `puppalaguda`, `tellapur`, `nallagandla`, `gachibowli`, `kondapur`, `miyapur`, and `bachupally`.
- There is no relational locality table to reference with a database foreign key. Batch 0B therefore validates `city_slug`/`locality_slug` against the existing catalog in application validation; it does not duplicate locality rows or polygons.

### Batch 0A boundary that must remain unchanged

- `ENABLE_FLAT_DNA` defaults false (`backend/app/core/config.py:18-23`).
- The router-level dependency returns 404 while disabled and `/api/v1/flat/status` remains the only FlatDNA endpoint (`backend/app/api/routes/flat.py:6-16`).
- Existing tests prove default OFF, authoritative backend gating, the empty enabled response, and unchanged root/health behavior (`backend/tests/test_flatdna_phase_0a.py:19-70`).
- The frontend no-public-surface test covers App, Landing, Home, and the current Plot route inventory (`frontend/scripts/check-flatdna-phase-0a.mjs:9-53`).

## 2. Proposed minimum schema

Create exactly **seven** additive `flat_*` tables:

1. `flat_developers`
2. `flat_developer_aliases`
3. `flat_projects`
4. `flat_project_aliases`
5. `flat_rera_references`
6. `flat_evidence_sources`
7. `flat_claim_evidence`

### Refinement from the Phase 0 master plan

- Do not create `flat_project_locations`. Phase 0 has one canonical locality and one optional canonical point per project, so `city_slug`, `locality_slug`, coordinates, and precision belong on `flat_projects`.
- Add `flat_developer_aliases`. The approved resolver note requires developer aliases to remain separate from project aliases, and Batch 0D needs them for developer-context disambiguation.
- Defer `flat_towers` and `flat_unit_configurations` entirely. Neither is required by Batch 0C's curated project registry or Batch 0D's project resolver. Do not create placeholder tables, fields, models, repository methods, or tests for them in Batch 0B.

### Shared column rules

- All identity records use PostgreSQL `uuid` primary keys supplied explicitly by reviewed seed/import data. Do not derive IDs from names and do not use database-generated serial IDs.
- Canonical/alias tables use `created_at timestamptz NOT NULL DEFAULT now()` and `updated_at timestamptz NOT NULL DEFAULT now()`. Repository writes explicitly update `updated_at`; no global trigger framework is added.
- Small lifecycle vocabularies use `text` plus named `CHECK` constraints rather than PostgreSQL enum types, keeping future additive vocabulary changes and rollback simpler.
- All foreign keys use `ON DELETE RESTRICT`. Registry history is inactivated, not cascade-deleted.

## 3. Entity relationships

```text
flat_developers
  ├── flat_developer_aliases
  └── flat_projects
        ├── flat_project_aliases
        └── flat_rera_references

flat_evidence_sources
  └── flat_claim_evidence
        └── exactly one canonical subject:
            developer | developer alias | project | project alias |
            RERA reference
```

`flat_claim_evidence` uses nullable foreign-key columns for each supported subject type plus `CHECK (num_nonnulls(...) = 1)`. This is more explicit than an unenforced `entity_type/entity_id` pair and lets Postgres reject invalid subject references.

## 4. Fields for each entity

### `flat_developers`

- `id uuid PRIMARY KEY`
- `canonical_name text NOT NULL`
- `normalized_name text NOT NULL`
- `registry_status text NOT NULL DEFAULT 'DRAFT'`
- `created_at`, `updated_at`

`registry_status`: `DRAFT`, `REVIEW_REQUIRED`, `SUPPORTED`, `UNSUPPORTED`, `INACTIVE`.

Intentional omissions: website, corporate hierarchy, ratings, complaints, financials, and generic metadata. A developer URL belongs in evidence, not on the canonical identity row.

### `flat_developer_aliases`

- `id uuid PRIMARY KEY`
- `developer_id uuid NOT NULL REFERENCES flat_developers(id)`
- `alias text NOT NULL`
- `normalized_alias text NOT NULL`
- `alias_type text NOT NULL`
- `active boolean NOT NULL DEFAULT true`
- `created_at`, `updated_at`

`alias_type`: `LEGAL_NAME`, `MARKETING`, `ABBREVIATION`, `FORMER_NAME`, `COMMON_USAGE`.

### `flat_projects`

- `id uuid PRIMARY KEY`
- `developer_id uuid NOT NULL REFERENCES flat_developers(id)`
- `canonical_name text NOT NULL`
- `normalized_name text NOT NULL`
- `city_slug text NOT NULL`
- `locality_slug text NOT NULL`
- `latitude numeric(9,6) NULL`
- `longitude numeric(10,6) NULL`
- `location_precision text NOT NULL DEFAULT 'UNKNOWN'`
- `registry_status text NOT NULL DEFAULT 'DRAFT'`
- `created_at`, `updated_at`

`location_precision`: `ENTRANCE`, `PROJECT_CENTROID`, `APPROXIMATE`, `UNKNOWN`.
`registry_status`: `DRAFT`, `REVIEW_REQUIRED`, `SUPPORTED`, `UNSUPPORTED`, `INACTIVE`.

Latitude and longitude must either both be null or both be present. Present coordinates must satisfy latitude `-90..90` and longitude `-180..180`. Batch 0C validation requires non-null coordinates and non-`UNKNOWN` precision before a project can become `SUPPORTED`.

Intentional omissions: boundary polygons, addresses, amenities, scores, prices, market evidence, valuation fields, and JSON catch-all metadata.

### `flat_project_aliases`

- `id uuid PRIMARY KEY`
- `project_id uuid NOT NULL REFERENCES flat_projects(id)`
- `alias text NOT NULL`
- `normalized_alias text NOT NULL`
- `alias_type text NOT NULL`
- `active boolean NOT NULL DEFAULT true`
- `created_at`, `updated_at`

`alias_type`: `MARKETING`, `ABBREVIATION`, `FORMER_NAME`, `COMMON_USAGE`, `PHASE_NAME`.

### `flat_rera_references`

- `id uuid PRIMARY KEY`
- `project_id uuid NOT NULL REFERENCES flat_projects(id)`
- `authority text NOT NULL`
- `registration_number text NOT NULL`
- `normalized_registration_number text NOT NULL`
- `reference_status text NOT NULL DEFAULT 'RECORDED'`
- `created_at`, `updated_at`

`reference_status`: `RECORDED`, `VERIFIED`, `REVIEW_REQUIRED`, `SUPERSEDED`.

This is a reference record, not proof that live RERA verification succeeded. A project may have more than one registration reference, and RERA is optional in Phase 0 when its absence is explicitly review-tracked.

### Deferred entities

`flat_towers` and `flat_unit_configurations` move to Phase 1 or the first unit/valuation batch. Project identity resolution does not consume them, and the curated 21-project registry does not require them.

### `flat_evidence_sources`

- `id uuid PRIMARY KEY`
- `source_class text NOT NULL`
- `data_origin text NOT NULL`
- `publisher text NOT NULL`
- `title text NULL`
- `source_ref text NOT NULL`
- `url text NULL`
- `retrieved_at timestamptz NOT NULL`
- `content_hash text NULL`
- `source_status text NOT NULL DEFAULT 'ACTIVE'`
- `created_at`, `updated_at`

Phase 0 identity source classes: `OFFICIAL_PROJECT`, `OFFICIAL_REGULATOR`, `BUILDER_PUBLISHED`, `CURATED_REFERENCE`.

`source_status`: `ACTIVE`, `INVALID`, `SUPERSEDED`.

The production table accepts only `REAL` and `CURATED` data origins. `TEST` and `SYNTHETIC` remain valid input-classification values in test/import contracts so they can be identified and rejected, but they are not persistable production origins.

### `flat_claim_evidence`

- `id uuid PRIMARY KEY`
- `evidence_source_id uuid NOT NULL REFERENCES flat_evidence_sources(id)`
- exactly one nullable subject FK: `developer_id`, `developer_alias_id`, `project_id`, `project_alias_id`, or `rera_reference_id`
- `claim_key text NOT NULL`
- `observed_value text NOT NULL`
- `review_status text NOT NULL DEFAULT 'PENDING'`
- `reviewed_by text NULL`
- `reviewed_at timestamptz NULL`
- `notes text NULL`
- `fingerprint char(64) NOT NULL UNIQUE`
- `created_at`, `updated_at`

`review_status`: `PENDING`, `APPROVED`, `REJECTED`.

Approved or rejected claims require both `reviewed_by` and `reviewed_at`. The fingerprint is a deterministic SHA-256 over subject type, subject ID, claim key, normalized observed value, and source ID. Binding the observed value prevents stale evidence from silently supporting a corrected canonical value.

## 5. Stable ID strategy

- Use explicit UUIDv4 identifiers stored in reviewed registry artifacts and reused unchanged across environments.
- Do not add `DEFAULT gen_random_uuid()` to canonical identity tables. Database-generated IDs would make the same curated project differ between local, staging, and production imports.
- Project IDs survive canonical-name, alias, status, locality-label, and coordinate corrections.
- Import/upsert matches by immutable UUID. If an existing UUID is presented for a different entity relationship, the repository rejects the write rather than reassigning the ID.
- Alias, evidence, developer, and RERA IDs follow the same explicit UUID rule so evidence links remain stable.
- Human-readable names and slugs are searchable attributes, never primary keys.

## 6. Uniqueness and integrity constraints

### Database constraints/indexes

- Developer normalized names receive a non-unique lookup index. Global uniqueness is unsafe for distinct legal entities that normalize to the same text; curated-bundle validation flags accidental duplicates for review.
- Developer alias duplicate prevention: unique `(developer_id, normalized_alias)`; non-unique index on `normalized_alias` for future matching.
- Project names are not globally unique. Add search indexes on `normalized_name`, `developer_id`, and `(city_slug, locality_slug)`.
- Add a partial unique index on `(developer_id, city_slug, locality_slug, normalized_name)` only where `registry_status = 'SUPPORTED'`. A legitimate phase must have a phase-distinguishing canonical name or remain review-required; duplicate names in other localities remain allowed.
- Project alias duplicate prevention: unique `(project_id, normalized_alias)`; `normalized_alias` remains non-unique across projects so ambiguity can be represented.
- RERA uniqueness: unique `(authority, normalized_registration_number)` across active/reference history; multiple distinct RERA references per project are allowed.
- Evidence source retrieval duplicates: unique `(source_class, source_ref, retrieved_at)`.
- Claim evidence: unique `fingerprint`, exactly one subject FK, valid FK targets, observed value, and review-metadata check.
- Named checks cover non-empty trimmed names, lowercase/non-empty normalized fields, registry/status vocabularies, coordinate pairing/ranges, source lifecycle, and accepted provenance origins.

### Supported-project promotion guard

Add a narrow deferred PostgreSQL constraint mechanism scoped to `flat_projects.registry_status = 'SUPPORTED'`. At transaction commit it requires approved evidence from active accepted-origin sources whose observed values still match these core project claims:

- `identity.canonical_name`
- `identity.developer`
- `identity.locality`
- `identity.coordinates`

The same invariant is rechecked when a supporting claim is rejected/deleted or its source becomes invalid/superseded. A transaction succeeds only when replacement evidence exists or the project is demoted in that transaction. This permits a registry import to insert project and evidence rows atomically without turning triggers into a general business-rules engine.

The migration defines the trigger/function locally with `flat_*` names. No shared database trigger framework is introduced.

## 7. Provenance and synthetic-data protection

Protection is layered:

1. Input classification: domain contracts recognize `REAL`, `CURATED`, `TEST`, and `SYNTHETIC` so unsafe provenance cannot be hidden as an untyped string.
2. Validation: `registry_validation.py` rejects `TEST`/`SYNTHETIC`, missing origin, missing source reference, unreviewed core identity claims, and source markers including `tsrera_scraper.py` and `data/tsrera_projects.json`.
3. Repository boundary: `upsert_registry()` accepts only a fully validated bundle and refuses writes when validation findings exist.
4. Database constraint: `flat_evidence_sources.data_origin` permits only `REAL` and `CURATED`.
5. Supported-project constraint triggers: promotion and later evidence invalidation both recheck the four core identity claims.
6. Tests: direct SQL and repository tests prove synthetic/test evidence and synthetic-only project promotion fail.

`backend/app/services/tsrera_scraper.py` remains untouched. Test/fixture records stay in Python test data or future reviewed fixture files and never enter production registry tables.

## 8. Migration strategy

Create:

- `backend/migrations/0001_flatdna_registry.up.sql`
- `backend/migrations/0001_flatdna_registry.down.sql`
- `backend/migrations/README.md`

Up migration rules:

- Transaction-wrapped and additive only.
- Create only the seven `flat_*` tables, their indexes, the supported-project constraint function/triggers, and no shared objects.
- Do not alter, rename, read, backfill, or lock existing PlotDNA tables.
- Do not insert seed rows.
- Do not use `IF NOT EXISTS`; a second application must fail loudly instead of silently accepting schema drift.

Down migration rules:

- Transaction-wrapped.
- Drop only the FlatDNA triggers/function and seven tables in reverse foreign-key order.
- Run only after `ENABLE_FLAT_DNA=false`, a schema/data export, and confirmation that no later FlatDNA migration depends on it.

Application path:

1. Keep both FlatDNA flags OFF.
2. Apply and roll back in an isolated schema on a disposable Postgres/Supabase branch using `FLATDNA_TEST_DATABASE_URL`.
3. Reapply up migration, run verification queries and integration tests, and confirm all tables are empty.
4. Apply to the target Supabase/Postgres environment using migration credentials through Supabase SQL Editor or `psql` as documented.
5. Do not connect from app startup. The repository creates an engine only when explicitly requested by future FlatDNA code or tooling.

No `DATABASE_URL` value is required for normal PlotDNA startup or Batch 0A status behavior. Empty FlatDNA tables are a valid steady state.

## 9. Repository and data-access design

Use a focused package under the established service layer:

```text
backend/app/services/flatdna/
  __init__.py
  models.py
  database.py
  repository.py
  registry_validation.py
```

### `models.py`

- Pydantic contracts for the seven table records and a `RegistryBundle` transaction payload.
- `Literal`/enum vocabularies for registry lifecycle, RERA status, location precision, alias type, source class, data origin, source lifecycle, and review state.
- Deterministic normalization helpers used by validation and later reused by Batch 0D; Batch 0B does not implement fuzzy or resolver behavior.
- UUIDs are required inputs.

### `database.py`

- `create_flatdna_engine(database_url: str | None = None)` using SQLAlchemy.
- Read `settings.DATABASE_URL` only when called.
- Raise a FlatDNA-specific configuration error if called without a URL.
- Do not create an engine, connect, migrate, or inspect schema at module import or FastAPI startup.
- No session/ORM framework: repository methods use SQLAlchemy Core connections and explicit transactions.

### `repository.py`

Define a small `FlatProjectRepository` protocol and `PostgresFlatProjectRepository` implementation with only immediate 0C/0D needs:

- `get_supported_project(project_id)`
- `list_supported_projects(city_slug)`
- `upsert_registry(bundle)`

Repository rules:

- All SQL stays in this module, not API routes.
- Reads return only `SUPPORTED` projects and active aliases/references unless an explicit internal review method is later added.
- `upsert_registry` validates first, writes all records in one transaction, upserts by explicit UUID, rejects UUID reassignment, and never deletes missing rows.
- No API route imports or calls the repository in Batch 0B.
- A small in-memory fake may live in tests only; no SQLite implementation is created.

### `registry_validation.py`

- Validate UUID uniqueness and referential relationships inside a bundle.
- Validate known city/locality slugs through the existing catalog loader.
- Validate normalized fields, duplicate aliases, RERA identity, coordinate pairing, evidence links, observed values, review metadata, and provenance.
- Enforce supported-project core evidence and synthetic/test rejection before repository writes.
- Return structured findings; the repository raises on any error-level finding.
- Do not create CLI import or curated registry files until Batch 0C.

## 10. Test plan

### Domain/validation tests — `backend/tests/test_flatdna_domain.py`

- Missing, malformed, or implicit IDs fail validation.
- Changing display names does not change an explicit project UUID.
- Invalid project/developer/alias/RERA references fail bundle validation.
- Duplicate normalized aliases within one entity fail; identical aliases across different projects remain representable.
- Invalid coordinate pairs/ranges, statuses, RERA states, and area ranges fail.
- Existing Hyderabad locality slugs pass; unknown slugs fail.
- Supported project without all four core approved identity claims fails.
- `TEST`, `SYNTHETIC`, `tsrera_scraper.py`, and `data/tsrera_projects.json` provenance fail.
- `REAL`/`CURATED` reviewed provenance passes.

### Repository tests — `backend/tests/test_flatdna_repository.py`

- Importing `database.py` or constructing the FastAPI app does not open a database connection.
- Missing `DATABASE_URL` fails only when an engine/repository connection is explicitly requested.
- Repository queries filter to `SUPPORTED`, active records.
- Upsert uses one transaction, preserves UUIDs, rejects ID reassignment, and performs no delete.
- SQL remains confined to the repository and migration files.

### Migration contract tests — `backend/tests/test_flatdna_migration_contract.py`

- Up/down files are transaction-wrapped.
- Exactly seven expected `flat_*` tables are created and reversed.
- No existing table is altered/dropped/renamed.
- Required PKs, FKs, checks, partial uniqueness, indexes, origin restrictions, and supported-project trigger are present.
- Up migration contains no seed `INSERT`.
- Down migration drops only FlatDNA objects in valid reverse order.

### Disposable Postgres integration — `backend/tests/test_flatdna_postgres_integration.py`

Run against `FLATDNA_TEST_DATABASE_URL` in a unique temporary schema. Batch acceptance requires this suite to execute, not skip.

- Apply up migration cleanly and verify all seven tables exist empty.
- Duplicate aliases and RERA identifiers are rejected.
- Broken developer/project/alias/RERA/evidence FKs are rejected.
- Synthetic/test evidence origins are rejected by Postgres.
- Supported project without approved core evidence fails at commit.
- A minimal valid reviewed project transaction commits and retains its explicit UUID.
- Down migration removes only created FlatDNA objects.

### Batch 0A and PlotDNA regression

- Run `backend/tests/test_flatdna_phase_0a.py` unchanged.
- Run the full backend suite.
- Run `pnpm --dir frontend run test:flatdna-phase-0a`.
- Run the existing area-story, home-nav, Hyderabad search/production, OTP, and verdict checks from `planning.md`.
- Run frontend build and lint.
- Confirm `/api/v1/flat/status` remains the sole FlatDNA endpoint.

## 11. Exact file-level change plan

### Modify during Batch 0B implementation

| File | Change |
| --- | --- |
| `backend/requirements-render.txt` | Add the exact existing pins `sqlalchemy==2.0.36` and `psycopg2-binary==2.9.10`. No other dependency changes. |

No changes are planned for `backend/app/core/config.py`, `.env.example`, `render.yaml`, `backend/app/main.py`, `backend/app/api/routes/flat.py`, or any frontend application file. `DATABASE_URL` and the authoritative flags already exist.

### Create during Batch 0B implementation

| File | Responsibility |
| --- | --- |
| `backend/migrations/README.md` | Apply, verify, isolated-test, and rollback procedure. |
| `backend/migrations/0001_flatdna_registry.up.sql` | Additive seven-table schema, constraints, indexes, promotion/invalidation guard. |
| `backend/migrations/0001_flatdna_registry.down.sql` | Reverse only migration 0001 FlatDNA objects. |
| `backend/app/services/flatdna/__init__.py` | Package boundary only. |
| `backend/app/services/flatdna/models.py` | Minimum domain and registry bundle contracts. |
| `backend/app/services/flatdna/database.py` | Lazy SQLAlchemy engine creation. |
| `backend/app/services/flatdna/repository.py` | Protocol plus Postgres read/upsert implementation. |
| `backend/app/services/flatdna/registry_validation.py` | Referential, provenance, lifecycle, locality, and synthetic safeguards. |
| `backend/tests/test_flatdna_domain.py` | Model and registry-validation tests. |
| `backend/tests/test_flatdna_repository.py` | Lazy connection and repository behavior tests. |
| `backend/tests/test_flatdna_migration_contract.py` | Static migration safety/shape tests. |
| `backend/tests/test_flatdna_postgres_integration.py` | Real disposable-Postgres constraint and rollback tests. |

### Obsidian updates after verified implementation

- `FlatDNA-Data-Evidence-Model.md`: record the accepted seven-table identity/evidence subset, deferred tower/unit entities, and origin restrictions.
- `FlatDNA-Architecture.md`: record the lazy SQLAlchemy repository boundary and unchanged Flat route surface.
- `FlatDNA-Rollout.md`: mark 0B accepted only after migration rollback and regressions pass.
- `FlatDNA-Overview.md`: state that schema exists empty while registry/resolver/UI remain unimplemented.

Do not update these notes from planned to current until implementation and verification are complete.

### Explicitly untouched

- `frontend/src/App.tsx`, Landing, Home, store, all land/area-story/search/map files.
- `backend/app/api/routes/flat.py` and `/api/v1/flat/status` contract.
- Auth, entitlement, payment, analytics, scoring, verdict, AVM, RERA, brochure, and locality resolver implementations.
- `backend/app/services/supabase_writer.py`, `entitlements_store.py`, SQLite files, JSONL files.
- `backend/app/services/tsrera_scraper.py` and `data/tsrera_projects.json`.
- All curated FlatDNA registry/seed/resolver fixture files; those begin in 0C/0D.

## 12. Risks and rollback

| Risk | Impact | Mitigation | Rollback |
| --- | --- | --- | --- |
| First migration convention in repository | Inconsistent or partially applied schema | Explicit up/down SQL, transactions, README, contract test, disposable Postgres proof | Keep flag OFF; run reviewed down migration only after export |
| Deferred promotion trigger is incorrect | Valid imports fail or unsupported records pass | Limit trigger to four core claims; test valid and invalid commits on Postgres | Revert migration before any 0C data exists |
| JSON locality cannot have DB FK | Invalid locality slug could enter by direct SQL | Validator uses existing catalog; supported import must go through repository | Mark row review-required; correct before support |
| Polymorphic evidence loses FK integrity | Anonymous/broken claims | Exactly-one-subject nullable FKs with `num_nonnulls` check | Migration rollback drops only empty Flat tables |
| UUIDs accidentally regenerated | Resolver IDs change across environments | Explicit UUIDs, no DB default, reassignment rejection tests | Reject import; retain existing ID |
| Unsafe project-name uniqueness | Legitimate same-name phases collapse | No global name unique; supported composite partial unique; ambiguity allowed across projects/localities | Change only Flat index in follow-up migration |
| Synthetic provenance disguised as curated | Canonical trust failure | Typed origin, banned markers, repository validation, DB origin check, supported evidence trigger | Reject whole transaction; no quarantine into registry |
| Production image lacks DB dependencies | Later Flat route fails at runtime | Add existing pinned SQLAlchemy/psycopg2 versions to Render requirements; build with flag OFF | Revert two dependency lines |
| Eager DB initialization | Existing PlotDNA startup breaks without DB | Lazy engine factory, no route usage in 0B, startup regression tests | Disable flag and revert package imports |
| Destructive down migration after later batches | Data loss | Down allowed only before dependent migrations or after export and explicit review | Prefer operational flag-off rollback once 0C data exists |

Current implementation blocker: Batch 0B cannot be accepted without a disposable Postgres/Supabase branch connection for the real integration and rollback suite. This does not block completing the plan, writing unit/contract tests, or creating the migration; it is an implementation acceptance dependency.

## 13. Explicit non-goals

Batch 0B must not include:

- curated Hyderabad registry records or the 21-project seed;
- registry JSON schema/files or import/review CLI;
- exact, alias, fuzzy, locality, developer, or RERA resolver logic;
- project search/detail routes or any endpoint beyond the existing status route;
- Project DNA, market observations, user quotes, comparables, valuation, confidence bands, or verdicts;
- public FlatDNA UI, homepage selector, navigation, routes, or frontend API client;
- RERA scraping/integration or changes to `tsrera_scraper.py`;
- amenities, parking, floors, views, premiums, inventory, maintenance, complaints, litigation, ratings, price/rent history, or generic JSON metadata;
- PropertyDNA rename, House/Villa, Commercial, or geographic rollout;
- conversion of existing SQLite/JSONL/Supabase persistence;
- Alembic, a second database, Redis/search/vector infrastructure, or a new generic property framework.

## 14. Recommended Batch 0B implementation sequence

### 0B.1 — Migration and domain vocabulary

- Add the up/down migrations, README, Pydantic domain contracts, and migration contract tests.
- Verify seven tables only, additive SQL, no seed data, no existing-table statements.

Review gate: contract tests pass and the schema matches sections 2–7.

### 0B.2 — Validation and synthetic isolation

- Implement bundle validation, locality lookup, UUID/reference checks, supported evidence rules, and unsafe provenance rejection.
- Add domain/validation tests first.

Review gate: every required invalid case fails deterministically; accepted real/curated case passes.

### 0B.3 — Lazy repository boundary

- Implement lazy engine creation, repository protocol, supported-only reads, and transactional validated upsert.
- Add repository tests; do not wire it into the Flat status route.

Review gate: app import/status requires no database, no SQL appears in API routes, and repository performs no deletes.

### 0B.4 — Disposable Postgres proof

- Apply migration in an isolated schema, execute constraint/repository cases, run down migration, and prove cleanup.
- Reapply up migration only in the intended target after review; leave all tables empty.

Review gate: integration suite executes without skips and rollback removes only FlatDNA objects.

### 0B.5 — Regression and documentation receipt

- Run all Batch 0A and PlotDNA regression checks, full backend suite, frontend build/lint, Render dependency build, and diff audit.
- Update Obsidian notes with verified actuals only.
- Keep production flags false and stop.

Review gate: PlotDNA behavior is unchanged, `/api/v1/flat/status` is the only Flat endpoint, registry row count is zero, and Batch 0C has not started.

## Batch 0B acceptance criteria

1. Up migration creates exactly seven `flat_*` tables and no rows; down migration removes only those objects.
2. Up/down execute successfully in an isolated disposable Postgres schema.
3. Existing PlotDNA tables, SQLite, JSONL, Supabase writer, routes, and UI are untouched.
4. Missing `DATABASE_URL` does not affect FastAPI startup, `/`, `/health`, or `/api/v1/flat/status` gating.
5. Stable explicit UUID project identities survive name changes and repository upserts.
6. Project and developer aliases reference valid canonical entities and prevent within-entity normalized duplicates.
7. Similar project names and cross-project alias collisions remain representable.
8. Invalid developer/project/alias/RERA/evidence references are rejected.
9. RERA authority/registration duplicates are rejected without treating recorded text as live verification.
10. A supported project cannot commit without approved accepted-origin evidence for canonical name, developer, locality, and coordinates.
11. `TEST`, `SYNTHETIC`, `tsrera_scraper.py`, and `data/tsrera_projects.json` cannot enter production evidence or support a canonical project.
12. Repository reads return only supported, active canonical registry records.
13. Empty FlatDNA tables cause no PlotDNA startup/runtime dependency.
14. Batch 0A focused tests and all listed PlotDNA regressions remain green without weakening assertions.
15. No project registry seed, resolver, new endpoint, public UI, valuation, comparable, or verdict exists.

## Stop condition

Stop after the Batch 0B plan. Do not create migrations, models, repositories, tests, seed data, or application code until Naveen separately approves Batch 0B implementation.
