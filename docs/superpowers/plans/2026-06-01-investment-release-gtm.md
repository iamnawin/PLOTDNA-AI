# Investment Release GTM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the smallest Hyderabad-first investment-release funnel that can prove user demand, trust, and paid-report intent before Android launch.

**Architecture:** Keep the existing catalog and area-detail system as the trust base, then add a focused GTM layer around it: investment landing copy, source-backed report evidence, comparison workflow, lead/report CTA, and analytics events. Backend changes should only expose structured report evidence when frontend static/catalog data is not enough.

**Tech Stack:** React, TypeScript, Vite, FastAPI, Pydantic, existing `data/catalog/*.json`, existing frontend area datasets, existing PDF/report utilities.

---

## File Structure

- Modify: `frontend/src/pages/Landing.tsx`
  - Add the Hyderabad investment scanner entry point and sharper positioning.
- Modify: `frontend/src/pages/AreaDetail.tsx`
  - Add visible source-backed report evidence, investment verdict, and report CTA.
- Modify: `frontend/src/lib/recommendations.ts`
  - Centralize Buy/Wait/Avoid style investment verdict copy derived from existing signals.
- Create: `frontend/src/lib/analytics.ts`
  - Lightweight browser-safe event helper with console fallback and future provider boundary.
- Create: `frontend/src/lib/investmentReport.ts`
  - Pure helpers for report confidence, checklist, source labels, and comparison summaries.
- Create: `frontend/src/pages/CompareAreas.tsx`
  - Compare 3 selected Hyderabad areas using existing catalog/static data first.
- Modify: `frontend/src/App.tsx`
  - Add compare route.
- Modify: `frontend/src/components/ui/CmdK.tsx`
  - Link users toward comparison/report workflows where appropriate.
- Test: `frontend/src/lib/investmentReport.test.ts` if the repo has a frontend test harness by then; otherwise validate through `npm run lint` and `npm run build`.
- Modify: `backend/app/api/routes/areas.py`
  - Only if frontend needs a structured report evidence object from backend catalogs.
- Test: `backend/tests/test_market_catalog.py`
  - Extend only if backend report evidence is added.

## Delivery Slices

Each slice should be its own branch, commit, PR, and merge to `main`.

### Task 1: Sharpen Public Positioning

**Files:**
- Modify: `frontend/src/pages/Landing.tsx`

- [ ] **Step 1: Update headline and primary CTA**

Change the landing hero copy to focus on Hyderabad investment screening:

```tsx
const heroTitle = 'Hyderabad Land Investment Scanner'
const heroSubtitle = 'Screen micro-markets, compare risk, and prepare the right verification checklist before you talk to brokers.'
```

Expected UI behavior:
- The first viewport clearly says this is for Hyderabad land/property investment screening.
- The CTA still takes users into the existing search flow.
- No claim says PlotDNA guarantees returns or replaces legal verification.

- [ ] **Step 2: Add beta trust framing**

Add compact text near the CTA:

```tsx
<p className="text-xs text-slate-400">
  Buyer screening only. Verify title, RERA, zoning, and latest pricing independently before committing capital.
</p>
```

- [ ] **Step 3: Run frontend verification**

Run:

```powershell
cd frontend
npm run lint
npm run build
```

Expected:
- ESLint exits with code 0.
- Vite production build exits with code 0.

- [ ] **Step 4: Commit and PR**

Commit message intent:

```text
Position PlotDNA around buyer-side investment screening

The public entry point needs to explain why the product exists before
Android distribution. This keeps the release focused on high-intent
Hyderabad buyers instead of generic app-store browsing.

Constraint: Current product is public-beta ready, not a legal or valuation authority
Rejected: Android-first launch copy | distribution is not proven yet
Confidence: high
Scope-risk: narrow
Tested: npm run lint; npm run build
```

### Task 2: Add Investment Report Helpers

**Files:**
- Create: `frontend/src/lib/investmentReport.ts`
- Modify: `frontend/src/lib/recommendations.ts`

- [ ] **Step 1: Create pure report helper**

Create `frontend/src/lib/investmentReport.ts`:

