"""
Utility routes:
  GET  /api/utils/resolve-map-link  — follow a short map URL and return lat/lng
  POST /api/utils/analyze-brochure  — extract location from a PDF or image brochure
"""
import base64
import json
import os
import re
from html import unescape
from urllib.parse import parse_qs, unquote, urlparse

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.location_resolver import resolver
from app.services.market_catalog import get_city_area


router = APIRouter()

_GENERIC_LOCATION_TEXT = {
    "google maps",
    "find local businesses, view maps and get driving directions in google maps.",
}

# ── Shared helper ─────────────────────────────────────────────────────────────

def _coords_from_url(url: str) -> tuple[float, float] | None:
    """Parse lat/lng from a resolved Google Maps / OSM / Apple Maps URL."""
    patterns = [
        r"@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)",  # Google Maps @lat,lng
        r"!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)",  # Google Maps !3dlat!4dlng
        r"[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)",  # ?q=lat,lng
        r"[?&](?:query|destination|center)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)",
        r"[?&](?:ll|sll)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)",  # Apple Maps ll/sll
        r"[?&]mlat=(-?\d{1,3}\.\d+).*?[?&]mlon=(-?\d{1,3}\.\d+)",  # OSM mlat/mlon
        r"#map=\d+/(-?\d{1,3}\.\d+)/(-?\d{1,3}\.\d+)",  # OSM hash
        r"/(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)(?:,|[/?#&]|$)",  # fallback /lat,lng path segment
    ]
    for pattern in patterns:
        m = re.search(pattern, url)
        if m:
            return float(m.group(1)), float(m.group(2))
    return None


def _coords_from_text(text: str) -> tuple[float, float] | None:
    m = re.search(r"(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)", text)
    if not m:
        return None
    lat = float(m.group(1))
    lng = float(m.group(2))
    if -90 <= lat <= 90 and -180 <= lng <= 180:
        return lat, lng
    return None


def _clean_location_candidate(text: str) -> str | None:
    cleaned = unescape(unquote(text)).replace("+", " ").strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = re.sub(r"\s*[-|]\s*Google Maps\s*$", "", cleaned, flags=re.I)
    cleaned = cleaned.strip(" ,")
    if not cleaned or cleaned.lower() in _GENERIC_LOCATION_TEXT:
        return None
    return cleaned


def _location_candidates_from_url(url: str) -> list[str]:
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    candidates: list[str] = []

    for key in ("q", "query", "destination", "center", "ll", "sll"):
        for value in params.get(key, []):
            cleaned = _clean_location_candidate(value)
            if cleaned:
                candidates.append(cleaned)

    path = unquote(parsed.path)
    for marker in ("/maps/place/", "/maps/search/"):
        if marker in path:
            tail = path.split(marker, 1)[1].split("/", 1)[0]
            cleaned = _clean_location_candidate(tail)
            if cleaned:
                candidates.append(cleaned)

    deduped: list[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        key = candidate.lower()
        if key not in seen:
            seen.add(key)
            deduped.append(candidate)
    return deduped


def _location_candidates_from_html(html: str) -> list[str]:
    candidates: list[str] = []
    patterns = [
        r'<meta[^>]+property="og:title"[^>]+content="([^"]+)"',
        r'<meta[^>]+itemprop="name"[^>]+content="([^"]+)"',
        r'<meta[^>]+name="title"[^>]+content="([^"]+)"',
        r"<title>\s*([^<]+?)\s*</title>",
    ]

    for pattern in patterns:
        for match in re.findall(pattern, html, flags=re.I):
            cleaned = _clean_location_candidate(match)
            if cleaned:
                candidates.append(cleaned)

    deduped: list[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        key = candidate.lower()
        if key not in seen:
            seen.add(key)
            deduped.append(candidate)
    return deduped


# ── Resolve map link ──────────────────────────────────────────────────────────

@router.get("/resolve-map-link")
async def resolve_map_link(url: str):
    """
    Follow a short map URL (maps.app.goo.gl, goo.gl/maps) through redirects
    and extract the coordinates from the final destination URL.
    """
    # Try to parse the URL as-is first (works for full Google Maps URLs)
    coords = _coords_from_url(url)
    if coords:
        return {"lat": coords[0], "lng": coords[1]}

    # Follow redirect chain (needed for short links)
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=25) as client:
            resp = await client.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 (compatible; PlotDNA/1.0)"},
            )
            resp.raise_for_status()
            final_url = str(resp.url)
            coords = _coords_from_url(final_url)
            if coords:
                return {"lat": coords[0], "lng": coords[1]}

            candidates = _location_candidates_from_url(final_url)
            candidates.extend(_location_candidates_from_html(resp.text))

            for candidate in candidates:
                coords = _coords_from_text(candidate)
                if coords:
                    return {"lat": coords[0], "lng": coords[1], "resolved_query": candidate}
                geocoded = await _geocode_address(candidate)
                if geocoded:
                    return {"lat": geocoded[0], "lng": geocoded[1], "resolved_query": candidate}

            raise HTTPException(
                status_code=422,
                detail="Short link expanded, but no usable coordinates or geocodable location were found. Open it in Maps once and copy the full URL instead.",
            )
    except HTTPException:
        raise
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504,
            detail="Timed out while expanding this short map link. Try again in a few seconds or paste the full map URL.",
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Map provider returned {exc.response.status_code} while expanding this short link. Try the full map URL instead.",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not reach the map provider to expand this short link. Try again or paste the full map URL.",
        ) from exc

    raise HTTPException(
        status_code=422,
        detail="Could not extract coordinates from this link. Try copying the coordinates directly.",
    )


