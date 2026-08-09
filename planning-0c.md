# FlatDNA Phase 0 — Batch 0C Implementation Plan

Status: BATCH 0C ACCEPTED
Scope: curated 14-project Hyderabad identity registry and internal review/import tooling
Last updated: 2026-08-09
Depends on: accepted Batch 0A and accepted Batch 0B

## 1. Batch 0C goal

Create a reproducible, human-reviewed registry bundle containing exactly 14 real
Hyderabad apartment projects. Every canonical project must retain a stable explicit
UUID, reference an existing PlotDNA locality slug, and have approved production-safe
evidence for canonical name, developer, locality, and coordinates.

Batch 0C ends with a validated fixture and a safe dry-run/apply import path. It does
not resolve user queries or expose project data through an API.

## 2. Accepted baseline and source of truth

Batch 0C must extend, not redesign, the accepted Batch 0B boundary:

- `RegistryBundle` already defines the seven fixture lists
  (`backend/app/services/flatdna/models.py:203-210`).
- All models reject unknown fields (`models.py:15-16`) and require explicit UUIDs
  (`models.py:85-172`).
- Project location stays on `ProjectRecord`; there is no location table
  (`models.py:101-117`).
- The validator already checks normalization, references, locality slugs, provenance,
  fingerprints, aliases, RERA uniqueness, and supported-project core evidence
  (`backend/app/services/flatdna/registry_validation.py:38-163`).
- The repository validates before a single transaction, upserts by explicit UUID,
  checks immutable relationships, and performs no deletes
  (`backend/app/services/flatdna/repository.py:69-158`).
- The database permits only `REAL` and `CURATED` origins and protects supported core
  evidence with deferred triggers
  (`backend/migrations/0001_flatdna_registry.up.sql:146-177,233-367`).
- Batch 0B is accepted against PostgreSQL 18.4; no migration change is required.
- `/api/v1/flat/status` remains the only FlatDNA route
  (`backend/app/api/routes/flat.py:14-16`).

Repository code and `planning-0b.md` are authoritative if an older Obsidian proposal
still mentions nine tables, text IDs, towers, or unit configurations.

## 3. Exact in-scope work

1. Implement only the 14 projects approved as `INCLUDE` by
   `planning-0c-evidence-review.md`; keep its five DRAFT and two EXCLUDED candidates
   outside the supported import fixture.
2. Allocate explicit seed-controlled UUIDv4 IDs once for every developer, alias,
   project, RERA reference, evidence source, and claim.
3. Create one canonical JSON file that parses directly as the existing
   `RegistryBundle` contract.
4. Add a short curation README describing source policy, review steps, ID rules,
   correction policy, and import safety.
5. Add a shared registry loader that parses JSON without connecting to a database.
6. Extend validation only for Batch 0C dataset-level invariants that Batch 0B could
   not enforce for an empty generic bundle.
7. Add a read-only validator CLI with human and JSON report output.
8. Add a dry-run-by-default importer that uses the existing lazy engine and
   `PostgresFlatProjectRepository` only after validation passes.
9. Add fixture-integrity, CLI/importer, and disposable-PostgreSQL import tests.
10. Run Batch 0A/0B and PlotDNA regressions with both FlatDNA flags still off.

## 4. Exact non-goals

Batch 0C must not add or implement:

- deterministic exact, alias, fuzzy, locality, developer, or RERA resolution;
- `resolver-cases.json` or threshold tuning; those belong to Batch 0D;
- project search/detail/admin HTTP endpoints;
- any public FlatDNA frontend route, selector, navigation, or API call;
- towers, unit configurations, amenities, prices, listings, observations,
  comparables, valuation, confidence, Project DNA, or FlatDNA verdict;
- new tables, columns, indexes, triggers, migrations, or datastores;
- automated web scraping or live Telangana RERA integration;
- `tsrera_scraper.py`, `data/tsrera_projects.json`, randomized records, generated
  project facts, or synthetic aliases;
- broad Hyderabad scraping, Telangana-wide coverage, or a claim of exhaustive city
  coverage;
- production deployment, production import, or enabling either FlatDNA flag.

## 5. Registry file decision

Create one authoritative fixture:

```text
data/cities/hyderabad/flatdna/
  README.md
  registry.json
```

`registry.json` mirrors `RegistryBundle` exactly:

```text
developers
developer_aliases
projects
project_aliases
rera_references
evidence_sources
claim_evidence
```

