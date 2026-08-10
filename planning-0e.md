# FlatDNA Phase 0 - Batch 0E Implementation Plan

Status: BATCH 0E ACCEPTED
Scope: feature-gated backend project-search API integration only
Last updated: 2026-08-09
Depends on: accepted Batch 0A, 0B, 0C, and 0D
Authoritative implementation plan for Batch 0E: this file

## 1. Goal and requirements summary

Expose the accepted deterministic FlatDNA resolver through the smallest safe backend
HTTP contract:

```text
GET /api/v1/flat/projects/search?q=<project-name>
```

The endpoint searches only the accepted Hyderabad `SUPPORTED` registry in Postgres,
preserves the resolver's `MATCHED`, `AMBIGUOUS`, and `NOT_FOUND` decisions, and returns
only canonical identity context needed by a future client. It does not expose a
public frontend, Project DNA, evidence, RERA lookup, pricing, valuation, or a project
detail API.

The implementation must preserve these accepted boundaries:

- the router-level `ENABLE_FLAT_DNA` dependency remains the sole authoritative
  backend gate (`backend/app/api/routes/flat.py:6-14`);
- the router remains mounted at `/api/v1/flat` (`backend/app/main.py:40-57`);
- database construction stays explicit and lazy (`backend/app/services/flatdna/database.py:8-16`);
- candidate reads remain `SUPPORTED`-only, exclude inactive developers, and include
  only active aliases (`backend/app/services/flatdna/repository.py:71-99`);
- resolution continues through `project_identities_from_rows()` and
  `resolve_project()` without copied route-level matching logic
  (`backend/app/services/flatdna/resolver.py:68-169`);
- the accepted thresholds stay 90.00 / 75.00 / 12.00 and the locked 59-case corpus
  stays unchanged (`backend/app/services/flatdna/resolver.py:11-14`,
  `backend/tests/test_flatdna_resolver.py:65-123`);
- the accepted 14-project fixture, stable UUIDs, schema, and migrations are not
  modified (`planning-0d.md:595-628`).

## 2. Endpoint list

### Implement in Batch 0E

| Method and path | Purpose | Auth | Feature gate |
| --- | --- | --- | --- |
| `GET /api/v1/flat/projects/search` | Resolve one submitted project-name query against supported Hyderabad projects. | Public/anonymous | Existing router-level `ENABLE_FLAT_DNA` guard |
| `GET /api/v1/flat/status` | Existing Batch 0A boundary; behavior and payload remain unchanged. | Public/anonymous | Existing router-level `ENABLE_FLAT_DNA` guard |

### Explicitly defer

`GET /api/v1/flat/projects/{project_id}` is deferred. Search already returns the
identity fields required to select or confirm a project. Batch 0E has no public UI,
Project DNA continuation, or other consumer that needs a second read. Adding detail
now would either duplicate the search identity payload or prematurely expose
coordinates, aliases, RERA references, and evidence. Reconsider it in Phase 1 when a
confirmed project selection has a real downstream Project DNA use case.

No route is added for admin validation; the accepted local/CI validation and import
CLIs remain the internal review surface.

## 3. Exact request contract

```http
GET /api/v1/flat/projects/search?q=Aparna%20Sarovar
```

`q` is the only Batch 0E input:

| Case | HTTP behavior | Resolver called? |
| --- | --- | --- |
| Missing `q` | `422 Unprocessable Entity` using FastAPI's normal validation envelope | No |
| `q=` | `422` | No |
| Whitespace-only | Trim, then `422` | No |
| More than 160 characters after outer trim | `422` | No |
| Unicode letters/digits | Accepted and passed to the existing Unicode-aware normalizer | Yes |
| Punctuation around a real name | Accepted; existing normalization handles it | Yes |
| Punctuation/emoji only, producing no normalized identity tokens | `422` | No |
| Normal project name | Accepted | Yes |

Use a route-local Pydantic query model and FastAPI query-model binding, supported by
the pinned FastAPI 0.115.6/Pydantic 2.10.3 dependencies. The model should:

