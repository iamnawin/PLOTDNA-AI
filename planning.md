# FlatDNA Phase 0 — Batch 0A Implementation Plan

Status: approved scope, planning only
Implementation status: not started
Last updated: 2026-08-09

## Outcome

Batch 0A will add a safe, reversible FlatDNA application boundary with independent frontend and backend feature flags. Both flags default to OFF. The backend flag is authoritative, and the existing PlotDNA product must behave exactly as it does today while the flags are OFF.

This batch is divided into **6 implementation phases**. They are sequential checkpoints inside Batch 0A, not replacements for the approved Phase 0 batches 0A–0F.

## Approved sources of truth

1. Current PlotDNA repository.
2. Existing PlotDNA Obsidian current-state notes.
3. FlatDNA Blueprint v1.1.
4. FlatDNA Phase 0 Implementation Plan.
5. Existing repository conventions and test patterns.

If documentation and executable code disagree, use the current code and record the discrepancy without expanding scope.

## Requirements summary

- Add `VITE_ENABLE_FLAT_DNA=false` through the existing exact-string Vite flag mechanism in `frontend/src/lib/features.ts:1-14`.
- Add `ENABLE_FLAT_DNA: bool = False` through the existing Pydantic settings object in `backend/app/core/config.py:18-103`.
- Establish one empty, versioned backend boundary at `/api/v1/flat/status`.
- Return HTTP 404 from every FlatDNA route while the backend flag is OFF, even if the frontend flag is ON or a caller invokes the endpoint directly.
- When enabled, expose only a truthful Batch 0A status response; do not return fake project or registry data.
- Document both flags as experimental and OFF by default.
- Add focused backend and frontend contract tests, then run current PlotDNA regression checks.
- Do not alter the current homepage, routes, seven-step story, search/map, scoring/verdict, payment, entitlement, auth, or analytics behavior.

## Acceptance criteria

1. With both environment variables absent, the frontend runtime flag and backend setting both evaluate to `false`.
2. Frontend parsing remains exact and case-sensitive: only the literal string `"true"` enables `enableFlatDna`; missing, empty, `false`, `TRUE`, `1`, and unrelated values remain disabled.
3. `GET /api/v1/flat/status` returns 404 while `settings.ENABLE_FLAT_DNA` is false.
4. Changing only `VITE_ENABLE_FLAT_DNA` cannot make a backend route accessible.
5. `GET /api/v1/flat/status` returns 200 only while the backend setting is true, with a minimal response indicating that the empty boundary is enabled and contains no registry functionality.
6. Existing root and health endpoints retain their current response bodies and status codes with the FlatDNA flag both OFF and ON.
7. `frontend/src/App.tsx`, `frontend/src/pages/Landing.tsx`, and `frontend/src/pages/Home.tsx` contain no FlatDNA route, selector, navigation, preload, or API call.
8. The existing route inventory in `frontend/src/App.tsx:40-59` remains unchanged.
9. `AREA_STORY_STEPS.length` remains seven, as currently asserted by `frontend/scripts/check-area-story-nav.mjs:12-20`.
10. No database client, migration, model, registry, resolver, project endpoint, or public UI is introduced.
11. The final diff contains only the files listed in this plan plus this planning document; pre-existing unrelated worktree changes are untouched.
12. Batch 0B does not start until Batch 0A receives a separate review and approval.

## Six implementation phases

### Phase 1 — Baseline and regression guardrails

Goal: capture the current PlotDNA contract before changing startup-critical files.

Actions:

- Record the current branch and worktree state. Preserve the pre-existing changes in `.claude-flow/daemon.pid`, `Assests/plotDNA Screen (2).png`, `CLAUDE.md`, and `Assests/Verdict_screen.png`.
- Run the focused baseline checks listed under Validation before editing.
- Record the current frontend route inventory from `frontend/src/App.tsx:40-59` and backend root/health responses from `backend/app/main.py:61-74`.
- Confirm the current feature flag convention is `import.meta.env[key] === "true"` in `frontend/src/lib/features.ts:1-3`.
- Confirm the backend uses the singleton `settings = Settings()` in `backend/app/core/config.py:18-103` and direct `include_router` calls in `backend/app/main.py:41-57`.