Reasons for one bundle:

- it matches the accepted transaction payload without a second merge format;
- Pydantic is already the executable schema, so a hand-maintained
  `registry.schema.json` would be a second contract that can drift;
- cross-record UUID and evidence references can be reviewed in one file;
- the repository imports the same object the validator inspected.

Do not create separate evidence-source, ID-map, resolver-case, or review-state JSON
files in 0C. The validator may emit an ignored machine-readable report under
`.omx/artifacts/`; generated reports are not registry source data.

## 6. Approved 14-project supported registry

The final accepted fixture must contain exactly this distribution:

| Existing PlotDNA locality slug | Project count |
| --- | ---: |
| `financial-district` | 1 |
| `kokapet` | 3 |
| `narsingi` | 1 |
| `puppalaguda` | 1 |
| `tellapur` | 3 |
| `nallagandla` | 2 |
| `kondapur` | 1 |
| `bachupally` | 2 |
| **Total** | **14** |

All eight slugs already resolve through the existing catalog. Batch 0C must not
create new locality aliases or polygons. Gachibowli and Miyapur intentionally have
no supported launch project because their reviewed candidates did not pass the gate.

The approved supported roster is: Myscape Isle of Sky; My Home Nishada; Prestige
Beverly Hills; Rajapushpa Pristinia; Rajapushpa Provincia; EIPL Cornerstone; My Home
Tridasa; Aparna Newlands; Rajapushpa Imperia; Aparna Sarovar Zenith; Aparna Sarovar
Zicon; Aparna Luxor Park; On Cloud 33; and Ramky One Harmony.

`planning-0c-evidence-review.md` is the evidence-review source for canonical names,
developers, locality slugs, reviewed coordinates, RERA references, sources, and
approved aliases. The five DRAFT candidates (Myscape Songs of the Sun, Aparna Zenon,
My Home Vihanga, Prestige Ivy League, and Codename Sky Habitat) and two EXCLUDED
candidates (Prestige High Fields and NCC Urban One) must not enter the supported
fixture or import path.

Approved developer distribution:

| Canonical public developer | Supported projects |
| --- | ---: |
| Aparna Constructions | 4 |
| Rajapushpa Properties | 3 |
| My Home Constructions | 2 |
| Myscape Properties Private Limited | 1 |
| Prestige Group | 1 |
| EIPL Group | 1 |
| Urbanrise | 1 |
| Ramky Estates | 1 |
| **Total** | **14** |

## 7. Project selection and evidence gates

Every final project must satisfy all of these before receiving `SUPPORTED`:

1. It is a real apartment project, not a villa-only, plot, office, proposed unnamed,
   or marketing-partner invention.
2. An official developer project page or official developer brochure establishes the
   project name and developer relationship.
3. The reviewed project point is obtained from an official project location/map or a
   manually reviewed public map reference and is recorded as `ENTRANCE` or
   `PROJECT_CENTROID`, never `UNKNOWN` or `APPROXIMATE` for the launch 14.
4. The point/locality review agrees with an existing PlotDNA slug. “Near X” language
   is not sufficient; conflicts are resolved manually or the candidate is replaced.
5. At least one RERA reference is recorded from an official developer page/brochure
   and normalized through `normalize_reference`. Mark it `VERIFIED` only when an
   official Telangana RERA record has been reviewed; otherwise use `RECORDED`.
6. Each of the four required project identity claims has an active accepted-origin
   source and an `APPROVED` claim with reviewer and timezone-aware review timestamp.
7. The source URL/reference, publisher, retrieval timestamp, class, origin, and
   lifecycle are present. Use a SHA-256 content hash only when a lawful retained
   snapshot exists; never invent one.
8. Any active project or developer alias has its own approved `identity.alias` claim.
   Do not add guessed abbreviations or misspellings merely to improve resolver tests.
9. No candidate or source references `tsrera_scraper.py`,
   `data/tsrera_projects.json`, TEST, SYNTHETIC, randomized output, or fabricated
   placeholder values.

### Minimum registry composition

- exactly 14 `SUPPORTED` projects, all in city `hyderabad`;
- exactly the locality distribution in section 6;
- every referenced developer is `SUPPORTED` and has approved canonical-name evidence;
- every project has four approved core project claims and at least one reviewed RERA
  reference;
- aliases are limited to the useful, defensible variants approved by the evidence
  review; no minimum alias count is imposed;
