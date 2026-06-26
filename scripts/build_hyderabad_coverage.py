"""Build deterministic, contiguous Hyderabad market coverage from locality seeds.

The canonical market scope is a product boundary, not an administrative claim.
Existing locality centroids seed a Voronoi partition inside that boundary. Every
generated cell is labelled broad until a sourced administrative/locality boundary
replaces it.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CITY_DIR = REPO_ROOT / "data" / "cities" / "hyderabad"
CATALOG_PATH = REPO_ROOT / "data" / "catalog" / "hyderabad.json"
CENTER_LAT = 17.385
CENTER_LNG = 78.487
MARKET_RADIUS_KM = 70.0
BOUNDARY_SEGMENTS = 128
COORDINATE_PRECISION = 6

# Resolve a duplicate seed in the legacy data with more representative centers.
KNOWN_CENTER_CORRECTIONS = {
    "balanagar": [17.476, 78.448],
    "moosapet": [17.468, 78.429],
}

ANCHORS = {
    "sadasivpet": [17.619, 77.952],
    "sangareddy": [17.624, 78.090],
    "isnapur": [17.524, 78.268],
    "rgia": [17.231, 78.432],
    "farooqnagar": [17.077, 78.203],
    "lb-nagar": [17.345, 78.545],
    "vikarabad": [17.338, 77.906],
    "medchal": [17.630, 78.485],
}

def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, value) -> None:
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def to_xy(lat: float, lng: float) -> tuple[float, float]:
    lat0 = math.radians(CENTER_LAT)
    return (
        (lng - CENTER_LNG) * 111.320 * math.cos(lat0),
        (lat - CENTER_LAT) * 110.574,
    )


def to_lat_lng(x: float, y: float) -> list[float]:
    lat0 = math.radians(CENTER_LAT)
    return [
        round(CENTER_LAT + y / 110.574, COORDINATE_PRECISION),
        round(CENTER_LNG + x / (111.320 * math.cos(lat0)), COORDINATE_PRECISION),
    ]


def haversine_km(lat: float, lng: float) -> float:
    lat1 = math.radians(CENTER_LAT)
    lng1 = math.radians(CENTER_LNG)
    lat2 = math.radians(lat)
    lng2 = math.radians(lng)
    d_lat = lat2 - lat1
    d_lng = lng2 - lng1
    value = (
        math.sin(d_lat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
    )
    return 6371.0 * 2 * math.asin(math.sqrt(value))


def boundary_xy() -> list[tuple[float, float]]:
    return [
        (
            MARKET_RADIUS_KM * math.cos(2 * math.pi * index / BOUNDARY_SEGMENTS),
            MARKET_RADIUS_KM * math.sin(2 * math.pi * index / BOUNDARY_SEGMENTS),
        )
        for index in range(BOUNDARY_SEGMENTS)
    ]


def boundary_xy_organic() -> list[tuple[float, float]]:
    """Organic market boundary using harmonic radius variation.

    Base radius 69.5 km +/- 1 km (min ~68.5 km), ensuring all localities filtered
    to MARKET_RADIUS_KM remain inside. The harmonic wobble makes the boundary
    edge look like an irregular administrative polygon rather than a GIS buffer.
    """
    n = BOUNDARY_SEGMENTS
    result = []
    for i in range(n):
        angle = 2 * math.pi * i / n
        r = (
            69.5
            + 0.5 * math.cos(3 * angle + 0.7)
            + 0.3 * math.cos(7 * angle + 1.5)
            + 0.2 * math.cos(11 * angle + 2.1)
        )
        result.append((r * math.cos(angle), r * math.sin(angle)))
    return result


def point_in_xy_ring(x: float, y: float, ring: list[tuple[float, float]]) -> bool:
    inside = False
    previous = len(ring) - 1
    for current in range(len(ring)):
        x_i, y_i = ring[current]
        x_j, y_j = ring[previous]
        intersects = ((y_i > y) != (y_j > y)) and (
            x < (x_j - x_i) * (y - y_i) / ((y_j - y_i) or 1e-12) + x_i
        )
        if intersects:
            inside = not inside
        previous = current
    return inside


def load_flagship_boundary_xy() -> list[tuple[float, float]]:
    boundary = load_json(CITY_DIR / "flagship-boundary.geojson")
    ring = boundary["features"][0]["geometry"]["coordinates"][0]
    return [to_xy(lat, lng) for lng, lat in ring]


def clip_half_plane(
    polygon: list[tuple[float, float]],
    normal_x: float,
    normal_y: float,
    limit: float,
) -> list[tuple[float, float]]:
    if not polygon:
        return []

    result: list[tuple[float, float]] = []
    previous = polygon[-1]
    previous_value = normal_x * previous[0] + normal_y * previous[1] - limit
    previous_inside = previous_value <= 1e-10

    for current in polygon:
        current_value = normal_x * current[0] + normal_y * current[1] - limit
        current_inside = current_value <= 1e-10

        if current_inside != previous_inside:
            denominator = previous_value - current_value
            fraction = previous_value / denominator if abs(denominator) > 1e-14 else 0.0
            result.append(
                (
                    previous[0] + fraction * (current[0] - previous[0]),
                    previous[1] + fraction * (current[1] - previous[1]),
                )
            )
        if current_inside:
            result.append(current)

        previous = current
        previous_value = current_value
        previous_inside = current_inside

    return result


def voronoi_cell(
    seed: tuple[float, float],
    all_seeds: list[tuple[float, float]],
    market_boundary: list[tuple[float, float]],
) -> list[tuple[float, float]]:
    polygon = list(market_boundary)
    seed_x, seed_y = seed
    for other_x, other_y in all_seeds:
        if (other_x, other_y) == seed:
            continue
        normal_x = other_x - seed_x
        normal_y = other_y - seed_y
        limit = (other_x * other_x + other_y * other_y - seed_x * seed_x - seed_y * seed_y) / 2
        polygon = clip_half_plane(polygon, normal_x, normal_y, limit)
        if len(polygon) < 3:
            raise ValueError(f"Voronoi seed {seed} produced an empty cell")
    return polygon


def polygon_area_km2(polygon: list[tuple[float, float]]) -> float:
    return abs(
        sum(
            polygon[index][0] * polygon[(index + 1) % len(polygon)][1]
            - polygon[(index + 1) % len(polygon)][0] * polygon[index][1]
            for index in range(len(polygon))
        )
    ) / 2


def close_geojson_ring(lat_lng_polygon: list[list[float]]) -> list[list[float]]:
    ring = [[lng, lat] for lat, lng in lat_lng_polygon]
    if ring[0] != ring[-1]:
        ring.append(ring[0])
    return ring


def cluster_lookup(clusters: list[dict]) -> dict[str, dict]:
    result: dict[str, dict] = {}
    for cluster in clusters:
        for slug in cluster.get("localitySlugs", []):
            result[slug] = {
                "clusterId": cluster.get("id"),
                "zone": cluster.get("zone"),
            }
    return result


def main() -> None:
    localities = load_json(CITY_DIR / "localities.json")
    aliases = load_json(CITY_DIR / "aliases.json")
    clusters = load_json(CITY_DIR / "clusters.json")
    city = load_json(CITY_DIR / "city.json")
    catalog = load_json(CATALOG_PATH)
    osm_seed_payload = load_json(CITY_DIR / "osm-place-seeds.json")
    supplemental_seed_payload = load_json(CITY_DIR / "supplemental-place-seeds.json")

    by_slug = {locality["slug"]: locality for locality in localities}
    for slug, center in KNOWN_CENTER_CORRECTIONS.items():
        by_slug[slug]["center"] = center

    boundary = load_flagship_boundary_xy()
    active = [
        locality
        for locality in localities
        if point_in_xy_ring(*to_xy(locality["center"][0], locality["center"][1]), boundary)
    ]
    active.sort(key=lambda locality: locality["slug"])
    locality_seeds = [to_xy(*locality["center"]) for locality in active]
    active_names = {locality["name"].casefold() for locality in active}
    active_slugs = {locality["slug"] for locality in active}
    context_seed_candidates = [
        {**seed, "seedSource": "openstreetmap_place_centroid"}
        for seed in osm_seed_payload.get("seeds", [])
    ] + [
        {**seed, "seedSource": "supplemental_backlog_centroid"}
        for seed in supplemental_seed_payload.get("seeds", [])
    ]
    context_places = [
        seed
        for seed in context_seed_candidates
        if seed["name"].casefold() not in active_names
        and seed["slug"] not in active_slugs
        and point_in_xy_ring(*to_xy(seed["center"][0], seed["center"][1]), boundary)
    ]
    context_seeds = [to_xy(*seed["center"]) for seed in context_places]
    cluster_by_slug = cluster_lookup(clusters)

    all_seeds = locality_seeds + context_seeds

    # Preserve an outer edge flag for UI/context, but all cells remain visible.
    INNER_DISPLAY_RADIUS_KM = 28.0

    features: list[dict] = []
    cell_by_slug: dict[str, list[list[float]]] = {}
    for locality, seed in zip(active, locality_seeds):
        cell_xy = voronoi_cell(seed, all_seeds, boundary)
        cell_lat_lng = [to_lat_lng(x, y) for x, y in cell_xy]
        area_km2 = round(polygon_area_km2(cell_xy), 1)
        cell_by_slug[locality["slug"]] = cell_lat_lng
        cluster = cluster_by_slug.get(locality["slug"], {})
        dist_km = round(haversine_km(locality["center"][0], locality["center"][1]), 1)
        features.append(
            {
                "type": "Feature",
                "id": locality["slug"],
                "properties": {
                    "slug": locality["slug"],
                    "name": locality["name"],
                    "boundaryKind": "generated_market_cell",
                    "boundaryConfidence": "broad",
                    "marketable": True,
                    "source": "legacy_locality_centroid_voronoi",
                    "distKm": dist_km,
                    "areaKm2": area_km2,
                    "outerZone": dist_km > INNER_DISPLAY_RADIUS_KM,
                    **cluster,
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [close_geojson_ring(cell_lat_lng)],
                },
            }
        )

    for place, seed in zip(context_places, context_seeds):
        cell_xy = voronoi_cell(seed, all_seeds, boundary)
        cell_lat_lng = [to_lat_lng(x, y) for x, y in cell_xy]
        area_km2 = round(polygon_area_km2(cell_xy), 1)
        features.append(
            {
                "type": "Feature",
                "id": place["slug"],
                "properties": {
                    "slug": place["slug"],
                    "name": place["name"],
                    "place": place["place"],
                    "boundaryKind": "place_context_cell",
                    "boundaryConfidence": "approximate",
                    "marketable": False,
                    "source": f"{place['seedSource']}_voronoi",
                    "sourceOsmType": place.get("osm", {}).get("type"),
                    "sourceOsmId": place.get("osm", {}).get("id"),
                    "distKm": round(haversine_km(place["center"][0], place["center"][1]), 1),
                    "areaKm2": area_km2,
                    "contextOnly": True,
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [close_geojson_ring(cell_lat_lng)],
                },
            }
        )

    for locality in localities:
        generated = cell_by_slug.get(locality["slug"])
        if generated:
            locality["polygon"] = generated
            locality["boundaryKind"] = "generated_market_cell"
            locality["boundaryConfidence"] = "broad"
        aliases.setdefault(
            locality["slug"],
            sorted({locality["name"].lower(), locality["slug"].replace("-", " ")}),
        )

    catalog_by_slug = {area["slug"]: area for area in catalog["areas"]}
    for locality in localities:
        area = catalog_by_slug.get(locality["slug"])
        if not area:
            continue
        area["center"] = locality["center"]
        area["polygon"] = locality["polygon"]
        if locality["slug"] in cell_by_slug:
            area["boundaryKind"] = "generated_market_cell"
            area["boundaryConfidence"] = "broad"
            area["scorePrecision"] = "estimated" if area.get("dataConfidence") == "estimated" else "locality_model"

    city["coverageRadiusKm"] = MARKET_RADIUS_KM
    boundary_lat_lng = [to_lat_lng(x, y) for x, y in boundary]
    boundary_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": "hyderabad-investment-market",
                "properties": {
                    "slug": "hyderabad-investment-market",
                    "name": "Hyderabad Investment Market",
                    "definition": "product_flagship_boundary_irregular",
                    "seedRadiusKm": MARKET_RADIUS_KM,
                    "boundaryConfidence": "product_defined",
                    "notAdministrativeBoundary": True,
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [close_geojson_ring(boundary_lat_lng)],
                },
            }
        ],
    }
    coverage_geojson = {"type": "FeatureCollection", "features": features}
    special_use_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": "rajiv-gandhi-international-airport",
                "properties": {
                    "slug": "rajiv-gandhi-international-airport",
                    "name": "Rajiv Gandhi International Airport operational area",
                    "kind": "airport_operational_land",
                    "marketable": False,
                    "boundaryConfidence": "broad",
                    "source": "OpenStreetMap Nominatim relation 10734455 bounding envelope",
                    "sourceUrl": "https://www.openstreetmap.org/relation/10734455",
                    "retrievedAt": "2026-06-22",
                    "license": "ODbL-1.0",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [78.398943, 17.224690],
                        [78.465380, 17.224690],
                        [78.465380, 17.237948],
                        [78.398943, 17.237948],
                        [78.398943, 17.224690],
                    ]],
                },
            }
        ],
    }

    boundary_area = polygon_area_km2(boundary)
    cell_area = sum(
        polygon_area_km2([to_xy(lat, lng) for lng, lat in feature["geometry"]["coordinates"][0]])
        for feature in features
    )
    manifest = {
        "schemaVersion": 1,
        "generatedAt": "2026-06-22",
        "processingVersion": "irregular-boundary-osm-context-v6",
        "crs": "EPSG:4326",
        "metricProjection": "local equirectangular kilometers centered on Hyderabad",
        "marketBoundary": {
            "definition": "irregular Hyderabad flagship product boundary with OSM place context subdivision",
            "center": [CENTER_LAT, CENTER_LNG],
            "radiusKm": MARKET_RADIUS_KM,
            "areaKm2": round(boundary_area, 3),
            "notAdministrativeBoundary": True,
        },
        "coverage": {
            "selectableCellCount": len(features),
            "marketAreaCellCount": len(active),
            "contextCellCount": len(context_places),
            "selectableAreaKm2": round(cell_area, 3),
            "areaCoverageRatio": round(cell_area / boundary_area, 8),
            "boundaryKind": "generated_market_cell",
            "boundaryConfidence": "broad",
        },
        "anchors": ANCHORS,
        "specialUseSources": [
            {
                "slug": "osm-place-seeds",
                "url": osm_seed_payload.get("sourceUrl"),
                "retrievedAt": osm_seed_payload.get("retrievedAt"),
                "license": osm_seed_payload.get("license"),
            },
            {
                "slug": "supplemental-place-seeds",
                "url": supplemental_seed_payload.get("sourceDoc"),
                "retrievedAt": supplemental_seed_payload.get("retrievedAt"),
                "license": supplemental_seed_payload.get("license"),
            },
            {
                "slug": "rajiv-gandhi-international-airport",
                "url": "https://www.openstreetmap.org/relation/10734455",
                "retrievedAt": "2026-06-22",
                "license": "ODbL-1.0",
            }
        ],
    }

    write_json(CITY_DIR / "coverage-boundary.geojson", boundary_geojson)
    write_json(CITY_DIR / "coverage-areas.geojson", coverage_geojson)
    write_json(CITY_DIR / "special-use-areas.geojson", special_use_geojson)
    write_json(CITY_DIR / "coverage-manifest.json", manifest)
    write_json(CITY_DIR / "localities.json", localities)
    write_json(CITY_DIR / "aliases.json", dict(sorted(aliases.items())))
    write_json(CITY_DIR / "city.json", city)
    write_json(CATALOG_PATH, catalog)

    print(
        f"Built {len(features)} contiguous Hyderabad cells across "
        f"{boundary_area:.1f} km² ({cell_area / boundary_area:.3%} coverage)."
    )


if __name__ == "__main__":
    main()
