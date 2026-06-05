from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import require_user_id
from app.core.config import settings
from app.services.entitlements_store import (
    AdminMetrics,
    Entitlements,
    PublicMetrics,
    ReportAccess,
    ReportPackage,
    UserEvent,
    consume_search,
    dev_activate_subscription,
    get_admin_metrics,
    get_entitlements,
    get_public_metrics,
    get_report_access,
    record_user_event,
    touch_user,
)

router = APIRouter()


class EntitlementsResponse(BaseModel):
    free_remaining: int
    free_limit: int
    subscription_active: bool
    subscription_expires_at: str | None
    email: str | None
    name: str | None


class ReportAccessResponse(BaseModel):
    packageInterest: str
    canAccess: bool
    requiresPayment: bool
    reason: str
    email: str | None


class UserEventRequest(BaseModel):
    eventType: str
    areaSlug: str | None = None
    packageInterest: str | None = None
    metadata: str | None = None


class UserEventResponse(BaseModel):
    status: str


class TopDownloadedAreaResponse(BaseModel):
    areaSlug: str
    count: int


class AdminMetricsResponse(BaseModel):
    totalUsers: int
    verifiedEmailUsers: int
    downloadCount: int
    paymentStartedCount: int
    paidUserCount: int
    liveUsers: int
    activeUsersToday: int
    activeUsers7d: int
    activeUsers30d: int
    topDownloadedAreas: list[TopDownloadedAreaResponse]


class PublicMetricsResponse(BaseModel):
    liveUsers: int
    activeUsersToday: int


def _to_response(ent: Entitlements) -> EntitlementsResponse:
    return EntitlementsResponse(
        free_remaining=ent.free_remaining,
        free_limit=int(settings.FREE_SEARCH_LIMIT),
        subscription_active=ent.subscription_active,
        subscription_expires_at=ent.subscription_expires_at,
        email=ent.email,
        name=ent.name,
    )


def _to_report_access_response(access: ReportAccess) -> ReportAccessResponse:
    return ReportAccessResponse(
        packageInterest=access.package_interest,
        canAccess=access.can_access,
        requiresPayment=access.requires_payment,
        reason=access.reason,
        email=access.email,
    )


def _to_metrics_response(metrics: AdminMetrics) -> AdminMetricsResponse:
    return AdminMetricsResponse(
        totalUsers=metrics.total_users,
        verifiedEmailUsers=metrics.verified_email_users,
        downloadCount=metrics.download_count,
        paymentStartedCount=metrics.payment_started_count,
        paidUserCount=metrics.paid_user_count,
        liveUsers=metrics.live_users,
        activeUsersToday=metrics.active_users_today,
        activeUsers7d=metrics.active_users_7d,
        activeUsers30d=metrics.active_users_30d,
        topDownloadedAreas=[
            TopDownloadedAreaResponse(areaSlug=area.area_slug, count=area.count)
            for area in metrics.top_downloaded_areas
        ],
    )


def _to_public_metrics_response(metrics: PublicMetrics) -> PublicMetricsResponse:
    return PublicMetricsResponse(
        liveUsers=metrics.live_users,
        activeUsersToday=metrics.active_users_today,
    )


def _require_admin(user_id: str) -> None:
    allowed = {
        admin_id.strip()
        for admin_id in settings.ADMIN_ACCESS_USER_IDS.split(",")
        if admin_id.strip()
    }
    if user_id not in allowed:
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("", response_model=EntitlementsResponse)
def me(user_id: str = Depends(require_user_id)):
    return _to_response(get_entitlements(user_id))


@router.get("/public/metrics", response_model=PublicMetricsResponse)
def public_metrics():
    return _to_public_metrics_response(get_public_metrics())


@router.get("/report-access", response_model=ReportAccessResponse)
def report_access(packageInterest: ReportPackage, user_id: str = Depends(require_user_id)):
    return _to_report_access_response(get_report_access(user_id, packageInterest))


@router.post("/consume", response_model=EntitlementsResponse)
def consume(user_id: str = Depends(require_user_id)):
    ent = consume_search(user_id)
    if not ent.subscription_active and not ent.email and ent.free_remaining <= 0:
        raise HTTPException(status_code=403, detail="Email required")
    return _to_response(ent)


class EmailRequest(BaseModel):
    email: str


@router.post("/email", response_model=EntitlementsResponse)
def attach_email(body: EmailRequest, user_id: str = Depends(require_user_id)):
    raise HTTPException(status_code=410, detail="Use email OTP verification")


@router.post("/events", response_model=UserEventResponse)
def record_event(body: UserEventRequest, user_id: str = Depends(require_user_id)):
    try:
        record_user_event(
            user_id,
            UserEvent(
                event_type=body.eventType,
                area_slug=body.areaSlug,
                package_interest=body.packageInterest,
                metadata=body.metadata,
            ),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return UserEventResponse(status="recorded")


@router.get("/admin/metrics", response_model=AdminMetricsResponse)
def admin_metrics(user_id: str = Depends(require_user_id)):
    _require_admin(user_id)
    touch_user(user_id)
    return _to_metrics_response(get_admin_metrics())


class DevActivateRequest(BaseModel):
    days: int = 30


@router.post("/dev/activate", response_model=EntitlementsResponse)
def dev_activate(body: DevActivateRequest, user_id: str = Depends(require_user_id)):
    if settings.APP_ENV == "production":
        raise HTTPException(status_code=404, detail="Not found")
    if body.days < 1 or body.days > 3650:
        raise HTTPException(status_code=400, detail="Invalid days")
    return _to_response(dev_activate_subscription(user_id, days=body.days))
