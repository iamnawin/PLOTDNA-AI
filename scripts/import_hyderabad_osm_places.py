"""Import named OSM place points for Hyderabad coverage subdivision.

This creates a reproducible seed list used to split broad generated coverage
cells into smaller named village/locality pockets. These are place centroids,
not legal administrative boundaries.
"""

from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CITY_DIR = REPO_ROOT / "data" / "cities" / "hyderabad"
OUTPUT_PATH = CITY_DIR / "osm-place-seeds.json"
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
BBOX = (16.75, 77.55, 18.05, 79.15)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def normalize_place_name(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", value.lower())).strip()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "unnamed"


def point_in_ring(lng: float, lat: float, ring: list[list[float]]) -> bool:
    inside = False
    previous = len(ring) - 1
    for current in range(len(ring)):
        lng_i, lat_i = ring[current]
        lng_j, lat_j = ring[previous]
        intersects = ((lat_i > lat) != (lat_j > lat)) and (
            lng < (lng_j - lng_i) * (lat - lat_i) / ((lat_j - lat_i) or 1e-12) + lng_i
        )
        if intersects:
            inside = not inside
        previous = current
    return inside


def bbox_tiles() -> list[tuple[float, float, float, float]]:
    south, west, north, east = BBOX
    mid_lat = (south + north) / 2
    mid_lng = (west + east) / 2
    return [
        (south, west, mid_lat, mid_lng),
        (south, mid_lng, mid_lat, east),
        (mid_lat, west, north, mid_lng),
        (mid_lat, mid_lng, north, east),
    ]


def build_query(tile: tuple[float, float, float, float]) -> str:
    south, west, north, east = tile
    bbox = f"{south},{west},{north},{east}"
    return f"""[out:json][timeout:120];
(
  node["place"~"^(town|village|suburb|neighbourhood|locality|hamlet)$"]({bbox});
);
out tags center 2500;"""


def fetch_overpass_tile(tile: tuple[float, float, float, float]) -> dict:
    body = urllib.parse.urlencode({"data": build_query(tile)}).encode()
    last_error: Exception | None = None
    for url in OVERPASS_URLS:
        request = urllib.request.Request(
            url,
            data=body,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "PlotDNA Hyderabad coverage import",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                return json.load(response)
        except Exception as exc:
            last_error = exc
            print(f"Overpass tile failed on {url}: {exc}")
    raise RuntimeError(f"all Overpass endpoints failed for tile {tile}") from last_error


def main() -> None:
    boundary = load_json(CITY_DIR / "flagship-boundary.geojson")
    boundary_ring = boundary["features"][0]["geometry"]["coordinates"][0]
    existing = load_json(CITY_DIR / "localities.json")
    existing_names = {normalize_place_name(item["name"]) for item in existing}

    seen: set[tuple[str, int]] = set()
    seen_names: set[str] = set()
    seeds: list[dict] = []
    elements: list[dict] = []
    for tile in bbox_tiles():
        elements.extend(fetch_overpass_tile(tile).get("elements", []))

    for element in elements:
        tags = element.get("tags", {})
        name = str(tags.get("name") or "").strip()
        place = str(tags.get("place") or "").strip()
        if not name or not place:
            continue
        lat = element.get("lat") or (element.get("center") or {}).get("lat")
        lng = element.get("lon") or (element.get("center") or {}).get("lon")
        if lat is None or lng is None:
            continue
        lat = float(lat)
        lng = float(lng)
        if not point_in_ring(lng, lat, boundary_ring):
            continue

        key = (str(element["type"]), int(element["id"]))
        normalized = normalize_place_name(name)
        if key in seen or normalized in seen_names or normalized in existing_names:
            continue
        seen.add(key)
        seen_names.add(normalized)
        seeds.append(
            {
                "slug": f"osm-{slugify(name)}-{element['id']}",
                "name": name,
                "place": place,
                "center": [round(lat, 7), round(lng, 7)],
                "osm": {"type": element["type"], "id": element["id"]},
            }
        )

    seeds.sort(key=lambda item: (item["place"], item["name"], item["osm"]["id"]))
    payload = {
        "schemaVersion": 1,
        "source": "OpenStreetMap Overpass place nodes/ways/relations",
        "sourceUrl": OVERPASS_URLS[0],
        "retrievedAt": "2026-06-25",
        "license": "ODbL-1.0",
        "note": "Place centroids used only to subdivide broad generated Hyderabad coverage cells; not legal boundaries.",
        "bbox": list(BBOX),
        "count": len(seeds),
        "seeds": seeds,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(seeds)} Hyderabad OSM place seeds to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
