from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings


def require_flat_dna_enabled() -> None:
    if not settings.ENABLE_FLAT_DNA:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")


router = APIRouter(dependencies=[Depends(require_flat_dna_enabled)])


@router.get("/status")
def flatdna_status() -> dict[str, str]:
    return {"status": "enabled", "phase": "0A", "registry": "unavailable"}
