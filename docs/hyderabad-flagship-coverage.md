# Hyderabad Flagship Coverage - Architecture & Decision Record

## Problem

The Hyderabad map must cover the city and the surrounding investment belt without drawing fake geometric shapes. A circular disk, ring sectors, or large Voronoi wedges make the product look precise while hiding that many outer villages and localities still need sourced boundaries.

## Rejected Approaches

| Approach | Why rejected |
|----------|-------------|
| Circular coverage disk | Real areas are not circular and users read this as fake precision. |
| Ring-based sectors | Creates a target/radar pattern instead of locality boundaries. |
| Giant outer Voronoi wedges | One polygon can swallow many towns and villages. |
| Scoring context-only cells | A subdivision without verified signal data must not become a scored market. |
| Presenting generated cells as official boundaries | Current generated cells are product coverage cells, not legal/admin/cadastral boundaries. |

## Current Architecture

### Layer 1: Irregular Flagship Boundary

- File: `data/cities/hyderabad/flagship-boundary.geojson`
- Purpose: Defines the Hyderabad flagship product extent across roughly the 65-70 km outskirts belt.
- Shape: Irregular product boundary, not a circle.
- Current status: Product-defined boundary. Replace with sourced HMDA/GHMC/state boundary data when available.

### Layer 2: Contiguous Coverage Cells

- File: `data/cities/hyderabad/coverage-areas.geojson`
- Current output: 294 contiguous cells across about 11,947 sq km.
- Scored market cells: 235 cells tied to catalog locality records and score/confidence data.
- Context-only cells: 59 cells using OSM place centroids plus supplemental backlog centroids.
- Build script: `scripts/build_hyderabad_coverage.py`
- Validation script: `scripts/validate_hyderabad_coverage.py`

Context-only cells use:

```json
{
  "contextOnly": true,
  "marketable": false,
  "boundaryKind": "place_context_cell",
  "boundaryConfidence": "approximate"
}
```

These cells are only temporary subdivisions so the outer belt does not render as huge chunks. They must not be marketed as verified localities until sourced polygons and real signal data are attached.

### Layer 3: Special-Use Overlays

- File: `data/cities/hyderabad/special-use-areas.geojson`
- Purpose: Separately renders non-market areas such as RGIA airport.
- Rule: Special-use overlays should not receive PlotDNA market scores unless there is a specific product decision and verified market data.

## Build Pipeline

```bash
python scripts\build_hyderabad_coverage.py
python scripts\validate_hyderabad_coverage.py
```

The generated manifest is `data/cities/hyderabad/coverage-manifest.json`. It records the boundary definition, area coverage ratio, scored market cell count, context-only cell count, and data sources.

## Map Rendering

MapLibre source IDs in `frontend/src/components/map/MapView.tsx`:

- `areas` - contiguous generated market/context cells.
- `flagship-boundary` - irregular Hyderabad product boundary outline.
- `special-use` - airport and classified land overlays.

The map should not hide outer generated cells as zero-opacity artifacts. Instead, every generated coverage cell should be visible with styling that distinguishes scored markets from context-only/no-data subdivisions.

## Search and Resolver Behavior

Context-only cells are now part of the frontend and backend location resolver flow. When a searched address or coordinate lands inside one of these cells, the result is:

- `tier: "context"`
- `precision: "context_area"` for backend address search results
- `scorePrecision: "unscored_context"`
- `analysisSlug: null`
- `catalogArea: null`

This is intentional. The app can identify that the place is inside the Hyderabad flagship boundary, but it must not open a scored AreaDetail page or reuse a nearby market score for that exact place.

## Remaining Data Work

1. Replace context-only Voronoi cells with sourced village/admin polygons from HMDA, GHMC, Telangana open data, or OSM relations where license and quality are acceptable.
2. Add aliases for newly sourced villages/localities so address search resolves by common names, apartment names, and spelling variants.
3. Attach verified signal data before any context-only cell becomes a scored market.
4. Reduce any remaining oversized cells by importing more real place seeds or sourced boundaries, not by drawing circular/ring geometry.
