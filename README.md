# PlotDNA

<div align="center">

**Buyer-side land intelligence before you trust the pitch.**

PlotDNA helps property buyers screen micro-markets, compare risk, and prepare the
right verification checklist before talking to brokers.

**Live release market: Hyderabad**

</div>

---

## Public Release Scope

Hyderabad is the live public release market. The current production experience is
optimized around Hyderabad micro-markets, including map search, coordinate
analysis, area reports, comparison views, and buyer verification workflows.

Coming-soon markets:

- Bangalore
- Mumbai
- Chennai
- Pune
- Delhi NCR
- Vijayawada Capital Region
- Visakhapatnam
- Dubai

These cities may have seeded datasets or resolver experiments in the repo, but
they should not be presented as fully live public release markets yet.

---

## What PlotDNA Does Today

PlotDNA is a supported-zones intelligence product. It is not yet a nationwide
"any plot in India" engine.

Current product model:

```text
user input -> resolver -> supported locality or nearby market -> area profile -> optional dynamic enrichment
```

The strongest current flows are:

- free homepage search and Hyderabad market discovery
- Hyderabad map and coordinate screening
- area DNA score, growth view, risk notes, and source references
- compare view for shortlisted Hyderabad micro-markets
- instant screening PDF
- custom buyer verification brief request

If a searched point is outside exact supported coverage, PlotDNA must show it as
nearby, approximate, or unsupported rather than exact.

---

## Report Products

PlotDNA currently separates free browsing from paid report actions.

### Free

- homepage search
- Hyderabad map exploration
- basic area DNA score
- compare page
- general risk and growth context

### Rs 99 instant screening PDF

Quick shortlist report for one area:

- area score
- growth signals
- risk notes
- buyer checklist
- source/context summary

### Rs 499 custom buyer verification brief

A deeper buyer-side brief that is not the same output as the Rs 99 PDF. It uses
buyer context such as budget, timeline, notes, and the target area to produce:

- buyer context summary
- verification priorities
- seller questions
- price sanity checks
- risk flags
- next actions

This is a buyer verification brief, not legal due diligence, title advice, or
investment advice.

---

## Payments

Razorpay is the intended India payment path.

Frontend payment-link environment variables:

```bash
VITE_RAZORPAY_PDF_LINK=
VITE_RAZORPAY_CUSTOM_REPORT_LINK=
```

When those links are configured at build time, the Rs 99 and Rs 499 buttons can
open the relevant checkout/payment link. If they are missing, the UI falls back
to a manual checkout request so the user can still leave contact details.

Future checkout/webhook integration should use:

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
- area detail pages show score, narrative, projects, sources, and report actions

### Dynamic Analysis

This layer exists but is not the sole source of truth yet.

- backend routes can analyze coordinates
- resolver logic can map points to exact, nearby, cluster, or uncovered context
- AI verdict flows can enrich area pages when backend/API configuration is present
- UI fallbacks should remain user-safe when backend enrichment is unavailable

---

## Coverage Tiers

PlotDNA should always describe coverage explicitly:

- **Tier A: Full micro-market support** - polygon-defined locality, stored market
  profile, area page, sources, projects, verdict support.
- **Tier B: Nearby or cluster support** - approximate supported-market context
  with partial confidence.
- **Tier C: Coordinate-only support** - dynamic location signals without full
  curated locality intelligence.

See [docs/COVERAGE_TIERS.md](docs/COVERAGE_TIERS.md).

---

## Repository Layout

```text
frontend/
  src/
    components/             UI components
    data/                   bundled city and market datasets
    lib/                    API helpers, resolver, analysis helpers
    pages/                  landing, home, area detail, brochure flows
  scripts/                  focused release checks

backend/
  app/
    api/routes/             FastAPI routes
    services/               scoring, verdict, payment, and helper logic

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

---

## Release Notes

Current release posture:

- Hyderabad is the launch market.
- Other cities are visible as coming-soon expansion markets.
- Free browsing stays open before asking for contact/payment.
- Paid actions are separated into Rs 99 screening PDF and Rs 499 custom buyer
  verification brief.
- Razorpay payment links can be configured now; full Razorpay Checkout/webhook
  entitlement automation is the next payment hardening step.

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
