"""
AI verdict service for PlotDNA.

Gemini is the primary path. When Gemini is unavailable, the fallback path
still respects locality resolution tiers so nearby or cluster-based context
does not read like an exact micro-market call.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from typing import Optional

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class Verdict:
    verdict: str
    confidence: int
    summary: str
    reasons: list[str]
    risks: list[str]
    suitable_for: str
    last_updated: str
    source: str
    resolution_tier: str
    resolution_label: str


@dataclass
class FallbackContext:
    tier: str = "exact_locality"
    label: str = ""


_cache: dict[str, tuple[Verdict, float]] = {}
CACHE_TTL = 24 * 3600


def _normalize_label(value: str) -> str:
    return value.strip().lower().replace(" ", "-")


def _cache_key(city_slug: str, area_slug: str, fallback_context: FallbackContext) -> str:
    return f"verdict:{city_slug}:{area_slug}:{fallback_context.tier}:{_normalize_label(fallback_context.label)}"


def _get_cached(city_slug: str, area_slug: str, fallback_context: FallbackContext) -> Optional[Verdict]:
    entry = _cache.get(_cache_key(city_slug, area_slug, fallback_context))
    if entry and time.time() < entry[1]:
        return entry[0]
    return None


def _set_cached(city_slug: str, area_slug: str, fallback_context: FallbackContext, verdict: Verdict) -> None:
    _cache[_cache_key(city_slug, area_slug, fallback_context)] = (verdict, time.time() + CACHE_TTL)


def _build_resolution_prompt(fallback_context: FallbackContext) -> str:
    if fallback_context.tier == "exact_locality":
        return f"LOCATION CONFIDENCE: exact supported locality match for {fallback_context.label or 'the requested locality'}."
    if fallback_context.tier == "nearby_micro_market":
        return (
            f"LOCATION CONFIDENCE: nearby micro-market proxy using {fallback_context.label or 'a supported area'}.\n"
            "Do not describe the verdict as exact to the searched point. Use nearby or proxy wording."
        )
    if fallback_context.tier == "city_zone_cluster":
        return (
            f"LOCATION CONFIDENCE: broad city-zone context for {fallback_context.label or 'the surrounding zone'}.\n"
            "Keep the verdict high-level and lower-confidence. Do not make street-level claims."
        )
    return (
        f"LOCATION CONFIDENCE: uncovered context for {fallback_context.label or 'the requested point'}.\n"
        "Emphasize that PlotDNA lacks a reliable locality match and avoid precise investment calls."
    )


def _build_prompt(
    area_name: str,
    city_name: str,
    signals: dict,
    score: int,
    price_range: str,
    yoy: float,
    recent_news: list[str],
    fallback_context: FallbackContext,
) -> str:
    news_block = "\n".join(f"- {item}" for item in recent_news[:5]) if recent_news else "No recent news available."
    signals_block = "\n".join(f"- {key.replace('_', ' ').title()}: {value}/100" for key, value in signals.items())
    return f"""You are PlotDNA, an AI property intelligence assistant for India real estate.

Analyze this market context and give a structured investment verdict.

REFERENCE LOCATION: {area_name}, {city_name}
DNA SCORE: {score}/100
PRICE RANGE: {price_range}
YoY GROWTH: +{yoy}%

SIGNAL SCORES (0-100):
{signals_block}

{_build_resolution_prompt(fallback_context)}

RECENT LOCAL NEWS:
{news_block}

Respond ONLY with valid JSON in exactly this format:
{{
  "verdict": "<buy|hold|wait|avoid>",
  "confidence": <integer 0-100>,
  "summary": "<2-3 sentence summary of investment case>",
  "reasons": [
    "<reason 1 to consider buying>",
    "<reason 2 to consider buying>",
    "<reason 3 to consider buying>"
  ],
  "risks": [
    "<risk or caution 1>",
    "<risk or caution 2>",
    "<risk or caution 3>"
  ],
  "suitable_for": "<investment|end-use|both>"
}}

