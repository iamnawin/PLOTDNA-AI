from fastapi import APIRouter

from app.services.analytics_events import (
    AnalyticsEventCreate,
    AnalyticsEventResponse,
    store_analytics_event,
)

router = APIRouter()


@router.post("/events", response_model=AnalyticsEventResponse)
def create_analytics_event(event: AnalyticsEventCreate) -> AnalyticsEventResponse:
    return store_analytics_event(event)
