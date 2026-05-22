"""
Overpass API service — queries OpenStreetMap for real-time infrastructure
and amenity signals within a configurable radius of any coordinate.

All data is free from OpenStreetMap / Overpass API (no API key required).
Results are NOT cached here — caller is responsible for caching.
"""
import logging
import httpx

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Radius presets (meters) — tuned for Indian urban geography
R_TRANSIT  = 3000    # metro stations, rail, bus terminals
R_ROAD     = 2000    # major road segments (highway types)
R_AIRPORT  = 10000   # airport proximity bonus
R_AMENITY  = 2000    # hospitals, schools, markets
R_EMPLOY   = 5000    # offices, IT parks, commercial zones
R_DENSITY  = 1500    # residential buildings (density proxy)
R_ACTIVITY = 2000    # construction activity (satellite proxy)


def _build_query(lat: float, lng: float) -> str:
    return (
        f"[out:json][timeout:30];\n"
        f"(\n"
        # Transit
        f'  node["station"="subway"](around:{R_TRANSIT},{lat},{lng});\n'
        f'  node["railway"~"^(station|halt)$"](around:{R_TRANSIT},{lat},{lng});\n'
        f'  node["amenity"="bus_station"](around:{R_TRANSIT},{lat},{lng});\n'
        # Major roads
        f'  way["highway"~"^(motorway|trunk|primary)$"](around:{R_ROAD},{lat},{lng});\n'
        # Airport
        f'  node["aeroway"~"^(aerodrome|airport)$"](around:{R_AIRPORT},{lat},{lng});\n'
        f'  way["aeroway"~"^(aerodrome|airport)$"](around:{R_AIRPORT},{lat},{lng});\n'
        # Amenities
        f'  node["amenity"="hospital"](around:{R_AMENITY},{lat},{lng});\n'
        f'  node["amenity"~"^(school|college|university)$"](around:{R_AMENITY},{lat},{lng});\n'
        f'  node["amenity"~"^(marketplace|supermarket)$"](around:{R_AMENITY},{lat},{lng});\n'
        f'  node["shop"="mall"](around:{R_AMENITY},{lat},{lng});\n'
        # Employment / commercial
        f'  way["landuse"~"^(commercial|retail|office|industrial)$"](around:{R_EMPLOY},{lat},{lng});\n'
        f'  way["building"~"^(office|commercial)$"](around:{R_EMPLOY},{lat},{lng});\n'
        f'  node["office"](around:{R_EMPLOY},{lat},{lng});\n'
        # Residential density
        f'  way["building"~"^(apartments|residential|flats)$"](around:{R_DENSITY},{lat},{lng});\n'
        # Construction / development activity
        f'  way["building"="construction"](around:{R_ACTIVITY},{lat},{lng});\n'
        f'  way["landuse"="construction"](around:{R_ACTIVITY},{lat},{lng});\n'
        f');\n'
        f'out tags;\n'
    )


def _count_elements(data: dict) -> dict:
    """Categorize OSM elements into signal buckets."""
    c = {
        "transit": 0,
        "roads": 0,
        "airport": 0,
        "hospitals": 0,
        "education": 0,
        "shopping": 0,
        "offices": 0,
        "it_offices": 0,
        "residential": 0,
        "construction": 0,
    }

    for el in data.get("elements", []):
        tags = el.get("tags", {})
        el_type = el.get("type", "node")

        # Transit
        if tags.get("station") == "subway" or tags.get("railway") in ("station", "halt"):
            c["transit"] += 1
        elif tags.get("amenity") == "bus_station":
            c["transit"] += 1

        # Roads (ways only)
        if el_type == "way" and tags.get("highway") in ("motorway", "trunk", "primary"):
            c["roads"] += 1

        # Airport
        if tags.get("aeroway") in ("aerodrome", "airport"):
            c["airport"] += 1

        # Amenities
        if tags.get("amenity") == "hospital":
            c["hospitals"] += 1
        if tags.get("amenity") in ("school", "college", "university"):
            c["education"] += 1
        if tags.get("amenity") in ("marketplace", "supermarket") or tags.get("shop") == "mall":
            c["shopping"] += 1

        # Employment
        if el_type == "way" and tags.get("landuse") in ("commercial", "retail", "office", "industrial"):
            c["offices"] += 1
        if el_type == "way" and tags.get("building") in ("office", "commercial"):
            c["offices"] += 1
        if tags.get("office"):
            c["offices"] += 1
            office_val = str(tags.get("office", "")).lower()
            if any(k in office_val for k in ("it", "tech", "software", "computer", "telecom")):
                c["it_offices"] += 1

        # Residential density
        if el_type == "way" and tags.get("building") in ("apartments", "residential", "flats"):
            c["residential"] += 1

        # Construction activity
        if tags.get("building") == "construction" or tags.get("landuse") == "construction":
            c["construction"] += 1

    return c


async def fetch_osm_signals(lat: float, lng: float) -> dict:
    """
    Query Overpass API and return categorized OSM signal counts for the coordinate.
    Returns zero-filled dict on failure (caller should degrade gracefully).
    """
    query = _build_query(lat, lng)
    try:
        async with httpx.AsyncClient(timeout=35) as client:
            resp = await client.post(
                OVERPASS_URL,
                data=f"data={query}",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            counts = _count_elements(resp.json())
            logger.info(
                "Overpass signals for %.4f,%.4f: transit=%d roads=%d offices=%d residential=%d construction=%d",
                lat, lng,
                counts["transit"], counts["roads"], counts["offices"],
                counts["residential"], counts["construction"],
            )
            return counts
    except Exception as exc:
        logger.warning("Overpass query failed for %.4f,%.4f: %s", lat, lng, exc)
        return {k: 0 for k in (
            "transit", "roads", "airport", "hospitals", "education",
            "shopping", "offices", "it_offices", "residential", "construction"
        )}
