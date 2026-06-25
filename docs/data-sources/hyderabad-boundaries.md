# Hyderabad Coverage Geometry Sources

## Market boundary

The flagship coverage boundary is a PlotDNA product boundary: an irregular
Hyderabad investment-market polygon around `[17.385, 78.487]`. It is designed to
contain the market scope requested for the Hyderabad release, including
Sadasivpet, Vikarabad, Sangareddy, Isnapur, Medchal, LB Nagar, Rajiv Gandhi
International Airport, Farooqnagar/Shadnagar, Bhongir-side east growth pockets,
and selected 65-70 km outskirts.

It is not an HMDA, GHMC, district, mandal, ward, village, cadastral, zoning, or
title boundary. The product must not describe it as one.

## Selectable market cells

`scripts/build_hyderabad_coverage.py` partitions the product boundary using the
existing market locality centroids plus context-only named place seeds from
OpenStreetMap and the Hyderabad uncovered-area backlog. These cells remove
unexplained map holes and avoid large fake outer wedges while keeping generated
geometry clearly labelled. Scored market cells are marked:

- `boundaryKind: generated_market_cell`
- `boundaryConfidence: broad`

The cells are market-resolution geometry, not claims about administrative
limits. A cell can be replaced by a sourced locality boundary later without
changing its stable slug or catalog identity.

Context-only subdivision cells are marked:

- `boundaryKind: place_context_cell`
- `boundaryConfidence: approximate`
- `contextOnly: true`

They are not scored market records and must not be presented as legal village,
ward, cadastral, or administrative polygons.

## Airport special-use area

The Rajiv Gandhi International Airport operational envelope is based on the
bounding extent returned for OpenStreetMap relation
[10734455](https://www.openstreetmap.org/relation/10734455), retrieved on
2026-06-22 through Nominatim. OpenStreetMap data is available under ODbL 1.0.

The committed first-pass airport envelope is intentionally labelled `broad`.
It prevents airport operational land from appearing as an unexplained coverage
hole or being presented as ordinary residential market land. It is not a legal
airport-property boundary.

## Replacement policy

Prefer downloadable, legally reusable official geometry when it becomes
available. Every replacement must preserve provenance, retrieval date, licence,
source identifier, CRS, and processing steps in `coverage-manifest.json`. Never
replace a broad generated cell with a polygon of unknown origin or imply survey
precision that the source does not support.