- trim outer whitespace in a `mode="before"` field validator;
- enforce `min_length=1` and `max_length=MAX_QUERY_LENGTH`;
- use the existing `normalize_identity()` only to reject input with no usable
  identity characters;
- return the trimmed original query to `resolve_project()` so the accepted resolver
  remains responsible for canonical normalization and matching.

The maximum is exactly the resolver's existing `MAX_QUERY_LENGTH = 160`, imported
from the resolver module so HTTP and domain limits cannot drift
(`backend/app/services/flatdna/resolver.py:11-14,107-112`). Do not add an ASCII-only
rule, project-name regex, locality requirement, developer requirement, or minimum
token count.

## 4. Response contracts

Use three explicit Pydantic response variants under one discriminated
`FlatProjectSearchResponse` union. Do not return raw dataclasses or loose dictionaries.

### Shared canonical context

`FlatProjectIdentity`:

```json
{
  "project_id": "421c032d-37c5-4e88-8c18-3b1185ac825f",
  "canonical_name": "My Home Nishada",
  "developer_name": "My Home Constructions",
  "city_slug": "hyderabad",
  "locality_slug": "kokapet"
}
```

These five values already exist on accepted `ProjectIdentity`
(`backend/app/services/flatdna/resolver.py:31-41`). Slugs are returned as stored;
Batch 0E must not invent display labels or duplicate locality data.

### `MATCHED`

HTTP 200:

```json
{
  "outcome": "MATCHED",
  "project": {
    "project_id": "421c032d-37c5-4e88-8c18-3b1185ac825f",
    "canonical_name": "My Home Nishada",
    "developer_name": "My Home Constructions",
    "city_slug": "hyderabad",
    "locality_slug": "kokapet"
  },
  "match_type": "ALIAS"
}
```

`match_type` is one of `CANONICAL`, `ALIAS`, or `FUZZY`:

- `FUZZY` only when `ResolverResult.reason == "FUZZY_MATCH"`;
- otherwise use the selected ranked candidate's accepted `match_source`, which is
  `CANONICAL` or `ALIAS` (`backend/app/services/flatdna/resolver.py:44-61,296-329`).

Do not expose `reason`, `matched_label`, score/basis points, thresholds, aliases,
developer UUID, internal normalized values, or evidence.

### `AMBIGUOUS`

HTTP 200:

```json
{
  "outcome": "AMBIGUOUS",
  "candidates": [
    {
      "project_id": "00000000-0000-0000-0000-000000000000",
      "canonical_name": "Example project",
      "developer_name": "Example developer",
      "city_slug": "hyderabad",
      "locality_slug": "nallagandla"
    }
  ]
}
```

The list preserves the resolver's order and is sliced, never re-sorted. It contains
at most five candidates. There is no `project`, `selected_project_id`, score, or
implicit winner.

### `NOT_FOUND`

HTTP 200:

```json
{
  "outcome": "NOT_FOUND",
  "code": "PROJECT_NOT_FOUND"
}
```

It contains no canonical identity, candidates, suggestions, locality analysis, or
AI-generated alternatives. Internal reasons such as `DEVELOPER_ONLY`,
`NO_CONFIDENT_MATCH`, and `NO_SUPPORTED_PROJECTS` remain server implementation
details, not separate public states (`backend/app/services/flatdna/resolver.py:107-169`).

## 5. HTTP status strategy

All three resolver outcomes return HTTP 200 because they are successful evaluations
of a valid query. This makes client handling a single discriminated domain contract
and avoids treating an expected unsupported project as a transport failure.

| Condition | Status | Contract |
| --- | ---: | --- |
| `ENABLE_FLAT_DNA=false` | 404 | Existing `{"detail":"Not Found"}` router guard; conceals disabled surface |
| Invalid/missing query | 422 | Standard FastAPI validation response |
| Valid `MATCHED` | 200 | Matched response |
| Valid `AMBIGUOUS` | 200 | Ambiguous response |
| Valid `NOT_FOUND` | 200 | Not-found domain response |
| Missing `DATABASE_URL` while enabled | 503 | Generic service-unavailable detail |
| PostgreSQL connection/query/schema failure | 503 | Same generic detail; no credentials or SQL text |
| Unexpected application defect | 500 | Let FastAPI's normal error handling apply; do not catch all exceptions |

