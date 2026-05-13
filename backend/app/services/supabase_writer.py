"""
Supabase persistence for Phase 2 data (brochure extractions, Phase 2 scores).
Non-fatal — all saves are fire-and-forget; failures are logged but not raised.
"""
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


async def save_brochure_extraction(extraction, city_slug: Optional[str] = None) -> Optional[str]:
    """
    Save a BrochureExtraction to Supabase `brochure_extractions` table.
    Returns the row UUID, or None if Supabase is not configured / save fails.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        logger.debug("Supabase not configured — skipping brochure save")
        return None

    try:
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

        row = {
            "project_name": extraction.project_name,
            "developer_name": extraction.developer_name,
            "country": extraction.country,
            "currency": extraction.currency,
            "city_slug": city_slug or "",
            "plot_area_sqft": extraction.plot_area_sqft,
            "carpet_area_sqft": extraction.carpet_area_sqft,
            "super_builtup_sqft": extraction.super_builtup_sqft,
            "loading_pct": extraction.loading_percentage,
            "price_per_sqft": extraction.price_per_sqft,
            "total_price_range": extraction.total_price_range,
            "rera_number": extraction.rera_number,
            "rera_state": extraction.rera_state,
            "possession_date": extraction.possession_date,
            "launch_date": extraction.launch_date,
            "hidden_clauses": extraction.hidden_clauses,
            "confidence": extraction.confidence,
            "raw_extraction": extraction.to_dict(),
        }

        # Add PostGIS point if coordinates extracted
        if extraction.latitude and extraction.longitude:
            row["coordinates"] = f"SRID=4326;POINT({extraction.longitude} {extraction.latitude})"

        result = client.table("brochure_extractions").insert(row).execute()
        if result.data:
            row_id = result.data[0].get("id")
            logger.info("Brochure saved to Supabase: %s", row_id)
            return row_id
    except Exception as exc:
        logger.error("Supabase brochure save failed: %s", exc)

    return None


async def save_phase2_score(area_slug: str, city_slug: str, country: str, score_data: dict) -> bool:
    """Save Phase 2 score to Supabase `area_scores_v2` table."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return False
    try:
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

        row = {
            "area_slug": area_slug,
            "city_slug": city_slug,
            "country": country,
            "phase2_score": score_data.get("phase2_score"),
            "phase1_score": score_data.get("phase1_score"),
            "infra_score": score_data.get("signals", {}).get("infrastructure"),
            "sentiment_score": score_data.get("signals", {}).get("sentiment"),
            "accuracy_score": score_data.get("signals", {}).get("accuracy"),
            "appreciation_score": score_data.get("signals", {}).get("appreciation"),
        }

        client.table("area_scores_v2").upsert(row, on_conflict="area_slug").execute()
        return True
    except Exception as exc:
        logger.error("Phase 2 score save failed: %s", exc)
        return False
