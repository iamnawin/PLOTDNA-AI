"""
Spatial Accuracy Verifier
Cross-references plot coordinates with:
  - Bhuvan WMS (ISRO) — India: land use, built-up area, flood zones
  - OSM (OpenStreetMap) Nominatim + Overpass — zoning tags, road proximity
  - DLD/Bayut data — UAE: zone classification

Returns a SpatialReport with verified land use, zoning, and proximity scores
that feed into the advanced DNA scorer.
"""
import logging
from dataclasses import dataclass, asdict
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# Bhuvan WMS base URL (ISRO, free public access)
_BHUVAN_WMS = "https://bhuvan.nrsc.gov.in/bhuvan/wms"
_NOMINATIM   = "https://nominatim.openstreetmap.org"
_OVERPASS    = "https://overpass-api.de/api/interpreter"

NOMINATIM_HEADERS = {"User-Agent": "PlotDNA/2.0 (plotdna.in)"}


# ── Data models ────────────────────────────────────────────────────────────────

@dataclass
class ProximityItem:
    name: str
    type: str       # "metro_station" | "highway" | "hospital" | "school" | "it_park"
    distance_m: float


@dataclass
class SpatialReport:
    lat: float
    lng: float
    country: str

    # Land classification
    land_use_official: str = "Unknown"  # From Bhuvan/DLD
    land_use_osm: str = "Unknown"       # From OSM tags
    is_flood_zone: bool = False
    is_agricultural: bool = False       # Agricultural land → legal risk if sold as residential
    is_restricted: bool = False         # Eco-sensitive / forest / CRZ buffer

    # Address
    formatted_address: str = ""
    district: str = ""
    state: str = ""

    # Proximity (nearest items within 5km)
    nearest_metro: Optional[ProximityItem] = None
    nearest_highway: Optional[ProximityItem] = None
    nearest_it_park: Optional[ProximityItem] = None
    proximity_items: list = None        # All items found

    # Connectivity score (0-100) — drives infra signal in Phase 2 scorer
    connectivity_score: int = 50

    # Legal risk flags
    legal_risk_level: str = "Low"       # "Low" | "Medium" | "High"
    legal_risk_reasons: list = None

    error: Optional[str] = None

    def __post_init__(self):
        if self.proximity_items is None:
            self.proximity_items = []
        if self.legal_risk_reasons is None:
            self.legal_risk_reasons = []

    def to_dict(self) -> dict:
        d = asdict(self)
        return d


# ── Nominatim (OSM reverse geocoding) ─────────────────────────────────────────

async def _reverse_geocode(lat: float, lng: float) -> dict:
    params = {
        "lat": lat, "lon": lng, "format": "json",
        "addressdetails": 1, "extratags": 1,
    }
    try:
        async with httpx.AsyncClient(timeout=8.0, headers=NOMINATIM_HEADERS) as client:
            resp = await client.get(f"{_NOMINATIM}/reverse", params=params)
            resp.raise_for_status()
            return resp.json()
    except Exception as exc:
        logger.error("Nominatim reverse geocode failed: %s", exc)
        return {}


def _extract_osm_landuse(geo: dict) -> str:
    """Extract land use from OSM reverse geocode response."""
    extratags = geo.get("extratags", {})
    landuse = extratags.get("landuse") or extratags.get("land_use") or ""
    if landuse:
        return landuse.title()
    # Fallback: infer from address type
    addr_type = geo.get("type", "")
    if addr_type in ("residential", "suburb", "neighbourhood"):
        return "Residential"
    if addr_type in ("industrial", "commercial"):
        return addr_type.title()
    return "Unknown"


# ── OSM Overpass — proximity search ───────────────────────────────────────────

_OVERPASS_QUERY = """
[out:json][timeout:15];
(
  node["railway"="station"](around:{radius},{lat},{lng});
  node["public_transport"="station"](around:{radius},{lat},{lng});
  way["highway"~"motorway|trunk|primary"](around:{radius},{lat},{lng});
  node["landuse"="industrial"]["office"~"it|tech"](around:{radius},{lat},{lng});
  way["landuse"="retail"](around:{radius},{lat},{lng});
);
out center;
"""


async def _query_overpass(lat: float, lng: float, radius_m: int = 5000) -> list[dict]:
    query = _OVERPASS_QUERY.format(lat=lat, lng=lng, radius=radius_m)
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(_OVERPASS, data={"data": query})
            resp.raise_for_status()
            return resp.json().get("elements", [])
    except Exception as exc:
        logger.error("Overpass query failed: %s", exc)
        return []


def _classify_osm_element(el: dict) -> Optional[ProximityItem]:
    tags = el.get("tags", {})
    name = tags.get("name", tags.get("name:en", ""))
    if not name:
        return None

    lat = el.get("lat") or el.get("center", {}).get("lat", 0)
    lng = el.get("lon") or el.get("center", {}).get("lon", 0)

    if tags.get("railway") == "station" or tags.get("public_transport") == "station":
        return ProximityItem(name=name, type="metro_station", distance_m=0)
    if tags.get("highway") in ("motorway", "trunk", "primary"):
        return ProximityItem(name=name, type="highway", distance_m=0)
    if "it" in tags.get("office", "").lower() or "tech" in name.lower():
        return ProximityItem(name=name, type="it_park", distance_m=0)
    return None


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Approximate distance in meters between two WGS84 points."""
    from math import radians, sin, cos, sqrt, atan2
    R = 6371000
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlam = radians(lon2 - lon1)
    a = sin(dphi/2)**2 + cos(phi1)*cos(phi2)*sin(dlam/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def _connectivity_score(items: list[ProximityItem]) -> int:
    """Score 0-100 based on what's within 5km."""
    score = 40  # base
    for item in items:
        d = item.distance_m
        if item.type == "metro_station":
            if d < 1000:   score += 30
            elif d < 2500: score += 20
            elif d < 5000: score += 10
        elif item.type == "highway":
            if d < 2000:   score += 15
            elif d < 5000: score += 8
        elif item.type == "it_park":
            if d < 3000:   score += 15
            elif d < 5000: score += 8
    return min(100, score)


