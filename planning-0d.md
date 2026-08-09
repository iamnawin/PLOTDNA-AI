# FlatDNA Phase 0 - Batch 0D Implementation Plan

Status: PLANNING COMPLETE - NOT IMPLEMENTED
Scope: deterministic Hyderabad apartment-project identity resolver only
Last updated: 2026-08-09
Depends on: accepted Batch 0A, Batch 0B, and Batch 0C
Authoritative implementation plan: this file

## 1. Goal and requirements summary

Build a deterministic backend service that maps a user-entered apartment-project
name to one of the 14 `SUPPORTED` FlatDNA projects and returns exactly one public
domain outcome:

- `MATCHED`: one canonical project identity is safe to select;
- `AMBIGUOUS`: two or more plausible identities or an explicit context conflict
  requires future user confirmation;
- `NOT_FOUND`: no supported identity can safely be returned.

The resolver must never invoke an LLM, an embedding model, a geocoder, a network
service, or a locality-level fallback. It must prefer `AMBIGUOUS` or `NOT_FOUND`
over a wrong automatic selection.

Batch 0D implements the resolver and repository read boundary but does not expose a
new HTTP route. Project-search API ownership remains in Batch 0E.

## 2. Accepted baseline

- The registry contains 14 `SUPPORTED` Hyderabad projects, eight supported
  developers, and nine active reviewed project aliases
  (`data/cities/hyderabad/flatdna/registry.json`). The five DRAFT and two EXCLUDED
  research candidates are not present.
- Stable identity is the explicit project UUID, never a mutable name
  (`backend/app/services/flatdna/models.py:101-117`).
- Canonical and alias normalization already uses Unicode NFKC, case folding,
  punctuation-to-space conversion, and whitespace collapse
  (`backend/app/services/flatdna/models.py:213-216`).
- Project aliases are parent-scoped and may collide across projects
  (`backend/migrations/0001_flatdna_registry.up.sql:89-114`).
- `FlatProjectRepository` currently reads supported projects but not their aliases
  (`backend/app/services/flatdna/repository.py:24-29,52-67`).
- Supported project reads already filter `project.registry_status = 'SUPPORTED'`
  (`backend/app/services/flatdna/repository.py:52-67`).
- Database construction is explicit and lazy; importing FlatDNA does not connect to
  Postgres (`backend/app/services/flatdna/database.py:10-15`).
- The router-level backend gate remains authoritative, and the only current route is
  `/api/v1/flat/status` (`backend/app/api/routes/flat.py:6-16`).

Repository code and `planning-0c.md` override older Obsidian text that mentions 21
projects, additional response states, or alias generation.

## 3. Resolver architecture

Use one pure matching service and one additive repository read:

```text
Postgres flat_* tables
  -> FlatProjectRepository.list_supported_project_identity_rows("hyderabad")
  -> immutable in-memory candidate index (14 projects + active aliases)
  -> ProjectResolver.resolve(query)
  -> MATCHED | AMBIGUOUS | NOT_FOUND
```

### Pure service boundary

`backend/app/services/flatdna/resolver.py` will own:

- `ResolverOutcome`: `MATCHED`, `AMBIGUOUS`, `NOT_FOUND`;
- internal `MatchReason` values;
- immutable candidate/result dataclasses or Pydantic read contracts;
- resolver-specific normalization helpers;
- exact-key indexes, context parsing, fuzzy scoring, ranking, and outcome rules;
- the calibrated constants in integer basis points.

The resolver accepts an already-loaded candidate sequence. It does not construct an
engine, query SQL, parse `registry.json`, read environment variables, call AI code,
or perform network I/O. This keeps threshold tests pure and proves that identity is
decided only from reviewed registry facts.

### Result shape

`MATCHED` returns:

- `outcome`;
- project UUID and canonical name;
- canonical developer UUID/name;
- city and locality slug;
- `matched_label` (canonical name or reviewed alias);
- `match_source` (`CANONICAL_EXACT`, `CANONICAL_COMPACT`, `ALIAS_EXACT`,
  `ALIAS_COMPACT`, `DEVELOPER_COMPOSITE`, `LOCALITY_QUALIFIED`, or `FUZZY`);
- internal diagnostics: name score, context adjustments, second score, winner
  margin, and reason codes.

`AMBIGUOUS` returns no selected project. It returns ranked candidates with project
UUID/name, developer name, locality slug, score, matched label, and reason codes.

