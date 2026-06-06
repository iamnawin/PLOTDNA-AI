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
PAID_PAYMENT_STATUSES = {"paid", "completed", "payment_completed"}


def classify_contact(contact: str) -> Literal["email", "phone"]:
    value = contact.strip().lower()
    if CONTACT_EMAIL_RE.match(value):
        return "email"

    try:
        normalize_phone(contact)
        return "phone"
    except ValueError:
        pass

    raise ValueError("Contact must be a valid email address or Indian mobile number.")


def normalize_email(email: str) -> str:
    value = email.strip().lower()
    if not CONTACT_EMAIL_RE.match(value):
        raise ValueError("Email must be a valid email address.")
    return value


def normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone.strip())
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]

    if not CONTACT_PHONE_RE.match(digits):
        raise ValueError("Phone must be a valid 10-digit Indian mobile number.")
    return digits


class CustomReportLeadCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: str = Field(..., min_length=5, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    citySlug: str = Field(..., min_length=2, max_length=80)
    cityName: str = Field(..., min_length=2, max_length=120)
    areaSlug: str = Field(..., min_length=2, max_length=120)
    areaName: str = Field(..., min_length=2, max_length=160)
    budgetRange: str | None = Field(default=None, max_length=80)
    timeline: str | None = Field(default=None, max_length=80)
    packageInterest: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=500)
    source: str = Field(default="area_report_summary", min_length=2, max_length=120)

    @field_validator("name", "citySlug", "cityName", "areaSlug", "areaName", "source")
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

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_phone(value)


class CustomReportLeadResponse(BaseModel):
    status: Literal["success"]
    leadId: str
    leadType: Literal["email", "phone"]
    paymentStatus: Literal["pending"]
    message: str


class PaidCustomReportLead(BaseModel):
    leadId: str
    email: str
    phone: str
    packageInterest: str | None = None
    paidAt: str | None = None


def custom_report_leads_path() -> Path:
    configured = os.getenv("CUSTOM_REPORT_LEADS_PATH")
    if configured:
        return Path(configured)

    root = Path(__file__).resolve().parents[3]
    return root / "data" / "custom-report-leads.jsonl"


def store_custom_report_lead(payload: CustomReportLeadCreate, *, user_id: str | None = None) -> CustomReportLeadResponse:
    lead_type: Literal["email", "phone"] = "email"
    created_at = datetime.datetime.now(datetime.UTC).isoformat()
    lead_hash = hashlib.sha256(
        f"{payload.email}|{payload.phone}|{payload.citySlug}|{payload.areaSlug}|{created_at}".encode("utf-8")
    ).hexdigest()[:12]
    lead_id = f"cr_{lead_hash}"

    record = {
        **payload.model_dump(),
        "leadId": lead_id,
        "leadType": lead_type,
        "paymentStatus": "pending",
        "createdAt": created_at,
    }
    if user_id:
        record["userId"] = user_id

    path = custom_report_leads_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False, sort_keys=True))
        f.write("\n")

    return CustomReportLeadResponse(
        status="success",
        leadId=lead_id,
        leadType=lead_type,
        paymentStatus="pending",
        message="Custom report request received.",
    )


def find_paid_custom_report_lead(
    *,
    email: str,
    phone: str,
    package_interest: str | None = None,
) -> PaidCustomReportLead | None:
    normalized_email = normalize_email(email)
    normalized_phone = normalize_phone(phone)
    path = custom_report_leads_path()
    if not path.exists():
        return None

    with path.open(encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue

            payment_status = str(record.get("paymentStatus") or "").strip().lower()
            if payment_status not in PAID_PAYMENT_STATUSES:
                continue
            if package_interest and record.get("packageInterest") != package_interest:
                continue
            if record.get("email") != normalized_email or record.get("phone") != normalized_phone:
                continue

            lead_id = record.get("leadId")
            if not isinstance(lead_id, str) or not lead_id:
                continue
            return PaidCustomReportLead(
                leadId=lead_id,
                email=normalized_email,
                phone=normalized_phone,
                packageInterest=record.get("packageInterest"),
                paidAt=record.get("paidAt"),
            )

    return None


def find_paid_custom_report_lead_for_user(
    *,
    user_id: str,
    package_interest: str | None = None,
) -> PaidCustomReportLead | None:
    path = custom_report_leads_path()
    if not path.exists():
        return None

    with path.open(encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue

            payment_status = str(record.get("paymentStatus") or "").strip().lower()
            if payment_status not in PAID_PAYMENT_STATUSES:
                continue
            if record.get("userId") != user_id:
                continue
            if package_interest and record.get("packageInterest") != package_interest:
                continue

            lead_id = record.get("leadId")
            email = record.get("email")
            phone = record.get("phone")
            if not all(isinstance(value, str) and value for value in (lead_id, email, phone)):
                continue
            return PaidCustomReportLead(
                leadId=lead_id,
                email=email,
                phone=phone,
                packageInterest=record.get("packageInterest"),
                paidAt=record.get("paidAt"),
            )

    return None
