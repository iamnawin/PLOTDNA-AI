# Next Roadmap

## Immediate order

1. Android app identity
   - icon
   - splash screen
   - app name
   - package verification
   - release checklist
2. Native Android smoke test through Capacitor
3. Play Store internal test build

## What-if scenario MVP

Build the MVP next as:

- backend endpoint: `POST /api/v1/what-if`
- frontend panel on `AreaDetail`
- deterministic rules first, LLM summary second

## What-if MVP test plan

- event types:
  - metro
  - airport
  - IT park
  - zoning / freehold rule
  - delay / oversupply / litigation
- outputs:
  - `demandDelta`
  - `rentPressureDelta`
  - `liquidityDelta`
  - `constructionRiskDelta`
  - narrative summary
- validation:
  - same input -> stable structured output
  - summary must reflect numeric deltas
  - unsupported area must fail cleanly

## After the MVP

1. Dubai-specific what-if tuning
2. Subscription / IAP flow
3. App Store / Play Store monetization release path