`NOT_FOUND` returns no project identity and no locality analysis. Internal
`INVALID_QUERY` may be a diagnostic reason for blank, punctuation-only, or
over-length input, but it is mapped to the external `NOT_FOUND` outcome rather than
creating a fourth public state.

## 4. Normalization algorithm

Reuse `normalize_identity()` as the authoritative display-normalized form, then add
only a resolver comparison key:

1. Reject a raw `None`, blank, punctuation-only, or normalized query longer than 160
   characters as internal `INVALID_QUERY` -> public `NOT_FOUND`.
2. Apply Unicode NFKC.
3. Apply Unicode-aware `casefold()`.
4. Convert punctuation, hyphens, and apostrophes to token boundaries through the
   existing normalizer.
5. Collapse repeated whitespace and trim.
6. Preserve letters and digits.
7. Derive a compact key by removing spaces from the normalized form.

The compact key handles mechanical spacing differences such as `MyHome`/`My Home`,
`On Cloud33`/`On Cloud 33`, and `Corner Stone`/`Cornerstone`. A compact key is never
assumed unique: a key mapped to multiple projects produces `AMBIGUOUS`.

Do not remove marketing suffixes such as `Heights`, `Residency`, `Phase`, or `Tower`.
Those tokens can distinguish real project identities. Do not perform phonetic
rewrites, abbreviation expansion, token synonym substitution, or runtime alias
generation. Semantic variations remain curated aliases only.

## 5. Exact-match ladder

Evaluate the following in order. An exact hit always outranks fuzzy scoring, but an
exact key shared by multiple supported projects is ambiguous rather than silently
resolved.

1. Exact normalized canonical name.
2. Exact compact canonical name.
3. Exact normalized active reviewed project alias.
4. Exact compact active reviewed project alias.
5. Developer composite: recognize only a full canonical developer name at a query
   edge, remove it, and compare the remainder against that developer's project name
   or mechanically derived project core. No developer alias is invented.
6. Locality-qualified match: recognize only locality slugs represented by the loaded
   projects, using the slug and its hyphen-to-space display form at a query edge;
   remove it and repeat exact project matching.
7. Shared-prefix guard: a meaningful two-or-more-token prefix of multiple projects,
   such as `Aparna Sarovar`, returns `AMBIGUOUS` even if fuzzy scores sit below the
   general candidate floor.
8. Continue to fuzzy ranking only if no exact or prefix outcome applies.

If a full developer or locality context contradicts an otherwise exact project
identity, do not auto-select it. Return `AMBIGUOUS` with a conflict reason when the
name is otherwise strong, or `NOT_FOUND` when it is not.

Developer-family-only strings are a negative guard. A prefix mechanically shared by
all supported projects for the same developer (`Aparna`, `Rajapushpa`, `My Home`)
returns `NOT_FOUND`; it is context, not project identity. This guard is derived from
canonical records and does not create developer aliases.

## 6. Fuzzy-match algorithm and scoring

Use a small standard-library implementation of Optimal String Alignment
Damerau-Levenshtein distance. This supports insertions, deletions, substitutions,
and adjacent transpositions without adding a package.

For each canonical name and active alias:

```text
normalized_similarity = 100 * (1 - distance(normalized_query, normalized_label)
                                      / max_length)
compact_similarity    = the same calculation on compact keys
name_score            = max(normalized_similarity, compact_similarity)
candidate_name_score  = max(name_score across canonical name + active aliases)

final_score = candidate_name_score
            + 3 points for matching explicit canonical-developer context
            + 3 points for matching explicit locality context
            - 15 points for contradictory developer context
            - 15 points for contradictory locality context
            clamped to 0..100
```

Token overlap is retained as a diagnostic and for the shared-prefix guard, not as a
second opaque weighted model. This keeps the decision explainable and avoids making
short developer/locality fragments look artificially strong.

Calculate decision scores in integer basis points (`0..10000`) and format them to
two decimals only for diagnostics. Do not use platform-dependent floating-point
rounding at threshold boundaries.

## 7. Candidate ranking and outcome rules

Stable sort order:

1. final score descending;
2. match-source priority (canonical before alias at equal score);
3. normalized canonical name ascending;
4. project UUID ascending.

Final thresholds, calibrated in section 9:

- strong automatic-match threshold: **90.00**;
- candidate floor: **75.00**;
- minimum winner margin: **12.00 points**;
- explicit shared-prefix ambiguity: at least two supported project names/aliases
  share a normalized prefix of at least two tokens;
