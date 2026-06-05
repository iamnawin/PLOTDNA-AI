# PlotDNA

<div align="center">

<img src="frontend/public/plotdna-logo.png" alt="PlotDNA logo" width="88" />

# Know if the plot is worth buying before you commit capital.

PlotDNA is buyer-side land intelligence for serious property decisions. It helps
buyers screen micro-markets, compare risk, understand growth signals, and prepare
the right verification checklist before speaking with brokers.

**Live public release market: Hyderabad**

[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-10b981)](#local-development)
[![Backend](https://img.shields.io/badge/backend-FastAPI-2563eb)](#architecture)
[![Payments](https://img.shields.io/badge/payments-Razorpay%20ready-f59e0b)](#payments)
[![Status](https://img.shields.io/badge/status-Hyderabad%20live-10b981)](#public-release-scope)

</div>

---

## Product Snapshot

PlotDNA answers the buyer's first question:

> Is this location worth deeper verification before I spend time or money on it?

It is not a legal due diligence product and does not replace title, RERA,
zoning, approval, access, or price verification. It is the intelligence layer
that helps a buyer decide what to verify next.

Current product model:

```text
user input -> resolver -> supported locality or nearby market -> area profile -> paid report option
```

What users can do today:

- search Hyderabad areas, coordinates, or map links
- open the map and inspect nearby market context
- view area DNA score, growth story, risk notes, price band, and source context
- compare shortlisted Hyderabad micro-markets
- generate an Rs 99 instant screening PDF
- request or admin-test an Rs 499 custom buyer verification brief

---

## Public Release Scope

Hyderabad is the live public release market. The production experience is
optimized around Hyderabad micro-markets, including map search, coordinate
analysis, area reports, compare view, report downloads, and buyer verification
workflows.

### Production Deployment State

Before 2026-06-05, the public Vercel production deployment reflected `main`
through PR #45, so PR #46 and PR #47 were visible only in preview deployments.
As of 2026-06-05, PR #46 and PR #47 have been merged into `main`; production
visibility now depends on the latest Vercel production deployment for `main`.

If a new feature, polygon, or data update is visible in a PR preview but not on
the public site, first confirm:

1. the PR has been merged into `main`
2. Vercel production deployment for `main` completed successfully
3. the browser is not serving a cached production bundle

Coming-soon markets:

| Market | Public status |
| --- | --- |
| Bangalore | Coming soon |
| Mumbai | Coming soon |
| Chennai | Coming soon |
| Pune | Coming soon |
| Delhi NCR | Coming soon |
| Vijayawada Capital Region | Coming soon |
| Visakhapatnam | Coming soon |
| Dubai | Coming soon |

These markets may have seeded data or resolver experiments in the repo, but they
should not be presented as fully live release markets yet.

---

## Report Products

PlotDNA keeps free browsing open and gates only deeper report actions.

| Product | Price | Purpose | Output |
| --- | ---: | --- | --- |
| Free screening | Rs 0 | Explore Hyderabad areas and compare basic signals | Map, area page, score, risk/growth context |
| Instant screening PDF | Rs 99 | Quick shortlist decision for one area | Area score, growth signals, risk notes, buyer checklist |
| Custom buyer verification brief | Rs 499 | Project-specific buyer verification planning | Buyer context, seller questions, price sanity, verification priorities, next actions |

The Rs 499 brief is intentionally different from the Rs 99 PDF. It uses buyer
inputs such as budget, timeline, project notes, broker quote, or survey details
to produce a more specific verification brief.

---

## Admin/test flow for the Rs 499 buyer brief

Internal QA can test the generated custom buyer verification PDF without paying
through Razorpay on every run.

Local test process:

1. Start the backend with `APP_ENV=development`.
2. Start the frontend with `VITE_API_URL=http://localhost:8000`.
3. Open the app once so an anonymous PlotDNA session is created.
4. In browser DevTools, read `localStorage.plotdna_access_token`.
5. Activate the test entitlement with `POST /api/v1/entitlements/dev/activate`:

```bash
curl -X POST http://localhost:8000/api/v1/entitlements/dev/activate \
  -H "Authorization: Bearer <plotdna_access_token>" \
  -H "Content-Type: application/json" \
  -d "{\"days\":30}"
```

6. Open an area report, click `Pay Rs 499`, enter contact and buyer context,
   then click `Download custom brief`.

Production-safe admin testing uses `ADMIN_ACCESS_USER_IDS`. Add the internal
test user id to that environment variable when a trusted admin account should
bypass payment. `ADMIN_ACCESS_EMAILS` is intentionally ignored in production so
public users cannot self-declare an admin email to unlock paid reports.

---

## Payments

Razorpay is the intended India payment path.

Payment Links can be used immediately:

```bash
VITE_RAZORPAY_PDF_LINK=
VITE_RAZORPAY_CUSTOM_REPORT_LINK=
```

When these links are configured at build time, the Rs 99 and Rs 499 buttons open
the relevant Razorpay payment link. If they are missing, the UI falls back to a
manual checkout request so the user can still leave contact details.

Future backend Checkout/webhook automation should use:

```bash
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
VITE_RAZORPAY_KEY_ID=
RAZORPAY_WEBHOOK_SECRET=
```

Do not commit API keys or downloaded Razorpay CSV files.

---

## Architecture

PlotDNA currently has two layers.

### Curated Market Intelligence

This is the strongest production layer today.

- bundled city/locality datasets live in `frontend/src/data/`
- city and locality resolver data lives under `data/cities/`
- area pages show score, narrative, projects, sources, risks, and report actions
- Hyderabad is the primary public release dataset

### Dynamic Analysis

This layer enriches the curated product when backend/API configuration is
available.

- backend routes can analyze coordinates and resolve map links
- resolver logic maps points to exact, nearby, cluster, or uncovered context
- AI verdict flows enrich area pages when provider keys are configured
- UI fallbacks remain user-safe when backend enrichment is unavailable

Coverage must always be explicit:

| Tier | Meaning |
| --- | --- |
| Tier A | Full micro-market support: polygon-defined locality, stored market profile, area page, sources, projects, verdict support |
| Tier B | Nearby or cluster support: approximate supported-market context with partial confidence |
| Tier C | Coordinate-only support: dynamic location signals without full curated locality intelligence |

See [docs/COVERAGE_TIERS.md](docs/COVERAGE_TIERS.md).

---

## Repository Layout

```text
frontend/
  src/
    components/             UI components
    data/                   bundled city and market datasets
    lib/                    API helpers, resolver, analysis helpers
    pages/                  landing, map, area detail, compare, brochure flows
  scripts/                  focused release checks

backend/
  app/
    api/routes/             FastAPI routes
    services/               scoring, verdict, entitlement, and helper logic
  tests/                    backend regression tests

data/
  cities/                   city geometry, aliases, clusters, resolver data

docs/
  ROADMAP.md
  ALL_INDIA_EXPANSION_PLAN.md
  COVERAGE_TIERS.md
  GTM_STRATEGY.md
```

---

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

Useful checks:

```bash
npm run test:hyderabad-production
npm run test:landing-rollout-copy
npm run test:custom-buyer-brief
npm run lint
npm run build
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Runs at `http://localhost:8000`.

Backend entitlement checks:

```bash
cd backend
python -m unittest tests.test_report_entitlements
```

---

## Release Notes

Current release posture:

- Hyderabad is the launch market.
- Other cities are visible as coming-soon expansion markets.
- Free browsing stays open before asking for contact/payment.
- Paid actions are separated into Rs 99 screening PDF and Rs 499 custom buyer
  verification brief.
- Razorpay Payment Links can be configured now.
- Full Razorpay Checkout/webhook entitlement automation is the next payment
  hardening step.

---

## Recommended Next Engineering Move

The highest-value next technical step is backend-backed Razorpay Checkout:

1. create backend orders for Rs 99 and Rs 499 packages
2. verify Razorpay payment signatures
3. grant report entitlements after payment success or webhook confirmation
4. keep admin/test bypasses for internal QA
5. keep Payment Links as a fallback path

Longer term, move market truth into one backend-owned catalog and make the
frontend consume that catalog through APIs.

---

## Safety Positioning

PlotDNA is buyer-side screening intelligence. It helps users prepare better
questions and verification priorities. It does not certify land, validate title,
replace legal due diligence, or guarantee investment returns.
