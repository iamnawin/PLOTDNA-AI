from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter
from pydantic import AliasChoices, BaseModel, Field

from app.services.ai_provider import (
    call_text_model,
    parse_json_object,
)

router = APIRouter()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatContext(BaseModel):
    page: Literal["map", "area", "brochure", "landing"] = "map"
    city_slug: str | None = Field(
        default=None,
        validation_alias=AliasChoices("city_slug", "citySlug"),
    )
    city_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices("city_name", "cityName"),
    )
    area_slug: str | None = Field(
        default=None,
        validation_alias=AliasChoices("area_slug", "areaSlug"),
    )
    area_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices("area_name", "areaName"),
    )
    coords: tuple[float, float] | None = None
    resolution_tier: str | None = Field(
        default=None,
        validation_alias=AliasChoices("resolution_tier", "resolutionTier"),
    )
    resolution_label: str | None = Field(
        default=None,
        validation_alias=AliasChoices("resolution_label", "resolutionLabel"),
    )
    summary: str | None = None


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    context: ChatContext | None = None
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    followups: list[str]
    source: Literal["gemini", "nvidia", "fallback"]
    model: str | None = None
    last_updated: str


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_history(history: list[ChatMessage]) -> str:
    if not history:
        return "No prior conversation."
    lines: list[str] = []
    for item in history[-6:]:
        role = "User" if item.role == "user" else "Assistant"
        lines.append(f"{role}: {item.content.strip()}")
    return "\n".join(lines)


def _build_prompt(question: str, context: ChatContext | None, history: list[ChatMessage]) -> str:
    ctx = context or ChatContext()
    coords = ""
    if ctx.coords:
        coords = f"{ctx.coords[0]:.5f}, {ctx.coords[1]:.5f}"

    context_lines = [
        f"Page: {ctx.page}",
        f"City: {ctx.city_name or 'unknown'}",
        f"Area: {ctx.area_name or 'unknown'}",
        f"Area slug: {ctx.area_slug or 'unknown'}",
        f"City slug: {ctx.city_slug or 'unknown'}",
        f"Coordinates: {coords or 'not provided'}",
        f"Resolution tier: {ctx.resolution_tier or 'unknown'}",
        f"Resolution label: {ctx.resolution_label or 'unknown'}",
        f"Summary: {ctx.summary or 'none'}",
    ]

    return f"""You are PlotDNA's chat assistant for Indian real-estate research.
Answer the user's question using only the supplied context.
Do not invent listings, prices, approvals, or growth claims that are not in the context.
If the context is narrow or approximate, say so plainly.
Keep the answer concise, practical, and mobile-friendly.

CONTEXT:
{chr(10).join(context_lines)}

RECENT CHAT:
{_normalize_history(history)}

USER QUESTION:
{question.strip()}

Return valid JSON only with this shape:
{{
  "answer": "2-4 short sentences",
  "sources": ["short source label 1", "short source label 2"],
  "followups": ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
}}

Rules:
- Prefer simple guidance over long explanation.
- Mention when the context is approximate or city-level.
- Do not include markdown fences.
"""


def _fallback_response(request: ChatRequest) -> ChatResponse:
    ctx = request.context or ChatContext()
    target = ctx.area_name or ctx.city_name or "this location"
    if ctx.area_name:
        answer = (
            f"{target} is the right level for a local comparison view. "
            "Use it to compare growth signals, infrastructure, and risk before you shortlist. "
            "I can also compare this with nearby areas or explain the score in plain language."
        )
    else:
        answer = (
            f"I can help you scan {target}, but the current context is still broad. "
            "Use the map, enter coordinates, or open a supported locality to get a tighter answer. "
            "I can still compare the city, point out risks, or suggest the next best area to inspect."
        )

    return ChatResponse(
        answer=answer,
        sources=["PlotDNA static context"],
        followups=[
            "Compare nearby areas",
            "Explain the risk factors",
            "Show the investment case in simple terms",
        ],
        source="fallback",
        model=None,
        last_updated=_now_iso(),
    )


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest):
    prompt = _build_prompt(body.question, body.context, body.history)
    model_result = call_text_model(prompt)

    if model_result is None:
        return _fallback_response(body)

    payload = parse_json_object(model_result.text)
    if not payload:
        return ChatResponse(
            answer=model_result.text.strip(),
            sources=["PlotDNA AI response"],
            followups=[
                "Compare nearby areas",
                "What are the biggest risks?",
                "Turn this into a buy/hold summary",
            ],
            source=model_result.source,
            model=model_result.model,
            last_updated=_now_iso(),
        )

    answer = str(payload.get("answer") or "").strip()
    sources = [str(item).strip() for item in payload.get("sources") or [] if str(item).strip()]
    followups = [str(item).strip() for item in payload.get("followups") or [] if str(item).strip()]

    if not answer:
        answer = model_result.text.strip()
    if not sources:
        sources = ["PlotDNA AI response"]
    if not followups:
        followups = [
            "Compare nearby areas",
            "What are the biggest risks?",
            "Turn this into a buy/hold summary",
        ]

    return ChatResponse(
        answer=answer,
        sources=sources[:4],
        followups=followups[:3],
        source=model_result.source,
        model=model_result.model,
        last_updated=_now_iso(),
    )
