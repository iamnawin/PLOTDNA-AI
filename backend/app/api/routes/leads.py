from fastapi import APIRouter

from app.services.custom_report_leads import (
    CustomReportLeadCreate,
    CustomReportLeadResponse,
    store_custom_report_lead,
)

router = APIRouter()


@router.post("/custom-report", response_model=CustomReportLeadResponse)
def create_custom_report_lead(payload: CustomReportLeadCreate) -> CustomReportLeadResponse:
    return store_custom_report_lead(payload)