```ts
import type { MicroMarket } from '@/types'

export type InvestmentVerdict = 'Buy' | 'Wait' | 'Avoid' | 'Investigate'

export interface InvestmentReportSummary {
  verdict: InvestmentVerdict
  bestFor: string
  mainUpside: string
  mainRisk: string
  nextVerification: string
  confidenceLabel: string
}

export function getInvestmentReportSummary(area: MicroMarket): InvestmentReportSummary {
  const confidence = area.dataConfidence ?? 'estimated'
  const score = area.score ?? 0
  const signals = area.signals
  const mainUpside = area.highlights?.[0] ?? 'Location has measurable market signals, but evidence is limited.'

  const legalRisk =
    signals.rera < 45
      ? 'RERA and approval visibility is weak for this market.'
      : 'Project-level title, RERA, and approval status still need independent verification.'

  if (score >= 78 && confidence !== 'estimated') {
    return {
      verdict: 'Buy',
      bestFor: '3-7 year investment shortlist',
      mainUpside,
      mainRisk: legalRisk,
      nextVerification: 'Check exact project approvals, title chain, EC, road access, and current quoted price.',
      confidenceLabel: confidence,
    }
  }

  if (score >= 60) {
    return {
      verdict: 'Investigate',
      bestFor: 'Selective buying after site and document checks',
      mainUpside,
      mainRisk: legalRisk,
      nextVerification: 'Compare at least two nearby areas and verify seller documents before negotiation.',
      confidenceLabel: confidence,
    }
  }

  if (score >= 45) {
    return {
      verdict: 'Wait',
      bestFor: 'Long-horizon watchlist',
      mainUpside,
      mainRisk: 'Infrastructure, demand, or approval signals are not strong enough for fast conviction.',
      nextVerification: 'Wait for stronger infra execution, RERA activity, or price discovery before committing.',
      confidenceLabel: confidence,
    }
  }

  return {
    verdict: 'Avoid',
    bestFor: 'Not recommended without strong local evidence',
    mainUpside,
    mainRisk: 'Current signals are too weak or too uncertain for buyer-side confidence.',
    nextVerification: 'Only proceed if independent legal, access, and pricing checks strongly contradict the model.',
    confidenceLabel: confidence,
  }
}

export const BUYER_DUE_DILIGENCE_CHECKLIST = [
  'RERA registration or written reason RERA does not apply',
  'Mother deed and complete title chain',
  'Latest encumbrance certificate',
  'HMDA, DTCP, or local authority layout approval',
  'Land conversion and zoning permission',
  'Survey number match with physical plot boundaries',
  'Road access width and public/private access status',
  'Lake, forest, nala, buffer, or litigation risk check',
  'Current market quote compared with nearby registered or broker-verified transactions',
] as const
```

- [ ] **Step 2: Reuse helper in recommendation copy**

In `frontend/src/lib/recommendations.ts`, import and use `getInvestmentReportSummary` where investment-oriented recommendation text is generated. Keep the existing public API stable unless changing it is necessary.

- [ ] **Step 3: Verify frontend**

Run:

```powershell
cd frontend
npm run lint
npm run build
```

Expected:
- Both commands pass.

- [ ] **Step 4: Commit and PR**

Commit message intent:

```text
Centralize investment verdict logic for buyer reports

Investment-grade release needs consistent verdict language across pages,
PDFs, and comparison views. A pure helper keeps the decision framing
testable and prevents scattered Buy/Wait/Avoid copy.

Constraint: No new frontend dependencies
Rejected: AI-generated verdict per render | harder to verify and less consistent
Confidence: medium
Scope-risk: moderate
Tested: npm run lint; npm run build
```

### Task 3: Make Area Pages Source-Backed

**Files:**
- Modify: `frontend/src/pages/AreaDetail.tsx`
- Use: `frontend/src/lib/investmentReport.ts`
- Use: `frontend/src/lib/areaSources.ts`

- [ ] **Step 1: Add report confidence block**

On the area detail page, add a compact block near the score summary:

```tsx
const reportSummary = getInvestmentReportSummary(area)
```

Render:

```tsx
<section aria-label="Investment report summary">
  <p>{reportSummary.verdict}</p>
  <p>{reportSummary.bestFor}</p>
  <p>{reportSummary.mainUpside}</p>
  <p>{reportSummary.mainRisk}</p>
  <p>{reportSummary.nextVerification}</p>
</section>
```

