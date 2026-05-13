"""
Multimodal Brochure Parser — Gemini 2.0 Flash
Accepts a real estate PDF/Image brochure and extracts structured investment data.

Supports: India (INR, RERA) and UAE (AED, DLD)
"""
import os
import json
import time
import logging
import tempfile
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

SUPPORTED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_FILE_SIZE_MB = int(os.getenv("MAX_BROCHURE_SIZE_MB", "10"))


# ── Data model ────────────────────────────────────────────────────────────────

@dataclass
class BrochureExtraction:
    project_name: str = ""
    developer_name: str = ""
    country: str = "India"                 # "India" | "UAE"
    currency: str = "INR"                  # "INR" | "AED"
    city: str = ""

    # Area measurements
    plot_area_sqft: Optional[float] = None
    carpet_area_sqft: Optional[float] = None
    super_builtup_sqft: Optional[float] = None
    loading_percentage: Optional[float] = None   # e.g. 20.0 means 20%

    # Location
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: str = ""

    # Timeline
    launch_date: Optional[str] = None
    possession_date: Optional[str] = None

    # Pricing
    price_per_sqft: Optional[float] = None
    total_price_range: Optional[str] = None      # e.g. "₹2.04Cr – ₹2.20Cr"

    # Compliance
    rera_number: Optional[str] = None            # India RERA / UAE DLD permit
    rera_state: Optional[str] = None             # e.g. "Telangana", "Maharashtra"

    # Hidden clauses / red flags
    hidden_clauses: list[str] = field(default_factory=list)

    # Extraction metadata
    confidence: float = 0.0                      # 0–1
    raw_text_excerpt: str = ""
    source: str = "gemini-2.0-flash"
    extraction_error: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """You are a Real Estate Document Intelligence Engine specializing in India and UAE property markets.

Your task: Analyze the uploaded real estate brochure (PDF or image) and extract structured data.

EXTRACTION RULES:
1. Plot/Site Area: The total site footprint. Look for "plot area", "site area", "land area".
2. Carpet Area: The actual usable area inside walls. Reject "super built-up" as carpet area.
3. Loading Percentage: If brochure mentions "super built-up" and a different "carpet area", calculate: ((super_builtup - carpet) / super_builtup) * 100.
4. Hidden clauses: Extract any text with asterisks (*), footnotes, small print, or phrases like:
   - "subject to", "applicable charges extra", "GST extra", "parking extra", "loading"
   - "possession subject to", "force majeure", "authority approvals"
5. Location: If a QR code, map image, or address is visible, extract lat/lng or full address.
6. Currency: If ₹ or "Cr" or "Lakh" appears → currency = "INR", country = "India". If "AED" or "Dirham" → currency = "AED", country = "UAE".
7. RERA: Extract RERA number if visible (format varies by state: P02400001234 or MahaRERA/P51800012345).
8. Dates: Format as "Month YYYY" or "YYYY-QN" (e.g. "Dec 2027" or "2024-Q1").
9. Confidence: Rate 0.0–1.0 how complete and clear the document is.

RESPOND ONLY with valid JSON — no markdown, no explanation outside JSON:
{
  "project_name": "<string>",
  "developer_name": "<string or empty>",
  "country": "<India or UAE>",
  "currency": "<INR or AED>",
  "city": "<city name or empty>",
  "plot_area_sqft": <number or null>,
  "carpet_area_sqft": <number or null>,
  "super_builtup_sqft": <number or null>,
  "loading_percentage": <number or null>,
  "latitude": <float or null>,
  "longitude": <float or null>,
  "address": "<full address or empty>",
  "launch_date": "<string or null>",
  "possession_date": "<string or null>",
  "price_per_sqft": <number or null>,
  "total_price_range": "<string or null>",
  "rera_number": "<string or null>",
  "rera_state": "<state name or null>",
  "hidden_clauses": ["<clause 1>", "<clause 2>"],
  "confidence": <float 0.0-1.0>,
  "raw_text_excerpt": "<first 400 chars of extracted text>"
}"""


# ── Gemini caller ─────────────────────────────────────────────────────────────

def _configure_genai():
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    genai.configure(api_key=settings.GEMINI_API_KEY)


def _upload_file(file_path: str, mime_type: str) -> genai.types.File:
    """Upload file to Gemini Files API and wait for processing."""
    uploaded = genai.upload_file(path=file_path, mime_type=mime_type)
    # Poll until active (PDFs take a few seconds)
    for _ in range(20):
        f = genai.get_file(uploaded.name)
        if f.state.name == "ACTIVE":
            return f
        if f.state.name == "FAILED":
            raise RuntimeError(f"Gemini file processing failed: {f.name}")
        time.sleep(1.5)
    raise TimeoutError("Gemini file processing timed out after 30s")


