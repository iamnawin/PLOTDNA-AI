# User Investment Estimator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editable buyer price and plot-size estimation to Automated Valuation so users can see current value, 5-year growth, 10-year growth, profit, and profit margin.

**Architecture:** Keep valuation math in a pure helper under `frontend/src/lib/` and render the interactive controls inside `AVMCard`. Reorder `AreaDetail` sections so user estimation sits with AVM before market context, and restyle alternative markets as recommendation cards instead of DNA-first cards.

**Tech Stack:** React 19, TypeScript, Vite, Node check scripts, existing Tailwind classes, lucide-react icons.

---

### Task 1: Valuation Helper

**Files:**
- Create: `frontend/src/lib/userInvestmentEstimate.ts`
- Create: `frontend/scripts/check-user-investment-estimate.mjs`
- Modify: `frontend/package.json`

- [ ] **Step 1: Write the failing check**

Create `frontend/scripts/check-user-investment-estimate.mjs` that imports `buildUserInvestmentEstimate` from `../src/lib/userInvestmentEstimate.ts`, asserts a 1000 sqft plot at Rs5,500/sqft produces Rs55,00,000 current value, Rs77,00,000 5-year value, Rs1,02,66,667 10-year value, and expected profit/margin values.

- [ ] **Step 2: Run the check and confirm red**

Run: `cd frontend && npm run test:user-investment-estimate`

Expected: fail because `frontend/src/lib/userInvestmentEstimate.ts` does not exist yet.

- [ ] **Step 3: Implement the helper**

Create a pure helper that clamps invalid inputs, derives 5-year growth from the AVM projection when available, estimates 10-year growth conservatively, and returns display-ready numeric values for current/future value, profit, profit margin, and per-sqft future prices.

- [ ] **Step 4: Run the check and confirm green**

Run: `cd frontend && npm run test:user-investment-estimate`

Expected: pass with no warnings.

### Task 2: AVM User Estimation UI

**Files:**
- Modify: `frontend/src/components/ui/AVMCard.tsx`

- [ ] **Step 1: Wire helper into AVMCard**

Import `buildUserInvestmentEstimate`, initialize editable inputs from AVM estimated price and area assumption, and render a `User Estimation` panel after the AVM projection chart.

- [ ] **Step 2: Add expected outputs**

Show user quoted price, plot size, current value, 5-year estimate, 10-year estimate, estimated profit, profit margin, and directional disclaimer.

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend && npm run build`

Expected: TypeScript build succeeds.

### Task 3: Area Detail Flow and Recommendation Cards

**Files:**
- Modify: `frontend/src/pages/AreaDetail.tsx`

- [ ] **Step 1: Reorder sections**

Move `MarketPulseCard` directly after AVM/User Estimation and move Buyer Due-Diligence after Sources & References.

- [ ] **Step 2: Restyle Alternative Markets**

Make alternative market cards lead with recommendation reason, price band, YoY growth, and caution; keep DNA score as a smaller secondary metric.

- [ ] **Step 3: Verify app checks**

Run: `cd frontend && npm run lint && npm run build`

Expected: both commands pass.

### Self-Review

- Spec coverage: Tasks cover editable price/size, current/future/profit math, AVM placement, section order, and recommendation-card styling.
- Placeholder scan: No placeholders or unspecified code steps remain.
- Type consistency: Helper name and script path match the UI wiring plan.
