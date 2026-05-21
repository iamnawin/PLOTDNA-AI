"""
Score routes:
  GET  /api/score/{area_slug}  - named area stub (legacy, not used by frontend)
  POST /api/score/analyze      - live DNA score for any (lat, lng) coordinate
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.osm_cache import get_osm_cache, set_osm_cache, ttl_seconds
from app.services.overpass_service import fetch_osm_signals_with_status
from app.services.scoring_engine import compute_from_osm

logger = logging.getLogger(__name__)
router = APIRouter()


class AnalyzeRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude (WGS84)")
    lng: float = Field(..., ge=-180, le=180, description="Longitude (WGS84)")


@router.get("/{area_slug}")
def get_dna_score(area_slug: str):
    """Stub. Use POST /analyze for live coordinate scoring."""
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
    1. Check JSON OSM cache keyed to a 3-decimal coordinate grid.
    2. Query Overpass API only on cache miss.
    3. Reuse stale cached counts if Overpass is unavailable.
    4. Normalize counts into PlotDNA signals and score.
    """
    cached = get_osm_cache(req.lat, req.lng)
    freshness = "cached" if cached else "live"
    stale_reason = None

    if cached:
        counts = cached.counts
    else:
        counts, overpass_ok = await fetch_osm_signals_with_status(req.lat, req.lng)
        if overpass_ok:
            try:
                cached = set_osm_cache(req.lat, req.lng, counts)
            except Exception as exc:
                logger.warning("Could not write OSM cache for %.4f,%.4f: %s", req.lat, req.lng, exc)
        else:
            stale = get_osm_cache(req.lat, req.lng, allow_stale=True)
            if stale:
                cached = stale
                counts = stale.counts
                freshness = "stale"
                stale_reason = "Overpass unavailable; using expired cached OSM counts."
            else:
                freshness = "unavailable"
                stale_reason = "Overpass unavailable and no cached OSM counts exist for this coordinate cell."

    result = compute_from_osm(counts)

    response = {
        "score": result.score,
        "signals": {
            "infrastructure": result.signals.infrastructure,
            "population": result.signals.population,
            "satellite": result.signals.satellite,
            "rera": result.signals.rera,
            "employment": result.signals.employment,
            "priceVelocity": result.signals.priceVelocity,
            "govtScheme": result.signals.govtScheme,
        },
        "highlights": result.highlights,
        "confidence": result.confidence,
        "osm_counts": counts,
        "data_sources": ["OpenStreetMap / Overpass API"],
        "coverage_note": "priceVelocity and govtScheme use proxies - real data in Phase 3",
        "scored_at": datetime.now(timezone.utc).isoformat(),
        "freshness": freshness,
        "cache": {
            "key": cached.key if cached else None,
            "hit": freshness in ("cached", "stale"),
            "age_seconds": cached.age_seconds if cached else 0,
            "ttl_seconds": ttl_seconds(),
            "stale_reason": stale_reason,
        },
    }

    logger.info(
        "Scored %.4f,%.4f -> DNA %d (freshness=%s infra=%d employ=%d satellite=%d)",
        req.lat,
        req.lng,
        result.score,
        freshness,
        result.signals.infrastructure,
        result.signals.employment,
        result.signals.satellite,
    )
    return response
