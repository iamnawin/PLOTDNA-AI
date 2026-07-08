# Phase 3B.5 Buyer Journey UI Redesign

Status: planned, before Phase 3C payment QA.

Purpose: make PlotDNA feel like a land buying helper for normal buyers, not a technical map dashboard. Keep the existing scoring, resolver, polygon, forecast, report, and payment logic unchanged while changing how users discover and understand the product.

## Problem

Users understand the idea is useful, but the current interface asks them to understand too much at once.

Current experience:

1. User sees a map-first product.
2. Polygons, scorecards, DNA language, forecast, reports, compare, payment, and source details compete for attention.
3. The buyer must decide what matters.
4. The product feels technically impressive, but not emotionally urgent.

Needed experience:

1. User says where the land is.
2. PlotDNA checks it.
3. PlotDNA gives a plain buyer verdict.
4. PlotDNA explains where money can be gained or lost.
5. PlotDNA shows proof only after the verdict is clear.
6. User can compare, share, or unlock the full buyer report.

## Design Read

Reading this as a full product UX rethink for land buyers with low technical tolerance, using a trust-first guided decision language. The interface should be simpler, more emotional, and more sequential than the current dashboard.

Design dials:

- Design variance: 5. The app should feel polished, not experimental.
- Motion intensity: 5. Use motion to reveal investigation steps, not for decoration.
- Visual density: 4 on entry screens, 6 only inside deeper report/proof screens.

## Non-Negotiables

- Do not start Phase 3C Razorpay/payment QA.
- Do not start TimesFM.
- Do not fake forecast values.
- Do not show unavailable forecast fields on public/share cards.
- Do not change polygon data, resolver logic, or scoring formulas.
- Do not remove existing features. Reposition them into the right user moment.
- Keep Hyderabad as the live public release market.
- Keep paid report and Founder Pass logic behind the existing paths until Phase 3C.

## Product Language Shift

Replace technical language with buyer language.

| Current wording | Buyer wording |
| --- | --- |
| DNA score | PlotDNA score, shown after verdict |
| Micro-market | Area |
| Infrastructure readiness | Roads and development nearby |
| Connectivity signal | Travel access |
| Price velocity | Price movement |
| Growth forecast | Future gain signal |
| Risk level | Money risk |
| Due diligence | What to check before paying |
| Source trail | Proof used |
| Locality intelligence | Area check |
| Coordinate analysis | Exact land check |
| AVM | Price check |
| Investment verdict | Should I shortlist this? |

Preferred words:

- money
- gain
- loss
- risk
- safe
- shortlist
- avoid
- broker price
- token advance
- resale
- proof
- check before paying

Avoid on first screens:

- micro-market
- spatial
- polygon
- coordinate-level
- intelligence layer
- capital commitment
- forecast intelligence
- data confidence
- source-of-truth

## New User Journey

### 1. Check My Land

Goal: make the first action obvious.

Screen role:

- Main entry screen.
- User can search area, paste Google Maps link, upload brochure, use current location, or pin land.
- The map is optional at first, not the main mental model.

Primary copy:

- "Check this land before you pay token."
- "Paste area, Google Maps link, or drop a pin."
- "Find money risk, growth chance, and what to verify."

Existing features used here:

- Landing search: `frontend/src/pages/Landing.tsx`
- Map link and coordinate parsing: `frontend/src/pages/Landing.tsx`
- Brochure upload: `frontend/src/pages/Landing.tsx`, `frontend/src/pages/BrochurePage.tsx`
- Locate me: `frontend/src/pages/Landing.tsx`
- Drop pin after map entry: `frontend/src/pages/Home.tsx`

Acceptance:

- First viewport has one dominant action: check land.
- Open Map is secondary.
- Copy uses buyer words, not technical terms.
- User can still access map, compare, brochure, and existing routes.

### 2. PlotDNA Checking Moment

