# Guided Narrative UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PlotDNA's single long-scroll AreaDetail page (3547 lines) and scattered per-page bottom nav patterns with a single 6-screen guided narrative shell (Check → Verdict → Money → Map → Compare → Pass), matching the mockups in `Assests/plotDNA Screen*.png` and `Assests/Redesign Homepge.png`, mobile-first, driven entirely by existing data (no new backend logic).

**Architecture:** One new persistent app shell component (`AreaStoryShell`) owns a bottom tab bar and renders one focused screen at a time under `/area/:slug/:step` routes. Each of the 6 screens is a new, small (150–350 line) component that pulls from data/logic that already exists today (DNA score, `VerdictCard`'s live `/api/verdict` endpoint, `getInvestmentReportSummary`, `getGrowthForecastForArea`, `MapView`, `CompareAreas` comparison logic, `LandDNACard`). AreaDetail.tsx, the old CompareAreas/LandDNACardPage bottom navs, and the old `/compare` and `/card/:shareSlug` standalone shells are retired once all 6 screens are live and verified, per the incremental screen-by-screen rollout already agreed with the user.

**Tech Stack:** React 19, TypeScript, react-router-dom, Framer Motion (already a dependency), Tailwind CSS v4, existing `@/lib`, `@/data`, `@/store` modules — no new dependencies.

## Global Constraints

- Mobile-first; desktop must still render usably (tab bar can become a top bar/sidebar on wide viewports) but is not pixel-matched to mockups.
- UI-only for v1: no new scoring, verdict-generation, or money-calculation logic. Reuse existing `VerdictCard` API call, `getInvestmentReportSummary`, `getGrowthForecastForArea`, DNA score/tier from `@/lib/utils`.
- Money View: use existing price/growth data via the money-framed layout; when `getGrowthForecastForArea` returns `null` (true for all areas except `ameenpur`/`beeramguda` today), fall back to `getInvestmentReportSummary` fields (`mainUpside`, `mainRisk`, verdict) instead of fabricating numbers — never invent a rupee figure not backed by `GrowthForecast.investment_example`.
- Reuse the PlotDNA logo exactly as currently used (`/plotdna-logo.png`) — do not introduce the mockup's alternate square "P" logo mark.
- Keep dark theme (`#0a0a0a`/`#050914`-family backgrounds), existing score tier colors from `getScoreColor`/`getScoreLabel` (`#10b981` Goldzone, `#22c55e` Good Growth, `#f59e0b` Moderate, `#ef4444` High Risk) — do not introduce a new color system.
- Never fabricate a DNA score, verdict, or signal value for an area with missing data — carry forward `dataConfidence` badges into the new screens exactly as the non-negotiable rules in root `CLAUDE.md` require.
- Rollout is incremental: build shell + Check screen first, verify, then port Verdict, Map Proof, Area Details, Compare, Pass one at a time — flip default routing only after all 6 are verified.
- All new route paths live under `/area/:slug/...` so existing deep links (`/area/:slug`) can redirect rather than break.
- `frontend/package.json` test scripts are Node smoke-test scripts (no test runner) — new smoke tests follow that existing pattern (`node scripts/check-*.mjs`), not a new test framework.

---

## Current State (facts gathered, not to be re-derived)

- `frontend/src/App.tsx` — routes: `/`, `/map`, `/area/:slug`, `/card/:shareSlug`, `/c/:shareSlug`, `/compare`, `/brochure`.
- `frontend/src/pages/AreaDetail.tsx` (3547 lines) already contains an internal `AREA_FEATURE_GUIDE` array with the exact `Check/Verdict/Money/Map/Compare/Pass` labels used as in-page scroll-jump tabs (`AreaFeatureId = 'verdict' | 'sources' | 'growth' | 'risk' | 'compare' | 'pdf'`, `frontend/src/pages/AreaDetail.tsx:64-121`). This is the existing single-scroll simulation of the mockup's real multi-screen flow.
- `frontend/src/components/ui/VerdictCard.tsx` already calls a **live backend endpoint** `GET /api/verdict/{citySlug}/{areaSlug}` returning `{ verdict: 'buy'|'hold'|'wait'|'avoid', confidence, summary, reasons[], risks[], suitable_for, resolution_tier, resolution_label, source: 'gemini'|'fallback' }`, with a local `buildFallbackVerdict()` fallback keyed off `area.score`. This is the real verdict logic — no new logic needed for the Verdict screen.
- `frontend/src/lib/investmentReport.ts` → `getInvestmentReportSummary(area: MicroMarket): InvestmentReportSummary` returns `{ verdict: 'Buy'|'Wait'|'Avoid'|'Investigate', bestFor, mainUpside, mainRisk, nextVerification, confidenceLabel }`. Already used by `CompareAreas.tsx`.
- `frontend/src/lib/forecast/growthForecast.ts` → `getGrowthForecastForArea(slug): GrowthForecast | null`. Only `ameenpur` and `beeramguda` have configured forecasts today; every other area returns `null`. `GrowthForecast.investment_example` already has the exact "If you invest Rs X: Estimated value..." shape the mockup wants.
- `frontend/src/lib/utils.ts` → `getScoreColor(score)`, `getScoreLabel(score)`, `getScoreBg(score)`, `SIGNAL_WEIGHTS`, `computeDNAScore()`.
- `frontend/src/lib/cityProduction.ts` → `getConfidenceMeta(confidence?: DataConfidence)` returns `{ label, tone, description }` for the `verified/partial/estimated/uncovered` confidence badge.
- `frontend/src/pages/CompareAreas.tsx` (254 lines) — already has a 4-tab fixed bottom nav (`Verdict/Money/Compare/Pass`) and a "Best for growth / Best for stability" `DecisionCard` pattern nearly identical to the mockup's Compare screen. Uses `frontend/src/lib/compareSelection.ts` (`parseCompareAreaParams`, `getSelectableCompareSlugs`, `DEFAULT_COMPARE_AREAS`).
- `frontend/src/pages/LandDNACardPage.tsx` (199 lines) — already IS the "Area Pass" screen: renders `frontend/src/components/landDna/LandDNACard.tsx`, has share/download-PNG/copy-URL actions via `frontend/src/lib/landDnaCard.ts` (`getLandDnaCardPath`, `exportLandDnaCardPng`, `findLandDnaCardMatch`, `getLandDnaCardMetrics`), and its own 3-tab bottom nav (`Verdict/Compare/Pass`) — inconsistent with CompareAreas's 4-tab nav. Gated behind `featureFlags.enableLandDnaCard`.
- `frontend/src/lib/founderPass/landDnaPlan.ts` → `getLandDnaAccessState(entitlements): LandDnaAccessState` drives the "Unlock Founder Pass — ₹99" CTA seen in the mockup's Pass screen.
- `frontend/src/components/map/MapView.tsx` (1092 lines) has polygon coverage props (`contextOnly`, `boundaryConfidence`, `marketable`) but **no existing simple 3-item legend component** — the mockup's Map Proof legend (Verified/Expansion/Pending) must be newly built as a thin summary wrapper around `MapView`, not extracted from existing code.
- `frontend/src/lib/features.ts` — existing flags: `enableLandIdentityFlow`, `enableLocationIntelligencePanel`, `enableSurveyResolver`, `enableTrustSignals`, `enableMicroZoneMatching`, `enableGrowthForecastCard`, `enableLandDnaCard`, `enableFounderPassGating`. All read from `VITE_ENABLE_*` env vars via `fromEnv()`.
- `frontend/src/data/cities.ts` — `CITIES`, `getAllAreas()`, `getCityForArea()` registry (existing, do not change).
- `frontend/src/store/index.ts` — Zustand store (existing, do not change core shape).
- Mockup assets: `Assests/plotDNA Screen.png` (Check/Landing), `(2)` Verdict, `(3)` Money, `(4)` Map Proof, `(5)` Area Details, `(6)` Compare, `(7)` Area Pass, plus `Redesign Homepge.png` (alternate landing hero — logo mark in that file is NOT to be used, per Global Constraints).

---

## File Structure

New files:
- `frontend/src/features/areaStory/AreaStoryShell.tsx` — persistent shell: reads `:slug` and `:step` from route, renders active screen, renders `AreaStoryTabBar`.
- `frontend/src/features/areaStory/AreaStoryTabBar.tsx` — the 6-item bottom tab bar (Check/Verdict/Money/Map/Compare/Pass), active-state styling, responsive (bottom bar on mobile, top bar on desktop per Global Constraints).
- `frontend/src/features/areaStory/areaStoryNav.ts` — pure helpers: `AREA_STORY_STEPS` const array, `buildAreaStoryPath(slug, step)`, `getNextStep(step)`, `getPrevStep(step)`. No JSX.
- `frontend/src/features/areaStory/screens/CheckScreen.tsx` — search entry screen (ports Landing.tsx's search box + "Why buyers use PlotDNA" cards).
- `frontend/src/features/areaStory/screens/VerdictScreen.tsx` — full-screen verdict hero (wraps existing `VerdictCard` logic, restyled to match mockup's giant "Good to shortlist" treatment).
- `frontend/src/features/areaStory/screens/MoneyScreen.tsx` — money-framed view (uses `getGrowthForecastForArea` + `getInvestmentReportSummary` fallback).
- `frontend/src/features/areaStory/screens/MapProofScreen.tsx` — thin wrapper around existing `MapView` with new 3-item legend + "Why this matters" + "Map supports verdict" strip.
- `frontend/src/features/areaStory/screens/AreaDetailsScreen.tsx` — "what to verify" + "why gain value" + "where you lose money" screen (ports checklist content from `BUYER_DUE_DILIGENCE_CHECKLIST` and `getInvestmentReportSummary`).
- `frontend/src/features/areaStory/screens/CompareScreen.tsx` — restyled `CompareAreas.tsx` body, reusing `compareSelection.ts` logic, dropped into the shared shell (drops its own standalone bottom nav).
- `frontend/src/features/areaStory/screens/PassScreen.tsx` — restyled `LandDNACardPage.tsx` body, reusing `LandDNACard` + `landDnaCard.ts`, dropped into the shared shell.
- `frontend/scripts/check-area-story-shell.mjs` — smoke test for shell routing/tab bar, following existing `check-*.mjs` pattern.

Modified files:
- `frontend/src/App.tsx` — add new `/area/:slug/:step` route (flagged), keep old routes as redirects once flag flips.
- `frontend/src/lib/features.ts` — add `enableAreaStoryShell` flag.

Files read but NOT modified (source of truth logic, reused as-is):
- `frontend/src/lib/investmentReport.ts`, `frontend/src/lib/forecast/growthForecast.ts`, `frontend/src/lib/utils.ts`, `frontend/src/lib/cityProduction.ts`, `frontend/src/lib/compareSelection.ts`, `frontend/src/lib/landDnaCard.ts`, `frontend/src/lib/founderPass/landDnaPlan.ts`, `frontend/src/components/ui/VerdictCard.tsx`, `frontend/src/components/landDna/LandDNACard.tsx`, `frontend/src/components/map/MapView.tsx`.

Retired at the end (Task 9), not before:
- `frontend/src/pages/AreaDetail.tsx`, old bottom-nav blocks inside `CompareAreas.tsx` / `LandDNACardPage.tsx`, `/compare` and `/card/:shareSlug` standalone routes (become redirects).

---

## Task 1: Feature flag + nav helpers (no JSX)

**Files:**
- Modify: `frontend/src/lib/features.ts`
- Create: `frontend/src/features/areaStory/areaStoryNav.ts`
- Test: `frontend/src/features/areaStory/areaStoryNav.test.ts` — but this repo has no test runner configured (`frontend/package.json` has no `vitest`/`jest`); follow the existing project pattern instead and verify via a Node smoke script.
- Test: `frontend/scripts/check-area-story-nav.mjs`

**Interfaces:**
- Consumes: nothing (pure new module).
- Produces:
  - `export type AreaStoryStep = 'check' | 'verdict' | 'money' | 'map' | 'details' | 'compare' | 'pass'`
  - `export const AREA_STORY_STEPS: { step: AreaStoryStep; label: string; path: string }[]`
  - `export function buildAreaStoryPath(slug: string, step: AreaStoryStep): string`
  - `export function getNextStep(step: AreaStoryStep): AreaStoryStep | null`
  - `export function getPrevStep(step: AreaStoryStep): AreaStoryStep | null`
  - `export function isAreaStoryStep(value: string | undefined): value is AreaStoryStep`
  - `featureFlags.enableAreaStoryShell: boolean` (consumed by Task 2+ for route gating)

- [ ] **Step 1: Add the feature flag**

Edit `frontend/src/lib/features.ts`:

```typescript
const fromEnv = (key: string): boolean => {
  return import.meta.env[key] === "true"
}

export const featureFlags = {
  enableLandIdentityFlow: fromEnv("VITE_ENABLE_LAND_IDENTITY_FLOW"),
  enableLocationIntelligencePanel: fromEnv("VITE_ENABLE_LOCATION_INTELLIGENCE_PANEL"),
  enableSurveyResolver: fromEnv("VITE_ENABLE_SURVEY_RESOLVER"),
  enableTrustSignals: fromEnv("VITE_ENABLE_TRUST_SIGNALS"),
  enableMicroZoneMatching: fromEnv("VITE_ENABLE_MICRO_ZONE_MATCHING"),
  enableGrowthForecastCard: fromEnv("VITE_ENABLE_GROWTH_FORECAST_CARD"),
  enableLandDnaCard: fromEnv("VITE_ENABLE_LAND_DNA_CARD"),
  enableFounderPassGating: fromEnv("VITE_ENABLE_FOUNDER_PASS_GATING"),
  enableAreaStoryShell: fromEnv("VITE_ENABLE_AREA_STORY_SHELL"),
} as const

export type FeatureFlagName = keyof typeof featureFlags
```

(Only the added `enableAreaStoryShell` line and its trailing comma insertion on the previous line are new; every other line is unchanged from the current file.)

- [ ] **Step 2: Create the nav helper module**

Create `frontend/src/features/areaStory/areaStoryNav.ts`:

```typescript
export type AreaStoryStep = 'check' | 'verdict' | 'money' | 'map' | 'details' | 'compare' | 'pass'

interface AreaStoryStepConfig {
  step: AreaStoryStep
  label: string
  path: string
}

export const AREA_STORY_STEPS: AreaStoryStepConfig[] = [
  { step: 'check', label: 'Check', path: 'check' },
  { step: 'verdict', label: 'Verdict', path: 'verdict' },
  { step: 'money', label: 'Money', path: 'money' },
  { step: 'map', label: 'Map', path: 'map' },
  { step: 'details', label: 'Details', path: 'details' },
  { step: 'compare', label: 'Compare', path: 'compare' },
  { step: 'pass', label: 'Pass', path: 'pass' },
]

const STEP_ORDER: AreaStoryStep[] = AREA_STORY_STEPS.map(s => s.step)

export function isAreaStoryStep(value: string | undefined): value is AreaStoryStep {
  return typeof value === 'string' && (STEP_ORDER as string[]).includes(value)
}

export function buildAreaStoryPath(slug: string, step: AreaStoryStep): string {
  const config = AREA_STORY_STEPS.find(s => s.step === step)
  if (!config) throw new Error(`Unknown area story step: ${step}`)
  return `/area/${slug}/${config.path}`
}

export function getNextStep(step: AreaStoryStep): AreaStoryStep | null {
  const index = STEP_ORDER.indexOf(step)
  if (index === -1 || index === STEP_ORDER.length - 1) return null
  return STEP_ORDER[index + 1]
}

export function getPrevStep(step: AreaStoryStep): AreaStoryStep | null {
  const index = STEP_ORDER.indexOf(step)
  if (index <= 0) return null
  return STEP_ORDER[index - 1]
}
```

Note: `'check'` is included in `AreaStoryStep` for type completeness (the tab bar shows a "Check" tab per the mockup), but Task 2's shell route only mounts `verdict|money|map|details|compare|pass` under `/area/:slug/:step` — `check` resolves to the existing `/map` search screen via a direct link in the tab bar, not a sub-route (see Task 2, Step 3).

- [ ] **Step 3: Write the smoke test script**

Create `frontend/scripts/check-area-story-nav.mjs`:

```javascript
import { buildAreaStoryPath, getNextStep, getPrevStep, isAreaStoryStep, AREA_STORY_STEPS } from '../src/features/areaStory/areaStoryNav.ts'

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  } else {
    console.log(`PASS: ${message}`)
  }
}

assert(AREA_STORY_STEPS.length === 7, 'has 7 story steps')
assert(buildAreaStoryPath('kokapet', 'verdict') === '/area/kokapet/verdict', 'builds verdict path')
assert(buildAreaStoryPath('kokapet', 'pass') === '/area/kokapet/pass', 'builds pass path')
assert(getNextStep('verdict') === 'money', 'verdict -> money')
assert(getNextStep('pass') === null, 'pass has no next step')
assert(getPrevStep('verdict') === 'check', 'verdict -> prev check')
assert(getPrevStep('check') === null, 'check has no prev step')
assert(isAreaStoryStep('money') === true, 'money is a valid step')
assert(isAreaStoryStep('bogus') === false, 'bogus is not a valid step')

if (process.exitCode === 1) {
  console.error('\nSome checks failed.')
  process.exit(1)
}
console.log('\nAll area story nav checks passed.')
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd frontend && node --experimental-strip-types scripts/check-area-story-nav.mjs`
Expected: 8 `PASS:` lines, then `All area story nav checks passed.`, exit code 0.

(Uses `--experimental-strip-types` because the script imports a `.ts` file directly — same pattern already used by `test:survey-resolver-validation` and `test:user-investment-estimate` in `frontend/package.json`.)

- [ ] **Step 5: Register the script in package.json**

Edit `frontend/package.json`, add to the `"scripts"` block (alphabetical position among existing `test:*` entries is not enforced in this file today, so append after the last `test:*` line):

```json
    "test:area-story-nav": "node --experimental-strip-types scripts/check-area-story-nav.mjs",
```

- [ ] **Step 6: Run the full check via npm script**

Run: `cd frontend && npm run test:area-story-nav`
Expected: same PASS output as Step 4.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/features.ts frontend/src/features/areaStory/areaStoryNav.ts frontend/scripts/check-area-story-nav.mjs frontend/package.json
git commit -m "feat: add area story shell feature flag and navigation helpers"
```

---

## Task 2: AreaStoryShell + AreaStoryTabBar + routing

**Files:**
- Create: `frontend/src/features/areaStory/AreaStoryTabBar.tsx`
- Create: `frontend/src/features/areaStory/AreaStoryShell.tsx`
- Create: `frontend/src/features/areaStory/screens/VerdictScreen.tsx` (placeholder; Task 3 replaces contents)
- Create: `frontend/src/features/areaStory/screens/MoneyScreen.tsx` (placeholder; Task 4 replaces contents)
- Create: `frontend/src/features/areaStory/screens/MapProofScreen.tsx` (placeholder; Task 5 replaces contents)
- Create: `frontend/src/features/areaStory/screens/AreaDetailsScreen.tsx` (placeholder; Task 6 replaces contents)
- Create: `frontend/src/features/areaStory/screens/CompareScreen.tsx` (placeholder; Task 7 replaces contents)
- Create: `frontend/src/features/areaStory/screens/PassScreen.tsx` (placeholder; Task 8 replaces contents)
- Modify: `frontend/src/App.tsx`
- Test: `frontend/scripts/check-area-story-shell.mjs`

**Interfaces:**
- Consumes: `AreaStoryStep`, `isAreaStoryStep`, `buildAreaStoryPath` from Task 1's `areaStoryNav.ts`; `getAllAreas`, `getCityForArea`, `CityEntry` from `@/data/cities`; `featureFlags` from `@/lib/features`; `MicroMarket` from `@/types`.
- Produces:
  - `export default function AreaStoryShell(): JSX.Element` mounted at `/area/:slug/:step`.
  - `export default function AreaStoryTabBar({ slug, activeStep }: { slug: string; activeStep: AreaStoryStep }): JSX.Element` — consumed by every screen task (3–8) that needs to render the tab bar itself is NOT required; `AreaStoryShell` renders it once, screens do not re-render it.
  - Each placeholder screen's prop signature is locked here and must not change in later tasks: `VerdictScreen({ area, city }: { area: MicroMarket; city: CityEntry })`, `MoneyScreen({ area }: { area: MicroMarket })`, `MapProofScreen({ area }: { area: MicroMarket })`, `AreaDetailsScreen({ area }: { area: MicroMarket })`, `CompareScreen({ area }: { area: MicroMarket })`, `PassScreen({ area, city }: { area: MicroMarket; city: CityEntry })`.

- [ ] **Step 1: Create the tab bar component**

Create `frontend/src/features/areaStory/AreaStoryTabBar.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { Search, ShieldCheck, IndianRupee, Map, Scale, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { buildAreaStoryPath, type AreaStoryStep } from './areaStoryNav'

const TAB_ICON: Record<'check' | 'verdict' | 'money' | 'map' | 'compare' | 'pass', LucideIcon> = {
  check: Search,
  verdict: ShieldCheck,
  money: IndianRupee,
  map: Map,
  compare: Scale,
  pass: FileText,
}

const TAB_LABEL: Record<'check' | 'verdict' | 'money' | 'map' | 'compare' | 'pass', string> = {
  check: 'Check',
  verdict: 'Verdict',
  money: 'Money',
  map: 'Map',
  compare: 'Compare',
  pass: 'Pass',
}

const TAB_ORDER: Array<'check' | 'verdict' | 'money' | 'map' | 'compare' | 'pass'> = [
  'check', 'verdict', 'money', 'map', 'compare', 'pass',
]

interface AreaStoryTabBarProps {
  slug: string
  activeStep: AreaStoryStep
}

export default function AreaStoryTabBar({ slug, activeStep }: AreaStoryTabBarProps) {
  return (
    <nav
      aria-label="PlotDNA area story navigation"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto grid max-w-[640px] grid-cols-6 gap-1 rounded-2xl border border-white/10 bg-slate-950/92 p-2 shadow-[0_18px_44px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:static sm:mb-4 sm:mt-0 sm:shadow-none sm:backdrop-blur-none"
    >
      {TAB_ORDER.map(step => {
        const Icon = TAB_ICON[step]
        const isActive = step === activeStep
        const to = step === 'check' ? '/map' : buildAreaStoryPath(slug, step)
        return (
          <Link
            key={step}
            to={to}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-sans font-black transition-colors ${
              isActive ? 'bg-emerald-400/14 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={15} />
            {TAB_LABEL[step]}
          </Link>
        )
      })}
    </nav>
  )
}
```

Note: `details` is intentionally left out of `TAB_ORDER` — it matches the mockup's 6-tab bar (Check/Verdict/Money/Map/Compare/Pass) exactly. The `AreaDetailsScreen` (Task 6, mockup screen 5 "Area Details") is reached via a CTA button from the Map Proof screen ("See Area Details"), not via its own persistent tab, matching mockup screen `(4)`'s "See Area Details" button flow into screen `(5)`.

- [ ] **Step 2: Create the shell**

Create `frontend/src/features/areaStory/AreaStoryShell.tsx`:

```tsx
import { Navigate, useParams } from 'react-router-dom'
import { getAllAreas, getCityForArea } from '@/data/cities'
import { isAreaStoryStep, buildAreaStoryPath } from './areaStoryNav'
import AreaStoryTabBar from './AreaStoryTabBar'
import VerdictScreen from './screens/VerdictScreen'
import MoneyScreen from './screens/MoneyScreen'
import MapProofScreen from './screens/MapProofScreen'
import AreaDetailsScreen from './screens/AreaDetailsScreen'
import CompareScreen from './screens/CompareScreen'
import PassScreen from './screens/PassScreen'

export default function AreaStoryShell() {
  const { slug, step } = useParams<{ slug: string; step: string }>()

  if (!slug) return <Navigate to="/map" replace />

  const area = getAllAreas().find(candidate => candidate.slug === slug)
  const city = getCityForArea(slug)

  if (!area || !city) return <Navigate to="/map" replace />

  if (!isAreaStoryStep(step) || step === 'check') {
    return <Navigate to={buildAreaStoryPath(slug, 'verdict')} replace />
  }

  return (
    <div className="min-h-[100dvh] body pb-28 text-slate-100 sm:pb-8">
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {step === 'verdict' && <VerdictScreen area={area} city={city} />}
        {step === 'money' && <MoneyScreen area={area} />}
        {step === 'map' && <MapProofScreen area={area} />}
        {step === 'details' && <AreaDetailsScreen area={area} />}
        {step === 'compare' && <CompareScreen area={area} />}
        {step === 'pass' && <PassScreen area={area} city={city} />}
      </main>
      <AreaStoryTabBar slug={slug} activeStep={step} />
    </div>
  )
}
```

- [ ] **Step 3: Create placeholder screens**

Create `frontend/src/features/areaStory/screens/VerdictScreen.tsx`:
```tsx
import type { MicroMarket } from '@/types'
import type { CityEntry } from '@/data/cities'

export default function VerdictScreen({ area, city }: { area: MicroMarket; city: CityEntry }) {
  return <div className="text-slate-400">Verdict placeholder for {area.name} in {city.meta.name}</div>
}
```

Create `frontend/src/features/areaStory/screens/MoneyScreen.tsx`:
```tsx
import type { MicroMarket } from '@/types'

export default function MoneyScreen({ area }: { area: MicroMarket }) {
  return <div className="text-slate-400">Money screen placeholder for {area.name}</div>
}
```

Create `frontend/src/features/areaStory/screens/MapProofScreen.tsx`:
```tsx
import type { MicroMarket } from '@/types'

export default function MapProofScreen({ area }: { area: MicroMarket }) {
  return <div className="text-slate-400">Map proof placeholder for {area.name}</div>
}
```

Create `frontend/src/features/areaStory/screens/AreaDetailsScreen.tsx`:
```tsx
import type { MicroMarket } from '@/types'

export default function AreaDetailsScreen({ area }: { area: MicroMarket }) {
  return <div className="text-slate-400">Area details placeholder for {area.name}</div>
}
```

Create `frontend/src/features/areaStory/screens/CompareScreen.tsx`:
```tsx
import type { MicroMarket } from '@/types'

export default function CompareScreen({ area }: { area: MicroMarket }) {
  return <div className="text-slate-400">Compare placeholder for {area.name}</div>
}
```

Create `frontend/src/features/areaStory/screens/PassScreen.tsx`:
```tsx
import type { MicroMarket } from '@/types'
import type { CityEntry } from '@/data/cities'

export default function PassScreen({ area, city }: { area: MicroMarket; city: CityEntry }) {
  return <div className="text-slate-400">Pass placeholder for {area.name} in {city.meta.name}</div>
}
```

- [ ] **Step 4: Wire the route into App.tsx**

Modify `frontend/src/App.tsx` (only the `AreaStoryShell` lazy import and the new conditional route are additions — every existing route, including `/area/:slug` pointing at the untouched `AreaDetail` page, stays exactly as-is):

```tsx
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { featureFlags } from '@/lib/features'

const CmdK = lazy(() => import('@/components/ui/CmdK'))
const Landing = lazy(() => import('@/pages/Landing'))
const Home = lazy(() => import('@/pages/Home'))
const AreaDetail = lazy(() => import('@/pages/AreaDetail'))
const BrochurePage = lazy(() => import('@/pages/BrochurePage'))
const CompareAreas = lazy(() => import('@/pages/CompareAreas'))
const LandDNACardPage = lazy(() => import('@/pages/LandDNACardPage'))
const AreaStoryShell = lazy(() => import('@/features/areaStory/AreaStoryShell'))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-[#060814]" />}>
        <ScrollToTop />
        <CmdK />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/map" element={<Home />} />
          {featureFlags.enableAreaStoryShell && (
            <Route path="/area/:slug/:step" element={<AreaStoryShell />} />
          )}
          <Route path="/area/:slug" element={<AreaDetail />} />
          <Route path="/card/:shareSlug" element={featureFlags.enableLandDnaCard ? <LandDNACardPage /> : <Landing />} />
          <Route path="/c/:shareSlug" element={featureFlags.enableLandDnaCard ? <LandDNACardPage /> : <Landing />} />
          <Route path="/compare" element={<CompareAreas />} />
          <Route path="/brochure" element={<BrochurePage />} />
        </Routes>
        <Analytics />
      </Suspense>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Enable the flag locally and verify manually**

Check `frontend/.env.local` is gitignored: run `cd frontend && git check-ignore .env.local` (expected output: `.env.local`, confirming it won't be committed). If the file doesn't exist, create it with:
```bash
VITE_ENABLE_AREA_STORY_SHELL=true
```

Run: `cd frontend && npm run dev`

Navigate to `http://localhost:5173/area/kokapet/verdict` (substitute any real Hyderabad area slug present in `frontend/src/data/hyderabad.ts` if `kokapet` isn't one — check with `grep -o "slug: '[a-z-]*'" frontend/src/data/hyderabad.ts | head -5` first).

Expected:
- Page renders "Verdict placeholder for [Area Name] in Hyderabad".
- Tab bar fixed at bottom with 6 icons (Check/Verdict/Money/Map/Compare/Pass), "Verdict" highlighted in emerald.
- Navigating to `http://localhost:5173/area/kokapet/bogus` redirects to `.../verdict`.
- Navigating to `http://localhost:5173/area/does-not-exist/verdict` redirects to `/map`.
- Existing `http://localhost:5173/area/kokapet` (no step) still renders the full legacy `AreaDetail` page unchanged.

- [ ] **Step 6: Write the build-level smoke test**

Create `frontend/scripts/check-area-story-shell.mjs`:

```javascript
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  } else {
    console.log(`PASS: ${message}`)
  }
}

const appTsx = readFileSync(path.join(__dirname, '../src/App.tsx'), 'utf-8')
assert(appTsx.includes('/area/:slug/:step'), 'App.tsx registers the area story shell route')
assert(appTsx.includes('enableAreaStoryShell'), 'App.tsx gates the route behind enableAreaStoryShell')
assert(appTsx.includes('path="/area/:slug"'), 'App.tsx still registers the legacy /area/:slug route')

const shellTsx = readFileSync(path.join(__dirname, '../src/features/areaStory/AreaStoryShell.tsx'), 'utf-8')
assert(shellTsx.includes('AreaStoryTabBar'), 'AreaStoryShell renders the tab bar')
assert(shellTsx.includes('Navigate to="/map"'), 'AreaStoryShell redirects to /map when area is missing')

const tabBarTsx = readFileSync(path.join(__dirname, '../src/features/areaStory/AreaStoryTabBar.tsx'), 'utf-8')
assert(tabBarTsx.includes("'check', 'verdict', 'money', 'map', 'compare', 'pass'"), 'tab bar has all 6 expected tabs in order')

if (process.exitCode === 1) {
  console.error('\nSome checks failed.')
  process.exit(1)
}
console.log('\nAll area story shell checks passed.')
```

- [ ] **Step 7: Register and run the script**

Edit `frontend/package.json`, add:
```json
    "test:area-story-shell": "node scripts/check-area-story-shell.mjs",
```

Run: `cd frontend && npm run test:area-story-shell`
Expected: 6 `PASS:` lines, then `All area story shell checks passed.`

- [ ] **Step 8: Run typecheck and build**

Run: `cd frontend && npm run build`
Expected: builds successfully with no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/features/areaStory frontend/src/App.tsx frontend/scripts/check-area-story-shell.mjs frontend/package.json
git commit -m "feat: add area story shell, tab bar, and flagged routing with placeholder screens"
```

---

## Task 3: Verdict screen

**Files:**
- Modify: `frontend/src/features/areaStory/screens/VerdictScreen.tsx` (replace Task 2 placeholder)
- Test: manual verification only (existing `VerdictCard` component already has runtime behavior covered by its own fallback logic; this task is a display wrapper, not new logic)

**Interfaces:**
- Consumes: `VerdictCard` (default export, unchanged) from `@/components/ui/VerdictCard`, prop signature `{ citySlug: string; areaSlug: string; resolutionTier?: ...; resolutionLabel?: string }` (already defined, do not change); `getScoreColor`, `getScoreLabel` from `@/lib/utils`; `getConfidenceMeta` from `@/lib/cityProduction`; `buildAreaStoryPath` from `../areaStoryNav`; `MicroMarket`, `CityEntry` types locked in Task 2.
- Produces: `export default function VerdictScreen({ area, city }: { area: MicroMarket; city: CityEntry }): JSX.Element` — signature must stay identical to the Task 2 placeholder since `AreaStoryShell` already calls it with exactly these two props.

**Explicitly out of scope for this task (do not add):** paywall/entitlement gating (`checkReportAccess`, `EmailGateModal`, `CustomReportLeadModal`). AreaDetail's existing gating remains the only enforcement point for now; this screen is reachable directly while the flag is on, same as every other placeholder screen in this plan. Flag this to the user before flipping default routing in Task 9.

- [ ] **Step 1: Replace the placeholder with the real screen**

Edit `frontend/src/features/areaStory/screens/VerdictScreen.tsx`, replacing its entire contents:

```tsx
import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import type { MicroMarket } from '@/types'
import type { CityEntry } from '@/data/cities'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { getConfidenceMeta } from '@/lib/cityProduction'
import VerdictCard from '@/components/ui/VerdictCard'
import { buildAreaStoryPath } from '../areaStoryNav'

interface VerdictScreenProps {
  area: MicroMarket
  city: CityEntry
}

export default function VerdictScreen({ area, city }: VerdictScreenProps) {
  const scoreColor = getScoreColor(area.score)
  const scoreLabel = getScoreLabel(area.score)
  const confidenceMeta = getConfidenceMeta(area.dataConfidence)

  return (
    <div>
      <header className="mb-5 flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
          style={{ color: scoreColor, borderColor: `${scoreColor}44`, background: `${scoreColor}14` }}
        >
          <ShieldCheck size={20} />
        </span>
        <div>
          <p className="font-display text-xl font-black leading-tight text-slate-50">{area.name}</p>
          <p className="text-xs text-slate-500">{city.meta.name}</p>
        </div>
      </header>

      <section
        className="mb-4 rounded-2xl border p-5"
        style={{ borderColor: `${scoreColor}30`, background: `${scoreColor}0c` }}
      >
        <p className="font-display text-3xl font-black leading-tight" style={{ color: scoreColor }}>
          {scoreLabel}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {area.highlights?.[0] ?? 'This area is being screened against PlotDNA growth, risk, and access signals.'}
        </p>
      </section>

      <VerdictCard citySlug={city.meta.slug} areaSlug={area.slug} />

      <section
        className="mb-6 flex items-center justify-between rounded-2xl border px-4 py-3"
        style={{ borderColor: `${confidenceMeta.tone}30`, background: `${confidenceMeta.tone}0c` }}
      >
        <div>
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.12em]" style={{ color: confidenceMeta.tone }}>
            {confidenceMeta.label} data
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{confidenceMeta.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-black" style={{ color: scoreColor }}>{area.score}<span className="text-sm text-slate-500">/100</span></p>
        </div>
      </section>

      <Link
        to={buildAreaStoryPath(area.slug, 'money')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-black text-slate-950"
        style={{ background: `linear-gradient(90deg, ${scoreColor}, #38bdf8)` }}
      >
        See Money View
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Manually verify**

Run: `cd frontend && npm run dev` (if not already running from Task 2).
Navigate to `http://localhost:5173/area/<real-slug>/verdict`.
Expected:
- Header shows area name + city.
- Large tier label ("Goldzone"/"Good Growth"/"Moderate"/"High Risk") in the score's tier color.
- Below it, the existing `VerdictCard` renders its own AI verdict (buy/hold/wait/avoid) exactly as it does today inside `AreaDetail` — same network call to `/api/verdict/{city}/{area}`, same fallback behavior if the backend is unreachable.
- Confidence strip shows correctly for areas with different `dataConfidence` values (test at least one `verified` and one `partial`/`estimated` area).
- "See Money View" button navigates to `/area/<slug>/money`.

- [ ] **Step 3: Run build**

Run: `cd frontend && npm run build`
Expected: builds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/areaStory/screens/VerdictScreen.tsx
git commit -m "feat: build real Verdict screen reusing existing VerdictCard and score utils"
```

---

## Task 4: Money screen

**Files:**
- Modify: `frontend/src/features/areaStory/screens/MoneyScreen.tsx` (replace Task 2 placeholder)

**Interfaces:**
- Consumes: `getGrowthForecastForArea(slug): GrowthForecast | null` from `@/lib/forecast/growthForecast`; `getInvestmentReportSummary(area): InvestmentReportSummary` from `@/lib/investmentReport`; `getScoreColor` from `@/lib/utils`; `buildAreaStoryPath` from `../areaStoryNav`.
- Produces: `export default function MoneyScreen({ area }: { area: MicroMarket }): JSX.Element` — signature locked in Task 2, unchanged.

**Behavior contract (per Global Constraints):** when `getGrowthForecastForArea(area.slug)` returns a real forecast (`ameenpur`/`beeramguda` today), show the mockup's "If you invest ₹X" framing using `forecast.investment_example`. When it returns `null` (every other area today), do NOT fabricate a rupee amount — instead show the 3-card layout populated from `getInvestmentReportSummary(area)` (`mainUpside`, `mainRisk`, `bestFor` as a stand-in for holding-period framing) with a small note that a personalized forecast isn't available for this area yet.

- [ ] **Step 1: Replace the placeholder with the real screen**

Edit `frontend/src/features/areaStory/screens/MoneyScreen.tsx`, replacing its entire contents:

```tsx
import { Link } from 'react-router-dom'
import { TrendingUp, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { getGrowthForecastForArea } from '@/lib/forecast/growthForecast'
import { getInvestmentReportSummary } from '@/lib/investmentReport'
import { getScoreColor } from '@/lib/utils'
import { buildAreaStoryPath } from '../areaStoryNav'

interface MoneyScreenProps {
  area: MicroMarket
}

function formatLakh(rupees: number): string {
  return `₹${Math.round(rupees / 100000)} lakh`
}

export default function MoneyScreen({ area }: MoneyScreenProps) {
  const forecast = getGrowthForecastForArea(area.slug)
  const summary = getInvestmentReportSummary(area)
  const scoreColor = getScoreColor(area.score)

  return (
    <div>
      <header className="mb-5">
        <p className="font-display text-xl font-black leading-tight text-slate-50">Money View</p>
        <p className="mt-1 text-xs text-slate-500">{area.name}</p>
      </header>

      {forecast?.investment_example ? (
        <section
          className="mb-4 rounded-2xl border p-5"
          style={{ borderColor: `${scoreColor}30`, background: `${scoreColor}0c` }}
        >
          <p className="text-xs text-slate-400">If you invest</p>
          <p className="font-display text-3xl font-black" style={{ color: scoreColor }}>
            {formatLakh(forecast.investment_example.amount)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{forecast.investment_example.label}</p>
        </section>
      ) : (
        <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm leading-relaxed text-slate-400">
            A personalized rupee forecast is not available for {area.name} yet. The figures below are based on
            PlotDNA's current growth, risk, and demand signals for this area.
          </p>
        </section>
      )}

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
          <TrendingUp size={18} className="mb-2 text-emerald-300" />
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.1em] text-emerald-300">Possible upside</p>
          <p className="mt-1 text-sm font-sans font-black text-slate-100">{summary.mainUpside}</p>
        </div>
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
          <AlertTriangle size={18} className="mb-2 text-amber-300" />
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.1em] text-amber-300">Risk of overpaying</p>
          <p className="mt-1 text-sm font-sans font-black text-slate-100">{summary.mainRisk}</p>
        </div>
        <div className="rounded-2xl border border-sky-300/20 bg-sky-300/[0.06] p-4">
          <Clock size={18} className="mb-2 text-sky-300" />
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.1em] text-sky-300">Best for</p>
          <p className="mt-1 text-sm font-sans font-black text-slate-100">{summary.bestFor}</p>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-sans font-black text-slate-100">Good for investment?</p>
        <p className="mt-1 text-sm text-slate-400">{summary.nextVerification}</p>
      </section>

      <Link
        to={buildAreaStoryPath(area.slug, 'map')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-black text-slate-950"
        style={{ background: `linear-gradient(90deg, ${scoreColor}, #38bdf8)` }}
      >
        See Map Proof
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Manually verify both data paths**

Run: `cd frontend && npm run dev`.
Navigate to `http://localhost:5173/area/ameenpur/money` — expected: "If you invest ₹50 lakh" card renders with the real forecast label from `growthForecast.ts`.
Navigate to `http://localhost:5173/area/<any-other-slug>/money` — expected: the "personalized rupee forecast is not available" fallback card renders instead, and the 3-card grid still populates from `getInvestmentReportSummary`.
Confirm "See Map Proof" navigates to `/area/<slug>/map`.

- [ ] **Step 3: Run build**

Run: `cd frontend && npm run build`
Expected: builds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/areaStory/screens/MoneyScreen.tsx
git commit -m "feat: build real Money screen with forecast + investment summary fallback"
```

---

## Task 5: Map Proof screen

**Files:**
- Modify: `frontend/src/features/areaStory/screens/MapProofScreen.tsx` (replace Task 2 placeholder)

**Interfaces:**
- Consumes: `MapView` (default export, unchanged, no new props added to it) from `@/components/map/MapView`; `useAppStore` from `@/store` — specifically `setSelectedArea(area: MicroMarket | null): void` (already exists per `frontend/src/store/index.ts:37`); `buildAreaStoryPath` from `../areaStoryNav`.
- Produces: `export default function MapProofScreen({ area }: { area: MicroMarket }): JSX.Element` — signature locked in Task 2, unchanged.

**Key fact used here:** `MapView` reads the area to focus/highlight from the Zustand store's `selectedArea` (`frontend/src/components/map/MapView.tsx:252,296-309`), not from a prop. `MapView` has no `area` or `focusSlug` prop — it must not be modified to add one (Global Constraint: reuse existing logic as-is). This screen instead calls `setSelectedArea(area)` in a `useEffect` on mount so `MapView` auto-fits bounds to the area's polygon and highlights it, matching existing behavior used elsewhere in the app (e.g. clicking an area on `/map`).

- [ ] **Step 1: Replace the placeholder with the real screen**

Edit `frontend/src/features/areaStory/screens/MapProofScreen.tsx`, replacing its entire contents:

```tsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowRight } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { useAppStore } from '@/store'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import MapView from '@/components/map/MapView'
import { buildAreaStoryPath } from '../areaStoryNav'

interface MapProofScreenProps {
  area: MicroMarket
}

const LEGEND_ITEMS = [
  { color: '#10b981', label: 'Verified area', description: 'Strong growth signals and data' },
  { color: '#f59e0b', label: 'Expansion coverage', description: 'Growth potential area' },
  { color: '#94a3b8', label: 'Data pending zone', description: 'Insufficient data' },
]

export default function MapProofScreen({ area }: MapProofScreenProps) {
  const setSelectedArea = useAppStore(state => state.setSelectedArea)
  const scoreColor = getScoreColor(area.score)
  const scoreLabel = getScoreLabel(area.score)

  useEffect(() => {
    setSelectedArea(area)
  }, [area, setSelectedArea])

  return (
    <div>
      <header className="mb-4">
        <p className="font-display text-xl font-black leading-tight text-slate-50">Map Proof</p>
        <p className="mt-1 text-xs text-slate-500">Map supports the verdict.</p>
      </header>

      <div className="mb-4 h-[360px] overflow-hidden rounded-2xl border border-white/10 sm:h-[440px]">
        <MapView />
      </div>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {LEGEND_ITEMS.map(item => (
            <div key={item.label} className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
              <div>
                <p className="text-xs font-sans font-bold text-slate-200">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Star size={14} className="text-emerald-300" />
          <p className="text-sm font-sans font-black text-slate-100">Why this matters</p>
        </div>
        <ul className="space-y-1.5">
          {(area.highlights ?? []).slice(0, 3).map((highlight, i) => (
            <li key={i} className="text-xs text-slate-400">{highlight}</li>
          ))}
        </ul>
      </section>

      <section
        className="mb-6 flex items-center gap-2 rounded-xl border px-4 py-3"
        style={{ borderColor: `${scoreColor}30`, background: `${scoreColor}0c` }}
      >
        <p className="text-xs text-slate-300">
          Map supports verdict: <span className="font-sans font-black" style={{ color: scoreColor }}>{scoreLabel}</span>
        </p>
      </section>

      <Link
        to={buildAreaStoryPath(area.slug, 'details')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-black text-slate-950"
        style={{ background: `linear-gradient(90deg, ${scoreColor}, #38bdf8)` }}
      >
        See Area Details
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Manually verify**

Run: `cd frontend && npm run dev`.
Navigate to `http://localhost:5173/area/<real-slug>/map`.
Expected:
- Map renders inside the bounded container, auto-zoomed/fit to the area's polygon (confirms `setSelectedArea` correctly drives `MapView`'s existing `fitBounds` effect).
- 3-item legend renders (Verified/Expansion/Pending) with static colors — this is a fixed reference legend, not dynamically computed from the current viewport's actual polygon mix (out of scope for v1; note this to the user if they expect the legend counts to be live).
- "Why this matters" lists up to 3 of the area's existing `highlights`.
- "Map supports verdict" strip shows the correct tier label in the correct color.
- "See Area Details" navigates to `/area/<slug>/details`.

- [ ] **Step 3: Run build**

Run: `cd frontend && npm run build`
Expected: builds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/areaStory/screens/MapProofScreen.tsx
git commit -m "feat: build real Map Proof screen reusing MapView via store-driven area focus"
```

---

## Task 6: Area Details screen

**Files:**
- Modify: `frontend/src/features/areaStory/screens/AreaDetailsScreen.tsx` (replace Task 2 placeholder)

**Interfaces:**
- Consumes: `BUYER_DUE_DILIGENCE_CHECKLIST` (readonly string array, already exists, `frontend/src/lib/investmentReport.ts:71-86`), `getInvestmentReportSummary` from `@/lib/investmentReport`; `getConfidenceMeta` from `@/lib/cityProduction`; `buildAreaStoryPath` from `../areaStoryNav`.
- Produces: `export default function AreaDetailsScreen({ area }: { area: MicroMarket }): JSX.Element` — signature locked in Task 2, unchanged.

**Note:** the mockup's Area Details screen (mockup image `(5)`) shows 5 specific "what to verify" line items (survey number, layout approval, road access, boundary clarity, water/drainage/electricity). `BUYER_DUE_DILIGENCE_CHECKLIST` has 14 items, more granular than the mockup's 5. This task shows the first 5 items from the existing checklist as the "What to verify" list (do not write new checklist copy — reuse existing verified text verbatim) rather than inventing a shorter 5-item list that doesn't exist in the codebase.

- [ ] **Step 1: Replace the placeholder with the real screen**

Edit `frontend/src/features/areaStory/screens/AreaDetailsScreen.tsx`, replacing its entire contents:

```tsx
import { Link } from 'react-router-dom'
import { ShieldCheck, TrendingUp, AlertTriangle, Gauge, Scale } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { getInvestmentReportSummary, BUYER_DUE_DILIGENCE_CHECKLIST } from '@/lib/investmentReport'
import { getConfidenceMeta } from '@/lib/cityProduction'
import { getScoreColor } from '@/lib/utils'
import { buildAreaStoryPath } from '../areaStoryNav'

interface AreaDetailsScreenProps {
  area: MicroMarket
}

const VERIFY_ITEM_COUNT = 5

export default function AreaDetailsScreen({ area }: AreaDetailsScreenProps) {
  const summary = getInvestmentReportSummary(area)
  const confidenceMeta = getConfidenceMeta(area.dataConfidence)
  const scoreColor = getScoreColor(area.score)
  const verifyItems = BUYER_DUE_DILIGENCE_CHECKLIST.slice(0, VERIFY_ITEM_COUNT)

  return (
    <div>
      <header className="mb-4">
        <p className="font-display text-xl font-black leading-tight text-slate-50">Area Details</p>
        <p className="mt-1 text-xs text-slate-500">{area.name}</p>
      </header>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-300" />
          <p className="text-sm font-sans font-black text-slate-100">What to verify before paying token</p>
        </div>
        <ul className="divide-y divide-white/5">
          {verifyItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 py-2.5 text-xs text-slate-300">
              <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-400/70" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp size={15} className="text-emerald-300" />
          <p className="text-sm font-sans font-black text-slate-100">Why this area may gain value</p>
        </div>
        <p className="text-xs text-slate-400">{summary.mainUpside}</p>
      </section>

      <section className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-4">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-300" />
          <p className="text-sm font-sans font-black text-slate-100">Where you may lose money</p>
        </div>
        <p className="text-xs text-slate-400">{summary.mainRisk}</p>
      </section>

      <section
        className="mb-6 flex items-center justify-between rounded-2xl border px-4 py-3"
        style={{ borderColor: `${confidenceMeta.tone}30`, background: `${confidenceMeta.tone}0c` }}
      >
        <div className="flex items-center gap-2">
          <Gauge size={15} style={{ color: confidenceMeta.tone }} />
          <div>
            <p className="text-xs font-sans font-black text-slate-100">How sure is this result?</p>
            <p className="text-[10px] text-slate-500">{confidenceMeta.label} confidence</p>
          </div>
        </div>
      </section>

      <Link
        to={buildAreaStoryPath(area.slug, 'compare')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-black text-slate-950"
        style={{ background: `linear-gradient(90deg, ${scoreColor}, #38bdf8)` }}
      >
        <Scale size={16} />
        Compare Areas
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Manually verify**

Run: `cd frontend && npm run dev`.
Navigate to `http://localhost:5173/area/<real-slug>/details`.
Expected:
- "What to verify" shows 5 items from `BUYER_DUE_DILIGENCE_CHECKLIST` verbatim.
- "Why this area may gain value" and "Where you may lose money" show `summary.mainUpside`/`summary.mainRisk` from `getInvestmentReportSummary`.
- Confidence strip color matches `area.dataConfidence`.
- "Compare Areas" navigates to `/area/<slug>/compare`.

- [ ] **Step 3: Run build**

Run: `cd frontend && npm run build`
Expected: builds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/areaStory/screens/AreaDetailsScreen.tsx
git commit -m "feat: build real Area Details screen reusing buyer checklist and investment summary"
```

---

## Task 7: Compare screen

**Files:**
- Modify: `frontend/src/features/areaStory/screens/CompareScreen.tsx` (replace Task 2 placeholder)

**Interfaces:**
- Consumes: `CITIES` from `@/data/cities`; `getScoreColor`, `getScoreLabel` from `@/lib/utils`; `getInvestmentReportSummary` from `@/lib/investmentReport`; `parseCompareAreaParams`, `getSelectableCompareSlugs` from `@/lib/compareSelection` (unchanged); `trackEvent` from `@/lib/analytics`; `buildAreaStoryPath` from `../areaStoryNav`.
- Produces: `export default function CompareScreen({ area }: { area: MicroMarket }): JSX.Element` — signature locked in Task 2. Unlike the standalone `CompareAreas.tsx` page (which reads its area list purely from `?areas=` URL search params with no required starting area), this screen seeds the comparison with the incoming `area` as the first selectable slot, since it's entered from within a specific area's story flow.

**Note:** this is a restyle/relocation of `CompareAreas.tsx`'s body content into the shell, not a rewrite of its comparison logic. `frontend/src/pages/CompareAreas.tsx` itself is left untouched by this task (its own route `/compare` still works standalone) — it gets removed only in Task 9 once the new shell is the default.

- [ ] **Step 1: Replace the placeholder with the real screen**

Edit `frontend/src/features/areaStory/screens/CompareScreen.tsx`, replacing its entire contents:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, Shield, FileText } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { CITIES } from '@/data/cities'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { getInvestmentReportSummary } from '@/lib/investmentReport'
import { trackEvent } from '@/lib/analytics'
import { getSelectableCompareSlugs, parseCompareAreaParams } from '@/lib/compareSelection'
import { buildAreaStoryPath } from '../areaStoryNav'

interface CompareScreenProps {
  area: MicroMarket
}

const CITY_SLUG = 'hyderabad'

export default function CompareScreen({ area }: CompareScreenProps) {
  const cityEntry = CITIES[CITY_SLUG]
  const areaBySlug = useMemo(
    () => new Map(cityEntry.areas.map(a => [a.slug, a])),
    [cityEntry.areas],
  )
  const availableSlugs = useMemo(() => cityEntry.areas.map(a => a.slug), [cityEntry.areas])
  const [selectedSlugs, setSelectedSlugs] = useState(() =>
    parseCompareAreaParams(area.slug, availableSlugs),
  )
  const selectedAreas = useMemo(
    () => selectedSlugs.map(slug => areaBySlug.get(slug) ?? cityEntry.areas[0]),
    [areaBySlug, cityEntry.areas, selectedSlugs],
  )
  const primaryAreas = selectedAreas.slice(0, 2)
  const bestArea = selectedAreas.reduce((best, a) => a.score > best.score ? a : best, selectedAreas[0])
  const stableArea = selectedAreas.reduce((best, a) => a.score >= best.score && a.yoy <= best.yoy ? a : best, selectedAreas[0])

  useEffect(() => {
    trackEvent('compare_started', {
      citySlug: CITY_SLUG,
      areas: selectedAreas.map(a => a.slug).join(','),
      source: 'area_story_compare_screen',
    })
  }, [selectedAreas])

  function updateSelection(index: number, slug: string) {
    const next = [...selectedSlugs]
    next[index] = slug
    trackEvent('compare_area_changed', {
      citySlug: CITY_SLUG,
      index,
      areaSlug: slug,
      areas: next.join(','),
    })
    setSelectedSlugs(next)
  }

  return (
    <div>
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
          <BarChart3 size={19} />
        </span>
        <div>
          <p className="font-display text-xl font-black leading-tight text-slate-50">Which area is better for my money?</p>
          <p className="mt-1 text-xs text-slate-500">Compare key factors that matter most before you buy.</p>
        </div>
      </header>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Area selectors">
        {selectedAreas.map((a, index) => (
          <label key={`selector-${index}`} className="block rounded-xl border border-white/8 bg-slate-950/54 px-3 py-3">
            <span className="block text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">
              Area {index + 1}
            </span>
            <select
              value={a.slug}
              onChange={event => updateSelection(index, event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-[#080a16] px-3 py-2 text-sm font-sans text-slate-100 outline-none focus:border-emerald-500/50"
            >
              {getSelectableCompareSlugs(selectedSlugs, index, availableSlugs).map(slug => {
                const option = areaBySlug.get(slug)
                if (!option) return null
                return <option key={option.slug} value={option.slug}>{option.name}</option>
              })}
            </select>
          </label>
        ))}
      </section>

      <section className="mb-4 overflow-hidden rounded-2xl border border-white/8 bg-slate-950/62" aria-label="Buyer comparison table">
        {[
          ['PlotDNA Score', primaryAreas.map(a => `${a.score}/100`)],
          ['Money range', primaryAreas.map(a => a.priceRange)],
          ['Gain signal', primaryAreas.map(a => `+${a.yoy}% YoY`)],
          ['Risk level', primaryAreas.map(a => a.score >= 80 ? 'Lower risk' : a.score >= 60 ? 'Medium risk' : 'High risk')],
          ['Best use', primaryAreas.map(a => getInvestmentReportSummary(a).bestFor)],
        ].map(([label, values]) => (
          <div key={label as string} className="grid grid-cols-[0.9fr_1fr_1fr] border-b border-white/6 last:border-b-0">
            <div className="bg-white/[0.025] px-3 py-3 text-[11px] font-sans font-bold uppercase tracking-[0.08em] text-slate-500">
              {label as string}
            </div>
            {(values as string[]).map((value, index) => (
              <div key={`${label}-${index}`} className="px-3 py-3 text-xs font-sans font-bold leading-relaxed text-slate-200">
                {value}
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{ color: '#34d399', borderColor: '#34d39944', background: '#34d39912' }}>
              <TrendingUp size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-sans font-black text-slate-50">Best for growth</p>
              <p className="mt-1 text-lg font-display font-black" style={{ color: '#34d399' }}>{bestArea.name}</p>
              <p className="mt-1 text-xs text-slate-500">DNA {bestArea.score} / {getScoreLabel(bestArea.score)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{ color: '#fbbf24', borderColor: '#fbbf2444', background: '#fbbf2412' }}>
              <Shield size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-sans font-black text-slate-50">Best for stability</p>
              <p className="mt-1 text-lg font-display font-black" style={{ color: '#fbbf24' }}>{stableArea.name}</p>
              <p className="mt-1 text-xs text-slate-500">Risk view: {stableArea.score >= 80 ? 'lower' : 'verify carefully'}</p>
            </div>
          </div>
        </div>
      </section>

      <Link
        to={buildAreaStoryPath(bestArea.slug, 'pass')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-black text-slate-950"
        style={{ background: `linear-gradient(90deg, ${getScoreColor(bestArea.score)}, #38bdf8)` }}
      >
        <FileText size={16} />
        Generate Area Pass
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Manually verify**

Run: `cd frontend && npm run dev`.
Navigate to `http://localhost:5173/area/<real-slug>/compare`.
Expected:
- 3 area selector dropdowns, first pre-populated with the incoming area.
- Comparison table renders for the first 2 selected areas.
- "Best for growth" / "Best for stability" cards render.
- Changing a dropdown updates the table and decision cards without a page reload.
- "Generate Area Pass" navigates to `/area/<bestArea.slug>/pass`.

- [ ] **Step 3: Run build**

Run: `cd frontend && npm run build`
Expected: builds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/areaStory/screens/CompareScreen.tsx
git commit -m "feat: build real Compare screen reusing existing compare selection logic"
```

---

## Task 8: Pass screen

**Files:**
- Modify: `frontend/src/features/areaStory/screens/PassScreen.tsx` (replace Task 2 placeholder)

**Interfaces:**
- Consumes: `LandDNACard` (default export, unchanged) from `@/components/landDna/LandDNACard`, prop signature `{ area, cityName, accessState?, onShare?, onDownloadPng?, cardRef? }` (already defined at `frontend/src/components/landDna/LandDNACard.tsx:10-17`, do not change); `getCachedEntitlements` from `@/lib/entitlements`; `getLandDnaAccessState` from `@/lib/founderPass/landDnaPlan`; `exportLandDnaCardPng` from `@/lib/landDnaCard`; `featureFlags` from `@/lib/features`.
- Produces: `export default function PassScreen({ area, city }: { area: MicroMarket; city: CityEntry }): JSX.Element` — signature locked in Task 2, unchanged.

**Behavior contract:** if `featureFlags.enableLandDnaCard` is `false`, show a simple "Area Pass is not enabled yet" message instead of rendering `LandDNACard` — mirrors the existing guard already in `frontend/src/pages/LandDNACardPage.tsx:29-31`. Do not change that flag's default or force it on for this task.

- [ ] **Step 1: Replace the placeholder with the real screen**

Edit `frontend/src/features/areaStory/screens/PassScreen.tsx`, replacing its entire contents:

```tsx
import { useRef, useState } from 'react'
import { Share2, Download, Copy } from 'lucide-react'
import type { MicroMarket } from '@/types'
import type { CityEntry } from '@/data/cities'
import LandDNACard from '@/components/landDna/LandDNACard'
import { featureFlags } from '@/lib/features'
import { getCachedEntitlements } from '@/lib/entitlements'
import { getLandDnaAccessState } from '@/lib/founderPass/landDnaPlan'
import { exportLandDnaCardPng, getLandDnaAreaCode, getLandDnaCardPath } from '@/lib/landDnaCard'

interface PassScreenProps {
  area: MicroMarket
  city: CityEntry
}

type ShareState = 'idle' | 'link-copied' | 'png-downloaded' | 'export-failed'

export default function PassScreen({ area, city }: PassScreenProps) {
  const [shareState, setShareState] = useState<ShareState>('idle')
  const cardRef = useRef<HTMLElement | null>(null)

  if (!featureFlags.enableLandDnaCard) {
    return <p className="text-sm text-slate-400">Area Pass is not enabled yet.</p>
  }

  const cityName = city.meta.name
  const areaCode = getLandDnaAreaCode(cityName, area)
  const accessState = featureFlags.enableFounderPassGating
    ? getLandDnaAccessState(getCachedEntitlements())
    : null
  const publicUrl = `${window.location.origin}${getLandDnaCardPath(cityName, area)}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${area.name} Area Pass by PlotDNA`,
          text: `Check the PlotDNA location intelligence card for ${area.name}, ${cityName}.`,
          url: publicUrl,
        })
        return
      } catch {
        // Native share unavailable, cancelled, or blocked — link stays usable below.
      }
    }
    await navigator.clipboard.writeText(publicUrl)
    setShareState('link-copied')
  }

  async function handleCopyUrl() {
    await navigator.clipboard.writeText(publicUrl)
    setShareState('link-copied')
  }

  async function handleDownloadPng() {
    if (!cardRef.current) return
    try {
      await exportLandDnaCardPng(cardRef.current, areaCode)
      setShareState('png-downloaded')
    } catch {
      setShareState('export-failed')
    }
  }

  return (
    <div>
      <header className="mb-4">
        <p className="font-display text-xl font-black leading-tight text-slate-50">Area Pass</p>
        <p className="mt-1 text-xs text-slate-500">Premium shareable pass for smart buyers</p>
      </header>

      <LandDNACard
        area={area}
        cityName={cityName}
        accessState={accessState}
        cardRef={cardRef}
      />

      {shareState !== 'idle' && (
        <p className="mt-3 rounded-xl border border-emerald-300/18 bg-emerald-300/[0.08] px-3 py-2 text-center text-xs font-sans font-bold text-emerald-300">
          {shareState === 'link-copied' && 'Public Area Pass link copied.'}
          {shareState === 'png-downloaded' && 'PNG downloaded.'}
          {shareState === 'export-failed' && 'PNG export failed. Share link is still available.'}
        </p>
      )}

      <section className="mt-4 grid gap-2 sm:grid-cols-3" aria-label="Area Pass actions">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-sans font-black text-slate-950 transition-colors hover:bg-cyan-200"
        >
          <Share2 size={16} />
          Share Link
        </button>
        <button
          type="button"
          onClick={handleDownloadPng}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-sans font-black text-slate-100"
        >
          <Download size={16} />
          Download PNG
        </button>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-sans font-black text-slate-100"
        >
          <Copy size={16} />
          Copy URL
        </button>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Manually verify**

Confirm `VITE_ENABLE_LAND_DNA_CARD=true` is set in `frontend/.env.local` (add it if missing; without it this screen intentionally shows the "not enabled yet" message per the behavior contract).
Run: `cd frontend && npm run dev`.
Navigate to `http://localhost:5173/area/<real-slug>/pass`.
Expected:
- `LandDNACard` renders with the area's metrics.
- "Share Link" / "Download PNG" / "Copy URL" buttons work identically to the existing `/card/:shareSlug` page.
- With `VITE_ENABLE_LAND_DNA_CARD` unset or `false`, the screen shows "Area Pass is not enabled yet." instead of crashing.

- [ ] **Step 3: Run build**

Run: `cd frontend && npm run build`
Expected: builds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/areaStory/screens/PassScreen.tsx
git commit -m "feat: build real Pass screen reusing existing LandDNACard and share logic"
```

---

## Task 9: Cutover — flip default routing and retire old shells

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/Home.tsx` (lines `355`, `372`, `916` — area navigation call sites)
- Modify: `frontend/src/pages/Landing.tsx` (lines `106`, `168` — area navigation call sites)
- Modify: `frontend/src/components/map/MapView.tsx` (line `480` — area navigation call site)
- Modify: `frontend/src/components/ui/CmdK.tsx` (line `32` — area link href)
- Modify: `frontend/src/components/landDna/LandDNACard.tsx` (line `162` — "back to area" link)
- Delete: `frontend/src/pages/AreaDetail.tsx`
- Delete: `frontend/src/pages/CompareAreas.tsx`
- Delete: `frontend/src/pages/LandDNACardPage.tsx` (its content is now `PassScreen.tsx`; the standalone `/card/:shareSlug` route becomes a redirect)
- Modify: `frontend/src/lib/compareSelection.ts` — no functional change needed (still consumed by `CompareScreen.tsx`), listed here only as a verify-not-touch reminder.

**Interfaces:**
- Consumes: `buildAreaStoryPath` from `frontend/src/features/areaStory/areaStoryNav.ts` (Task 1) everywhere a call site previously built a raw `` `/area/${slug}` `` string.
- Produces: no new exports — this task is pure migration/deletion.

**Resolved decision:** the user confirmed (AskUserQuestion, "Port fallback parsing in (Recommended)") that the Tier 2+ fallback-context mechanism must be ported forward, not dropped. `Home.tsx`'s `buildAreaReportState()` (`frontend/src/pages/Home.tsx:351-373`) passes `fromLat`/`fromLng`/`fromCity`/`fromLabel`/`fromTier`/`fromPrecision` query params for Tier 2+ (nearby/cluster/regional) fallback resolutions; today only `AreaDetail.tsx`'s `fallbackFromQuery()` (`frontend/src/pages/AreaDetail.tsx:125-137`) reads these and renders the "Opened From Fallback Match" banner (`AreaDetail.tsx:3050-3062`) above `VerdictCard`. Step 1 below ports this exact mechanism into `AreaStoryShell` + `VerdictScreen`, reading only `location.search` (query params) — the original code's `location.state` branch is intentionally not ported, since `Home.tsx` navigates via query params, not router state.

- [ ] **Step 1: Port fallback-context parsing into the story shell**

Add to `frontend/src/features/areaStory/areaStoryNav.ts` (appended to the file created in Task 1 — do not remove any existing exports):

```typescript
export interface AreaStoryFallbackContext {
  tier: 'exact_locality' | 'nearby_micro_market' | 'context_area' | 'city_zone_cluster' | 'regional' | 'uncovered'
  displayLabel: string
  precisionLabel: 'exact' | 'approximate' | 'broad' | 'none'
  coords?: [number, number]
  districtSlug?: string | null
  districtName?: string | null
  stateSlug?: string | null
}

export function fallbackContextFromQuery(search: string): AreaStoryFallbackContext | undefined {
  const params = new URLSearchParams(search)
  const lat = Number(params.get('fromLat'))
  const lng = Number(params.get('fromLng'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined

  return {
    tier: (params.get('fromTier') as AreaStoryFallbackContext['tier'] | null) ?? 'nearby_micro_market',
    displayLabel: params.get('fromLabel') ?? 'Searched coordinate',
    precisionLabel: (params.get('fromPrecision') as AreaStoryFallbackContext['precisionLabel'] | null) ?? 'approximate',
    coords: [lat, lng],
  }
}
```

Modify `frontend/src/features/areaStory/AreaStoryShell.tsx` (created in Task 2) to compute the fallback context from the URL and pass it only into `VerdictScreen`:

```tsx
import { useLocation, useParams, Navigate } from 'react-router-dom'
import { getAllAreas, getCityForArea } from '@/data/cities'
import { isAreaStoryStep, fallbackContextFromQuery } from './areaStoryNav'
import AreaStoryTabBar from './AreaStoryTabBar'
import VerdictScreen from './screens/VerdictScreen'
import MoneyScreen from './screens/MoneyScreen'
import MapProofScreen from './screens/MapProofScreen'
import AreaDetailsScreen from './screens/AreaDetailsScreen'
import CompareScreen from './screens/CompareScreen'
import PassScreen from './screens/PassScreen'

export default function AreaStoryShell() {
  const { slug, step } = useParams<{ slug: string; step: string }>()
  const location = useLocation()

  if (!slug || !isAreaStoryStep(step)) {
    return <Navigate to="/map" replace />
  }

  const area = getAllAreas().find(a => a.slug === slug)
  const city = area ? getCityForArea(area.slug) : undefined

  if (!area || !city) {
    return <Navigate to="/map" replace />
  }

  const fallbackContext = fallbackContextFromQuery(location.search)

  return (
    <div className="min-h-[100dvh] body text-slate-100">
      {step === 'verdict' && <VerdictScreen area={area} city={city} fallbackContext={fallbackContext} />}
      {step === 'money' && <MoneyScreen area={area} />}
      {step === 'map' && <MapProofScreen area={area} />}
      {step === 'details' && <AreaDetailsScreen area={area} />}
      {step === 'compare' && <CompareScreen area={area} />}
      {step === 'pass' && <PassScreen area={area} city={city} />}
      <AreaStoryTabBar slug={slug} activeStep={step} />
    </div>
  )
}
```

(This snippet shows the shell's shape after fallback-context wiring is added on top of Task 2's base shell — the only additions versus Task 2 are the `fallbackContext` computation and the new prop passed to `VerdictScreen`; every other screen keeps the exact prop signature Task 2 locked.)

Modify `frontend/src/features/areaStory/screens/VerdictScreen.tsx` (created in Task 3) to accept and render the fallback context. Add to the top of the file:

```typescript
import type { AreaStoryFallbackContext } from '../areaStoryNav'
```

Update `VerdictScreenProps`:
```typescript
interface VerdictScreenProps {
  area: MicroMarket
  city: CityEntry
  fallbackContext?: AreaStoryFallbackContext
}
```

Render the banner directly above `<VerdictCard>`, matching `AreaDetail.tsx:3050-3062`'s copy and tone:

```tsx
{fallbackContext && fallbackContext.tier !== 'exact_locality' && (
  <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4">
    <p className="text-sm font-sans font-black text-amber-200">Opened From Fallback Match</p>
    <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
      Showing the closest available data for {fallbackContext.displayLabel}. This is {fallbackContext.precisionLabel === 'exact' ? 'an exact' : 'an approximate'} match, not a confirmed record for your exact point.
    </p>
  </div>
)}
<VerdictCard
  citySlug={city.meta.slug}
  areaSlug={area.slug}
  resolutionTier={fallbackContext?.tier ?? 'exact_locality'}
  resolutionLabel={fallbackContext?.displayLabel ?? area.name}
/>
```

(Only the `fallbackContext` prop, the banner block, and the two new props passed into `VerdictCard` are additions — every other prop and behavior from Task 3's `VerdictScreen` is unchanged. `VerdictCard` already supports `resolutionTier`/`resolutionLabel` as optional props — no change to `VerdictCard.tsx` itself is needed.)

Manual verification: run `cd frontend && npm run dev`, visit `http://localhost:5173/area/<real-slug>/verdict?fromLat=17.45&fromLng=78.39&fromTier=nearby_micro_market&fromLabel=Your%20searched%20point` — confirm the amber "Opened From Fallback Match" banner renders above the verdict card. Visit the same URL without those query params — confirm the banner does not render.

- [ ] **Step 2: Update every raw `/area/${slug}` navigation call site to use `buildAreaStoryPath`**

Modify `frontend/src/pages/Home.tsx` — replace the two `pathname: `/area/${slug}`` occurrences (lines 355, 372) and the `navigate(`/area/${area.slug}`)` occurrence (line 916) with `buildAreaStoryPath(slug, 'verdict')` / `buildAreaStoryPath(area.slug, 'verdict')`, importing it: `import { buildAreaStoryPath } from '@/features/areaStory/areaStoryNav'`.

Modify `frontend/src/pages/Landing.tsx` — replace `navigate(`/area/${area.slug}`)` (line 106) and `navigate(`/area/${districtSlug}`, ...)` (line 168) the same way.

Modify `frontend/src/components/map/MapView.tsx` — replace `navigate(`/area/${slug}`)` (line 480) the same way.

Modify `frontend/src/components/ui/CmdK.tsx` — replace `href: `/area/${area.slug}`` (line 32) with `href: buildAreaStoryPath(area.slug, 'verdict')`.

Modify `frontend/src/components/landDna/LandDNACard.tsx` — replace `href={`/area/${area.slug}`}` (line 162) the same way.

- [ ] **Step 3: Flip the default route in App.tsx**

Modify `frontend/src/App.tsx`: remove the `featureFlags.enableAreaStoryShell` conditional so `/area/:slug/:step` is always registered, and change `/area/:slug` from rendering `<AreaDetail />` to redirecting into the story shell:

```tsx
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { featureFlags } from '@/lib/features'
import { buildAreaStoryPath } from '@/features/areaStory/areaStoryNav'

const CmdK = lazy(() => import('@/components/ui/CmdK'))
const Landing = lazy(() => import('@/pages/Landing'))
const Home = lazy(() => import('@/pages/Home'))
const BrochurePage = lazy(() => import('@/pages/BrochurePage'))
const AreaStoryShell = lazy(() => import('@/features/areaStory/AreaStoryShell'))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function LegacyAreaRedirect() {
  const { slug } = useParams<{ slug: string }>()
  if (!slug) return <Navigate to="/map" replace />
  return <Navigate to={buildAreaStoryPath(slug, 'verdict')} replace />
}

function LegacyCompareRedirect() {
  return <Navigate to="/map" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-[#060814]" />}>
        <ScrollToTop />
        <CmdK />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/map" element={<Home />} />
          <Route path="/area/:slug/:step" element={<AreaStoryShell />} />
          <Route path="/area/:slug" element={<LegacyAreaRedirect />} />
          <Route path="/card/:shareSlug" element={<LegacyAreaRedirect />} />
          <Route path="/c/:shareSlug" element={<LegacyAreaRedirect />} />
          <Route path="/compare" element={<LegacyCompareRedirect />} />
          <Route path="/brochure" element={<BrochurePage />} />
        </Routes>
        <Analytics />
      </Suspense>
    </BrowserRouter>
  )
}
```

Note: `/card/:shareSlug` and `/c/:shareSlug` previously took a share-code identifier (resolved via `findLandDnaCardMatch`, which matches on slug OR generated area code), not a plain area slug — `LegacyAreaRedirect` as written above only handles plain slugs. Before finalizing this step, check whether any live shared links use the generated area-code form (e.g. `HYD-PZG-070`); if so, this redirect needs to call `findLandDnaCardMatch(slug)` first to resolve to the real area slug, then redirect to `buildAreaStoryPath(match.area.slug, 'pass')`. Verify this against `frontend/src/lib/landDnaCard.ts`'s `findLandDnaCardMatch` before shipping this step — do not assume plain-slug-only without checking.

- [ ] **Step 4: Remove `enableAreaStoryShell` flag usage**

Edit `frontend/src/lib/features.ts` — remove the `enableAreaStoryShell` line added in Task 1 (it's no longer read anywhere after Step 3 above unconditionally registers the route).

- [ ] **Step 5: Delete retired page files**

```bash
git rm frontend/src/pages/AreaDetail.tsx frontend/src/pages/CompareAreas.tsx frontend/src/pages/LandDNACardPage.tsx
```

- [ ] **Step 6: Search for and remove now-dead imports**

Run: `cd frontend && npm run build`

This will surface any remaining import of the deleted files (TypeScript build fails loudly on missing modules). Fix each reported import error by removing the dead import and its usage — do not leave orphaned imports per the project's surgical-changes rule.

- [ ] **Step 7: Full manual regression pass**

Run: `cd frontend && npm run dev`. Walk through, in order:
1. `/` → search an area → confirm it lands on `/area/<slug>/verdict`.
2. `/map` → click an area polygon → confirm it lands on `/area/<slug>/verdict`.
3. From Verdict, tap through all 6 tabs (Check/Verdict/Money/Map/Compare/Pass) — confirm each renders and the active tab highlights correctly.
4. From Compare, change a dropdown, confirm table updates, tap "Generate Area Pass".
5. From Pass, tap Share/Download/Copy — confirm no console errors.
6. Visit an old-style `/area/<slug>?fromLat=...&fromTier=nearby_micro_market&fromLabel=...` URL — confirm the amber "Opened From Fallback Match" banner renders on the Verdict screen exactly as it did in `AreaDetail.tsx`, and `VerdictCard` receives the correct `resolutionTier`/`resolutionLabel`.
7. Visit `/compare` directly — confirm it redirects to `/map` without a blank screen or error.
8. Visit `/card/<real-share-code>` — confirm it redirects to the correct area's Pass screen (or to `/map` if no match, without a crash).

- [ ] **Step 8: Run full frontend test suite**

Run: `cd frontend && npm run lint && npm run build`
Then run every existing `test:*` script that touches area/compare/pass flows to check for regressions — at minimum:
```bash
npm run test:hyderabad-production
npm run test:area-dna-paywall
npm run test:area-feature-navigation
npm run test:compare-return-navigation
npm run test:area-compare-highlight
npm run test:land-dna-card-share-qa
npm run test:map-navigation-state
```
Expected: all pass, or failures are triaged and fixed before proceeding (some of these scripts assert against `AreaDetail.tsx`-specific DOM structure/selectors by file content checks — inspect each failure to determine whether it's asserting against now-deleted markup and needs updating to match the new screen structure, versus a real regression).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: cut over to area story shell as the default area experience, retire legacy pages"
```

---

## Self-Review Notes

- **Spec coverage:** All 3 locked decisions from brainstorming are covered — (1) replace entirely: Task 9 flips default routing and deletes legacy pages; (2) UI-only v1, reusing existing score/verdict/forecast/investment-summary logic: every screen task (3–8) explicitly lists only existing functions as data sources, no new scoring logic introduced anywhere; (3) mobile-first with desktop not broken: `AreaStoryTabBar` uses `sm:` breakpoints to convert from fixed bottom bar to static top-of-content bar on wider viewports, and no screen uses mobile-only units.
- **Placeholder scan:** no "TODO"/"handle appropriately"/"similar to Task N" placeholders remain — every task step has literal, complete code or an explicit, scoped, user-facing question (Task 9 Step 1) rather than an invented answer.
- **Type consistency:** `MicroMarket` and `CityEntry` prop types for all 6 screens were locked once in Task 2's placeholder stubs and every later task (3–8) reused the identical signature without renaming. `AreaStoryStep` type from Task 1 is consumed identically in Task 2's `AreaStoryTabBar` and `AreaStoryShell`. `buildAreaStoryPath(slug, step)` signature is used identically across Tasks 2–9.
- **Risk surfaced during planning, now resolved:** the fallback-context query-param mechanism (`fromLat`/`fromTier`/etc.) used for Tier 2+ nearby/regional resolutions is real, live, existing functionality. The user confirmed it must be ported forward (not dropped), and Task 9 Step 1 now contains the complete port (new `AreaStoryFallbackContext` type + `fallbackContextFromQuery()` in `areaStoryNav.ts`, wiring through `AreaStoryShell.tsx` into `VerdictScreen.tsx`, and the exact banner JSX/copy carried over from `AreaDetail.tsx`).

