"""Validate spatial and relational invariants for Hyderabad flagship coverage."""

from __future__ import annotations

import json
import math
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CITY_DIR = REPO_ROOT / "data" / "cities" / "hyderabad"
CATALOG_PATH = REPO_ROOT / "data" / "catalog" / "hyderabad.json"
ARTIFACT_PATH = REPO_ROOT / ".omx" / "artifacts" / "hyderabad-coverage-report.json"
CENTER = (17.385, 78.487)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def project(lng: float, lat: float) -> tuple[float, float]:
    return (
        (lng - CENTER[1]) * 111.320 * math.cos(math.radians(CENTER[0])),
        (lat - CENTER[0]) * 110.574,
    )


def area_km2(ring: list[list[float]]) -> float:
    points = [project(lng, lat) for lng, lat in ring]
    return abs(
        sum(
            points[index][0] * points[(index + 1) % len(points)][1]
            - points[(index + 1) % len(points)][0] * points[index][1]
            for index in range(len(points))
        )
    ) / 2


def contains_xy(ring_xy: list[tuple[float, float]], x: float, y: float) -> bool:
    inside = False
    previous = len(ring_xy) - 1
    for current in range(len(ring_xy)):
        x_i, y_i = ring_xy[current]
        x_j, y_j = ring_xy[previous]
        intersects = ((y_i > y) != (y_j > y)) and (
            x < (x_j - x_i) * (y - y_i) / ((y_j - y_i) or 1e-12) + x_i
        )
        if intersects:
            inside = not inside
        previous = current
    return inside


def fail(message: str) -> None:
    raise SystemExit(f"Hyderabad coverage validation failed: {message}")


def main() -> None:
    boundary = load_json(CITY_DIR / "coverage-boundary.geojson")
    coverage = load_json(CITY_DIR / "coverage-areas.geojson")
    manifest = load_json(CITY_DIR / "coverage-manifest.json")
    aliases = load_json(CITY_DIR / "aliases.json")
    catalog = load_json(CATALOG_PATH)["areas"]

    boundary_ring = boundary["features"][0]["geometry"]["coordinates"][0]
    boundary_area = area_km2(boundary_ring)
    cell_rings = [feature["geometry"]["coordinates"][0] for feature in coverage["features"]]
    cell_area = sum(area_km2(ring) for ring in cell_rings)
    coverage_ratio = cell_area / boundary_area

    if coverage_ratio < 0.995 or coverage_ratio > 1.001:
        fail(f"area coverage ratio {coverage_ratio:.6f} is outside [0.995, 1.001]")

    slugs = [feature["properties"]["slug"] for feature in coverage["features"]]
    if len(slugs) != len(set(slugs)):
        fail("selectable polygon slugs are not unique")
    market_slugs = {
        feature["properties"]["slug"]
        for feature in coverage["features"]
        if not feature["properties"].get("contextOnly")
    }
    missing_aliases = sorted(market_slugs - set(aliases))
    if missing_aliases:
        fail(f"missing aliases for {', '.join(missing_aliases)}")
    catalog_slugs = {area["slug"] for area in catalog}
    missing_catalog = sorted(market_slugs - catalog_slugs)
    if missing_catalog:
        fail(f"missing catalog records for {', '.join(missing_catalog)}")

    missing_area = [
        feature["properties"]["slug"]
        for feature in coverage["features"]
        if "areaKm2" not in feature["properties"]
    ]
    if missing_area:
        fail(f"coverage cells missing areaKm2: {', '.join(missing_area[:10])}")

    oversized_context = sorted(
        (
            (feature["properties"]["areaKm2"], feature["properties"]["slug"])
            for feature in coverage["features"]
            if feature["properties"].get("contextOnly")
            and feature["properties"]["areaKm2"] > 250
        ),
        reverse=True,
    )
    if oversized_context:
        fail(
            "context cells over 250 km2: "
            + ", ".join(f"{slug}={area:.1f}" for area, slug in oversized_context[:10])
        )

    projected_boundary = [project(lng, lat) for lng, lat in boundary_ring]
    projected_cells = [[project(lng, lat) for lng, lat in ring] for ring in cell_rings]
    sample_step_km = 1.0
    sample_total = 0
    uncovered_samples: list[list[float]] = []
    overlap_samples: list[list[float]] = []
    radius = float(manifest["marketBoundary"]["radiusKm"])
    coordinate = -radius + sample_step_km / 2
    while coordinate < radius:
        other = -radius + sample_step_km / 2
        while other < radius:
            if contains_xy(projected_boundary, coordinate, other):
                sample_total += 1
                matches = sum(contains_xy(ring, coordinate, other) for ring in projected_cells)
                if matches == 0 and len(uncovered_samples) < 20:
                    uncovered_samples.append([round(coordinate, 3), round(other, 3)])
                if matches > 1 and len(overlap_samples) < 20:
                    overlap_samples.append([round(coordinate, 3), round(other, 3)])
            other += sample_step_km
        coordinate += sample_step_km

    if uncovered_samples:
        fail(f"uncovered 1 km samples detected at {uncovered_samples[:5]}")
    if overlap_samples:
        fail(f"overlapping 1 km samples detected at {overlap_samples[:5]}")

    report = {
        "status": "pass",
        "processingVersion": manifest["processingVersion"],
        "boundaryAreaKm2": round(boundary_area, 3),
        "selectableAreaKm2": round(cell_area, 3),
        "areaCoverageRatio": round(coverage_ratio, 8),
        "selectableCellCount": len(slugs),
        "sampleStepKm": sample_step_km,
        "sampleCount": sample_total,
        "uncoveredSampleCount": 0,
        "overlapSampleCount": 0,
        "missingAliasCount": 0,
        "missingCatalogCount": 0,
        "maxContextAreaKm2": max(
            feature["properties"]["areaKm2"]
            for feature in coverage["features"]
            if feature["properties"].get("contextOnly")
        ),
    }
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        "Hyderabad coverage validation passed: "
        f"{len(slugs)} cells, {coverage_ratio:.3%} area coverage, "
        f"{sample_total} sampled points, no sampled gaps or overlaps."
    )


if __name__ == "__main__":
    main()