- at least two developers occur in more than one locality, enabling later developer
  disambiguation tests without adding fake records;
- the final roster contains at least one organic similar-name pair, but no alias is
  manufactured solely to create ambiguity;
- zero towers and zero unit configurations because those entities do not exist in
  the accepted Phase 0 schema.

## 8. Source and provenance policy

Preferred order for identity claims:

1. `OFFICIAL_REGULATOR` — Telangana RERA or another official government record.
2. `OFFICIAL_PROJECT` — official project approval/occupancy document.
3. `BUILDER_PUBLISHED` — official developer project page or brochure.
4. `CURATED_REFERENCE` — manually reviewed public map/reference used only where the
   higher classes do not establish the exact point or a genuine public alias.

Rules:

- `REAL` is used for a source observation copied from an external real source.
- `CURATED` is used for a human-reviewed curation artifact or reconciliation record;
  it must still cite its underlying public reference.
- Marketing-partner microsites, property portals, social media, Reddit, and search
  snippets may help discovery but cannot independently support canonical identity.
- Listing price, inventory, possession promises, amenities, configuration, and
  valuation facts are outside 0C even when the source contains them.
- Retrieval and review timestamps are frozen facts; refreshing a source creates a new
  source UUID/snapshot rather than silently rewriting the old snapshot relationship.

## 9. Stable UUID procedure

1. After a candidate passes the identity/locality evidence review, generate UUIDv4
   values once using Python's standard-library `uuid.uuid4()` in a curator-controlled
   review session.
2. Paste those UUIDs into `registry.json` before claim fingerprints are generated.
3. Never generate UUIDs in the migration, loader, importer, repository, or on import.
4. Never derive UUIDs from canonical names, developer names, RERA numbers, locality
   slugs, array order, or timestamps.
5. Add an explicit 14-entry project-ID lock constant to the fixture-integrity test.
   The test maps each UUID to the expected canonical relationship, so wholesale ID
   regeneration fails review even if the fixture remains internally consistent.
6. Alias, RERA, source, and claim UUIDs are also fixture-owned. Existing immutable
   relationship checks prevent reassignment during re-import
   (`repository.py:126-158`).
7. A spelling correction updates display/normalized values while retaining the same
   reviewed project UUID. Splitting or merging identities requires a separately
   reviewed registry decision and must never reuse an old UUID for a different entity.

## 10. Validation and review tooling

### Shared loader

Create `backend/app/services/flatdna/registry_io.py` with only:

- `DEFAULT_HYDERABAD_REGISTRY_PATH`;
- `load_registry_bundle(path) -> RegistryBundle`;
- clear parse/file errors that do not connect to a database;
- deterministic summary counts for review output.

Do not put SQL, fetching, normalization mutation, ID generation, or source scraping in
the loader.

### Validator CLI

Create `scripts/validate_flatdna_registry.py`:

- defaults to the canonical Hyderabad fixture;
- calls the shared loader and existing `validate_registry_bundle`;
- applies the 0C dataset profile: exact count/allocation, Hyderabad-only, supported
  status, supported-developer evidence, required RERA presence, coordinate precision,
  source policy, and project-ID lock;
- prints a deterministic table of counts and findings;
- exits `0` only with zero error findings;
- supports `--json-report <path>` for an ignored review artifact;
- performs no network calls and no database writes.

### Importer CLI

Create `scripts/import_flatdna_registry.py`:

- dry-run is the default and requires no database URL;
- dry-run parses, validates, prints sanitized counts/diff intent, and exits without
  constructing an engine;
- `--apply` requires `DATABASE_URL` and an explicit target confirmation argument;
- never prints the connection string, password, or raw credentials;
- displays only sanitized host/database/schema identity before confirmation;
- uses `create_flatdna_engine()` and `PostgresFlatProjectRepository.upsert_registry()`;
- writes the full validated bundle in one transaction;
- has no delete, truncate, replace-all, or migration mode;
- verifies post-write entity counts and the exact 14 project UUIDs;
- refuses production application in automated tests; acceptance uses only
  `FLATDNA_TEST_DATABASE_URL` and a unique temporary schema.

### Human review checklist

The README must give one review row per project covering:

- canonical project name and normalized name;
- canonical developer and any developer alias;
- active project aliases and their types;
- exact locality slug and coordinate precision;
- RERA authority, recorded number, normalized number, and status;
- source publisher/reference/retrieval date;
- claim reviewer/review date;
- `SUPPORTED` decision;
- unresolved conflicts or candidate substitution reason.

