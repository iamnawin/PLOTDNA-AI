"""Fetch official TGRAC village boundaries for matched Hyderabad pending cells.

The output is source evidence for data-pending cells. It must not be treated as
scored PlotDNA market coverage until separate price/RERA/infrastructure signals
are attached.
"""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
CITY_DIR = REPO_ROOT / "data" / "cities" / "hyderabad"
PENDING_SOURCES_PATH = CITY_DIR / "pending-context-sources.json"
OUTPUT_PATH = CITY_DIR / "tgrac-pending-village-boundaries.geojson"
RETRIEVED_AT = "2026-06-26"

TGRAC_LAYER_URL = (
    "https://tgrac.telangana.gov.in/arcgis/rest/services/"
    "TIS_Folder/HMDA_ORR_GHMC_Water_Bodies/MapServer/9"
)
TGRAC_QUERY_URL = f"{TGRAC_LAYER_URL}/query"
TGRAC_LAYER_NAME = "HMDA ORR GHMC Village Boundary"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def query_tgrac_feature(fid: int) -> dict[str, Any]:
    params = {
        "f": "pjson",
        "where": f"FID={fid}",
        "outFields": "*",
        "returnGeometry": "true",
        "outSR": "4326",
    }
    url = f"{TGRAC_QUERY_URL}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "PlotDNA Hyderabad pending boundary fetch"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.load(response)
    if "error" in payload:
        raise RuntimeError(f"TGRAC query failed for FID {fid}: {payload['error']}")
    features = payload.get("features") or []
    if len(features) != 1:
        raise RuntimeError(f"TGRAC query for FID {fid} returned {len(features)} features")
    return features[0]


def close_ring(ring: list[list[float]]) -> list[list[float]]:
    if not ring:
        return ring
    first = ring[0]
    last = ring[-1]
    if first[0] == last[0] and first[1] == last[1]:
        return ring
    return [*ring, [first[0], first[1]]]


def polygon_geometry_from_esri(esri_geometry: dict[str, Any]) -> dict[str, Any]:
    rings = esri_geometry.get("rings")
    if not isinstance(rings, list) or not rings:
        raise ValueError("missing Esri polygon rings")
    coordinates = [close_ring(ring) for ring in rings if isinstance(ring, list) and len(ring) >= 3]
    if not coordinates:
        raise ValueError("no usable Esri polygon rings")
    return {
        "type": "Polygon",
        "coordinates": coordinates,
    }


def collect_matched_fids(pending_sources: dict[str, Any]) -> dict[int, list[dict[str, Any]]]:
    rows_by_fid: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for row in pending_sources["sourceAudits"]:
        if row.get("status") != "tgrac_village_matched":
            continue
        match = (row.get("officialMatches") or [{}])[0]
        fid = match.get("fid")
        if fid is None:
            continue
        rows_by_fid[int(fid)].append(row)
    return dict(sorted(rows_by_fid.items()))


def build_feature(fid: int, rows: list[dict[str, Any]], tgrac_feature: dict[str, Any]) -> dict[str, Any]:
    attributes = tgrac_feature.get("attributes") or {}
    geometry = polygon_geometry_from_esri(tgrac_feature.get("geometry") or {})
    matched_slugs = sorted(row["slug"] for row in rows)
    matched_names = sorted(row["name"] for row in rows)
    return {
        "type": "Feature",
        "id": f"tgrac-fid-{fid}",
        "properties": {
            "fid": fid,
            "sourceName": TGRAC_LAYER_NAME,
            "sourceUrl": TGRAC_LAYER_URL,
            "retrievedAt": RETRIEVED_AT,
            "license": "public ArcGIS REST service",
            "villageName": attributes.get("V_Name"),
            "mandalName": attributes.get("Mandal_Nam"),
            "districtName": attributes.get("Dist_Name"),
            "revenueName": attributes.get("N_Revenue"),
            "divisionName": attributes.get("DIV_NAME"),
            "admin": attributes.get("Admin"),
            "dmvCode": attributes.get("DMV_Code"),
            "matchedPendingSlugs": matched_slugs,
            "matchedPendingNames": matched_names,
            "usagePolicy": "Source evidence only; do not promote to scored market cell without score signals.",
        },
        "geometry": geometry,
    }


def main() -> None:
    pending_sources = load_json(PENDING_SOURCES_PATH)
    rows_by_fid = collect_matched_fids(pending_sources)
    features: list[dict[str, Any]] = []
    for index, (fid, rows) in enumerate(rows_by_fid.items(), start=1):
        tgrac_feature = query_tgrac_feature(fid)
        features.append(build_feature(fid, rows, tgrac_feature))
        if index % 10 == 0:
            time.sleep(0.25)

    payload = {
        "type": "FeatureCollection",
        "name": "hyderabad_tgrac_pending_village_boundaries",
        "metadata": {
            "schemaVersion": 1,
            "generatedAt": RETRIEVED_AT,
            "citySlug": "hyderabad",
            "purpose": "official boundary evidence for data-pending Hyderabad context cells",
            "sourceName": TGRAC_LAYER_NAME,
            "sourceUrl": TGRAC_LAYER_URL,
            "sourcePolicy": "Do not promote pending cells to scored areas until boundaries and score signals are verified.",
        },
        "features": features,
    }
    write_json(OUTPUT_PATH, payload)
    print(f"Wrote {len(features)} TGRAC pending boundary features to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