- fuzzy ambiguity: top and second candidates are both at least 75.00 and the margin
  is less than 12.00.

Decision rules:

- `MATCHED`: an unconflicted unique exact-ladder hit; or fuzzy top score >= 90.00,
  margin >= 12.00, and no explicit developer/locality contradiction.
- `AMBIGUOUS`: an exact-key collision; shared multi-project prefix; fuzzy top two at
  or above 75.00 with margin < 12.00; or a strong name paired with contradictory
  canonical developer/locality context.
- `NOT_FOUND`: invalid query, developer-only/locality-only query, top score below
  90.00 without two credible candidates, unsupported/DRAFT/EXCLUDED project query,
  or all other cases.

No result may return a project outside the candidate snapshot. `NOT_FOUND` never
falls back to PlotDNA locality analysis and never asks an LLM to guess.

## 8. Fixed evaluation corpus

Create `data/cities/hyderabad/flatdna/resolver-cases.json`. It is a reviewed resolver
test corpus, not registry seed data. Each case stores:

- stable `case_id` and category;
- query;
- expected public outcome;
- expected matched UUID or ordered ambiguous UUIDs where applicable;
- expected top/second UUID and score to two decimals;
- expected margin and primary reason.

The minimum corpus is 59 cases:

- 14 canonical names;
- all nine approved aliases;
- nine mechanical/context variations;
- seven realistic typo cases;
- three ambiguity/conflict cases;
- three developer-only cases;
- two locality-only/land cases;
- five DRAFT names;
- two EXCLUDED names;
- five unknown/invalid names.

No corpus case is imported by `RegistryBundle`, and no corpus spelling becomes an
alias. Changing an expected outcome, matched UUID, or threshold requires explicit
review of this fixture.

### Calibration evaluation table

Scores below are from a read-only reference calculation against the accepted 14
projects and nine aliases. Exact-ladder results report 100.00 for the winning exact
identity; fuzzy scores use the algorithm in section 6. `-` means no candidate is
returned by a pre-ranking guard.

