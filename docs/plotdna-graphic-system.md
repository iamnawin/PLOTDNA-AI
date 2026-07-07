# PlotDNA Graphic System

> Visual language specification for PlotDNA — land and location intelligence platform.
> This document is the source of truth for all UI/UX implementation.
> Do not implement scoring, resolver, polygon, or data logic from this document.

**Version:** 1.0  
**Date:** 2026-07-07  
**Status:** Approved — Handoff to Implementation

---

## 1. Product Visual Identity

### What PlotDNA Should Feel Like

PlotDNA is a **land intelligence instrument**, not a real estate listing.

The visual language must communicate:
- Precision and data-grounding — every signal is sourced, not guessed
- Trust through restraint — no clutter, no fake completeness
- Premium clarity — a user should feel they are reading a briefing, not browsing a portal

**Reference mental model:** Think Bloomberg Terminal meets boarding pass.  
Dark, dense intelligence UI in-app. Clean, minimal pass-style card when shared publicly.

### The Two Modes

| Mode | Context | Feel |
|------|---------|-------|
| In-app intelligence | Map, search, panels, detail | Dark navy, teal accents, high density |
| Public share card | Area Pass, Land DNA Card | Off-white, boarding-pass, no dark chrome |

These two modes must never be mixed. The public card is not a screenshot of the dark UI.

### What PlotDNA Is Not

- Not a real estate listing portal (no price tags, bedroom counts, broker logos)
- Not a generic SaaS dashboard (no flat pastel boxes, no generic KPI cards)
- Not a government data dump (no raw tables, no `.csv` aesthetics)
- Not a neon-heavy consumer app (no gradient explosions, no glow abuse)

---

## 2. Visual Principles

### 2.1 Intelligence First, Decoration Second

Every visual element must earn its place by communicating signal or structure.
No decorative shapes, no background patterns, no ambient animation unless it communicates state change.

### 2.2 Verified vs Generated — Always Visually Distinct

Scored, verified polygon areas and generated/pending coverage cells must never look the same.
A user should be able to tell at a glance whether they are looking at verified intelligence or placeholder coverage.

### 2.3 No Fake Data

- Never show a metric that is not available as a filled/confident value
- Do not display "N/A", "Not available yet", or "Requires historical data" on public-facing cards
- Instead: omit unavailable fields entirely, or substitute with the nearest available intelligence field
- Internal admin/dev views may show unavailability — user-facing views must not

### 2.4 Public Cards Must Feel Complete

The Area Pass / Land DNA Card is the first thing a non-user sees when a card is shared.
It must look and feel finished, premium, and trustworthy — even when only partial intelligence is available.
A card with 4 clean signals is better than a card with 7 signals and 3 showing "N/A".

### 2.5 Founder Pass = Early Access Instrument

The Founder Pass CTA must feel like an early-access unlock, not a checkout screen.
Language and visual weight should communicate exclusivity and value — never urgency/scarcity pressure.

### 2.6 Mobile Is Not a Smaller Desktop

Mobile layouts must be designed as primary, not as responsive shrinks.
Intelligence panels on mobile should collapse gracefully — not just truncate.

---

## 3. Color System

### 3.1 Core Palette

| Role | Hex | Usage |
|------|-----|-------|
| App background | `#0a0a0a` | Full dark canvas |
| Panel surface | `#111827` | Cards, sidebars, drawers |
| Elevated surface | `#1f2937` | Tiles, table rows, hover state |
| Border subtle | `#374151` | Dividers, input borders |
| Border strong | `#6b7280` | Active elements, selection |
| PlotDNA teal | `#14b8a6` | Primary accent, DNA badge ring, CTA |
| PlotDNA teal dim | `#0d9488` | Hover state of teal elements |
| Text primary | `#f9fafb` | Headlines, area names |
| Text secondary | `#9ca3af` | Labels, metadata |
| Text muted | `#6b7280` | Timestamps, fine print |

### 3.2 Score / Signal Colors

These colors are semantic and must be used consistently across badges, polygons, bars, and tiles.

