from fastapi import APIRouter

router = APIRouter()


@router.get("/timelapse/{area_slug}")
def get_timelapse(area_slug: str):
    """Get satellite timelapse data for an area via GEE."""
    return {"area": area_slug, "timelapse_url": None, "years": []}


@router.get("/ndvi/{area_slug}")
def get_ndvi(area_slug: str):
    """Get NDVI (vegetation) change data — proxy for construction activity."""
    return {"area": area_slug, "ndvi_delta": None}