| Query | Expected outcome | Top candidate | Top | Second candidate | Second | Margin | Decision basis |
| --- | --- | --- | ---: | --- | ---: | ---: | --- |
| `Myscape Isle of Sky` | MATCHED | Myscape Isle of Sky | 100.00 | My Home Nishada | 26.32 | 73.68 | canonical exact |
| `My Home Nishada` | MATCHED | My Home Nishada | 100.00 | My Home Tridasa | 66.67 | 33.33 | canonical exact |
| `Prestige Beverly Hills` | MATCHED | Prestige Beverly Hills | 100.00 | Rajapushpa Pristinia | 30.00 | 70.00 | canonical exact |
| `Rajapushpa Pristinia` | MATCHED | Rajapushpa Pristinia | 100.00 | Rajapushpa Provincia | 80.00 | 20.00 | canonical exact |
| `Rajapushpa Provincia` | MATCHED | Rajapushpa Provincia | 100.00 | Rajapushpa Pristinia | 80.00 | 20.00 | canonical exact |
| `EIPL Cornerstone` | MATCHED | EIPL Cornerstone | 100.00 | Ramky One Harmony | 26.67 | 73.33 | canonical exact |
| `My Home Tridasa` | MATCHED | My Home Tridasa | 100.00 | My Home Nishada | 66.67 | 33.33 | canonical exact |
| `Aparna Newlands` | MATCHED | Aparna Newlands | 100.00 | Aparna Sarovar Zenith | 42.86 | 57.14 | canonical exact |
| `Rajapushpa Imperia` | MATCHED | Rajapushpa Imperia | 100.00 | Rajapushpa Pristinia | 70.00 | 30.00 | canonical exact |
| `Aparna Sarovar Zenith` | MATCHED | Aparna Sarovar Zenith | 100.00 | Aparna Sarovar Zicon | 76.19 | 23.81 | canonical exact |
| `Aparna Sarovar Zicon` | MATCHED | Aparna Sarovar Zicon | 100.00 | Aparna Sarovar Zenith | 76.19 | 23.81 | canonical exact |
| `Aparna Luxor Park` | MATCHED | Aparna Luxor Park | 100.00 | Aparna Sarovar Zicon | 50.00 | 50.00 | canonical exact |
| `On Cloud 33` | MATCHED | On Cloud 33 | 100.00 | My Home Nishada | 22.22 | 77.78 | canonical exact |
| `Ramky One Harmony` | MATCHED | Ramky One Harmony | 100.00 | My Home Nishada | 29.41 | 70.59 | canonical exact |
| `Isle of Sky` | MATCHED | Myscape Isle of Sky | 100.00 | EIPL Cornerstone | 26.67 | 73.33 | alias exact |
| `Nishada` | MATCHED | My Home Nishada | 100.00 | Rajapushpa Pristinia | 33.33 | 66.67 | alias exact |
| `Pristinia` | MATCHED | Rajapushpa Pristinia | 100.00 | Rajapushpa Provincia | 55.56 | 44.44 | alias exact |
| `Provincia` | MATCHED | Rajapushpa Provincia | 100.00 | Rajapushpa Pristinia | 55.56 | 44.44 | alias exact |
| `Cornerstone` | MATCHED | EIPL Cornerstone | 100.00 | Rajapushpa Pristinia | 27.27 | 72.73 | alias exact |
| `Corner Stone` | MATCHED | EIPL Cornerstone | 100.00 | Rajapushpa Pristinia | 27.27 | 72.73 | alias exact |
| `Imperia` | MATCHED | Rajapushpa Imperia | 100.00 | Rajapushpa Pristinia | 33.33 | 66.67 | alias exact |
| `Urbanrise On Cloud 33` | MATCHED | On Cloud 33 | 100.00 | Aparna Newlands | 28.57 | 71.43 | alias exact |
| `On Cloud33` | MATCHED | On Cloud 33 | 100.00 | My Home Nishada | 22.22 | 77.78 | alias exact |
| `MyHome Nishada` | MATCHED | My Home Nishada | 100.00 | My Home Tridasa | 61.54 | 38.46 | compact canonical |
| `EIPL Corner-Stone` | MATCHED | EIPL Cornerstone | 100.00 | Myscape Isle of Sky | 29.41 | 70.59 | compact canonical |
| `OnCloud33` | MATCHED | On Cloud 33 | 100.00 | My Home Nishada | 22.22 | 77.78 | compact canonical/alias |
| `Nishada Kokapet` | MATCHED | My Home Nishada | 100.00 | Rajapushpa Pristinia | 36.33 | 63.67 | locality-qualified alias |
| `Aparna Constructions Newlands` | MATCHED | Aparna Newlands | 100.00 | My Home Nishada | 22.50 | 77.50 | developer composite |
| `  Rajapushpa   Pristinia  ` | MATCHED | Rajapushpa Pristinia | 100.00 | Rajapushpa Provincia | 80.00 | 20.00 | whitespace normalization |
| `Kokapet Nishada` | MATCHED | My Home Nishada | 100.00 | Rajapushpa Pristinia | 36.33 | 63.67 | reverse locality qualification |
| `Ramky One-Harmony` | MATCHED | Ramky One Harmony | 100.00 | My Home Nishada | 29.41 | 70.59 | hyphen normalization |
| `Ramky One'Harmony` | MATCHED | Ramky One Harmony | 100.00 | My Home Nishada | 29.41 | 70.59 | apostrophe normalization |
| `aparana sarovar zenit` | MATCHED | Aparna Sarovar Zenith | 90.48 | Aparna Sarovar Zicon | 76.19 | 14.29 | fuzzy |
| `aparna sarovar zenit` | MATCHED | Aparna Sarovar Zenith | 95.24 | Aparna Sarovar Zicon | 80.00 | 15.24 | fuzzy |
| `rajapushpa provinca` | MATCHED | Rajapushpa Provincia | 95.00 | Rajapushpa Pristinia | 80.00 | 15.00 | fuzzy |
| `my home tridassa` | MATCHED | My Home Tridasa | 93.75 | My Home Nishada | 62.50 | 31.25 | fuzzy |
| `aparna newland` | MATCHED | Aparna Newlands | 93.33 | Aparna Luxor Park | 47.06 | 46.27 | fuzzy |
| `ramky one harmny` | MATCHED | Ramky One Harmony | 94.12 | EIPL Cornerstone | 26.67 | 67.45 | fuzzy |
| `prestige beverly hill` | MATCHED | Prestige Beverly Hills | 95.45 | Rajapushpa Pristinia | 31.58 | 63.87 | fuzzy |
| `Aparna Sarovar` | AMBIGUOUS | Aparna Sarovar Zicon | 72.22 | Aparna Sarovar Zenith | 68.42 | 3.80 | shared-prefix guard |
| `aparna sarovar zen` | AMBIGUOUS | Aparna Sarovar Zenith | 85.71 | Aparna Sarovar Zicon | 85.00 | 0.71 | fuzzy collision |
| `My Home Nishada Tellapur` | AMBIGUOUS | My Home Nishada | 100.00 | - | - | - | locality conflict |
| `Rajapushpa` | NOT_FOUND | - | - | - | - | - | developer-family only |
| `Aparna` | NOT_FOUND | - | - | - | - | - | developer-family only |
| `My Home` | NOT_FOUND | - | - | - | - | - | developer-family only |
| `Gachibowli` | NOT_FOUND | Rajapushpa Imperia | 23.53 | On Cloud 33 | 22.22 | 1.31 | locality only |
| `Financial District` | NOT_FOUND | Rajapushpa Pristinia | 26.32 | EIPL Cornerstone | 23.53 | 2.79 | locality only |
| `Myscape Songs of the Sun` | NOT_FOUND | Myscape Isle of Sky | 54.17 | My Home Nishada | 30.00 | 24.17 | DRAFT candidate excluded |
| `Aparna Zenon` | NOT_FOUND | Aparna Newlands | 60.00 | Aparna Sarovar Zicon | 50.00 | 10.00 | DRAFT candidate excluded |
| `My Home Vihanga` | NOT_FOUND | My Home Nishada | 73.33 | My Home Tridasa | 66.67 | 6.66 | DRAFT candidate excluded |
| `Prestige Ivy League` | NOT_FOUND | Prestige Beverly Hills | 50.00 | Rajapushpa Pristinia | 41.18 | 8.82 | DRAFT candidate excluded |
| `Codename Sky Habitat` | NOT_FOUND | My Home Nishada | 30.00 | My Home Tridasa | 25.00 | 5.00 | DRAFT candidate excluded |
| `Prestige High Fields` | NOT_FOUND | Prestige Beverly Hills | 54.55 | Rajapushpa Pristinia | 33.33 | 21.22 | EXCLUDED candidate |
| `NCC Urban One` | NOT_FOUND | EIPL Cornerstone | 33.33 | Aparna Sarovar Zicon | 25.00 | 8.33 | EXCLUDED candidate |
| `Unknown Heights` | NOT_FOUND | Ramky One Harmony | 23.53 | My Home Nishada | 20.00 | 3.53 | unknown project |
| `Lodha Belmondo` | NOT_FOUND | Aparna Newlands | 33.33 | On Cloud 33 | 28.57 | 4.76 | unsupported project |
| `plot in kokapet` | NOT_FOUND | Rajapushpa Pristinia | 47.44 | Rajapushpa Provincia | 29.44 | 18.00 | land/locality text |
| `xyzzy` | NOT_FOUND | Ramky One Harmony | 13.33 | Myscape Isle of Sky | 12.50 | 0.83 | random text |
| `!!!` | NOT_FOUND | - | - | - | - | - | invalid query |

