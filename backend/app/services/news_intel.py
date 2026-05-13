"""
News Intelligence Service — Market Sentiment from NewsAPI.org
Fetches, summarizes, and scores micro-market news for India and UAE areas.

API: newsapi.org/v2/everything (100 req/day free)
Cache: 6h in-memory per area slug
"""
import time
import json
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)

CACHE_TTL = 6 * 3600   # 6 hours


# ── Data models ────────────────────────────────────────────────────────────────

@dataclass
class NewsArticle:
    title: str
    url: str
    source: str
    published_at: str
    summary: str = ""
    relevance_score: float = 0.5    # 0–1


@dataclass
class MarketNewsResult:
    area_slug: str
    city: str
    country: str
    articles: list[NewsArticle] = field(default_factory=list)
    sentiment: str = "neutral"          # "positive" | "neutral" | "negative"
    sentiment_score: int = 50           # 0–100 (50 = neutral)
    sentiment_reason: str = ""
    total_found: int = 0
    last_updated: str = ""
    error: Optional[str] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["articles"] = [asdict(a) for a in self.articles]
        return d


# ── Cache ──────────────────────────────────────────────────────────────────────

_cache: dict[str, tuple[MarketNewsResult, float]] = {}


def _get_cached(area_slug: str) -> Optional[MarketNewsResult]:
    entry = _cache.get(area_slug)
    if entry and time.time() < entry[1]:
        return entry[0]
    return None


def _set_cached(area_slug: str, result: MarketNewsResult):
    _cache[area_slug] = (result, time.time() + CACHE_TTL)


# ── NewsAPI fetcher ────────────────────────────────────────────────────────────

_NEWSAPI_URL = "https://newsapi.org/v2/everything"

# India-specific real estate keywords to boost relevance
_INDIA_RE_TERMS = "real estate OR property OR RERA OR infrastructure OR metro OR land"
_UAE_RE_TERMS = "real estate OR property OR DLD OR developer OR villa OR apartment"


def _build_query(area_name: str, city: str, country: str) -> str:
    base_terms = _INDIA_RE_TERMS if country == "India" else _UAE_RE_TERMS
    return f'"{area_name}" AND ({base_terms})'


def _days_ago(n: int) -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=n)
    return dt.strftime("%Y-%m-%d")


async def _fetch_newsapi(area_name: str, city: str, country: str) -> list[dict]:
    if not settings.NEWS_API_KEY:
        return []

    query = _build_query(area_name, city, country)
    params = {
        "q": query,
        "from": _days_ago(30),
        "sortBy": "relevancy",
        "language": "en",
        "pageSize": 15,
        "apiKey": settings.NEWS_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(_NEWSAPI_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
        return data.get("articles", [])
    except Exception as exc:
        logger.error("NewsAPI fetch failed for %s: %s", area_name, exc)
        return []


def _parse_articles(raw_articles: list[dict], area_name: str) -> list[NewsArticle]:
    articles = []
    for a in raw_articles[:10]:
        title = a.get("title", "")
        if not title or title == "[Removed]":
            continue
        # Simple relevance: does the area name appear in title or description?
        desc = a.get("description", "") or ""
        content = (title + " " + desc).lower()
        relevance = 0.9 if area_name.lower() in content else 0.6

        articles.append(NewsArticle(
            title=title,
            url=a.get("url", ""),
            source=a.get("source", {}).get("name", "Unknown"),
            published_at=(a.get("publishedAt") or "")[:10],
            summary=desc[:200],
            relevance_score=relevance,
        ))

    # Sort by relevance descending
    articles.sort(key=lambda x: x.relevance_score, reverse=True)
    return articles[:7]


# ── Gemini sentiment scorer ────────────────────────────────────────────────────

def _build_sentiment_prompt(area_name: str, city: str, articles: list[NewsArticle]) -> str:
    headlines = "\n".join(
        f"- [{a.published_at}] {a.title} ({a.source})" for a in articles
    )
    return f"""You are a real estate market analyst for India/UAE.

Based on these news headlines about {area_name}, {city}, rate the CURRENT MARKET SENTIMENT:

HEADLINES:
{headlines}

Respond ONLY with valid JSON (no markdown):
{{
  "sentiment": "<positive|neutral|negative>",
  "score": <integer 0-100>,
  "reason": "<1 sentence explaining the sentiment based on specific news>"
}}

Rules:
- score 70-100 = positive (good news: infra, price rises, new projects)
- score 40-69 = neutral (mixed signals)
- score 0-39 = negative (oversupply, delays, legal issues, price drops)
- Be specific to the headlines, not generic"""


def _call_gemini_sentiment(prompt: str) -> dict:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.2,
            max_output_tokens=200,
            response_mime_type="application/json",
        ),
    )
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def _score_to_sentiment(score: int) -> str:
    if score >= 70:
        return "positive"
    if score >= 40:
        return "neutral"
    return "negative"


