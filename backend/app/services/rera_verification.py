from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

VerificationStatus = Literal[
    "verified",
    "not_found",
    "manual_verification_required",
    "source_unavailable",
]

RERA_DISCLAIMER = (
    "RERA registration verifies project disclosure on the official state portal. "
    "It does not by itself verify land title, litigation, every local approval, "
    "or investment safety."
)


class ReraVerificationRequest(BaseModel):
    state: str = Field(..., min_length=2)
    registration_number: str = Field(..., min_length=3)
    project_name: str | None = None
    promoter_name: str | None = None
    address: str | None = None


class ReraVerificationResult(BaseModel):
    state: str
    registration_number: str
    status: VerificationStatus
    project_name: str | None = None
    promoter_name: str | None = None
    project_type: str | None = None
    district: str | None = None
    mandal_or_taluka: str | None = None
    village: str | None = None
    survey_number: str | None = None
    approval_authority: str | None = None
    approval_number: str | None = None
    approval_date: str | None = None
    validity_date: str | None = None
    proposed_completion_date: str | None = None
    quarterly_update_status: str | None = None
    official_source_url: str
    matched_fields: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    confidence: float = 0.0
    last_checked_at: str
    disclaimer: str = RERA_DISCLAIMER


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def normalize_state(value: str) -> str:
    return value.strip().lower().replace("-", "_").replace(" ", "_")


def verify_rera_registration(request: ReraVerificationRequest) -> ReraVerificationResult:
    state = normalize_state(request.state)
    registration_number = request.registration_number.strip()

    if state in {"telangana", "ts", "tg"}:
        return ReraVerificationResult(
            state="telangana",
            registration_number=registration_number,
            status="manual_verification_required",
            project_name=request.project_name,
            promoter_name=request.promoter_name,
            official_source_url="https://rerait.telangana.gov.in/SearchList/Search",
            warnings=[
                "Telangana RERA public search is captcha-protected; verify this registration on the official portal.",
            ],
            confidence=0.25,
            last_checked_at=_now_iso(),
        )

    if state in {"andhra_pradesh", "ap"}:
        return ReraVerificationResult(
            state="andhra_pradesh",
            registration_number=registration_number,
            status="manual_verification_required",
            project_name=request.project_name,
            promoter_name=request.promoter_name,
            official_source_url="https://rera.ap.gov.in/RERA/Views/Project.aspx",
            warnings=[
                "AP RERA lookup needs a matched official project detail link or status report entry before automated verification.",
            ],
            confidence=0.25,
            last_checked_at=_now_iso(),
        )

    return ReraVerificationResult(
        state=state,
        registration_number=registration_number,
        status="source_unavailable",
        official_source_url="",
        warnings=[f"Unsupported state for beta RERA verification: {request.state}"],
        confidence=0.0,
        last_checked_at=_now_iso(),
    )
