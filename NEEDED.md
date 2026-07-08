# PlotDNA Needed / Next Work

This is the quick handoff for the next model. The detailed source of truth is `docs/plotdna-next-phase-handoff.md`.

## Done

- Phase 2B Hyderabad red-dot resolver regression audit is complete.
- Survey Resolver is wired behind feature flags and remains manual-verification-only.
- Survey Resolver mobile UI is simplified: one selected detail type, one detail input, optional locality, captured pin.
- Survey Resolver validation is tightened:
  - `Survey number` accepts values like `5442`, `76/2`, `128/A`.
  - `Survey number` rejects passbook-looking values like `PB-773820`.
  - `Khata / passbook number` accepts values like `PB-773820`.
- Location Intelligence and Survey Resolver no longer stack on top of each other.
- Landing `Open Map` clears stale coordinate state and opens the map directly.
- Drop Pin visible label is `Pin Land`; it still preserves Drop Pin accessibility/test contracts.
- Phase 3A Growth Forecast card initial layer is built behind `VITE_ENABLE_GROWTH_FORECAST_CARD`.
- Phase 3A Growth Forecast QA pass is complete:
  - Card is more compact for mobile.
  - Confidence, risk level, reason, and disclaimer remain visible.
  - Land DNA Card forecast reuse now also respects `VITE_ENABLE_GROWTH_FORECAST_CARD`.
- Phase 3B Land DNA Card preview/share URL initial version is built behind `VITE_ENABLE_LAND_DNA_CARD`.
- Phase 3B Land DNA Card has been redesigned as an Area Pass:
  - Premium pass-style card instead of a plain report panel.
  - Shows PlotDNA Score, Risk Level, Infrastructure Readiness, Connectivity Signal, Nearby Development Signal.
  - Shows 5-Year and 10-Year indicative outlook only from available forecast data; unavailable forecast rows are hidden.
  - Generates public Area Pass code URLs such as `/card/HYD-PXX-070`, while old slug URLs still resolve.
  - Share uses Web Share API with clipboard fallback.
  - Native share failures fall back to copying the public URL.
  - PNG download/export exists as a fallback using the visible card design.
  - Card metrics are availability-filtered so placeholder values like `Not available yet` are not rendered on the shared card.
  - Forecast payloads must include source, timestamp, locality, unit, confidence, method, and data_status metadata; shared cards only render forecast-backed outlooks when `data_status` is `ready`.
  - Basic SPA Open Graph/Twitter metadata is updated on the public card route.
  - Automated share QA covers real Hyderabad samples: Peerzadiguda, Yapral, Ameenpur, and Beeramguda.
  - Browser QA covers Area Pass routes in desktop and mobile Vite preview.
  - No QR/barcode added.
- Phase 3C Founder Pass gating initial version is built behind `VITE_ENABLE_FOUNDER_PASS_GATING`.
- Phase 3C Founder Pass entitlement QA guard is built:
  - Confirms paid state comes from server entitlement `subscription_active`.
  - Confirms the card reuses the existing Area Detail Rs 99 path.
  - Confirms no separate Founder Pass payment package or generic Razorpay link was added.
  - Confirms backend payment-link, webhook, recovery, and report-access tests remain present.
- Hyderabad weak-area ranking guard is built:
  - Estimated or under-4-signal records are capped below recommendation-leader range.
  - Weak records surface limited-source-depth caution copy.
  - Pending context cells remain blocked from promotion until every required signal deck is verified.
- Hyderabad pending promotion compiler is built:
  - `python scripts\compile_hyderabad_pending_promotion.py` generates `data/cities/hyderabad/pending-promotion-report.json`.
  - Current report: 75 pending context cells, 0 promotion-ready, 75 blocked.
  - Verified evidence now tracked in one place: 75 official boundaries, 41 price-band signals, 2 infrastructure signals.
  - Missing evidence remains: 75 RERA, 75 satellite-growth, 75 employment, 75 government-scheme, 73 infrastructure, 34 price-band.
  - No scores or polygon promotions were created.

## Latest Pushed Commits

- `48de566` - Add Phase 3B browser QA
- `390c9fa` - Add Phase 3 live QA checklist
- `99c4938` - Harden Founder Pass entitlement QA
- `53c7714` - Harden Area Pass share QA
- `2a57be0` - Productize Area Pass sharing
- `43af7ab` - Simplify mobile survey resolver
- `8af5570` - Tighten survey resolver validation

## Validation Already Run

- `pnpm run test:land-identity-phase-1b`
- `pnpm run test:land-identity-phase-2a`
- `pnpm run test:survey-resolver-validation`
- `pnpm run test:map-navigation-state`
- `pnpm run test:growth-forecast-phase-3a`
- `pnpm run test:land-dna-card-phase-3b`
- `pnpm run test:land-dna-card-share-qa`
- `pnpm run test:land-dna-card-browser-qa`
- `pnpm run test:founder-pass-phase-3c`
- `pnpm run test:founder-pass-entitlement-qa`
- `pnpm run lint`
- `pnpm run build`
- `uv run --with-requirements requirements.txt python -m unittest tests.test_custom_report_leads tests.test_report_entitlements tests.test_payment_reconciliation`

Earlier phase guards also passed during the phase work:

- `pnpm run test:hyderabad-red-dot-resolution`
- `pnpm run test:hyderabad-data-quality`
- `python scripts\compile_hyderabad_pending_promotion.py`
- `python scripts\validate_hyderabad_coverage.py`
- `pnpm run test:growth-forecast-phase-3a`
- `pnpm run test:land-dna-card-phase-3b`
- `pnpm run test:land-dna-card-share-qa`
- `pnpm run test:land-dna-card-browser-qa`
- `pnpm run test:founder-pass-phase-3c`
- `pnpm run test:founder-pass-entitlement-qa`
- `uv run --with-requirements requirements.txt python -m unittest tests.test_custom_report_leads tests.test_report_entitlements tests.test_payment_reconciliation`

## Left / Not Started

Use the Phase 3 live QA checklist before marking public/mobile/payment validation complete:

- `docs/phase-3-live-qa-checklist.md`

## Pending Task List

### Implemented This Pass

- Harden forecast readiness: configured forecast payloads now carry source, timestamp, locality, unit, method, confidence, and `data_status`; public forecast rendering stays hidden unless data is ready.
- Harden Area Pass sharing: if native Web Share fails or is unavailable, the page falls back to copying the public card URL.
- Harden Area Pass metadata guard: public card route maintains basic OG/Twitter metadata while true server-rendered OG image remains pending.

### Phase 3A Remaining

- Replace static/configured forecast payloads only after real data exists.
- Data-backed forecast sourcing remains blocked until clean historical price/time-series data exists.

### Phase 3B Remaining

- Public preview QA on Vercel.
- Mobile/share screenshot testing.
- Confirm PNG export quality on real mobile browsers and social apps.
- True server-rendered Open Graph image generation remains not built; SPA metadata is updated client-side only.

### Phase 3C Remaining

- Live payment entitlement QA.
- Founder Pass purchase flow QA.
- Production payment edge-case verification.

### Phase 4 Not Started

- TimesFM integration.
- Historical price observation store.
- Clean timestamp/source/locality/price-unit data foundation.
- Forecast backtesting.
- Backend/offline forecast generation service.

## Do Not Start Yet

- Do not integrate TimesFM into the frontend.
- Do not use TimesFM for PlotDNA Score.
- Do not claim guaranteed return.
- Do not confirm survey number, title, ownership, HMDA/DTCP/TG-bPASS approval, or legal clearance without official evidence.
- Do not change scoring formulas or polygon geometry.
