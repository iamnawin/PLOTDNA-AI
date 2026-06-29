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
- Phase 3B Land DNA Card preview/share URL initial version is built behind `VITE_ENABLE_LAND_DNA_CARD`.
- Phase 3C Founder Pass gating initial version is built behind `VITE_ENABLE_FOUNDER_PASS_GATING`.

## Latest Pushed Commits

- `43af7ab` - Simplify mobile survey resolver
- `8af5570` - Tighten survey resolver validation

## Validation Already Run

- `pnpm run test:land-identity-phase-1b`
- `pnpm run test:land-identity-phase-2a`
- `pnpm run test:survey-resolver-validation`
- `pnpm run test:map-navigation-state`
- `pnpm run lint`
- `pnpm run build`

Earlier phase guards also passed during the phase work:

- `pnpm run test:hyderabad-red-dot-resolution`
- `pnpm run test:growth-forecast-phase-3a`
- `pnpm run test:land-dna-card-phase-3b`
- `pnpm run test:founder-pass-phase-3c`

## Left / Not Started

### Phase 3A Remaining

- Product/UI QA for Growth Forecast card in the live map/detail flow.
- Mobile placement review.
- Replace static/configured forecast payloads only after real data exists.

### Phase 3B Remaining

- Share card polish.
- Public preview QA.
- Mobile/share screenshot testing.

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
