from __future__ import annotations

import hashlib
import re
import unicodedata
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class FlatDnaModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RegistryStatus(str, Enum):
    DRAFT = "DRAFT"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    SUPPORTED = "SUPPORTED"
    UNSUPPORTED = "UNSUPPORTED"
    INACTIVE = "INACTIVE"


class LocationPrecision(str, Enum):
    ENTRANCE = "ENTRANCE"
    PROJECT_CENTROID = "PROJECT_CENTROID"
    APPROXIMATE = "APPROXIMATE"
    UNKNOWN = "UNKNOWN"


class DeveloperAliasType(str, Enum):
    LEGAL_NAME = "LEGAL_NAME"
    ABBREVIATION = "ABBREVIATION"
    FORMER_NAME = "FORMER_NAME"
    COMMON_USAGE = "COMMON_USAGE"
    COMMON_MISSPELLING = "COMMON_MISSPELLING"


class ProjectAliasType(str, Enum):
    MARKETING = "MARKETING"
    ABBREVIATION = "ABBREVIATION"
    FORMER_NAME = "FORMER_NAME"
    COMMON_MISSPELLING = "COMMON_MISSPELLING"
    BUILDER_PREFIXED = "BUILDER_PREFIXED"
    LOCALITY_QUALIFIED = "LOCALITY_QUALIFIED"
    PHASE_NAME = "PHASE_NAME"


class ReraReferenceStatus(str, Enum):
    RECORDED = "RECORDED"
    VERIFIED = "VERIFIED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    SUPERSEDED = "SUPERSEDED"


class SourceClass(str, Enum):
    OFFICIAL_PROJECT = "OFFICIAL_PROJECT"
    OFFICIAL_REGULATOR = "OFFICIAL_REGULATOR"
    BUILDER_PUBLISHED = "BUILDER_PUBLISHED"
    CURATED_REFERENCE = "CURATED_REFERENCE"


class DataOrigin(str, Enum):
    REAL = "REAL"
    CURATED = "CURATED"
    TEST = "TEST"
    SYNTHETIC = "SYNTHETIC"


class SourceStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INVALID = "INVALID"
    SUPERSEDED = "SUPERSEDED"


class ReviewStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class DeveloperRecord(FlatDnaModel):
    id: UUID
    canonical_name: str = Field(min_length=1)
    normalized_name: str = Field(min_length=1)
    registry_status: RegistryStatus = RegistryStatus.DRAFT


class DeveloperAliasRecord(FlatDnaModel):
    id: UUID
    developer_id: UUID
    alias: str = Field(min_length=1)
    normalized_alias: str = Field(min_length=1)
    alias_type: DeveloperAliasType
    active: bool = True


class ProjectRecord(FlatDnaModel):
    id: UUID
    developer_id: UUID
    canonical_name: str = Field(min_length=1)
    normalized_name: str = Field(min_length=1)
    city_slug: str = Field(min_length=1)
    locality_slug: str = Field(min_length=1)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    location_precision: LocationPrecision = LocationPrecision.UNKNOWN
    registry_status: RegistryStatus = RegistryStatus.DRAFT

    @model_validator(mode="after")
    def validate_coordinate_pair(self) -> Self:
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must both be present or both be absent")
        return self


class ProjectAliasRecord(FlatDnaModel):
    id: UUID
    project_id: UUID
    alias: str = Field(min_length=1)
    normalized_alias: str = Field(min_length=1)
    alias_type: ProjectAliasType
    active: bool = True


class ReraReferenceRecord(FlatDnaModel):
    id: UUID
    project_id: UUID
    authority_code: str = Field(min_length=1)
    registration_number: str = Field(min_length=1)
    normalized_registration_number: str = Field(min_length=1)
    reference_status: ReraReferenceStatus = ReraReferenceStatus.RECORDED


class EvidenceSourceRecord(FlatDnaModel):
    id: UUID
    source_class: SourceClass
    data_origin: DataOrigin
    publisher: str = Field(min_length=1)
    title: str | None = None
    source_ref: str = Field(min_length=1)
    url: str | None = None
    retrieved_at: datetime
    content_hash: str | None = Field(default=None, pattern=r"^[0-9a-f]{64}$")
    source_status: SourceStatus = SourceStatus.ACTIVE

    @field_validator("retrieved_at")
    @classmethod
    def validate_retrieved_at_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("retrieved_at must include a timezone")
        return value


class ClaimEvidenceRecord(FlatDnaModel):
    id: UUID
    evidence_source_id: UUID
    developer_id: UUID | None = None
    developer_alias_id: UUID | None = None
    project_id: UUID | None = None
    project_alias_id: UUID | None = None
    rera_reference_id: UUID | None = None
    claim_key: str = Field(min_length=1)
    observed_value: str = Field(min_length=1)
    review_status: ReviewStatus = ReviewStatus.PENDING
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    notes: str | None = None
    fingerprint: str = Field(pattern=r"^[0-9a-f]{64}$")

    @field_validator("reviewed_at")
    @classmethod
    def validate_reviewed_at_timezone(cls, value: datetime | None) -> datetime | None:
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError("reviewed_at must include a timezone")
        return value

    @model_validator(mode="after")
    def validate_subject_and_review(self) -> Self:
        if len(self.subject_values()) != 1:
            raise ValueError("claim evidence must reference exactly one canonical subject")
        reviewed = self.review_status in {ReviewStatus.APPROVED, ReviewStatus.REJECTED}
        if reviewed and (not self.reviewed_by or not self.reviewed_at):
            raise ValueError("reviewed claims require reviewed_by and reviewed_at")
        if not reviewed and (self.reviewed_by is not None or self.reviewed_at is not None):
            raise ValueError("pending claims cannot include review metadata")
        return self

    def subject_values(self) -> list[tuple[str, UUID]]:
        subjects = (
            ("developer", self.developer_id),
            ("developer_alias", self.developer_alias_id),
            ("project", self.project_id),
            ("project_alias", self.project_alias_id),
            ("rera_reference", self.rera_reference_id),
        )
        return [(kind, value) for kind, value in subjects if value is not None]


class RegistryBundle(FlatDnaModel):
    developers: list[DeveloperRecord] = Field(default_factory=list)
    developer_aliases: list[DeveloperAliasRecord] = Field(default_factory=list)
    projects: list[ProjectRecord] = Field(default_factory=list)
    project_aliases: list[ProjectAliasRecord] = Field(default_factory=list)
    rera_references: list[ReraReferenceRecord] = Field(default_factory=list)
    evidence_sources: list[EvidenceSourceRecord] = Field(default_factory=list)
    claim_evidence: list[ClaimEvidenceRecord] = Field(default_factory=list)


def normalize_identity(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold()
    normalized = re.sub(r"[^\w]+", " ", normalized, flags=re.UNICODE)
    return " ".join(normalized.split())


def normalize_reference(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold()
    return "".join(character for character in normalized if character.isalnum())


def normalize_claim_value(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def format_coordinate_claim(latitude: Decimal, longitude: Decimal) -> str:
    return f"{latitude:.6f},{longitude:.6f}"


def claim_fingerprint(
    *,
    subject_type: str,
    subject_id: UUID,
    claim_key: str,
    observed_value: str,
    evidence_source_id: UUID,
) -> str:
    payload = "\x1f".join(
        (
            subject_type,
            str(subject_id),
            claim_key.strip(),
            normalize_claim_value(observed_value),
            str(evidence_source_id),
        )
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
