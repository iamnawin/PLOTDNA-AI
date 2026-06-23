# Hyderabad Flagship Coverage — Architecture & Decision Record

## Problem

The Hyderabad map needed to show complete market coverage across the full city + surrounding investment belt (~65 km radius from city center). The existing approach used Voronoi tessellation from 227 locality centroids.

**Outer locality problem:** Locality seeds become sparse beyond ~28 km from the city center. Voronoi cells for these localities grow geometrically large, rendering as pizza-slice wedges and radar-sector shapes that:
- Look visually fake and confuse users
- Don't correspond to any real market boundary
- Make the outer area look like a different, broken product

## What NOT to Do (explicitly rejected approaches)

| Approach | Why rejected |
|----------|-------------|
| Generate a circular coverage disk | Circle = fake geometric shape, not a market reality |
| Use ring-based Voronoi sectors | Creates radar/bullseye dartboard pattern |
| Emit phantom ring seeds as map features | Produced visible concentric blue rings |
| Generate pizza-slice polygons from a city center | Looks like a target reticle, not a property market |
| Auto-buffer from GHMC boundary | No sourced boundary data available yet |

**The blue sketch in the original product brief was a rough business boundary hint — NOT a request to draw a circle or generate geometric ring polygons.**

## Correct Architecture

### Layer 1: Inner Voronoi Cells (< 28 km from center)
- **What:** Dense Voronoi tessellation of 196 localities within 28 km
- **Rendered as:** Score-colored filled polygons (green/amber/red per DNA score)
- **Property:** `outerZone: false` → normal display
- **File:** `data/cities/hyderabad/coverage-areas.geojson` (features with `distKm ≤ 28`)

### Layer 2: Outer Voronoi Cells (> 28 km) — hidden
- **What:** 31 remaining Voronoi cells with `outerZone: true`
- **Rendered as:** Invisible (fill opacity = 0, border opacity = 0)
- **Purpose:** Still generated for Voronoi math but suppressed visually
- **Replaced by:** Named expansion zones (Layer 3)

### Layer 3: Named Expansion Zones
- **What:** 8 hand-crafted irregular polygons for real outer market clusters
- **Rendered as:** Amber (#f59e0b) fill at 10% opacity, dashed amber border
- **File:** `data/cities/hyderabad/expansion-zones.geojson`
- **Zones:**
  | Zone ID | Name | Direction |
  |---------|------|-----------|
  | `hyd_exp_kompally_dundigal_north` | Kompally – Dundigal – Medchal North Belt | North |
  | `hyd_exp_patancheru_narsapur_nw` | Patancheru – Narsapur – Ameenpur NW Corridor | NW |
  | `hyd_exp_sangareddy_sadasivpet_far_nw` | Sangareddy – Sadasivpet Far North-West Corridor | Far NW |
  | `hyd_exp_bhongir_bibinagar_east` | Bhongir – Bibinagar – Ghanpur Eastern Expansion | East |
  | `hyd_exp_hayathnagar_adibatla_se` | Hayathnagar – Adibatla – Choutkur SE Belt | SE |
  | `hyd_exp_farooqnagar_shadnagar_south` | Farooqnagar – Shadnagar – Kandukur South Belt | South |
  | `hyd_exp_moinabad_shankarpally_sw` | Moinabad – Shankarpally – Velimela South-West Approach | SW |
  | `hyd_exp_vikarabad_western_frontier` | Vikarabad – Western Frontier Corridor | West |

### Layer 4: Flagship Boundary Outline
- **What:** Irregular 14-point polygon defining the outer limit of the Hyderabad investment market
- **Rendered as:** Indigo (#6366f1) dashed outline at 40% opacity, no fill
- **File:** `data/cities/hyderabad/flagship-boundary.geojson`
- **Definition:** `product_flagship_boundary_irregular_handdrawn`
- **Note:** This is a rough product-team boundary. Replace with sourced HMDA/GHMC administrative boundary when available.

## Build Pipeline

```bash
# Rebuild coverage GeoJSON with outerZone tags
python scripts/build_hyderabad_coverage.py
```

The build script (`scripts/build_hyderabad_coverage.py`) controls the threshold:
```python
INNER_DISPLAY_RADIUS_KM = 28.0
```
Increase this value to show more inner Voronoi cells and shrink the expansion zone belt.

## Layer Rendering (MapView.tsx)

The `outerZone` property on each coverage feature controls visibility:
```typescript
// fill-opacity expression
['case',
  ['==', ['get', 'outerZone'], 1], 0,    // outer cells hidden
  ['==', ['get', 'dimmed'],    1], 0.04,
  // ...
]
```

MapLibre source IDs:
- `areas` → inner Voronoi cells (scored)
- `expansion-zones` → outer named zones (amber)
- `flagship-boundary` → outer boundary outline (indigo dashed)
- `special-use` → airport + classified land overlays

## Expansion Zone Data Structure

Each feature in `expansion-zones.geojson`:
```json
{
  "type": "Feature",
  "id": "hyd_exp_<zone_id>",
  "properties": {
    "id": "hyd_exp_<zone_id>",
    "name": "Human-readable zone name",
    "city": "hyderabad",
    "coverage_type": "generated_expansion",
    "source": "manual_flagship_boundary_fill",
    "status": "draft_review",
    "confidence": "medium | low",
    "notes": "What real-world areas this covers"
  },
  "geometry": { "type": "Polygon", "coordinates": [[...]] }
}
```

Coordinates are GeoJSON `[lng, lat]` (WGS84).

## Flagship Boundary Coordinates

To adjust the flagship boundary, edit `data/cities/hyderabad/flagship-boundary.geojson` and update the polygon coordinates. Current 14-point polygon:

```
NE: [78.40, 17.75] → [78.58, 17.73] → [78.72, 17.65] → [78.90, 17.50]
SE: [78.80, 17.36] → [78.50, 17.14] → [78.40, 17.02]
SW: [78.10, 17.04] → [77.93, 17.25] → [77.68, 17.38]
NW: [77.74, 17.55] → [77.77, 17.68] → [77.95, 17.76] → [78.18, 17.75]
```

## Future Improvements

1. **Replace with sourced boundaries:** Source administrative polygons from HMDA GIS, GHMC, or OpenStreetMap for both the inner locality cells and the outer zones.
2. **Add data to expansion zones:** Each expansion zone should eventually have real DNA scores sourced from RERA, OSM, census data — currently they are rendered without scores.
3. **Layer toggle UI:** Add user-facing toggle to show/hide expansion zones and flagship boundary independently.
4. **Expansion zone click handler:** Show zone name + "data coming soon" when user clicks an expansion zone.
5. **PostGIS migration:** Beyond 500 localities, move polygon data to PostGIS and serve via backend API rather than bundling in frontend assets.
