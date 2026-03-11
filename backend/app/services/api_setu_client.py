"""
API Setu Client — India's government API platform
Source: api.setu.in (National Data & Analytics Platform)

Covers:
- State RERA project lookups (machine-readable)
- Land record verification (Bhoomi/Meebhoomi/Dharani state APIs)
- National Infrastructure Pipeline project status

Free tier: 1000 req/day for government data
Production: Apply at https://api.setu.in
"""
import time
import logging
from dataclasses import dataclass, field, asdict
from typing import Optional

import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.setu.in/api/v1"
CACHE_TTL = 6 * 3600   # 6 hours


# ── Data models ────────────────────────────────────────────────────────────────

@dataclass
class RERAProject:
    rera_number: str
    project_name: str
    developer: str
    state: str
    city: str
    status: str             # "Registered" | "Expired" | "Revoked" | "Lapsed"
    registration_date: str
    completion_date: str
    total_units: int
    sold_units: int
    carpet_area_sqft: Optional[float]
    complaints_count: int = 0
    litigation_flag: bool = False


@dataclass
class LandRecord:
    survey_number: str
    state: str
    district: str
    taluk: str
    village: str
    owner_name: str
    land_use: str           # "Residential" | "Agricultural" | "Commercial" | "Industrial"
    area_acres: float
    encumbrance: bool       # True = mortgage/lien exists
    litigation: bool        # True = court case on record
    source: str             # "Dharani" | "Bhoomi" | "Meebhoomi" | "MahaBhulekh"


@dataclass
class NIProject:
    """National Infrastructure Pipeline project."""
    project_id: str
    name: str
    sector: str             # "Roads" | "Metro" | "Airports" | "Smart City" | "Railways"
    state: str
    district: str
    status: str             # "Under Construction" | "Completed" | "Tendered" | "Planned"
    cost_crore: float
    completion_year: Optional[int]
    lat: Optional[float]
    lng: Optional[float]


# ── Cache ──────────────────────────────────────────────────────────────────────

_cache: dict[str, tuple] = {}

def _get_cached(key: str):
    entry = _cache.get(key)
    if entry and time.time() < entry[1]:
        return entry[0]
    return None

def _set_cached(key: str, value, ttl: int = CACHE_TTL):
    _cache[key] = (value, time.time() + ttl)


# ── API Setu caller ────────────────────────────────────────────────────────────

def _headers() -> dict:
    return {
        "x-client-id": settings.API_SETU_KEY,
        "x-client-secret": "",  # set via env if required
        "Content-Type": "application/json",
    }


async def _get(path: str, params: dict = None) -> dict:
    if not settings.API_SETU_KEY:
        return {}
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{_BASE_URL}{path}", headers=_headers(), params=params)
        resp.raise_for_status()
        return resp.json()


# ── RERA lookups ───────────────────────────────────────────────────────────────

async def get_rera_project(rera_number: str, state: str) -> Optional[RERAProject]:
    """
    Verify a RERA registration number and fetch project details.
    Supports: Telangana (TSRERA), Karnataka (K-RERA), Maharashtra (MahaRERA),
              Tamil Nadu, Delhi, Pune, Gujarat via API Setu unified RERA endpoint.
    """
    cache_key = f"rera:{state}:{rera_number}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    if not settings.API_SETU_KEY:
        logger.warning("API_SETU_KEY not set — cannot verify RERA %s", rera_number)
        return _mock_rera(rera_number, state)

    try:
        data = await _get("/rera/project", {"state": state, "registrationNo": rera_number})
        project = data.get("project", {})
        if not project:
            return None

        result = RERAProject(
            rera_number=rera_number,
            project_name=project.get("projectName", ""),
            developer=project.get("promoterName", ""),
            state=state,
            city=project.get("district", ""),
            status=project.get("status", "Unknown"),
            registration_date=project.get("registrationDate", ""),
            completion_date=project.get("proposedCompletionDate", ""),
            total_units=int(project.get("totalUnits", 0)),
            sold_units=int(project.get("bookedUnits", 0)),
            carpet_area_sqft=project.get("carpetAreaSqft"),
            complaints_count=int(project.get("complaintCount", 0)),
            litigation_flag=project.get("litigationFlag", False),
        )
        _set_cached(cache_key, result)
        return result

    except Exception as exc:
        logger.error("RERA lookup failed for %s: %s", rera_number, exc)
        return None