| Score Range | Label | Color | Hex |
|-------------|-------|-------|-----|
| 86–100 | Goldzone | Emerald | `#10b981` |
| 66–85 | Good Growth | Green | `#22c55e` |
| 41–65 | Moderate | Amber | `#f59e0b` |
| 0–40 | High Risk | Red | `#ef4444` |

### 3.3 Map Coverage Colors

| Layer Type | Color | Hex | Opacity |
|------------|-------|-----|---------|
| Verified scored polygon | Score-semantic (see above) | — | 0.55 fill, 0.85 border |
| Generated expansion cell | Warm amber | `#d97706` | 0.18 fill, 0.45 border |
| Pending context cell | Cool grey | `#374151` | 0.22 fill, 0.4 border |
| Selected polygon | White border ring | `#ffffff` | 0.9 border, no fill change |
| Hover polygon | Lighten fill | +20% lightness | 0.7 fill |
| Locate Me / Red pin | Signal red | `#ef4444` | solid |

### 3.4 Public Card Palette (Area Pass / Land DNA Card)

| Role | Hex | Usage |
|------|-----|-------|
| Card background | `#f8fafc` | Off-white, near-white |
| Card surface alt | `#f1f5f9` | Metric tile backgrounds |
| PlotDNA teal strip | `#14b8a6` | Left edge accent, barcode strip |
| Metric label text | `#475569` | Uppercase labels |
| Metric value text | `#0f172a` | Large bold numbers |
| Footer text | `#94a3b8` | Disclaimer, fine print |
| Border/divider | `#e2e8f0` | Separators within card |
| QR code | `#0f172a` on `#f8fafc` | Maximum contrast |

---

## 4. Typography Direction

### 4.1 Font Stack

| Role | Font | Fallback |
|------|------|---------|
| Primary UI | IBM Plex Mono | `monospace` |
| Area names / headlines | IBM Plex Sans Semibold | `sans-serif` |
| Score numbers | IBM Plex Mono Bold | `monospace` |
| Labels / chips | IBM Plex Mono | `monospace` |
| Card body text | IBM Plex Sans | `sans-serif` |

IBM Plex Mono as the dominant typeface communicates precision and data-instrument feel.
Reserve IBM Plex Sans for large display text (area names, score headlines) where readability at large sizes matters.

### 4.2 Type Scale

| Role | Size (mobile) | Size (desktop) | Weight | Case |
|------|--------------|----------------|--------|------|
| Area name | 22px | 28px | 700 | Title |
| Score number | 36px | 48px | 800 | — |
| Section headline | 14px | 16px | 600 | Uppercase |
| Metric value | 20px | 24px | 700 | — |
| Metric label | 10px | 11px | 500 | Uppercase, tracked |
| Body text | 13px | 14px | 400 | — |
| Fine print / disclaimer | 10px | 11px | 400 | — |

### 4.3 Hierarchy Rules

1. Area name is always the largest text element on the panel or card
2. Score number is the second-largest
3. Signal labels must be uppercase, tracked (+0.05em), small
4. Never use italic in data/intelligence contexts — it implies estimate/uncertainty
5. Avoid text below 10px on any surface (mobile or desktop)
6. Card metric values must be bold enough to scan in 1 second

---

## 5. Component Design Language

---

### 5.1 PlotDNABadge

**Purpose:** Score indicator — the primary DNA score ring or pill.

**Where used:** AreaDetail panel, map tooltip, Area Pass card, share thumbnail.

**Required fields:**
- `score` (0–100 integer)
- `label` (Goldzone / Good Growth / Moderate / High Risk)
- `confidence` (verified / partial / estimated)

**Visual behavior:**
- Circular ring variant: score-colored ring around a centered number
- Pill variant: score-colored left border + label text
- Ring width proportional to confidence (verified = full ring, partial = dashed, estimated = thin dotted)
- Confidence badge: small indicator dot — solid for verified, hollow for partial

**Mobile behavior:**
- Pill variant preferred on mobile (ring is small at <40px)
- Score number and label always visible — never truncated

**Do:**
- Always show the label text alongside the number
- Match ring/pill color exactly to the score-semantic palette

