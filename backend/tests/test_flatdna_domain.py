import unittest
from copy import deepcopy
from uuid import UUID

from pydantic import ValidationError

from app.services.flatdna.models import (
    DataOrigin,
    DeveloperRecord,
    ProjectAliasRecord,
    ProjectAliasType,
    ProjectRecord,
    RegistryBundle,
    RegistryStatus,
    claim_fingerprint,
    normalize_identity,
)
from app.services.flatdna.registry_validation import validate_registry_bundle
from tests.flatdna_test_data import DEVELOPER_ID, PROJECT_ID, make_supported_bundle


class FlatDnaDomainTests(unittest.TestCase):
    def test_normalization_is_deterministic(self):
        self.assertEqual(normalize_identity("  My-Project   Name "), "my project name")

    def test_canonical_uuid_is_required_and_project_status_is_not_allowed(self):
        with self.assertRaises(ValidationError):
            DeveloperRecord(canonical_name="Builder", normalized_name="builder")
        with self.assertRaises(ValidationError):
            ProjectRecord(
                id=PROJECT_ID,
                developer_id=DEVELOPER_ID,
                canonical_name="Project",
                normalized_name="project",
                city_slug="hyderabad",
                locality_slug="kokapet",
                project_status="READY",
            )

    def test_draft_project_may_have_incomplete_evidence(self):
        bundle = RegistryBundle(
            developers=[
                DeveloperRecord(
                    id=DEVELOPER_ID,
                    canonical_name="Example Developer",
                    normalized_name="example developer",
                )
            ],
            projects=[
                ProjectRecord(
                    id=PROJECT_ID,
                    developer_id=DEVELOPER_ID,
                    canonical_name="Example Heights",
                    normalized_name="example heights",
                    city_slug="hyderabad",
                    locality_slug="kokapet",
                )
            ],
        )
        self.assertEqual(validate_registry_bundle(bundle), [])

    def test_supported_project_requires_all_core_evidence(self):
        bundle = make_supported_bundle()
        bundle.claim_evidence.pop()
        codes = {finding.code for finding in validate_registry_bundle(bundle)}
        self.assertIn("project.supported_evidence", codes)

    def test_unknown_plotdna_locality_is_rejected(self):
        bundle = make_supported_bundle()
        bundle.projects[0].registry_status = RegistryStatus.DRAFT
        bundle.projects[0].locality_slug = "not-a-real-locality"
        codes = {finding.code for finding in validate_registry_bundle(bundle)}
        self.assertIn("project.locality", codes)

    def test_test_and_synthetic_origins_are_rejected(self):
        for origin in (DataOrigin.TEST, DataOrigin.SYNTHETIC):
            with self.subTest(origin=origin):
                bundle = make_supported_bundle(data_origin=origin)
                codes = {finding.code for finding in validate_registry_bundle(bundle)}
                self.assertIn("source.unsafe_origin", codes)

    def test_synthetic_tsrera_source_marker_is_rejected(self):
        bundle = make_supported_bundle()
        bundle.evidence_sources[0].source_ref = "data/tsrera_projects.json"
        codes = {finding.code for finding in validate_registry_bundle(bundle)}
        self.assertIn("source.synthetic_marker", codes)

    def test_fingerprint_is_bound_to_observed_value(self):
        bundle = make_supported_bundle()
        claim = bundle.claim_evidence[0]
        original = claim.fingerprint
        changed = claim_fingerprint(
            subject_type="project",
            subject_id=PROJECT_ID,
            claim_key=claim.claim_key,
            observed_value="different project",
            evidence_source_id=claim.evidence_source_id,
        )
        self.assertNotEqual(original, changed)
        claim.observed_value = "different project"
        codes = {finding.code for finding in validate_registry_bundle(bundle)}
        self.assertIn("claim.fingerprint", codes)

    def test_alias_duplicates_are_scoped_to_one_project(self):
        bundle = make_supported_bundle()
        for project in bundle.projects:
            project.registry_status = RegistryStatus.DRAFT
        second_project_id = UUID("20000000-0000-4000-8000-000000000002")
        bundle.projects.append(
            ProjectRecord(
                id=second_project_id,
                developer_id=DEVELOPER_ID,
                canonical_name="Other Heights",
                normalized_name="other heights",
                city_slug="hyderabad",
                locality_slug="kokapet",
            )
        )
        first_alias = ProjectAliasRecord(
            id=UUID("50000000-0000-4000-8000-000000000001"),
            project_id=PROJECT_ID,
            alias="Shared Name",
            normalized_alias="shared name",
            alias_type=ProjectAliasType.COMMON_MISSPELLING,
            active=False,
        )
        second_alias = deepcopy(first_alias)
        second_alias.id = UUID("50000000-0000-4000-8000-000000000002")
        second_alias.project_id = second_project_id
        bundle.project_aliases = [first_alias, second_alias]
        self.assertNotIn("project_alias.duplicate", {item.code for item in validate_registry_bundle(bundle)})

        duplicate = deepcopy(first_alias)
        duplicate.id = UUID("50000000-0000-4000-8000-000000000003")
        bundle.project_aliases.append(duplicate)
        self.assertIn("project_alias.duplicate", {item.code for item in validate_registry_bundle(bundle)})


if __name__ == "__main__":
    unittest.main()
