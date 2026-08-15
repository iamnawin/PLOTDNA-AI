import unittest
from contextlib import contextmanager
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.api.routes import flat as flat_route
from app.core.config import settings
from app.main import app
from app.services.flatdna.resolver import RankedCandidate, ResolverOutcome, ResolverResult
from tests.test_flatdna_resolver import fixture_projects


ROOT = Path(__file__).resolve().parents[2]


def identity_rows():
    rows = []
    for project in fixture_projects():
        aliases = project.aliases or (None,)
        for alias in aliases:
            rows.append(
                {
                    "project_id": project.project_id,
                    "canonical_name": project.canonical_name,
                    "normalized_name": project.normalized_name,
                    "developer_id": project.developer_id,
                    "developer_name": project.developer_name,
                    "developer_normalized_name": project.developer_normalized_name,
                    "developer_normalized_alias": (
                        "aparna group"
                        if project.developer_name == "Aparna Constructions"
                        else None
                    ),
                    "city_slug": project.city_slug,
                    "locality_slug": project.locality_slug,
                    "alias_id": alias.id if alias else None,
                    "alias": alias.alias if alias else None,
                    "normalized_alias": alias.normalized_alias if alias else None,
                    "alias_type": alias.alias_type if alias else None,
                    "registration_number": (
                        "P02400004696"
                        if project.canonical_name == "My Home Nishada"
                        else None
                    ),
                    "normalized_registration_number": (
                        "p02400004696"
                        if project.canonical_name == "My Home Nishada"
                        else None
                    ),
                }
            )
    return rows


class FakeRepository:
    def __init__(self, rows=None, error=None, projects=None, rera_references=None, sources=None):
        self.rows = identity_rows() if rows is None else rows
        self.error = error
        self.calls = []
        self.projects = projects if projects is not None else [
            {
                "id": UUID("421c032d-37c5-4e88-8c18-3b1185ac825f"),
                "canonical_name": "My Home Nishada",
                "developer_name": "My Home Constructions",
                "city_slug": "hyderabad",
                "locality_slug": "kokapet",
                "latitude": Decimal("17.405700"),
                "longitude": Decimal("78.308357"),
                "location_precision": "PROJECT_CENTROID",
            }
        ]
        self.rera_references = rera_references if rera_references is not None else [
            {
                "authority_code": "TSRERA",
                "registration_number": "P02400004696",
                "reference_status": "VERIFIED",
            }
        ]
        self.sources = sources if sources is not None else [
            {
                "source_class": "OFFICIAL_REGULATOR",
                "publisher": "Telangana RERA",
                "title": "Registered project record",
                "url": "https://rera.telangana.gov.in/",
                "retrieved_at": datetime(2026, 8, 9, tzinfo=timezone.utc),
            }
        ]

    def list_supported_project_identity_rows(self, city_slug):
        self.calls.append(city_slug)
        if self.error:
            raise self.error
        return self.rows

    def list_supported_projects(self, city_slug):
        self.calls.append(city_slug)
        if self.error:
            raise self.error
        return self.projects

    def get_supported_project(self, project_id):
        self.calls.append(project_id)
        if self.error:
            raise self.error
        return next((project for project in self.projects if project["id"] == project_id), None)

    def list_supported_project_rera_references(self, project_id):
        self.calls.append(project_id)
        if self.error:
            raise self.error
        return self.rera_references

    def list_supported_project_sources(self, project_id):
        self.calls.append(project_id)
        if self.error:
            raise self.error
        return self.sources


class FlatDnaApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        flat_route.get_flatdna_repository.cache_clear()

    def tearDown(self):
        flat_route.get_flatdna_repository.cache_clear()

    @contextmanager
    def enabled(self, repository):
        with (
            patch.object(settings, "ENABLE_FLAT_DNA", True),
            patch.object(flat_route, "get_flatdna_repository", return_value=repository),
        ):
            yield

    def test_feature_gate_hides_search_without_repository_work(self):
        with (
            patch.object(settings, "ENABLE_FLAT_DNA", False),
            patch.object(flat_route, "get_flatdna_repository") as provider,
        ):
            response = self.client.get("/api/v1/flat/projects/search", params={"q": "My Home Nishada"})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Not Found"})
        provider.assert_not_called()

    def test_status_reports_registry_readiness(self):
        with patch.object(settings, "ENABLE_FLAT_DNA", False):
            disabled = self.client.get("/api/v1/flat/status")
        self.assertEqual(disabled.status_code, 404)
        self.assertEqual(disabled.json(), {"detail": "Not Found"})

        with self.enabled(FakeRepository()):
            response = self.client.get("/api/v1/flat/status")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "enabled",
                "phase": "1A",
                "registry": "available",
                "supported_projects": 1,
            },
        )

    def test_project_detail_returns_only_reviewed_supported_fields(self):
        repository = FakeRepository()
        project_id = "421c032d-37c5-4e88-8c18-3b1185ac825f"
        with self.enabled(repository):
            response = self.client.get(f"/api/v1/flat/projects/{project_id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "project_id": project_id,
                "canonical_name": "My Home Nishada",
                "developer_name": "My Home Constructions",
                "city_slug": "hyderabad",
                "locality_slug": "kokapet",
                "rera_registration_numbers": ["P02400004696"],
                "latitude": 17.4057,
                "longitude": 78.308357,
                "location_precision": "PROJECT_CENTROID",
                "rera_references": [
                    {
                        "authority_code": "TSRERA",
                        "registration_number": "P02400004696",
                        "reference_status": "VERIFIED",
                    }
                ],
                "sources": [
                    {
                        "source_class": "OFFICIAL_REGULATOR",
                        "publisher": "Telangana RERA",
                        "title": "Registered project record",
                        "url": "https://rera.telangana.gov.in/",
                        "retrieved_at": "2026-08-09T00:00:00Z",
                    }
                ],
            },
        )
        self.assertNotIn("score", response.json())
        self.assertNotIn("valuation", response.json())

    def test_project_detail_hides_unknown_or_unsupported_identity(self):
        with self.enabled(FakeRepository(projects=[])):
            response = self.client.get(
                "/api/v1/flat/projects/421c032d-37c5-4e88-8c18-3b1185ac825f"
            )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Project not found"})

    def test_invalid_queries_return_422_without_repository_work(self):
        repository = FakeRepository()
        with self.enabled(repository):
            paths = [
                "/api/v1/flat/projects/search",
                "/api/v1/flat/projects/search?q=",
                "/api/v1/flat/projects/search?q=%20%20%20",
            ]
            for path in paths:
                with self.subTest(path=path):
                    self.assertEqual(self.client.get(path).status_code, 422)
            self.assertEqual(
                self.client.get("/api/v1/flat/projects/search", params={"q": "x" * 161}).status_code,
                422,
            )
            self.assertEqual(
                self.client.get("/api/v1/flat/projects/search", params={"q": "!!! 🚀"}).status_code,
                422,
            )
        self.assertEqual(repository.calls, [])

    def test_exact_alias_and_typo_matches_return_safe_canonical_identity(self):
        repository = FakeRepository()
        cases = (
            ("My Home Nishada", "CANONICAL"),
            ("Nishada", "ALIAS"),
            ("my home tridassa", "FUZZY"),
        )
        with self.enabled(repository):
            for query, match_type in cases:
                with self.subTest(query=query):
                    response = self.client.get("/api/v1/flat/projects/search", params={"q": query})
                    self.assertEqual(response.status_code, 200)
                    payload = response.json()
                    self.assertEqual(payload["outcome"], "MATCHED")
                    self.assertEqual(payload["match_type"], match_type)
                    self.assertEqual(
                        set(payload["project"]),
                        {
                            "project_id", "canonical_name", "developer_name", "city_slug",
                            "locality_slug", "rera_registration_numbers",
                        },
                    )
                    self.assertNotIn("score", payload)
                    self.assertNotIn("reason", payload)

    def test_stable_uuid_and_trimmed_unicode_input(self):
        repository = FakeRepository()
        with self.enabled(repository):
            matched = self.client.get(
                "/api/v1/flat/projects/search", params={"q": "  -- My Home Nishada!!  "}
            )
            unicode_query = self.client.get(
                "/api/v1/flat/projects/search", params={"q": "అపర్ణ సరోవర్"}
            )
        self.assertEqual(matched.status_code, 200)
        self.assertEqual(matched.json()["project"]["project_id"], "421c032d-37c5-4e88-8c18-3b1185ac825f")
        self.assertEqual(unicode_query.status_code, 200)

    def test_project_family_returns_ordered_results_and_does_not_select(self):
        repository = FakeRepository()
        with self.enabled(repository):
            response = self.client.get(
                "/api/v1/flat/projects/search", params={"q": "Aparna Sarovar"}
            )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["outcome"], "RESULTS")
        self.assertEqual(payload["query_type"], "PROJECT")
        self.assertEqual(
            [candidate["canonical_name"] for candidate in payload["candidates"][:2]],
            ["Aparna Sarovar Zenith", "Aparna Sarovar Zicon"],
        )
        self.assertNotIn("project", payload)

    def test_builder_search_returns_every_indexed_project_with_pagination(self):
        repository = FakeRepository()
        with self.enabled(repository):
            response = self.client.get(
                "/api/v1/flat/projects/search",
                params={"q": "Aparna", "offset": 1, "limit": 2},
            )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["outcome"], "RESULTS")
        self.assertEqual(payload["query_type"], "BUILDER")
        self.assertEqual(payload["total"], 4)
        self.assertEqual(payload["offset"], 1)
        self.assertEqual(payload["limit"], 2)
        self.assertEqual(
            [candidate["canonical_name"] for candidate in payload["candidates"]],
            ["Aparna Newlands", "Aparna Sarovar Zenith"],
        )

    def test_locality_search_returns_all_indexed_projects(self):
        repository = FakeRepository()
        with self.enabled(repository):
            response = self.client.get(
                "/api/v1/flat/projects/search", params={"q": "Kokapet"}
            )
        payload = response.json()
        self.assertEqual(payload["outcome"], "RESULTS")
        self.assertEqual(payload["query_type"], "LOCALITY")
        self.assertGreaterEqual(payload["total"], 2)
        self.assertTrue(all(row["locality_slug"] == "kokapet" for row in payload["candidates"]))

    def test_builder_search_accepts_approved_developer_alias(self):
        repository = FakeRepository()
        with self.enabled(repository):
            response = self.client.get(
                "/api/v1/flat/projects/search", params={"q": "Aparna Group"}
            )
        payload = response.json()
        self.assertEqual(payload["outcome"], "RESULTS")
        self.assertEqual(payload["query_type"], "BUILDER")
        self.assertEqual(payload["total"], 4)

    def test_project_family_search_returns_all_indexed_phases(self):
        repository = FakeRepository()
        with self.enabled(repository):
            response = self.client.get(
                "/api/v1/flat/projects/search", params={"q": "Aparna Sarovar"}
            )
        payload = response.json()
        self.assertEqual(payload["outcome"], "RESULTS")
        self.assertEqual(payload["query_type"], "PROJECT")
        self.assertEqual(
            [candidate["canonical_name"] for candidate in payload["candidates"]],
            ["Aparna Sarovar Zenith", "Aparna Sarovar Zicon"],
        )

    def test_exact_rera_number_returns_project_without_fuzzy_matching(self):
        repository = FakeRepository()
        with self.enabled(repository):
            response = self.client.get(
                "/api/v1/flat/projects/search", params={"q": "P02400004696"}
            )
        payload = response.json()
        self.assertEqual(payload["outcome"], "MATCHED")
        self.assertEqual(payload["match_type"], "RERA")
        self.assertEqual(payload["project"]["canonical_name"], "My Home Nishada")
        self.assertEqual(payload["project"]["rera_registration_numbers"], ["P02400004696"])

    def test_search_pagination_is_bounded(self):
        repository = FakeRepository()
        with self.enabled(repository):
            zero = self.client.get(
                "/api/v1/flat/projects/search", params={"q": "Aparna", "limit": 0}
            )
            too_large = self.client.get(
                "/api/v1/flat/projects/search", params={"q": "Aparna", "limit": 51}
            )
            negative = self.client.get(
                "/api/v1/flat/projects/search", params={"q": "Aparna", "offset": -1}
            )
        self.assertEqual(zero.status_code, 422)
        self.assertEqual(too_large.status_code, 422)
        self.assertEqual(negative.status_code, 422)

    def test_ambiguous_candidates_are_capped_at_five_without_reordering(self):
        projects = fixture_projects()[:6]
        candidates = tuple(
            RankedCandidate(project, 10_000 - index, "CANONICAL", project.canonical_name)
            for index, project in enumerate(projects)
        )
        result = ResolverResult(ResolverOutcome.AMBIGUOUS, None, candidates, "TEST_COLLISION")
        with self.enabled(FakeRepository()), patch.object(flat_route, "resolve_project", return_value=result):
            response = self.client.get("/api/v1/flat/projects/search", params={"q": "valid query"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [candidate["project_id"] for candidate in response.json()["candidates"]],
            [str(project.project_id) for project in projects[:5]],
        )

    def test_not_found_is_a_200_domain_outcome(self):
        repository = FakeRepository()
        with self.enabled(repository):
            for query in ("Unknown Heights", "Prestige High Fields", "Gachibowli"):
                with self.subTest(query=query):
                    response = self.client.get("/api/v1/flat/projects/search", params={"q": query})
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.json(), {"outcome": "NOT_FOUND", "code": "PROJECT_NOT_FOUND"})

    def test_database_failure_returns_redacted_503(self):
        error = OperationalError("SELECT secret", {}, RuntimeError("db-password-should-not-leak"))
        with self.enabled(FakeRepository(error=error)):
            response = self.client.get("/api/v1/flat/projects/search", params={"q": "My Home Nishada"})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {"detail": "FlatDNA project search is temporarily unavailable."},
        )
        self.assertNotIn("password", response.text.lower())
        self.assertNotIn("select", response.text.lower())

    def test_missing_database_configuration_returns_503(self):
        with patch.object(settings, "ENABLE_FLAT_DNA", True), patch.object(settings, "DATABASE_URL", None):
            response = self.client.get("/api/v1/flat/projects/search", params={"q": "My Home Nishada"})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"detail": "FlatDNA project search is temporarily unavailable."})

    def test_repeated_requests_are_deterministic(self):
        repository = FakeRepository()
        with self.enabled(repository):
            first = self.client.get("/api/v1/flat/projects/search", params={"q": "Aparna Sarovar"})
            second = self.client.get("/api/v1/flat/projects/search", params={"q": "Aparna Sarovar"})
        self.assertEqual(first.content, second.content)

    def test_route_has_no_forbidden_runtime_fallback_or_external_dependency(self):
        source = (ROOT / "backend" / "app" / "api" / "routes" / "flat.py").read_text(
            encoding="utf-8"
        ).lower()
        for forbidden in (
            "registry.json", "resolver-cases.json", "ai_provider", "gemini", "openai",
            "httpx", "requests", "redis", "rera_verification", "tsrera_scraper", "analytics",
        ):
            self.assertNotIn(forbidden, source)


if __name__ == "__main__":
    unittest.main()