**Don't:**
- Do not show a filled ring for an estimated score without the dotted/dashed treatment
- Do not use generic grey for any score — even low confidence must use the score-semantic color

---

### 5.2 MetricTile

**Purpose:** Display a single intelligence signal value with label and optional trend.

**Where used:** Location Intelligence panel, AreaDetail, Area Pass card.

**Required fields:**
- `label` (uppercase string, e.g., "INFRASTRUCTURE")
- `value` (display string, e.g., "Strong" / "74" / "High")
- `available` (boolean — if false, tile must be omitted on public cards)

**Optional fields:**
- `trend` (+/-/neutral)
- `sublabel` (small note below value)

**Visual behavior:**
- Dark surface: `#1f2937` background, teal left-border accent (2px)
- Label: small uppercase muted text
- Value: large bold primary text
- Trend indicator: small arrow icon in green/red/grey
- Unavailable tile: never rendered on public-facing card; may show "Pending" in admin/internal views only

**Mobile behavior:**
- 2-column grid on mobile
- Label may truncate to 1 line; value must never truncate

**Do:**
- Always omit tiles where `available: false` on public cards
- Keep value text large enough to read instantly

**Don't:**
- Do not show empty tiles
- Do not show placeholder dashes or "—" as a value
- Do not add decorative icons that have no semantic meaning

---

### 5.3 SignalStrip

**Purpose:** Horizontal bar showing signal strength across the 7 DNA signals.

**Where used:** AreaDetail score breakdown section.

**Required fields:**
- `signals` — array of `{ name, weight, value, available }`

**Visual behavior:**
- Horizontal bar per signal, width = `value * weight`
- Color = score-semantic for each signal's contribution
- Label: signal name left, value percentage right
- Unavailable signals: render as a muted empty bar with "No data" label
- Total weighted score derivation shown at the bottom

**Mobile behavior:**
- Stack vertically, full width
- Labels must remain readable at 13px

**Do:**
- Show all 7 signals — available and unavailable — in the in-app view
- Clearly distinguish available vs unavailable bars (color vs muted)

**Don't:**
- Do not hide unavailable signals in the in-app view (hide only on public card)
- Do not fabricate a bar fill for unavailable signals

---

### 5.4 AreaCodePill

**Purpose:** Display the unique area/pass code identifier.

**Where used:** Area Pass card, map tooltip, share actions.

**Required fields:**
- `code` (e.g., `HYD-KOKAPET-7A2`)

**Visual behavior:**
- Monospace font, uppercase
- Teal-bordered pill, dark background (in-app) or light background (card)
- Small fixed height (24–28px)
- Copy-on-click behavior (in interactive contexts)

**Mobile behavior:**
- Always full text visible — never truncated

**Do:**
- Treat the area code as a unique identifier — same visual weight as a seat number on a boarding pass

**Don't:**
- Do not style as a decorative badge — it is a functional identifier

---

### 5.5 MapLegend

**Purpose:** Explain polygon coverage types on the map.

**Where used:** Map view — always visible, collapsible on mobile.

**Required entries:**
- Verified scored area (color swatch + label)
- Generated expansion coverage (amber swatch + label)
- Pending / data upcoming (grey swatch + label)
- Selected area (white border swatch + label)

**Visual behavior:**
- Compact floating panel, bottom-left or bottom-right of map
- Semi-transparent dark background (`rgba(10,10,10,0.85)`)
- Small color swatches (12×12px) followed by label text

**Mobile behavior:**
- Collapsed by default — toggle icon to expand
- When expanded, overlays map at bottom

**Do:**
- Always differentiate verified vs generated vs pending with visually distinct treatments

**Don't:**
- Do not show the legend inside the main sidebar (map-only floating element)

---

### 5.6 AreaPassCard

**Purpose:** The premium public share card for a PlotDNA-scored area.

**Where used:** `/area/:slug` public view, share PNG export, social share.

**Required fields:**
- `areaName`
- `city`
- `areaCode`
- `dnaScore` (integer)
- `scoreLabel`
- `availableMetrics[]` — only metrics with real data
- `qrCodeUrl`
- `founderPassCTA` (boolean)

**Layout (boarding pass structure):**

