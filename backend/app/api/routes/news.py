from fastapi import APIRouter, HTTPException
from app.services.news_aggregator import fetch_news_for_city, fetch_news_for_area, invalidate_cache
from app.services.entity_router import route_items

router = APIRouter()


@router.get("/{city_slug}")
async def get_city_news(city_slug: str, limit: int = 20):
    """Aggregated news for a city — latest India RE + city-specific feeds."""
    items = await fetch_news_for_city(city_slug)
    items = route_items(items)
    return {
        "city": city_slug,
        "count": len(items[:limit]),
        "items": [
            {
                "id":           i.id,
                "title":        i.title,
                "url":          i.url,
                "source":       i.source,
                "published_at": i.published_at,
                "summary":      i.summary,
                "city_slugs":   i.city_slugs,
                "area_slugs":   i.area_slugs,
                "credibility":  i.credibility,
            }
            for i in items[:limit]
        ],
    }


@router.get("/{city_slug}/{area_slug}")
async def get_area_news(city_slug: str, area_slug: str, limit: int = 10):
    """News filtered to a specific area."""
    items = await fetch_news_for_area(city_slug, area_slug)
    return {
        "city":  city_slug,
        "area":  area_slug,
        "count": len(items[:limit]),
        "items": [
            {
                "id":           i.id,
                "title":        i.title,
                "url":          i.url,
                "source":       i.source,
                "published_at": i.published_at,
                "summary":      i.summary,
            }
            for i in items[:limit]
        ],
    }


@router.post("/{city_slug}/refresh")
async def refresh_city_news(city_slug: str):
    """Force refresh the news cache for a city."""
    invalidate_cache(city_slug)
    items = await fetch_news_for_city(city_slug)
    route_items(items)
    return {"city": city_slug, "refreshed": True, "count": len(items)}
