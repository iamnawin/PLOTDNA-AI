"""
Small AI provider helpers for JSON-only PlotDNA model calls.

Gemini remains the only brochure vision provider. NVIDIA is wired as an
OpenAI-compatible text/chat fallback for verdict-style JSON tasks.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass

import google.generativeai as genai
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class JsonModelResult:
    data: dict
    source: str


def csv_values(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def parse_json_text(raw: str) -> dict:
    text = raw.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.I)
    text = re.sub(r"\s*```$", "", text)
    if not text.startswith("{"):
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]
    return json.loads(text.strip())


def call_gemini_json(
    prompt: str,
    models: list[str],
    *,
    max_output_tokens: int,
    temperature: float = 0.2,
    system_instruction: str | None = None,
) -> JsonModelResult:
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    genai.configure(api_key=settings.GEMINI_API_KEY)
    last_error: Exception | None = None

    for model_name in models:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction,
            )
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                    response_mime_type="application/json",
                ),
            )
            return JsonModelResult(data=parse_json_text(response.text), source=f"gemini:{model_name}")
        except Exception as exc:  # pragma: no cover - depends on external model quota/network
            logger.warning("Gemini JSON call failed with %s: %s", model_name, exc)
            last_error = exc

    raise RuntimeError(f"All Gemini models failed: {last_error}") from last_error


def call_gemini_content_json(
    contents: list,
    models: list[str],
    *,
    max_output_tokens: int,
    temperature: float = 0.1,
    system_instruction: str | None = None,
) -> JsonModelResult:
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    genai.configure(api_key=settings.GEMINI_API_KEY)
    last_error: Exception | None = None

    for model_name in models:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction,
            )
            response = model.generate_content(
                contents,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                    response_mime_type="application/json",
                ),
            )
            return JsonModelResult(data=parse_json_text(response.text), source=f"gemini:{model_name}")
        except Exception as exc:  # pragma: no cover - depends on external model quota/network
            logger.warning("Gemini content call failed with %s: %s", model_name, exc)
            last_error = exc

    raise RuntimeError(f"All Gemini content models failed: {last_error}") from last_error


async def call_nvidia_json(
    prompt: str,
    models: list[str],
    *,
    max_tokens: int,
    temperature: float = 0.2,
    system_prompt: str = "Return only valid JSON. Do not include markdown.",
) -> JsonModelResult:
    if not settings.NVIDIA_API_KEY:
        raise RuntimeError("NVIDIA_API_KEY not configured")

    base_url = settings.NVIDIA_BASE_URL.rstrip("/")
    if base_url.endswith("/chat/completions"):
        base_url = base_url.removesuffix("/chat/completions")
    endpoint = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
        "Content-Type": "application/json",
    }
    last_error: Exception | None = None

    async with httpx.AsyncClient(timeout=45) as client:
        for model_name in models:
            try:
                response = await client.post(
                    endpoint,
                    headers=headers,
                    json={
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                payload = response.json()
                content = payload["choices"][0]["message"]["content"]
                return JsonModelResult(data=parse_json_text(content), source=f"nvidia:{model_name}")
            except Exception as exc:  # pragma: no cover - depends on external model quota/network
                logger.warning("NVIDIA JSON call failed with %s: %s", model_name, exc)
                last_error = exc

    raise RuntimeError(f"All NVIDIA models failed: {last_error}") from last_error