def _call_gemini_vision(uploaded_file: genai.types.File) -> dict:
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=_SYSTEM_PROMPT,
    )
    response = model.generate_content(
        [uploaded_file, "Extract all real estate investment data from this brochure."],
        generation_config=genai.GenerationConfig(
            temperature=0.1,        # low temp for structured extraction
            max_output_tokens=1500,
            response_mime_type="application/json",
        ),
    )
    raw = response.text.strip()
    # Strip markdown fences if model ignores response_mime_type hint
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def _cleanup_file(name: str):
    """Delete file from Gemini Files API after extraction."""
    try:
        genai.delete_file(name)
    except Exception:
        pass  # Non-critical


# ── Fallback ──────────────────────────────────────────────────────────────────

def _fallback_extraction(reason: str) -> BrochureExtraction:
    return BrochureExtraction(
        project_name="Unknown Project",
        confidence=0.0,
        extraction_error=f"Extraction unavailable: {reason}",
        source="fallback",
    )


# ── Public API ────────────────────────────────────────────────────────────────

async def parse_brochure(
    file_bytes: bytes,
    original_filename: str,
    mime_type: str,
) -> BrochureExtraction:
    """
    Parse a real estate brochure using Gemini 2.0 Flash vision.

    Args:
        file_bytes: Raw file content (PDF or image)
        original_filename: Original upload filename
        mime_type: MIME type (e.g. "application/pdf", "image/jpeg")

    Returns:
        BrochureExtraction dataclass with all extracted fields
    """
    # Validate MIME type
    if mime_type not in SUPPORTED_MIME_TYPES:
        return _fallback_extraction(
            f"Unsupported file type: {mime_type}. "
            f"Supported: {', '.join(SUPPORTED_MIME_TYPES.keys())}"
        )

    # Validate size
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        return _fallback_extraction(
            f"File too large: {size_mb:.1f}MB. Max: {MAX_FILE_SIZE_MB}MB"
        )

    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set — returning fallback extraction")
        return _fallback_extraction("Gemini API key not configured")

    # Write to temp file for Gemini Files API
    suffix = SUPPORTED_MIME_TYPES[mime_type]
    tmp_path = None
    uploaded_file = None

    try:
        _configure_genai()

        with tempfile.NamedTemporaryFile(
            suffix=suffix, delete=False,
            dir=os.getenv("UPLOAD_TEMP_DIR", tempfile.gettempdir())
        ) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        logger.info("Uploading brochure to Gemini Files API: %s (%s MB)", original_filename, f"{size_mb:.2f}")
        uploaded_file = _upload_file(tmp_path, mime_type)

        logger.info("Calling Gemini 2.0 Flash vision extraction")
        raw_data = _call_gemini_vision(uploaded_file)

        extraction = BrochureExtraction(
            project_name=raw_data.get("project_name", ""),
            developer_name=raw_data.get("developer_name", ""),
            country=raw_data.get("country", "India"),
            currency=raw_data.get("currency", "INR"),
            city=raw_data.get("city", ""),
            plot_area_sqft=raw_data.get("plot_area_sqft"),
            carpet_area_sqft=raw_data.get("carpet_area_sqft"),
            super_builtup_sqft=raw_data.get("super_builtup_sqft"),
            loading_percentage=raw_data.get("loading_percentage"),
            latitude=raw_data.get("latitude"),
            longitude=raw_data.get("longitude"),
            address=raw_data.get("address", ""),
            launch_date=raw_data.get("launch_date"),
            possession_date=raw_data.get("possession_date"),
            price_per_sqft=raw_data.get("price_per_sqft"),
            total_price_range=raw_data.get("total_price_range"),
            rera_number=raw_data.get("rera_number"),
            rera_state=raw_data.get("rera_state"),
            hidden_clauses=raw_data.get("hidden_clauses", []),
            confidence=float(raw_data.get("confidence", 0.5)),
            raw_text_excerpt=raw_data.get("raw_text_excerpt", "")[:500],
            source="gemini-2.0-flash",
        )

        logger.info(
            "Brochure parsed: project=%s confidence=%.2f country=%s",
            extraction.project_name, extraction.confidence, extraction.country
        )
        return extraction

    except Exception as exc:
        logger.error("Brochure parsing failed: %s", exc)
        return _fallback_extraction(str(exc))

    finally:
        if tmp_path and Path(tmp_path).exists():
            Path(tmp_path).unlink(missing_ok=True)
        if uploaded_file:
            _cleanup_file(uploaded_file.name)