Review output is a receipt, not a second editable registry.

## 11. Required validation additions

Extend `registry_validation.py` only where the accepted generic Batch 0B validator
does not cover curated-launch policy:

- approved canonical-name evidence for every `SUPPORTED` developer;
- approved evidence for every included RERA reference, whether `RECORDED` or
  `VERIFIED`;
- source URL/reference safety and production source-class/origin combinations;
- reject launch `SUPPORTED` projects whose precision is `APPROXIMATE` or `UNKNOWN`;
- a separate `validate_hyderabad_launch_registry()` profile for exact count,
  distribution, Hyderabad-only, supported-only, and RERA-presence rules.

Keep generic `validate_registry_bundle()` usable for incomplete `DRAFT` bundles. Do
not make its generic rules assume every future bundle is the 14-project launch set.
No database constraint or migration change is planned.

## 12. File-level change plan

### Create

| File | Responsibility |
| --- | --- |
| `planning-0c.md` | Authoritative Batch 0C plan; documentation only in this turn. |
| `data/cities/hyderabad/flatdna/README.md` | Curation, provenance, review, ID, correction, and import rules. |
| `data/cities/hyderabad/flatdna/registry.json` | Sole canonical seven-list `RegistryBundle` fixture with 14 projects. |
| `backend/app/services/flatdna/registry_io.py` | Side-effect-free JSON loader and deterministic summary. |
| `scripts/validate_flatdna_registry.py` | Read-only registry validator/report command. |
| `scripts/import_flatdna_registry.py` | Dry-run default; explicit safe transactional apply. |
| `backend/tests/test_flatdna_registry_data.py` | Fixture shape, exact roster/IDs/allocation, evidence, and synthetic rejection. |
| `backend/tests/test_flatdna_registry_cli.py` | Validator output/exit behavior and dry-run no-DB guarantee. |
| `backend/tests/test_flatdna_registry_postgres.py` | Real disposable-Postgres import, idempotence, counts, and cleanup proof. |

### Modify

| File | Minimum planned change |
| --- | --- |
| `backend/app/services/flatdna/registry_validation.py` | Add supported-developer/RERA evidence checks and separate Hyderabad launch-profile validation. |
| `backend/tests/test_flatdna_domain.py` | Add focused tests for the new generic evidence rules without weakening DRAFT behavior. |
| `backend/migrations/README.md` | Document that 0001 remains unchanged and Batch 0C import occurs only after validation/dry-run. |
| FlatDNA Obsidian notes | Mark 0C current only after real data/import acceptance; record final roster and source limitations. |

### Explicitly unchanged

- both SQL migrations and all seven table definitions;
- `models.py`, unless fixture parsing exposes an actual contract defect;
- repository SQL/upsert semantics;
- `database.py`, config, feature flags, router, `main.py`, and deployment config;
- all frontend application files and package scripts;
- PlotDNA locality catalogs, polygons, aliases, scoring, resolver, story, auth,
  payments, analytics, AVM, RERA service, and verdict code;
- `tsrera_scraper.py` and `data/tsrera_projects.json`;
- Batch 0D resolver files and fixtures.

## 13. Test plan

### Fixture and validation tests

- canonical file parses directly as `RegistryBundle` with no preprocessing;
- exactly seven top-level arrays and no unknown fields;
- exactly 14 projects and the exact locality distribution in section 6;
- every project/developer is `SUPPORTED` and every project ID matches the locked
  14-entry UUID contract;
- UUIDs are unique across each entity type and all references resolve;
- changing a display name does not change its locked UUID;
- all normalized names, aliases, RERA numbers, and fingerprints are current;
- all project points are valid and use `ENTRANCE` or `PROJECT_CENTROID`;
- every supported developer and project core claim has approved active evidence;
- every RERA reference has approved evidence; authority/number pairs are unique;
- every active alias has approved evidence; same-parent normalized duplicates fail;
- evidence origins contain only `REAL`/`CURATED` and no banned source marker;
- no fixture value matches known placeholder/test patterns;
- zero tower, unit, price, observation, comparable, valuation, or verdict fields;
- generic incomplete `DRAFT` bundle behavior remains allowed outside the launch
  profile.

### CLI/importer tests

