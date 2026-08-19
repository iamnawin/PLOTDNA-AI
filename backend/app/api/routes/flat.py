from datetime import date, datetime
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
from app.services.flatdna.catalog_query import PostgresFlatCatalogRepository
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
MINIMUM_PREFIX_LENGTH = 3
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


class FlatCatalogStatusResponse(BaseModel):
    catalog_snapshot_id: str
    source_as_of: date
    indexed_records: int
    reviewed_projects: int
    served_from_last_known_good: bool = False


class FlatCatalogProjectIdentity(BaseModel):
    project_id: UUID
    registration_id: UUID
    canonical_name: str
    developer_name: str
    authority_code: str
    registration_number: str
    city_slug: str
    locality_slug: str | None
    catalog_layer: Literal[
        "TG_RERA_RECORD", "FLATDNA_REVIEWED", "DETAILS_BEING_VERIFIED", "HISTORICAL_REVIEW"
    ]
    review_status: Literal["REVIEW_REQUIRED", "SUPPORTED", "UNSUPPORTED"]
    identity_status: Literal["RESOLVED", "PARTIALLY_RESOLVED", "UNRESOLVED"]
    project_status: Literal["ACTIVE", "COMPLETED", "WITHDRAWN", "LAPSED", "UNKNOWN"]
    catalog_status: Literal["SEARCHABLE", "QUARANTINED", "HIDDEN"]
    location_precision: Literal["EXACT_PROJECT", "APPROXIMATE_PROJECT", "LOCALITY", "UNKNOWN"]
    location_label: str
    source_as_of: date
    catalog_snapshot_id: str


class FlatCatalogSearchResponse(BaseModel):
    outcome: Literal["RESULTS"] = "RESULTS"
    candidates: list[FlatCatalogProjectIdentity]
    total: int
    offset: int
    limit: int
    query_type: Literal["BUILDER", "LOCALITY", "PROJECT", "RERA"]
    source_as_of: date | None
    catalog_snapshot_id: str | None


class FlatCatalogWarning(BaseModel):
    flag_type: Literal["REVOKED", "DEFAULTER", "LITIGATION_REPORTED", "OTHER_WARNING"]
    warning_origin: Literal["TG_RERA", "FLATDNA_REVIEW", "THIRD_PARTY"]
    warning_status: Literal["ACTIVE", "RESOLVED"]
    origin_label: str
    source_label: str
    source_url: str | None
    source_as_of: date
    observed_at: datetime


class FlatCatalogSource(BaseModel):
    source_class: Literal["OFFICIAL_REGULATOR"] = "OFFICIAL_REGULATOR"
    publisher: str
    title: str = "Registered project record"
    url: str | None
    retrieved_at: datetime


class FlatCatalogReraReference(BaseModel):
    authority_code: str
    registration_number: str
    reference_status: Literal["RECORDED", "VERIFIED"]


class FlatCatalogProjectDetail(FlatCatalogProjectIdentity):
    latitude: float | None
    longitude: float | None
    review_freshness: Literal["NONE", "CURRENT", "HISTORICAL"]
    historical_reviewed_at: datetime | None
    historical_review_valid_until: datetime | None
    rera_reference: FlatCatalogReraReference
    sources: list[FlatCatalogSource]
    warnings: list[FlatCatalogWarning]


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


def require_flatdna_catalog_enabled() -> None:
    if not settings.ENABLE_FLATDNA_CATALOG:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")


router = APIRouter(dependencies=[Depends(require_flat_dna_enabled)])
catalog_router = APIRouter(dependencies=[Depends(require_flatdna_catalog_enabled)])


@lru_cache(maxsize=1)
def get_flatdna_repository() -> PostgresFlatProjectRepository:
    return PostgresFlatProjectRepository(create_flatdna_engine())


@lru_cache(maxsize=1)
def get_flatdna_catalog_repository() -> PostgresFlatCatalogRepository:
    return PostgresFlatCatalogRepository(create_flatdna_engine())


_CATALOG_LOCATION_LABELS = {
    "EXACT_PROJECT": "Exact project location",
    "APPROXIMATE_PROJECT": "Approximate project location",
    "LOCALITY": "Locality-level location",
    "UNKNOWN": "Location being verified",
}