This deliberately distinguishes disabled capability, invalid HTTP input, valid
negative search, and infrastructure failure.

## 6. Feature-gate behavior

Keep `router = APIRouter(dependencies=[Depends(require_flat_dna_enabled)])` unchanged
as the single gate for both `/status` and `/projects/search`
(`backend/app/api/routes/flat.py:6-14`). Do not add another feature dependency to the
endpoint and do not inspect `VITE_ENABLE_FLAT_DNA` in backend code.

Acceptance checks must prove:

- with the backend flag false, search returns the same 404 as status;
- the repository/engine provider is not called on that disabled request;
- with the backend flag true, status retains its exact Batch 0A payload and search is
  available subject to query/database behavior;
- the default remains false in `Settings` and `.env.example`
  (`backend/app/core/config.py:18-24`).

## 7. Repository and resolver call flow

```text
GET /api/v1/flat/projects/search?q=...
  -> existing router-level feature dependency
  -> Pydantic query validation
  -> lazy cached repository provider
       -> create_flatdna_engine() (constructs Engine; no startup connection)
       -> PostgresFlatProjectRepository
  -> list_supported_project_identity_rows("hyderabad")
  -> project_identities_from_rows(rows)
  -> resolve_project(trimmed_q, projects)
  -> route serialization only
       -> preserve outcome
       -> preserve selected UUID
       -> preserve candidate order
       -> cap AMBIGUOUS candidates at 5
  -> typed response
```

The fixed launch-city slug is `hyderabad`; do not add a city parameter or new setting
for a one-city pilot. The repository already normalizes that slug and enforces the
supported-only/active-alias SQL boundary (`backend/app/services/flatdna/repository.py:71-99`).

Use a standard-library `functools.lru_cache(maxsize=1)` only around construction of
the SQLAlchemy Engine/repository provider. This is process-lifetime connection-pool
reuse, not registry/result caching: it stores no projects, aliases, queries, or
resolver results. The provider must not be invoked at import or application startup.
Tests clear it between environment cases.

At 14 projects, each enabled search performs the existing single ordered identity
query and resolves the immutable snapshot in memory. Add no search cache, Redis,
Elasticsearch, vector database, background refresh, pagination, or new index.

## 8. Database failure behavior

The endpoint maps only known operational failures:

- `FlatDnaDatabaseConfigurationError` from absent `DATABASE_URL` -> HTTP 503;
- SQLAlchemy database/connection errors from the supported identity read -> HTTP 503.

Use a fixed public message such as `FlatDNA project search is temporarily unavailable.`
Do not return exception strings, SQL, hostnames, credentials, or fixture data. Do not
fall back to `registry.json`, `resolver-cases.json`, SQLite, JSONL, Supabase REST, or
an external service.

An available database with zero supported rows continues through the accepted
resolver and returns domain `NOT_FOUND`; this preserves the explicit 0D behavior
(`backend/app/services/flatdna/resolver.py:107-112`,
`backend/tests/test_flatdna_resolver.py:154-158`). A failed query is different and
must return 503.

## 9. Auth, privacy, logging, analytics, and rate limiting

- Keep project search anonymous. It returns public project identity and has no paid or
  user-specific behavior, so adding `require_user_id` would create unnecessary auth
  coupling.
- Do not add a new auth system, entitlement check, free-search consumption, cookie,
  contact capture, or personal-data collection.
- Do not add application logs or analytics events for raw `q`; do not echo `q` in the
  response. Existing architecture notes already prohibit raw Flat search text in
  analytics (`FlatDNA-Architecture.md:91-94`).
