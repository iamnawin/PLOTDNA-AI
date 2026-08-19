# FlatDNA Catalog Phase 1 Acquisition Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a production-enforced TG-RERA acquisition approval gate, a deterministic offline acquisition-contract validator, and the Phase 1 governance artifacts without performing automated production ingestion.

**Architecture:** Add a small, pure-Python acquisition-policy boundary under the existing FlatDNA service. A strict JSON policy records whether automated acquisition is approved; a CLI validates the policy without network access. Production acquisition code must call the gate and fail closed until the policy contains explicit approval and complete operating constraints.

**Tech Stack:** Python 3, Pydantic v2, unittest, existing FastAPI backend conventions, `uv` for execution.

---

## File Map

- Create `backend/app/services/flatdna/acquisition.py`: strict acquisition policy model, loader, approval gate, and sanitized summary.
- Modify `backend/app/services/scoring_engine.py`: remove the synthetic TG-RERA density path until approved catalog data exists.
- Create `backend/tests/test_flatdna_acquisition.py`: policy validation and fail-closed behavior.
- Create `scripts/validate_flatdna_acquisition.py`: offline operator validation command.
- Create `data/cities/hyderabad/flatdna/acquisition-policy.json`: checked-in, explicitly unapproved production policy.
- Create `docs/data-sources/tgrera-acquisition-constraints.md`: approved scope, current constraints, and approval procedure.
- Modify `docs/superpowers/specs/2026-08-19-flatdna-hyderabad-catalog-design.md`: Phase 1 implementation receipt.

## Task 1: Add the fail-closed acquisition policy model

**Files:**
- Create: `backend/app/services/flatdna/acquisition.py`
- Test: `backend/tests/test_flatdna_acquisition.py`

- [ ] **Step 1: Write failing policy tests**

Create tests covering strict parsing, rejection of an unapproved policy, rejection of incomplete approved policies, and acceptance of a complete approved policy:

```python
import json
import tempfile
import unittest
from pathlib import Path

from app.services.flatdna.acquisition import (
    AcquisitionApprovalError,
    AcquisitionPolicy,
    ApprovalStatus,
    assert_automated_ingestion_allowed,
    load_acquisition_policy,
)


class FlatDnaAcquisitionPolicyTests(unittest.TestCase):
    def test_unapproved_policy_fails_closed(self):
        policy = AcquisitionPolicy(
            approval_status=ApprovalStatus.UNAPPROVED,
            authority="TG_RERA",
            market="hyderabad_hmda_apartments",
            acquisition_method=None,
            approved_by=None,
            approved_at=None,
            source_identifiers=[],
            operating_constraints=[],
            boundary_version="hmda-boundary-approval-pending",
            classifier_version="residential-apartment-v1",
            completeness_basis="No approved source denominator is available.",
        )

        with self.assertRaises(AcquisitionApprovalError):
            assert_automated_ingestion_allowed(policy)

    def test_complete_approved_policy_allows_automation(self):
        policy = AcquisitionPolicy.model_validate({
            "approval_status": "APPROVED",
            "authority": "TG_RERA",
            "market": "hyderabad_hmda_apartments",
            "acquisition_method": "PERMISSIONED_EXPORT",
            "approved_by": "propertydna-operator",
            "approved_at": "2026-08-19T12:00:00+05:30",
            "source_identifiers": ["approved-export-reference"],
            "operating_constraints": ["daily retrieval", "retain source hash"],
            "boundary_version": "hmda-boundary-v1",
            "classifier_version": "residential-apartment-v1",
            "completeness_basis": "Export row count reconciled per retrieval.",
        })

        assert_automated_ingestion_allowed(policy)

    def test_approved_policy_requires_operating_constraints(self):
        with self.assertRaises(ValueError):
            AcquisitionPolicy.model_validate({
                "approval_status": "APPROVED",
                "authority": "TG_RERA",
                "market": "hyderabad_hmda_apartments",
                "acquisition_method": "PERMISSIONED_EXPORT",
                "approved_by": "propertydna-operator",
                "approved_at": "2026-08-19T12:00:00+05:30",
                "source_identifiers": ["approved-export-reference"],
                "operating_constraints": [],
                "boundary_version": "hmda-boundary-v1",
                "classifier_version": "residential-apartment-v1",
                "completeness_basis": "Export row count reconciled per retrieval.",
            })

    def test_loader_rejects_unknown_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "policy.json"
            path.write_text(json.dumps({
                "approval_status": "UNAPPROVED",
                "authority": "TG_RERA",
                "market": "hyderabad_hmda_apartments",
                "acquisition_method": None,
                "approved_by": None,
                "approved_at": None,
                "source_identifiers": [],
                "operating_constraints": [],
                "boundary_version": "hmda-boundary-approval-pending",
                "classifier_version": "residential-apartment-v1",
                "completeness_basis": "No approved source denominator is available.",
                "unexpected": True,
            }), encoding="utf-8")

            with self.assertRaises(ValueError):
                load_acquisition_policy(path)
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```powershell
uv --directory backend run --with-requirements requirements.txt python -m unittest tests.test_flatdna_acquisition -v
```

Expected: failure because `app.services.flatdna.acquisition` does not exist.

- [ ] **Step 3: Implement the strict model and approval gate**

Implement:

```python
from __future__ import annotations