Files changed: none.

Exit check:

- Baseline commands and results are captured.
- Any pre-existing failure is reported before implementation; tests are not weakened.

### Phase 2 — Frontend flag and environment contract

Goal: define FlatDNA availability in the existing flag registry without consuming the flag anywhere in the UI.

Planned changes:

- Modify `frontend/src/lib/features.ts`:
  - add `enableFlatDna: fromEnv("VITE_ENABLE_FLAT_DNA")` to `featureFlags`;
  - reuse `fromEnv`; do not add a parser, hook, provider, or second flag framework.
- Modify `frontend/.env.example`:
  - add `VITE_ENABLE_FLAT_DNA=false` under an experimental FlatDNA comment;
  - state that the flag does not expose a public UI in Batch 0A.

Explicitly untouched:

- `frontend/src/App.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Home.tsx`
- all area-story, search, map, auth, payment, entitlement, scoring, verdict, and analytics implementation files

Exit check:

- Only the exact literal `"true"` enables `enableFlatDna`.
- The flag is declared but has zero production consumers.
- The existing UI route inventory is byte-for-byte unchanged.

### Phase 3 — Backend authoritative setting

Goal: establish a backend-owned master switch that defaults OFF independently of Vite.

Planned changes:

- Modify `backend/app/core/config.py`:
  - add `ENABLE_FLAT_DNA: bool = False` in the app/runtime settings section;
  - rely on the existing Pydantic `BaseSettings` parsing convention;
  - do not add a new settings object or direct `os.getenv` parser.
- Modify root `.env.example`:
  - add `ENABLE_FLAT_DNA=false` under an experimental feature section;
  - explain that the backend flag is authoritative.
- Modify `render.yaml`:
  - declare `ENABLE_FLAT_DNA` with the explicit production default `"false"` so deployment configuration cannot accidentally omit the intended state.

Risk note:

- `backend/app/core/config.py` is imported during application startup. The change must remain a single additive field with no new validation or side effects.

Exit check:

- Missing configuration yields false.
- The application starts normally without any database connection or FlatDNA data dependency.
- Render remains explicitly disabled after deployment.

### Phase 4 — Empty, gated backend boundary

Goal: create the smallest truthful `/api/v1/flat` boundary and prove server-side enforcement.

Planned changes:

- Create `backend/app/api/routes/flat.py`:
  - define an `APIRouter`;
  - apply one router-level dependency that reads `settings.ENABLE_FLAT_DNA` for every request;
  - raise `HTTPException(status_code=404)` while disabled so the experimental surface is unavailable;
  - add only `GET /status`;
  - return a fixed, non-data response such as `{ "status": "enabled", "phase": "0A", "registry": "unavailable" }` while enabled.
- Modify `backend/app/main.py`:
  - import the FlatDNA route module;
  - mount it at `/api/v1/flat` with the `flat` tag, following the existing `/api/v1` convention at `backend/app/main.py:49-55`.

Design decision:

- Mount the router in all environments and enforce the flag with a request-time router dependency. This keeps the route behavior testable without rebuilding the app and ensures every future route inheriting this router is protected. The response is 404 when disabled, matching the approved Phase 0 plan.

Explicitly prohibited:

- no project search or detail routes;
- no registry, models, schemas, services, repository, resolver, RERA integration, fake data, LLM call, database access, or migration;
- no public FlatDNA UI.

Exit check:

- Direct calls receive 404 while OFF.
- The status route alone receives 200 while ON.
- Toggling the backend setting does not affect existing routes.

### Phase 5 — Focused Batch 0A tests

Goal: prove gating behavior and absence of public/product coupling.

Planned changes:

- Create `backend/tests/test_flatdna_phase_0a.py` using the repository's `unittest` and `TestClient` pattern:
  - `Settings` defaults `ENABLE_FLAT_DNA` to false when the env value is absent;
  - `/api/v1/flat/status` returns 404 when false;
  - `/api/v1/flat/status` returns the exact minimal response when true;
  - `/` and `/health` retain their existing responses under both flag states;
  - restore the singleton setting in test cleanup so test order cannot leak state.
