import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

from app.api.routes import flat as flat_route
from app.core.config import settings
from app.main import app
from app.services.flatdna.models import normalize_identity
from app.services.flatdna.registry_io import load_registry_bundle
from app.services.flatdna.repository import PostgresFlatProjectRepository


ROOT = Path(__file__).resolve().parents[2]
UP_SQL = (ROOT / "backend" / "migrations" / "0001_flatdna_registry.up.sql").read_text(encoding="utf-8")
DOWN_SQL = (ROOT / "backend" / "migrations" / "0001_flatdna_registry.down.sql").read_text(encoding="utf-8")
CORPUS = json.loads(
    (ROOT / "data" / "cities" / "hyderabad" / "flatdna" / "resolver-cases.json").read_text(
        encoding="utf-8"
    )
)["cases"]
DATABASE_URL = os.getenv("FLATDNA_TEST_DATABASE_URL", "")


@unittest.skipUnless(DATABASE_URL, "FLATDNA_TEST_DATABASE_URL is required for Batch 0E PostgreSQL acceptance")
class FlatDnaApiPostgresTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = f"flatdna_0e_{uuid4().hex}"
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
        cls.repository = PostgresFlatProjectRepository(cls.engine)
        cls.bundle = load_registry_bundle()
        cls.repository.upsert_registry(cls.bundle)
        cls.client = TestClient(app)

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

    def request(self, query):
        with (
            patch.object(settings, "ENABLE_FLAT_DNA", True),
            patch.object(flat_route, "get_flatdna_repository", return_value=self.repository),
        ):
            return self.client.get("/api/v1/flat/projects/search", params={"q": query})

    def test_complete_corpus_through_http_uses_supported_postgres_rows(self):
        self.assertEqual(len(CORPUS), 59)
        for case in CORPUS:
            with self.subTest(case=case["case_id"], query=case["query"]):
                response = self.request(case["query"])
                if not normalize_identity(case["query"]):
                    self.assertEqual(response.status_code, 422)
                    continue
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                self.assertEqual(payload["outcome"], case["expected_outcome"])
                if case.get("expected_project_id"):
                    self.assertEqual(payload["project"]["project_id"], case["expected_project_id"])
                if case.get("expected_project_ids"):
                    candidate_ids = [candidate["project_id"] for candidate in payload["candidates"]]
                    self.assertEqual(
                        candidate_ids[:len(case["expected_project_ids"])],
                        case["expected_project_ids"],
                    )
                    self.assertLessEqual(len(candidate_ids), 5)

    def test_draft_and_inactive_alias_are_not_exposed(self):
        draft_id = uuid4()
        inactive_alias = self.bundle.project_aliases[0]
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
                {"alias_id": str(inactive_alias.id)},
            )

        draft_response = self.request("Myscape Songs of the Sun")
        alias_response = self.request(inactive_alias.alias)
        self.assertEqual(draft_response.json(), {"outcome": "NOT_FOUND", "code": "PROJECT_NOT_FOUND"})
        self.assertEqual(alias_response.json(), {"outcome": "NOT_FOUND", "code": "PROJECT_NOT_FOUND"})

    def test_repeated_postgres_requests_are_deterministic(self):
        first = self.request("Aparna Sarovar")
        second = self.request("Aparna Sarovar")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.content, second.content)


if __name__ == "__main__":
    unittest.main()
