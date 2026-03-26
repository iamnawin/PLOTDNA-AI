"""
Score routes:
  GET  /api/score/{area_slug}  — named area stub (legacy, not used by frontend)
  POST /api/score/analyze      — live DNA score for any (lat, lng) coordinate
"""
import time
import logging
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.overpass_service import fetch_osm_signals
from app.services.scoring_engine import compute_from_osm

logger = logging.getLogger(__name__)
router = APIRouter()

# ── In-memory cache (24 h, keyed to 3-decimal-place lat/lng grid ~111 m) ────
_cache: dict[str, tuple[dict, float]] = {}
CACHE_TTL = 24 * 3600


def _cache_key(lat: float, lng: float) -> str:
    return f"{lat:.3f}:{lng:.3f}"


# ── Request / response models ─────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    lat: float = Field(..., ge=-90,  le=90,  description="Latitude (WGS84)")
    lng: float = Field(..., ge=-180, le=180, description="Longitude (WGS84)")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/{area_slug}")
def get_dna_score(area_slug: str):
    """Stub — returns zeros. Use POST /analyze for live coordinate scoring."""
    return {
        "area": area_slug,
        "dna_score": 0,
        "signals": {
            "infrastructure": 0,
            "population": 0,
            "satellite": 0,
            "rera": 0,
            "employment": 0,
            "priceVelocity": 0,
            "govtScheme": 0,
        },
        "note": "Use POST /api/score/analyze for live coordinate-based scoring",
    }


@router.post("/analyze")
async def analyze_coordinate(req: AnalyzeRequest):
    """
    Live DNA score for any coordinate.

    Pipeline:
    1. Check 24-hour cache (keyed to ~111 m grid cell)
    2. Query Overpass API for OSM signals within configurable radii
    3. Normalize counts → 0-100 signals using log scale
    4. Apply SIGNAL_WEIGHTS → DNA score (0-100 integer)
    5. Return score, signals, highlights, confidence, source transparency
    """
    key = _cache_key(req.lat, req.lng)

    # Serve from cache if fresh
    if key in _cache:
        cached_response, expires_at = _cache[key]
        if time.time() < expires_at:
            return {**cached_response, "freshness": "cached"}

    # Fetch live OSM signals
    counts = await fetch_osm_signals(req.lat, req.lng)
    result = compute_from_osm(counts)

    response = {
        "score":      result.score,
        "signals": {
            "infrastructure": result.signals.infrastructure,
            "population":     result.signals.population,
            "satellite":      result.signals.satellite,
            "rera":           result.signals.rera,
            "employment":     result.signals.employment,
            "priceVelocity":  result.signals.priceVelocity,
            "govtScheme":     result.signals.govtScheme,
        },
        "highlights":  result.highlights,
        "confidence":  result.confidence,
        "osm_counts":  counts,           # raw signal counts for transparency
        "data_sources": ["OpenStreetMap / Overpass API"],
        "coverage_note": "priceVelocity and govtScheme use proxies — real data in Phase 3",
        "scored_at":   datetime.now(timezone.utc).isoformat(),
        "freshness":   "live",
    }

    _cache[key] = (response, time.time() + CACHE_TTL)
    logger.info(
        "Scored %.4f,%.4f → DNA %d (infra=%d employ=%d satellite=%d)",
        req.lat, req.lng, result.score,
        result.signals.infrastructure,
        result.signals.employment,
        result.signals.satellite,
    )
    return response
