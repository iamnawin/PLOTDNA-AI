import os
import unittest
from copy import deepcopy
from pathlib import Path
from uuid import uuid4

from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError

from app.services.flatdna.models import DataOrigin, claim_fingerprint
from app.services.flatdna.registry_io import load_registry_bundle, registry_summary
from app.services.flatdna.registry_validation import validate_hyderabad_launch_registry
from app.services.flatdna.repository import FlatDnaRegistryValidationError, PostgresFlatProjectRepository


ROOT = Path(__file__).resolve().parents[2]
UP_SQL = (ROOT / "backend" / "migrations" / "0001_flatdna_registry.up.sql").read_text(encoding="utf-8")
DOWN_SQL = (ROOT / "backend" / "migrations" / "0001_flatdna_registry.down.sql").read_text(encoding="utf-8")
DATABASE_URL = os.getenv("FLATDNA_TEST_DATABASE_URL", "")
TABLES = {
    "developers": "flat_developers",
    "developer_aliases": "flat_developer_aliases",
    "projects": "flat_projects",
    "project_aliases": "flat_project_aliases",
    "rera_references": "flat_rera_references",
    "evidence_sources": "flat_evidence_sources",
    "claim_evidence": "flat_claim_evidence",
}


@unittest.skipUnless(DATABASE_URL, "FLATDNA_TEST_DATABASE_URL is required for Batch 0C PostgreSQL acceptance")
class FlatDnaRegistryPostgresTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = f"flatdna_0c_{uuid4().hex}"
        cls.admin_engine = create_engine(DATABASE_URL)
        connection = cls.admin_engine.raw_connection()
        try:
            connection.autocommit = True
            with connection.cursor() as cursor:
                cursor.execute(f'CREATE SCHEMA "{cls.schema}"')
                cursor.execute(f'SET search_path TO "{cls.schema}", public')
                cursor.execute(UP_SQL)
        finally:
            connection.close()
        cls.engine = create_engine(DATABASE_URL, connect_args={"options": f"-csearch_path={cls.schema},public"})
        cls.bundle = load_registry_bundle()

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()
        connection = cls.admin_engine.raw_connection()
        try:
            connection.autocommit = True
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{cls.schema}", public')
                cursor.execute(DOWN_SQL)
                cursor.execute(f'DROP SCHEMA "{cls.schema}"')
        finally:
            connection.close()
            cls.admin_engine.dispose()

    def setUp(self):
        with self.engine.begin() as connection:
            connection.execute(text("TRUNCATE flat_claim_evidence, flat_evidence_sources, flat_rera_references, flat_project_aliases, flat_projects, flat_developer_aliases, flat_developers"))

    def counts(self):
        with self.engine.connect() as connection:
            return {key: connection.execute(text(f"SELECT count(*) FROM {table}")).scalar_one() for key, table in TABLES.items()}

    def test_validation_and_dry_run_leave_schema_empty(self):
        self.assertEqual(validate_hyderabad_launch_registry(self.bundle), [])
        self.assertEqual(self.counts(), {key: 0 for key in TABLES})

    def test_first_import_readback_and_idempotent_reimport(self):
        repository = PostgresFlatProjectRepository(self.engine)
        expected_counts = registry_summary(self.bundle)
        repository.upsert_registry(self.bundle)
        self.assertEqual(self.counts(), expected_counts)
        expected = {(project.id, project.canonical_name, project.locality_slug) for project in self.bundle.projects}
        actual = {(row["id"], row["canonical_name"], row["locality_slug"]) for row in repository.list_supported_projects("hyderabad")}
        self.assertEqual(actual, expected)

        repository.upsert_registry(self.bundle)
        self.assertEqual(self.counts(), expected_counts)
        actual_ids = {row["id"] for row in repository.list_supported_projects("hyderabad")}
        self.assertEqual(actual_ids, {project.id for project in self.bundle.projects})

    def test_invalid_fixture_mutations_are_rejected_before_writes(self):
        mutations = []
        unsafe = deepcopy(self.bundle)
        unsafe.evidence_sources[0].data_origin = DataOrigin.TEST
        mutations.append(unsafe)

        locality = deepcopy(self.bundle)
        locality.projects[0].locality_slug = "invalid-locality"
        mutations.append(locality)

        mismatch = deepcopy(self.bundle)
        project = mismatch.projects[0]
        claim = next(item for item in mismatch.claim_evidence if item.project_id == project.id and item.claim_key == "identity.locality")
        claim.observed_value = "hyderabad/kokapet"
        claim.fingerprint = claim_fingerprint(subject_type="project", subject_id=project.id, claim_key=claim.claim_key, observed_value=claim.observed_value, evidence_source_id=claim.evidence_source_id)
        mutations.append(mismatch)

        repository = PostgresFlatProjectRepository(self.engine)
        for bundle in mutations:
            with self.subTest(bundle=bundle.projects[0].locality_slug):
                with self.assertRaises(FlatDnaRegistryValidationError):
                    repository.upsert_registry(bundle)
                self.assertEqual(self.counts(), {key: 0 for key in TABLES})

    def test_database_failure_rolls_back_complete_registry_transaction(self):
        bundle = deepcopy(self.bundle)
        duplicate = deepcopy(bundle.evidence_sources[0])
        duplicate.id = uuid4()
        bundle.evidence_sources.append(duplicate)
        self.assertEqual(validate_hyderabad_launch_registry(bundle), [])
        with self.assertRaises(IntegrityError):
            PostgresFlatProjectRepository(self.engine).upsert_registry(bundle)
        self.assertEqual(self.counts(), {key: 0 for key in TABLES})

    def test_z_registry_migration_rolls_back_and_reapplies_empty(self):
        PostgresFlatProjectRepository(self.engine).upsert_registry(self.bundle)
        self.assertEqual(self.counts(), registry_summary(self.bundle))

        connection = self.engine.raw_connection()
        try:
            connection.autocommit = True
            with connection.cursor() as cursor:
                cursor.execute(DOWN_SQL)
                cursor.execute(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema = current_schema() AND table_name LIKE 'flat_%'"
                )
                self.assertEqual(cursor.fetchall(), [])
                cursor.execute(UP_SQL)
        finally:
            connection.close()
        self.assertEqual(self.counts(), {key: 0 for key in TABLES})


if __name__ == "__main__":
    unittest.main()