```
┌────────────────────────────────────────────────────┐
│ ▐█ BARCODE (top)                                   │
│────────────────────────────────────────────────────│
│ ▐  [TEAL STRIP]  │  PLOTDNA               SCORE   │
│ ▐                │  Area Name             [  87 ]  │
│ ▐                │  City • Area Code               │
│ ▐                │  ─────────────────────────────  │
│ ▐                │  METRIC  METRIC  METRIC         │
│ ▐                │  value   value   value          │
│ ▐                │                                 │
│ ▐                │  [QR Code]  [Founder Pass CTA]  │
│────────────────────────────────────────────────────│
│ ▐█ BARCODE (bottom)                                │
│────────────────────────────────────────────────────│
│  Disclaimer text (fine print)                      │
└────────────────────────────────────────────────────┘
```

**Visual behavior:**
- Background: `#f8fafc` (off-white)
- Left teal strip: 8px wide, full card height, `#14b8a6`
- Top and bottom barcodes: decorative, area-code encoded
- Score badge: right-aligned, large, score-semantic ring
- Metrics: only `available: true` fields rendered, 2–4 max visible
- QR code: links to live area page
- Founder Pass CTA: teal button, "Unlock Full Intelligence — Rs 99"
- Disclaimer: fine print footer

**Mobile behavior:**
- Full-width card, stacked layout
- Metrics collapse to 2 visible with expand option

**Do:**
- Export as PNG at 2× resolution for social sharing
- Hide all unavailable metrics — never placeholder

**Don't:**
- Do not use the dark in-app color palette on this card
- Do not show error states or "N/A" values
- Do not add map thumbnail to the card (it clutters the boarding-pass structure)

---

### 5.7 ShareActions

**Purpose:** Allow users to share an Area Pass card.

**Where used:** Below the AreaPassCard or in the Area Pass overlay.

**Actions:**
- Copy link
- Download PNG
- Share to WhatsApp
- Share to X/Twitter

**Visual behavior:**
- Small icon-button row, teal accent
- "Copy link" shows a confirmation tick for 2 seconds
- Download triggers PNG export at 2× resolution

**Mobile behavior:**
- Full-width action row on mobile
- Uses native share sheet on mobile when available

---

### 5.8 FounderPassCard

**Purpose:** Promote the Rs 99 Founder Pass with early-access framing.

**Where used:** Beneath AreaPassCard, on the paywall gate.

**Required fields:**
- `price` (Rs 99)
- `benefits[]`
- `ctaLabel`
- `remainingCount` (optional — only if real, not fake scarcity)

**Visual behavior:**
- Dark surface (`#111827`) with teal accent border (1px)
- "Founder Pass" in teal monospace
- Benefits list: 3–5 items, checkmark icons in teal
- CTA button: full-width teal, "Unlock Lifetime Access — Rs 99"
- No countdown timers, no fake "Only X left" unless real

**Mobile behavior:**
- Full-width card, stacked
- CTA button always visible without scroll

**Do:**
- Frame as early-access unlock to a permanent intelligence tool
- List specific, concrete benefits (e.g., "Full 7-signal breakdown", "PDF export", "All cities")

**Don't:**
- Do not use urgency language ("Offer ends tonight", "Limited time")
- Do not show fake scarcity numbers
- Do not style as a generic payment form

---

### 5.9 DataPendingState

**Purpose:** Honest state for areas in the coverage map with no verified score yet.

**Where used:** Map hover/click on pending context cells, search results for pending areas.

**Required fields:**
- `areaName` (approximate)
- `boundaryConfidence` ("approximate")
- `areaSizeKm2` (approximate)
- `pendingSignals[]` — which signal categories are missing

**Visual behavior:**
- Muted grey card, no score badge
- Header: area name + "Data Pending" chip (amber)
- Body: approximate area size, boundary confidence note
- Signals section: list of missing signal categories
- Footer: "PlotDNA will validate this area before assigning a score"
- No score ring, no score number, no growth label

**Mobile behavior:**
- Same as desktop — no score elements to manage

**Do:**
- Be explicit about what is missing and why
- Show approximate area context (village/mandal/district from official sources)

