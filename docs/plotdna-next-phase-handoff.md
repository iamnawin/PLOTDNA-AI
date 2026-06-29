# PlotDNA Next Phase Handoff

This doc is the working handoff for the next agent/model. It stores product requirements and implementation order only. Do not put this in `AGENTS.md` or `CLAUDE.md` unless it becomes a permanent operating rule.

## Current Completed State

- Phase 0 foundations complete.
- Phase 0.5 Hyderabad pending/context evidence guardrails complete.
- Phase 1A Location Intelligence panel wired safely.
- Phase 1B Drop Pin mode complete.
- Phase 1C env-based feature flags complete.
- Phase 2A Survey Resolver UI wired behind feature flags.
- Phase 2B Hyderabad red-dot resolver regression audit complete.
- Phase 3A Growth Forecast card initial reusable layer complete behind feature flag.
- Phase 3B Land DNA Card preview/share route initial version complete behind feature flag.
- Phase 3C Founder Pass gating initial version complete behind feature flag.

Latest Phase 2A/2B resolver polish changed:

- `frontend/src/pages/Home.tsx`
- `frontend/src/components/location/LocationIntelligencePanel.tsx`
- `frontend/src/components/survey/SurveyResolverPanel.tsx`
- `frontend/src/lib/landIdentity/surveyResolver.ts`
- `frontend/scripts/audit-hyderabad-red-dot-resolution.mjs`
- `frontend/scripts/check-survey-resolver-validation.mjs`
- `frontend/scripts/check-land-identity-phase-1b.mjs`
- `frontend/scripts/check-land-identity-phase-2a.mjs`
- `frontend/package.json`

Phase 3 initial feature work changed:

- `frontend/src/components/forecast/GrowthForecastCard.tsx`
- `frontend/src/pages/LandDNACardPage.tsx`
- `frontend/src/lib/forecast/growthForecast.ts`
- `frontend/src/lib/landDnaCard.ts`
- `frontend/src/lib/landDnaPlanConfig.ts`
- related feature-flag, route, and guard scripts

Latest validated state:

- `pnpm run test:land-identity-phase-0`
- `pnpm run test:land-identity-phase-1a`
- `pnpm run test:land-identity-phase-1b`
- `pnpm run test:land-identity-phase-1c`
- `pnpm run test:land-identity-phase-2a`
- `pnpm run test:survey-resolver-validation`
- `pnpm run test:hyderabad-red-dot-resolution`
- `pnpm run test:growth-forecast-phase-3a`
- `pnpm run test:land-dna-card-phase-3b`
- `pnpm run test:land-dna-card-share-qa`
- `pnpm run test:founder-pass-phase-3c`
- `pnpm run test:founder-pass-entitlement-qa`
- `pnpm run test:map-navigation-state`
- `pnpm run test:hyderabad-production`
- `pnpm run test:hyderabad-location-search`
- `pnpm run lint`
- `pnpm run build`
- `uv run --with-requirements requirements.txt python -m unittest tests.test_custom_report_leads tests.test_report_entitlements tests.test_payment_reconciliation`
- `python scripts\validate_hyderabad_coverage.py`
- `git diff --check`

Latest pushed commits:

- `53c7714` - Harden Area Pass share QA
- `2a57be0` - Productize Area Pass sharing
- `43af7ab` - Simplify mobile survey resolver
- `8af5570` - Tighten survey resolver validation

Current product behavior:

- Landing `Open Map` clears stale coordinate state and opens the map directly.
- Drop Pin is shown as `Pin Land`; it uses the existing red-pin path.
- Location Intelligence and Survey Resolver no longer stack over each other.
- Survey Resolver is simplified to one selected detail type and one input.
- Survey Resolver marks captured clues as manual verification required only.
- Survey Resolver rejects obvious mismatches such as `Survey number` + `PB-773820`.
- `Khata / passbook number` accepts values such as `PB-773820`.
- Growth Forecast card is compacted for mobile and remains behind `VITE_ENABLE_GROWTH_FORECAST_CARD`.
- Land DNA Card forecast reuse also respects `VITE_ENABLE_GROWTH_FORECAST_CARD`.
- Land DNA Card share page now uses an Area Pass visual direction with score, risk, infrastructure, connectivity, development signal, and indicative 5/10-year outlook when forecast data exists.
- Land DNA Card public links now resolve generated area codes such as `/card/HYD-PXX-070`; existing slug URLs still resolve.
- Land DNA Card share uses Web Share API with clipboard fallback, and PNG export/download is available as a secondary fallback.
- Land DNA Card metrics are availability-filtered so unavailable growth placeholders are hidden instead of rendered.
- Land DNA Card automated share QA covers Peerzadiguda, Yapral, Ameenpur, and Beeramguda sample cards.
- Founder Pass card gating reuses cached server entitlements and the existing Area Detail Rs 99 flow; it does not create a separate payment package.

Still not built:

- Official cadastral/survey-record confirmation.
- Backend persistence for user-captured land clues.
- Document upload/extraction.
- Legal/title/ownership verification.
- TimesFM forecast pipeline.
- Historical price observation store and forecast backtesting.
- Full mobile map redesign beyond targeted congestion fixes.

## Non-Negotiable Product Safety

- Do not change scoring formulas.
- Do not change polygon geometry.
- Do not promote pending/context/generated polygons.
- Do not fake scores, survey numbers, legal/title clearance, HMDA/DTCP/TG-bPASS approval, or guaranteed returns.
- Do not turn PlotDNA into a listing app or social platform.
- Keep new features behind feature flags until validated.
- Preserve search, Locate Me, map click, polygon click, Drop Pin, red pin behavior, Location Intelligence, scoring, evidence, and Hyderabad coverage.
- Phase 3A, 3B, and 3C must ship behind feature flags until validated.
- Suggested flags:
  - VITE_ENABLE_GROWTH_FORECAST_CARD=false
  - VITE_ENABLE_LAND_DNA_CARD=false
  - VITE_ENABLE_FOUNDER_PASS_GATING=false
  Initial Growth Forecast may use static/configured demo data only if clearly marked internally as placeholder/demo.
Do not attach demo forecast data to every area automatically.
Only show forecast where forecast payload exists or where explicitly configured.

## Product Layer Model

Layer 1: Map / Polygon identity  
Layer 2: Locality intelligence  
Layer 3: PlotDNA score  
Layer 4: Evidence / risk explanation  
Layer 5: Forecast intelligence, where TimesFM can be evaluated later

Example user journey:

User finds land -> PlotDNA pins it -> user opens Survey Resolver -> PlotDNA captures what they know -> marks verification required.

## Phase 2B: Hyderabad Red-Dot Resolver Regression Audit

Status: complete. Keep this section as the acceptance contract for future resolver regressions.

Goal: audit all red-dot/problem areas from the Hyderabad screenshot before changing polygons or data.
The audit must respect the earlier Hyderabad coverage rule: coverage completion means resolving useful market/locality intelligence, not generating circular/radial/ring geometry.
Do not:

- Generate new polygons.
- Redesign Hyderabad coverage.
- Change scoring formulas.
- Change Hyderabad polygon geometry.
- Fake scores for pending/generated areas.

Resolver priority must remain:

1. Exact scored polygon
2. Safe nearby scored market
3. Pending/generated context cell
4. True uncovered/context-only pending state

Required audit script:

- Prefer extending `frontend/scripts/check-hyderabad-location-search.mjs`, or create `frontend/scripts/audit-hyderabad-red-dot-resolution.mjs`.

For each test coordinate, print:

- Input lat/lng
- Containing scored polygon, if any
- Containing pending/context/generated polygon, if any
- Nearest scored market
- Distance to nearest scored market
- Final resolved result
- Final result type: `exact_scored`, `nearby_scored`, `pending_context`, `generated_expansion`, `uncovered`
- Whether UI would show score
- Whether UI would show `Data pending`
- Reason for final selection
- Warning if a pending/generated/context polygon wins while a scored market is safely nearby

