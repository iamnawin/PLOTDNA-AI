from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import Header, HTTPException
from jose import JWTError, jwt

from app.core.config import settings


def create_anonymous_user_id() -> str:
    return str(uuid4())


def create_access_token(user_id: str, *, days: int = 365) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=days)).timestamp()),
        "typ": "anon",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def get_user_id_from_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e

    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    return sub


def require_user_id(
    authorization: str | None = Header(default=None),
) -> str:
    """
    Extract user id from `Authorization: Bearer <token>`.

    We intentionally keep this extremely small for the MVP.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    prefix = "bearer "
    if not authorization.lower().startswith(prefix):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    token = authorization[len(prefix) :].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    return get_user_id_from_token(token)

