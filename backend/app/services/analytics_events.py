import datetime
import json
import os
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class AnalyticsEventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    payload: dict[str, Any] = Field(default_factory=dict)
    at: str | None = Field(default=None, max_length=80)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Event name is required.")
        return stripped


class AnalyticsEventResponse(BaseModel):
    status: Literal["success"]


def analytics_events_path() -> Path:
    configured = os.getenv("ANALYTICS_EVENTS_PATH")
    if configured:
        return Path(configured)

    root = Path(__file__).resolve().parents[3]
    return root / "data" / "analytics-events.jsonl"


def store_analytics_event(event: AnalyticsEventCreate) -> AnalyticsEventResponse:
    record = {
        "name": event.name,
        "payload": event.payload,
        "at": event.at,
        "receivedAt": datetime.datetime.now(datetime.UTC).isoformat(),
    }

    path = analytics_events_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False, sort_keys=True))
        f.write("\n")

    return AnalyticsEventResponse(status="success")