import json
from datetime import datetime
from enum import Enum
from pathlib import Path

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ApprovalStatus(str, Enum):
    UNAPPROVED = "UNAPPROVED"
    APPROVED = "APPROVED"


class AcquisitionMethod(str, Enum):
    PERMISSIONED_EXPORT = "PERMISSIONED_EXPORT"
    PERMISSIONED_FEED = "PERMISSIONED_FEED"
    APPROVED_PUBLIC_RECORD_IMPORT = "APPROVED_PUBLIC_RECORD_IMPORT"


class AcquisitionApprovalError(RuntimeError):
    pass


class AcquisitionPolicy(BaseModel):
    model_config = ConfigDict(extra="forbid")

    approval_status: ApprovalStatus
    authority: str = Field(min_length=1)
    market: str = Field(min_length=1)
    acquisition_method: AcquisitionMethod | None
    approved_by: str | None
    approved_at: datetime | None
    source_identifiers: list[str]
    operating_constraints: list[str]
    boundary_version: str = Field(min_length=1)
    classifier_version: str = Field(min_length=1)
    completeness_basis: str = Field(min_length=1)

    @model_validator(mode="after")
    def validate_approval_metadata(self):
        if self.approval_status == ApprovalStatus.APPROVED:
            required = (
                self.acquisition_method,
                self.approved_by,
                self.approved_at,
                self.source_identifiers,
                self.operating_constraints,
            )
            if not all(required):
                raise ValueError("approved acquisition policy requires complete approval metadata")
        return self


def load_acquisition_policy(path: str | Path) -> AcquisitionPolicy:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    return AcquisitionPolicy.model_validate(payload)


def assert_automated_ingestion_allowed(policy: AcquisitionPolicy) -> None:
    if policy.approval_status != ApprovalStatus.APPROVED:
        raise AcquisitionApprovalError(
            "Automated TG-RERA production ingestion is not approved."
        )
