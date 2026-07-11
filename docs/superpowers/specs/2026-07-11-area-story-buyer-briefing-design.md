# Area Story buyer-briefing redesign + Buyer Report PDF restoration

**Date:** 2026-07-11
**Status:** Approved for planning

## Context

The guided narrative flow (`frontend/src/features/areaStory/`) replaced the old standalone
`AreaDetail.tsx` page in commit `475e774`. The current `details` step
(`AreaDetailsScreen.tsx`) is a thin, checklist-feeling screen. It needs to become a buyer
briefing: area story, why value may grow, where money is lost, a grouped verification
checklist, seller questions, and a "where to verify" source-link section.

Separately, the old `AreaDetail.tsx` contained a full jsPDF buyer report generator
(`generatePDF`, ~350+ lines with drawing helpers) that was deleted along with the page and
never re-integrated into the new flow. It must be restored — ported, not rebuilt — and wired
into the Area Pass and Area Story screens as a "Download Buyer Report" action.

This is a UX/copy/layout/source-link change plus a PDF re-integration. No backend, scoring,
resolver, polygon, or payment-logic changes.

## Non-negotiables (carried from the request)

- No backend/scoring/resolver/polygon/Hyderabad-coverage changes.
- No fake data; no legal/title/approval certification claims.
- No embedded/iframe government portals — external links only, `target="_blank"
  rel="noopener noreferrer"`.
- PDF gating reuses the existing entitlements/payment flow unchanged (Rs 99 instant / Rs 499
  custom brief via `checkReportAccess`, `EmailGateModal`, `CustomReportLeadModal`).
- PDF excludes any field not present on `MicroMarket` / `InvestmentReportSummary` — no invented
  forecast numbers.

## Part 1 — Area Story screen redesign