def _catalog_identity(row: dict) -> FlatCatalogProjectIdentity:
    review_status = row["review_status"]
    if review_status == "SUPPORTED":
        catalog_layer = "FLATDNA_REVIEWED"
    elif row["identity_status"] == "PARTIALLY_RESOLVED":
        catalog_layer = "DETAILS_BEING_VERIFIED"
    elif row.get("historical_reviewed_at") is not None:
        catalog_layer = "HISTORICAL_REVIEW"
    else:
        catalog_layer = "TG_RERA_RECORD"
    return FlatCatalogProjectIdentity(
        project_id=row["project_id"],
        registration_id=row["registration_id"],
        canonical_name=row["canonical_name"],
        developer_name=row["developer_name"],
        authority_code=row["authority_code"],
        registration_number=row["registration_number"],
        city_slug=row["city_slug"],
        locality_slug=row["locality_slug"],
        catalog_layer=catalog_layer,
        review_status=review_status,
        identity_status=row["identity_status"],
        project_status=row["project_status"],
        catalog_status=row["catalog_status"],
        location_precision=row["location_precision"],
        location_label=_CATALOG_LOCATION_LABELS[row["location_precision"]],
        source_as_of=row["source_as_of"],
        catalog_snapshot_id=row["snapshot_id"],
    )


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

    if len(normalized_query) >= MINIMUM_PREFIX_LENGTH:
        rera_prefix_matches = [
            project
            for project in projects
            if any(
                normalize_identity(registration_number).startswith(normalized_query)
                for registration_number in project.rera_registration_numbers
            )
        ]
        if rera_prefix_matches:
            return _results_response(rera_prefix_matches, "RERA", query.offset, query.limit)

    builder_matches = [
        project
        for project in projects
        if any(
            f" {normalized_query} " in f" {label} "
            or (
                len(normalized_query) >= MINIMUM_PREFIX_LENGTH
                and (
                    label.startswith(normalized_query)
                    or (
                        " " not in normalized_query
                        and any(word.startswith(normalized_query) for word in label.split())
                    )
                )
            )
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
        or (
            len(normalized_query) >= MINIMUM_PREFIX_LENGTH
            and normalize_identity(project.locality_slug.replace("-", " ")).startswith(
                normalized_query
            )
        )
    ]
    if locality_matches:
        return _results_response(locality_matches, "LOCALITY", query.offset, query.limit)

    project_matches = [
        project
        for project in projects
        if any(
            label == normalized_query
            or (
                len(normalized_query) >= MINIMUM_PREFIX_LENGTH
                and (
                    label.startswith(normalized_query)
                    or (
                        " " not in normalized_query
                        and any(word.startswith(normalized_query) for word in label.split())
                    )
                )
            )
            for label in (
                project.normalized_name,
                *(alias.normalized_alias for alias in project.aliases),
            )
        )
    ]
    exact_project_match = any(
        label == normalized_query
        for project in project_matches
        for label in (
            project.normalized_name,
            *(alias.normalized_alias for alias in project.aliases),
        )
    )
    if project_matches and (len(project_matches) > 1 or not exact_project_match):
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


@catalog_router.get(
    "/catalog/status",
    response_model=FlatCatalogStatusResponse,
)
def flatdna_catalog_status() -> FlatCatalogStatusResponse:
    try:
        row = get_flatdna_catalog_repository().get_published_status()
    except (FlatDnaDatabaseConfigurationError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=SERVICE_UNAVAILABLE_DETAIL,
        ) from exc
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FlatDNA catalog is not published.",
        )
    metrics = row["metrics"]
    return FlatCatalogStatusResponse(
        catalog_snapshot_id=row["snapshot_id"],
        source_as_of=row["source_as_of"],
        indexed_records=metrics["searchable_records"],
        reviewed_projects=metrics["reviewed_projects"],
        served_from_last_known_good=bool(row.get("served_from_last_known_good", False)),
    )


@catalog_router.get(
    "/catalog/projects/search",
    response_model=FlatCatalogSearchResponse,
)
def search_flatdna_catalog_projects(
    query: Annotated[FlatProjectSearchQuery, Query()],
) -> FlatCatalogSearchResponse:
    try:
        repository = get_flatdna_catalog_repository()
        published = repository.get_published_status()
        if published is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="FlatDNA catalog is not published.",
            )
        rows = repository.search(query.q, offset=query.offset, limit=query.limit)
        published_after = repository.get_published_status()
    except HTTPException:
        raise
    except (FlatDnaDatabaseConfigurationError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=SERVICE_UNAVAILABLE_DETAIL,
        ) from exc
    if (
        published_after is None
        or published_after["snapshot_id"] != published["snapshot_id"]
        or any(row["snapshot_id"] != published["snapshot_id"] for row in rows)
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FlatDNA catalog changed during search. Please retry.",
        )
    return FlatCatalogSearchResponse(
        candidates=[_catalog_identity(row) for row in rows],
        total=int(rows[0]["total"]) if rows else 0,
        offset=query.offset,
        limit=query.limit,
        query_type=rows[0]["query_type"] if rows else "PROJECT",
        source_as_of=published["source_as_of"],
        catalog_snapshot_id=published["snapshot_id"],
    )


@catalog_router.get(
    "/catalog/projects/{registration_id}",
    response_model=FlatCatalogProjectDetail,
)
def get_flatdna_catalog_project(registration_id: UUID) -> FlatCatalogProjectDetail:
    try:
        project, warnings = get_flatdna_catalog_repository().get_detail(registration_id)
    except (FlatDnaDatabaseConfigurationError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=SERVICE_UNAVAILABLE_DETAIL,
        ) from exc
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    identity = _catalog_identity(project)
    return FlatCatalogProjectDetail(
        **identity.model_dump(),
        latitude=project["latitude"],
        longitude=project["longitude"],
        review_freshness=(
            "CURRENT"
            if project["review_status"] == "SUPPORTED"
            else "HISTORICAL"
            if project.get("historical_reviewed_at") is not None
            else "NONE"
        ),
        historical_reviewed_at=project.get("historical_reviewed_at"),
        historical_review_valid_until=project.get("historical_review_valid_until"),
        rera_reference=FlatCatalogReraReference(
            authority_code=project["authority_code"],
            registration_number=project["registration_number"],
            reference_status=(
                "VERIFIED" if project["review_status"] == "SUPPORTED" else "RECORDED"
            ),
        ),
        sources=[FlatCatalogSource(
            publisher="Telangana RERA",
            url=(
                project["source_identifier"]
                if str(project["source_identifier"]).startswith(("https://", "http://"))
                else None
            ),
            retrieved_at=project["source_retrieved_at"],
        )],
        warnings=[FlatCatalogWarning(
            flag_type=warning["flag_type"],
            warning_origin=warning["warning_origin"],
            warning_status=warning["warning_status"],
            origin_label=warning["public_origin_label"],
            source_label=warning["source_label"],
            source_url=warning["source_url"],
            source_as_of=warning["source_as_of"],
            observed_at=warning["observed_at"],
        ) for warning in warnings],
    )


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
