"""
News aggregation service — fetches India real estate RSS feeds,
deduplicates, and caches results per city with a 6-hour TTL.

Pattern inspired by WorldMonitor's listFeedDigest with circuit breakers.
"""
import asyncio
import hashlib
import time
import logging
from dataclasses import dataclass, field
from typing import Optional
import feedparser
import httpx

logger = logging.getLogger(__name__)

# ── Data types ────────────────────────────────────────────────────────────────

@dataclass
class NewsItem:
    id: str
    title: str
    url: str
    source: str
    published_at: str          # ISO string or raw from feed
    summary: str
    city_slugs: list[str]      # populated by entity_router
    area_slugs: list[str]      # populated by entity_router
    credibility: int           # 1=wire/official, 2=major, 3=specialist, 4=aggregator


@dataclass
class FeedConfig:
    name: str
    url: str
    cities: list[str]          # which city slugs this feed covers; [] = all India
    credibility: int = 2


@dataclass
class CircuitBreaker:
    failures: int = 0
    open_until: float = 0.0   # epoch seconds

    def is_open(self) -> bool:
        return time.time() < self.open_until

    def record_failure(self):
        self.failures += 1
        if self.failures >= 3:
            self.open_until = time.time() + 1800   # back off 30 min

    def record_success(self):
        self.failures = 0
        self.open_until = 0.0


# ── Feed registry ─────────────────────────────────────────────────────────────

FEEDS: list[FeedConfig] = [
    # Pan-India real estate
    FeedConfig("ET Realty",          "https://realty.economictimes.indiatimes.com/rss/topstories",               [], 1),
    FeedConfig("Moneycontrol RE",    "https://www.moneycontrol.com/rss/realestate.xml",                          [], 2),
    FeedConfig("NDTV Property",      "https://www.ndtvprofit.com/rss/real-estate",                               [], 2),
    FeedConfig("Business Standard",  "https://www.business-standard.com/rss/economy-policy-10101.rss",           [], 2),
    FeedConfig("Hindu Business Line","https://www.thehindubusinessline.com/economy/feeder/default.rss",          [], 2),
    FeedConfig("Financial Express",  "https://www.financialexpress.com/section/economy/feed/",                   [], 2),
    FeedConfig("LiveMint",           "https://www.livemint.com/rss/industry",                                    [], 2),
    FeedConfig("99acres Blog",       "https://www.99acres.com/articles/feed",                                    [], 3),
    FeedConfig("MagicBricks News",   "https://www.magicbricks.com/blog/feed",                                    [], 3),
    FeedConfig("Housing.com Blog",   "https://housing.com/news/feed/",                                           [], 3),
    # Hyderabad / Telangana
    FeedConfig("Telangana Today",    "https://telanganatoday.com/feed",                          ["hyderabad"],  2),
    FeedConfig("Hans India",         "https://www.thehansindia.com/feeds/news.rss",              ["hyderabad"],  3),
    FeedConfig("Deccan Chronicle HYD","https://www.deccanchronicle.com/rss_feed/topnews.xml",   ["hyderabad"],  2),
    # Bangalore / Karnataka
    FeedConfig("Deccan Herald",      "https://www.deccanherald.com/rss-feed/story",              ["bangalore"],  2),
    FeedConfig("Bangalore Mirror",   "https://bangaloremirror.indiatimes.com/rss/topstories",   ["bangalore"],  3),
    # Mumbai / Maharashtra
    FeedConfig("Mumbai Mirror",      "https://mumbaimirror.indiatimes.com/rss/topstories",      ["mumbai"],     3),
    FeedConfig("Mid-Day",            "https://www.mid-day.com/rss/business",                    ["mumbai"],     3),
    # Chennai / Tamil Nadu
    FeedConfig("New Indian Express", "https://www.newindianexpress.com/rss/feeds/topnews.xml",  ["chennai"],    2),
    # Delhi NCR
    FeedConfig("Hindustan Times",    "https://www.hindustantimes.com/feeds/rss/real-estate/rssfeed.xml", ["delhi"], 2),
]


