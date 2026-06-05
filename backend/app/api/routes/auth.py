from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import create_access_token, create_anonymous_user_id, require_user_id
from app.services.entitlements_store import (
    Entitlements,
    ensure_user,
    request_email_otp,
    verify_email_otp,
)

router = APIRouter()


class AnonymousAuthResponse(BaseModel):
    user_id: str
    access_token: str
    token_type: str = "bearer"


class EmailOtpRequest(BaseModel):
    email: str
    name: str | None = None


class EmailOtpRequestResponse(BaseModel):
    email: str
    status: str
    expiresAt: str
    resendAfterSeconds: int
    debugOtp: str | None = None


class EntitlementsResponse(BaseModel):
    free_remaining: int
    free_limit: int
    subscription_active: bool
    subscription_expires_at: str | None
    email: str | None
    name: str | None


class EmailOtpVerifyRequest(BaseModel):
    email: str
    otp: str


class EmailOtpVerifyResponse(BaseModel):
    email: str
    status: str
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


@router.post("/anonymous", response_model=AnonymousAuthResponse)
def anonymous_auth():
    """
    Creates an anonymous user + bearer token.

    Mobile apps should call this once on first launch and persist the token.
    """
    user_id = create_anonymous_user_id()
    ensure_user(user_id)
    token = create_access_token(user_id)
    return AnonymousAuthResponse(user_id=user_id, access_token=token)


@router.post("/email-otp/request", response_model=EmailOtpRequestResponse)
def request_email_code(body: EmailOtpRequest, user_id: str = Depends(require_user_id)):
    try:
        result = request_email_otp(user_id, body.email, body.name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    return EmailOtpRequestResponse(
        email=result.email,
        status=result.status,
        expiresAt=result.expires_at,
        resendAfterSeconds=result.resend_after_seconds,
        debugOtp=result.debug_otp,
    )


@router.post("/email-otp/verify", response_model=EmailOtpVerifyResponse)
def verify_email_code(body: EmailOtpVerifyRequest, user_id: str = Depends(require_user_id)):
    try:
        result = verify_email_otp(user_id, body.email, body.otp)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return EmailOtpVerifyResponse(
        email=result.email,
        status=result.status,
        entitlements=_to_entitlements_response(result.entitlements),
    )

