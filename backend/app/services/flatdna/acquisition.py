from __future__ import annotations

import json
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ApprovalStatus(str, Enum):
    UNAPPROVED = "UNAPPROVED"
    APPROVED = "APPROVED"


class AcquisitionMethod(str, Enum):
    PERMISSIONED_EXPORT = "PERMISSIONED_EXPORT"
    PERMISSIONED_FEED = "PERMISSIONED_FEED"
    APPROVED_PUBLIC_RECORD_IMPORT = "APPROVED_PUBLIC_RECORD_IMPORT"


class AcquisitionApprovalError(RuntimeError):
    pass


class AcquisitionPolicy(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    approval_status: ApprovalStatus
    authority: str = Field(min_length=1)
    market: str = Field(min_length=1)
    acquisition_method: AcquisitionMethod | None
    approved_by: str | None = Field(min_length=1)
    approved_at: datetime | None
    source_identifiers: list[Annotated[str, Field(min_length=1)]]
    operating_constraints: list[Annotated[str, Field(min_length=1)]]
    boundary_version: str = Field(min_length=1)
    classifier_version: str = Field(min_length=1)
    completeness_basis: str = Field(min_length=1)

    @field_validator("approved_at")
    @classmethod
    def require_approved_at_timezone(cls, value: datetime | None) -> datetime | None:
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError("approved_at must include a timezone")
        return value

    @model_validator(mode="after")
    def validate_approval_metadata(self) -> Self:
        if self.approval_status == ApprovalStatus.APPROVED:
            required = (
                self.acquisition_method,
                self.approved_by,
                self.approved_at,
                self.source_identifiers,
                self.operating_constraints,
            )
            if not all(required):
                raise ValueError("approved acquisition policy requires complete approval metadata")
        return self

    def sanitized_summary(self) -> dict[str, object]:
        return {
            "approval_status": self.approval_status.value,
            "authority": self.authority,
            "market": self.market,
            "acquisition_method": self.acquisition_method.value if self.acquisition_method else None,
            "boundary_version": self.boundary_version,
            "classifier_version": self.classifier_version,
            "source_identifier_count": len(self.source_identifiers),
            "operating_constraint_count": len(self.operating_constraints),
        }


def load_acquisition_policy(path: str | Path) -> AcquisitionPolicy:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    return AcquisitionPolicy.model_validate(payload)


def assert_automated_ingestion_allowed(policy: AcquisitionPolicy) -> None:
    if policy.approval_status != ApprovalStatus.APPROVED:
        raise AcquisitionApprovalError(
            "Automated TG-RERA production ingestion is not approved."
        )
