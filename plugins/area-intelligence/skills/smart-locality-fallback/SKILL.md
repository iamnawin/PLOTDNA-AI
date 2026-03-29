---
name: smart-locality-fallback
description: Keep PlotDNA's locality parsing, short-link resolution, reverse geocoding, and nearest-area fallback logic aligned across frontend and backend changes.
---

# Smart Locality Fallback

Use this skill when the task touches any of the following:

- map-link parsing or resolution
- locality extraction from coordinates or brochure inputs
- reverse geocoding labels
- nearest-area fallback behavior
- backend-unreachable or timeout degradation paths

## Working rules

1. Preserve PlotDNA's current fallback order unless the task explicitly changes product behavior:
   - parse raw coordinates locally
   - parse full map URLs locally
   - resolve short links through the backend
   - reverse geocode coordinates for display labels
   - prefer live backend scoring when available
   - fall back to the nearest supported area only when that fallback is already supported
   - show an explicit uncovered state instead of inventing area confidence

2. Keep frontend degradation graceful:
   - `frontend/src/lib/api.ts` should keep returning typed fallback results instead of throwing
   - UI copy should explain whether the failure was invalid input, timeout, or backend availability

3. Keep parser logic mirrored when relevant:
   - URL coordinate patterns in `frontend/src/lib/plotAnalysis.ts`
   - matching backend extraction in `backend/app/api/routes/utils.py`
   - if one side gains a new map format, check the other side too

4. Prefer the existing implementation points before adding abstractions:
   - `backend/app/api/routes/utils.py`
   - `frontend/src/lib/api.ts`
   - `frontend/src/lib/plotAnalysis.ts`
   - `frontend/src/components/score/PlotAnalysisCard.tsx`
   - `frontend/src/pages/Home.tsx`
   - `frontend/src/pages/Landing.tsx`

5. Keep the plugin minimal:
   - no new dependencies
   - no plugin-level hooks or app manifests
   - no duplicate locality utilities if a repo utility already exists

## Verification

- confirm full map URLs still parse locally
- confirm short links still route through `/api/utils/resolve-map-link`
- confirm backend failures still surface actionable user-facing detail
- confirm uncovered coordinates do not silently present as covered markets