- validator returns `0` and deterministic counts for the approved fixture;
- each invalid mutation returns non-zero with a stable finding code;
- dry-run succeeds without `DATABASE_URL` and never calls the engine factory;
- `--apply` without target confirmation or URL fails before opening a connection;
- logs never contain the supplied URL/password;
- import delegates once to the existing repository with the exact validated bundle;
- no CLI path contains delete/truncate/replace-all behavior.

### Disposable PostgreSQL acceptance

Against `FLATDNA_TEST_DATABASE_URL` only:

1. Confirm the target is isolated without printing credentials.
2. Create a unique temporary schema and apply the unchanged 0001 up migration.
3. Assert all seven tables are empty.
4. Import the reviewed bundle through the real repository.
5. Verify exact counts for every entity list and exactly 14 project UUIDs.
6. Verify all 14 projects are readable as supported and no other project exists.
7. Re-import the identical fixture and prove idempotent counts/UUIDs.
8. Attempt one synthetic source and one UUID relationship reassignment; prove the
   repository/DB reject both without altering accepted rows.
9. Run the unchanged down migration in the temporary schema and confirm all seven
   tables, triggers, and functions are removed.
10. Drop only the temporary schema and confirm no unrelated database object changed.

SQLite, mocked SQL, or a skipped PostgreSQL suite does not satisfy 0C acceptance.

### Regression commands

From `backend/`:

```powershell
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_registry_data tests.test_flatdna_registry_cli -v
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_registry_postgres -v
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_domain tests.test_flatdna_migration_contract tests.test_flatdna_repository -v
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_phase_0a -v
uv run --with-requirements requirements.txt python -m unittest discover -s tests -v
```

From `frontend/`:

```powershell
pnpm run test:flatdna-phase-0a
pnpm run test:area-story-nav
pnpm run test:home-nav-route
pnpm run test:hyderabad-location-search
pnpm run test:hyderabad-production
pnpm run test:email-otp-contract
pnpm run test:verdict-screen-resilience
pnpm run build
pnpm run lint
```

Final repository checks:

```powershell
git diff --check
git status --short
rg -n '@router\.(get|post|put|patch|delete)' backend/app/api/routes/flat.py
```

## 14. Implementation batches

### 0C.1 — approved evidence roster and UUID lock

- Use only the 14 `INCLUDE` decisions in `planning-0c-evidence-review.md`.
- Freeze the approved names/developers/localities and allocate one-time UUIDv4 IDs.
- Keep all DRAFT and EXCLUDED research outside the supported fixture.

Review gate: all 14 supported candidates have accepted identity, coordinate,
locality, RERA, and source evidence; no unresolved candidate is seeded.

### 0C.2 — canonical fixture and loader

- Add the README, one `registry.json`, and side-effect-free loader.
- Populate sources and claims with reviewer metadata and deterministic fingerprints.

Review gate: fixture parses exactly as `RegistryBundle`; no DB connection or write is
possible from the loader.

### 0C.3 — launch-profile validation

- Add the narrow validation extensions and read-only validator CLI.
- Add mutation-based fixture/integrity tests.

Review gate: zero findings on the canonical fixture; every prohibited mutation fails
with a stable code; generic DRAFT behavior remains green.

### 0C.4 — safe importer

- Add dry-run-default importer and tests.
- Reuse the accepted engine/repository; do not duplicate SQL.

Review gate: dry-run needs no database; apply requires explicit target confirmation;
there is no delete path and no credential logging.

### 0C.5 — real PostgreSQL import proof

- Apply unchanged migration in a disposable temporary schema.
- Import, verify, re-import, reject unsafe mutations, down-migrate, and prove cleanup.

Review gate: all PostgreSQL tests execute without skips and leave no test objects.

### 0C.6 — regression and documentation receipt

- Run the full backend/frontend matrix and diff review.
- Update Obsidian notes with the final actual roster and accepted results.
- Keep both FlatDNA flags false and stop.

Review gate: PlotDNA remains unchanged, the status route is still the only Flat
endpoint, no resolver exists, and Batch 0D has not started.

## 15. Acceptance criteria

Batch 0C may be marked accepted only when:

1. The fixture contains exactly 14 real supported projects in the exact allocation.
2. Every project/developer/RERA/alias fact meets the evidence rules above.
3. Every canonical relationship uses a stable explicit fixture UUID.
4. The 14 project UUID lock passes and import/re-import preserves IDs.
5. Validation reports zero findings and every negative mutation test fails correctly.
6. No TEST, SYNTHETIC, banned marker, placeholder, or randomized identity is present.
7. Dry-run performs no DB construction or write.
8. Real PostgreSQL import and idempotent re-import pass without skips.
9. Down migration and temporary-schema cleanup remove only FlatDNA test objects.
10. Full Batch 0A/0B, backend, frontend, and PlotDNA regression checks remain green.
11. Both FlatDNA flags remain off and `/api/v1/flat/status` remains the only route.
12. No Batch 0D resolver, 0E API, public UI, valuation, or other later work exists.

## 16. Risks, mitigations, and rollback

| Risk | Mitigation | Rollback |
| --- | --- | --- |
| Marketing locality differs from actual project point | Require coordinate review against existing PlotDNA locality identity; replace candidate on unresolved conflict | Remove candidate before fixture acceptance; never change locality merely to preserve the slate |
| Developer page changes or disappears | Record source reference/retrieval time; prefer official brochure/regulator corroboration | Mark source invalid and project non-supported in a reviewed follow-up transaction |
| RERA captcha prevents reproducible live verification | Store developer-published number as `RECORDED`; use `VERIFIED` only with reviewed official evidence | Demote reference status without changing project UUID |
| Aliases are invented to help 0D | Require a source and claim per active alias; typo inputs belong in 0D cases, not canonical aliases | Remove/reject alias before import |
| UUIDs are regenerated | Fixture-owned UUIDv4 plus hardcoded 14-project lock test and immutable repository relationships | Reject import; restore the reviewed fixture from version control |
| Import points at the wrong database | Dry-run default, explicit apply/target confirmation, sanitized target display, disposable-only acceptance | Transaction rollback; flags remain off; importer has no delete path |
| Partial bundle write | Existing repository uses one transaction and DB supported-evidence triggers | Transaction rolls back entirely |
| Curated fixture becomes a second schema | Parse directly as existing `RegistryBundle`; no hand-authored JSON schema | Remove loader/tooling without touching Batch 0B tables |
| Registry is mistaken for exhaustive Hyderabad coverage | README and status boundary state exactly 14 curated projects | Keep unsupported searches for Batch 0D/0E; do not broaden claims |

Operational rollback after an accepted import is status-first, not deletion: keep the
feature off, demote affected projects to `REVIEW_REQUIRED`/`UNSUPPORTED` in a reviewed
replacement bundle, and preserve UUID history. The 0001 down migration is used only
in disposable acceptance or before any dependent later batch and after explicit
backup/review.

## 17. Known blockers before implementation acceptance

- The evidence review is approved for 14 supported projects. The five DRAFT and two
  EXCLUDED candidates remain blocked and cannot be substituted into the fixture.
- `reviewed_by` records Naveen, who approved the evidence checkpoint; it must not be
  replaced by a generic system or agent identity.
- Some completed project pages may be removed or redirected. Candidates without a
  durable acceptable identity source must be replaced, not filled from portals.
- The disposable PostgreSQL credential used for acceptance must be rotated if it has
  been exposed in chat or logs before 0C testing begins.

## 18. Recommended first implementation batch

Begin with **0C.1 — approved evidence roster and UUID lock**, then proceed through
0C.2–0C.6 only for the reviewed 14-project fixture.

## Stop condition

Stop after Batch 0C acceptance. Do not start Batch 0D.

## Acceptance receipt — 2026-08-09

- Supported fixture: 14 projects, 8 developers, 0 developer aliases, 9 project
  aliases, 14 verified RERA references, 42 evidence sources, and 87 approved claims.
- Dry-run validation completed with zero database construction or writes.
- Disposable PostgreSQL 18.4 first import, exact read-back, stable-ID verification,
  idempotent re-import, invalid-data rejection, complete transaction rollback, down
  migration cleanup, and clean reapply passed.
- All 14 PostgreSQL tests passed without skips; the complete backend suite passed
  118/118 without skips.
- Batch 0A frontend contract, PlotDNA story/navigation/search/production/auth/verdict
  smoke checks, frontend build, and lint passed.
- Implementation deviation: Batch 0B's per-record immutable-relationship queries
  exceeded the remote acceptance timeout for a real registry. They were replaced by
  one equivalent batched lookup per table, and project-to-developer identity was
  added to the same immutable relationship guard. Schema and transaction semantics
  did not change.
- Both FlatDNA feature flags remain off, no production registry import occurred, all
  DRAFT/EXCLUDED candidates remain unseeded, and Batch 0D has not started.
