import datetime
import hashlib
import json
import os
import re
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, field_validator


CONTACT_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
CONTACT_PHONE_RE = re.compile(r"^[6-9]\d{9}$")


def classify_contact(contact: str) -> Literal["email", "phone"]:
    value = contact.strip()
    if CONTACT_EMAIL_RE.match(value):
        return "email"

    digits = re.sub(r"\D", "", value)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]

    if CONTACT_PHONE_RE.match(digits):
        return "phone"

    raise ValueError("Contact must be a valid email address or Indian mobile number.")


class CustomReportLeadCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    contact: str = Field(..., min_length=5, max_length=100)
    citySlug: str = Field(..., min_length=2, max_length=80)
    cityName: str = Field(..., min_length=2, max_length=120)
    areaSlug: str = Field(..., min_length=2, max_length=120)
    areaName: str = Field(..., min_length=2, max_length=160)
    budgetRange: str | None = Field(default=None, max_length=80)
    timeline: str | None = Field(default=None, max_length=80)
    packageInterest: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=500)
    source: str = Field(default="area_report_summary", min_length=2, max_length=120)

    @field_validator("name", "contact", "citySlug", "cityName", "areaSlug", "areaName", "source")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("budgetRange", "timeline", "packageInterest", "notes")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("contact")
    @classmethod
    def validate_contact(cls, value: str) -> str:
        classify_contact(value)
        return value


class CustomReportLeadResponse(BaseModel):
    status: Literal["success"]
    leadId: str
    leadType: Literal["email", "phone"]
    message: str


def custom_report_leads_path() -> Path:
    configured = os.getenv("CUSTOM_REPORT_LEADS_PATH")
    if configured:
        return Path(configured)

    root = Path(__file__).resolve().parents[3]
    return root / "data" / "custom-report-leads.jsonl"


def store_custom_report_lead(payload: CustomReportLeadCreate) -> CustomReportLeadResponse:
    lead_type = classify_contact(payload.contact)
    created_at = datetime.datetime.now(datetime.UTC).isoformat()
    lead_hash = hashlib.sha256(
        f"{payload.contact}|{payload.citySlug}|{payload.areaSlug}|{created_at}".encode("utf-8")
    ).hexdigest()[:12]
    lead_id = f"cr_{lead_hash}"

    record = {
        **payload.model_dump(),
        "leadId": lead_id,
        "leadType": lead_type,
        "createdAt": created_at,
    }

    path = custom_report_leads_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False, sort_keys=True))
        f.write("\n")

    return CustomReportLeadResponse(
        status="success",
        leadId=lead_id,
        leadType=lead_type,
        message="Custom report request received.",
    )
