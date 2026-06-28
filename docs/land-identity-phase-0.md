# Hyderabad Land Identity Phase 0

Phase 0 adds safe foundations for the future Hyderabad Land Identity, Location Intelligence, Survey Resolver, and Trust Signal journey. It does not change current PlotDNA product behavior.

## Added

- Feature flags in `frontend/src/lib/features.ts`, all defaulting to `false`.
- Optional land identity models in `frontend/src/lib/landIdentity/types.ts`.
- Isolated service stubs in `frontend/src/lib/landIdentity/`:
  - `locationResolver.ts`
  - `polygonMatcher.ts`
  - `surveyResolver.ts`
  - `trustSignals.ts`
- Additive UI scaffolds:
  - `frontend/src/components/location/LocationIntelligencePanel.tsx`
  - `frontend/src/components/survey/SurveyResolverPanel.tsx`
  - `frontend/src/components/trust/LandTrustCards.tsx`
- Smoke validation script: `frontend/scripts/check-land-identity-phase-0.mjs`.

## Intentionally Not Changed

- Existing score formulas, score weights, score labels, and score rendering.
- `frontend/src/lib/utils.ts`.
- `backend/app/services/scoring_engine.py`.
- Existing MapLibre rendering in `frontend/src/components/map/MapView.tsx`.
- Existing red `searchCoords` pin behavior.
- Existing `triggerCoordAnalysis()` flow in `frontend/src/pages/Home.tsx`.
- Existing area search behavior in `frontend/src/lib/location/search.ts`.
- Existing backend place/address search via `searchLocationAddress()`.
- Existing Hyderabad polygon and pending evidence files under `data/cities/hyderabad/`.
- Pending polygon promotion gates and verified exact-area signal decks.

## Feature Flags

```ts
const fromEnv = (key: string): boolean => {
  return import.meta.env[key] === "true"
}

export const featureFlags = {
  enableLandIdentityFlow: fromEnv("VITE_ENABLE_LAND_IDENTITY_FLOW"),
  enableLocationIntelligencePanel: fromEnv("VITE_ENABLE_LOCATION_INTELLIGENCE_PANEL"),
  enableSurveyResolver: fromEnv("VITE_ENABLE_SURVEY_RESOLVER"),
  enableTrustSignals: fromEnv("VITE_ENABLE_TRUST_SIGNALS"),
  enableMicroZoneMatching: fromEnv("VITE_ENABLE_MICRO_ZONE_MATCHING"),
} as const
```

All Phase 0 UI is currently standalone and unwired. Phase 1C allows explicit local/dev/demo overrides through Vite environment variables, but production behavior remains unchanged while variables are absent or not exactly `true`. See `docs/land-identity-feature-flags.md`.

## Scoring Protection

Land Identity and Trust Signal models are separate from existing `MicroMarket.score` and `Signals`. Trust signal stubs return conservative statuses such as `not_checked` or `manual_verification_required`. They do not compute, update, or influence PlotDNA DNA scores.

## Map/Search Protection

The current map flow remains the source of truth:

- `MapView.tsx` continues rendering current area polygons, flagship boundary, special-use overlays, construction markers, and the red coordinate pin.
- `Home.tsx` continues using `triggerCoordAnalysis()` for coordinate, Locate Me, map URL, and backend geocoder flows.
- Phase 0 does not import or render new panels in `Home.tsx` or `MapView.tsx`.

## Survey And Trust Language

Phase 0 uses conservative copy only:

- "Survey number not confirmed from current map data."
- "Approval signal not checked yet."
- "Documentation confidence requires verified records."

The stubs do not claim HMDA/DTCP/TG-bPASS approval, clear title, ownership verification, or cadastral confirmation.

## Next Phases

1. Wire `LocationIntelligencePanel` into `Home.tsx` behind `enableLocationIntelligencePanel`.
2. Create a flagged, additive state slice for `locationIntelligence` and `showLocationIntelligence`.
3. Reuse current `searchCoords` and backend resolution output to populate coverage and nearest-locality fields.
4. Add micro-zone matching behind `enableMicroZoneMatching` after sourced micro-zone data is available.
5. Add Survey Resolver workflow behind `enableSurveyResolver`; keep user-provided survey numbers as unverified until official/cadastral evidence is integrated.