**Don't:**
- Do not show any score or growth label for pending areas
- Do not show a grey/zero score ring — absence of ring communicates no data

---

### 5.10 UncoveredGapState

**Purpose:** State for locations completely outside PlotDNA coverage.

**Where used:** Search results and map clicks outside all coverage zones.

**Visual behavior:**
- Minimal card, dark surface
- Icon: simple map outline
- Heading: "Area not yet covered"
- Body: nearest covered city/area with distance
- CTA: "Suggest this area" (links to feedback form or email)
- Expansion roadmap note (e.g., "Telangana state coverage in progress")

**Do:**
- Direct users to the nearest covered area
- Invite them to suggest coverage expansion

**Don't:**
- Do not show a zero score
- Do not show placeholder signal bars

---

## 6. Area Pass / Land DNA Card Design

### Approved Direction

The Area Pass is a **boarding-pass-style intelligence certificate** — not a screenshot of the dark app UI.

It must:
- Stand alone as a sharable artifact (PNG, link)
- Communicate PlotDNA score and key signals without the app UI
- Feel premium and trustworthy when viewed by someone who has never used PlotDNA
- Invite the viewer to access the full intelligence platform

### Structural Elements

| Element | Position | Notes |
|---------|----------|-------|
| Top barcode | Top edge | Decorative, encodes area code |
| PlotDNA wordmark | Top-left | Small, subdued |
| Teal side strip | Left edge, full height | 8px, `#14b8a6` |
| Area name | Main body, large | IBM Plex Sans Semibold |
| City | Below area name | Secondary text |
| Area code pill | Below city | Monospace, teal border |
| Score badge | Right side, prominent | Score ring + number + label |
| Metric tiles | Below area info | 2–4 tiles, available metrics only |
| QR code | Bottom-right | Links to live area page |
| Founder Pass CTA | Bottom-left | Teal button, compact |
| Bottom barcode | Bottom edge | Decorative |
| Disclaimer | Footer | Fine print, `#94a3b8` |

### Metric Field Selection Rules

Show metrics in this priority order, stopping when 4 are filled:

1. PlotDNA Score (always shown)
2. Infrastructure Readiness (if available)
3. Development Signal (if available)
4. Connectivity Signal (if available)
5. Risk Level (if available)
6. Signal Class (if available)

If fewer than 2 non-score metrics are available, show the score prominently with the area intelligence summary text instead.

### What the Card Must Never Show

- "N/A" or "Not available"
- "Requires historical data"
- "Data pending" (that is for the map hover, not the shareable card)
- Score ring for pending/uncovered areas
- In-app dark chrome, sidebar, map thumbnails

---

## 7. Mobile Screen Guidance

### 7.1 Mobile Home / Search

- Full-screen search bar at top
- Recent searches below (3 max, compact pills)
- "Locate Me" button — prominent, teal
- Background: dark map canvas
- No clutter — search is the primary action

### 7.2 Mobile Map Result

- Map fills 60% of screen height
- Selected area card slides up from bottom (bottom sheet)
- Card shows: area name, score badge, 2 key metrics, "See Full Intelligence" CTA
- Map controls (layers, 3D) collapse to icon-only bar

### 7.3 Mobile Intelligence Panel

- Full-screen drawer — slides up over map
- Header: area name, score badge, confidence level
- Sections scroll vertically: Score breakdown → Signals → Infrastructure → Connectivity → Development
- Each section collapses/expands (accordion)
- Share button fixed at bottom

### 7.4 Mobile Public Area Pass

- Card fills screen width
- Scroll vertically to see full card
- Export PNG and Share buttons below card
- Founder Pass CTA below share actions

### 7.5 Mobile Founder Pass

- Full-screen modal or bottom sheet
- Benefits stacked vertically
- Price large and centered
- CTA full-width at bottom
- No multi-column layout

---

## 8. Map Visual Language

### 8.1 Polygon Styles