async def get_rera_projects_by_area(city: str, area_name: str, state: str) -> list[RERAProject]:
    """List RERA-registered projects in a micro-market."""
    cache_key = f"rera_area:{state}:{city}:{area_name}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    if not settings.API_SETU_KEY:
        return []

    try:
        data = await _get("/rera/projects", {
            "state": state, "city": city, "locality": area_name, "limit": 20
        })
        projects = []
        for p in data.get("projects", []):
            projects.append(RERAProject(
                rera_number=p.get("registrationNo", ""),
                project_name=p.get("projectName", ""),
                developer=p.get("promoterName", ""),
                state=state, city=city,
                status=p.get("status", "Unknown"),
                registration_date=p.get("registrationDate", ""),
                completion_date=p.get("proposedCompletionDate", ""),
                total_units=int(p.get("totalUnits", 0)),
                sold_units=int(p.get("bookedUnits", 0)),
                carpet_area_sqft=p.get("carpetAreaSqft"),
                complaints_count=int(p.get("complaintCount", 0)),
            ))
        _set_cached(cache_key, projects)
        return projects
    except Exception as exc:
        logger.error("RERA area lookup failed for %s %s: %s", city, area_name, exc)
        return []


# ── Land records ───────────────────────────────────────────────────────────────

async def verify_land_record(
    survey_number: str,
    state: str,
    district: str,
    village: str = "",
) -> Optional[LandRecord]:
    """
    Verify land record via state land registry API (via API Setu).
    Supported states: Telangana (Dharani), Karnataka (Bhoomi), AP (Meebhoomi),
                      Maharashtra (MahaBhulekh).
    """
    cache_key = f"land:{state}:{district}:{survey_number}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    if not settings.API_SETU_KEY:
        return None

    try:
        data = await _get("/land-records/survey", {
            "state": state,
            "district": district,
            "surveyNumber": survey_number,
            "village": village,
        })
        rec = data.get("record", {})
        if not rec:
            return None

        result = LandRecord(
            survey_number=survey_number,
            state=state,
            district=district,
            taluk=rec.get("taluk", ""),
            village=rec.get("village", village),
            owner_name=rec.get("ownerName", "Unknown"),
            land_use=rec.get("landUse", "Unknown"),
            area_acres=float(rec.get("areaAcres", 0)),
            encumbrance=rec.get("encumbranceExists", False),
            litigation=rec.get("litigationExists", False),
            source=rec.get("source", state),
        )
        _set_cached(cache_key, result)
        return result

    except Exception as exc:
        logger.error("Land record lookup failed for %s/%s: %s", state, survey_number, exc)
        return None


# ── National Infrastructure Pipeline ──────────────────────────────────────────

async def get_nip_projects_near(
    lat: float,
    lng: float,
    radius_km: float = 10.0,
    sector: str = "",
) -> list[NIProject]:
    """
    Fetch upcoming National Infrastructure Pipeline projects near a coordinate.
    Source: India Investment Grid (IIG) via API Setu.
    """
    cache_key = f"nip:{lat:.3f}:{lng:.3f}:{radius_km}:{sector}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    if not settings.API_SETU_KEY:
        return _mock_nip_projects(lat, lng)

    try:
        params = {"lat": lat, "lng": lng, "radiusKm": radius_km}
        if sector:
            params["sector"] = sector
        data = await _get("/infrastructure/nearby", params)

        projects = []
        for p in data.get("projects", [])[:15]:
            projects.append(NIProject(
                project_id=p.get("id", ""),
                name=p.get("projectName", ""),
                sector=p.get("sector", ""),
                state=p.get("state", ""),
                district=p.get("district", ""),
                status=p.get("status", "Unknown"),
                cost_crore=float(p.get("costCrore", 0)),
                completion_year=p.get("completionYear"),
                lat=p.get("latitude"),
                lng=p.get("longitude"),
            ))
        _set_cached(cache_key, projects)
        return projects

    except Exception as exc:
        logger.error("NIP project lookup failed: %s", exc)
        return []


# ── Mocks (dev mode, no API key) ──────────────────────────────────────────────

def _mock_rera(rera_number: str, state: str) -> RERAProject:
    return RERAProject(
        rera_number=rera_number,
        project_name="Demo Project (mock)",
        developer="Demo Developer",
        state=state, city="Demo City",
        status="Registered",
        registration_date="2024-01-01",
        completion_date="2027-12-31",
        total_units=200, sold_units=120,
        carpet_area_sqft=1200,
        complaints_count=0,
        litigation_flag=False,
    )


def _mock_nip_projects(lat: float, lng: float) -> list[NIProject]:
    return [
        NIProject(
            project_id="NIP-MOCK-001",
            name="Regional Ring Road Corridor (mock)",
            sector="Roads",
            state="Telangana",
            district="Rangareddy",
            status="Under Construction",
            cost_crore=8500,
            completion_year=2027,
            lat=lat + 0.05,
            lng=lng + 0.03,
        )
    ]
