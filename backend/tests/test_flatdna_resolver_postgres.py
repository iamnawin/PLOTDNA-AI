import json
import os
import unittest
from pathlib import Path
from uuid import uuid4

from sqlalchemy import create_engine, text

from app.services.flatdna.registry_io import load_registry_bundle
from app.services.flatdna.repository import PostgresFlatProjectRepository
from app.services.flatdna.resolver import project_identities_from_rows, resolve_project


ROOT = Path(__file__).resolve().parents[2]
UP_SQL = (ROOT / "backend" / "migrations" / "0001_flatdna_registry.up.sql").read_text(encoding="utf-8")
DOWN_SQL = (ROOT / "backend" / "migrations" / "0001_flatdna_registry.down.sql").read_text(encoding="utf-8")
CORPUS = json.loads(
    (ROOT / "data" / "cities" / "hyderabad" / "flatdna" / "resolver-cases.json").read_text(
        encoding="utf-8"
    )
)["cases"]
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


@unittest.skipUnless(DATABASE_URL, "FLATDNA_TEST_DATABASE_URL is required for Batch 0D PostgreSQL acceptance")
class FlatDnaResolverPostgresTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = f"flatdna_0d_{uuid4().hex}"
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
        cls.engine = create_engine(
            DATABASE_URL,
            connect_args={"options": f"-csearch_path={cls.schema},public"},
        )
        cls.bundle = load_registry_bundle()

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()
        connection = cls.admin_engine.raw_connection()
        try:
            connection.autocommit = True
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{cls.schema}", public')
                if cls._table_names(cursor):
                    cursor.execute(DOWN_SQL)
                cursor.execute(f'DROP SCHEMA "{cls.schema}"')
        finally:
            connection.close()
            cls.admin_engine.dispose()

    def setUp(self):
        with self.engine.begin() as connection:
            connection.execute(
                text(
                    "TRUNCATE flat_claim_evidence, flat_evidence_sources, flat_rera_references, "
                    "flat_project_aliases, flat_projects, flat_developer_aliases, flat_developers"
                )
            )
        PostgresFlatProjectRepository(self.engine).upsert_registry(self.bundle)

    @staticmethod
    def _table_names(cursor):
        cursor.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = current_schema() AND table_name LIKE 'flat_%'"
        )
        return {row[0] for row in cursor.fetchall()}

    def _projects(self):
        rows = PostgresFlatProjectRepository(self.engine).list_supported_project_identity_rows("hyderabad")
        return project_identities_from_rows(rows)

    def _assert_corpus(self):
        projects = self._projects()
        self.assertEqual(len(projects), 14)
        self.assertEqual(sum(len(project.aliases) for project in projects), 9)
        for case in CORPUS:
            with self.subTest(case=case["case_id"]):
                result = resolve_project(case["query"], projects)
                self.assertEqual(result.outcome.value, case["expected_outcome"])
                self.assertEqual(
                    str(result.project.project_id) if result.project else None,
                    case.get("expected_project_id"),
                )

    def test_complete_corpus_resolves_from_supported_postgres_rows(self):
        self._assert_corpus()

    def test_draft_project_and_inactive_alias_are_not_candidates(self):
        draft_id = uuid4()
        inactive_alias_id = self.bundle.project_aliases[0].id
        with self.engine.begin() as connection:
            connection.execute(
                text(
                    """
                    INSERT INTO flat_projects (
                        id, developer_id, canonical_name, normalized_name, city_slug, locality_slug,
                        location_precision, registry_status
                    ) VALUES (
                        :id, :developer_id, 'Myscape Songs of the Sun', 'myscape songs of the sun',
                        'hyderabad', 'financial-district', 'UNKNOWN', 'DRAFT'
                    )
                    """
                ),
                {"id": str(draft_id), "developer_id": str(self.bundle.projects[0].developer_id)},
            )
            connection.execute(
                text("UPDATE flat_project_aliases SET active = false WHERE id = :alias_id"),
                {"alias_id": str(inactive_alias_id)},
            )
        projects = self._projects()
        self.assertNotIn(draft_id, {project.project_id for project in projects})
        self.assertNotIn(
            inactive_alias_id,
            {alias.id for project in projects for alias in project.aliases},
        )
        self.assertEqual(resolve_project("Myscape Songs of the Sun", projects).outcome.value, "NOT_FOUND")

    def test_z_down_reapply_and_full_corpus_repeat_cleanly(self):
        connection = self.engine.raw_connection()
        try:
            connection.autocommit = True
            with connection.cursor() as cursor:
                cursor.execute(DOWN_SQL)
                self.assertEqual(self._table_names(cursor), set())
                cursor.execute(UP_SQL)
                self.assertEqual(self._table_names(cursor), EXPECTED_TABLES)
        finally:
            connection.close()
        PostgresFlatProjectRepository(self.engine).upsert_registry(self.bundle)
        self._assert_corpus()


if __name__ == "__main__":
    unittest.main()
