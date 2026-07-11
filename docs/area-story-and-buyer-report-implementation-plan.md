# Area Story Buyer-Briefing + Buyer Report PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Area Story `details` screen into a buyer briefing (story, upside, risk, grouped verification checklist, seller questions, source links) and restore the deleted jsPDF Buyer Report generator, wired into Area Story and Area Pass.

**Architecture:** New `frontend/src/lib/verificationSources.ts` wraps existing `getAreaSources()` into 6 grouped verification-task cards. New `frontend/src/lib/buyerReportPdf.ts` ports the recovered `generatePDF` (from `git show 475e774^:frontend/src/pages/AreaDetail.tsx`) into a typed module driven by `MicroMarket`/`CityEntry`, gated via existing `checkReportAccess` + `CustomReportLeadModal`. `AreaDetailsScreen.tsx` is rewritten in place; `PassScreen.tsx` gets one new action.

**Tech Stack:** React 19 + TypeScript, jsPDF (existing dependency, no new packages), existing entitlements/payment stack unchanged.

## Global Constraints

- No changes to scoring formulas, resolver logic, polygon data, Hyderabad coverage data, payment/entitlement business logic, or Area Pass share/PNG/copy behavior.
- No fake data; no legal/title/approval certification language.
- No embedded/iframe government portals — external links only, `target="_blank" rel="noopener noreferrer"`.
- PDF gating reuses `checkReportAccess('instant_pdf_99')` + `CustomReportLeadModal` exactly as before.
- PDF excludes any field not present on `MicroMarket` / `InvestmentReportSummary`.
- Follow existing smoke-test convention: `frontend/scripts/check-*.mjs` (source-content assertions, no test runner) registered as `test:*` in `package.json`.

---

### Task 1: Verification source registry

**Files:**
- Create: `frontend/src/lib/verificationSources.ts`
- Test: `frontend/scripts/check-verification-sources.mjs`

**Interfaces:**
- Consumes: `getAreaSources(slug, citySlug)` from `@/lib/areaSources` (returns `AreaSource[]` with `title/url/type`); `Category` from `@/types`.
- Produces: `VerificationSourceCard { id, title, description, sourceType, statusLabel, warning, applicableModes, url: string | null }`; `getVerificationSources(area: MicroMarket, citySlug: string): VerificationSourceCard[]`; `getBuyerModeForCategory(category: Category): 'plot'|'flat'|'house'|'area'`.

- [ ] Write `check-verification-sources.mjs` asserting: file exports `getVerificationSources` and `getBuyerModeForCategory`; 6 fixed card ids present (rera, land_records, market_value, planning, encumbrance, site_visit); each card has `warning` and `statusLabel` non-empty; `getBuyerModeForCategory('Established')` etc. covered.
- [ ] Run `node scripts/check-verification-sources.mjs` — expect FAIL (module missing).
- [ ] Implement `verificationSources.ts`: static `VERIFICATION_SOURCE_SHELLS` array (6 entries, static copy per spec) with `titleMatch: RegExp` per shell to pick a real URL from `getAreaSources(area.slug, citySlug)` (match on `AreaSource.title`, type `'gov'`); `url: null` if no match (card still renders, no link). `getBuyerModeForCategory` maps `'Established'|'High Growth'→'area'`, `'Emerging'→'plot'`, `'Industrial'→'area'` (single fixed mapping, no per-area override).
- [ ] Run `node scripts/check-verification-sources.mjs` — expect PASS.
- [ ] Add `"test:verification-sources": "node scripts/check-verification-sources.mjs"` to `package.json`.
- [ ] Commit: `feat: add verification source registry for Area Story`

### Task 2: Buyer recommendation copy

**Files:**
- Modify: `frontend/src/lib/investmentReport.ts`
- Test: `frontend/scripts/check-buyer-recommendation.mjs`

**Interfaces:**
- Consumes: `InvestmentVerdict` (existing export).
- Produces: `getBuyerRecommendation(verdict: InvestmentVerdict, dataConfidence: DataConfidence): string`.

- [ ] Write smoke test asserting `getBuyerRecommendation` exported and returns the 4 spec copy strings for Buy/Investigate/Wait/Avoid, plus a 5th "Data Pending" branch when `dataConfidence === 'estimated' || 'uncovered'`.
- [ ] Run — FAIL.
- [ ] Add function to `investmentReport.ts` (pure, static copy, no new fields on `MicroMarket`).
- [ ] Run — PASS. Add `test:buyer-recommendation` script. Commit: `feat: add buyer recommendation copy helper`

### Task 3: Buyer Report PDF module (ported generator)

**Files:**
- Create: `frontend/src/lib/buyerReportPdf.ts`
- Test: `frontend/scripts/check-buyer-report-pdf.mjs`

