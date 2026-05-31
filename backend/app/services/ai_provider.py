from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Optional

import httpx
import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class TextModelResult:
    text: str
    source: str
    model: str


@dataclass
class JsonModelResult:
    data: dict
    source: str
    model: str


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def csv_values(value: str) -> list[str]:
    return _split_csv(value)


def _strip_wrappers(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1].strip()
            if text.startswith("json"):
                text = text[4:].strip()
    return text


def _extract_gemini_text(response: object) -> str:
    text = getattr(response, "text", "") or ""
    return text.strip()


def call_gemini_text(
    prompt: str,
    *,
    models: Optional[list[str]] = None,
    temperature: float = 0.3,
    max_output_tokens: int = 700,
) -> Optional[TextModelResult]:
    if not settings.GEMINI_API_KEY:
        return None

    genai.configure(api_key=settings.GEMINI_API_KEY)
    candidates = models or _split_csv(settings.GEMINI_CHAT_MODELS) or ["gemini-1.5-flash"]

    for model_name in candidates:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                ),
            )
            text = _extract_gemini_text(response)
            if text:
                return TextModelResult(text=text, source="gemini", model=model_name)
        except Exception as exc:  # pragma: no cover - network/model failures are runtime dependent
            logger.warning("Gemini text call failed for %s: %s", model_name, exc)

    return None


def call_gemini_content_json(
    content: list[object],
    models: Optional[list[str]] = None,
    *,
    system_instruction: str = "",
    temperature: float = 0.2,
    max_output_tokens: int = 1000,
) -> JsonModelResult:
    if not settings.GEMINI_API_KEY:
        return JsonModelResult(data={}, source="fallback", model="")

    genai.configure(api_key=settings.GEMINI_API_KEY)
    candidates = models or _split_csv(settings.GEMINI_CHAT_MODELS) or ["gemini-1.5-flash"]

    for model_name in candidates:
        try:
            model = genai.GenerativeModel(
                model_name,
                system_instruction=system_instruction or None,
            )
            response = model.generate_content(
                content,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                    response_mime_type="application/json",
                ),
            )
            text = _extract_gemini_text(response)
            data = parse_json_object(text)
            if data:
                return JsonModelResult(data=data, source=f"gemini:{model_name}", model=model_name)
        except Exception as exc:  # pragma: no cover - network/model failures are runtime dependent
            logger.warning("Gemini JSON content call failed for %s: %s", model_name, exc)

    return JsonModelResult(data={}, source="fallback", model="")


def call_nvidia_text(
    prompt: str,
    *,
    models: Optional[list[str]] = None,
    temperature: float = 0.3,
    max_tokens: int = 700,
) -> Optional[TextModelResult]:
    if not settings.NVIDIA_API_KEY:
        return None

    base_url = settings.NVIDIA_BASE_URL.rstrip("/")
    candidates = models or _split_csv(settings.NVIDIA_CHAT_MODELS) or []
    if not candidates:
        return None

    headers = {
        "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload_template = {
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are PlotDNA, a concise property intelligence assistant. "
                    "Answer using only the provided context and avoid inventing facts."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }

    with httpx.Client(timeout=35.0) as client:
        for model_name in candidates:
            try:
                payload = dict(payload_template)
                payload["model"] = model_name
                response = client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                choices = data.get("choices") or []
                if not choices:
                    continue
                message = choices[0].get("message") or {}
                content = (message.get("content") or "").strip()
                if content:
                    return TextModelResult(text=content, source="nvidia", model=model_name)
            except Exception as exc:  # pragma: no cover - network/model failures are runtime dependent
                logger.warning("NVIDIA text call failed for %s: %s", model_name, exc)

    return None


def call_text_model(prompt: str) -> Optional[TextModelResult]:
    order = _split_csv(settings.AI_PROVIDER_ORDER) or ["gemini", "nvidia"]
    for provider in order:
        if provider == "gemini":
            result = call_gemini_text(prompt)
        elif provider == "nvidia":
            result = call_nvidia_text(prompt)
        elif provider == "fallback":
            return None
        else:
            continue
        if result is not None:
            return result
    return None


def parse_json_object(raw_text: str) -> dict:
    text = _strip_wrappers(raw_text)
    if not text:
        return {}
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                return {}
    return {}