- Do not add a one-off rate limiter. The repository has no shared public-GET limiter
  to reuse, and the endpoint stays disabled by default with only 14 candidates.
  Reassess a shared edge/API policy before public enablement if traffic warrants it.
- Because this is a GET query parameter, standard proxy/Uvicorn access logs may still
  contain the URL query string. Project-name text is low sensitivity, but deployment
  log retention/redaction should be reviewed before public rollout; Batch 0E must not
  alter global logging for this one disabled-by-default endpoint.

## 10. Candidate limit

Set `MAX_AMBIGUOUS_CANDIDATES = 5` at the API serialization boundary. Five matches the
previous Phase 0 contract, is enough for user choice, and avoids returning the entire
registry. Do not paginate a maximum-five response.

The resolver still evaluates and ranks the full supported snapshot. The endpoint
slices only after the resolver has selected `AMBIGUOUS`, so outcome, winner safety,
and relative ordering are unchanged.

## 11. Pydantic schema design

Define the small HTTP-only models beside the route in
`backend/app/api/routes/flat.py`, matching current route modules such as
`backend/app/api/routes/auth.py:15-67` and avoiding pollution of the accepted registry
domain models.

| Model | Minimum fields | Notes |
| --- | --- | --- |
| `FlatProjectSearchQuery` | `q: str` | Trim, 1-160 chars, reject normalization-empty input |
| `FlatProjectIdentity` | `project_id: UUID`, `canonical_name: str`, `developer_name: str`, `city_slug: str`, `locality_slug: str` | Shared safe canonical context |
| `FlatProjectMatchedResponse` | `outcome: Literal["MATCHED"]`, `project: FlatProjectIdentity`, `match_type: Literal["CANONICAL", "ALIAS", "FUZZY"]` | Exactly one selected identity |
| `FlatProjectAmbiguousResponse` | `outcome: Literal["AMBIGUOUS"]`, `candidates: list[FlatProjectIdentity]` | Ordered, 1-5 entries in accepted behavior |
| `FlatProjectNotFoundResponse` | `outcome: Literal["NOT_FOUND"]`, `code: Literal["PROJECT_NOT_FOUND"]` | No identity fields |
| `FlatProjectSearchResponse` | discriminated union of the three response models | FastAPI `response_model` contract |

Use UUID fields so Pydantic serializes stable IDs as strings and validates accidental
non-UUID values. Do not expose ORM/database rows directly.

## 12. Test plan and acceptance criteria

### A. Focused API contract tests

Create `backend/tests/test_flatdna_api.py` using `TestClient`, the accepted app, and a
fake repository injected/patched at the lazy provider seam. Use accepted registry
identity rows or construct rows from the accepted bundle; do not add synthetic rows to
the canonical registry.

Required cases:

1. backend flag false returns 404 for search and never constructs/queries a repository;
2. status remains 404 when off and retains the exact 0A payload when on;
3. missing, empty, whitespace-only, 161-character, and punctuation/emoji-only queries
   return 422 without resolver/repository work where FastAPI ordering permits;
4. Unicode project-name input with usable letters is accepted;
5. punctuation-heavy real project input is accepted;
6. exact canonical, approved alias, and realistic typo return `MATCHED`, the locked
   UUID, canonical context, and correct public match type;
7. `Aparna Sarovar` plus at least one other locked ambiguity case return `AMBIGUOUS`,
   no selected project, and candidates in resolver order;
8. an unknown name, an excluded name, and a developer-only name return HTTP 200
   `NOT_FOUND` with no identity/candidates;
9. an artificial ambiguous resolver result with more than five ranked candidates is
   capped at five without reordering;
10. repeated identical requests return byte-equivalent JSON;
11. missing database configuration returns 503 with a redacted fixed message;
12. a SQLAlchemy operational failure returns the same 503 and does not expose the
    underlying exception;
13. source/import contract confirms the route has no fixture, LLM, network client,
    RERA service, external search, analytics, or automatic-alias dependency.

### B. Disposable PostgreSQL API integration

