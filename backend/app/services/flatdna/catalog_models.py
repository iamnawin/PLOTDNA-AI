from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class CatalogModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CatalogReviewStatus(str, Enum):
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    SUPPORTED = "SUPPORTED"
    UNSUPPORTED = "UNSUPPORTED"


class IdentityStatus(str, Enum):
    RESOLVED = "RESOLVED"
    PARTIALLY_RESOLVED = "PARTIALLY_RESOLVED"
    UNRESOLVED = "UNRESOLVED"


class ProjectStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    WITHDRAWN = "WITHDRAWN"
    LAPSED = "LAPSED"
    UNKNOWN = "UNKNOWN"


class CatalogStatus(str, Enum):
    SEARCHABLE = "SEARCHABLE"
    QUARANTINED = "QUARANTINED"
    HIDDEN = "HIDDEN"


class RegulatoryFlag(str, Enum):
    REVOKED = "REVOKED"
    DEFAULTER = "DEFAULTER"
    LITIGATION_REPORTED = "LITIGATION_REPORTED"
    OTHER_WARNING = "OTHER_WARNING"


class WarningOrigin(str, Enum):
    TG_RERA = "TG_RERA"
    FLATDNA_REVIEW = "FLATDNA_REVIEW"
    THIRD_PARTY = "THIRD_PARTY"


class WarningStatus(str, Enum):
    ACTIVE = "ACTIVE"
    RESOLVED = "RESOLVED"


class ReviewFreshness(str, Enum):
    NONE = "NONE"
    CURRENT = "CURRENT"
    EXPIRED = "EXPIRED"


class CatalogLocationPrecision(str, Enum):
    EXACT_PROJECT = "EXACT_PROJECT"
    APPROXIMATE_PROJECT = "APPROXIMATE_PROJECT"
    LOCALITY = "LOCALITY"
    UNKNOWN = "UNKNOWN"


_LOCATION_LABELS = {
    CatalogLocationPrecision.EXACT_PROJECT: "Exact project location",
    CatalogLocationPrecision.APPROXIMATE_PROJECT: "Approximate project location",
    CatalogLocationPrecision.LOCALITY: "Locality-level location",
    CatalogLocationPrecision.UNKNOWN: "Location being verified",
}


class CatalogProjectState(CatalogModel):
    review_status: CatalogReviewStatus
    identity_status: IdentityStatus
    project_status: ProjectStatus
    catalog_status: CatalogStatus
    location_precision: CatalogLocationPrecision
    exclusion_reason: str | None = Field(default=None, min_length=1)
    current_review_id: UUID | None = None
    review_freshness: ReviewFreshness = ReviewFreshness.NONE
    unique_registration: bool = False
    project_identity_resolved: bool = False
    promoter_identity_resolved: bool = False
    duplicate_suspected: bool = False
    location_only_uncertainty: bool = False

    @model_validator(mode="after")
    def validate_status_combination(self) -> Self:
        if self.identity_status == IdentityStatus.UNRESOLVED and self.catalog_status == CatalogStatus.SEARCHABLE:
            raise ValueError("unresolved identity cannot be searchable")
        if self.identity_status == IdentityStatus.PARTIALLY_RESOLVED and self.catalog_status == CatalogStatus.SEARCHABLE:
            valid_partial = (
                self.unique_registration
                and self.project_identity_resolved
                and self.promoter_identity_resolved
                and not self.duplicate_suspected
                and self.location_only_uncertainty
            )
            if not valid_partial:
                raise ValueError(
                    "partially resolved searchable project must have only location uncertainty"
                )
        if self.review_status == CatalogReviewStatus.UNSUPPORTED:
            if self.identity_status != IdentityStatus.RESOLVED or not self.exclusion_reason:
                raise ValueError("unsupported project requires resolved identity and exclusion reason")
        if self.review_status == CatalogReviewStatus.SUPPORTED:
            if self.current_review_id is None or self.review_freshness != ReviewFreshness.CURRENT:
                raise ValueError("supported project requires a current review")
        return self

    @property
    def customer_location_label(self) -> str:
        return _LOCATION_LABELS[self.location_precision]


class MatchAssessment(CatalogModel):
    project_name_bps: int = Field(ge=0, le=10_000)
    duplicate_bps: int = Field(ge=0, le=10_000)
    promoter_bps: int = Field(ge=0, le=10_000)
    locality_bps: int = Field(ge=0, le=10_000)
    coordinate_bps: int = Field(ge=0, le=10_000)
    methods: dict[str, str] = Field(default_factory=dict)


class RegulatoryWarning(CatalogModel):
    flag: RegulatoryFlag
    origin: WarningOrigin
    status: WarningStatus
    observed_at: datetime
    source_record_id: UUID | None = None
    evidence_source_id: UUID | None = None
    resolution_source_record_id: UUID | None = None
    resolution_evidence_source_id: UUID | None = None

    @field_validator("observed_at")
    @classmethod
    def require_observed_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("observed_at must include a timezone")
        return value

    @model_validator(mode="after")
    def validate_sources(self) -> Self:
        if self.source_record_id is None and self.evidence_source_id is None:
            raise ValueError("warning requires supporting source evidence")
        if (
            self.status == WarningStatus.RESOLVED
            and self.resolution_source_record_id is None
            and self.resolution_evidence_source_id is None
        ):
            raise ValueError("resolved warning requires resolution evidence")
        return self


class CatalogMetrics(CatalogModel):
    acquired_records: int = Field(ge=0)
    unique_registrations: int = Field(ge=0)
    classified_apartments: int = Field(ge=0)
    in_geography: int = Field(ge=0)
    searchable_records: int = Field(ge=0)
    quarantined_records: int = Field(ge=0)
    excluded_records: int = Field(ge=0)
    resolved_identities: int = Field(ge=0)
    partially_resolved_identities: int = Field(ge=0)
    unresolved_identities: int = Field(ge=0)
    reviewed_projects: int = Field(ge=0)


class CatalogSnapshot(CatalogModel):
    snapshot_id: str = Field(min_length=1, pattern=r"^[a-z0-9][a-z0-9-]+$")
    source_as_of: date
    metrics: CatalogMetrics


class ProjectReview(CatalogModel):
    id: UUID
    project_id: UUID
    reviewed_by: str = Field(min_length=1)
    review_method: str = Field(min_length=1)
    reviewed_at: datetime
    evidence_as_of: date
    valid_until: datetime

    @field_validator("reviewed_at", "valid_until")
    @classmethod
    def require_review_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("review timestamps must include a timezone")
        return value

    @model_validator(mode="after")
    def validate_review_dates(self) -> Self:
        if self.valid_until <= self.reviewed_at:
            raise ValueError("valid_until must be after reviewed_at")
        if self.evidence_as_of > self.reviewed_at.date():
            raise ValueError("evidence_as_of cannot be after reviewed_at")
        return self