| Polygon Type | Fill Color | Fill Opacity | Border Color | Border Width | Border Opacity |
|--------------|-----------|-------------|-------------|-------------|---------------|
| Verified scored — Goldzone | `#10b981` | 0.55 | `#10b981` | 1.5px | 0.90 |
| Verified scored — Good Growth | `#22c55e` | 0.50 | `#22c55e` | 1.5px | 0.85 |
| Verified scored — Moderate | `#f59e0b` | 0.45 | `#f59e0b` | 1.5px | 0.80 |
| Verified scored — High Risk | `#ef4444` | 0.45 | `#ef4444` | 1.5px | 0.80 |
| Generated expansion cell | `#d97706` | 0.18 | `#d97706` | 1px | 0.45 |
| Pending context cell | `#374151` | 0.22 | `#6b7280` | 1px | 0.40 |
| Selected polygon | (inherit fill) | +0.15 | `#ffffff` | 2px | 0.90 |
| Hover polygon | (inherit fill) | +0.15 | (inherit) | — | — |
| Boundary/debug layer | — | 0 | `#6b7280` | 0.5px | 0.30 |

### 8.2 Locate Me / Pin Markers

- Locate Me marker: `#ef4444` signal red, pulsing ring animation (2s ease-in-out loop)
- Drop Pin marker: `#14b8a6` teal, static (no pulse — user-placed, confirmed state)
- Coordinate search result: `#f59e0b` amber, brief 1s pulse then static

### 8.3 Map Legend Labels

Use exactly these labels (no alternatives):

| Symbol | Label |
|--------|-------|
| Green fill | Verified Intelligence |
| Amber fill (dim) | Expansion Coverage |
| Grey fill (dim) | Data Upcoming |
| White border | Selected Area |

### 8.4 Rules

- Pending/generated cells must never use score-semantic colors (green/amber-strong/red)
- Pending cell tooltips must not show a score ring or score number
- Large "broad" cells with `boundaryConfidence: "broad"` must render at 70% of normal verified opacity and tooltip must state "Generated broad market cell — boundaries pending verification"
- Debug/boundary layers are for development only — never ship in production with them on by default

---

## 9. Content and Copy Rules

### 9.1 Official Label Strings

Use exactly these labels across all UI surfaces, cards, and exports:

| Concept | Official Label |
|---------|---------------|
| Primary score | **PlotDNA Score** |
| Risk indicator | **Risk Level** |
| Physical/road infrastructure | **Infrastructure Readiness** |
| Transit/road access | **Connectivity Signal** |
| Development activity | **Development Signal** |
| Overall signal classification | **Signal Class** |
| Area access tier | **Access Class** |
| Founder Pass product | **Founder Pass — Rs 99 Lifetime Access** |

### 9.2 Score Tier Labels

| Score | Label |
|-------|-------|
| 86–100 | Goldzone |
| 66–85 | Good Growth |
| 41–65 | Moderate |
| 0–40 | High Risk |

### 9.3 Confidence Labels

| Level | Label |
|-------|-------|
| All 7 signals verified | Verified Intelligence |
| 4–6 signals verified | Partial Intelligence |
| Fewer than 4 signals | Estimated — Limited Data |
| No signals | Data Pending |
| Outside coverage | Not Covered |

### 9.4 Standard Disclaimer

Use this exact text on all public-facing cards, PDFs, and share exports:

> PlotDNA provides location intelligence signals, not legal, title, or approval certification. Verify all documents and ground reality before making any purchase or investment decision.

Short form (for space-constrained contexts):

> Intelligence signals only — not legal/title certification. Verify before purchase.

### 9.5 Copy Rules

- Use "PlotDNA Score" — never "DNA Score" or "plot score" in UI text
- Use "Founder Pass" — never "Premium", "Pro", or "Subscription"
- Use "Location Intelligence" — never "property data" or "listing details"
- Use "Signal" not "metric" in user-facing labels (aligns with product brand language)
- Never use "Buy now", "Get deal", or transactional e-commerce language for Founder Pass
- Use "Unlock" or "Access" — "Unlock Full Intelligence — Rs 99"

---

## 10. Implementation Handoff Checklist

### 10.1 Components to Build / Update

