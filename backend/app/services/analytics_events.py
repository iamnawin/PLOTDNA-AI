import datetime
import json
import os
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class AnalyticsEventCreate(BaseModel):
    eventId: str = Field(..., min_length=8, max_length=80)
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

    @field_validator("payload")
    @classmethod
    def reject_private_fields(cls, value: dict[str, Any]) -> dict[str, Any]:
        forbidden = {"lat", "latitude", "lng", "longitude", "query", "rawinput", "email", "phone"}

        def check(item: Any) -> None:
            if isinstance(item, dict):
                if forbidden.intersection(str(key).lower() for key in item):
                    raise ValueError("Analytics payload contains a private field")
                for nested in item.values():
                    check(nested)
            elif isinstance(item, list):
                for nested in item:
                    check(nested)

        check(value)
        return value


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
        "eventId": event.eventId,
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


def get_analytics_summary() -> dict[str, Any]:
    path = analytics_events_path()
    if not path.exists():
        return {"uniqueUsers": 0, "sessions": 0, "eventCounts": {}, "topAreas": [], "inputTypes": {}, "feedback": {"yes": 0, "no": 0}}

    records: list[dict[str, Any]] = []
    seen: set[str] = set()
    with path.open(encoding="utf-8") as file:
        for line in file:
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue
            event_id = str(record.get("eventId", ""))
            if event_id and event_id in seen:
                continue
            if event_id:
                seen.add(event_id)
            records.append(record)

    def counts(values: list[str]) -> dict[str, int]:
        result: dict[str, int] = {}
        for value in values:
            if value:
                result[value] = result.get(value, 0) + 1
        return result

    payloads = [record.get("payload", {}) for record in records]
    event_counts = counts([str(record.get("name", "")) for record in records])
    area_counts = counts([str(payload.get("areaSlug", "")) for payload in payloads])
    return {
        "uniqueUsers": len({payload.get("anonymousId") for payload in payloads if payload.get("anonymousId")}),
        "sessions": len({payload.get("sessionId") for payload in payloads if payload.get("sessionId")}),
        "eventCounts": event_counts,
        "topAreas": [{"areaSlug": slug, "count": count} for slug, count in sorted(area_counts.items(), key=lambda item: (-item[1], item[0]))[:10]],
        "inputTypes": counts([str(payload.get("inputType", "")) for payload in payloads]),
        "feedback": counts([str(payload.get("answer", "")) for record, payload in zip(records, payloads) if record.get("name") == "feedback_submitted"]),
    }
