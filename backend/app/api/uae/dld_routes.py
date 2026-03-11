"""
UAE-specific routes: DLD transactions, zone lookup, spatial accuracy.
Prefix: /api/uae
"""
from fastapi import APIRouter, Query
from app.services.dld_client import get_area_transactions
from app.services.spatial_verifier import verify_spatial

router = APIRouter()


@router.get("/transactions/{area_name}", summary="DLD real transaction prices")
async def dld_transactions(area_name: str):
    data = await get_area_transactions(area_name)
    return data.to_dict()


@router.get("/spatial", summary="Spatial verification for UAE coordinates")
async def spatial_verify_uae(
    lat: float = Query(..., description="Latitude (WGS84)"),
    lng: float = Query(..., description="Longitude (WGS84)"),
):
    """Returns land use, connectivity score, and zoning from OSM for UAE plots."""
    report = await verify_spatial(lat, lng, country="UAE")
    return report.to_dict()


@router.get("/zones", summary="List major Dubai investment zones")
def uae_zones():
    """Static reference: major Dubai zones with investment profiles."""
    return {
        "zones": [
            {"name": "Business Bay",         "type": "Commercial/Residential", "rental_yield_pct": 6.5},
            {"name": "Downtown Dubai",        "type": "Premium Residential",    "rental_yield_pct": 5.2},
            {"name": "Dubai Marina",          "type": "Luxury Residential",     "rental_yield_pct": 6.1},
            {"name": "Jumeirah Village Circle","type": "Affordable Residential", "rental_yield_pct": 7.8},
            {"name": "Dubai Hills Estate",    "type": "Villa Community",        "rental_yield_pct": 5.8},
            {"name": "Dubai Maritime City",   "type": "Emerging Waterfront",    "rental_yield_pct": 7.2},
            {"name": "Al Furjan",             "type": "Mid-Market Residential", "rental_yield_pct": 7.0},
            {"name": "Palm Jumeirah",         "type": "Ultra Luxury",           "rental_yield_pct": 4.5},
            {"name": "Dubai Silicon Oasis",   "type": "Tech/Residential",       "rental_yield_pct": 7.5},
            {"name": "Arjan",                 "type": "Emerging Residential",   "rental_yield_pct": 8.1},
        ]
    }
