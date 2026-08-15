import unittest
from collections import Counter
from copy import deepcopy
from uuid import UUID

from app.services.flatdna.models import DataOrigin, RegistryStatus, claim_fingerprint
from app.services.flatdna.registry_io import load_registry_bundle, registry_summary
from app.services.flatdna.registry_validation import (
    HYDERABAD_LAUNCH_LOCALITY_COUNTS,
    HYDERABAD_LAUNCH_PROJECT_IDS,
    validate_hyderabad_launch_registry,
)


LOCKED_PROJECT_IDS = {
    "Myscape Isle of Sky": UUID("4b2ca36e-b2ad-4f61-8686-fd8e096c731c"),
    "My Home Nishada": UUID("421c032d-37c5-4e88-8c18-3b1185ac825f"),
    "Prestige Beverly Hills": UUID("c75202ca-dc26-46c4-b7d8-b7fca77c9d19"),
    "Rajapushpa Pristinia": UUID("d456e85d-a1fd-418a-9053-29b3dca717a6"),
    "Rajapushpa Provincia": UUID("c3762910-130b-46a1-8835-aabada890854"),
    "EIPL Cornerstone": UUID("4b792811-982f-45a2-8b1c-1008d2b06755"),
    "My Home Tridasa": UUID("97becc5f-d926-411d-bf51-14873cb22c4e"),
    "Aparna Newlands": UUID("8afccfe9-f040-440c-895f-930db6a2e7fd"),
    "Rajapushpa Imperia": UUID("9ffdfa60-3dd5-4f47-9f41-f5f35c8450ad"),
    "Aparna Sarovar Zenith": UUID("caa5580b-97d0-496b-814d-feaedfe88672"),
    "Aparna Sarovar Zicon": UUID("067db042-3467-44c1-b31a-ace541f37f3c"),
    "Aparna Luxor Park": UUID("0103521f-bdf6-459c-afe2-1db7620743eb"),
    "On Cloud 33": UUID("67f11bc5-7719-49b3-b670-c02e3aa6c1ef"),
    "Ramky One Harmony": UUID("5c7fb656-e68f-43ce-a311-856f26b9fe05"),
}


class FlatDnaRegistryDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bundle = load_registry_bundle()

    def test_fixture_has_exact_reviewed_counts_and_project_id_lock(self):
        self.assertEqual(
            registry_summary(self.bundle),
            {
                "developers": 8,
                "developer_aliases": 0,
                "projects": 14,
                "project_aliases": 9,
                "rera_references": 14,
                "evidence_sources": 42,
                "claim_evidence": 87,
            },
        )
        actual = {project.canonical_name: project.id for project in self.bundle.projects}
        self.assertEqual(actual, LOCKED_PROJECT_IDS)
        self.assertEqual(HYDERABAD_LAUNCH_PROJECT_IDS, LOCKED_PROJECT_IDS)

    def test_fixture_is_supported_hyderabad_only_with_expected_distribution(self):
        self.assertTrue(all(project.registry_status == RegistryStatus.SUPPORTED for project in self.bundle.projects))
        self.assertTrue(all(project.city_slug == "hyderabad" for project in self.bundle.projects))
        self.assertEqual(
            dict(Counter(project.locality_slug for project in self.bundle.projects)),
            HYDERABAD_LAUNCH_LOCALITY_COUNTS,
        )
        excluded = {
            "Myscape Songs of the Sun", "Aparna Zenon", "My Home Vihanga",
            "Prestige Ivy League", "Codename Sky Habitat", "Prestige High Fields", "NCC Urban One",
        }
        self.assertTrue(excluded.isdisjoint(project.canonical_name for project in self.bundle.projects))

    def test_developer_relationships_aliases_and_rera_are_reviewed(self):
        developer_names = {developer.id: developer.canonical_name for developer in self.bundle.developers}
        self.assertEqual(
            Counter(developer_names[project.developer_id] for project in self.bundle.projects),
            Counter({"Aparna Constructions": 4, "Rajapushpa Properties": 3, "My Home Constructions": 2,
                     "Myscape Properties Private Limited": 1, "Prestige Group": 1, "EIPL Group": 1,
                     "Urbanrise": 1, "Ramky Estates": 1}),
        )
        self.assertEqual(
            {alias.alias for alias in self.bundle.project_aliases},
            {"Isle of Sky", "Nishada", "Pristinia", "Provincia", "Cornerstone", "Corner Stone",
             "Imperia", "Urbanrise On Cloud 33", "On Cloud33"},
        )
        self.assertEqual(len(self.bundle.rera_references), len(self.bundle.projects))
        self.assertTrue(all(reference.reference_status.value == "VERIFIED" for reference in self.bundle.rera_references))

    def test_all_fixture_uuids_are_explicit_v4_and_unique(self):
        ids = []
        for name in ("developers", "developer_aliases", "projects", "project_aliases", "rera_references", "evidence_sources", "claim_evidence"):
            records = getattr(self.bundle, name)
            self.assertEqual(len({record.id for record in records}), len(records))
            ids.extend(record.id for record in records)
        self.assertEqual(len(set(ids)), len(ids))
        self.assertTrue(all(identifier.version == 4 for identifier in ids))

    def test_fixture_passes_launch_validation(self):
        self.assertEqual(validate_hyderabad_launch_registry(self.bundle), [])

    def test_fixture_does_not_publish_retired_telangana_rera_links(self):
        regulator_sources = [
            source for source in self.bundle.evidence_sources
            if source.publisher == "Telangana RERA"
        ]
        self.assertEqual(len(regulator_sources), 14)
        self.assertTrue(all(source.url == "https://rera.telangana.gov.in/" for source in regulator_sources))

    def test_unsafe_source_invalid_locality_and_evidence_mismatch_are_rejected(self):
        unsafe = deepcopy(self.bundle)
        unsafe.evidence_sources[0].data_origin = DataOrigin.SYNTHETIC
        self.assertIn("source.unsafe_origin", {item.code for item in validate_hyderabad_launch_registry(unsafe)})

        locality = deepcopy(self.bundle)
        locality.projects[0].locality_slug = "not-a-plotdna-locality"
        self.assertIn("project.locality", {item.code for item in validate_hyderabad_launch_registry(locality)})

        mismatch = deepcopy(self.bundle)
        project = mismatch.projects[0]
        claim = next(item for item in mismatch.claim_evidence if item.project_id == project.id and item.claim_key == "identity.coordinates")
        claim.observed_value = "17.000000,78.000000"
        claim.fingerprint = claim_fingerprint(
            subject_type="project", subject_id=project.id, claim_key=claim.claim_key,
            observed_value=claim.observed_value, evidence_source_id=claim.evidence_source_id,
        )
        self.assertIn("project.supported_evidence", {item.code for item in validate_hyderabad_launch_registry(mismatch)})


if __name__ == "__main__":
    unittest.main()
