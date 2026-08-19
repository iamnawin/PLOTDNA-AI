import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from app.services.flatdna.acquisition import (
    AcquisitionApprovalError,
    AcquisitionPolicy,
    ApprovalStatus,
    assert_automated_ingestion_allowed,
    load_acquisition_policy,
)
from app.services.scoring_engine import compute_from_osm


REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = REPO_ROOT / "data" / "cities" / "hyderabad" / "flatdna" / "acquisition-policy.json"


def load_validator_script():
    path = REPO_ROOT / "scripts" / "validate_flatdna_acquisition.py"
    spec = importlib.util.spec_from_file_location("validate_flatdna_acquisition", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def approved_policy_payload() -> dict:
    return {
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
    }


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

        with self.assertRaisesRegex(
            AcquisitionApprovalError,
            "Automated TG-RERA production ingestion is not approved",
        ):
            assert_automated_ingestion_allowed(policy)

    def test_complete_approved_policy_allows_automation(self):
        policy = AcquisitionPolicy.model_validate(approved_policy_payload())

        assert_automated_ingestion_allowed(policy)

    def test_approved_policy_requires_operating_constraints(self):
        payload = approved_policy_payload()
        payload["operating_constraints"] = []

        with self.assertRaisesRegex(
            ValueError,
            "approved acquisition policy requires complete approval metadata",
        ):
            AcquisitionPolicy.model_validate(payload)

    def test_approved_policy_rejects_blank_approval_metadata(self):
        invalid_values = {
            "approved_by": " ",
            "source_identifiers": [""],
            "operating_constraints": ["   "],
        }
        for field, value in invalid_values.items():
            with self.subTest(field=field):
                payload = approved_policy_payload()
                payload[field] = value
                with self.assertRaises(ValueError):
                    AcquisitionPolicy.model_validate(payload)

    def test_loader_rejects_unknown_fields(self):
        payload = approved_policy_payload()
        payload["unexpected"] = True
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "policy.json"
            path.write_text(json.dumps(payload), encoding="utf-8")

            with self.assertRaises(ValueError):
                load_acquisition_policy(path)

    def test_repository_policy_is_explicitly_unapproved(self):
        policy = load_acquisition_policy(POLICY_PATH)

        self.assertEqual(policy.approval_status, ApprovalStatus.UNAPPROVED)
        with self.assertRaises(AcquisitionApprovalError):
            assert_automated_ingestion_allowed(policy)

    def test_cli_validates_policy_but_fails_when_approval_is_required(self):
        validator = load_validator_script()
        output = io.StringIO()

        with redirect_stdout(output):
            validation_result = validator.main([])
            approval_result = validator.main(["--require-approved"])

        self.assertEqual(validation_result, 0)
        self.assertEqual(approval_result, 1)
        self.assertIn('"approval_status": "UNAPPROVED"', output.getvalue())
        self.assertIn("Automated TG-RERA production ingestion is not approved", output.getvalue())

    def test_scoring_does_not_use_synthetic_tgrera_project_data(self):
        counts = {"residential": 10, "construction": 4}

        hyderabad = compute_from_osm(counts, lat=17.385, lng=78.487)
        outside_telangana = compute_from_osm(counts, lat=12.9716, lng=77.5946)

        self.assertEqual(hyderabad.signals.rera, outside_telangana.signals.rera)
        self.assertFalse(any("RERA projects" in highlight for highlight in hyderabad.highlights))


if __name__ == "__main__":
    unittest.main()
