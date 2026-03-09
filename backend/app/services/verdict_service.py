"""
AI verdict service — generates a "Should you buy here?" verdict
using Gemini Flash, with in-memory 24h caching to control API costs.

Fallback: returns a template verdict if Gemini is unavailable.
"""
import time
import json
import logging
from dataclasses import dataclass
from typing import Optional

import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Data types ────────────────────────────────────────────────────────────────

@dataclass
class Verdict:
    verdict: str           # "buy" | "hold" | "wait" | "avoid"
    confidence: int        # 0–100
    summary: str
    reasons: list[str]     # 3 reasons to consider
    risks: list[str]       # 3 things to be careful about
    suitable_for: str      # "investment" | "end-use" | "both"
    last_updated: str      # ISO timestamp
    source: str            # "gemini" | "fallback"


# ── Cache ─────────────────────────────────────────────────────────────────────

_cache: dict[str, tuple[Verdict, float]] = {}   # key → (verdict, expires_at)
CACHE_TTL = 24 * 3600   # 24 hours


def _cache_key(city_slug: str, area_slug: str) -> str:
    return f"verdict:{city_slug}:{area_slug}"


def _get_cached(city_slug: str, area_slug: str) -> Optional[Verdict]:
    entry = _cache.get(_cache_key(city_slug, area_slug))
    if entry and time.time() < entry[1]:
        return entry[0]
    return None


def _set_cached(city_slug: str, area_slug: str, verdict: Verdict):
    _cache[_cache_key(city_slug, area_slug)] = (verdict, time.time() + CACHE_TTL)


# ── Prompt builder ────────────────────────────────────────────────────────────

def _build_prompt(area_name: str, city_name: str, signals: dict, score: int,
                  price_range: str, yoy: float, recent_news: list[str]) -> str:
    news_block = "\n".join(f"- {n}" for n in recent_news[:5]) if recent_news else "No recent news available."
    signals_block = "\n".join(f"- {k.replace('_', ' ').title()}: {v}/100" for k, v in signals.items())
    return f"""You are PlotDNA, an AI property intelligence assistant for India real estate.

Analyze this micro-market and give a structured investment verdict.

LOCATION: {area_name}, {city_name}
DNA SCORE: {score}/100
PRICE RANGE: {price_range}
YoY GROWTH: +{yoy}%

SIGNAL SCORES (0-100):
{signals_block}

RECENT LOCAL NEWS:
{news_block}

Respond ONLY with valid JSON in exactly this format (no markdown, no explanation outside JSON):
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
- verdict "buy" = strong signal, buy now
- verdict "hold" = good area, wait for right price
- verdict "wait" = area needs 1-2 years to mature
- verdict "avoid" = risk outweighs reward currently
- Be specific to the location, not generic
- Ground everything in the signal scores and news provided
- Do not invent facts"""


# ── Gemini caller ─────────────────────────────────────────────────────────────

def _call_gemini(prompt: str) -> dict:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.3,
            max_output_tokens=600,
        )
    )
    raw = response.text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def _fallback_verdict(area_name: str, score: int) -> Verdict:
    if score >= 80:
        v, conf, suitable = "buy", 65, "both"
        summary = f"{area_name} shows strong growth signals with a high DNA score. Infrastructure and employment drivers are solid."
        reasons = ["High DNA score indicating strong fundamentals", "Strong infrastructure pipeline", "Consistent price appreciation trend"]
        risks   = ["Verify RERA project status before buying", "Check floor-level pricing vs area average", "Confirm legal title and encumbrance status"]
    elif score >= 60:
        v, conf, suitable = "hold", 55, "investment"
        summary = f"{area_name} is a moderate growth zone. Worth watching but wait for the right entry price."
        reasons = ["Decent infrastructure connectivity", "Emerging employment zone", "Improving social infrastructure"]
        risks   = ["Price appreciation pace may be slower", "Limited connectivity to key employment hubs", "Verify RERA compliance of chosen project"]
    else:
        v, conf, suitable = "wait", 45, "end-use"
        summary = f"{area_name} is an early-stage zone with mixed signals. Better suited for end-use than pure investment currently."
        reasons = ["Lower land cost — entry advantage", "Long-term infra plans in pipeline", "Government scheme coverage"]
        risks   = ["Liquidity risk — limited secondary market", "Infrastructure timeline uncertain", "Limited social amenities currently"]

    return Verdict(
        verdict=v, confidence=conf, summary=summary,
        reasons=reasons, risks=risks, suitable_for=suitable,
        last_updated=_now_iso(), source="fallback",
    )


def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


# ── Public API ────────────────────────────────────────────────────────────────

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
) -> Verdict:
    """Return cached or freshly generated AI verdict for an area."""
    cached = _get_cached(city_slug, area_slug)
    if cached:
        return cached

    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set — returning fallback verdict")
        v = _fallback_verdict(area_name, score)
        _set_cached(city_slug, area_slug, v)
        return v

    try:
        prompt = _build_prompt(area_name, city_name, signals, score, price_range, yoy, recent_news)
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
        )
        _set_cached(city_slug, area_slug, verdict)
        return verdict
    except Exception as exc:
        logger.error("Gemini verdict failed for %s/%s: %s", city_slug, area_slug, exc)
        v = _fallback_verdict(area_name, score)
        _set_cached(city_slug, area_slug, v)
        return v