Create `backend/tests/test_flatdna_api_postgres.py`, following the existing unique
schema pattern in `backend/tests/test_flatdna_resolver_postgres.py:34-68`:

1. require `FLATDNA_TEST_DATABASE_URL`; a skip does not count as Batch 0E acceptance;
2. create a unique disposable schema and apply the existing migration;
3. import the unchanged accepted registry with `PostgresFlatProjectRepository`;
4. point the API repository provider at that disposable engine;
5. send all 59 corpus queries through `TestClient`;
6. assert HTTP 200, expected outcome, expected selected UUID, and expected ambiguous
   candidate prefix/order after the API's five-item cap;
7. add a DRAFT project and inactive alias directly in the disposable schema and prove
   neither appears in API results;
8. repeat selected calls to prove deterministic serialization;
9. remove the disposable schema using the already approved down migration/cleanup
   pattern without touching any non-test schema.

### C. Regression suite

From `backend/`:

```powershell
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_api -v
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_api_postgres -v
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_resolver tests.test_flatdna_resolver_postgres tests.test_flatdna_repository -v
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_registry_data tests.test_flatdna_registry_postgres tests.test_flatdna_postgres_integration -v
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
pnpm run lint
pnpm run build
```

From repository root:

```powershell
git diff --check
git status --short
git diff --stat
git diff -- backend/app/api/routes/flat.py backend/tests/test_flatdna_api.py backend/tests/test_flatdna_api_postgres.py docs/FLATDNA_PROJECT_SEARCH_API.md planning-0e.md
```

Acceptance requires no skipped 0E PostgreSQL tests, all 59 API corpus cases passing,
both flags still default off, status unchanged, full backend tests green, listed
PlotDNA/frontend checks green, and no registry/migration/resolver/frontend diff.

## 13. API documentation changes

Create `docs/FLATDNA_PROJECT_SEARCH_API.md` during implementation with only:

- feature-flag prerequisite and disabled 404 behavior;
- method/path and the `q` validation rules;
- the three public response examples above;
- 200/404/422/503 distinction;
- five-candidate ambiguity limit;
- statement that results cover only supported Hyderabad registry projects;
- statement that no valuation, evidence, RERA lookup, or AI fallback occurs.

FastAPI's generated OpenAPI must also show the typed query and discriminated response.
Do not document fixture paths, test credentials, internal resolver scores/reasons, SQL,
or implementation-only error details.

After implementation acceptance, update only the relevant FlatDNA Obsidian overview,
architecture, resolver, Phase 0 plan, and Project Index status notes. Record actual
test results and deviations; do not mark 0E accepted before validation.

## 14. Exact file-level implementation plan

### Modify during implementation

| File | Minimum change |
| --- | --- |
| `backend/app/api/routes/flat.py` | Add route-local Pydantic query/response contracts, lazy repository provider, safe result serialization, known DB-error mapping, and `GET /projects/search`; retain the existing router gate and `/status` behavior. |
| `planning-0e.md` | Append the final implementation/acceptance receipt only after all checks pass. |
| FlatDNA Obsidian notes and `Projects/Project Index.md` | Mark 0E accepted and record the actual public backend contract only after acceptance. |

### Create during implementation

| File | Exact responsibility |
| --- | --- |
| `backend/tests/test_flatdna_api.py` | Focused gate, validation, response, error redaction, candidate limit, determinism, and dependency-boundary tests. |
| `backend/tests/test_flatdna_api_postgres.py` | Real PostgreSQL API-to-repository-to-resolver corpus and supported-only acceptance. |
| `docs/FLATDNA_PROJECT_SEARCH_API.md` | Minimal client-facing endpoint contract and examples. |

### Explicitly unchanged

- `backend/app/main.py`: the router is already mounted at the correct prefix;
- `backend/app/core/config.py`, `.env.example`, frontend flag files, and `render.yaml`;
- `backend/app/services/flatdna/database.py`, `repository.py`, `resolver.py`,
  `models.py`, registry validation/import code, and package exports unless a proven
  implementation blocker requires the smallest documented deviation;
