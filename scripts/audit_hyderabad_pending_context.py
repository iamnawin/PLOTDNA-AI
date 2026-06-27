"""Audit Hyderabad data-pending context cells against public source layers.

This script does not promote areas to scored coverage. It records whether each
context-only cell has an official TGRAC village-boundary hit at its generated
cell centroid, so pending areas can carry source context while signal validation
continues.
"""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
CITY_DIR = REPO_ROOT / "data" / "cities" / "hyderabad"
COVERAGE_PATH = CITY_DIR / "coverage-areas.geojson"
OUTPUT_PATH = CITY_DIR / "pending-context-sources.json"
RETRIEVED_AT = "2026-06-27"

HMDA_LAYER_URL = (
    "https://tgrac.telangana.gov.in/arcgis/rest/services/"
    "TIS_Folder/HMDA_ORR_GHMC_Water_Bodies/MapServer/9"
)
HMDA_QUERY_URL = f"{HMDA_LAYER_URL}/query"
HMDA_LAYER_NAME = "HMDA ORR GHMC Village Boundary"
STATEWIDE_LAYER_URL = (
    "https://tgrac.telangana.gov.in/arcgis/rest/services/"
    "AdministrativeInfoSystem_Folder/Administrative_Information_System/MapServer/27"
)
STATEWIDE_QUERY_URL = f"{STATEWIDE_LAYER_URL}/query"
STATEWIDE_LAYER_NAME = "Village Boundary"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def polygon_centroid(ring: list[list[float]]) -> list[float]:
    """Return [lat, lng] centroid for a simple closed GeoJSON ring."""
    points = ring[:-1] if ring and ring[0] == ring[-1] else ring
    if not points:
        raise ValueError("empty polygon ring")
    signed_area = 0.0
    cx = 0.0
    cy = 0.0
    for index, (x0, y0) in enumerate(points):
        x1, y1 = points[(index + 1) % len(points)]
        cross = x0 * y1 - x1 * y0
        signed_area += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    signed_area *= 0.5
    if abs(signed_area) < 1e-12:
        lng = sum(point[0] for point in points) / len(points)
        lat = sum(point[1] for point in points) / len(points)
        return [round(lat, 7), round(lng, 7)]
    lng = cx / (6 * signed_area)
    lat = cy / (6 * signed_area)
    return [round(lat, 7), round(lng, 7)]


def query_layer_by_point(query_url: str, lat: float, lng: float) -> list[dict[str, Any]]:
    params = {
        "f": "pjson",
        "where": "1=1",
        "geometry": json.dumps({"x": lng, "y": lat, "spatialReference": {"wkid": 4326}}),
        "geometryType": "esriGeometryPoint",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "*",
        "returnGeometry": "false",
    }
    url = f"{query_url}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "PlotDNA Hyderabad pending context audit"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.load(response)
    if "error" in payload:
        raise RuntimeError(f"TGRAC query failed: {payload['error']}")
    return [feature.get("attributes", {}) for feature in payload.get("features", [])]


def query_hmda_village(lat: float, lng: float) -> list[dict[str, Any]]:
    return query_layer_by_point(HMDA_QUERY_URL, lat, lng)


def query_statewide_village(lat: float, lng: float) -> list[dict[str, Any]]:
    return query_layer_by_point(STATEWIDE_QUERY_URL, lat, lng)


def source_seed_from_properties(properties: dict[str, Any]) -> dict[str, Any]:
    if properties.get("sourceOsmType") and properties.get("sourceOsmId"):
        osm_type = properties["sourceOsmType"]
        osm_id = properties["sourceOsmId"]
        return {
            "kind": "place_centroid",
            "name": "OpenStreetMap place centroid",
            "url": f"https://www.openstreetmap.org/{osm_type}/{osm_id}",
            "license": "ODbL-1.0",
            "retrievedAt": "2026-06-25",
        }
    return {
        "kind": "place_centroid",
        "name": "PlotDNA supplemental uncovered-area centroid",
        "url": "docs/HYDERABAD_UNCOVERED_AREAS.md",
        "license": "internal-derived",
        "retrievedAt": "2026-06-25",
    }