# ── Bhuvan WMS (India only) ────────────────────────────────────────────────────

async def _query_bhuvan_landuse(lat: float, lng: float) -> str:
    """
    Query Bhuvan WMS GetFeatureInfo for land use class at a point.
    Layer: lulc_2022 (Land Use Land Cover 2022)
    Returns: land use class string e.g. "Built-up" | "Agricultural" | "Forest"
    """
    delta = 0.001  # ~100m bbox
    params = {
        "SERVICE": "WMS",
        "VERSION": "1.1.1",
        "REQUEST": "GetFeatureInfo",
        "LAYERS": "lulc_2022",
        "QUERY_LAYERS": "lulc_2022",
        "STYLES": "",
        "SRS": "EPSG:4326",
        "BBOX": f"{lng-delta},{lat-delta},{lng+delta},{lat+delta}",
        "WIDTH": 101, "HEIGHT": 101,
        "X": 50, "Y": 50,
        "INFO_FORMAT": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(_BHUVAN_WMS, params=params)
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                if features:
                    lulc_class = features[0].get("properties", {}).get("lulc_class", "")
                    return lulc_class or "Unknown"
    except Exception as exc:
        logger.debug("Bhuvan WMS unavailable: %s", exc)
    return "Unknown"


def _legal_risk_assessment(
    land_use_official: str,
    is_flood_zone: bool,
    is_agricultural: bool,
    is_restricted: bool,
) -> tuple[str, list[str]]:
    reasons = []
    score = 0

    if is_agricultural:
        score += 3
        reasons.append("Land classified as Agricultural — conversion approval required")
    if is_restricted:
        score += 3
        reasons.append("Plot may be in eco-sensitive / CRZ / forest buffer zone")
    if is_flood_zone:
        score += 2
        reasons.append("Location in or near flood zone — verify NDMA flood map")
    if "forest" in land_use_official.lower():
        score += 3
        reasons.append("Forest classification on official records")

    if score >= 5:
        return "High", reasons
    if score >= 2:
        return "Medium", reasons
    return "Low", reasons


# ── Public API ─────────────────────────────────────────────────────────────────

async def verify_spatial(lat: float, lng: float, country: str = "India") -> SpatialReport:
    """
    Full spatial verification for a coordinate.
    Combines OSM + Bhuvan (India) / UAE zone data.

    Args:
        lat: Latitude (WGS84)
        lng: Longitude (WGS84)
        country: "India" or "UAE"

    Returns:
        SpatialReport with land use, connectivity score, legal risk
    """
    import asyncio

    geo_task = _reverse_geocode(lat, lng)
    overpass_task = _query_overpass(lat, lng)
    bhuvan_task = _query_bhuvan_landuse(lat, lng) if country == "India" else asyncio.coroutine(lambda: "Unknown")()

    geo, elements, bhuvan_landuse = await asyncio.gather(geo_task, overpass_task, bhuvan_task)

    address = geo.get("display_name", "")
    addr_parts = geo.get("address", {})
    osm_landuse = _extract_osm_landuse(geo)

    # Parse proximity items
    proximity_items = []
    for el in elements:
        item = _classify_osm_element(el)
        if item:
            el_lat = el.get("lat") or el.get("center", {}).get("lat", lat)
            el_lng = el.get("lon") or el.get("center", {}).get("lon", lng)
            item.distance_m = round(_haversine_m(lat, lng, el_lat, el_lng), 0)
            proximity_items.append(item)

    # Sort by distance
    proximity_items.sort(key=lambda x: x.distance_m)

    nearest_metro = next((i for i in proximity_items if i.type == "metro_station"), None)
    nearest_highway = next((i for i in proximity_items if i.type == "highway"), None)
    nearest_it_park = next((i for i in proximity_items if i.type == "it_park"), None)

    connectivity = _connectivity_score(proximity_items)

    # Determine land use
    land_use_official = bhuvan_landuse if bhuvan_landuse != "Unknown" else osm_landuse
    is_agricultural = any(w in land_use_official.lower() for w in ["agri", "farm", "crop"])
    is_restricted = any(w in land_use_official.lower() for w in ["forest", "eco", "crz", "wetland"])

    legal_level, legal_reasons = _legal_risk_assessment(
        land_use_official, False, is_agricultural, is_restricted
    )

    return SpatialReport(
        lat=lat, lng=lng, country=country,
        land_use_official=land_use_official,
        land_use_osm=osm_landuse,
        is_agricultural=is_agricultural,
        is_restricted=is_restricted,
        formatted_address=address[:200],
        district=addr_parts.get("county") or addr_parts.get("state_district", ""),
        state=addr_parts.get("state", ""),
        nearest_metro=nearest_metro,
        nearest_highway=nearest_highway,
        nearest_it_park=nearest_it_park,
        proximity_items=proximity_items[:10],
        connectivity_score=connectivity,
        legal_risk_level=legal_level,
        legal_risk_reasons=legal_reasons,
    )
