from functools import lru_cache
import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field


Category = Literal["Established", "High Growth", "Emerging", "Industrial"]
DataConfidence = Literal["verified", "partial", "estimated", "uncovered"]
ProjectType = Literal[
    "metro",
    "highway",
    "flyover",
    "it_park",
    "residential",
    "commercial",
    "hospital",
    "airport",
    "industrial",
    "infrastructure",
]
ProjectStatus = Literal["planning", "approved", "under_construction", "near_completion"]
Impact = Literal["high", "medium", "low"]


class Signals(BaseModel):
    infrastructure: int | None
    population: int | None
    satellite: int | None
    rera: int | None
    employment: int | None
    priceVelocity: int | None
    govtScheme: int | None


class Livability(BaseModel):
    connectivity: int
    amenities: int
    ecommerce: int
    entertainment: int
    greenSpaces: int


class ActiveProject(BaseModel):
    id: str
    name: str
    type: ProjectType
    status: ProjectStatus
    developer: str | None = None
    investment: str | None = None
    expectedCompletion: str | None = None
    coordinates: list[float] = Field(min_length=2, max_length=2)
    impact: Impact
    description: str | None = None


class CityCatalogMeta(BaseModel):
    slug: str
    name: str
    state: str
    center: list[float] = Field(min_length=2, max_length=2)
    zoom: int


class MarketArea(BaseModel):
    slug: str
    name: str
    score: int
    category: Category
    center: list[float] = Field(min_length=2, max_length=2)
    polygon: list[list[float]]
    signals: Signals
    livability: Livability | None = None
    highlights: list[str]
    priceRange: str
    yoy: int
    activeProjects: list[ActiveProject] = Field(default_factory=list)
    dataConfidence: DataConfidence | None = None
    dataAsOf: str | None = None
    signalsAvailable: int | None = None


class CityCatalog(BaseModel):
    city: CityCatalogMeta
    areas: list[MarketArea]


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _catalog_path(city_slug: str) -> Path:
    safe_slug = city_slug.strip().lower()
    return _repo_root() / "data" / "catalog" / f"{safe_slug}.json"


@lru_cache(maxsize=16)
def load_city_catalog(city_slug: str) -> CityCatalog | None:
    path = _catalog_path(city_slug)
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return CityCatalog.model_validate(payload)


def list_city_areas(city_slug: str) -> list[MarketArea]:
    catalog = load_city_catalog(city_slug)
    if catalog is None:
        return []
    return catalog.areas


def get_city_area(city_slug: str, area_slug: str) -> MarketArea | None:
    normalized = area_slug.strip().lower()
    for area in list_city_areas(city_slug):
        if area.slug == normalized:
            return area
    return None
