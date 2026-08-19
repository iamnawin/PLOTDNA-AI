import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from datetime import date
from pathlib import Path
from uuid import UUID

from pydantic import ValidationError

from app.services.flatdna.catalog_models import (
    CatalogLocationPrecision,
    CatalogReviewStatus,
    CatalogStatus,
    IdentityStatus,
)
from app.services.flatdna.catalog_pipeline import (
    ExistingRegistrationIdentity,
    SourceCatalogRecord,
    build_candidate_snapshot,
)


REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_PATH = REPO_ROOT / "data" / "staging" / "tgrera" / "hyderabad-apartment-sample.json"


def load_builder_script():
    path = REPO_ROOT / "scripts" / "build_flatdna_catalog.py"
    spec = importlib.util.spec_from_file_location("build_flatdna_catalog", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def source_record(
    suffix: int,
    registration: str,
    *,
    name: str | None = "Example Heights",
    promoter: str | None = "Example Developer",
    property_type: str = "RESIDENTIAL_APARTMENT",
    within_market: bool = True,
    locality: str | None = "Kokapet",
    latitude: float | None = None,
    longitude: float | None = None,
    coordinate_source: str | None = None,
) -> SourceCatalogRecord:
    return SourceCatalogRecord(
        source_record_id=UUID(f"10000000-0000-4000-8000-{suffix:012d}"),
        data_origin="TEST",
        authority_code="TG_RERA",
        registration_number=registration,
        project_name=name,
        promoter_name=promoter,
        property_type=property_type,
        project_status="ACTIVE",
        within_market=within_market,
        locality=locality,
        latitude=latitude,
        longitude=longitude,
        coordinate_source=coordinate_source,
    )


class FlatDnaCatalogPipelineTests(unittest.TestCase):
    def test_registration_identity_requires_usable_characters(self):
        with self.assertRaises(ValidationError):
            source_record(1, "---")

    def test_conflicting_existing_identity_index_is_rejected(self):
        existing = [
            ExistingRegistrationIdentity(
                authority_code="TG_RERA",
                normalized_rera_number="p02400000001",
                canonical_project_id=UUID("20000000-0000-4000-8000-000000000001"),
                registration_id=UUID("30000000-0000-4000-8000-000000000001"),
            ),
            ExistingRegistrationIdentity(
                authority_code="TG_RERA",
                normalized_rera_number="P02400000001",
                canonical_project_id=UUID("20000000-0000-4000-8000-000000000002"),
                registration_id=UUID("30000000-0000-4000-8000-000000000002"),
            ),
        ]

        with self.assertRaisesRegex(ValueError, "conflicting existing registration identity"):
            build_candidate_snapshot(
                [source_record(1, "P02400000001")],
                existing,
                date(2026, 8, 19),
                1,
            )

    def test_existing_registration_reuses_locked_project_and_registration_ids(self):
        project_id = UUID("20000000-0000-4000-8000-000000000001")
        registration_id = UUID("30000000-0000-4000-8000-000000000001")
        existing = ExistingRegistrationIdentity(
            authority_code="TG_RERA",
            normalized_rera_number="p02400000001",
            canonical_project_id=project_id,
            registration_id=registration_id,
        )

        snapshot = build_candidate_snapshot(
            [source_record(1, "P02400000001")],
            [existing],
            source_as_of=date(2026, 8, 19),
            sequence=1,
        )

        projection = snapshot.projections[0]
        self.assertEqual(projection.canonical_project_id, project_id)
        self.assertEqual(projection.registration_id, registration_id)

    def test_similar_phase_names_with_distinct_registrations_remain_separate(self):
        records = [
            source_record(1, "P02400000011", name="Example Heights Phase 1"),
            source_record(2, "P02400000012", name="Example Heights Phase 2"),
        ]

        snapshot = build_candidate_snapshot(records, [], date(2026, 8, 19), 1)

        self.assertEqual(len(snapshot.projections), 2)
        self.assertEqual(len({item.registration_id for item in snapshot.projections}), 2)
        self.assertEqual(snapshot.metrics.unique_registrations, 2)

    def test_duplicate_registration_is_quarantined_without_auto_merge(self):
        records = [
            source_record(1, "P02400000021", name="First Claimed Name"),
            source_record(2, "P02400000021", name="Conflicting Claimed Name"),
        ]

        snapshot = build_candidate_snapshot(records, [], date(2026, 8, 19), 1)

        self.assertEqual(len(snapshot.projections), 1)
        projection = snapshot.projections[0]
        self.assertEqual(projection.state.identity_status, IdentityStatus.UNRESOLVED)
        self.assertEqual(projection.state.catalog_status, CatalogStatus.QUARANTINED)
        self.assertTrue(projection.state.duplicate_suspected)
        self.assertEqual(snapshot.metrics.quarantined_records, 1)

    def test_scope_exclusions_are_resolved_hidden_and_reasoned(self):
        records = [
            source_record(1, "P02400000031", property_type="COMMERCIAL"),
            source_record(2, "P02400000032", within_market=False),
        ]

        snapshot = build_candidate_snapshot(records, [], date(2026, 8, 19), 1)

        self.assertEqual(snapshot.metrics.excluded_records, 2)
        for projection in snapshot.projections:
            self.assertEqual(projection.state.review_status, CatalogReviewStatus.UNSUPPORTED)
            self.assertEqual(projection.state.identity_status, IdentityStatus.RESOLVED)
            self.assertEqual(projection.state.catalog_status, CatalogStatus.HIDDEN)
            self.assertTrue(projection.state.exclusion_reason)

    def test_location_only_uncertainty_is_partially_resolved_and_searchable(self):
        snapshot = build_candidate_snapshot(
            [source_record(1, "P02400000041", locality="Tellapur")],
            [],
            date(2026, 8, 19),
            1,
        )

        projection = snapshot.projections[0]
        self.assertEqual(projection.state.identity_status, IdentityStatus.PARTIALLY_RESOLVED)
        self.assertEqual(projection.state.catalog_status, CatalogStatus.SEARCHABLE)
        self.assertEqual(projection.state.location_precision, CatalogLocationPrecision.LOCALITY)
        self.assertTrue(projection.state.location_only_uncertainty)
        self.assertEqual(projection.state.customer_location_label, "Locality-level location")

    def test_missing_locality_and_coordinates_is_not_publicly_searchable(self):
        snapshot = build_candidate_snapshot(
            [source_record(1, "P02400000042", locality=None)],
            [],
            date(2026, 8, 19),
            1,
        )

        projection = snapshot.projections[0]
        self.assertEqual(projection.state.identity_status, IdentityStatus.PARTIALLY_RESOLVED)
        self.assertEqual(projection.state.catalog_status, CatalogStatus.QUARANTINED)
        self.assertEqual(projection.state.location_precision, CatalogLocationPrecision.UNKNOWN)

    def test_duplicate_conflicts_are_excluded_from_classification_and_geography_metrics(self):
        records = [
            source_record(
                1,
                "P02400000043",
                property_type="RESIDENTIAL_APARTMENT",
                within_market=True,
            ),
            source_record(
                2,
                "P02400000043",
                property_type="COMMERCIAL",
                within_market=False,
            ),
        ]

        snapshot = build_candidate_snapshot(records, [], date(2026, 8, 19), 1)

        self.assertEqual(snapshot.metrics.classified_apartments, 0)
        self.assertEqual(snapshot.metrics.in_geography, 0)
        self.assertEqual(snapshot.metrics.quarantined_records, 1)

    def test_official_coordinates_produce_resolved_exact_location(self):
        snapshot = build_candidate_snapshot(
            [
                source_record(
                    1,
                    "P02400000051",
                    latitude=17.4,
                    longitude=78.3,
                    coordinate_source="OFFICIAL_REGULATOR",
                )
            ],
            [],
            date(2026, 8, 19),
            1,
        )

        projection = snapshot.projections[0]
        self.assertEqual(projection.state.identity_status, IdentityStatus.RESOLVED)
        self.assertEqual(projection.state.location_precision, CatalogLocationPrecision.EXACT_PROJECT)
        self.assertEqual(projection.assessment.coordinate_bps, 10_000)

    def test_metrics_and_snapshot_output_are_deterministic(self):
        records = [
            source_record(1, "P02400000061"),
            source_record(2, "P02400000062", property_type="COMMERCIAL"),
            source_record(3, "P02400000063", name=None),
        ]

        first = build_candidate_snapshot(records, [], date(2026, 8, 19), 7)
        second = build_candidate_snapshot(list(reversed(records)), [], date(2026, 8, 19), 7)

        self.assertEqual(first.model_dump_json(), second.model_dump_json())
        self.assertEqual(first.snapshot_id, "tg-rera-2026-08-19-007")
        self.assertEqual(first.metrics.acquired_records, 3)
        self.assertEqual(first.metrics.searchable_records, 1)
        self.assertEqual(first.metrics.quarantined_records, 1)
        self.assertEqual(first.metrics.excluded_records, 1)

    def test_sanitized_fixture_is_test_only_and_cli_output_is_deterministic(self):
        payload = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
        self.assertEqual(payload["data_origin"], "TEST")
        self.assertFalse(payload["production_eligible"])
        self.assertTrue(all(record["data_origin"] == "TEST" for record in payload["records"]))

        builder = load_builder_script()
        with tempfile.TemporaryDirectory() as directory:
            first = Path(directory) / "first.json"
            second = Path(directory) / "second.json"
            with redirect_stdout(io.StringIO()):
                first_result = builder.main(
                    ["--fixture", str(FIXTURE_PATH), "--json-report", str(first)]
                )
                second_result = builder.main(
                    ["--fixture", str(FIXTURE_PATH), "--json-report", str(second)]
                )
            self.assertEqual(first_result, 0)
            self.assertEqual(second_result, 0)
            self.assertEqual(first.read_bytes(), second.read_bytes())

        report = json.loads(first.read_text(encoding="utf-8")) if first.exists() else builder.build_report(FIXTURE_PATH)
        self.assertEqual(report["metrics"]["acquired_records"], 8)
        self.assertEqual(report["metrics"]["unique_registrations"], 7)
        self.assertEqual(report["metrics"]["searchable_records"], 4)
        self.assertEqual(report["metrics"]["quarantined_records"], 1)
        self.assertEqual(report["metrics"]["excluded_records"], 2)


if __name__ == "__main__":
    unittest.main()
