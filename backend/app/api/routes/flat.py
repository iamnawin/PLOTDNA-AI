from datetime import datetime
from functools import lru_cache
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.services.flatdna.database import (
    FlatDnaDatabaseConfigurationError,
    create_flatdna_engine,
)
from app.services.flatdna.models import normalize_identity
from app.services.flatdna.repository import PostgresFlatProjectRepository
from app.services.flatdna.resolver import (
    MAX_QUERY_LENGTH,
    ProjectIdentity,
    ResolverOutcome,
    ResolverResult,
    project_identities_from_rows,
    resolve_project,
)


MAX_AMBIGUOUS_CANDIDATES = 5
SERVICE_UNAVAILABLE_DETAIL = "FlatDNA project search is temporarily unavailable."


class FlatProjectSearchQuery(BaseModel):
    q: str = Field(min_length=1, max_length=MAX_QUERY_LENGTH)
    offset: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=50)

    @field_validator("q", mode="before")
    @classmethod
    def trim_query(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("q")
    @classmethod
    def require_identity_characters(cls, value: str) -> str:
        if not normalize_identity(value):
            raise ValueError("Query must contain letters or digits")
        return value


class FlatProjectIdentity(BaseModel):
    project_id: UUID
    canonical_name: str
    developer_name: str
    city_slug: str
    locality_slug: str
    rera_registration_numbers: list[str]


class FlatReraReference(BaseModel):
    authority_code: str
    registration_number: str
    reference_status: Literal["RECORDED", "VERIFIED", "REVIEW_REQUIRED"]


class FlatProjectSource(BaseModel):
    source_class: Literal[
        "OFFICIAL_PROJECT", "OFFICIAL_REGULATOR", "BUILDER_PUBLISHED", "CURATED_REFERENCE"
    ]
    publisher: str
    title: str | None
    url: str | None
    retrieved_at: datetime


class FlatProjectDetail(FlatProjectIdentity):
    latitude: float | None
    longitude: float | None
    location_precision: Literal["ENTRANCE", "PROJECT_CENTROID", "APPROXIMATE", "UNKNOWN"]
    rera_references: list[FlatReraReference]
    sources: list[FlatProjectSource]


class FlatDnaStatus(BaseModel):
    status: Literal["enabled"] = "enabled"
    phase: Literal["1A"] = "1A"
    registry: Literal["available"] = "available"
    supported_projects: int


class FlatProjectMatchedResponse(BaseModel):
    outcome: Literal["MATCHED"] = "MATCHED"
    project: FlatProjectIdentity
    match_type: Literal["CANONICAL", "ALIAS", "FUZZY", "RERA"]


class FlatProjectResultsResponse(BaseModel):
    outcome: Literal["RESULTS"] = "RESULTS"
    query_type: Literal["BUILDER", "LOCALITY", "PROJECT", "RERA"]
    candidates: list[FlatProjectIdentity]
    total: int
    offset: int
    limit: int


class FlatProjectAmbiguousResponse(BaseModel):
    outcome: Literal["AMBIGUOUS"] = "AMBIGUOUS"
    candidates: list[FlatProjectIdentity]


class FlatProjectNotFoundResponse(BaseModel):
    outcome: Literal["NOT_FOUND"] = "NOT_FOUND"
    code: Literal["PROJECT_NOT_FOUND"] = "PROJECT_NOT_FOUND"


FlatProjectSearchResponse = Annotated[
    FlatProjectMatchedResponse
    | FlatProjectResultsResponse
    | FlatProjectAmbiguousResponse
    | FlatProjectNotFoundResponse,
    Field(discriminator="outcome"),
]


def require_flat_dna_enabled() -> None:
    if not settings.ENABLE_FLAT_DNA:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")


router = APIRouter(dependencies=[Depends(require_flat_dna_enabled)])


@lru_cache(maxsize=1)
def get_flatdna_repository() -> PostgresFlatProjectRepository:
    return PostgresFlatProjectRepository(create_flatdna_engine())


def _project_identity(project: ProjectIdentity) -> FlatProjectIdentity:
    return FlatProjectIdentity(
        project_id=project.project_id,
        canonical_name=project.canonical_name,
        developer_name=project.developer_name,
        city_slug=project.city_slug,
        locality_slug=project.locality_slug,
        rera_registration_numbers=list(project.rera_registration_numbers),
    )


def _results_response(
    projects: list[ProjectIdentity],
    query_type: Literal["BUILDER", "LOCALITY", "PROJECT", "RERA"],
    offset: int,
    limit: int,
) -> FlatProjectResultsResponse:
    return FlatProjectResultsResponse(
        query_type=query_type,
        candidates=[_project_identity(project) for project in projects[offset:offset + limit]],
        total=len(projects),
        offset=offset,
        limit=limit,
    )


def _catalog_response(
    query: FlatProjectSearchQuery,
    projects: tuple[ProjectIdentity, ...],
) -> FlatProjectSearchResponse | None:
    normalized_query = normalize_identity(query.q)

    rera_matches = [
        project
        for project in projects
        if any(
            normalize_identity(registration_number) == normalized_query
            for registration_number in project.rera_registration_numbers
        )
    ]
    if len(rera_matches) == 1:
        return FlatProjectMatchedResponse(
            project=_project_identity(rera_matches[0]),
            match_type="RERA",
        )
    if rera_matches:
        return _results_response(rera_matches, "RERA", query.offset, query.limit)

    builder_matches = [
        project
        for project in projects
        if any(
            f" {normalized_query} " in f" {label} "
            for label in (
                project.developer_normalized_name,
                *project.developer_normalized_aliases,
            )
        )
    ]
    if builder_matches:
        return _results_response(builder_matches, "BUILDER", query.offset, query.limit)

    locality_matches = [
        project
        for project in projects
        if normalize_identity(project.locality_slug.replace("-", " ")) == normalized_query
    ]
    if locality_matches:
        return _results_response(locality_matches, "LOCALITY", query.offset, query.limit)

    project_matches = [
        project
        for project in projects
        if any(
            label == normalized_query or label.startswith(f"{normalized_query} ")
            for label in (
                project.normalized_name,
                *(alias.normalized_alias for alias in project.aliases),
            )
        )
    ]
    if len(project_matches) > 1:
        return _results_response(project_matches, "PROJECT", query.offset, query.limit)
    return None


def _search_response(result: ResolverResult) -> FlatProjectSearchResponse:
    if result.outcome == ResolverOutcome.NOT_FOUND:
        return FlatProjectNotFoundResponse()
    if result.outcome == ResolverOutcome.AMBIGUOUS:
        return FlatProjectAmbiguousResponse(
            candidates=[
                _project_identity(candidate.project)
                for candidate in result.candidates[:MAX_AMBIGUOUS_CANDIDATES]
            ]
        )

    project = result.project
    if project is None:
        raise RuntimeError("MATCHED resolver result has no project")
    selected = next(
        candidate for candidate in result.candidates
        if candidate.project.project_id == project.project_id
    )
    if result.reason == "FUZZY_MATCH":
        match_type = "FUZZY"
    elif selected.match_source == "ALIAS":
        match_type = "ALIAS"
    else:
        match_type = "CANONICAL"
    return FlatProjectMatchedResponse(
        project=_project_identity(project),
        match_type=match_type,
    )


@router.get("/status", response_model=FlatDnaStatus)
def flatdna_status() -> FlatDnaStatus:
    try:
        projects = get_flatdna_repository().list_supported_projects("hyderabad")
    except (FlatDnaDatabaseConfigurationError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=SERVICE_UNAVAILABLE_DETAIL,
        ) from exc
    return FlatDnaStatus(supported_projects=len(projects))


@router.get("/projects/search", response_model=FlatProjectSearchResponse)
def search_flatdna_projects(
    query: Annotated[FlatProjectSearchQuery, Query()],
) -> FlatProjectSearchResponse:
    try:
        repository = get_flatdna_repository()
        rows = repository.list_supported_project_identity_rows("hyderabad")
    except (FlatDnaDatabaseConfigurationError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=SERVICE_UNAVAILABLE_DETAIL,
        ) from exc

    projects = project_identities_from_rows(rows)
    catalog_response = _catalog_response(query, projects)
    if catalog_response is not None:
        return catalog_response
    return _search_response(resolve_project(query.q, projects))


@router.get("/projects/{project_id}", response_model=FlatProjectDetail)
def get_flatdna_project(project_id: UUID) -> FlatProjectDetail:
    try:
        repository = get_flatdna_repository()
        project = repository.get_supported_project(project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        rera_references = repository.list_supported_project_rera_references(project_id)
        sources = repository.list_supported_project_sources(project_id)
    except HTTPException:
        raise
    except (FlatDnaDatabaseConfigurationError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=SERVICE_UNAVAILABLE_DETAIL,
        ) from exc

    return FlatProjectDetail(
        project_id=project["id"],
        canonical_name=project["canonical_name"],
        developer_name=project["developer_name"],
        city_slug=project["city_slug"],
        locality_slug=project["locality_slug"],
        rera_registration_numbers=[
            reference["registration_number"] for reference in rera_references
        ],
        latitude=project["latitude"],
        longitude=project["longitude"],
        location_precision=project["location_precision"],
        rera_references=[FlatReraReference.model_validate(reference) for reference in rera_references],
        sources=[FlatProjectSource.model_validate(source) for source in sources],
    )
