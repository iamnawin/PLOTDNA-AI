from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import require_user_id
from app.core.config import settings
from app.services.entitlements_store import (
    Entitlements,
    consume_search,
    dev_activate_subscription,
    get_entitlements,
    set_email,
)

router = APIRouter()


class EntitlementsResponse(BaseModel):
    free_remaining: int
    free_limit: int
    subscription_active: bool
    subscription_expires_at: str | None
    email: str | None


def _to_response(ent: Entitlements) -> EntitlementsResponse:
    return EntitlementsResponse(
        free_remaining=ent.free_remaining,
        free_limit=int(settings.FREE_SEARCH_LIMIT),
        subscription_active=ent.subscription_active,
        subscription_expires_at=ent.subscription_expires_at,
        email=ent.email,
    )


@router.get("", response_model=EntitlementsResponse)
def me(user_id: str = Depends(require_user_id)):
    return _to_response(get_entitlements(user_id))


@router.post("/consume", response_model=EntitlementsResponse)
def consume(user_id: str = Depends(require_user_id)):
    ent = consume_search(user_id)
    if not ent.subscription_active and not ent.email and ent.free_remaining <= 0:
        raise HTTPException(status_code=403, detail="Email required")
    return _to_response(ent)


class EmailRequest(BaseModel):
    email: str


@router.post("/email", response_model=EntitlementsResponse)
def attach_email(body: EmailRequest, user_id: str = Depends(require_user_id)):
    email = body.email.strip()
    if "@" not in email or "." not in email or len(email) < 6 or len(email) > 254:
        raise HTTPException(status_code=400, detail="Invalid email")
    return _to_response(set_email(user_id, email))


class DevActivateRequest(BaseModel):
    days: int = 30


@router.post("/dev/activate", response_model=EntitlementsResponse)
def dev_activate(body: DevActivateRequest, user_id: str = Depends(require_user_id)):
    if settings.APP_ENV == "production":
        raise HTTPException(status_code=404, detail="Not found")
    if body.days < 1 or body.days > 3650:
        raise HTTPException(status_code=400, detail="Invalid days")
    return _to_response(dev_activate_subscription(user_id, days=body.days))
