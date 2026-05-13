"""
POST /api/v1/analyze-brochure
Accepts a PDF or image brochure upload and returns AI-extracted investment data.

Optional: saves extraction to Supabase if SUPABASE_URL + SUPABASE_KEY are configured.
"""
import logging
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from app.services.brochure_parser import parse_brochure, SUPPORTED_MIME_TYPES
from app.services.supabase_writer import save_brochure_extraction

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/analyze-brochure",
    summary="Parse a real estate brochure using Gemini 2.0 Flash",
    description=(
        "Upload a PDF or image brochure. The AI extracts plot area, carpet area, "
        "pricing, RERA number, hidden clauses, location coordinates, and timeline. "
        "Supports India (INR/RERA) and UAE (AED/DLD) brochures."
    ),
    tags=["brochure"],
    response_description="Structured brochure extraction with investment-relevant fields",
)
async def analyze_brochure(
    file: UploadFile = File(..., description="PDF or image brochure (max 10MB)"),
    city_slug: Optional[str] = Form(None, description="City slug hint (e.g. 'hyderabad')"),
    country: Optional[str] = Form("India", description="'India' or 'UAE'"),
    save_to_db: Optional[bool] = Form(False, description="Save extraction to Supabase"),
):
    # ── Validate content type ─────────────────────────────────────────────────
    mime = file.content_type or ""
    if mime not in SUPPORTED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type: '{mime}'. "
                f"Accepted: application/pdf, image/jpeg, image/png, image/webp"
            ),
        )

    # ── Read file bytes ───────────────────────────────────────────────────────
    try:
        file_bytes = await file.read()
    except Exception as exc:
        logger.error("Failed to read upload: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded file",
        )

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    size_mb = len(file_bytes) / (1024 * 1024)
    logger.info(
        "Brochure upload: filename=%s mime=%s size=%.2fMB city=%s country=%s",
        file.filename, mime, size_mb, city_slug, country,
    )

    # ── Parse ─────────────────────────────────────────────────────────────────
    extraction = await parse_brochure(
        file_bytes=file_bytes,
        original_filename=file.filename or "upload",
        mime_type=mime,
    )

    # Override country from form param if extraction didn't detect one
    if country and not extraction.country:
        extraction.country = country

    # Attach city_slug if provided
    result = extraction.to_dict()
    result["city_slug"] = city_slug or ""
    result["file_size_mb"] = round(size_mb, 2)

    # ── Optionally persist to Supabase ────────────────────────────────────────
    if save_to_db and not extraction.extraction_error:
        try:
            db_id = await save_brochure_extraction(extraction, city_slug)
            result["supabase_id"] = db_id
        except Exception as exc:
            logger.warning("Supabase save failed (non-fatal): %s", exc)
            result["supabase_id"] = None

    # Return 206 Partial Content if confidence is low or extraction had an error
    if extraction.extraction_error or extraction.confidence < 0.3:
        return JSONResponse(
            status_code=status.HTTP_206_PARTIAL_CONTENT,
            content={
                "warning": extraction.extraction_error or "Low confidence extraction",
                **result,
            },
        )

    return result


@router.get(
    "/analyze-brochure/supported-formats",
    summary="List supported brochure file formats",
    tags=["brochure"],
)
def supported_formats():
    return {
        "supported_types": list(SUPPORTED_MIME_TYPES.keys()),
        "extensions": list(SUPPORTED_MIME_TYPES.values()),
        "max_size_mb": 10,
        "notes": [
            "PDF: full multi-page analysis, best for complete brochures",
            "Image: single page analysis, good for site maps + floor plans",
            "QR codes in images are parsed for embedded coordinates",
        ],
    }