- Create `frontend/scripts/check-flatdna-phase-0a.mjs` using the existing static contract-check style:
  - assert the `enableFlatDna` to `VITE_ENABLE_FLAT_DNA` mapping;
  - assert reuse of the exact-string parser;
  - assert the example value is false;
  - assert `App.tsx`, `Landing.tsx`, and `Home.tsx` do not reference `enableFlatDna`, `/flat`, or a FlatDNA API boundary;
  - assert all current `App.tsx` route declarations remain present and no FlatDNA route is added.
- Modify `frontend/package.json`:
  - register `test:flatdna-phase-0a` using `node scripts/check-flatdna-phase-0a.mjs`;
  - make no dependency or lockfile changes.

Testing limitation recorded explicitly:

- The frontend repository uses source-contract scripts rather than a browser/unit test runner for this class of feature. Batch 0A will follow that established pattern and supplement it with build, lint, and existing navigation/search regression scripts.

Exit check:

- New focused tests pass independently.
- Tests fail if the backend guard is removed, the defaults become true, or a public FlatDNA route/UI reference is added.

### Phase 6 — Regression receipt and diff review

Goal: accept Batch 0A only after proving PlotDNA is unchanged and the implementation stayed within scope.

Actions:

- Run every command in the Validation section.
- Inspect `git diff --check`, `git diff --stat`, and the complete diff.
- Confirm no dependency, lockfile, database, migration, generated artifact, application UI, or existing PlotDNA flow file changed.
- Confirm both example/deployment flags remain false.
- Produce the requested 13-part implementation receipt and stop.

Exit check:

- All required checks pass, or the batch is reported blocked with exact failures.
- The final report explicitly confirms Batch 0B has not started.

## Planned file-level change set

| File | Action | Purpose | Risk |
| --- | --- | --- | --- |
| `frontend/src/lib/features.ts` | modify | Add `enableFlatDna` using existing parser | Low; shared flag registry |
| `frontend/.env.example` | modify | Document frontend flag OFF | Low |
| `frontend/scripts/check-flatdna-phase-0a.mjs` | create | Frontend gating/no-public-surface contract | Low |
| `frontend/package.json` | modify | Register focused script | Medium; shared script manifest, no packages changed |
| `backend/app/core/config.py` | modify | Add authoritative backend boolean | Medium; startup-critical settings |
| `backend/app/api/routes/flat.py` | create | Empty guarded boundary and status route | Low; isolated new module |
| `backend/app/main.py` | modify | Mount `/api/v1/flat` router | Medium; central route registration |
| `backend/tests/test_flatdna_phase_0a.py` | create | Backend default/gate/regression tests | Low |
| `.env.example` | modify | Document backend flag OFF | Low |
| `render.yaml` | modify | Keep deployed backend explicitly OFF | Medium; deployment configuration |
| `planning.md` | planning only | Approved execution plan | None to runtime |

No other files are approved for modification in Batch 0A without stopping and reporting a direct blocker.

## Validation commands

Use repository-approved package tooling: `pnpm` for frontend and `uv` for Python. Do not install new dependencies.

### Before implementation

```powershell
git status --short --branch
pnpm --dir frontend run test:area-story-nav
pnpm --dir frontend run test:home-nav-route
pnpm --dir frontend run test:hyderabad-location-search
pnpm --dir frontend run test:hyderabad-production
pnpm --dir frontend run test:email-otp-contract
pnpm --dir frontend run test:verdict-screen-resilience
uv run --project backend python -m unittest discover -s backend/tests -p "test_*.py"
```

### After implementation

```powershell
pnpm --dir frontend run test:flatdna-phase-0a
pnpm --dir frontend run test:area-story-nav
pnpm --dir frontend run test:home-nav-route
pnpm --dir frontend run test:hyderabad-location-search
pnpm --dir frontend run test:hyderabad-production
pnpm --dir frontend run test:email-otp-contract
pnpm --dir frontend run test:verdict-screen-resilience
pnpm --dir frontend run build
pnpm --dir frontend run lint
uv run --project backend python -m unittest backend.tests.test_flatdna_phase_0a -v
uv run --project backend python -m unittest discover -s backend/tests -p "test_*.py"
git diff --check
git diff --stat
git diff
git status --short --branch
```