Include representative areas:

- Aminpur / Ameenpur
- Beeramguda / Bheeramguda
- Kardhanur
- Ramachandrapuram
- Patancheru
- BHEL
- Miyapur
- Bachupally
- Nizampet
- Tellapur
- Kokapet
- Narsingi
- Shamshabad / Airport corridor
- Rajendranagar / Attapur
- Uppal
- Ghatkesar
- Kompally
- Medchal
- Shamirpet
- LB Nagar / Hayathnagar
- Sangareddy-facing western side
- Vikarabad-facing western side
- Bhongir-facing eastern side
- Farooqnagar / Mahbubnagar-facing southern side where applicable

Acceptance criteria:

- Beeramguda/Kardhanur case remains fixed.
- Red-dot areas near scored intelligence resolve to exact/nearby scored results, not empty pending panels.
- True outskirts still show Data pending.
- Generated expansion only shows detailed intelligence pending review.
- No empty panel.
- No fake score.
- No pending/generated cell suppresses nearby verified/scored market.

## Phase 3A: Growth Forecast Card

Status: initial implementation and UI/flag QA complete behind `VITE_ENABLE_GROWTH_FORECAST_CARD`. Remaining work is data-backed forecast sourcing after historical price/time-series data exists.

Goal: add a separate, reusable Growth Forecast card below Location Intelligence / PlotDNA Score and later inside Land DNA Card.

Do not merge this into the main PlotDNA Score.

Required wording:

- Use `Growth Forecast`, not `Market Forecast`.
- Use `Expected Growth`, not `Momentum`.
- Do not use the word `belt` in new user-facing area labels or forecast copy.
- Show forecast as a range, never fake-precise values.
- Always show confidence, risk, reason, and disclaimer.
- Never say guaranteed return.

Required component:

- `frontend/src/components/forecast/GrowthForecastCard.tsx` or existing pattern-compatible path.

Suggested data shape:

```ts
type GrowthForecast = {
  forecast_available: boolean
  title: string
  summary: string
  six_month_growth: { min: number; max: number; label: string }
  twelve_month_growth: { min: number; max: number; label: string }
  investment_example?: {
    amount: number
    estimated_value_min: number
    estimated_value_max: number
    label: string
  }
  confidence: 'Low' | 'Medium' | 'High'
  risk: 'Low' | 'Medium' | 'High'
  reason: string
  disclaimer: string
}
```

Initial copy:

- Title: `Growth Forecast`
- Summary: `This area is showing positive growth signals.`
- Expected 6-month growth: `+4% to +7%`
- Expected 12-month growth: `+8% to +14%`
- Investment example: `If you invest Rs 50 lakh: Estimated value after 12 months may be around Rs 54 lakh to Rs 57 lakh.`
- Confidence: `Medium`
- Risk: `Medium`
- Reason: `More buyers are showing interest in this area, nearby residential development is increasing, and recent price movement has been mostly positive.`
- Disclaimer: `This is only an estimated forecast, not a guaranteed return. Final value depends on the exact plot location, approvals, road access, legal status, and overall market conditions.`

If forecast data is unavailable:

- `Growth forecast is not available yet for this area.`

TimesFM note:

- Growth Forecast UI can ship first with static/configured forecast data only if clearly marked as estimated and not guaranteed.
- TimesFM integration should wait until there is clean historical price/time-series data.
- Before TimesFM work, inspect the TimesFM repo/docs and decide whether it belongs in backend forecast service, offline batch generation, or data pipeline.
- Do not add TimesFM into scoring.

## Phase 3B: Land DNA Card Preview / Share URL

Status: implementation and automated share QA complete behind `VITE_ENABLE_LAND_DNA_CARD`; Area Pass redesign, code-based public links, Web Share/copy fallback, PNG download fallback, and availability-filtered dynamic metrics are applied. Remaining work is public preview QA, mobile/share screenshot testing, and real-device PNG/share QA.