- all migrations and all seven FlatDNA tables;
- `registry.json`, resolver corpus, stable UUIDs, aliases, evidence, and statuses;
- all frontend application code and scripts;
- PlotDNA land/locality resolver, map, seven-step story, auth, payments, analytics,
  scoring, verdict, AVM, RERA, and brochure behavior;
- package/dependency and lock files.

## 15. Risks and mitigations

| Risk | Regression/coupling | Mitigation |
| --- | --- | --- |
| Route bypasses master flag | Could expose unfinished FlatDNA | Reuse unchanged router-level dependency; off test asserts provider is never called. |
| Route reimplements matching | Resolver/API drift and wrong identity | Route only loads rows, calls accepted conversion/resolver, and serializes. Full 59-case API test. |
| Candidate serialization changes rank | Ambiguous UI could present a different first choice | Slice existing tuple without sorting; compare expected corpus IDs. |
| Internal scores/reasons leak | Freezes implementation details and invites false confidence | Public match type only; response-model and exact-key tests. |
| DRAFT/inactive rows leak | Data-integrity failure | Reuse supported-only repository query; real-Postgres injection test. |
| DB failure becomes fake not-found | Conceals deployment failure | Catch configuration/SQLAlchemy failures as 503; no fixture fallback. |
| Empty registry is indistinguishable from genuine no-match | Operational visibility limitation | Preserve accepted 0D semantics for 0E; verify registry import operationally before enablement. Add monitoring only with public rollout. |
| Engine connects during startup | PlotDNA startup regression | Cached provider is called only inside enabled endpoint flow; import/startup tests remain green. |
| One Engine per request exhausts resources | Availability risk | Cache only Engine/repository construction, not search data or results. |
| Raw `q` appears in access logs | Low privacy risk | No app/analytics logging; review edge access-log redaction/retention before public rollout. |
| Public anonymous endpoint is abused | DB load risk when enabled | Keep flag off; one small query; use shared edge/API limits later if measured, not a new bespoke limiter. |
| Old docs imply detail/scores | Contract confusion | New API doc and Obsidian acceptance update explicitly supersede those Phase 0 concepts. |

## 16. Rollback strategy

Batch 0E has no migration and writes no registry data.

1. Set `ENABLE_FLAT_DNA=false` for immediate operational rollback; both `/status` and
   `/projects/search` become 404 while PlotDNA remains available.
2. Revert only the additive search code in `backend/app/api/routes/flat.py` and remove
   the two 0E test files plus API documentation.
3. Revert only the 0E acceptance receipt/status-note changes.
4. Rerun Batch 0A-0D backend/PostgreSQL tests, full backend discovery, the listed
   frontend regressions, build/lint, and `git diff --check`.

The seven-table schema, accepted registry rows/fixture, stable UUIDs, resolver corpus,
and every PlotDNA flow remain intact.

## 17. Explicit non-goals

Batch 0E does not include:

- public FlatDNA frontend search or any frontend API client;
- homepage Plot/Flat selector, `/flat` frontend route, or navigation;
- project-detail endpoint, Project DNA, project evidence UI, or live RERA lookup;
- RERA-identifier resolution or changes to the accepted matching rules;
- market observations, asking-price collection, comparables, valuation, confidence,
  or FlatDNA verdict;
- tower/unit search or Tower/UnitConfiguration tables;
- automatic alias generation/learning or registry mutations;
- auth, entitlement, payment, analytics, or personal-data capture;
- cache of project rows/results, pagination, Redis, Elasticsearch, vector database,
  embedding, LLM, network search, or another datastore;
- new migration, schema change, seed/import, production registry import, or deployment;
- PropertyDNA rename, House/Villa, Commercial, or broader geographic rollout;
- unrelated refactoring or cleanup.

## 18. Recommended Batch 0E implementation slices

### 0E-A - Lock HTTP contracts and validation

- Add failing focused tests for 404/422/200/503 behavior and exact payload shapes.
- Add route-local Pydantic query/response models and serialization helpers.
- Keep `/status` assertions unchanged.