Rules:
- "buy" = strong signal, buy now
- "hold" = good area, wait for the right price
- "wait" = area needs time to mature or coverage is too broad
- "avoid" = risk outweighs reward currently
- Respect the stated location confidence and reduce precision when the context is nearby, cluster-level, or uncovered
- Be specific to the provided signals and news
- Do not invent facts"""


def _call_gemini(prompt: str) -> dict:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.3,
            max_output_tokens=600,
        ),
    )
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def _fallback_verdict(area_name: str, score: int, fallback_context: FallbackContext) -> Verdict:
    resolution_label = fallback_context.label or area_name

    if fallback_context.tier == "city_zone_cluster":
        verdict, confidence, suitable_for = ("hold", 42, "investment") if score >= 80 else ("wait", 36, "investment")
        summary = (
            f"{resolution_label} has useful surrounding-market signals, but PlotDNA only has broad city-zone context here. "
            "Treat this as directional guidance rather than an exact locality call."
        )
        reasons = [
            "Broader zone signals still indicate how active the surrounding corridor is",
            "Infrastructure and employment trends remain useful for shortlist comparison",
            "Live coordinate scoring can add signal without pretending this is an exact micro-market match",
        ]
        risks = [
            "Street-level pricing and livability can diverge sharply within the same zone",
            "This verdict should not be treated as plot-specific advice",
            "Verify connectivity, legal status, and approvals on the exact property",
        ]
    elif fallback_context.tier == "uncovered":
        verdict, confidence, suitable_for = "wait", 24, "end-use"
        summary = (
            f"PlotDNA does not yet have a reliable supported locality match for {resolution_label}. "
            "Any investment call here would be more precise than the coverage supports."
        )
        reasons = [
            "Use live coordinate scoring if the backend is available",
            "Compare against nearby supported markets before inferring pricing",
            "Manual due diligence matters more than area-level proxies here",
        ]
        risks = [
            "Coverage gaps mean lower confidence than supported localities",
            "Nearby proxies can misread road access, amenities, and liquidity",
            "Do not rely on a single fallback score for a purchase decision",
        ]
    elif fallback_context.tier == "nearby_micro_market":
        if score >= 80:
            verdict, confidence, suitable_for = "hold", 52, "both"
        elif score >= 60:
            verdict, confidence, suitable_for = "hold", 48, "investment"
        else:
            verdict, confidence, suitable_for = "wait", 40, "end-use"
        summary = (
            f"{resolution_label} is being used as a nearby micro-market proxy, not an exact locality match. "
            "The signals are useful, but they should be read as approximate context."
        )
        reasons = [
            "Nearby supported market provides a grounded reference point",
            "Infrastructure and employment trends still help frame the surrounding corridor",
            "Useful for comparison before plot-level validation",
        ]
        risks = [
            "Prices can diverge materially even within a few kilometres",
            "Local access roads and amenities may not match the proxy market",
            "Verify approvals, title, and exact connectivity before buying",
        ]
    elif score >= 80:
        verdict, confidence, suitable_for = "buy", 65, "both"
        summary = f"{area_name} shows strong growth signals with a high DNA score. Infrastructure and employment drivers are solid."
        reasons = [
            "High DNA score indicating strong fundamentals",
            "Strong infrastructure pipeline",
            "Consistent price appreciation trend",
        ]
        risks = [
            "Verify RERA project status before buying",
            "Check floor-level pricing versus area average",
            "Confirm legal title and encumbrance status",
        ]
    elif score >= 60:
        verdict, confidence, suitable_for = "hold", 55, "investment"
        summary = f"{area_name} is a moderate growth zone. Worth watching but wait for the right entry price."
        reasons = [
            "Decent infrastructure connectivity",
            "Emerging employment zone",
            "Improving social infrastructure",
        ]
        risks = [
            "Price appreciation pace may be slower",
            "Limited connectivity to key employment hubs",
            "Verify RERA compliance of the chosen project",
        ]
    else:
        verdict, confidence, suitable_for = "wait", 45, "end-use"
        summary = f"{area_name} is an early-stage zone with mixed signals. Better suited for end-use than pure investment currently."
        reasons = [
            "Lower land cost creates an entry advantage",
            "Long-term infrastructure plans are in the pipeline",
            "Government scheme coverage may improve the area over time",
        ]
        risks = [
            "Liquidity risk from a limited secondary market",
            "Infrastructure timelines remain uncertain",
            "Social amenities may still be limited",
        ]

    return Verdict(
        verdict=verdict,
        confidence=confidence,
        summary=summary,
        reasons=reasons,
        risks=risks,
        suitable_for=suitable_for,
        last_updated=_now_iso(),
        source="fallback",
        resolution_tier=fallback_context.tier,
        resolution_label=resolution_label,
    )


def _now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


async def get_verdict(
    city_slug: str,
    area_slug: str,
    area_name: str,
    city_name: str,
    signals: dict,
    score: int,
    price_range: str,
    yoy: float,
    recent_news: list[str],
    fallback_context: Optional[FallbackContext] = None,
) -> Verdict:
    """Return a cached or freshly generated verdict for the given location context."""
    context = fallback_context or FallbackContext(tier="exact_locality", label=area_name)
    cached = _get_cached(city_slug, area_slug, context)
    if cached:
        return cached

    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set. Returning fallback verdict.")
        verdict = _fallback_verdict(area_name, score, context)
        _set_cached(city_slug, area_slug, context, verdict)
        return verdict

    try:
        prompt = _build_prompt(area_name, city_name, signals, score, price_range, yoy, recent_news, context)
        data = _call_gemini(prompt)
        verdict = Verdict(
            verdict=data.get("verdict", "hold"),
            confidence=int(data.get("confidence", 50)),
            summary=data.get("summary", ""),
            reasons=data.get("reasons", [])[:3],
            risks=data.get("risks", [])[:3],
            suitable_for=data.get("suitable_for", "both"),
            last_updated=_now_iso(),
            source="gemini",
            resolution_tier=context.tier,
            resolution_label=context.label or area_name,
        )
        _set_cached(city_slug, area_slug, context, verdict)
        return verdict
    except Exception as exc:  # pragma: no cover - network/model failures are runtime dependent
        logger.error("Gemini verdict failed for %s/%s: %s", city_slug, area_slug, exc)
        verdict = _fallback_verdict(area_name, score, context)
        _set_cached(city_slug, area_slug, context, verdict)
        return verdict