Adapt classes to the existing `AreaDetail.tsx` visual system. Do not create nested cards.

- [ ] **Step 2: Add source evidence labels**

Render a "Data basis" row:

```tsx
<span>Catalog profile</span>
<span>OSM proximity signals where available</span>
<span>RERA/proxy activity</span>
<span>{area.dataAsOf ?? 'Current cycle'}</span>
<span>{area.dataConfidence ?? 'estimated'} confidence</span>
```

- [ ] **Step 3: Add due-diligence checklist**

Render `BUYER_DUE_DILIGENCE_CHECKLIST` as a compact checklist near the report/PDF section.

- [ ] **Step 4: Verify frontend**

Run:

```powershell
cd frontend
npm run lint
npm run build
```

Expected:
- Both commands pass.

- [ ] **Step 5: Commit and PR**

Commit message intent:

```text
Make area pages explicit about investment evidence and risk

Buyer trust depends on seeing what the report is based on and what still
needs independent verification. The page now exposes verdict, confidence,
data basis, and due-diligence checks without claiming legal authority.

Constraint: Investment release must remain screening-only
Rejected: Hide caveats behind footer text | users need caveats before acting
Confidence: medium
Scope-risk: moderate
Tested: npm run lint; npm run build
```

### Task 4: Add Compare-3-Areas Workflow

**Files:**
- Create: `frontend/src/pages/CompareAreas.tsx`
- Modify: `frontend/src/App.tsx`
- Use: `frontend/src/data/cityProduction.ts` or existing city dataset exports
- Use: `frontend/src/lib/investmentReport.ts`

- [ ] **Step 1: Create comparison page**

Create a route that defaults to Hyderabad and lets users compare three selected areas. Use existing area data; do not add a backend dependency for this first version.

Minimum UI:
- Three area selectors.
- DNA score.
- Price range.
- YoY.
- Verdict.
- Best for.
- Main risk.
- Data confidence.

- [ ] **Step 2: Add route**

In `frontend/src/App.tsx`, add:

```tsx
<Route path="/compare" element={<CompareAreas />} />
```

Match the existing routing style in the file.

- [ ] **Step 3: Link from landing and area page**

Add text/button links:
- Landing: "Compare Hyderabad areas"
- Area detail: "Compare this area"

Use existing button styling.

- [ ] **Step 4: Verify frontend**

Run:

```powershell
cd frontend
npm run lint
npm run build
```

Expected:
- Both commands pass.

- [ ] **Step 5: Commit and PR**

Commit message intent:

```text
Add comparison workflow for investment shortlisting

Users are more likely to pay when PlotDNA helps them choose between
markets, not just read a single score. The first comparison flow stays
static/catalog-backed to validate demand before deeper backend work.

Constraint: First paid-intent slice should avoid new dependencies
Rejected: Payment-first report flow | comparison demand should be measured first
Confidence: medium
Scope-risk: moderate
Tested: npm run lint; npm run build
```

### Task 5: Add Lead and Report Intent Tracking

**Files:**
- Create: `frontend/src/lib/analytics.ts`
- Modify: `frontend/src/pages/Landing.tsx`
- Modify: `frontend/src/pages/AreaDetail.tsx`
- Modify: `frontend/src/pages/CompareAreas.tsx`

- [ ] **Step 1: Add analytics helper**

Create `frontend/src/lib/analytics.ts`:

```ts
type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

export function trackEvent(name: string, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') return

  const event = {
    name,
    payload,
    at: new Date().toISOString(),
  }

  if (import.meta.env.DEV) {
    console.info('[analytics]', event)
  }

  window.dispatchEvent(new CustomEvent('plotdna:analytics', { detail: event }))
}
```

- [ ] **Step 2: Track funnel events**

Track these events:
- `landing_investment_cta_clicked`
- `area_report_preview_viewed`
- `area_pdf_download_clicked`
- `compare_started`
- `compare_area_changed`
- `custom_report_requested`

Include city slug, area slug, coverage tier, and data confidence when available.

- [ ] **Step 3: Add report CTA**

Add a CTA on area detail:

```tsx
<button type="button" onClick={() => trackEvent('custom_report_requested', { citySlug, areaSlug: area.slug })}>
  Request custom due-diligence report
</button>
```

If no backend exists for this request yet, use `mailto:` or a visible contact path already present in the app. Do not silently swallow the click.

- [ ] **Step 4: Verify frontend**

Run:

```powershell
cd frontend
npm run lint
npm run build
```

Expected:
- Both commands pass.

- [ ] **Step 5: Commit and PR**

Commit message intent:

```text
Instrument buyer report intent before adding payments

The GTM funnel needs evidence that users want reports before building
checkout. Browser-level analytics events keep the boundary lightweight
and provider-agnostic.

Constraint: No analytics vendor is configured yet
Rejected: Add third-party analytics dependency | premature before funnel shape is validated
Confidence: medium
Scope-risk: narrow
Tested: npm run lint; npm run build
```

### Task 6: Add Backend Report Evidence Only If Needed

**Files:**
- Modify: `backend/app/api/routes/areas.py`
- Modify: `backend/app/services/market_catalog.py`
- Test: `backend/tests/test_market_catalog.py`

- [ ] **Step 1: Decide if backend evidence is necessary**

Inspect frontend implementation after Tasks 1-5. If area pages can render source labels from existing `MicroMarket`, `areaSources`, and catalog data, skip this task.

If skipped, record in the PR body:

```text
Backend report evidence endpoint skipped because frontend can render the first investment report evidence model from existing catalog and source-link data.
```

- [ ] **Step 2: Add optional reportEvidence field**

If backend is needed, add a response field to area detail responses:

```python
"reportEvidence": {
    "dataAsOf": area.dataAsOf,
    "dataConfidence": area.dataConfidence,
    "sourceCategories": ["catalog", "rera_proxy", "osm_context"],
    "disclaimer": "Buyer screening only. Verify title, RERA, zoning, and pricing independently before committing capital.",
}
```

- [ ] **Step 3: Extend tests**

Add a test in `backend/tests/test_market_catalog.py` verifying area detail includes `reportEvidence` with `dataAsOf`, `dataConfidence`, and `disclaimer`.

- [ ] **Step 4: Verify backend**

Run:

```powershell
cd backend
python -m unittest tests.test_market_catalog tests.test_catalog_backed_resolution tests.test_rera_verification -v
```

Expected:
- All tests pass.

- [ ] **Step 5: Commit and PR**

Commit message intent:

```text
Expose report evidence from catalog APIs

Investment reports need a stable backend-owned evidence boundary once
frontend-only source labels stop being enough. The field is additive and
keeps existing area consumers compatible.

Constraint: Must preserve current area API consumers
Rejected: Replace area response shape | unnecessary breaking change
Confidence: medium
Scope-risk: moderate
Tested: python -m unittest tests.test_market_catalog tests.test_catalog_backed_resolution tests.test_rera_verification -v
```

## Verification Before Investment Beta

Run:

```powershell
cd backend
python -m unittest tests.test_market_catalog tests.test_catalog_backed_resolution tests.test_rera_verification -v
cd ..\frontend
npm run lint
npm run build
```

Live smoke after merge:

```powershell
curl.exe -I --max-time 60 https://plotdna-ai.vercel.app
curl.exe -I --max-time 60 https://plotdna-ai.vercel.app/compare
curl.exe -i --max-time 90 "https://plotdna-api.onrender.com/api/areas/?city=hyderabad"
```

Expected:
- Vercel returns `200 OK` for app routes.
- Render returns `200 OK` for catalog routes.
- Area pages show verdict, data basis, checklist, and report CTA.
- Compare page works without backend failure.

## Release Gate

Do not call the product investment-grade until:
- The first viewport says screening, not guaranteed advice.
- At least one area page exposes evidence, confidence, and due-diligence checklist.
- Compare workflow exists.
- Report/custom intent is measurable.
- A user can request or download a shareable report.
- Public disclaimers are visible before report actions.

## Self-Review

Spec coverage:
- Customer, positioning, investment-grade requirements, GTM phases, revenue model, analytics, and first implementation slice are each mapped to tasks.

Placeholder scan:
- No unresolved placeholders are intentionally left.

Scope check:
- Payment integration and Android release are excluded until report intent is proven.

