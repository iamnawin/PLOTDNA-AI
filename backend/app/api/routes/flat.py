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


class FlatProjectMatchedResponse(BaseModel):
    outcome: Literal["MATCHED"] = "MATCHED"
    project: FlatProjectIdentity
    match_type: Literal["CANONICAL", "ALIAS", "FUZZY"]


class FlatProjectAmbiguousResponse(BaseModel):
    outcome: Literal["AMBIGUOUS"] = "AMBIGUOUS"
    candidates: list[FlatProjectIdentity]


class FlatProjectNotFoundResponse(BaseModel):
    outcome: Literal["NOT_FOUND"] = "NOT_FOUND"
    code: Literal["PROJECT_NOT_FOUND"] = "PROJECT_NOT_FOUND"


FlatProjectSearchResponse = Annotated[
    FlatProjectMatchedResponse | FlatProjectAmbiguousResponse | FlatProjectNotFoundResponse,
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
    )


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


@router.get("/status")
def flatdna_status() -> dict[str, str]:
    return {"status": "enabled", "phase": "0A", "registry": "unavailable"}


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
    return _search_response(resolve_project(query.q, projects))
