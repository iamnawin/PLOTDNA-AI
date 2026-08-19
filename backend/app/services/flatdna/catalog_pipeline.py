from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Literal, Self
from uuid import NAMESPACE_URL, UUID, uuid5

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .catalog_models import (
    CatalogLocationPrecision,
    CatalogMetrics,
    CatalogProjectState,
    CatalogReviewStatus,
    CatalogStatus,
    IdentityStatus,
    MatchAssessment,
    ProjectStatus,
)
from .models import normalize_identity, normalize_reference


class PipelineModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class SourceCatalogRecord(PipelineModel):
    source_record_id: UUID
    data_origin: Literal["TEST", "REAL"]
    authority_code: str = Field(min_length=1)
    registration_number: str = Field(min_length=1)
    project_name: str | None = None
    promoter_name: str | None = None
    property_type: str = Field(min_length=1)
    project_status: ProjectStatus = ProjectStatus.UNKNOWN
    within_market: bool
    locality: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    coordinate_source: str | None = None

    @field_validator("registration_number")
    @classmethod
    def require_usable_registration(cls, value: str) -> str:
        if not normalize_reference(value):
            raise ValueError("registration_number must contain letters or digits")
        return value

    @model_validator(mode="after")
    def validate_coordinates(self) -> Self:
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must both be present or both be absent")
        if self.latitude is None and self.coordinate_source is not None:
            raise ValueError("coordinate_source requires coordinates")
        return self

    @property
    def normalized_registration_number(self) -> str:
        return normalize_reference(self.registration_number)


class ExistingRegistrationIdentity(PipelineModel):
    authority_code: str = Field(min_length=1)
    normalized_rera_number: str = Field(min_length=1)
    canonical_project_id: UUID
    registration_id: UUID

    @field_validator("normalized_rera_number")
    @classmethod
    def require_usable_normalized_registration(cls, value: str) -> str:
        if not normalize_reference(value):
            raise ValueError("normalized_rera_number must contain letters or digits")
        return value


class CatalogProjection(PipelineModel):
    source_record_id: UUID
    source_record_ids: tuple[UUID, ...]
    canonical_project_id: UUID
    registration_id: UUID
    authority_code: str
    registration_number: str
    normalized_rera_number: str
    project_name: str | None
    normalized_project_name: str
    promoter_name: str | None
    normalized_promoter_name: str
    property_type: str
    locality_slug: str | None
    latitude: float | None
    longitude: float | None
    state: CatalogProjectState
    assessment: MatchAssessment


class CandidateCatalogSnapshot(PipelineModel):
    snapshot_id: str
    source_as_of: date
    metrics: CatalogMetrics
    projections: tuple[CatalogProjection, ...]


