from __future__ import annotations

from difflib import SequenceMatcher

import httpx

from app.core.config import settings
from app.services.location_resolver import dist_km, normalize_place_name, resolver
from app.services.market_catalog import get_city_area


HYDERABAD_CENTER = (17.385, 78.487)
LANDMARK_ALIASES = {
    "rajiv gandhi international airport": "shamshabad",
    "rgia": "shamshabad",
    "hyderabad airport": "shamshabad",
    "shamshabad airport": "shamshabad",
}


def _resolution_payload(lat: float, lng: float, locality: str | None, city: str | None) -> dict:
    resolution = resolver.resolve(lat=lat, lng=lng, locality_hint=locality, city_hint=city)
    catalog_area = None
    if resolution["tier"] in {"exact", "nearby"} and resolution["citySlug"] and resolution["localitySlug"]:
        area = get_city_area(resolution["citySlug"], resolution["localitySlug"])
        if area is not None:
            catalog_area = area.model_dump()
    return {
        **resolution,
        "resolvedPlaceSlug": resolution["localitySlug"],
        "analysisSlug": catalog_area.get("slug") if catalog_area else None,
        "boundaryKind": catalog_area.get("boundaryKind") if catalog_area else None,
        "boundaryConfidence": catalog_area.get("boundaryConfidence") if catalog_area else None,
        "scorePrecision": catalog_area.get("scorePrecision") if catalog_area else None,
        "catalogArea": catalog_area,
    }


def _local_candidates(query: str) -> list[dict]:
    normalized_query = normalize_place_name(query)
    if not normalized_query:
        return []
    city_data = resolver.cities.get("hyderabad")
    if not city_data:
        return []

    landmark_slug = LANDMARK_ALIASES.get(normalized_query)
    candidates: list[dict] = []
    for locality in city_data["localities"]:
        slug = locality["slug"]
        aliases = {
            normalize_place_name(locality["name"]),
            normalize_place_name(slug.replace("-", " ")),
            *(normalize_place_name(alias) for alias in city_data["aliases"].get(slug, [])),
        }
        aliases.discard("")

        if landmark_slug == slug:
            score, match_kind = 1.0, "landmark"
        elif normalized_query in aliases:
            score, match_kind = 1.0, "exact"
        elif any(alias.startswith(normalized_query) for alias in aliases):
            score, match_kind = 0.9, "prefix"
        elif len(normalized_query.split()) <= 4 and not any(char.isdigit() for char in query):
            score = max(SequenceMatcher(None, normalized_query, alias).ratio() for alias in aliases)
            match_kind = "fuzzy"
            if score < 0.72:
                continue
        else:
            continue

        candidates.append({"locality": locality, "score": score, "matchKind": match_kind})

    return sorted(
        candidates,
        key=lambda item: (-item["score"], item["locality"]["name"]),
    )


async def geocode_address(query: str) -> dict | None:
    base_url = settings.GEOCODER_BASE_URL.strip().rstrip("/")
    if not base_url:
        return None
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{base_url}/search",
                params={
                    "q": query,
                    "format": "jsonv2",
                    "limit": 1,
                    "addressdetails": 1,
                    "countrycodes": "in",
                },
                headers={"User-Agent": settings.GEOCODER_USER_AGENT},
            )
            response.raise_for_status()
            results = response.json()
    except (httpx.HTTPError, ValueError):
        return None

    if not isinstance(results, list) or not results:
        return None
    first = results[0]
    address = first.get("address") if isinstance(first.get("address"), dict) else {}
    locality = next(
        (address.get(key) for key in ("suburb", "neighbourhood", "village", "town", "city_district") if address.get(key)),
        None,
    )
    city = next((address.get(key) for key in ("city", "town", "municipality") if address.get(key)), None)
    try:
        return {
            "lat": float(first["lat"]),
            "lng": float(first["lon"]),
            "display_name": str(first.get("display_name") or query),
            "locality": locality,
            "city": city,
        }
    except (KeyError, TypeError, ValueError):
        return None


async def search_location(query: str, limit: int = 5) -> dict:
    clean_query = " ".join(query.strip().split())
    local = _local_candidates(clean_query)
    if local:
        results = []
        for candidate in local[:limit]:
            locality = candidate["locality"]
            lat, lng = locality["center"]
            match_kind = candidate["matchKind"]
            results.append({
                "displayName": clean_query if match_kind == "landmark" else locality["name"],
                "localitySlug": locality["slug"],
                "lat": lat,
                "lng": lng,
                "source": "local_index",
                "matchKind": match_kind,
                "precision": "landmark" if match_kind == "landmark" else "exact_boundary",
                "resolution": _resolution_payload(lat, lng, locality["name"], "Hyderabad"),
            })
        return {"query": clean_query, "reason": "ok", "results": results}

    geocoded = await geocode_address(clean_query)
    if not geocoded:
        return {"query": clean_query, "reason": "no_result", "results": []}

    lat = geocoded["lat"]
    lng = geocoded["lng"]
    hyderabad_meta = resolver.cities.get("hyderabad", {}).get("meta", {})
    market_radius_km = float(hyderabad_meta.get("coverageRadiusKm", 68.0))
    in_market = dist_km(lat, lng, *HYDERABAD_CENTER) <= market_radius_km
    if not in_market:
        return {
            "query": clean_query,
            "reason": "outside_market",
            "results": [{
                "displayName": geocoded["display_name"],
                "localitySlug": None,
                "lat": lat,
                "lng": lng,
                "source": "geocoder",
                "matchKind": "address",
                "precision": "outside_market",
                "resolution": None,
            }],
        }

    resolution = _resolution_payload(lat, lng, geocoded.get("locality"), geocoded.get("city"))
    return {
        "query": clean_query,
        "reason": "ok",
        "results": [{
            "displayName": geocoded["display_name"],
            "localitySlug": resolution.get("resolvedPlaceSlug"),
            "lat": lat,
            "lng": lng,
            "source": "geocoder",
            "matchKind": "address",
            "precision": "geocoded_point",
            "resolution": resolution,
        }],
    }
