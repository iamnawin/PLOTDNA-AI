import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from datetime import date
from pathlib import Path
from uuid import uuid4

from app.services.flatdna.catalog_models import CatalogLocationPrecision, CatalogMetrics, CatalogStatus
from app.services.flatdna.catalog_pipeline import SourceCatalogRecord, build_candidate_snapshot
from app.services.flatdna.catalog_validation import (
    ObservedMigrationState,
    expected_migration_state,
    reconcile_registry_migration,
    validate_candidate_snapshot,
)
from app.services.flatdna.registry_io import load_registry_bundle


REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = REPO_ROOT / "data" / "cities" / "hyderabad" / "flatdna" / "registry.json"
FIXTURE_PATH = REPO_ROOT / "data" / "staging" / "tgrera" / "hyderabad-apartment-sample.json"


def load_release_script():
    path = REPO_ROOT / "scripts" / "validate_flatdna_catalog_release.py"
    spec = importlib.util.spec_from_file_location("validate_flatdna_catalog_release", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def candidate_snapshot():
    payload = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    return build_candidate_snapshot(
        [SourceCatalogRecord.model_validate(item) for item in payload["records"]],
        [],
        date.fromisoformat(payload["source_as_of"]),
        payload["sequence"],
    )


class FlatDnaCatalogValidationTests(unittest.TestCase):
    def test_valid_candidate_has_deterministic_receipt(self):
        snapshot = candidate_snapshot()

        first = validate_candidate_snapshot(snapshot)
        second = validate_candidate_snapshot(snapshot)

        self.assertTrue(first.passed)
        self.assertEqual(first.receipt_sha256, second.receipt_sha256)
        self.assertEqual(first.findings, ())

    def test_metric_mismatch_blocks_snapshot(self):
        snapshot = candidate_snapshot()
        metrics = snapshot.metrics.model_copy(
            update={"searchable_records": snapshot.metrics.searchable_records + 1}
        )

        receipt = validate_candidate_snapshot(snapshot.model_copy(update={"metrics": metrics}))

        self.assertFalse(receipt.passed)
        self.assertIn("metrics.mismatch", {finding.code for finding in receipt.findings})

    def test_duplicate_registration_id_blocks_snapshot(self):
        snapshot = candidate_snapshot()
        first, second, *remaining = snapshot.projections
        conflicting = second.model_copy(update={"registration_id": first.registration_id})
        changed = snapshot.model_copy(update={"projections": (first, conflicting, *remaining)})

        receipt = validate_candidate_snapshot(changed)

        self.assertIn("registration.duplicate_id", {finding.code for finding in receipt.findings})

    def test_unknown_location_cannot_be_searchable(self):
        snapshot = candidate_snapshot()
        first, *remaining = snapshot.projections
        unsafe_state = first.state.model_copy(
            update={
                "catalog_status": CatalogStatus.SEARCHABLE,
                "location_precision": CatalogLocationPrecision.UNKNOWN,
            }
        )
        unsafe = first.model_copy(update={"state": unsafe_state})

        receipt = validate_candidate_snapshot(
            snapshot.model_copy(update={"projections": (unsafe, *remaining)})
        )

        self.assertIn("location.unknown_searchable", {finding.code for finding in receipt.findings})

    def test_existing_registry_reconciliation_preserves_all_locked_identity(self):
        bundle = load_registry_bundle(REGISTRY_PATH)
        observed = expected_migration_state(bundle)

        result = reconcile_registry_migration(bundle, observed)

        self.assertTrue(result.passed)
        self.assertEqual(result.project_count, 14)
        self.assertEqual(result.findings, ())

    def test_reconciliation_detects_reassigned_registration_and_missing_evidence(self):
        bundle = load_registry_bundle(REGISTRY_PATH)
        observed = expected_migration_state(bundle)
        registration_map = dict(observed.registration_project_ids)
        registration_map[next(iter(registration_map))] = uuid4()
        evidence_ids = observed.evidence_source_ids[1:]
        changed = ObservedMigrationState(
            project_ids=observed.project_ids,
            registration_project_ids=registration_map,
            evidence_source_ids=evidence_ids,
            claim_evidence_ids=observed.claim_evidence_ids,
            developer_project_ids=observed.developer_project_ids,
            customer_identity=observed.customer_identity,
            claim_links=observed.claim_links,
        )

        result = reconcile_registry_migration(bundle, changed)

        codes = {finding.code for finding in result.findings}
        self.assertIn("registration.reassigned", codes)
        self.assertIn("evidence.missing", codes)
        self.assertFalse(result.passed)

    def test_reconciliation_detects_claim_evidence_rewiring(self):
        bundle = load_registry_bundle(REGISTRY_PATH)
        observed = expected_migration_state(bundle)
        claim_links = dict(observed.claim_links)
        claim_id = next(iter(claim_links))
        changed_link = list(claim_links[claim_id])
        changed_link[0] = uuid4()
        claim_links[claim_id] = tuple(changed_link)
        changed = observed.model_copy(update={"claim_links": claim_links})

        result = reconcile_registry_migration(bundle, changed)

        self.assertIn("claim_evidence.link_changed", {item.code for item in result.findings})
        self.assertFalse(result.passed)

    def test_offline_release_receipt_never_claims_database_acceptance(self):
        release = load_release_script()
        with tempfile.TemporaryDirectory() as directory:
            report_path = Path(directory) / "release.json"
            with redirect_stdout(io.StringIO()):
                result = release.main(["--json-report", str(report_path)])
            report = json.loads(report_path.read_text(encoding="utf-8"))

        self.assertEqual(result, 0)
        self.assertTrue(report["candidate_validation"]["passed"])
        self.assertTrue(report["registry_baseline_check"]["passed"])
        self.assertFalse(report["database_reconciliation_performed"])
        self.assertFalse(report["release_accepted"])


if __name__ == "__main__":
    unittest.main()