**File:** `frontend/src/features/areaStory/screens/AreaDetailsScreen.tsx` (rewritten in place;
route/step id (`details`) and tab bar label unchanged — only in-page heading becomes "Area
Story").

### New source registry

**File:** `frontend/src/lib/verificationSources.ts` (new).

Defines the 6 fixed verification-task shells from the spec (RERA project check, land
records/land status, government market value reference, planning/master plan check,
encumbrance and title review, ground reality/site visit) as static metadata:

```ts
interface VerificationSourceShell {
  id: string
  title: string
  description: string
  sourceType: 'official' | 'public' | 'third_party' | 'manual' | 'site_visit'
  statusLabel: string
  warning: string
  applicableModes: Array<'plot' | 'flat' | 'house' | 'area'>
  areaSourceMatch?: { title: RegExp } // used to pick a real URL from areaSources.ts, see below
}
```

Per spec §12/§13, each shell also declares which buyer modes show it. Mode is derived from
`area.category` via a small mapping function (existing `Category` type — no new backend
concept).

**Real URLs come from the existing `areaSources.ts` registry**, not a duplicated one:
`getResolvedVerificationSources(area)` looks up `CITY_DEFAULT_SOURCES[citySlug]` (falling back
to `AREA_SOURCES[area.slug]` where relevant) and matches by `type: 'gov'` entries whose title
matches heuristics per shell (e.g. "RERA" → RERA card, "Master Plan"/"HMDA"/"BDA"/"CMDA" →
planning card). If no match is found for a city, the card still renders with its static
description/warning but shows a generic disclaimer instead of a broken link — never a fake URL.
This keeps one source of truth for city URLs (`areaSources.ts` is untouched) while giving every
live city (not just Telangana) correct state-specific portals.

### Screen sections (in order)

1. **Header** — "Area Story" title; subtitle `{area.name} · What to understand before paying
   token`.
2. **Story summary card** — templated paragraph built from `area.name`, verdict (from
   `getInvestmentReportSummary`), `fallbackContext` (already threaded through
   `AreaStoryShell` → screens), and `area.highlights[0]`. If `fallbackContext` indicates a
   Tier 2+ resolution, appends the existing "based on nearby locality signals" disclosure.
3. **Why this area may gain value** — 2-4 cards sourced from `area.highlights`; if fewer than 2
   exist, one static generic fallback card is shown (no invented specifics).
4. **Where you may lose money** — `summary.mainRisk` plus fixed cards: overpaying risk,
   exact-plot-access risk, approval/document risk, and a data-confidence risk card shown only
   when `area.dataConfidence` is `'partial'` or `'estimated'`.
5. **What to verify before paying token** — regroups the existing 14-item
   `BUYER_DUE_DILIGENCE_CHECKLIST` (`lib/investmentReport.ts`, unchanged) into Documents /
   Approvals / Site Reality / Price Sanity via a static index-to-group map. Checklist content
   itself is not edited.
6. **Ask the seller or broker** — expands the existing 3 static questions to the fuller list
   from the spec (still static copy, no new data dependency).
7. **Where to verify this** — renders `getResolvedVerificationSources(area)`, grouped by buyer
   task, filtered to `area`'s buyer mode. Each card shows title, description, status label,
   external-link icon, helper text ("Opens official/public source. Return to PlotDNA after
   checking."), and warning. Links open via `target="_blank" rel="noopener noreferrer"`.
8. **Optional manual checklist** — 5 checkboxes (RERA/land record/market value/EC-title/site
   visit checked), local `useState` only, not persisted, does not affect score or confidence.
9. **How sure is this result?** — reuses existing `getConfidenceMeta` block (unchanged logic),
   adds the 4 static confidence-reason bullets from the spec.
10. **Buyer action recommendation** — new pure function (in `investmentReport.ts`) mapping
    `InvestmentVerdict` → recommendation copy (Buy/Investigate/Wait/Avoid → the 4 static
    messages from the spec).
11. **CTAs** — primary "Compare Areas" (existing `Link` to `compare` step, unchanged);
    secondary "Download Buyer Report" and "Generate Area Pass" (new — Part 2).

Copy throughout follows the tone rules in the spec (no "guaranteed/certified/approved/assured
appreciation"; use "screening signal / verify before token / user must verify" language).

## Part 2 — Buyer Report PDF restoration

### Recovering the original implementation

The deleted `frontend/src/pages/AreaDetail.tsx` (removed in `475e774`, recoverable via
`git show 475e774^:frontend/src/pages/AreaDetail.tsx`) contains `generatePDF(area)` plus
helpers `loadPdfAsset`, `hexRgb`, and closures `header`/`footer`/`section`/`card`/`watermark`
using `jsPDF` (already a dependency — no new package). This is ported, not rewritten from
scratch, per the request.

### New module

**File:** `frontend/src/lib/buyerReportPdf.ts` (new).

- Ports `loadPdfAsset`, `hexRgb`, and the drawing-helper closures largely as-is.
- Replaces the old page-local data sourcing with the current typed shapes: `MicroMarket`,
  `CityEntry`, `InvestmentReportSummary` (from `getInvestmentReportSummary`), the resolved
  verification sources (Part 1), the grouped checklist, seller questions, and
  `fallbackContext`/`confidenceMeta`.
- Exports `generateBuyerReportPdf(area: MicroMarket, city: CityEntry, fallbackContext?:
  AreaStoryFallbackContext): Promise<void>` — builds and triggers download of
  `plotdna-buyer-report-{areaCode}.pdf`, where `areaCode` reuses the existing
  `getLandDnaAreaCode(city.meta.name, area)` from `lib/landDnaCard.ts` (same code already shown
  on the Area Pass) — no new code-generation logic.
- PDF sections mirror the new Area Story screen: verdict summary, plain-language story, DNA
  score, risk level, money/price-sanity (from `MoneyScreen`'s existing
  `buildUserInvestmentEstimate` output where available), why-value-may-grow, where-money-is-lost,
  verification checklist (grouped), seller questions, source links (name + URL), confidence
  explanation, disclaimer. Forecast fields absent on the data (5/10-year growth %, etc.) are
  included only when `estimate` is non-null, exactly matching what `MoneyScreen` already shows
  on-screen — never a placeholder string.

### Gating (unchanged behavior, reused)

**File:** `frontend/src/lib/buyerReportPdf.ts` also exports a small trigger hook/function,
`requestBuyerReportDownload(area, city, { onEmailGateNeeded, onPaymentNeeded, onError })`, that:

1. Calls the existing `checkReportAccess('instant_pdf_99')` (from `lib/entitlements.ts`,
   unchanged).
2. If access is granted, calls `generateBuyerReportPdf`.
3. If not, invokes the appropriate existing callback so the calling screen can open
   `EmailGateModal` or `CustomReportLeadModal` — both components reused unmodified, same
   Rs 99/Rs 499 packages, same `trackUserEvent` calls preserved from the old page's logic.

This keeps the gating logic in one place so both call sites behave identically.

### Call sites

- **`PassScreen.tsx`** — add "Download Buyer Report" as a 4th action in the actions grid
  (Share Link primary; PNG / Copy URL / Download Buyer Report secondary — grid adapts to 4
  items). On failure, reuses the existing `shareState`-style local status message pattern
  ("Could not generate report. Please try again.").
- **`AreaDetailsScreen.tsx`** — "Download Buyer Report" and "Generate Area Pass" as secondary
  actions below the primary "Compare Areas" CTA (Part 1, section 11).

### Explicitly not touched

- `entitlements.ts`, `paymentLinks.ts`, `EmailGateModal.tsx`, `CustomReportLeadModal.tsx` —
  reused as-is.
- `areaSources.ts` — read from, not modified.
- `investmentReport.ts` — extended with one new pure function (verdict → recommendation copy),
  existing exports unchanged.
- Scoring engine, resolver, polygon data, Hyderabad coverage data — untouched.
- Area Pass PNG/share/copy-link behavior — untouched, PDF is purely additive in that screen.

## Open items resolved during brainstorming

- PDF stays behind the existing paywall (not made free).
- PDF generator lives in its own lib module, not inline in a screen.
- Non-Telangana verification-source URLs reuse the existing per-city `areaSources.ts` data
  rather than a second Telangana-only registry.