Goal: make the product feel like it is working for the buyer.

Screen role:

- Short investigation/reveal between input and result.
- Should say what PlotDNA is checking in plain language.

Preferred steps:

1. "Finding the exact land area"
2. "Checking road access and nearby development"
3. "Checking price and money risk"
4. "Preparing your buyer verdict"

Existing features used here:

- DNA route preloader: `frontend/src/components/ui/DnaRoutePreloader.tsx`
- Map analyze overlay: `frontend/src/pages/Home.tsx`

Acceptance:

- No technical scan language on buyer-facing steps.
- Loading state creates curiosity without claiming fake checks.
- If backend data is unavailable, message stays honest.

### 3. Buyer Verdict

Goal: answer the buyer's actual question first.

Screen role:

- First result after search/map/pin.
- Show one simple verdict before score details.

Verdict labels:

- "Good to shortlist"
- "Check carefully"
- "High money risk"
- "Not enough data yet"

Content order:

1. Verdict
2. One-sentence reason
3. Money risk
4. Gain signal
5. What to check before paying
6. PlotDNA score as proof

Existing features used here:

- Score card: `frontend/src/components/score/ScoreCard.tsx`
- Coordinate analysis card: `frontend/src/components/score/PlotAnalysisCard.tsx`
- Area report summary: `frontend/src/pages/AreaDetail.tsx`
- Investment summary helper: `frontend/src/lib/investmentReport.ts`

Acceptance:

- Score is not the first thing the user must decode.
- User can understand the result without knowing PlotDNA terminology.
- Every verdict includes a verification warning.

### 4. Money View

Goal: make value obvious through gain/loss language.

Screen role:

- Separate screen/section focused on price, broker quote, investment amount, upside, overpay risk, and holding period.

Existing features used here:

- Price range in area data.
- AVM/price calculator: `frontend/src/components/ui/AVMCard.tsx`
- Area detail price section and PDF price sanity graph: `frontend/src/pages/AreaDetail.tsx`
- Growth forecast only where ready: `frontend/src/lib/forecast/growthForecast.ts`

Recommended labels:

- "Broker price check"
- "If I invest this much"
- "Possible gain"
- "Where I may lose money"
- "Price looks high / fair / needs checking"

Acceptance:

- Price calculator is visible before deep technical graphs.
- Forecast rows only appear when data_status is ready.
- No 5-year/10-year fake projection is shown if real data is unavailable.

### 5. Map Proof

Goal: make the map support the verdict instead of dominating the app.

Screen role:

- Show why PlotDNA says what it says.
- Use map as visual proof after the user already understands the verdict.

Existing features used here:

- Map workspace: `frontend/src/pages/Home.tsx`
- Map renderer: `frontend/src/components/map/MapView.tsx`
- Spatial view/globe: `frontend/src/components/view/SpatialView.tsx`
- Location intelligence panel: `frontend/src/components/location/LocationIntelligencePanel.tsx`
- Survey resolver panel: `frontend/src/components/survey/SurveyResolverPanel.tsx`

Recommended subviews:

- "Exact land"
- "Nearby area"
- "Roads and access"
- "Development nearby"
- "Risk zones"
- "Map snapshot"

Acceptance:

- Polygons are not the first concept shown to normal buyers.
- Advanced layers remain available for power users.
- Map screenshot/snapshot becomes part of share/report output.

### 6. Buyer Checklist

Goal: convert intelligence into action.

Screen role:

- Tell user what to verify before token advance.

Existing features used here:

- Area detail verification sections: `frontend/src/pages/AreaDetail.tsx`
- Custom buyer brief PDF: `frontend/src/pages/AreaDetail.tsx`
- Source links: `frontend/src/lib/areaSources.ts`
- Brochure analysis: `frontend/src/pages/BrochurePage.tsx`

Checklist labels:

- "Before paying token"
- "Ask seller for"
- "Check with lawyer"
- "Check on site"
- "Check online"

