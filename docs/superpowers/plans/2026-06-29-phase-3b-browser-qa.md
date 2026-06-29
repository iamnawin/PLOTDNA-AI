# Phase 3B Browser QA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local browser QA automation for the Phase 3B Area Pass share routes before relying on Vercel/mobile manual QA.

**Architecture:** Keep this as a frontend script and package command. The script should build the frontend, start a local preview server, use Playwright only as a dev/runtime QA dependency, visit the required Area Pass routes in desktop and mobile viewports, and assert visible content plus hidden unavailable forecast placeholders.

**Tech Stack:** Vite preview, React routes, Node script, Playwright Chromium, existing `pnpm` scripts.

---

### Task 1: Add Browser QA Script

**Files:**
- Create: `frontend/scripts/check-land-dna-card-browser-qa.mjs`
- Modify: `frontend/package.json`
- Modify: `NEEDED.md`
- Modify: `docs/plotdna-next-phase-handoff.md`

- [ ] **Step 1: Write the failing browser QA script**

Create `frontend/scripts/check-land-dna-card-browser-qa.mjs` with route cases for:

```txt
/card/HYD-PXX-070
/card/HYD-YXX-060
/card/HYD-AXX-075
/card/HYD-BXX-064
/card/peerzadiguda
/c/HYD-PXX-070
```

The script must assert:

```txt
Peerzadiguda route shows Peerzadiguda, Hyderabad, 70 / 100, Infrastructure Readiness, Connectivity Signal.
Yapral route shows Yapral and 60 / 100.
Ameenpur route shows Ameenpur and 75 / 100.
Beeramguda route shows Beeramguda and 64 / 100.
Unavailable placeholders are not visible on Peerzadiguda or Yapral.
Desktop viewport and mobile viewport both load the card.
```

- [ ] **Step 2: Run test to verify it fails before wiring**

Run:

```bash
cd frontend
pnpm run test:land-dna-card-browser-qa
```

Expected: command missing before `package.json` is wired.

- [ ] **Step 3: Wire package script**

Add:

```json
"test:land-dna-card-browser-qa": "node scripts/check-land-dna-card-browser-qa.mjs"
```

- [ ] **Step 4: Add the minimal browser QA implementation**

Use Playwright Chromium from the script. Build first, start `pnpm run preview -- --host 127.0.0.1 --port 4174`, wait for `http://127.0.0.1:4174`, then run the route assertions in desktop and mobile contexts. Always stop the preview process.

- [ ] **Step 5: Run focused validation**

Run:

```bash
cd frontend
pnpm run test:land-dna-card-browser-qa
pnpm run test:land-dna-card-share-qa
pnpm run test:phase-3-live-qa-readiness
```

Expected: all pass.

- [ ] **Step 6: Run repo validation**

Run:

```bash
cd frontend
pnpm run lint
pnpm run build
cd ..
git diff --check
```

Expected: all pass. Existing Vite large chunk warnings are acceptable.

- [ ] **Step 7: Commit and push**

Run:

```bash
git add frontend/scripts/check-land-dna-card-browser-qa.mjs frontend/package.json NEEDED.md docs/plotdna-next-phase-handoff.md docs/superpowers/plans/2026-06-29-phase-3b-browser-qa.md
git commit -m "Add Phase 3B browser QA" -m "Constraint: Browser QA only; no Phase 4 or TimesFM work." -m "Confidence: High - validates Area Pass routes in desktop and mobile preview." -m "Tested: pnpm run test:land-dna-card-browser-qa; pnpm run test:land-dna-card-share-qa; pnpm run test:phase-3-live-qa-readiness; pnpm run lint; pnpm run build; git diff --check"
git push origin main
```

Expected: branch pushes to `main` for Vercel auto-deploy.
