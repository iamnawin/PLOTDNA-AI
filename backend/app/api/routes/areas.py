from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_areas(city: str = "hyderabad"):
    """List all micro-markets for a city."""
    return {"city": city, "areas": []}


@router.get("/{area_slug}")
def get_area(area_slug: str):
    """Get details for a specific micro-market."""
    return {"slug": area_slug, "data": {}}