If the repository's current `uv --project` invocation is unsupported by the installed uv version, run the equivalent command from `backend/` with `uv run python -m unittest ...` and record the deviation. Do not fall back to `pip` or create a new virtual environment.

## Risks and mitigations

| Risk | Impact | Mitigation | Rollback |
| --- | --- | --- | --- |
| Backend flag parsed or defaulted incorrectly | Experimental endpoint becomes accessible | Typed `bool = False`; default test; explicit Render false | Set false and revert the additive setting |
| Guard applied only to the status handler | A later Flat route could bypass protection | Router-level dependency covers every route | Disable flag; remove router mount |
| Shared startup file breaks existing API | PlotDNA outage/regression | Two-line import/mount change; root/health and full backend tests | Revert import/mount; flag remains false |
| Frontend flag is accidentally consumed | Public UI or changed navigation | No edits to App/Landing/Home; source-contract test | Remove flag consumer; frontend flag false |
| Test mutation leaks global settings | Order-dependent backend failures | Save/restore setting with cleanup/finally | Fix isolation before accepting batch |
| Deployment config drifts | Production unintentionally enabled | Explicit `ENABLE_FLAT_DNA: "false"` in Render and example env | Reset Render variable to false |
| Scope expands toward 0B | Premature schema/data coupling | File allowlist and explicit non-goals | Revert all out-of-scope files; stop for review |

## Rollback strategy

1. Operational rollback: set `ENABLE_FLAT_DNA=false`; all FlatDNA calls return 404. Keep `VITE_ENABLE_FLAT_DNA=false` in frontend deployments.
2. Application rollback: revert the new FlatDNA router import/mount and delete only `backend/app/api/routes/flat.py`.
3. Configuration rollback: remove the two additive flags from settings/templates after the route is unmounted.
4. Test rollback: remove only the Batch 0A test module/script and package script entry.
5. No data rollback exists because Batch 0A creates no tables, migrations, registry rows, files, or database connections.

## Exact non-goals

Batch 0A must not create or modify:

- homepage Plot/Flat selector or any public FlatDNA UI;
- Developer, Project, ProjectAlias, RERA, Tower, UnitConfiguration, location, evidence, or registry-status models;
- curated Hyderabad project data or the planned 21-project registry;
- deterministic resolver, fuzzy matching, thresholds, project search, or project detail;
- Supabase/Postgres schema or migration files;
- RERA scraping or `tsrera_scraper.py`;
- market observations, asking prices, comparables, valuation, confidence scoring, or verdicts;
- PropertyDNA rename, House/Villa, Commercial, or geographic rollout;
- cleanup of stale instructions, AVM logic, persistence fragmentation, unused flags, pending-cell data, payments, history subjects, or general architecture.

## Stop conditions

Stop and report rather than broadening scope if:

- implementing the backend gate requires changing auth, entitlements, payments, persistence, scoring, verdict, or existing API contracts;
- a new dependency or database connection appears necessary;
- baseline regression checks fail for reasons unrelated to Batch 0A;
- the required router-level 404 behavior conflicts with a verified existing security convention;
- any file outside the approved change set becomes necessary.

## Implementation receipt required at completion

After implementation, report exactly:

1. Files changed.
2. Frontend flag implementation.
3. Backend flag implementation.
4. FlatDNA backend boundary created.
5. Behavior when flags are OFF.
6. Behavior when flags are ON.
7. Tests added.
8. Tests executed and results.
9. Regression checks.
10. Environment/documentation changes.
11. Deviations from the approved Phase 0 plan and why.
12. Exact git diff summary.
13. Confirmation that Batch 0B has not started.

## Recommended first implementation action

Begin with Phase 1 only: run and record the baseline regression suite and route/config inventory. If that baseline is clean, proceed sequentially through Phases 2–6. Do not start Batch 0B automatically after Batch 0A passes.
