import os
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.api.routes import flat as flat_route
from app.core.config import Settings, settings
from app.main import app


class FlatDnaPhase0ATests(unittest.TestCase):
    def setUp(self) -> None:
        self.previous_enabled = settings.ENABLE_FLAT_DNA
        self.client = TestClient(app)

    def tearDown(self) -> None:
        settings.ENABLE_FLAT_DNA = self.previous_enabled

    def test_flatdna_defaults_off_when_environment_value_is_absent(self):
        with patch.dict(os.environ, {}, clear=True):
            isolated_settings = Settings(_env_file=None)

        self.assertFalse(isolated_settings.ENABLE_FLAT_DNA)

    def test_flatdna_boundary_is_not_found_when_disabled(self):
        settings.ENABLE_FLAT_DNA = False

        response = self.client.get("/api/v1/flat/status")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Not Found"})

    def test_enabled_status_reports_registry_readiness(self):
        settings.ENABLE_FLAT_DNA = True
        repository = MagicMock()
        repository.list_supported_projects.return_value = [{}] * 14

        with patch.object(flat_route, "get_flatdna_repository", return_value=repository):
            response = self.client.get("/api/v1/flat/status")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "enabled",
                "phase": "1A",
                "registry": "available",
                "supported_projects": 14,
            },
        )

    def test_existing_root_and_health_routes_are_unchanged(self):
        for enabled in (False, True):
            with self.subTest(enabled=enabled):
                settings.ENABLE_FLAT_DNA = enabled

                root_response = self.client.get("/")
                health_response = self.client.get("/health")

                self.assertEqual(root_response.status_code, 200)
                self.assertEqual(
                    root_response.json(),
                    {
                        "service": "PlotDNA API",
                        "version": "0.2.0",
                        "status": "live",
                        "docs": "/docs",
                        "endpoints": [
                            "/api/news/{city}",
                            "/api/verdict/{city}/{area}",
                        ],
                    },
                )
                self.assertEqual(health_response.status_code, 200)
                self.assertEqual(
                    health_response.json(),
                    {"status": "ok", "version": "0.2.0"},
                )


if __name__ == "__main__":
    unittest.main()