**Interfaces:**
- Consumes: `MicroMarket`, `CityEntry` (`@/data/cities`), `getInvestmentReportSummary`, `BUYER_DUE_DILIGENCE_CHECKLIST`, `getBuyerRecommendation` (Task 2), `getVerificationSources` (Task 1), `getConfidenceMeta`, `getScoreColor/getScoreLabel/SIGNAL_WEIGHTS/SIGNAL_LABELS` (`@/lib/utils`), `getOutlook/getGrowthMilestones` (`@/lib/plotAnalysis`), `getLandDnaAreaCode` (`@/lib/landDnaCard`), `checkReportAccess/trackUserEvent` (`@/lib/entitlements`).
- Produces: `generateBuyerReportPdf(area, city): Promise<void>` (saves `plotdna-buyer-report-{areaCode}.pdf`); `requestBuyerReportDownload(area, city, opts: { onNeedsAccess: () => void; onError: (msg: string) => void }): Promise<void>`.

- [ ] Write smoke test asserting: file imports `jsPDF` from `'jspdf'`; exports `generateBuyerReportPdf` and `requestBuyerReportDownload`; filename template `plotdna-buyer-report-${areaCode}.pdf` present in source; no occurrence of forbidden forecast placeholder strings (`'Not available yet'`) in source.
- [ ] Run — FAIL.
- [ ] Implement by porting the recovered `generatePDF` body (helpers `loadPdfAsset`, `hexRgb`, `header/footer/section/card/watermark` closures, page 1 verdict+signal table+milestones, page 2 livability+active projects+buyer notes, page 3 checklist+sources) adapted to: read verification sources from Task 1 instead of raw `getAreaSources`; read recommendation from Task 2; replace `doc.save('PlotDNA_...')` with `doc.save(\`plotdna-buyer-report-${getLandDnaAreaCode(city.meta.name, area)}.pdf\`)`. `requestBuyerReportDownload` calls `checkReportAccess('instant_pdf_99')`; if `canAccess`, calls `trackUserEvent({ eventType: 'pdf_downloaded', areaSlug: area.slug, packageInterest: 'instant_pdf_99' })` then `generateBuyerReportPdf`; else calls `opts.onNeedsAccess()`. Wrap `generateBuyerReportPdf` call in try/catch, calling `opts.onError('Could not generate report. Please try again.')` on throw.
- [ ] Run — PASS. Add `test:buyer-report-pdf` script. Commit: `feat: restore Buyer Report PDF generator`

### Task 4: Rewrite AreaDetailsScreen as Area Story

**Files:**
- Modify: `frontend/src/features/areaStory/screens/AreaDetailsScreen.tsx` (full rewrite)
- Modify: `frontend/src/features/areaStory/AreaStoryShell.tsx:42` (pass `city` prop to `AreaDetailsScreen`)
- Test: `frontend/scripts/check-area-story-screen.mjs`

