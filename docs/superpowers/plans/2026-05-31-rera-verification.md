# RERA Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public-beta-safe backend RERA verification endpoint that returns official-source status without overclaiming land/title approval.

**Architecture:** Build a small `app.services.rera_verification` boundary with Pydantic request/result models and state adapters. Register a FastAPI route at `/api/v1/rera/verify`, keep Telangana captcha-safe with manual verification fallback, and add AP support from official status sources in a later adapter pass.

**Tech Stack:** FastAPI, Pydantic v2, httpx where needed, Python stdlib, existing backend compile/smoke flow.

---

## File Structure

- Create `backend/app/services/rera_verification.py`: normalized models, state parsing, disclaimer, adapter interface, Telangana/AP adapter skeletons, and `verify_rera_registration`.
- Create `backend/app/api/routes/rera.py`: FastAPI route that delegates to the service and returns model-dumped JSON.
- Modify `backend/app/main.py`: import and register `rera.router` under `/api/v1/rera`.
- Modify `backend/app/api/routes/brochure.py`: opportunistically attach nullable `rera_verification` without breaking existing brochure response shape.
- Create `backend/tests/test_rera_verification.py`: focused service and route tests.
- Modify `docs/RERA_SOURCE_AUDIT.md` only if implementation learns a new official-source constraint.

## Task 1: Service Models And Telangana Fallback

**Files:**
- Create: `backend/app/services/rera_verification.py`
- Test: `backend/tests/test_rera_verification.py`

- [ ] **Step 1: Write failing service tests**

```python
from app.services.rera_verification import ReraVerificationRequest, verify_rera_registration


def test_telangana_returns_manual_verification_for_captcha_protected_search():
    result = verify_rera_registration(
        ReraVerificationRequest(
            state="Telangana",
            registration_number="P02400001234",
            project_name="Example Heights",
        )
    )

    assert result.state == "telangana"
    assert result.registration_number == "P02400001234"
    assert result.status == "manual_verification_required"
    assert "rerait.telangana.gov.in/SearchList/Search" in result.official_source_url
    assert result.confidence == 0.25
    assert any("captcha" in warning.lower() for warning in result.warnings)
    assert "does not by itself verify land title" in result.disclaimer


def test_unknown_state_is_source_unavailable_with_warning():
    result = verify_rera_registration(
        ReraVerificationRequest(state="Atlantis", registration_number="ABC123")
    )

    assert result.state == "atlantis"
    assert result.status == "source_unavailable"
    assert result.confidence == 0.0
    assert any("unsupported state" in warning.lower() for warning in result.warnings)
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd backend && python -m pytest tests/test_rera_verification.py -q`

Expected: FAIL because `app.services.rera_verification` does not exist.

- [ ] **Step 3: Implement service**

```python
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


VerificationStatus = Literal[
    "verified",
    "not_found",
    "manual_verification_required",
    "source_unavailable",
]

RERA_DISCLAIMER = (
    "RERA registration verifies project disclosure on the official state portal. "
    "It does not by itself verify land title, litigation, every local approval, "
    "or investment safety."
)


class ReraVerificationRequest(BaseModel):
    state: str = Field(..., min_length=2)
    registration_number: str = Field(..., min_length=3)
    project_name: str | None = None
    promoter_name: str | None = None
    address: str | None = None


class ReraVerificationResult(BaseModel):
    state: str
    registration_number: str
    status: VerificationStatus
    project_name: str | None = None
    promoter_name: str | None = None
    project_type: str | None = None
    district: str | None = None
    mandal_or_taluka: str | None = None
    village: str | None = None
    survey_number: str | None = None
    approval_authority: str | None = None
    approval_number: str | None = None
    approval_date: str | None = None
    validity_date: str | None = None
    proposed_completion_date: str | None = None
    quarterly_update_status: str | None = None
    official_source_url: str
    matched_fields: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    confidence: float = 0.0
    last_checked_at: str
    disclaimer: str = RERA_DISCLAIMER


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def normalize_state(value: str) -> str:
    return value.strip().lower().replace("-", "_").replace(" ", "_")


def verify_rera_registration(request: ReraVerificationRequest) -> ReraVerificationResult:
    state = normalize_state(request.state)
    registration_number = request.registration_number.strip()

    if state in {"telangana", "ts", "tg"}:
        return ReraVerificationResult(
            state="telangana",
            registration_number=registration_number,
            status="manual_verification_required",
            project_name=request.project_name,
            promoter_name=request.promoter_name,
            official_source_url="https://rerait.telangana.gov.in/SearchList/Search",
            warnings=[
                "Telangana RERA public search is captcha-protected; verify this registration on the official portal.",
            ],
            confidence=0.25,
            last_checked_at=_now_iso(),
        )

    if state in {"andhra_pradesh", "ap"}:
        return ReraVerificationResult(
            state="andhra_pradesh",
            registration_number=registration_number,
            status="manual_verification_required",
            project_name=request.project_name,
            promoter_name=request.promoter_name,
            official_source_url="https://rera.ap.gov.in/RERA/Views/Project.aspx",
            warnings=[
                "AP RERA lookup needs a matched official project detail link or status report entry before automated verification.",
            ],
            confidence=0.25,
            last_checked_at=_now_iso(),
        )

    return ReraVerificationResult(
        state=state,
        registration_number=registration_number,
        status="source_unavailable",
        official_source_url="",
        warnings=[f"Unsupported state for beta RERA verification: {request.state}"],
        confidence=0.0,
        last_checked_at=_now_iso(),
    )
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd backend && python -m pytest tests/test_rera_verification.py -q`