# ── Public API ─────────────────────────────────────────────────────────────────

async def get_market_news(
    area_slug: str,
    area_name: str,
    city: str,
    country: str = "India",
) -> MarketNewsResult:
    """
    Fetch and score micro-market news for an area.

    Args:
        area_slug: Area identifier slug (e.g. "kokapet")
        area_name: Human-readable area name (e.g. "Kokapet")
        city: City name (e.g. "Hyderabad")
        country: "India" or "UAE"

    Returns:
        MarketNewsResult with articles + Gemini sentiment score
    """
    cached = _get_cached(area_slug)
    if cached:
        logger.debug("News cache hit: %s", area_slug)
        return cached

    now_iso = datetime.now(timezone.utc).isoformat()

    if not settings.NEWS_API_KEY:
        logger.warning("NEWS_API_KEY not set — returning empty news result")
        result = MarketNewsResult(
            area_slug=area_slug, city=city, country=country,
            last_updated=now_iso,
            error="NEWS_API_KEY not configured",
        )
        _set_cached(area_slug, result)
        return result

    # Fetch articles from NewsAPI
    raw_articles = await _fetch_newsapi(area_name, city, country)
    articles = _parse_articles(raw_articles, area_name)

    result = MarketNewsResult(
        area_slug=area_slug,
        city=city,
        country=country,
        articles=articles,
        total_found=len(raw_articles),
        last_updated=now_iso,
    )

    # Score sentiment with Gemini if we have articles + API key
    if articles and settings.GEMINI_API_KEY:
        try:
            prompt = _build_sentiment_prompt(area_name, city, articles)
            sentiment_data = _call_gemini_sentiment(prompt)
            score = int(sentiment_data.get("score", 50))
            result.sentiment_score = max(0, min(100, score))
            result.sentiment = sentiment_data.get("sentiment", _score_to_sentiment(score))
            result.sentiment_reason = sentiment_data.get("reason", "")
        except Exception as exc:
            logger.error("Gemini sentiment scoring failed for %s: %s", area_slug, exc)
            # Fallback: keyword-based sentiment
            result.sentiment_score = _keyword_sentiment(articles)
            result.sentiment = _score_to_sentiment(result.sentiment_score)
    elif articles:
        result.sentiment_score = _keyword_sentiment(articles)
        result.sentiment = _score_to_sentiment(result.sentiment_score)

    _set_cached(area_slug, result)
    logger.info(
        "News intel: %s → %d articles, sentiment=%s (%d)",
        area_slug, len(articles), result.sentiment, result.sentiment_score
    )
    return result


def _keyword_sentiment(articles: list[NewsArticle]) -> int:
    """Simple keyword-based sentiment scoring (fallback when Gemini unavailable)."""
    positive_words = {
        "approved", "launched", "connected", "growth", "investment", "metro",
        "highway", "airport", "appreciation", "demand", "sold", "record",
        "infrastructure", "smart city", "development",
    }
    negative_words = {
        "delayed", "cancelled", "fraud", "scam", "illegal", "encroachment",
        "flooded", "demolition", "court", "case", "complaint", "overpriced",
        "oversupply", "unsold",
    }

    pos, neg = 0, 0
    for article in articles:
        text = (article.title + " " + article.summary).lower()
        pos += sum(1 for w in positive_words if w in text)
        neg += sum(1 for w in negative_words if w in text)

    if pos + neg == 0:
        return 50
    score = int((pos / (pos + neg)) * 100)
    return max(0, min(100, score))
