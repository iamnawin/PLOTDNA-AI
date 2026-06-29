# Phase 3 Live QA Checklist

Use this checklist after `main` deploys to Vercel. It covers the remaining manual checks for Phase 3A, 3B, and 3C only. Phase 4 / TimesFM remains not started.

## Setup

- Vercel URL: `____________________________`
- Test on desktop Chrome.
- Test on iOS Safari.
- Test on Android Chrome.
- Confirm feature flags for the deployed environment:
  - `VITE_ENABLE_GROWTH_FORECAST_CARD`
  - `VITE_ENABLE_LAND_DNA_CARD`
  - `VITE_ENABLE_FOUNDER_PASS_GATING`

## Public Area Pass Routes

Open each route on the Vercel URL:

- `/card/HYD-PXX-070` - Peerzadiguda, no forecast rows expected.
- `/card/HYD-YXX-060` - Yapral, no forecast rows expected.
- `/card/HYD-AXX-075` - Ameenpur, forecast rows may show only if configured data exists.
- `/card/HYD-BXX-064` - Beeramguda, forecast rows may show only if configured data exists.
- `/card/peerzadiguda` - old slug route must still resolve.
- `/c/HYD-PXX-070` - short alias route must still resolve.

Pass conditions:

- Area name, city, score, risk, infrastructure, connectivity, and development signal render when available.
- Unavailable forecast fields are hidden.
- No `Not available yet`, `requires historical data`, `N/A`, empty placeholder metric card, QR, or barcode appears.
- Do not claim legal/title/approval certification.

## Share And PNG

For at least Peerzadiguda and Ameenpur:

- Native share opens on supported mobile browsers.
- Clipboard fallback works when native share is unavailable.
- PNG download creates an image using the visible Area Pass design.
- PNG filename includes the public area code.
- Shared link opens the same card route in a private/incognito window.

## Founder Pass

From the Area Pass card:

- Founder Pass CTA routes to the existing Area Detail Rs 99 path.
- The share card does not open Razorpay directly.
- Paid state comes from server entitlement, not local UI state.
- Free state shows unpaid/free copy until a real entitlement exists.

For live payment QA:

- Start from the existing Area Detail Rs 99 path.
- Payment link must be server-created.
- Razorpay return re-checks report access.
- Webhook or verified recovery must activate entitlement.
- Fabricated or uncaptured payment IDs must not activate entitlement.

## Growth Forecast Boundary

- Growth Forecast appears only where configured forecast data exists.
- Forecast copy uses ranges, confidence, risk, reason, and disclaimer.
- No guaranteed-return language appears.
- TimesFM remains not started.
- Do not start TimesFM until clean historical data exists with timestamp, source, locality, price unit, and confidence.

## Final Signoff

- Desktop card QA passed.
- iOS Safari card/share/PNG QA passed.
- Android Chrome card/share/PNG QA passed.
- Founder Pass live payment entitlement QA passed.
- Any failures are captured with URL, browser, device, screenshot, and steps to reproduce.
