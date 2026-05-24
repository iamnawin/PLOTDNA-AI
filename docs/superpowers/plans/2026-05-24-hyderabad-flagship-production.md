# Hyderabad Flagship Production City Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hyderabad visibly act as the flagship production city across landing, map, and area detail trust surfaces.

**Architecture:** Add a focused frontend metadata helper that computes city production/readiness values from existing city data. Wire that helper into the existing large page components without restructuring them, keeping the first pass small and reversible.

**Tech Stack:** Vite, React, TypeScript, existing Zustand city state, existing Hyderabad city data, Node verification script.

---

## File Structure

- Create: `frontend/src/lib/cityProduction.ts`
  - Owns computed city production metadata and confidence labels.
- Modify: `frontend/src/pages/Landing.tsx`
  - Adds Hyderabad flagship positioning and city readiness metrics to the first user journey.
- Modify: `frontend/src/pages/Home.tsx`
  - Adds flagship coverage cues to the map HUD and recommendation panel.
- Modify: `frontend/src/pages/AreaDetail.tsx`
  - Adds area confidence, source count, and data date near the score.
- Create: `frontend/scripts/check-hyderabad-production.mjs`
  - Verifies Hyderabad production assumptions without adding test dependencies.
- Modify: `frontend/package.json`
  - Adds `test:hyderabad-production` script.

## Task 1: Production Metadata Helper

- [ ] Create `frontend/src/lib/cityProduction.ts` with:

```ts
import type { CityMeta, DataConfidence, MicroMarket } from '@/types'

export interface CityProductionProfile {
  slug: string
  name: string
  isFlagship: boolean
  label: string
  summary: string
  totalLocalities: number
  verifiedCount: number
  partialCount: number
  estimatedCount: number
  uncoveredCount: number
  activeProjectCount: number
  averageScore: number
  priorityTarget: number
}
```

- [ ] Implement `getCityProductionProfile(meta, areas)` by counting `area.dataConfidence ?? 'partial'`, active projects, and average score.
- [ ] Add a Hyderabad override with `isFlagship: true`, `label: 'Flagship production city'`, and `priorityTarget: 50`.
- [ ] Export `getConfidenceLabel(confidence)` for area detail rendering.

## Task 2: Hyderabad Verification Script

- [ ] Create `frontend/scripts/check-hyderabad-production.mjs`.
- [ ] Read `data/cities/hyderabad/localities.json` and `frontend/src/data/hyderabad.ts`.
- [ ] Assert the localities JSON has 200 entries.
- [ ] Assert the source includes `dataConfidence` at least 200 times.
- [ ] Assert the city production helper contains `hyderabad` and `Flagship production city`.
- [ ] Add `test:hyderabad-production` to `frontend/package.json`.

## Task 3: Landing Page Flagship Surface

- [ ] Import `getCityProductionProfile`.
- [ ] Compute the active city profile from `CITIES[activeCity]`.
- [ ] Update the hero eyebrow to emphasize Hyderabad when active.
- [ ] Add a compact metrics row near the city chooser:
  - covered localities
  - verified localities
  - active project zones
  - priority target
- [ ] Add a flagship badge to the Hyderabad city pill.

## Task 4: Map Page Flagship Surface

- [ ] Import `getCityProductionProfile`.
- [ ] Compute the selected city production profile from `cityMeta` and `cityAreas`.
- [ ] Change the top HUD from generic city stats to production coverage stats.
- [ ] Add a small trust strip in the recommendation panel header with confidence counts.
- [ ] Add a Hyderabad flagship badge beside the live city label when selected.

## Task 5: Area Detail Trust Surface

- [ ] Import `getConfidenceLabel`.
- [ ] Compute `confidenceMeta` from `area.dataConfidence`.
- [ ] Show a compact trust row beside the score with:
  - confidence label
  - `area.dataAsOf ?? 'Current cycle'`
  - source count
- [ ] Keep the existing sources section unchanged.

## Task 6: Verification

- [ ] Run `cd frontend && npm run test:hyderabad-production`.
- [ ] Run `cd frontend && npm run lint`.
- [ ] Run `cd frontend && npm run build`.
- [ ] Fix any failures until all three commands pass.

## Self-Review

Spec coverage: The plan covers the metadata layer, landing, map, detail, and verification requirements from the spec.

Placeholder scan: The plan contains no pending placeholder steps.

Type consistency: The helper interface and imported function names are consistent across the tasks.
