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


class PaymentConfirmedLead(BaseModel):
    leadId: str
    email: str
    phone: str
    packageInterest: str | None = None
    paymentStatus: Literal["paid"]
    paidAt: str


class RazorpayWebhookResult(BaseModel):
    status: Literal["recorded", "ignored"]
    leadId: str | None = None
    paymentReference: str | None = None


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


def self_confirm_custom_report_payment(
    *,
    lead_id: str,
    user_id: str,
    payment_reference: str | None = None,
) -> PaymentConfirmedLead | None:
    path = custom_report_leads_path()
    if not path.exists():
        return None

    paid_at = datetime.datetime.now(datetime.UTC).isoformat()
    updated_record: dict | None = None
    records: list[dict] = []

    with path.open(encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                records.append({"raw": line.rstrip("\n")})
                continue

            if record.get("leadId") == lead_id and record.get("userId") == user_id:
                record["paymentStatus"] = "paid"
                record["paidAt"] = paid_at
                if payment_reference and payment_reference.strip():
                    record["paymentReference"] = payment_reference.strip()
                updated_record = record
            records.append(record)

    if not updated_record:
        return None

    with path.open("w", encoding="utf-8") as f:
        for record in records:
            if "raw" in record:
                f.write(record["raw"])
            else:
                f.write(json.dumps(record, ensure_ascii=False, sort_keys=True))
            f.write("\n")

    return PaymentConfirmedLead(
        leadId=updated_record["leadId"],
        email=updated_record["email"],
        phone=updated_record["phone"],
        packageInterest=updated_record.get("packageInterest"),
        paymentStatus="paid",
        paidAt=paid_at,
    )


def recover_custom_report_payment(
    *,
    name: str | None = None,
    email: str,
    phone: str,
    package_interest: str,
    payment_reference: str,
    user_id: str,
) -> PaymentConfirmedLead | None:
    normalized_email = normalize_email(email)
    normalized_phone = normalize_phone(phone)
    clean_reference = payment_reference.strip()
    if not clean_reference.startswith("pay_"):
        raise ValueError("Enter the Razorpay payment ID starting with pay_.")

    path = custom_report_leads_path()

    paid_at = datetime.datetime.now(datetime.UTC).isoformat()
    updated_record: dict | None = None
    records: list[dict] = []

    if path.exists():
        with path.open(encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    records.append({"raw": line.rstrip("\n")})
                    continue

                if (
                    updated_record is None
                    and record.get("email") == normalized_email
                    and record.get("phone") == normalized_phone
                    and record.get("packageInterest") == package_interest
                ):
                    record["paymentStatus"] = "paid"
                    record["paidAt"] = paid_at
                    record["paymentReference"] = clean_reference
                    record["recoveredByUserId"] = user_id
                    updated_record = record
                records.append(record)

    if not updated_record:
        recovered_hash = hashlib.sha256(
            f"{normalized_email}|{normalized_phone}|{package_interest}|{clean_reference}".encode("utf-8")
        ).hexdigest()[:12]
        updated_record = {
            "leadId": f"cr_recovered_{recovered_hash}",
            "leadType": "email",
            "name": name.strip() if name and name.strip() else None,
            "email": normalized_email,
            "phone": normalized_phone,
            "packageInterest": package_interest,
            "paymentStatus": "paid",
            "paymentReference": clean_reference,
            "paidAt": paid_at,
            "createdAt": paid_at,
            "source": "razorpay_payment_id_recovery",
            "recoveredByUserId": user_id,
        }
        records.append(updated_record)

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for record in records:
            if "raw" in record:
                f.write(record["raw"])
            else:
                f.write(json.dumps(record, ensure_ascii=False, sort_keys=True))
            f.write("\n")

    return PaymentConfirmedLead(
        leadId=updated_record["leadId"],
        email=updated_record["email"],
        phone=updated_record["phone"],
        packageInterest=updated_record.get("packageInterest"),
        paymentStatus="paid",
        paidAt=paid_at,
    )


def _first_str(*values: object) -> str | None:
    for value in values:
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _safe_dict(value: object) -> dict:
    return value if isinstance(value, dict) else {}


def confirm_custom_report_payment_from_razorpay(payload: dict) -> RazorpayWebhookResult:
    event = str(payload.get("event") or "").strip()
    if event not in {"payment_link.paid", "payment.captured", "order.paid"}:
        return RazorpayWebhookResult(status="ignored")

    payload_body = _safe_dict(payload.get("payload"))
    payment_entity = _safe_dict(_safe_dict(payload_body.get("payment")).get("entity"))
    payment_link_entity = _safe_dict(_safe_dict(payload_body.get("payment_link")).get("entity"))
    order_entity = _safe_dict(_safe_dict(payload_body.get("order")).get("entity"))
    payment_notes = _safe_dict(payment_entity.get("notes"))
    payment_link_notes = _safe_dict(payment_link_entity.get("notes"))
    order_notes = _safe_dict(order_entity.get("notes"))
    customer = _safe_dict(payment_link_entity.get("customer"))

    lead_id = _first_str(
        payment_link_notes.get("plotdna_lead_id"),
        payment_notes.get("plotdna_lead_id"),
        order_notes.get("plotdna_lead_id"),
        payment_link_entity.get("reference_id"),
    )
    package_interest = _first_str(
        payment_link_notes.get("package_interest"),
        payment_notes.get("package_interest"),
        order_notes.get("package_interest"),
    )
    payment_reference = _first_str(payment_entity.get("id"), payment_link_entity.get("id"), order_entity.get("id"))
    payment_link_id = _first_str(payment_link_entity.get("id"))
    email = _first_str(customer.get("email"), payment_entity.get("email"))
    phone = _first_str(customer.get("contact"), payment_entity.get("contact"))

    normalized_email: str | None = None
    normalized_phone: str | None = None
    if email:
        try:
            normalized_email = normalize_email(email)
        except ValueError:
            normalized_email = None
    if phone:
        try:
            normalized_phone = normalize_phone(phone)
        except ValueError:
            normalized_phone = None

    if not lead_id and not (normalized_email and normalized_phone):
        return RazorpayWebhookResult(status="ignored", paymentReference=payment_reference)

    paid_at = datetime.datetime.now(datetime.UTC).isoformat()
    updated_record: dict | None = None
    records: list[dict] = []
    path = custom_report_leads_path()

    if path.exists():
        with path.open(encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    records.append({"raw": line.rstrip("\n")})
                    continue

                matches_lead = bool(lead_id and record.get("leadId") == lead_id)
                matches_identity = (
                    updated_record is None
                    and package_interest
                    and normalized_email
                    and normalized_phone
                    and record.get("email") == normalized_email
                    and record.get("phone") == normalized_phone
                    and record.get("packageInterest") == package_interest
                )
                if updated_record is None and (matches_lead or matches_identity):
                    record["paymentStatus"] = "paid"
                    record["paidAt"] = paid_at
                    record["paymentSource"] = "razorpay_webhook"
                    if payment_reference:
                        record["paymentReference"] = payment_reference
                    if payment_link_id:
                        record["razorpayPaymentLinkId"] = payment_link_id
                    updated_record = record
                records.append(record)

    if not updated_record and package_interest and normalized_email and normalized_phone:
        recovered_hash = hashlib.sha256(
            f"{normalized_email}|{normalized_phone}|{package_interest or ''}|{payment_reference or ''}".encode("utf-8")
        ).hexdigest()[:12]
        updated_record = {
            "leadId": lead_id or f"cr_razorpay_{recovered_hash}",
            "leadType": "email",
            "email": normalized_email,
            "phone": normalized_phone,
            "packageInterest": package_interest,
            "paymentStatus": "paid",
            "paymentSource": "razorpay_webhook",
            "paidAt": paid_at,
            "createdAt": paid_at,
            "source": "razorpay_webhook",
        }
        if payment_reference:
            updated_record["paymentReference"] = payment_reference
        if payment_link_id:
            updated_record["razorpayPaymentLinkId"] = payment_link_id
        records.append(updated_record)

    if not updated_record:
        return RazorpayWebhookResult(status="ignored", paymentReference=payment_reference)

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for record in records:
            if "raw" in record:
                f.write(record["raw"])
            else:
                f.write(json.dumps(record, ensure_ascii=False, sort_keys=True))
            f.write("\n")

    return RazorpayWebhookResult(
        status="recorded",
        leadId=updated_record.get("leadId"),
        paymentReference=payment_reference,
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