The table is the complete 59-case calibration receipt; the JSON becomes its
executable version during implementation.

## 9. Threshold calibration result

The old conceptual 90/72/8 proposal is not accepted unchanged.

- The weakest intended fuzzy positive is `aparana sarovar zenit`: 90.48 with a
  14.29-point lead.
- The strongest DRAFT/EXCLUDED negative is `My Home Vihanga`: 73.33.
- Similar supported names can be close: `aparna sarovar zen` scores 85.71 versus
  85.00 and must remain ambiguous.
- The bare shared prefix `Aparna Sarovar` falls below a general 75 floor, which proves
  that a deterministic prefix-collision rule is needed in addition to score gates.

Therefore recommend **90 strong / 75 floor / 12 winner margin**. Relative to the old
proposal, the candidate floor rises from 72 to 75 and the margin rises from 8 to 12.
The 90 threshold is retained because this corpus independently supports it, not
because it appeared in the earlier plan.

Any future registry expansion must rerun the entire corpus plus new collision cases
before thresholds or automatic matching are accepted.

## 10. Registry and repository access pattern

Production resolution reads the database, not `registry.json`. Add one repository
method that returns a stable ordered row set containing only:

- supported project ID/name/normalized name/city/locality;
- non-inactive canonical developer ID/name/normalized name;
- active project alias ID/text/normalized text/type, if any.

