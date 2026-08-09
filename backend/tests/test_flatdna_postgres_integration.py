import os
import unittest
from pathlib import Path
from uuid import uuid4

import psycopg2
from sqlalchemy import create_engine


REPO_ROOT = Path(__file__).resolve().parents[2]
UP_SQL = (REPO_ROOT / "backend" / "migrations" / "0001_flatdna_registry.up.sql").read_text(encoding="utf-8")
DOWN_SQL = (REPO_ROOT / "backend" / "migrations" / "0001_flatdna_registry.down.sql").read_text(encoding="utf-8")
DATABASE_URL = os.getenv("FLATDNA_TEST_DATABASE_URL", "")
EXPECTED_TABLES = {
    "flat_developers",
    "flat_developer_aliases",
    "flat_projects",
    "flat_project_aliases",
    "flat_rera_references",
    "flat_evidence_sources",
    "flat_claim_evidence",
}


@unittest.skipUnless(DATABASE_URL, "FLATDNA_TEST_DATABASE_URL is required for real PostgreSQL acceptance")
class FlatDnaPostgresIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = f"flatdna_0b_{uuid4().hex}"
        cls.engine = create_engine(DATABASE_URL)
        connection = cls.engine.raw_connection()
        try:
            connection.autocommit = True
            with connection.cursor() as cursor:
                cursor.execute(f'CREATE SCHEMA "{cls.schema}"')
                cursor.execute(f'SET search_path TO "{cls.schema}", public')
                cursor.execute(UP_SQL)
        finally:
            connection.close()

    @classmethod
    def tearDownClass(cls):
        connection = cls.engine.raw_connection()
        try:
            connection.autocommit = True
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{cls.schema}", public')
                existing = cls._table_names(cursor)
                if existing:
                    cursor.execute(DOWN_SQL)
                cursor.execute(f'DROP SCHEMA "{cls.schema}"')
        finally:
            connection.close()
            cls.engine.dispose()

    def setUp(self):
        self.connection = self.engine.raw_connection()
        self.connection.autocommit = False
        self.cursor = self.connection.cursor()
        self.cursor.execute(f'SET search_path TO "{self.schema}", public')
        self.cursor.execute(
            "TRUNCATE flat_claim_evidence, flat_evidence_sources, flat_rera_references, "
            "flat_project_aliases, flat_projects, flat_developer_aliases, flat_developers"
        )
        self.connection.commit()

    def tearDown(self):
        self.cursor.close()
        self.connection.close()

    @staticmethod
    def _table_names(cursor):
        cursor.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = current_schema() AND table_name LIKE 'flat_%'"
        )
        return {row[0] for row in cursor.fetchall()}

    def _insert_developer(self, developer_id=None):
        developer_id = developer_id or uuid4()
        self.cursor.execute(
            "INSERT INTO flat_developers (id, canonical_name, normalized_name) VALUES (%s, %s, %s)",
            (developer_id, "Example Developer", "example developer"),
        )
        return developer_id

    def _insert_project(self, developer_id, *, project_id=None, name="Example Heights", status="DRAFT"):
        project_id = project_id or uuid4()
        self.cursor.execute(
            """
            INSERT INTO flat_projects (
                id, developer_id, canonical_name, normalized_name, city_slug, locality_slug,
                latitude, longitude, location_precision, registry_status
            ) VALUES (%s, %s, %s, %s, 'hyderabad', 'kokapet', 17.400000, 78.300000,
                      'PROJECT_CENTROID', %s)
            """,
            (project_id, developer_id, name, name.lower(), status),
        )
        return project_id

    def _insert_source(self, *, source_id=None, origin="CURATED", status="ACTIVE"):
        source_id = source_id or uuid4()
        self.cursor.execute(
            """
            INSERT INTO flat_evidence_sources (
                id, source_class, data_origin, publisher, source_ref, retrieved_at, source_status
            ) VALUES (%s, 'CURATED_REFERENCE', %s, 'Reviewed source', %s, now(), %s)
            """,
            (source_id, origin, f"source-{source_id}", status),
        )
        return source_id

    def _insert_core_claims(self, project_id, developer_id, source_id):
        values = {
            "identity.canonical_name": "example heights",
            "identity.developer": str(developer_id),
            "identity.locality": "hyderabad/kokapet",
            "identity.coordinates": "17.400000,78.300000",
        }
        for claim_key, value in values.items():
            self.cursor.execute(
                """
                INSERT INTO flat_claim_evidence (
                    id, evidence_source_id, project_id, claim_key, observed_value,
                    review_status, reviewed_by, reviewed_at, fingerprint
                ) VALUES (%s, %s, %s, %s, %s, 'APPROVED', 'reviewer', now(), %s)
                """,
                (uuid4(), source_id, project_id, claim_key, value, uuid4().hex + uuid4().hex),
            )

    def _insert_valid_supported_project(self):
        developer_id = self._insert_developer()
        project_id = self._insert_project(developer_id)
        source_id = self._insert_source()
        self._insert_core_claims(project_id, developer_id, source_id)
        self.cursor.execute("UPDATE flat_projects SET registry_status = 'SUPPORTED' WHERE id = %s", (project_id,))
        self.connection.commit()
        return project_id, source_id

    def test_clean_apply_created_exactly_seven_empty_tables(self):
        self.assertEqual(self._table_names(self.cursor), EXPECTED_TABLES)
        for table in EXPECTED_TABLES:
            self.cursor.execute(f"SELECT count(*) FROM {table}")
            self.assertEqual(self.cursor.fetchone()[0], 0)

    def test_explicit_uuid_is_preserved_and_draft_is_allowed(self):
        developer_id = uuid4()
        project_id = uuid4()
        self._insert_developer(developer_id)
        self._insert_project(developer_id, project_id=project_id)
        self.connection.commit()
        self.cursor.execute("SELECT id, registry_status FROM flat_projects WHERE id = %s", (project_id,))
        self.assertEqual(self.cursor.fetchone(), (project_id, "DRAFT"))

    def test_foreign_keys_are_enforced(self):
        with self.assertRaises(psycopg2.IntegrityError):
            self.cursor.execute(
                """
                INSERT INTO flat_project_aliases (id, project_id, alias, normalized_alias, alias_type)
                VALUES (%s, %s, 'Unknown', 'unknown', 'MARKETING')
                """,
                (uuid4(), uuid4()),
            )
            self.connection.commit()
        self.connection.rollback()

    def test_alias_uniqueness_is_parent_scoped(self):
        developer_id = self._insert_developer()
        first_project = self._insert_project(developer_id)
        second_project = self._insert_project(developer_id, name="Other Heights")
        for project_id in (first_project, second_project):
            self.cursor.execute(
                """
                INSERT INTO flat_project_aliases (id, project_id, alias, normalized_alias, alias_type)
                VALUES (%s, %s, 'Shared Name', 'shared name', 'MARKETING')
                """,
                (uuid4(), project_id),
            )
        self.connection.commit()
        with self.assertRaises(psycopg2.IntegrityError):
            self.cursor.execute(
                """
                INSERT INTO flat_project_aliases (id, project_id, alias, normalized_alias, alias_type)
                VALUES (%s, %s, 'Shared Name!', 'shared name', 'COMMON_MISSPELLING')
                """,
                (uuid4(), first_project),
            )
            self.connection.commit()
        self.connection.rollback()

    def test_duplicate_rera_reference_is_rejected(self):
        developer_id = self._insert_developer()
        project_id = self._insert_project(developer_id)
        self.cursor.execute(
            """
            INSERT INTO flat_rera_references (
                id, project_id, authority_code, registration_number, normalized_registration_number
            ) VALUES (%s, %s, 'TSRERA', 'P000001', 'p000001')
            """,
            (uuid4(), project_id),
        )
        with self.assertRaises(psycopg2.IntegrityError):
            self.cursor.execute(
                """
                INSERT INTO flat_rera_references (
                    id, project_id, authority_code, registration_number, normalized_registration_number
                ) VALUES (%s, %s, 'TSRERA', 'P000001', 'p000001')
                """,
                (uuid4(), project_id),
            )
            self.connection.commit()
        self.connection.rollback()

    def test_test_and_synthetic_origins_are_rejected_by_postgres(self):
        for origin in ("TEST", "SYNTHETIC"):
            with self.subTest(origin=origin):
                with self.assertRaises(psycopg2.IntegrityError):
                    self._insert_source(origin=origin)
                    self.connection.commit()
                self.connection.rollback()

    def test_supported_project_without_evidence_is_rejected(self):
        developer_id = self._insert_developer()
        self._insert_project(developer_id, status="SUPPORTED")
        with self.assertRaises(psycopg2.IntegrityError):
            self.connection.commit()
        self.connection.rollback()

    def test_valid_supported_project_and_evidence_invalidation_rules(self):
        project_id, source_id = self._insert_valid_supported_project()
        self.cursor.execute("UPDATE flat_evidence_sources SET source_status = 'INVALID' WHERE id = %s", (source_id,))
        with self.assertRaises(psycopg2.IntegrityError):
            self.connection.commit()
        self.connection.rollback()

        self.cursor.execute("UPDATE flat_projects SET registry_status = 'DRAFT' WHERE id = %s", (project_id,))
        self.cursor.execute("UPDATE flat_evidence_sources SET source_status = 'INVALID' WHERE id = %s", (source_id,))
        self.connection.commit()
        self.cursor.execute("SELECT registry_status FROM flat_projects WHERE id = %s", (project_id,))
        self.assertEqual(self.cursor.fetchone()[0], "DRAFT")

    def test_z_down_removes_objects_and_up_reapplies(self):
        self.connection.commit()
        self.connection.autocommit = True
        self.cursor.execute(DOWN_SQL)
        self.assertEqual(self._table_names(self.cursor), set())
        self.cursor.execute(UP_SQL)
        self.assertEqual(self._table_names(self.cursor), EXPECTED_TABLES)


if __name__ == "__main__":
    unittest.main()
