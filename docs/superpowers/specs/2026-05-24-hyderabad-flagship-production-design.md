# Hyderabad Flagship Production City Design

## Goal

Make Hyderabad the first city that feels production-ready for end users. The app should still support other cities, but Hyderabad becomes the clearly labeled flagship market with visible coverage, confidence, source, and buyer decision cues.

## Current Context

Hyderabad is already the strongest city in the product. The frontend defaults to Hyderabad, Hyderabad has 200 locality records, and the backend already supports Hyderabad verdict, map, news, AVM, and coordinate-resolution flows. The gap is trust presentation: users cannot quickly tell that Hyderabad is the priority city, how much coverage exists, or whether a specific locality is verified, partial, or estimated.

Current Hyderabad data confidence is mixed. Most locality records are partial or estimated, and active project coverage exists for a smaller subset. The product should be honest about that instead of implying every score has equal backing.

## Approach

Use a trust-first production layer. Add city-level production metadata derived from existing locality data and a Hyderabad override that marks it as flagship. Surface that metadata in three end-user places:

- Landing page: position Hyderabad as the flagship market and show coverage/readiness metrics.
- Map page: show Hyderabad production coverage in the city HUD and recommendation panel.
- Area detail page: show the selected locality confidence, data date, and source count near the score.

This is better than expanding more cities now because a real buyer workflow needs depth and trust before breadth. Other cities remain accessible, but they should not compete visually with Hyderabad as the production reference city.

## User Experience

The first screen should tell users that Hyderabad is the strongest supported market. Users can still choose other cities, but Hyderabad gets a flagship badge and readiness metrics. On the map, the user sees the city is in production focus and can distinguish total covered localities from fully verified localities. On area detail pages, confidence is visible next to the score so buyers understand whether the analysis is source-backed or directional.

## Data Model

Add a lightweight frontend helper that computes a `CityProductionProfile` from existing city data:

- total locality count
- verified, partial, estimated, uncovered counts
- active project locality count
- average DNA score
- flagship boolean
- production label and buyer-facing summary

Hyderabad gets the flagship override. Other cities get computed coverage without the flagship label.

## Error Handling

If a city slug is unknown, use the existing Hyderabad fallback and compute the profile from that fallback. If an area has no explicit `dataConfidence`, display it as partial rather than hiding the trust cue.

## Testing

Add a small Node verification script that checks Hyderabad remains the flagship production city with 200 localities and confidence metadata present. Continue using `npm run lint` and `npm run build` as the main frontend verification gates.

## Scope

This pass does not manually verify all 200 Hyderabad records or change backend scoring. It adds the product shell that makes the flagship strategy visible and honest, then creates the runway for deeper data QA.
