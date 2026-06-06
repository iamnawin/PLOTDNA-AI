from fastapi import APIRouter, Depends, Header, HTTPException

from app.core.auth import get_user_id_from_token
from app.services.custom_report_leads import (
    CustomReportLeadCreate,
    CustomReportLeadResponse,
    store_custom_report_lead,
)

router = APIRouter()


def optional_user_id(authorization: str | None = Header(default=None)) -> str | None:
    if not authorization:
        return None
    prefix = "bearer "
    if not authorization.lower().startswith(prefix):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization[len(prefix) :].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return get_user_id_from_token(token)


@router.post("/custom-report", response_model=CustomReportLeadResponse)
def create_custom_report_lead(
    payload: CustomReportLeadCreate,
    user_id: str | None = Depends(optional_user_id),
) -> CustomReportLeadResponse:
    return store_custom_report_lead(payload, user_id=user_id)
