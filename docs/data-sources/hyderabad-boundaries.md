# Hyderabad Coverage Geometry Sources

## Market boundary

The flagship coverage boundary is a PlotDNA product boundary: a 65 km radius
around `[17.385, 78.487]`. It is designed to contain the market scope requested
for the Hyderabad release, including Sadasivpet, Vikarabad, Sangareddy, Isnapur,
Medchal, LB Nagar, Rajiv Gandhi International Airport, and Farooqnagar.

It is not an HMDA, GHMC, district, mandal, ward, village, cadastral, zoning, or
title boundary. The product must not describe it as one.

## Selectable market cells

`scripts/build_hyderabad_coverage.py` partitions the product boundary using the
existing locality centroids as Voronoi seeds. These cells remove unexplained map
holes and give every point one deterministic resolver identity. They are marked:

- `boundaryKind: generated_market_cell`
- `boundaryConfidence: broad`

The cells are market-resolution geometry, not claims about administrative
limits. A cell can be replaced by a sourced locality boundary later without
changing its stable slug or catalog identity.

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