def build_audit_row(
    feature: dict[str, Any],
    hmda_matches: list[dict[str, Any]],
    statewide_matches: list[dict[str, Any]],
) -> dict[str, Any]:
    properties = feature["properties"]
    centroid = polygon_centroid(feature["geometry"]["coordinates"][0])
    sources = [source_seed_from_properties(properties)]
    row: dict[str, Any] = {
        "slug": properties["slug"],
        "name": properties["name"],
        "place": properties.get("place"),
        "status": "needs_non_hmda_boundary_source",
        "centroid": centroid,
        "generatedCellAreaKm2": properties.get("areaKm2"),
        "boundaryKind": properties.get("boundaryKind"),
        "boundaryConfidence": properties.get("boundaryConfidence"),
        "sources": sources,
        "officialMatches": [],
        "nextAction": "Find sourced village/admin boundary and verify score signals before promotion.",
    }
    if hmda_matches:
        row["status"] = "tgrac_village_matched"
        row["sources"].append(
            {
                "kind": "official_boundary_lookup",
                "name": HMDA_LAYER_NAME,
                "url": HMDA_LAYER_URL,
                "retrievedAt": RETRIEVED_AT,
                "license": "public ArcGIS REST service",
            }
        )
        row["officialMatches"] = [
            {
                "source": "TGRAC",
                "sourceLayer": HMDA_LAYER_NAME,
                "sourceUrl": HMDA_LAYER_URL,
                "sourceIdField": "FID",
                "sourceId": match.get("FID"),
                "sourceKey": f"hmda:{match.get('FID')}",
                "villageName": match.get("V_Name"),
                "mandalName": match.get("Mandal_Nam"),
                "districtName": match.get("Dist_Name"),
                "revenueName": match.get("N_Revenue"),
                "divisionName": match.get("DIV_NAME"),
                "admin": match.get("Admin"),
                "dmvCode": match.get("DMV_Code"),
                "fid": match.get("FID"),
            }
            for match in hmda_matches
        ]
        row["nextAction"] = "Use official village match to source geometry and then attach verified score signals."
    elif statewide_matches:
        row["status"] = "tgrac_statewide_village_matched"
        row["sources"].append(
            {
                "kind": "official_boundary_lookup",
                "name": STATEWIDE_LAYER_NAME,
                "url": STATEWIDE_LAYER_URL,
                "retrievedAt": RETRIEVED_AT,
                "license": "public ArcGIS REST service",
            }
        )
        row["officialMatches"] = [
            {
                "source": "TGRAC",
                "sourceLayer": STATEWIDE_LAYER_NAME,
                "sourceUrl": STATEWIDE_LAYER_URL,
                "sourceIdField": "OBJECTID",
                "sourceId": match.get("OBJECTID"),
                "sourceKey": f"statewide:{match.get('OBJECTID')}",
                "villageName": match.get("Village") or match.get("Village_Name_"),
                "mandalName": match.get("Mandal") or match.get("Subdistrict_Name"),
                "districtName": match.get("District") or match.get("District_Name_"),
                "revenueName": match.get("NewRevRema"),
                "divisionName": match.get("Revenue_Division"),
                "admin": match.get("Class") or match.get("ULB"),
                "dmvCode": match.get("DMV_Code"),
                "villageCode": match.get("Village_Code"),
                "census2011Code": match.get("Census_2011_Code"),
                "households": match.get("No_HH"),
                "population": match.get("TOT_P"),
            }
            for match in statewide_matches
        ]
        row["nextAction"] = "Use official statewide village match to source geometry and then attach verified score signals."
    return row


def main() -> None:
    coverage = load_json(COVERAGE_PATH)
    context_features = [
        feature
        for feature in coverage["features"]
        if feature.get("properties", {}).get("contextOnly")
    ]
    source_audits: list[dict[str, Any]] = []
    for index, feature in enumerate(context_features, start=1):
        lat, lng = polygon_centroid(feature["geometry"]["coordinates"][0])
        try:
            hmda_matches = query_hmda_village(lat, lng)
            statewide_matches = [] if hmda_matches else query_statewide_village(lat, lng)
        except Exception as exc:
            hmda_matches = []
            statewide_matches = []
            row = build_audit_row(feature, hmda_matches, statewide_matches)
            row["status"] = "source_query_failed"
            row["queryError"] = str(exc)
            source_audits.append(row)
            continue
        source_audits.append(build_audit_row(feature, hmda_matches, statewide_matches))
        if index % 10 == 0:
            time.sleep(0.25)

    source_audits.sort(key=lambda row: (row["status"], row["name"], row["slug"]))
    hmda_matched_count = sum(1 for row in source_audits if row["status"] == "tgrac_village_matched")
    statewide_matched_count = sum(1 for row in source_audits if row["status"] == "tgrac_statewide_village_matched")
    matched_count = hmda_matched_count + statewide_matched_count
    payload = {
        "schemaVersion": 1,
        "generatedAt": RETRIEVED_AT,
        "citySlug": "hyderabad",
        "purpose": "source audit for context-only data-pending Hyderabad coverage cells",
        "sourcePolicy": "Do not promote pending cells to scored areas until boundaries and score signals are verified.",
        "primaryOfficialSource": {
            "name": HMDA_LAYER_NAME,
            "url": HMDA_LAYER_URL,
            "fields": ["V_Name", "Mandal_Nam", "Dist_Name", "N_Revenue", "DMV_Code"],
        },
        "fallbackOfficialSource": {
            "name": STATEWIDE_LAYER_NAME,
            "url": STATEWIDE_LAYER_URL,
            "fields": ["Village", "Mandal", "District", "Revenue_Division", "DMV_Code", "OBJECTID"],
        },
        "summary": {
            "pendingContextCellCount": len(source_audits),
            "tgracVillageMatchedCount": hmda_matched_count,
            "tgracStatewideVillageMatchedCount": statewide_matched_count,
            "officialVillageMatchedCount": matched_count,
            "needsNonHmdaBoundarySourceCount": len(source_audits) - matched_count,
        },
        "sourceAudits": source_audits,
    }
    write_json(OUTPUT_PATH, payload)
    print(
        f"Wrote {len(source_audits)} pending context source audits "
        f"({matched_count} TGRAC village matches) to {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
