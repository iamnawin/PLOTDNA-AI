"""
India-specific routes: land verification, RERA lookup, spatial accuracy.
Prefix: /api/india
"""
from fastapi import APIRouter, Query
from app.services.api_setu_client import get_rera_project, verify_land_record, get_nip_projects_near
from app.services.spatial_verifier import verify_spatial

router = APIRouter()


@router.get("/rera/{state}/{rera_number}", summary="Verify RERA registration")
async def rera_lookup(state: str, rera_number: str):
    project = await get_rera_project(rera_number, state)
    if not project:
        return {"error": f"RERA {rera_number} not found in {state}"}
    from dataclasses import asdict
    return asdict(project)


@router.get("/land-record/{state}/{district}/{survey_number}", summary="Verify land record")
async def land_record(state: str, district: str, survey_number: str, village: str = ""):
    record = await verify_land_record(survey_number, state, district, village)
    if not record:
        return {"error": f"Land record not found for survey {survey_number}"}
    from dataclasses import asdict
    return asdict(record)


@router.get("/spatial", summary="Spatial verification: land use, connectivity, legal risk")
async def spatial_verify(
    lat: float = Query(..., description="Latitude (WGS84)"),
    lng: float = Query(..., description="Longitude (WGS84)"),
):
    report = await verify_spatial(lat, lng, country="India")
    return report.to_dict()


@router.get("/infra-pipeline", summary="National Infrastructure Pipeline projects near a coordinate")
async def infra_pipeline(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(10.0, ge=1.0, le=50.0),
    sector: str = Query("", description="Filter by sector: Roads, Metro, Airports, Railways"),
):
    projects = await get_nip_projects_near(lat, lng, radius_km, sector)
    from dataclasses import asdict
    return {"count": len(projects), "projects": [asdict(p) for p in projects]}
