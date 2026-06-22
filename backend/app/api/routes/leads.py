import hashlib
import hmac
import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from app.core.auth import get_user_id_from_token, require_user_id
from app.core.config import settings
from app.services.custom_report_leads import (
    CustomReportLeadCreate,
    CustomReportLeadResponse,
    RazorpayWebhookResult,
    confirm_custom_report_payment_from_razorpay,
    recover_custom_report_payment,
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


class RecoverPaymentRequest(BaseModel):
    name: str | None = None
    email: str
    phone: str
    packageInterest: str
    paymentReference: str


class SelfConfirmPaymentResponse(BaseModel):
    leadId: str
    paymentStatus: str
    paidAt: str
    entitlements: EntitlementsResponse


class RazorpayWebhookResponse(BaseModel):
    status: str
    leadId: str | None = None
    paymentReference: str | None = None


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


def _verify_razorpay_signature(body: bytes, signature: str | None) -> None:
    secret = settings.RAZORPAY_WEBHOOK_SECRET.strip()
    if not secret:
        raise HTTPException(status_code=503, detail="Razorpay webhook is not configured")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing Razorpay webhook signature")

    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=400, detail="Invalid Razorpay webhook signature")


@router.post("/custom-report", response_model=CustomReportLeadResponse)
def create_custom_report_lead(
    payload: CustomReportLeadCreate,
    user_id: str | None = Depends(optional_user_id),
) -> CustomReportLeadResponse:
    return store_custom_report_lead(payload, user_id=user_id)


@router.post("/razorpay/webhook", response_model=RazorpayWebhookResponse)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None),
) -> RazorpayWebhookResponse:
    body = await request.body()
    _verify_razorpay_signature(body, x_razorpay_signature)
    try:
        payload = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid Razorpay webhook payload") from exc

    result: RazorpayWebhookResult = confirm_custom_report_payment_from_razorpay(payload)
    return RazorpayWebhookResponse(
        status=result.status,
        leadId=result.leadId,
        paymentReference=result.paymentReference,
    )


@router.post("/custom-report/recover-payment", response_model=SelfConfirmPaymentResponse)
def recover_payment(
    body: RecoverPaymentRequest,
    user_id: str = Depends(require_user_id),
) -> SelfConfirmPaymentResponse:
    try:
        confirmed = recover_custom_report_payment(
            name=body.name,
            email=body.email,
            phone=body.phone,
            package_interest=body.packageInterest,
            payment_reference=body.paymentReference,
            user_id=user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if not confirmed:
        raise HTTPException(status_code=404, detail="Paid lead not found")

    entitlements = activate_paid_subscription(user_id, email=confirmed.email, name=body.name)
    return SelfConfirmPaymentResponse(
        leadId=confirmed.leadId,
        paymentStatus=confirmed.paymentStatus,
        paidAt=confirmed.paidAt,
        entitlements=_to_entitlements_response(entitlements),
    )


@router.post("/custom-report/{lead_id}/self-confirm-payment", response_model=SelfConfirmPaymentResponse)
def self_confirm_payment(
    lead_id: str,
    body: SelfConfirmPaymentRequest,
    user_id: str = Depends(require_user_id),
) -> SelfConfirmPaymentResponse:
    raise HTTPException(
        status_code=410,
        detail="Client payment confirmation is disabled. Access activates after Razorpay verification.",
    )
