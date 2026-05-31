from fastapi import APIRouter

from app.services.rera_verification import (
    ReraVerificationRequest,
    ReraVerificationResult,
    verify_rera_registration,
)

router = APIRouter()


@router.post("/verify", response_model=ReraVerificationResult)
def verify_rera(request: ReraVerificationRequest) -> ReraVerificationResult:
    return verify_rera_registration(request)