Acceptance:

- Checklist is visible before asking for payment.
- PDF/report unlock feels like saving the checklist, not buying mystery data.

### 7. Compare Areas

Goal: make comparison feel like a money decision.

Screen role:

- Help buyer choose where to put money.

Existing features used here:

- Compare page: `frontend/src/pages/CompareAreas.tsx`
- Compare CTA inside area detail: `frontend/src/pages/AreaDetail.tsx`
- Recommendation ranking: `frontend/src/lib/recommendations.ts`

New compare columns:

- "Best for"
- "Money risk"
- "Possible gain"
- "Price level"
- "Easy to sell later"
- "What to check"

Acceptance:

- Compare page does not require understanding DNA score first.
- It declares a winner by use case, not a generic winner.
- User can return to the checked land/report.

### 8. Area Pass / Share Card

Goal: produce a simple artifact people want to share.

Screen role:

- End output for WhatsApp/social/share.

Existing features used here:

- Land DNA Card: `frontend/src/components/landDna/LandDNACard.tsx`
- Share route: `frontend/src/pages/LandDNACardPage.tsx`
- PNG export: `frontend/src/lib/landDnaCard.ts`

Card content order:

1. Area name
2. Buyer verdict
3. Money risk
4. Possible gain signal only if valid data exists
5. Top reason
6. What to check before paying
7. Map snapshot when available
8. Founder Pass CTA

Acceptance:

- Public card uses layman wording.
- No private/debug/payment data.
- Missing forecasts are hidden.
- Dynamic server-rendered OG image remains documented as pending.

## Screen Map

| Screen | Purpose | Features placed here |
| --- | --- | --- |
| Landing | Start check | search, map link, brochure upload, locate me |
| Checking overlay | Curiosity and trust | resolution/loading steps |
| Result panel | First verdict | buyer verdict, money risk, gain signal, next check |
| Money view | Value clarity | price calculator, broker quote sanity, gain/loss |
| Map proof | Visual evidence | map, polygon, layers, survey/location panels |
| Area report | Deep proof | sources, graphs, project signals, risks, checklist |
| Compare | Decision support | side-by-side areas and use-case winner |
| Area Pass | Share artifact | verdict, risk, gain, checklist, map snapshot |
| Paid report | Save/print | source PDF, custom buyer brief |

## Implementation Plan

### Step 1: Buyer copy and entry restructure

Files:

- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Home.tsx`
- `frontend/src/components/ui/DnaRoutePreloader.tsx`

Work:

- Replace first-screen technical copy with money-risk buyer copy.
- Rename first action around "Check land".
- Keep Open Map as secondary.
- Replace scan/loading messages with buyer-understandable checks.

Verify:

- `pnpm run test:landing-rollout-copy`
- `pnpm run test:brand-tagline`
- `pnpm run lint`
- `pnpm run build`

### Step 2: Result panel hierarchy

Files:

- `frontend/src/components/score/ScoreCard.tsx`
- `frontend/src/components/score/PlotAnalysisCard.tsx`
- `frontend/src/lib/investmentReport.ts`

Work:

- Put buyer verdict above score.
- Convert labels to money-risk/gain language.
- Make "what to check before paying" visible.
- Keep score and technical signals as supporting proof.

Verify:

- Existing score and map navigation checks.
- Manual desktop/mobile search of Peerzadiguda, Ameenpur, and coordinate inputs.

### Step 3: Money view

Files:

- `frontend/src/components/ui/AVMCard.tsx`
- `frontend/src/pages/AreaDetail.tsx`

Work:

- Promote price calculator into a clear "Money View".
- Add broker quote sanity framing.
- Keep forecast hidden unless ready.
- Use "possible gain" and "where you may lose money" language.

Verify:

- `pnpm run test:user-investment-estimate`
- `pnpm run test:growth-forecast-phase-3a`
- `pnpm run build`

### Step 4: Map proof and snapshots

Files:

- `frontend/src/pages/Home.tsx`
- `frontend/src/components/map/MapView.tsx`
- `frontend/src/lib/landDnaCard.ts`
- `frontend/src/components/landDna/LandDNACard.tsx`

Work:

- Treat map as proof after verdict.
- Add a defined "map snapshot" slot for Area Pass/report.
- Keep advanced layers accessible but visually secondary.

Verify:

- `pnpm run test:map-navigation-state`
- `pnpm run test:land-dna-card-share-qa`
- Browser QA for desktop/mobile card rendering.

### Step 5: Compare as buyer decision

Files:

- `frontend/src/pages/CompareAreas.tsx`
- `frontend/src/lib/recommendations.ts`

Work:

- Reframe compare as "Which area is better for my money?"
- Add use-case winner language.
- Replace technical labels where possible.

Verify:

- `pnpm run test:compare-return-navigation`
- `pnpm run test:compare-selector-dedupe`
- Manual compare with three Hyderabad areas.

### Step 6: Area Pass rewrite

Files:

- `frontend/src/components/landDna/LandDNACard.tsx`
- `frontend/src/pages/LandDNACardPage.tsx`
- `frontend/src/lib/landDnaCard.ts`

Work:

- Reorder card around buyer verdict, money risk, gain signal, and checklist.
- Keep share, copy, PNG, and metadata behavior.
- Keep missing forecast rows hidden.

Verify:

- `pnpm run test:land-dna-card-phase-3b`
- `pnpm run test:land-dna-card-share-qa`
- `pnpm run test:phase-3-live-qa-readiness`

## Acceptance Criteria

1. First-time user can understand what to do in under 10 seconds.
2. First result answers "Should I shortlist this land?" before showing technical details.
3. Buyer words replace technical words on entry/result/share screens.
4. Existing map, polygons, compare, AVM, reports, brochure, assistant, and share card remain accessible.
5. Forecast fields remain hidden unless data_status is ready.
6. No Phase 3C payment/Razorpay implementation starts.
7. No TimesFM implementation starts.
8. No scoring, polygon, or resolver changes are made.
9. Mobile flow has one clear primary action per screen.
10. Area Pass becomes understandable as a WhatsApp/share artifact for non-technical buyers.

## Risks

- Risk: oversimplifying and losing trust.
  - Mitigation: show plain verdict first, then proof/source sections behind it.

- Risk: hiding power-user map tools too much.
  - Mitigation: keep Explore Map as a visible secondary mode.

- Risk: buyer language becomes legally unsafe.
  - Mitigation: use "screening", "check", "risk", and "verify"; never say guaranteed, certified, title-clear, or approved.

- Risk: forecast language implies guaranteed profit.
  - Mitigation: only show ready forecasts, keep range/disclaimer, hide unavailable future numbers.

## ADR

Decision: redesign PlotDNA around a guided buyer journey before Phase 3C.

Drivers:

- Users are interested in the idea but not engaged by the current dashboard-style flow.
- Land buyers respond to money, risk, loss, gain, broker price, and verification language.
- Existing features are valuable but need stronger placement and sequencing.

Alternatives considered:

1. Cosmetic polish only.
   - Rejected because spacing/colors will not fix the core comprehension problem.
2. Add more features before redesign.
   - Rejected because more features will increase complexity.
3. Payment hardening first.
   - Rejected for now because conversion will stay weak if the product value is not felt before payment.

Why chosen:

- The current product has enough capability. The next leverage is making users feel the value faster.

Consequences:

- Phase 3C waits.
- UI/copy work becomes the next priority.
- Feature placement must be deliberate before new monetization work.

Follow-ups:

- Create a browser QA script for the redesigned buyer journey.
- Add screenshots or short screen recordings after the first UI pass.
- Produce a Hyperfilm/product video only after the new journey is visible.
