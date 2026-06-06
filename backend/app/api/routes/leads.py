from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from app.core.auth import get_user_id_from_token, require_user_id
from app.services.custom_report_leads import (
    CustomReportLeadCreate,
    CustomReportLeadResponse,
    self_confirm_custom_report_payment,
    store_custom_report_lead,
)
from app.services.entitlements_store import Entitlements, activate_paid_subscription

router = APIRouter()


class EntitlementsResponse(BaseModel):
    free_remaining: int
    free_limit: int
    subscription_active: bool
    subscription_expires_at: str | None
    email: str | None
    name: str | None


class SelfConfirmPaymentRequest(BaseModel):
    paymentReference: str | None = None


class SelfConfirmPaymentResponse(BaseModel):
    leadId: str
    paymentStatus: str
    paidAt: str
    entitlements: EntitlementsResponse


def _to_entitlements_response(entitlements: Entitlements) -> EntitlementsResponse:
    from app.core.config import settings

    return EntitlementsResponse(
        free_remaining=entitlements.free_remaining,
        free_limit=int(settings.FREE_SEARCH_LIMIT),
        subscription_active=entitlements.subscription_active,
        subscription_expires_at=entitlements.subscription_expires_at,
        email=entitlements.email,
        name=entitlements.name,
    )


def optional_user_id(authorization: str | None = Header(default=None)) -> str | None:
    if not authorization:
        return None
    prefix = "bearer "
    if not authorization.lower().startswith(prefix):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization[len(prefix) :].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return get_user_id_from_token(token)


@router.post("/custom-report", response_model=CustomReportLeadResponse)
def create_custom_report_lead(
    payload: CustomReportLeadCreate,
    user_id: str | None = Depends(optional_user_id),
) -> CustomReportLeadResponse:
    return store_custom_report_lead(payload, user_id=user_id)


@router.post("/custom-report/{lead_id}/self-confirm-payment", response_model=SelfConfirmPaymentResponse)
def self_confirm_payment(
    lead_id: str,
    body: SelfConfirmPaymentRequest,
    user_id: str = Depends(require_user_id),
) -> SelfConfirmPaymentResponse:
    confirmed = self_confirm_custom_report_payment(
        lead_id=lead_id,
        user_id=user_id,
        payment_reference=body.paymentReference,
    )
    if not confirmed:
        raise HTTPException(status_code=404, detail="Lead not found")

    entitlements = activate_paid_subscription(user_id, email=confirmed.email)
    return SelfConfirmPaymentResponse(
        leadId=confirmed.leadId,
        paymentStatus=confirmed.paymentStatus,
        paidAt=confirmed.paidAt,
        entitlements=_to_entitlements_response(entitlements),
    )
