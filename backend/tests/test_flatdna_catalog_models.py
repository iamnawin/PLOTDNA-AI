import unittest
from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

from pydantic import ValidationError

from app.services.flatdna.catalog_models import (
    CatalogLocationPrecision,
    CatalogMetrics,
    CatalogProjectState,
    CatalogReviewStatus,
    CatalogSnapshot,
    CatalogStatus,
    IdentityStatus,
    MatchAssessment,
    ProjectReview,
    ProjectStatus,
    RegulatoryFlag,
    RegulatoryWarning,
    ReviewFreshness,
    WarningOrigin,
    WarningStatus,
)


class FlatDnaCatalogModelTests(unittest.TestCase):
    def test_unresolved_identity_cannot_be_searchable(self):
        with self.assertRaisesRegex(ValidationError, "unresolved identity cannot be searchable"):
            CatalogProjectState(
                review_status=CatalogReviewStatus.REVIEW_REQUIRED,
                identity_status=IdentityStatus.UNRESOLVED,
                project_status=ProjectStatus.UNKNOWN,
                catalog_status=CatalogStatus.SEARCHABLE,
                location_precision=CatalogLocationPrecision.UNKNOWN,
            )

    def test_partially_resolved_searchable_is_location_uncertainty_only(self):
        valid = CatalogProjectState(
            review_status=CatalogReviewStatus.REVIEW_REQUIRED,
            identity_status=IdentityStatus.PARTIALLY_RESOLVED,
            project_status=ProjectStatus.ACTIVE,
            catalog_status=CatalogStatus.SEARCHABLE,
            location_precision=CatalogLocationPrecision.LOCALITY,
            unique_registration=True,
            project_identity_resolved=True,
            promoter_identity_resolved=True,
            location_only_uncertainty=True,
        )
        self.assertEqual(valid.customer_location_label, "Locality-level location")

        for field, value in {
            "unique_registration": False,
            "project_identity_resolved": False,
            "promoter_identity_resolved": False,
            "duplicate_suspected": True,
            "location_only_uncertainty": False,
        }.items():
            payload = valid.model_dump()
            payload[field] = value
            with self.subTest(field=field), self.assertRaisesRegex(
                ValidationError,
                "partially resolved searchable project must have only location uncertainty",
            ):
                CatalogProjectState.model_validate(payload)

    def test_unsupported_requires_resolved_identity_and_reason(self):
        with self.assertRaises(ValidationError):
            CatalogProjectState(
                review_status=CatalogReviewStatus.UNSUPPORTED,
                identity_status=IdentityStatus.RESOLVED,
                project_status=ProjectStatus.ACTIVE,
                catalog_status=CatalogStatus.HIDDEN,
                location_precision=CatalogLocationPrecision.EXACT_PROJECT,
            )

    def test_supported_requires_current_review(self):
        with self.assertRaisesRegex(ValidationError, "supported project requires a current review"):
            CatalogProjectState(
                review_status=CatalogReviewStatus.SUPPORTED,
                identity_status=IdentityStatus.RESOLVED,
                project_status=ProjectStatus.ACTIVE,
                catalog_status=CatalogStatus.SEARCHABLE,
                location_precision=CatalogLocationPrecision.EXACT_PROJECT,
            )

        state = CatalogProjectState(
            review_status=CatalogReviewStatus.SUPPORTED,
            identity_status=IdentityStatus.RESOLVED,
            project_status=ProjectStatus.ACTIVE,
            catalog_status=CatalogStatus.SEARCHABLE,
            location_precision=CatalogLocationPrecision.EXACT_PROJECT,
            current_review_id=uuid4(),
            review_freshness=ReviewFreshness.CURRENT,
        )
        self.assertEqual(state.customer_location_label, "Exact project location")

    def test_resolved_warning_requires_explicit_resolution_evidence(self):
        with self.assertRaisesRegex(ValidationError, "resolved warning requires resolution evidence"):
            RegulatoryWarning(
                flag=RegulatoryFlag.REVOKED,
                origin=WarningOrigin.TG_RERA,
                status=WarningStatus.RESOLVED,
                observed_at=datetime.now(timezone.utc),
                source_record_id=uuid4(),
            )

    def test_match_assessment_uses_integer_basis_points(self):
        assessment = MatchAssessment(
            project_name_bps=10_000,
            duplicate_bps=0,
            promoter_bps=9_500,
            locality_bps=7_500,
            coordinate_bps=5_000,
            methods={"project_name": "NORMALIZED_EXACT"},
        )
        self.assertEqual(assessment.promoter_bps, 9_500)
        with self.assertRaises(ValidationError):
            MatchAssessment(
                project_name_bps=10_001,
                duplicate_bps=0,
                promoter_bps=0,
                locality_bps=0,
                coordinate_bps=0,
            )

    def test_snapshot_metrics_and_review_dates_are_strict(self):
        metrics = CatalogMetrics(
            acquired_records=20,
            unique_registrations=18,
            classified_apartments=15,
            in_geography=14,
            searchable_records=12,
            quarantined_records=1,
            excluded_records=1,
            resolved_identities=12,
            partially_resolved_identities=1,
            unresolved_identities=1,
            reviewed_projects=4,
        )
        snapshot = CatalogSnapshot(
            snapshot_id="tg-rera-2026-08-19-001",
            source_as_of=date(2026, 8, 19),
            metrics=metrics,
        )
        self.assertEqual(snapshot.metrics.searchable_records, 12)

        reviewed_at = datetime(2026, 8, 19, tzinfo=timezone.utc)
        review = ProjectReview(
            id=uuid4(),
            project_id=uuid4(),
            reviewed_by="reviewer",
            review_method="HUMAN",
            reviewed_at=reviewed_at,
            evidence_as_of=date(2026, 8, 18),
            valid_until=reviewed_at + timedelta(days=90),
        )
        self.assertGreater(review.valid_until, review.reviewed_at)


if __name__ == "__main__":
    unittest.main()