**Interfaces:**
- Consumes: Task 1 (`getVerificationSources`, `getBuyerModeForCategory`), Task 2 (`getBuyerRecommendation`), Task 3 (`requestBuyerReportDownload`), existing `getInvestmentReportSummary`, `BUYER_DUE_DILIGENCE_CHECKLIST`, `getConfidenceMeta`, `getScoreColor`, `buildAreaStoryPath`, `CityEntry`.
- Produces: `AreaDetailsScreen({ area: MicroMarket; city: CityEntry })` default export (adds required `city` prop — breaking change scoped to this task + Task 4's shell edit).

- [ ] Write smoke test asserting: heading text `'Area Story'`; subtitle includes `'What to understand before paying token'`; source imports `getVerificationSources`, `getBuyerRecommendation`, `requestBuyerReportDownload`; contains section headers `'Why this area may gain value'`, `'Where you may lose money'`, `'What to verify before paying token'`, `'Ask the seller or broker'`, `'Where to verify this'`, `'How sure is this result?'`; contains `'Download Buyer Report'` and `'Generate Area Pass'` button text; contains `rel="noopener noreferrer"` and `target="_blank"`.
- [ ] Run — FAIL.
- [ ] Rewrite screen: header ("Area Story" / `{area.name} · What to understand before paying token`); story summary card (template string using `area.name`, `summary.verdict`, `area.highlights[0]`); why-value cards from `area.highlights.slice(0,4)` (fallback static card if `< 2`); risk cards (`summary.mainRisk` + 3 static + 1 conditional on `dataConfidence`); checklist grouped via static `CHECKLIST_GROUPS: Record<'Documents'|'Approvals'|'Site Reality'|'Price Sanity', number[]>` indexing into `BUYER_DUE_DILIGENCE_CHECKLIST`; seller questions (8 static items from spec); "Where to verify" section mapping `getVerificationSources(area, city.meta.slug).filter(c => c.applicableModes.includes(getBuyerModeForCategory(area.category)))` to cards with `<a target="_blank" rel="noopener noreferrer">`; 5 manual checkboxes via local `useState<Record<string, boolean>>`; confidence block (existing `getConfidenceMeta` + 4 static bullets); recommendation card via `getBuyerRecommendation`; CTA row — primary `Link` to `compare` (unchanged), secondary buttons "Download Buyer Report" (`onClick` → `requestBuyerReportDownload`, local `useState` for gate-modal-open + error message) and "Generate Area Pass" (`Link` to `pass` step via `buildAreaStoryPath`).
- [ ] Update `AreaStoryShell.tsx:42` call site to `<AreaDetailsScreen area={area} city={city} />`.
- [ ] Run — PASS. Add `test:area-story-screen` script. Commit: `feat: redesign Area Story as buyer briefing with PDF and verification sources`

### Task 5: Wire report-access gate modal in Area Story

**Files:**
- Modify: `frontend/src/features/areaStory/screens/AreaDetailsScreen.tsx`
- Test: extend `check-area-story-screen.mjs`

**Interfaces:**
- Consumes: `CustomReportLeadModal` (`@/components/ui/CustomReportLeadModal`), `getCachedEntitlements` (`@/lib/entitlements`).

- [ ] Extend smoke test: assert import of `CustomReportLeadModal`; assert `packageInterest="instant_pdf_99"` passed.
- [ ] Run — FAIL.
- [ ] Implement: `onNeedsAccess` opens `<CustomReportLeadModal open packageInterest="instant_pdf_99" paymentRequired areaName={area.name} cityName={city.meta.name} payloadBase={{ citySlug: city.meta.slug, cityName: city.meta.name, areaSlug: area.slug, areaName: area.name, source: 'area_story_pdf' }} onClose={...} onSubmitted={...} onPaidAccessClaimed={(entitlements) => { close modal; retry requestBuyerReportDownload }} />` — reusing the modal exactly as its existing prop contract requires, no modal code changes.
- [ ] Run — PASS. Commit: `feat: wire Buyer Report access gate into Area Story`

### Task 6: Add Buyer Report action to Area Pass

**Files:**
- Modify: `frontend/src/features/areaStory/screens/PassScreen.tsx`
- Test: `frontend/scripts/check-pass-screen-pdf.mjs`

**Interfaces:**
- Consumes: Task 3 `requestBuyerReportDownload`; existing `getLandDnaAreaCode`.

- [ ] Write smoke test asserting `PassScreen.tsx` imports `requestBuyerReportDownload`, contains `'Download Buyer Report'` button text, actions grid updated (`grid-cols-3` → `grid-cols-4` or equivalent 4-item layout), existing `Share2/Download/Copy` icon imports still present (regression guard for untouched Share/PNG/Copy).
- [ ] Run — FAIL.
- [ ] Add 4th action button calling `requestBuyerReportDownload(area, city, { onNeedsAccess: () => setShareState('report-needs-access'), onError: () => setShareState('report-failed') })`; extend `ShareState` union with `'report-needs-access' | 'report-failed' | 'report-downloaded'`; add matching status-message branches; reuse the same `CustomReportLeadModal` wiring pattern from Task 5 (own local state, not shared).
- [ ] Run — PASS. Add `test:pass-screen-pdf` script. Commit: `feat: add Download Buyer Report action to Area Pass`

### Task 7: Full verification pass

- [ ] Run `npm run lint` in `frontend/` — expect 0 errors.
- [ ] Run `npm run build` in `frontend/` — expect success.
- [ ] Run all new `test:*` scripts (`verification-sources`, `buyer-recommendation`, `buyer-report-pdf`, `area-story-screen`, `pass-screen-pdf`) — expect PASS.
- [ ] Manually verify in browser: Area Story renders all 11 sections, external links open in new tab, Buyer Report download triggers PDF or gate modal, Area Pass shows 4 actions with Share/PNG/Copy unchanged.
- [ ] Commit any lint-fix diffs: `chore: fix lint issues from Area Story buyer-briefing changes`

---

## Self-Review Notes

- Spec coverage: story summary, upside, risk, grouped checklist, seller questions, source-link section, manual checklist, confidence, recommendation, CTAs (Task 4); external-link behavior (Task 4); PDF restoration (Task 3); PDF placement in Area Story + Area Pass (Tasks 5-6); gating reuse (Tasks 5-6) — all covered.
- No placeholders: every task names exact files, exact function signatures, exact assertion strings.
- Type consistency: `requestBuyerReportDownload(area, city, opts)` signature identical across Task 3 definition and Tasks 5/6 call sites.