Use one PostgreSQL `LEFT JOIN` query and group rows into an immutable in-memory
candidate index inside the service. The query must retain the existing
`project.registry_status = 'SUPPORTED'` predicate and must not read evidence,
RERA, DRAFT, REVIEW_REQUIRED, UNSUPPORTED, or INACTIVE projects.

At 14 projects, rebuilding this in-memory index from one query per resolver operation
is acceptable and avoids cache invalidation. Batch 0D adds no global startup cache,
background refresh, Redis, Elasticsearch, vector store, or new index. If measured
API traffic later justifies caching, Batch 0E can add a bounded lazy cache without
changing resolver semantics.

`registry.json` and `resolver-cases.json` are test/curation sources only. Runtime must
not fall back to them when the database is empty or unavailable. An empty supported
database produces `NOT_FOUND`; a database error remains an operational error for the
future API rather than fabricated identity.

## 11. API ownership decision: Batch 0E

Do not add `GET /api/v1/flat/projects/search` in Batch 0D. Batch 0D proves the domain
resolver and real repository read first. Batch 0E will own:

- request validation and query-length HTTP behavior;
- lazy engine/repository dependency construction;
- `GET /api/v1/flat/projects/search?q=...` serialization;
- authoritative `ENABLE_FLAT_DNA` route gating;
- operational database-error mapping;
- public/internal diagnostic redaction;
- OpenAPI and API contract tests.

This keeps `backend/app/api/routes/flat.py` and `backend/app/main.py` unchanged in 0D.
No public FlatDNA UI is added.

## 12. Test plan and acceptance criteria

### Pure resolver tests

- all 14 canonical names return the exact locked UUID;
- all nine active approved aliases return the correct UUID and alias source;
- case, leading/trailing/repeated whitespace, punctuation, hyphens, apostrophes, and
  compact spacing normalize deterministically;
- the seven typo cases in section 8 resolve as expected;
- exact canonical/alias outcomes always dominate fuzzy candidates;
- cross-project exact alias/compact-key collisions return `AMBIGUOUS`;
- `Aparna Sarovar` and `aparna sarovar zen` return both Sarovar projects in stable
  rank order with no selected UUID;
- `Aparna`, `Rajapushpa`, and `My Home` return `NOT_FOUND`;
- locality-only, land text, random text, invalid text, DRAFT, and EXCLUDED names
  return `NOT_FOUND` with no canonical identity;
- matching locality context can aid rank; contradictory locality/developer context
  cannot auto-match;
- repeated evaluation returns byte-for-byte-equivalent ordered results;
- score boundary tests cover 89.99/90.00, 74.99/75.00, and 11.99/12.00 using
  constructed in-memory candidates, not fake registry rows;
- source/import contract proves the resolver module has no AI, network, embedding,
  geocoder, or random dependency.

### Repository tests

- the new read includes supported projects and active aliases;
- inactive aliases are excluded;
- DRAFT, REVIEW_REQUIRED, UNSUPPORTED, and INACTIVE projects are excluded;
- non-inactive developer requirement is preserved;
- row ordering is deterministic;
- existing `get_supported_project`, `list_supported_projects`, and upsert behavior is
  unchanged.

### Disposable PostgreSQL acceptance

Using `FLATDNA_TEST_DATABASE_URL` only:

1. Create an isolated temporary schema and apply unchanged migration 0001.
2. Import the accepted 14-project fixture.
3. Resolve the complete evaluation corpus through the real repository snapshot.
4. Insert a directly controlled DRAFT test project and inactive alias in the
   temporary schema; prove neither enters the candidate set.
5. Verify stable UUIDs and deterministic repeated results.
6. Run the unchanged down migration and confirm complete FlatDNA cleanup.
7. Reapply/import and rerun the resolver integration test.

No skipped PostgreSQL test counts as acceptance. No production database is used.

### Regression commands

From `backend/`:

```powershell
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_resolver -v
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_resolver_postgres -v
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_repository tests.test_flatdna_registry_data tests.test_flatdna_registry_postgres -v
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

From the repository root:

```powershell
git diff --check
git status --short
```

Acceptance additionally requires both FlatDNA flags to remain off, the status route
to remain 404 when disabled, no new FlatDNA HTTP route, no fixture mutation, no
migration, and no change to current PlotDNA behavior.

## 13. File-level change plan

### Create in implementation

| File | Exact responsibility |
| --- | --- |
| `backend/app/services/flatdna/resolver.py` | Pure outcome contracts, normalization keys, exact/context ladder, OSA Damerau-Levenshtein scoring, deterministic ranking, thresholds. |
| `data/cities/hyderabad/flatdna/resolver-cases.json` | Reviewed 59-case threshold/evaluation corpus; never imported as registry data. |
| `backend/tests/test_flatdna_resolver.py` | Pure corpus, normalization, collision, threshold-boundary, determinism, and no-AI/network tests. |
| `backend/tests/test_flatdna_resolver_postgres.py` | Disposable-Postgres supported-only candidate and full-corpus integration tests. |

### Modify in implementation

| File | Minimum change |
| --- | --- |
| `backend/app/services/flatdna/repository.py` | Add one supported-project identity-row read including active project aliases; preserve all existing methods. |
| `backend/tests/test_flatdna_repository.py` | Assert the new SQL filter/join/order contract and preserve current repository tests. |
| `data/cities/hyderabad/flatdna/README.md` | Document that resolver cases are reviewed evaluation data, not aliases or import rows. |
| `planning-0d.md` | Record final implementation/acceptance receipt only after Batch 0D passes. |
| FlatDNA Obsidian overview/resolver/decisions notes | Mark 0D accepted, actual thresholds, corpus result, and limitations only after acceptance. |

### Explicitly unchanged

- `registry.json`, all UUIDs, aliases, evidence, and project statuses;
- migration up/down SQL and all seven tables;
- `models.py`, `registry_io.py`, registry validation/import scripts;
- configuration, `.env` files, `render.yaml`, and dependency files;
- `flat.py`, `main.py`, and all API contracts;
- every frontend source file;
- PlotDNA land/locality resolver, map, seven-step story, auth, payments, scoring,
  verdict, analytics, AVM, and RERA services.

## 14. Risks and mitigations

| Risk | Regression/coupling | Mitigation |
| --- | --- | --- |
| Wrong fuzzy auto-match | High identity-integrity risk; no land-flow coupling | 90/75/12 gates, exact/prefix collision rules, fixed corpus, prefer no match. |
| Compact keys collapse distinct names | Future registry collision risk | Index key to a set; multiple projects are always `AMBIGUOUS`. |
| Developer/locality text is mistaken for identity | Could create false support | Full canonical developer context only; locality/project-family-only guards never match. |
| Context contradicts a strong name | Silent context ignoring would be unsafe | Conflict prevents automatic selection and is exposed in reasons. |
| OSA score changes across implementations | Threshold drift | One local implementation, integer basis points, exact score snapshots in corpus. |
| Repository accidentally returns DRAFT/INACTIVE rows | Data integrity risk | SQL predicates plus unit and real-Postgres tests. |
| Runtime fixture fallback hides missing DB import | Deployment/data-integrity risk | Database is authoritative; no production fixture fallback. |
| Remote DB query adds latency | Isolated to future Flat search | One small ordered query; measure in 0E before adding bounded lazy caching. |
| Resolver import connects to DB | PlotDNA startup regression | Pure constructor input; engine remains explicit/lazy. |
| Evaluation names become aliases | Would bypass evidence review | Separate non-import fixture and README/test contract; runtime never mutates aliases. |
| Registry expansion invalidates thresholds | Future false-positive risk | Recalibrate full corpus on every supported-project/alias change. |

## 15. Rollback strategy

Batch 0D has no migration and writes no registry data. Rollback is code-only:

1. Remove `resolver.py`, the two resolver test modules, and `resolver-cases.json`.
2. Revert only the additive repository identity-row method and its focused tests.
3. Revert the resolver-corpus README paragraph and unaccepted documentation receipt.
4. Rerun Batch 0A-0C backend/PostgreSQL tests and the PlotDNA/frontend regressions.

The seven-table schema, accepted registry import, stable UUIDs, aliases, evidence,
and all PlotDNA production behavior remain intact throughout rollback.

## 16. Explicit non-goals

Batch 0D does not include:

- project-search/detail/admin HTTP endpoints (Batch 0E);
- public FlatDNA UI or homepage Plot/Flat selector;
- Project DNA, verdict, valuation, price estimation, market observations,
  comparables, or user quote collection;
- RERA scraping or RERA-identifier query resolution;
- tower or unit matching;
- LLM identity resolution, embeddings, vector search, Elasticsearch, Redis, or a
  new datastore;
- automatic alias generation/learning or mutation of `registry.json`;
- DRAFT/EXCLUDED project resurrection;
- PropertyDNA rename, House/Villa, Commercial, or geographic expansion;
- unrelated PlotDNA refactoring.

## 17. Recommended implementation slices

### 0D-1 - Lock the evaluation contract

- Add the 59-case `resolver-cases.json` and loader assertions in
  `test_flatdna_resolver.py`.
- Verify every project UUID and alias expectation against the unchanged registry.
- Acceptance: corpus parses, contains all required categories, and cannot be imported
  as a `RegistryBundle`.

### 0D-2 - Pure normalization and result contracts

- Add outcomes, result/candidate diagnostics, normalized/compact keys, invalid-query
  handling, and stable sorting.
- Acceptance: normalization/boundary/determinism tests pass; no DB/network import.

### 0D-3 - Exact and context ladder

- Add canonical, alias, compact, developer-composite, locality-qualified,
  developer-only, collision, and shared-prefix rules.
- Acceptance: 14 canonical + nine alias + all context/ambiguity cases pass before
  fuzzy matching is enabled.

### 0D-4 - Fuzzy scoring and calibrated decisions

- Add OSA Damerau-Levenshtein, integer-basis-point scoring, 90/75/12 thresholds, and
  score diagnostics.
- Acceptance: all typo, ambiguity, negative, and exact threshold-boundary cases pass
  with zero wrong auto-resolves.

### 0D-5 - Supported-only repository integration

- Add the one-query identity-row method and real-Postgres integration.
- Acceptance: complete corpus passes from imported rows; controlled DRAFT/inactive
  rows never enter the candidate set; apply/down/reapply succeeds.

### 0D-6 - Regression and acceptance receipt

- Run the full command set in section 12, review the complete diff, verify flags off,
  and verify no API/frontend/migration/registry changes.
- Update repo/Obsidian status only after all checks pass.
- Stop with Batch 0E not started.

## 18. Recommended first implementation slice

Start with **0D-1 - Lock the evaluation contract**. It freezes expected identities,
ambiguities, negatives, scores, and the 90/75/12 decision before production resolver
code exists. This makes every later implementation choice measurable and prevents a
fuzzy algorithm from defining its own acceptance criteria after the fact.

## 19. Batch 0D implementation receipt (2026-08-09)

**Status: ACCEPTED.** Batch 0D implemented the pure deterministic resolver and the
supported-only PostgreSQL candidate read without adding an HTTP endpoint, migration,
dependency, registry mutation, or frontend behavior.

- Evaluation: all 59 reviewed cases passed expected outcome, stable UUID, ranking,
  score, and repeated-execution checks: 39 `MATCHED`, 3 `AMBIGUOUS`, 17 `NOT_FOUND`.
- Thresholds: unchanged at 90.00 strong, 75.00 candidate floor, and 12.00 winner
  margin, calculated in integer basis points.
- PostgreSQL: three Batch 0D integration tests executed without skips against an
  isolated disposable schema; supported rows and active aliases were returned,
  DRAFT/inactive rows were excluded, and down/reapply plus a second full-corpus run
  succeeded.
- Backend: 34 focused FlatDNA tests and all 132 discovered backend tests passed.
- Frontend/PlotDNA: the FlatDNA 0A contract, seven-step story navigation, home route,
  Hyderabad search/production, email OTP, verdict resilience, build, and lint passed.
- Diff check: passed. Both FlatDNA flags remain OFF by default and `/api/v1/flat/status`
  remains the only FlatDNA route.

The executable result matrix is `data/cities/hyderabad/flatdna/resolver-cases.json`;
`backend/tests/test_flatdna_resolver.py` proves expected equals actual for every row.
Five diagnostic receipt corrections were required after the first deterministic run,
with no outcome, UUID, threshold, or matching-rule change:

1. `EIPL Cornerstone` uses `Ramky One Harmony` as the equal-score second candidate
   because canonical labels outrank aliases.
2. `Codename Sky Habitat` uses `My Home Tridasa` as the equal-score second candidate
   for the same stable source-priority rule.
3. Three margins are the subtraction of integer basis-point scores: 63.87, 6.66,
   and 21.22 respectively.

The accepted 14-project registry fixture and all canonical UUIDs are unchanged.
Batch 0E has not started.