Goal: lightweight shareable Land DNA Card, not a social platform.

Card content:

- Area name
- City
- PlotDNA Score if available
- Risk level if available
- Growth Forecast if available
- Connectivity signal
- Nearby development signal
- Short plain-English explanation
- Caution line
- PlotDNA watermark
- CTA at bottom

Caution line:

`PlotDNA provides location intelligence signals, not legal/title/approval certification. Always verify documents and ground reality before purchase.`

CTA:

`Want to check more areas? Unlock PlotDNA Founder Pass - Rs 99 Lifetime Early Access.`

Possible components:

- `LandDNACard.tsx`
- `LandDNACardPreview.tsx`
- `GenerateLandDNACardButton.tsx`
- `EmailCaptureModal.tsx`
- `FounderPassUpgradeModal.tsx`
- `FounderPassPricingCard.tsx`

Possible route:

- `/card/:shareSlug`

Initial share behavior:

- Public share URL.
- Use Web Share API if available.
- Fallback to copy link.
- PNG download fallback.
- Generated public card code URLs such as `/card/HYD-PXX-070`; old slug URLs remain backwards compatible.
- Hide unavailable metric blocks. Do not show `Not available yet`, `requires historical data`, `N/A`, or empty placeholder cards on the shared card.
- Automated sample QA covers Peerzadiguda, Yapral, Ameenpur, and Beeramguda.

## Phase 3C: Founder Pass Gating

Status: initial implementation and automated entitlement/payment-boundary QA complete behind `VITE_ENABLE_FOUNDER_PASS_GATING`. Remaining work is live payment entitlement QA and production payment edge-case verification.

Goal: reuse the existing Rs 99 lifetime access/payment direction instead of creating a parallel payment product.

Marketing line:

`Check one area free. Unlock the city for Rs 99.`

Payment and entitlement guardrails:

- Paid state must come from server entitlement `subscription_active`, not local UI state.
- Founder Pass card CTA should route to the existing area Rs 99 flow, not create a parallel Razorpay flow.
- Existing server-created payment link, Razorpay webhook, verified recovery, and report-access paths must remain the source of truth.

Free plan:

- `card_limit = 1`
- Email required.
- Basic card only.
- Upgrade CTA visible.

Founder plan:

- Configurable card limit, recommended early value 100.
- Saved cards enabled/prepared.
- Area watchlist enabled/prepared.
- Compare areas enabled/prepared.
- Cleaner share card export.

Do not hardcode `unlimited`.

Suggested config:

```ts
const landDnaPlanConfig = {
  free: {
    card_limit: 1,
    requires_email: true,
    can_save_cards: false,
    can_compare_areas: false,
    can_use_watchlist: false,
  },
  founder: {
    card_limit: 100,
    requires_email: true,
    can_save_cards: true,
    can_compare_areas: true,
    can_use_watchlist: true,
  },
}
```

Payment rule:

- If real payment integration is not ready, use explicit payment stubs only.
- Do not fake paid status except in clearly marked local/dev mock mode.
- Keep payment status explicit: `unpaid`, `paid`, `failed`, `refunded`.

## Phase 4: Forecast Intelligence With TimesFM

Status: not started. Do not start until clean historical price/time-series data exists.

Goal: evaluate TimesFM for forecast intelligence after the data foundation exists.

Start only after:

- Historical price observations exist for target localities.
- Data has clean timestamps, source tags, locality slug, price unit, and confidence.
- Backtesting can compare forecast output with held-out data.

Likely backend/data pipeline work:

- `backend/app/services/forecasting.py`
- cached forecast outputs per locality
- generated forecast payload consumed by frontend `GrowthForecastCard`

Rules:

- Do not use TimesFM to create PlotDNA Score.
- Do not present forecasts as guaranteed returns.
- Do not show fake precision.
- Show ranges, confidence, risk, reason, and disclaimer.

TimesFM must not be bundled into the frontend.
If used, it should live in backend service, offline batch job, or data pipeline.
Frontend only consumes cached forecast payloads.
