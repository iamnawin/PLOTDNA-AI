from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.services.entitlements_store import _connect, _init, normalize_email


PACKAGE_AMOUNT_PAISE = {
    "instant_pdf_99": 9_900,
    "custom_due_diligence_499": 49_900,
}


@dataclass(frozen=True)
class VerifiedPayment:
    provider_payment_id: str
    email: str
    phone: str
    package_interest: str
    amount: int
    currency: str
    lead_id: str | None
    paid_at: str


def record_verified_payment(payment: VerifiedPayment) -> bool:
    normalized_email = normalize_email(payment.email)
    expected_amount = PACKAGE_AMOUNT_PAISE.get(payment.package_interest)
    if expected_amount is None:
        raise ValueError("Unsupported report package.")
    if payment.amount != expected_amount or payment.currency != "INR":
        raise ValueError("Verified payment amount or currency does not match the package.")
    if not payment.provider_payment_id.startswith("pay_"):
        raise ValueError("Verified payment is missing a Razorpay payment ID.")

    expires_at = (datetime.now(timezone.utc) + timedelta(days=3650)).isoformat()
    connection = _connect()
    try:
        _init(connection)
        cursor = connection.execute(
            """
            INSERT OR IGNORE INTO payments (
              provider_payment_id, email, phone, package_interest, amount,
              currency, status, lead_id, paid_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'captured', ?, ?, ?)
            """,
            (
                payment.provider_payment_id,
                normalized_email,
                payment.phone,
                payment.package_interest,
                payment.amount,
                payment.currency,
                payment.lead_id,
                payment.paid_at,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        connection.execute(
            """
            INSERT INTO identity_entitlements (
              email, is_active, expires_at, provider_payment_id, updated_at
            ) VALUES (?, 1, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
              is_active = 1,
              expires_at = excluded.expires_at,
              provider_payment_id = excluded.provider_payment_id,
              updated_at = excluded.updated_at
            """,
            (
                normalized_email,
                expires_at,
                payment.provider_payment_id,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        connection.commit()
        return cursor.rowcount == 1
    finally:
        connection.close()
