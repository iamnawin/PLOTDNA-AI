"""
Utility routes:
  GET  /api/utils/resolve-map-link  — follow a short map URL and return lat/lng
  POST /api/utils/analyze-brochure  — extract location from a PDF or image brochure
"""
import base64
import json
import re

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import settings

router = APIRouter()

# ── Shared helper ─────────────────────────────────────────────────────────────

def _coords_from_url(url: str) -> tuple[float, float] | None:
    """Parse lat/lng from a resolved Google Maps / OSM / Apple Maps URL."""
    # Google Maps @lat,lng,zoom
    m = re.search(r"@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)", url)
    if m:
        return float(m.group(1)), float(m.group(2))
    # ?q=lat,lng or &q=lat,lng
    m = re.search(r"[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)", url)
    if m:
        return float(m.group(1)), float(m.group(2))
    # Apple Maps ?ll=lat,lng
    m = re.search(r"[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)", url)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None


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
        async with httpx.AsyncClient(follow_redirects=True, timeout=12) as client:
            resp = await client.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 (compatible; PlotDNA/1.0)"},
            )
            final_url = str(resp.url)
            coords = _coords_from_url(final_url)
            if coords:
                return {"lat": coords[0], "lng": coords[1]}
    except Exception:
        pass

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