Review gate: contract tests prove invalid input never reaches resolution, all domain
outcomes use HTTP 200, and no internal fields leak.

### 0E-B - Lazy repository-to-resolver wiring

- Add the process-lifetime lazy Engine/repository provider.
- Add the search route using the accepted repository read, row conversion, and resolver.
- Map only known database failures to the redacted 503.

Review gate: flag-off performs no provider/DB work; enabled fake-repository exact,
alias, typo, ambiguity, and not-found tests pass.

### 0E-C - Real PostgreSQL API acceptance

- Apply the unchanged migration in a unique disposable schema.
- Import the unchanged 14-project registry.
- Execute all 59 cases through the HTTP route and verify supported-only behavior,
  stable UUIDs, ranking, and deterministic serialization.

Review gate: no skips; no production schema; no registry, migration, resolver, or
threshold changes.

### 0E-D - Documentation and full regression

- Add the minimal API contract document.
- Run full backend and listed PlotDNA/frontend checks.
- Review the complete diff, defaults, route inventory, and forbidden scope.
- Only after acceptance, append receipts to this plan and Obsidian notes.

Review gate: all checks pass, `git diff --check` passes, `/status` is unchanged,
`/projects/search` is the only new FlatDNA route, and Batch 0F/Phase 1 has not started.

## 19. Final planning decision

Proceed with one endpoint only:

```text
GET /api/v1/flat/projects/search?q=<query>
```

Defer project detail. Reuse the accepted resolver and supported-only PostgreSQL read
exactly as they exist. The recommended first implementation slice is **0E-A - lock
HTTP contracts and validation**, because it freezes the client-visible behavior
before database wiring and prevents accidental exposure of internal resolver details.

Stop after Batch 0E planning. No application code, registry data, migration, resolver,
frontend, or Batch 0F work is authorized by this plan.

## Batch 0E acceptance receipt - 2026-08-09

Batch 0E is implemented and accepted:

- Added only `GET /api/v1/flat/projects/search?q=<query>` to the existing gated
  FlatDNA router. `/api/v1/flat/status` is unchanged and both routes remain 404 when
  `ENABLE_FLAT_DNA=false`.
- The endpoint lazily constructs the accepted PostgreSQL repository, reads supported
  Hyderabad identities only, delegates to the unchanged Batch 0D resolver, and
  returns typed `MATCHED`, `AMBIGUOUS`, or `NOT_FOUND` HTTP 200 responses.
- Missing, empty, whitespace-only, over-160-character, and normalization-empty input
  returns 422. Missing database configuration and SQLAlchemy failures return a fixed,
  redacted 503 with no fixture fallback.
- `MATCHED` exposes only stable UUID, canonical name, developer name, city slug,
  locality slug, and public match type. `AMBIGUOUS` preserves resolver order and caps
  candidates at five. `NOT_FOUND` remains a domain result, not HTTP 404.
- Focused API tests: 12/12 passed. Disposable PostgreSQL API tests: 3/3 passed without
  skips, including all 59 corpus queries and DRAFT/inactive exclusion.
- Complete backend coverage: 127 non-PostgreSQL tests plus 20/20 live PostgreSQL tests
  passed, covering all 147 discovered tests with no failures.
- FlatDNA 0A and PlotDNA frontend smoke checks, lint, production build, and diff check
  passed. No frontend application file changed.
- Two test-only corrections were made during acceptance: the unit ambiguity assertion
  was aligned to the accepted resolver order (Zicon before Zenith), and the PostgreSQL
  corpus assertion now checks the locked ambiguous candidate prefix plus the API's
  five-candidate cap. No resolver threshold, registry, migration, or production data
  changed.
- The corpus contains one punctuation-only resolver case (`!!!`). At the HTTP boundary
  it correctly returns 422 under the approved malformed-query contract; the other 58
  corpus inputs return their accepted 200 domain outcomes.

No project-detail endpoint, public FlatDNA UI, valuation, or Phase 1 work was added.
