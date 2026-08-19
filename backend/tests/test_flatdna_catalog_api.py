import unittest
from contextlib import contextmanager
from datetime import date
from unittest.mock import patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.api.routes import flat as flat_route
from app.core.config import Settings
from app.core.config import settings
from app.main import app
from app.services.flatdna.catalog_query import PostgresFlatCatalogRepository


class FakeResult:
    def __init__(self, rows):
        self.rows = rows

    def mappings(self):
        return self

    def first(self):
        return self.rows[0] if self.rows else None

    def all(self):
        return self.rows


class FakeConnection:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def execute(self, statement, parameters=None):
        self.calls.append((" ".join(str(statement).split()), parameters or {}))
        return FakeResult(self.responses.pop(0))


class FakeConnect:
    def __init__(self, connection):
        self.connection = connection

    def __enter__(self):
        return self.connection

    def __exit__(self, exc_type, exc, traceback):
        return False


class FakeEngine:
    def __init__(self, responses):
        self.connection = FakeConnection(responses)

    def connect(self):
        return FakeConnect(self.connection)


class FlatDnaCatalogApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_catalog_feature_defaults_off(self):
        self.assertFalse(Settings(_env_file=None).ENABLE_FLATDNA_CATALOG)

    def test_status_reads_one_active_published_snapshot(self):
        row = {
            "snapshot_id": "tg-rera-2026-08-19-001",
            "source_as_of": "2026-08-19",
            "metrics": {"searchable_records": 2480, "reviewed_projects": 14},
        }
        engine = FakeEngine([[row]])

        result = PostgresFlatCatalogRepository(engine).get_published_status()

        self.assertEqual(result, row)
        sql = engine.connection.calls[0][0]
        self.assertIn("superseded_at IS NULL", sql)
        self.assertIn("JOIN flat_catalog_snapshots", sql)

    def test_search_is_scoped_to_active_snapshot_and_searchable_rows(self):
        row = {
            "project_id": UUID("20000000-0000-4000-8000-000000000001"),
            "registration_id": UUID("30000000-0000-4000-8000-000000000001"),
            "total": 1,
        }
        engine = FakeEngine([[row]])

        rows = PostgresFlatCatalogRepository(engine).search("Aparna", offset=0, limit=20)

        self.assertEqual(rows, [row])
        sql, parameters = engine.connection.calls[0]
        self.assertIn("catalog_status = 'SEARCHABLE'", sql)
        self.assertIn("publication.superseded_at IS NULL", sql)
        self.assertIn("min(match_rank) OVER () AS best_rank", sql)
        self.assertIn("match_rank = prioritized.best_rank", sql)
        self.assertEqual(parameters["query"], "%aparna%")

    def test_detail_and_warnings_share_the_active_snapshot_project(self):
        detail = {
            "project_id": UUID("20000000-0000-4000-8000-000000000001"),
            "registration_id": UUID("30000000-0000-4000-8000-000000000001"),
            "snapshot_id": "tg-rera-2026-08-19-001",
        }
        warning = {"flag_type": "DEFAULTER", "warning_origin": "TG_RERA"}
        engine = FakeEngine([[detail], [warning]])

        project, warnings = PostgresFlatCatalogRepository(engine).get_detail(
            detail["registration_id"]
        )

        self.assertEqual(project, detail)
        self.assertEqual(warnings, [warning])
        detail_sql = engine.connection.calls[0][0]
        warning_sql = engine.connection.calls[1][0]
        self.assertIn("catalog_status = 'SEARCHABLE'", detail_sql)
        self.assertIn("warning.project_id = :project_id", warning_sql)

    def test_catalog_routes_are_separately_default_off(self):
        with (
            patch.object(settings, "ENABLE_FLAT_DNA", True),
            patch.object(settings, "ENABLE_FLATDNA_CATALOG", False),
            patch.object(flat_route, "get_flatdna_catalog_repository") as provider,
        ):
            response = self.client.get("/api/v1/flat/catalog/status")
        self.assertEqual(response.status_code, 404)
        provider.assert_not_called()

    def test_catalog_gate_does_not_depend_on_legacy_pilot_gate(self):
        class Repository:
            def get_published_status(self):
                return {
                    "snapshot_id": "tg-rera-2026-08-19-001",
                    "source_as_of": date(2026, 8, 19),
                    "metrics": {"searchable_records": 10, "reviewed_projects": 2},
                }

        with (
            patch.object(settings, "ENABLE_FLAT_DNA", False),
            patch.object(settings, "ENABLE_FLATDNA_CATALOG", True),
            patch.object(flat_route, "get_flatdna_catalog_repository", return_value=Repository()),
        ):
            response = self.client.get("/api/v1/flat/catalog/status")
        self.assertEqual(response.status_code, 200)

    def test_catalog_status_and_search_expose_one_snapshot(self):
        project_id = UUID("20000000-0000-4000-8000-000000000001")
        registration_id = UUID("30000000-0000-4000-8000-000000000001")

        class Repository:
            def get_published_status(self):
                return {
                    "snapshot_id": "tg-rera-2026-08-19-001",
                    "source_as_of": date(2026, 8, 19),
                    "metrics": {"searchable_records": 2480, "reviewed_projects": 14},
                }

            def search(self, query, *, offset, limit):
                return [{
                    "project_id": project_id,
                    "registration_id": registration_id,
                    "canonical_name": "Example Heights",
                    "developer_name": "Example Developer",
                    "authority_code": "TG_RERA",
                    "registration_number": "P02400000001",
                    "city_slug": "hyderabad",
                    "locality_slug": "kokapet",
                    "location_precision": "LOCALITY",
                    "review_status": "REVIEW_REQUIRED",
                    "identity_status": "PARTIALLY_RESOLVED",
                    "project_status": "ACTIVE",
                    "catalog_status": "SEARCHABLE",
                    "source_as_of": date(2026, 8, 19),
                    "snapshot_id": "tg-rera-2026-08-19-001",
                    "query_type": "PROJECT",
                    "total": 1,
                }]

        with (
            patch.object(settings, "ENABLE_FLAT_DNA", True),
            patch.object(settings, "ENABLE_FLATDNA_CATALOG", True),
            patch.object(flat_route, "get_flatdna_catalog_repository", return_value=Repository()),
        ):
            status_response = self.client.get("/api/v1/flat/catalog/status")
            search_response = self.client.get(
                "/api/v1/flat/catalog/projects/search",
                params={"q": "Example"},
            )

        self.assertEqual(status_response.status_code, 200)
        self.assertEqual(status_response.json()["catalog_snapshot_id"], "tg-rera-2026-08-19-001")
        self.assertEqual(status_response.json()["indexed_records"], 2480)
        payload = search_response.json()
        self.assertEqual(payload["catalog_snapshot_id"], "tg-rera-2026-08-19-001")
        self.assertEqual(payload["candidates"][0]["catalog_layer"], "DETAILS_BEING_VERIFIED")
        self.assertEqual(payload["candidates"][0]["location_label"], "Locality-level location")

    def test_catalog_detail_uses_snapshot_warning_and_source_wording(self):
        project_id = UUID("20000000-0000-4000-8000-000000000001")
        registration_id = UUID("30000000-0000-4000-8000-000000000001")

        class Repository:
            def get_detail(self, requested_registration_id):
                self.requested = requested_registration_id
                return ({
                    "project_id": project_id,
                    "registration_id": registration_id,
                    "canonical_name": "Example Heights",
                    "developer_name": "Example Developer",
                    "authority_code": "TG_RERA",
                    "registration_number": "P02400000001",
                    "city_slug": "hyderabad",
                    "locality_slug": "kokapet",
                    "latitude": None,
                    "longitude": None,
                    "location_precision": "LOCALITY",
                    "review_status": "REVIEW_REQUIRED",
                    "identity_status": "PARTIALLY_RESOLVED",
                    "project_status": "ACTIVE",
                    "catalog_status": "SEARCHABLE",
                    "source_as_of": date(2026, 8, 19),
                    "snapshot_id": "tg-rera-2026-08-19-001",
                    "current_review_id": None,
                    "historical_reviewed_at": None,
                    "historical_review_valid_until": None,
                    "source_identifier": "https://rera.telangana.gov.in/",
                    "source_retrieved_at": "2026-08-19T00:00:00+05:30",
                }, [{
                    "flag_type": "DEFAULTER",
                    "warning_origin": "TG_RERA",
                    "warning_status": "ACTIVE",
                    "public_origin_label": "Reported in TG-RERA records",
                    "source_label": "TG-RERA defaulter publication",
                    "source_url": "https://rera.telangana.gov.in/",
                    "source_as_of": date(2026, 8, 19),
                    "observed_at": "2026-08-19T00:00:00+05:30",
                }])

        with (
            patch.object(settings, "ENABLE_FLATDNA_CATALOG", True),
            patch.object(flat_route, "get_flatdna_catalog_repository", return_value=Repository()),
        ):
            response = self.client.get(
                f"/api/v1/flat/catalog/projects/{registration_id}"
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["catalog_layer"], "DETAILS_BEING_VERIFIED")
        self.assertEqual(payload["warnings"][0]["origin_label"], "Reported in TG-RERA records")
        self.assertEqual(payload["sources"][0]["url"], "https://rera.telangana.gov.in/")


if __name__ == "__main__":
    unittest.main()