# ── Cache ─────────────────────────────────────────────────────────────────────

_cache: dict[str, tuple[list[NewsItem], float]] = {}   # key → (items, expires_at)
_breakers: dict[str, CircuitBreaker] = {}
_seen_hashes: set[str] = set()                          # global dedup across all fetches

CACHE_TTL = 6 * 3600   # 6 hours


def _cache_key(city_slug: str) -> str:
    return f"news:{city_slug}"


def _get_cached(city_slug: str) -> Optional[list[NewsItem]]:
    entry = _cache.get(_cache_key(city_slug))
    if entry and time.time() < entry[1]:
        return entry[0]
    return None


def _set_cached(city_slug: str, items: list[NewsItem]):
    _cache[_cache_key(city_slug)] = (items, time.time() + CACHE_TTL)


# ── Fetch helpers ─────────────────────────────────────────────────────────────

def _title_hash(title: str) -> str:
    return hashlib.md5(title.lower().strip()[:80].encode()).hexdigest()


def _parse_feed(raw: str, cfg: FeedConfig) -> list[NewsItem]:
    parsed = feedparser.parse(raw)
    items: list[NewsItem] = []
    for entry in parsed.entries[:20]:   # max 20 per feed
        title   = getattr(entry, "title",   "").strip()
        url     = getattr(entry, "link",    "")
        summary = getattr(entry, "summary", "")[:400]
        pub     = getattr(entry, "published", "") or getattr(entry, "updated", "")
        if not title or not url:
            continue
        h = _title_hash(title)
        if h in _seen_hashes:
            continue
        _seen_hashes.add(h)
        items.append(NewsItem(
            id=h,
            title=title,
            url=url,
            source=cfg.name,
            published_at=pub,
            summary=summary,
            city_slugs=list(cfg.cities),
            area_slugs=[],
            credibility=cfg.credibility,
        ))
    return items


async def _fetch_one(client: httpx.AsyncClient, cfg: FeedConfig) -> list[NewsItem]:
    breaker = _breakers.setdefault(cfg.name, CircuitBreaker())
    if breaker.is_open():
        logger.debug("Circuit open, skipping %s", cfg.name)
        return []
    try:
        resp = await client.get(cfg.url, timeout=8)
        resp.raise_for_status()
        items = _parse_feed(resp.text, cfg)
        breaker.record_success()
        return items
    except Exception as exc:
        logger.warning("Feed %s failed: %s", cfg.name, exc)
        breaker.record_failure()
        return []


# ── Public API ────────────────────────────────────────────────────────────────

async def fetch_news_for_city(city_slug: str) -> list[NewsItem]:
    """Return cached news items relevant to city_slug, refreshing if stale."""
    cached = _get_cached(city_slug)
    if cached is not None:
        return cached

    relevant_feeds = [f for f in FEEDS if not f.cities or city_slug in f.cities]

    async with httpx.AsyncClient(headers={"User-Agent": "PlotDNA/1.0 news-aggregator"}) as client:
        results = await asyncio.gather(*[_fetch_one(client, cfg) for cfg in relevant_feeds])

    items: list[NewsItem] = []
    for batch in results:
        items.extend(batch)

    # Sort: official first, then by credibility
    items.sort(key=lambda x: x.credibility)

    _set_cached(city_slug, items)
    logger.info("Fetched %d news items for %s", len(items), city_slug)
    return items


async def fetch_news_for_area(city_slug: str, area_slug: str) -> list[NewsItem]:
    """Return news items routed to a specific area."""
    from app.services.entity_router import route_items
    all_items = await fetch_news_for_city(city_slug)
    routed = route_items(all_items)
    return [i for i in routed if area_slug in i.area_slugs or city_slug in i.city_slugs]


def invalidate_cache(city_slug: str | None = None):
    """Force refresh — called if manual refresh triggered."""
    if city_slug:
        _cache.pop(_cache_key(city_slug), None)
    else:
        _cache.clear()
        _seen_hashes.clear()