# ── Brochure analysis ─────────────────────────────────────────────────────────

_BROCHURE_PROMPT = """You are reading a real estate property document or brochure.
Your ONLY task: extract the property location.

Return a JSON object — no other text:
{
  "address":  "full address as written in the document",
  "locality": "neighbourhood or area name",
  "city":     "city name",
  "state":    "state name",
  "country":  "country (default India if not stated)",
  "lat":      latitude as number if explicitly written, else null,
  "lng":      longitude as number if explicitly written, else null,
  "confidence": "high" | "medium" | "low"
}

If no location is found at all, return: {"error": "no location found"}"""


async def _geocode_address(query: str) -> tuple[float, float] | None:
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "json", "limit": 1},
                headers={"User-Agent": "PlotDNA/1.0 (real estate intelligence)"},
            )
            results = resp.json()
            if results:
                return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception:
        pass
    return None


@router.post("/analyze-brochure")
async def analyze_brochure(file: UploadFile = File(...)):
    """
    Extract property location from a real estate brochure or document.

    Supported formats: PDF, JPEG, PNG, WebP.
    Pipeline:
    1. Send file to Gemini Vision to extract address / coordinates
    2. If no coords in document, geocode the extracted address via Nominatim
    3. Return lat/lng + address context for the DNA pipeline
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API not configured on this server.")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:  # 20 MB guard
        raise HTTPException(status_code=413, detail="File too large. Maximum 20 MB.")

    # Determine MIME type
    fname = (file.filename or "").lower()
    if fname.endswith(".pdf") or (file.content_type or "").startswith("application/pdf"):
        mime = "application/pdf"
    elif fname.endswith((".jpg", ".jpeg")) or "jpeg" in (file.content_type or ""):
        mime = "image/jpeg"
    elif fname.endswith(".png") or "png" in (file.content_type or ""):
        mime = "image/png"
    elif fname.endswith(".webp") or "webp" in (file.content_type or ""):
        mime = "image/webp"
    else:
        mime = file.content_type or "application/octet-stream"

    try:
        import google.generativeai as genai  # lazy import — only needed for this endpoint

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        response = model.generate_content([
            {"mime_type": mime, "data": base64.b64encode(content).decode()},
            _BROCHURE_PROMPT,
        ])

        text = response.text.strip()
        # Strip markdown code fences if Gemini adds them
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        data: dict = json.loads(text)

    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse Gemini response: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gemini Vision error: {exc}")

    if "error" in data:
        raise HTTPException(
            status_code=422,
            detail="No location found in this document. Try searching the area name manually.",
        )

    # If Gemini found explicit coords, return immediately
    if data.get("lat") is not None and data.get("lng") is not None:
        return {
            "lat":        float(data["lat"]),
            "lng":        float(data["lng"]),
            "address":    data.get("address", ""),
            "locality":   data.get("locality", ""),
            "city":       data.get("city", ""),
            "confidence": data.get("confidence", "high"),
        }

    # No coords in document — geocode the address via Nominatim
    parts = [p for p in [data.get("locality"), data.get("city"), data.get("state"), data.get("country")] if p]
    search_query = ", ".join(parts) or data.get("address", "")

    if not search_query:
        raise HTTPException(
            status_code=422,
            detail="Could not identify a location in this document. Try entering the address manually.",
        )

    coords = await _geocode_address(search_query)
    if not coords:
        raise HTTPException(
            status_code=422,
            detail=f"Found address '{search_query}' but could not geocode it. Try pasting the coordinates.",
        )

    return {
        "lat":        coords[0],
        "lng":        coords[1],
        "address":    data.get("address", search_query),
        "locality":   data.get("locality", ""),
        "city":       data.get("city", ""),
        "confidence": data.get("confidence", "medium"),
    }


# ── Lead Collection ───────────────────────────────────────────────────────────

class LeadCreate(BaseModel):
    contact: str = Field(..., min_length=5, max_length=100)

@router.post("/collect-lead")
async def collect_lead(payload: LeadCreate):
    """
    Validate and collect a lead (email or phone number) from the gated DNA report screen.
    Checks if contact is a valid email or a valid 10-digit Indian mobile number.
    Logs it to server output and appends to a local JSON file in workspace root directory.
    """
    contact = payload.contact.strip()
    
    # 1. Validation check
    email_regex = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    is_email = bool(re.match(email_regex, contact))
    
    # Check if valid Indian phone number
    # Extract digits only
    digits = re.sub(r"\D", "", contact)
    if len(digits) == 12 and digits.startswith("91"):
        core_digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        core_digits = digits[1:]
    else:
        core_digits = digits
        
    is_phone = bool(re.match(r"^[6-9]\d{9}$", core_digits))
    
    if not (is_email or is_phone):
        raise HTTPException(
            status_code=422,
            detail="Contact must be a valid email address or a valid 10-digit Indian mobile number."
        )
        
    lead_type = "email" if is_email else "phone"
    
    # 2. Append to a local file leads.json in workspace root
    import datetime
    lead_data = {
        "contact": contact,
        "type": lead_type,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        workspace_root = os.path.abspath(os.path.join(current_dir, "..", "..", "..", ".."))
        leads_file = os.path.join(workspace_root, "leads.json")
        
        leads_list = []
        if os.path.exists(leads_file):
            with open(leads_file, "r") as f:
                try:
                    leads_list = json.load(f)
                except Exception:
                    pass
        leads_list.append(lead_data)
        with open(leads_file, "w") as f:
            json.dump(leads_list, f, indent=2)
    except Exception as e:
        print(f"Failed to write lead to leads.json: {e}")
        
    print(f"[Lead Collected] {lead_type.upper()}: {contact} at {lead_data['timestamp']}")
    
    return {"status": "success", "type": lead_type, "message": "Lead collected successfully."}


# ── Coordinate Resolution ─────────────────────────────────────────────────────

class ResolveRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    locality: str | None = None
    city: str | None = None

@router.post("/resolve")
async def resolve_coordinate(payload: ResolveRequest):
    """
    Resolve coordinates to the most specific geographical coverage tier.
    """
    resolution = resolver.resolve(
        lat=payload.lat,
        lng=payload.lng,
        locality_hint=payload.locality,
        city_hint=payload.city
    )
    catalog_area = None
    if resolution["tier"] in {"exact", "nearby"} and resolution["citySlug"] and resolution["localitySlug"]:
        area = get_city_area(resolution["citySlug"], resolution["localitySlug"])
        if area is not None:
            catalog_area = area.model_dump()

    return {**resolution, "catalogArea": catalog_area}

