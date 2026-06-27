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
RETRIEVED_AT = "2026-06-27"

HMDA_LAYER_URL = (
    "https://tgrac.telangana.gov.in/arcgis/rest/services/"
    "TIS_Folder/HMDA_ORR_GHMC_Water_Bodies/MapServer/9"
)
HMDA_LAYER_NAME = "HMDA ORR GHMC Village Boundary"
STATEWIDE_LAYER_URL = (
    "https://tgrac.telangana.gov.in/arcgis/rest/services/"
    "AdministrativeInfoSystem_Folder/Administrative_Information_System/MapServer/27"
)
STATEWIDE_LAYER_NAME = "Village Boundary"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def query_tgrac_feature(source_url: str, id_field: str, source_id: int | str) -> dict[str, Any]:
    params = {
        "f": "pjson",
        "where": f"{id_field}={source_id}",
        "outFields": "*",
        "returnGeometry": "true",
        "outSR": "4326",
    }
    url = f"{source_url}/query?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "PlotDNA Hyderabad pending boundary fetch"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.load(response)
    if "error" in payload:
        raise RuntimeError(f"TGRAC query failed for {id_field} {source_id}: {payload['error']}")
    features = payload.get("features") or []
    if len(features) != 1:
        raise RuntimeError(f"TGRAC query for {id_field} {source_id} returned {len(features)} features")
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


def collect_matched_source_keys(pending_sources: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    rows_by_source_key: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in pending_sources["sourceAudits"]:
        match = (row.get("officialMatches") or [{}])[0]
        source_key = match.get("sourceKey")
        if not source_key:
            continue
        rows_by_source_key[str(source_key)].append(row)
    return dict(sorted(rows_by_source_key.items()))


def best_attr(attributes: dict[str, Any], *names: str) -> Any:
    for name in names:
        value = attributes.get(name)
        if value not in (None, ""):
            return value
    return None


def build_feature(source_key: str, rows: list[dict[str, Any]], tgrac_feature: dict[str, Any]) -> dict[str, Any]:
    match = rows[0]["officialMatches"][0]
    attributes = tgrac_feature.get("attributes") or {}
    geometry = polygon_geometry_from_esri(tgrac_feature.get("geometry") or {})
    matched_slugs = sorted(row["slug"] for row in rows)
    matched_names = sorted(row["name"] for row in rows)
    source_id = match.get("sourceId")
    return {
        "type": "Feature",
        "id": f"tgrac-{source_key}",
        "properties": {
            "sourceKey": source_key,
            "sourceId": source_id,
            "sourceIdField": match.get("sourceIdField"),
            "fid": source_id if match.get("sourceIdField") == "FID" else None,
            "sourceName": match.get("sourceLayer"),
            "sourceUrl": match.get("sourceUrl"),
            "retrievedAt": RETRIEVED_AT,
            "license": "public ArcGIS REST service",
            "villageName": best_attr(attributes, "V_Name", "Village", "Village_Name_"),
            "mandalName": best_attr(attributes, "Mandal_Nam", "Mandal", "Subdistrict_Name"),
            "districtName": best_attr(attributes, "Dist_Name", "District", "District_Name_"),
            "revenueName": best_attr(attributes, "N_Revenue", "NewRevRema"),
            "divisionName": best_attr(attributes, "DIV_NAME", "Revenue_Division"),
            "admin": best_attr(attributes, "Admin", "Class", "ULB"),
            "dmvCode": attributes.get("DMV_Code"),
            "villageCode": best_attr(attributes, "Village_Code", "vlgcd11"),
            "census2011Code": attributes.get("Census_2011_Code"),
            "households": attributes.get("No_HH"),
            "population": attributes.get("TOT_P"),
            "matchedPendingSlugs": matched_slugs,
            "matchedPendingNames": matched_names,
            "usagePolicy": "Source evidence only; do not promote to scored market cell without score signals.",
        },
        "geometry": geometry,
    }


def main() -> None:
    pending_sources = load_json(PENDING_SOURCES_PATH)
    rows_by_source_key = collect_matched_source_keys(pending_sources)
    features: list[dict[str, Any]] = []
    for index, (source_key, rows) in enumerate(rows_by_source_key.items(), start=1):
        match = rows[0]["officialMatches"][0]
        tgrac_feature = query_tgrac_feature(match["sourceUrl"], match["sourceIdField"], match["sourceId"])
        features.append(build_feature(source_key, rows, tgrac_feature))
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
            "sourceNames": [HMDA_LAYER_NAME, STATEWIDE_LAYER_NAME],
            "sourceUrls": [HMDA_LAYER_URL, STATEWIDE_LAYER_URL],
            "sourcePolicy": "Do not promote pending cells to scored areas until boundaries and score signals are verified.",
        },
        "features": features,
    }
    write_json(OUTPUT_PATH, payload)
    print(f"Wrote {len(features)} TGRAC pending boundary features to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