| Component | Status | Notes |
|-----------|--------|-------|
| `PlotDNABadge` | Build | Ring + pill variants, confidence treatment |
| `MetricTile` | Build | Available-only render, trend optional |
| `SignalStrip` | Build | 7-bar breakdown, unavailable bars muted |
| `AreaCodePill` | Build | Copy-on-click, monospace |
| `MapLegend` | Build | Floating, collapsible on mobile |
| `AreaPassCard` | Build | Boarding-pass layout, light palette |
| `ShareActions` | Build | PNG export, native share, copy link |
| `FounderPassCard` | Build | Early-access framing, no fake scarcity |
| `DataPendingState` | Build | No score elements, pending signals listed |
| `UncoveredGapState` | Build | Nearest covered area, suggest CTA |

### 10.2 Pages to Update

| Page | Update |
|------|--------|
| `/map` (Home) | Apply MapLegend, polygon style rules, marker styles |
| `/area/:slug` | Apply AreaPassCard, SignalStrip, MetricTile, ShareActions |
| `/area/:slug` (pending) | Apply DataPendingState instead of score UI |
| Public share route | Render AreaPassCard standalone, PNG export |
| Paywall gate | Apply FounderPassCard, remove generic modal chrome |

### 10.3 Responsive Breakpoints

| Breakpoint | px | Behavior |
|------------|-----|---------|
| Mobile | < 640px | Single column, bottom sheet panels |
| Tablet | 640–1024px | Two-column where applicable |
| Desktop | > 1024px | Full sidebar + map split |

### 10.4 Share PNG Export Rules

- Export at 2× device resolution (minimum 800px wide)
- Export only `AreaPassCard` — not the full page or dark UI chrome
- Background must be `#f8fafc` (off-white) — not transparent
- Include top and bottom barcodes in export
- QR code must be legible at 1× size (minimum 80×80px in export)
- Disclaimer footer must be included in export
- File name: `plotdna-{areaSlug}-pass.png`

### 10.5 Public Card Route Rules

- Public share URL: `/pass/:areaSlug` or `/area/:areaSlug/pass`
- Public route must not require login to view
- Public route renders `AreaPassCard` only — no dark app UI
- If area is pending/uncovered, render `DataPendingState` on light background — not the full card

### 10.6 Dynamic Metric Hiding Rules

Before rendering `AreaPassCard` or any public-facing card:

```
1. Fetch metrics array for area
2. Filter: keep only metrics where available === true
3. Sort by priority order (see Section 6 — Metric Field Selection Rules)
4. Render first 4 available metrics only
5. If < 2 available: render score + intelligence summary text only
6. Never render a tile for unavailable metric
7. Never render "N/A", "—", or "Pending" as a value
```

### 10.7 Visual QA Checklist

Before shipping any card, panel, or map update:

**Score / Badges**
- [ ] Score number matches the correct tier color
- [ ] Estimated scores show dashed/dotted ring treatment
- [ ] No score badge appears on pending or uncovered areas

**Cards**
- [ ] Area Pass card uses light palette only — no dark chrome
- [ ] No "N/A", "Not available", or "Requires historical data" visible
- [ ] Disclaimer footer present on all public cards and PNG exports
- [ ] QR code is scannable at 1× render size

**Map**
- [ ] Pending cells are visually subdued vs verified cells
- [ ] Generated expansion cells use amber (dim), not score-semantic colors
- [ ] Large broad cells have "Generated broad market cell" tooltip
- [ ] Map legend present and accurate

**Mobile**
- [ ] All metric labels readable at 10px minimum
- [ ] Score number and area name visible without scroll on mobile
- [ ] CTA buttons are full-width and accessible on mobile

**Copy**
- [ ] "PlotDNA Score" — not "DNA Score" or "plot score"
- [ ] "Founder Pass — Rs 99 Lifetime Access" — not "Premium" or "Pro"
- [ ] Disclaimer text matches approved copy exactly

**Performance**
- [ ] PNG export does not block UI thread (use `html2canvas` or equivalent async)
- [ ] Map polygon layers do not re-render on unrelated state changes
- [ ] Mobile Intelligence Panel scrolls smoothly (no janky accordion)

---

*End of PlotDNA Graphic System v1.0*

*Next: Codex implementation using this document as spec.*