Expected: PASS.

## Task 2: API Route Registration

**Files:**
- Create: `backend/app/api/routes/rera.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_rera_verification.py`

- [ ] **Step 1: Add route test**

```python
from fastapi.testclient import TestClient

from app.main import app


def test_rera_verify_route_returns_manual_status_for_telangana():
    client = TestClient(app)

    response = client.post(
        "/api/v1/rera/verify",
        json={"state": "Telangana", "registration_number": "P02400001234"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["state"] == "telangana"
    assert body["status"] == "manual_verification_required"
    assert body["registration_number"] == "P02400001234"
```

- [ ] **Step 2: Run route test to verify failure**

Run: `cd backend && python -m pytest tests/test_rera_verification.py::test_rera_verify_route_returns_manual_status_for_telangana -q`

Expected: FAIL with 404 or import error because the route is not registered.

- [ ] **Step 3: Implement route and register it**

Create `backend/app/api/routes/rera.py`:

```python
from fastapi import APIRouter

from app.services.rera_verification import ReraVerificationRequest, ReraVerificationResult, verify_rera_registration

router = APIRouter()


@router.post("/verify", response_model=ReraVerificationResult)
def verify_rera(request: ReraVerificationRequest) -> ReraVerificationResult:
    return verify_rera_registration(request)
```

Modify `backend/app/main.py`:

```python
from app.api.routes import ai, areas, auth, avm, brochure, entitlements, market_pulse, news, rera, satellite, score, utils, verdict

app.include_router(rera.router, prefix="/api/v1/rera", tags=["rera"])
```

- [ ] **Step 4: Run route test to verify pass**

Run: `cd backend && python -m pytest tests/test_rera_verification.py -q`

Expected: PASS.

## Task 3: Brochure Optional Attachment

**Files:**
- Modify: `backend/app/api/routes/brochure.py`
- Test: `backend/tests/test_rera_verification.py`

- [ ] **Step 1: Add helper test**

```python
from app.api.routes.brochure import _build_rera_verification


def test_brochure_rera_verification_is_nullable_when_no_rera_number():
    assert _build_rera_verification({"rera_number": None, "rera_state": "Telangana"}) is None


def test_brochure_rera_verification_uses_extracted_state_and_number():
    result = _build_rera_verification(
        {
            "rera_number": "P02400001234",
            "rera_state": "Telangana",
            "project_name": "Example Heights",
        }
    )

    assert result is not None
    assert result["state"] == "telangana"
    assert result["status"] == "manual_verification_required"
```

- [ ] **Step 2: Run helper tests to verify failure**

Run: `cd backend && python -m pytest tests/test_rera_verification.py -q`

Expected: FAIL because `_build_rera_verification` does not exist.

- [ ] **Step 3: Implement helper and attach result**

In `backend/app/api/routes/brochure.py` import:

```python
from app.services.rera_verification import ReraVerificationRequest, verify_rera_registration
```

Add helper:

```python
def _build_rera_verification(result: dict) -> dict | None:
    rera_number = (result.get("rera_number") or "").strip()
    rera_state = (result.get("rera_state") or "").strip()
    if not rera_number or not rera_state:
        return None

    verification = verify_rera_registration(
        ReraVerificationRequest(
            state=rera_state,
            registration_number=rera_number,
            project_name=result.get("project_name"),
        )
    )
    return verification.model_dump()
```

After `result["file_size_mb"] = round(size_mb, 2)` add:

```python
result["rera_verification"] = _build_rera_verification(result)
```

- [ ] **Step 4: Run helper tests to verify pass**

Run: `cd backend && python -m pytest tests/test_rera_verification.py -q`

Expected: PASS.

## Task 4: Verification And Commit

**Files:**
- Verify all changed backend files and docs.

- [ ] **Step 1: Compile backend**

Run: `cd backend && python -m compileall app`

Expected: exit code 0.

- [ ] **Step 2: Run public beta smoke**

Run from repo root: `python scripts\public_beta_smoke.py`

Expected: core smoke checks pass; optional provider keys may still be reported missing.

- [ ] **Step 3: Confirm route registration**

Run: `cd backend && python - <<'PY'
from app.main import app
print([route.path for route in app.routes if "rera" in route.path])
PY`

Expected output includes `/api/v1/rera/verify`.

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/rera_verification.py backend/app/api/routes/rera.py backend/app/main.py backend/app/api/routes/brochure.py backend/tests/test_rera_verification.py docs/superpowers/plans/2026-05-31-rera-verification.md
git commit -m "Add beta-safe RERA verification"
```

Use Lore trailers with constraints around captcha, official source scope, and verification commands.

## Self-Review

- Spec coverage: Route, service boundary, Telangana captcha fallback, AP placeholder adapter behavior, brochure nullable attachment, disclaimer, and tests are covered.
- Placeholder scan: This plan intentionally avoids unresolved placeholders and defines concrete files, functions, commands, and expected outcomes.
- Type consistency: `ReraVerificationRequest`, `ReraVerificationResult`, `verify_rera_registration`, and `_build_rera_verification` are used consistently across tasks.