def build_candidate_snapshot(
    records: list[SourceCatalogRecord],
    existing_identities: list[ExistingRegistrationIdentity],
    source_as_of: date,
    sequence: int,
) -> CandidateCatalogSnapshot:
    if sequence < 1 or sequence > 999:
        raise ValueError("sequence must be between 1 and 999")

    existing_by_key: dict[tuple[str, str], ExistingRegistrationIdentity] = {}
    for item in existing_identities:
        key = (item.authority_code.upper(), normalize_reference(item.normalized_rera_number))
        current = existing_by_key.get(key)
        if current is not None and (
            current.canonical_project_id != item.canonical_project_id
            or current.registration_id != item.registration_id
        ):
            raise ValueError(f"conflicting existing registration identity for {key[0]}:{key[1]}")
        existing_by_key[key] = item
    grouped: dict[tuple[str, str], list[SourceCatalogRecord]] = defaultdict(list)
    for record in records:
        grouped[(record.authority_code.upper(), record.normalized_registration_number)].append(record)

    projections = []
    for key in sorted(grouped):
        group = sorted(grouped[key], key=lambda item: str(item.source_record_id))
        record = group[0]
        existing = existing_by_key.get(key)
        duplicate_suspected = len(group) > 1
        project_identity_resolved = bool(existing or _clean(record.project_name))
        promoter_identity_resolved = bool(existing or _clean(record.promoter_name))
        identity_resolved = project_identity_resolved and promoter_identity_resolved

        canonical_project_id = (
            existing.canonical_project_id
            if existing
            else uuid5(NAMESPACE_URL, f"flatdna-project:{key[0]}:{key[1]}")
        )
        registration_id = (
            existing.registration_id
            if existing
            else uuid5(NAMESPACE_URL, f"flatdna-registration:{key[0]}:{key[1]}")
        )

        location_precision, coordinate_bps = _location(record)
        locality_slug = _slug(record.locality)
        is_apartment = record.property_type == "RESIDENTIAL_APARTMENT"

        if duplicate_suspected or not identity_resolved:
            state = CatalogProjectState(
                review_status=CatalogReviewStatus.REVIEW_REQUIRED,
                identity_status=IdentityStatus.UNRESOLVED,
                project_status=record.project_status,
                catalog_status=CatalogStatus.QUARANTINED,
                location_precision=location_precision,
                unique_registration=not duplicate_suspected,
                project_identity_resolved=project_identity_resolved,
                promoter_identity_resolved=promoter_identity_resolved,
                duplicate_suspected=duplicate_suspected,
            )
        elif not is_apartment or not record.within_market:
            reason = (
                "PROPERTY_TYPE_OUT_OF_SCOPE"
                if not is_apartment
                else "OUTSIDE_HYDERABAD_MARKET"
            )
            state = CatalogProjectState(
                review_status=CatalogReviewStatus.UNSUPPORTED,
                identity_status=IdentityStatus.RESOLVED,
                project_status=record.project_status,
                catalog_status=CatalogStatus.HIDDEN,
                location_precision=location_precision,
                exclusion_reason=reason,
                unique_registration=True,
                project_identity_resolved=True,
                promoter_identity_resolved=True,
            )
        else:
            location_only_uncertainty = location_precision in {
                CatalogLocationPrecision.LOCALITY,
                CatalogLocationPrecision.UNKNOWN,
            }
            searchable = location_precision != CatalogLocationPrecision.UNKNOWN
            state = CatalogProjectState(
                review_status=CatalogReviewStatus.REVIEW_REQUIRED,
                identity_status=(
                    IdentityStatus.PARTIALLY_RESOLVED
                    if location_only_uncertainty
                    else IdentityStatus.RESOLVED
                ),
                project_status=record.project_status,
                catalog_status=(
                    CatalogStatus.SEARCHABLE if searchable else CatalogStatus.QUARANTINED
                ),
                location_precision=location_precision,
                unique_registration=True,
                project_identity_resolved=True,
                promoter_identity_resolved=True,
                location_only_uncertainty=location_only_uncertainty,
            )

        assessment = MatchAssessment(
            project_name_bps=10_000 if project_identity_resolved else 0,
            duplicate_bps=10_000 if duplicate_suspected else 0,
            promoter_bps=10_000 if promoter_identity_resolved else 0,
            locality_bps=10_000 if locality_slug else 0,
            coordinate_bps=coordinate_bps,
            methods={
                "registration": "AUTHORITY_EXACT",
                "project_name": "EXISTING_REGISTRY" if existing else "NORMALIZED_PRESENT",
                "promoter": "EXISTING_REGISTRY" if existing else "NORMALIZED_PRESENT",
                "location": location_precision.value,
            },
        )
        projections.append(
            CatalogProjection(
                source_record_id=record.source_record_id,
                source_record_ids=tuple(item.source_record_id for item in group),
                canonical_project_id=canonical_project_id,
                registration_id=registration_id,
                authority_code=key[0],
                registration_number=record.registration_number,
                normalized_rera_number=key[1],
                project_name=_clean(record.project_name),
                normalized_project_name=normalize_identity(record.project_name or ""),
                promoter_name=_clean(record.promoter_name),
                normalized_promoter_name=normalize_identity(record.promoter_name or ""),
                property_type=record.property_type,
                locality_slug=locality_slug,
                latitude=record.latitude,
                longitude=record.longitude,
                state=state,
                assessment=assessment,
            )
        )

    projections_tuple = tuple(projections)
    metrics = CatalogMetrics(
        acquired_records=len(records),
        unique_registrations=len(grouped),
        classified_apartments=sum(
            not projection.state.duplicate_suspected
            and projection.property_type == "RESIDENTIAL_APARTMENT"
            for projection in projections_tuple
        ),
        in_geography=sum(
            not projection.state.duplicate_suspected
            and grouped[(projection.authority_code, projection.normalized_rera_number)][0].within_market
            for projection in projections_tuple
        ),
        searchable_records=sum(
            projection.state.catalog_status == CatalogStatus.SEARCHABLE
            for projection in projections_tuple
        ),
        quarantined_records=sum(
            projection.state.catalog_status == CatalogStatus.QUARANTINED
            for projection in projections_tuple
        ),
        excluded_records=sum(
            projection.state.catalog_status == CatalogStatus.HIDDEN
            for projection in projections_tuple
        ),
        resolved_identities=sum(
            projection.state.identity_status == IdentityStatus.RESOLVED
            for projection in projections_tuple
        ),
        partially_resolved_identities=sum(
            projection.state.identity_status == IdentityStatus.PARTIALLY_RESOLVED
            for projection in projections_tuple
        ),
        unresolved_identities=sum(
            projection.state.identity_status == IdentityStatus.UNRESOLVED
            for projection in projections_tuple
        ),
        reviewed_projects=sum(
            projection.state.review_status == CatalogReviewStatus.SUPPORTED
            for projection in projections_tuple
        ),
    )
    return CandidateCatalogSnapshot(
        snapshot_id=f"tg-rera-{source_as_of.isoformat()}-{sequence:03d}",
        source_as_of=source_as_of,
        metrics=metrics,
        projections=projections_tuple,
    )


def _clean(value: str | None) -> str | None:
    cleaned = value.strip() if value else ""
    return cleaned or None


def _slug(value: str | None) -> str | None:
    normalized = normalize_identity(value or "")
    return normalized.replace(" ", "-") if normalized else None


def _location(record: SourceCatalogRecord) -> tuple[CatalogLocationPrecision, int]:
    if record.latitude is not None:
        if record.coordinate_source == "OFFICIAL_REGULATOR":
            return CatalogLocationPrecision.EXACT_PROJECT, 10_000
        return CatalogLocationPrecision.APPROXIMATE_PROJECT, 8_000
    if _clean(record.locality):
        return CatalogLocationPrecision.LOCALITY, 0
    return CatalogLocationPrecision.UNKNOWN, 0