```

- [ ] **Step 4: Run the focused tests**

Run the same unittest command.

Expected: all acquisition-policy tests pass.

- [ ] **Step 5: Remove the synthetic TG-RERA runtime scoring path**

Add a failing test proving identical OSM counts produce the same RERA proxy inside and outside Telangana and no synthetic “RERA projects nearby” highlight. Then replace the `tsrera_scraper` branch in `backend/app/services/scoring_engine.py` with the existing OSM residential-plus-construction proxy for every region.

- [ ] **Step 6: Re-run the focused tests**

Run the focused command from Step 2. Expected: policy and scoring-source tests pass without importing `tsrera_scraper`.

## Task 2: Add the checked-in unapproved policy and offline validator

**Files:**
- Create: `data/cities/hyderabad/flatdna/acquisition-policy.json`
- Create: `scripts/validate_flatdna_acquisition.py`
- Modify: `backend/tests/test_flatdna_acquisition.py`

- [ ] **Step 1: Add a failing test for the repository policy**

Add a test that loads the checked-in policy, asserts `UNAPPROVED`, and verifies the production gate rejects it.

- [ ] **Step 2: Run the test and verify failure**

Expected: failure because the policy file does not exist.

- [ ] **Step 3: Add the explicit unapproved policy**

Create this policy without credentials or speculative approval:

```json
{
  "approval_status": "UNAPPROVED",
  "authority": "TG_RERA",
  "market": "hyderabad_hmda_apartments",
  "acquisition_method": null,
  "approved_by": null,
  "approved_at": null,
  "source_identifiers": [],
  "operating_constraints": [],
  "boundary_version": "hmda-boundary-approval-pending",
  "classifier_version": "residential-apartment-v1",
  "completeness_basis": "No approved machine-readable TG-RERA source denominator is available."
}
```

- [ ] **Step 4: Add the offline validator**

The command accepts `--policy` and optional `--require-approved`. It prints only sanitized policy fields. With the checked-in policy it exits zero in validation mode and non-zero with `--require-approved`.

- [ ] **Step 5: Verify both CLI paths**

Run:

```powershell
uv run --with-requirements backend/requirements.txt python scripts/validate_flatdna_acquisition.py
uv run --with-requirements backend/requirements.txt python scripts/validate_flatdna_acquisition.py --require-approved
```

Expected: the first reports a valid `UNAPPROVED` policy and exits 0; the second reports the acquisition hard gate and exits 1.

## Task 3: Document acquisition constraints and the approval boundary

**Files:**
- Create: `docs/data-sources/tgrera-acquisition-constraints.md`
- Modify: `docs/DATA_SOURCES.md`

- [ ] **Step 1: Write the source-governance document**

Document the approved catalog scope, current `UNAPPROVED` state, prohibited behavior, required approval evidence, boundary/classifier decisions, completeness measures, and the exact operator validation command.

- [ ] **Step 2: Correct the central data-source summary**

Update the TG-RERA row to point to the governance document and state that production automation is blocked until approval rather than implying scraping is available.

- [ ] **Step 3: Run documentation checks**

Run:

```powershell
rg -n "UNAPPROVED|captcha|completeness|boundary|classifier|validate_flatdna_acquisition" docs/data-sources/tgrera-acquisition-constraints.md docs/DATA_SOURCES.md
```

Expected: each acquisition hard-gate concept is present and no credentials or undocumented endpoint appear.

## Task 4: Record and verify the Phase 1 receipt

**Files:**
- Modify: `docs/superpowers/specs/2026-08-19-flatdna-hyderabad-catalog-design.md`

- [ ] **Step 1: Run Phase 1 verification**

Run:

```powershell
uv --directory backend run --with-requirements requirements.txt python -m unittest tests.test_flatdna_acquisition -v
uv run --with-requirements backend/requirements.txt python scripts/validate_flatdna_acquisition.py
uv run --with-requirements backend/requirements.txt python scripts/validate_flatdna_acquisition.py --require-approved
git diff --check
```

Expected: unit tests pass; offline policy validation passes; approval-required validation fails closed with exit 1; whitespace check passes.

- [ ] **Step 2: Add the Phase 1 implementation receipt**

Append a dated receipt stating implemented files, commands run, results, and the unresolved acquisition constraint. Do not mark automated production acquisition approved.

- [ ] **Step 3: Commit the complete phase**

```powershell
git add backend/app/services/flatdna/acquisition.py backend/app/services/scoring_engine.py backend/tests/test_flatdna_acquisition.py scripts/validate_flatdna_acquisition.py data/cities/hyderabad/flatdna/acquisition-policy.json docs/data-sources/tgrera-acquisition-constraints.md docs/DATA_SOURCES.md docs/superpowers/plans/2026-08-19-flatdna-catalog-phase-1-acquisition.md docs/superpowers/specs/2026-08-19-flatdna-hyderabad-catalog-design.md
git commit -m "feat: enforce FlatDNA acquisition approval gate" -m "Constraint: Automated TG-RERA production ingestion remains disabled until its operating method is approved." -m "Confidence: High" -m "Tested: Acquisition policy unit tests, offline validator, fail-closed approval check, and git diff check."
git push origin HEAD
```

Expected: one Phase 1 implementation commit is pushed; no unrelated working-tree files are included.

## Phase 1 Completion Boundary

Phase 1 is complete when the acquisition policy and validator are implemented, tests prove production automation fails closed, governance documentation is current, and the design receipt is pushed. Phase 1 does not approve or execute automated TG-RERA production ingestion.
