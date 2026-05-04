from fastapi import APIRouter
from pydantic import BaseModel

from app.core.auth import create_access_token, create_anonymous_user_id
from app.services.entitlements_store import ensure_user

router = APIRouter()


class AnonymousAuthResponse(BaseModel):
    user_id: str
    access_token: str
    token_type: str = "bearer"


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

