# Land Identity Feature Flags

Land Identity Phase 1C adds an explicit local/dev/demo switch for unfinished Land Identity flows. Normal builds keep every flag disabled unless a Vite environment variable is intentionally set to the exact string `true`.

## Flags

| Flag | Environment variable | Default |
| --- | --- | --- |
| `enableLandIdentityFlow` | `VITE_ENABLE_LAND_IDENTITY_FLOW` | `false` |
| `enableLocationIntelligencePanel` | `VITE_ENABLE_LOCATION_INTELLIGENCE_PANEL` | `false` |
| `enableSurveyResolver` | `VITE_ENABLE_SURVEY_RESOLVER` | `false` |
| `enableTrustSignals` | `VITE_ENABLE_TRUST_SIGNALS` | `false` |
| `enableMicroZoneMatching` | `VITE_ENABLE_MICRO_ZONE_MATCHING` | `false` |

Only the exact value `true` enables a flag. Values such as `false`, `TRUE`, `1`, `yes`, empty strings, or missing variables all resolve to `false`.

## Local Demo Setup

Create `frontend/.env.local` for local testing only:

```env
VITE_ENABLE_LAND_IDENTITY_FLOW=true
VITE_ENABLE_LOCATION_INTELLIGENCE_PANEL=true
VITE_ENABLE_SURVEY_RESOLVER=false
VITE_ENABLE_TRUST_SIGNALS=false
VITE_ENABLE_MICRO_ZONE_MATCHING=false
```

Do not commit `.env.local`. The repository includes `frontend/.env.example` with all flags set to `false`.

## Production Warning

Do not enable `VITE_ENABLE_SURVEY_RESOLVER` or `VITE_ENABLE_TRUST_SIGNALS` in production yet. Survey Resolver is not wired for official cadastral confirmation, and Trust Signals remain optional, conservative indicators that do not affect existing PlotDNA scoring.

Phase 1C does not change score formulas, polygon data, pending polygon promotion, Hyderabad validation, red-pin behavior, search behavior, Locate Me behavior, or Drop Pin behavior.
