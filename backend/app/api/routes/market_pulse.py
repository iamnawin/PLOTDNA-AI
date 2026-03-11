"""
Market Pulse routes — live signals for India and UAE areas.

GET /api/v1/market-pulse/{country}/{area_slug}
    Returns Phase 2 score + news sentiment + transaction data

GET /api/v1/dld/transactions/{area_name}
    UAE: Dubai Land Department transaction prices

GET /api/v1/compare
    Cross-border ROI comparison (India vs UAE)
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.services.news_intel import get_market_news
from app.services.dld_client import get_area_transactions
from app.services.advanced_scorer import compute_phase2_score, format_score_breakdown

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Market Pulse ───────────────────────────────────────────────────────────────

@router.get(
    "/market-pulse/{country}/{area_slug}",
    summary="Live market pulse: news sentiment + Phase 2 DNA score",
    tags=["market-pulse"],
)
async def market_pulse(
    country: str,
    area_slug: str,
    area_name: Optional[str] = Query(None, description="Human-readable area name"),
    city: Optional[str] = Query(None, description="City name for news filtering"),
    phase1_score: int = Query(70, ge=0, le=100),
    phase1_infra: int = Query(70, ge=0, le=100),
    phase1_rera: int = Query(70, ge=0, le=100),
    yoy_growth: float = Query(8.0, description="Year-over-year price growth %"),
):
    """
    Returns live market intelligence for an area:
    - News articles + Gemini sentiment score
    - Phase 2 DNA score (4-signal algorithm)
    - UAE: DLD transaction data (if country=UAE)
    """
    if country not in ("India", "UAE"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid country '{country}'. Use 'India' or 'UAE'",
        )

    _area_name = area_name or area_slug.replace("-", " ").title()
    _city = city or ("Dubai" if country == "UAE" else "India")

    # Fetch news + sentiment
    news_result = await get_market_news(
        area_slug=area_slug,
        area_name=_area_name,
        city=_city,
        country=country,
    )

    # UAE: also fetch DLD transaction data
    dld_data = None
    price_trend = None
    if country == "UAE":
        dld_data = await get_area_transactions(_area_name)
        price_trend = dld_data.price_trend_3m

    # Compute Phase 2 score
    phase2 = compute_phase2_score(
        phase1_score=phase1_score,
        phase1_infra_signal=phase1_infra,
        phase1_rera_signal=phase1_rera,
        yoy_growth_pct=yoy_growth,
        sentiment_score=news_result.sentiment_score,
        price_trend_signal=price_trend,
    )

    response = {
        "area_slug": area_slug,
        "area_name": _area_name,
        "city": _city,
        "country": country,
        "news": {
            "articles": [
                {
                    "title": a.title,
                    "url": a.url,
                    "source": a.source,
                    "published_at": a.published_at,
                    "summary": a.summary,
                    "relevance_score": a.relevance_score,
                }
                for a in news_result.articles
            ],
            "sentiment": news_result.sentiment,
            "sentiment_score": news_result.sentiment_score,
            "sentiment_reason": news_result.sentiment_reason,
            "total_articles_found": news_result.total_found,
        },
        "phase2_score": format_score_breakdown(phase2),
        "last_updated": news_result.last_updated,
    }

    if dld_data:
        response["dld_transactions"] = {
            "median_price_aed_sqft": dld_data.median_price_aed_sqft,
            "total_transactions_30d": dld_data.total_transactions_30d,
            "price_trend_3m": dld_data.price_trend_3m,
            "recent": [
                {
                    "date": t.date,
                    "price_per_sqft_aed": t.price_per_sqft_aed,
                    "property_type": t.property_type,
                    "area_sqft": t.area_sqft,
                }
                for t in dld_data.transactions[:5]
            ],
        }

    return response


# ── DLD Transactions (UAE) ─────────────────────────────────────────────────────

@router.get(
    "/dld/transactions/{area_name}",
    summary="Dubai Land Department — real transaction prices for a UAE area",
    tags=["market-pulse"],
)
async def dld_transactions(area_name: str):
    data = await get_area_transactions(area_name)
    if data.error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"DLD data unavailable: {data.error}",
        )
    return data.to_dict()


# ── Cross-border Comparison ────────────────────────────────────────────────────

@router.get(
    "/compare",
    summary="Compare two plots/areas cross-border (India vs UAE)",
    tags=["market-pulse"],
)
async def compare_areas(
    area_a: str = Query(..., description="India area slug, e.g. 'kokapet'"),
    city_a: str = Query(..., description="India city, e.g. 'Hyderabad'"),
    score_a: int = Query(..., ge=0, le=100, description="Phase 1 DNA score for area A"),
    yoy_a: float = Query(8.0, description="YoY growth % for area A"),
    area_b: str = Query(..., description="UAE area slug, e.g. 'jvc-dubai'"),
    city_b: str = Query("Dubai", description="UAE city"),
    score_b: int = Query(..., ge=0, le=100, description="Phase 1 DNA score for area B"),
    yoy_b: float = Query(6.0, description="YoY growth % for area B"),
    budget_inr: Optional[float] = Query(None, description="Budget in INR (for ROI comparison)"),
    budget_aed: Optional[float] = Query(None, description="Budget in AED (for ROI comparison)"),
):
    """
    Side-by-side ROI comparison between an India area and a UAE area.
    Returns normalized scores, sentiment, and yield estimates.
    """
    # Fetch both in parallel
    import asyncio
    news_a_task = get_market_news(area_a, area_a.replace("-", " ").title(), city_a, "India")
    news_b_task = get_market_news(area_b, area_b.replace("-", " ").title(), city_b, "UAE")
    dld_task = get_area_transactions(area_b.replace("-", " ").title())

    news_a, news_b, dld = await asyncio.gather(news_a_task, news_b_task, dld_task)

    score_a_v2 = compute_phase2_score(
        phase1_score=score_a, phase1_infra_signal=70, phase1_rera_signal=70,
        yoy_growth_pct=yoy_a, sentiment_score=news_a.sentiment_score,
    )
    score_b_v2 = compute_phase2_score(
        phase1_score=score_b, phase1_infra_signal=70, phase1_rera_signal=70,
        yoy_growth_pct=yoy_b, sentiment_score=news_b.sentiment_score,
        price_trend_signal=dld.price_trend_3m,
    )

    # ROI estimate (simplified)
    roi_a = _estimate_roi_inr(score_a_v2.phase2_score, yoy_a, budget_inr)
    roi_b = _estimate_roi_aed(score_b_v2.phase2_score, yoy_b, budget_aed, dld.median_price_aed_sqft)

    return {
        "area_a": {
            "slug": area_a, "city": city_a, "country": "India",
            "phase1_score": score_a, "phase2_score": score_a_v2.phase2_score,
            "sentiment": news_a.sentiment, "sentiment_score": news_a.sentiment_score,
            "yoy_growth_pct": yoy_a,
            "roi_estimate": roi_a,
            "verdict": _quick_verdict(score_a_v2.phase2_score),
        },
        "area_b": {
            "slug": area_b, "city": city_b, "country": "UAE",
            "phase1_score": score_b, "phase2_score": score_b_v2.phase2_score,
            "sentiment": news_b.sentiment, "sentiment_score": news_b.sentiment_score,
            "yoy_growth_pct": yoy_b,
            "median_price_aed_sqft": dld.median_price_aed_sqft,
            "roi_estimate": roi_b,
            "verdict": _quick_verdict(score_b_v2.phase2_score),
        },
        "winner": area_a if score_a_v2.phase2_score >= score_b_v2.phase2_score else area_b,
        "comparison_note": _comparison_note(score_a_v2, score_b_v2, yoy_a, yoy_b),
    }


def _estimate_roi_inr(phase2_score: int, yoy: float, budget_inr: Optional[float]) -> dict:
    projected_5y = round(yoy * (phase2_score / 70), 1)   # adjusted by score quality
    result = {"projected_5yr_appreciation_pct": projected_5y, "currency": "INR"}
    if budget_inr:
        result["projected_value_5yr_inr"] = round(budget_inr * ((1 + projected_5y / 100) ** 5))
    return result


def _estimate_roi_aed(phase2_score: int, yoy: float, budget_aed: Optional[float],
                      median_ppsf: Optional[float]) -> dict:
    projected_5y = round(yoy * (phase2_score / 70), 1)
    result = {
        "projected_5yr_appreciation_pct": projected_5y,
        "currency": "AED",
        "median_price_per_sqft_aed": median_ppsf,
    }
    if budget_aed and median_ppsf:
        sqft = budget_aed / median_ppsf
        result["estimated_sqft_for_budget"] = round(sqft, 1)
        result["projected_value_5yr_aed"] = round(budget_aed * ((1 + projected_5y / 100) ** 5))
    return result


def _quick_verdict(score: int) -> str:
    if score >= 80: return "Strong Buy"
    if score >= 65: return "Buy"
    if score >= 50: return "Hold"
    return "Wait"


def _comparison_note(a, b, yoy_a: float, yoy_b: float) -> str:
    if a.phase2_score > b.phase2_score + 10:
        return f"India market shows stronger fundamentals (+{a.phase2_score - b.phase2_score} pts). Higher growth trajectory."
    if b.phase2_score > a.phase2_score + 10:
        return f"UAE market scores higher (+{b.phase2_score - a.phase2_score} pts). Better transaction transparency via DLD."
    return "Both markets are competitive. India offers higher growth upside; UAE offers better liquidity and DLD-verified data."
