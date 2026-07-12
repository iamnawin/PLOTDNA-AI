from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import require_user_id
from app.core.config import settings

from app.services.analytics_events import (
    AnalyticsEventCreate,
    AnalyticsEventResponse,
    store_analytics_event,
    get_analytics_summary,
)

router = APIRouter()


@router.post("/events", response_model=AnalyticsEventResponse)
def create_analytics_event(event: AnalyticsEventCreate) -> AnalyticsEventResponse:
    return store_analytics_event(event)


@router.get("/admin/summary")
def analytics_summary(user_id: str = Depends(require_user_id)) -> dict[str, Any]:
    allowed = {value.strip() for value in settings.ADMIN_ACCESS_USER_IDS.split(",") if value.strip()}
    if user_id not in allowed:
        raise HTTPException(status_code=403, detail="Admin access required")
    return get_analytics_summary()
