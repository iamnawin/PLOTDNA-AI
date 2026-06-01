from fastapi import APIRouter, HTTPException

from app.services.market_catalog import get_city_area, load_city_catalog

router = APIRouter()


@router.get("/")
def list_areas(city: str = "hyderabad"):
    """List all backend-owned micro-markets for a supported city."""
    catalog = load_city_catalog(city)
    if catalog is None:
        return {
            "city": {"slug": city, "name": city, "state": "", "center": [], "zoom": 10},
            "areas": [],
        }
    return {
        "city": catalog.city.model_dump(),
        "areas": [area.model_dump() for area in catalog.areas],
    }


@router.get("/{city_slug}/{area_slug}")
def get_area_for_city(city_slug: str, area_slug: str):
    """Get details for a city-scoped micro-market."""
    area = get_city_area(city_slug, area_slug)
    if area is None:
        raise HTTPException(status_code=404, detail="Area not found")
    return area.model_dump()


@router.get("/{area_slug}")
def get_area(area_slug: str, city: str = "hyderabad"):
    """Legacy detail route. Defaults to Hyderabad for backward compatibility."""
    area = get_city_area(city, area_slug)
    if area is None:
        raise HTTPException(status_code=404, detail="Area not found")
    return area.model_dump()
