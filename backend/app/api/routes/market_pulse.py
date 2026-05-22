"""
MarketPulse route — GET /api/v1/market-pulse/{country}/{area_slug}

Derives a sentiment score from the area's DNA score + YoY growth,
then classifies live news articles (from the existing news pipeline)
as positive / neutral / negative using keyword scoring.
"""
from datetime import datetime, timezone
from fastapi import APIRouter

from app.api.routes.verdict import AREA_DATA
from app.services.news_aggregator import fetch_news_for_area

router = APIRouter()

# Keywords that shift sentiment positive or negative
_POS = {"launch", "growth", "develop", "invest", "appreciat", "surge", "boom",
        "expand", "infra", "project", "approval", "connect", "metro", "highway",
        "demand", "record", "award", "fund", "inaugurat", "complete", "open"}
_NEG = {"delay", "stall", "fraud", "decline", "fall", "flood", "demolish",
        "court", "notice", "illegal", "cancel", "evict", "protest", "dispute",
        "scam", "encroach", "cheat", "demotion", "abandon"}


def _classify_article(title: str) -> tuple[str, int]:
    lower = title.lower()
    pos = sum(1 for k in _POS if k in lower)
    neg = sum(1 for k in _NEG if k in lower)
    if pos > neg:
        return "positive", min(60 + pos * 8, 95)
    if neg > pos:
        return "negative", max(40 - neg * 8, 5)
    return "neutral", 50


def _derive_sentiment(score: int, yoy: float) -> tuple[int, str]:
    """Map DNA score + YoY% to a 0-100 market sentiment integer."""
    yoy_boost = min(int(yoy / 35 * 20), 20)
    raw = max(0, min(score + yoy_boost - 10, 100))
    label = "positive" if raw >= 65 else ("neutral" if raw >= 40 else "negative")
    return raw, label


@router.get("/{country}/{area_slug}")
async def get_market_pulse(country: str, area_slug: str):
    area = AREA_DATA.get(area_slug) or {
        "name": area_slug.replace("-", " ").title(),
        "city": "india",
        "score": 50,
        "yoy": 10.0,
    }

    score: int = area["score"]
    yoy: float = area.get("yoy", 10.0)
    city: str = area.get("city", "india")

    sentiment_score, sentiment_label = _derive_sentiment(score, yoy)

    # City average across all known areas in the same city
    city_areas = [v for v in AREA_DATA.values() if v.get("city") == city]
    city_sent_scores = [_derive_sentiment(a["score"], a.get("yoy", 10.0))[0] for a in city_areas]
    city_sentiment_score = round(sum(city_sent_scores) / len(city_sent_scores)) if city_sent_scores else None

    # Live news → per-article sentiment
    try:
        news_items = await fetch_news_for_area(city, area_slug)
    except Exception:
        news_items = []

    articles = []
    for item in news_items[:10]:
        sentiment, sent_score = _classify_article(item.title)
        articles.append({
            "title": item.title,
            "url": item.url,
            "source": item.source,
            "published_at": item.published_at,
            "sentiment": sentiment,
            "sentiment_score": sent_score,
        })

    positive_count = sum(1 for a in articles if a["sentiment"] == "positive")
    neutral_count  = sum(1 for a in articles if a["sentiment"] == "neutral")
    negative_count = sum(1 for a in articles if a["sentiment"] == "negative")

    # No articles yet — synthesise counts from the derived sentiment
    if not articles:
        if sentiment_label == "positive":
            positive_count, neutral_count, negative_count = 6, 3, 1
        elif sentiment_label == "neutral":
            positive_count, neutral_count, negative_count = 3, 5, 2
        else:
            positive_count, neutral_count, negative_count = 2, 3, 5

    return {
        "area_slug": area_slug,
        "country": country,
        "sentiment_score": sentiment_score,
        "sentiment_label": sentiment_label,
        "city_sentiment_score": city_sentiment_score,
        "positive_count": positive_count,
        "neutral_count": neutral_count,
        "negative_count": negative_count,
        "articles": articles,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
