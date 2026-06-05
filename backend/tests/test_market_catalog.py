import json
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.services.market_catalog import get_city_area, list_city_areas


SUPPORTED_CITY_EXPECTATIONS = {
    "hyderabad": ("adibatla", 240),
    "bangalore": ("devanahalli", 20),
    "mumbai": ("panvel", 20),
    "chennai": ("kelambakkam", 21),
    "pune": ("kharadi", 20),
    "delhi": ("dwarka-expressway", 20),
    "vijayawada": ("amaravati", 12),
    "vizag": ("madhurawada", 12),
}


class MarketCatalogServiceTests(unittest.TestCase):
    def test_lists_supported_india_city_areas_from_catalog(self):
        for city_slug, (expected_area_slug, expected_count) in SUPPORTED_CITY_EXPECTATIONS.items():
            with self.subTest(city=city_slug):
                areas = list_city_areas(city_slug)

                self.assertEqual(len(areas), expected_count)
                self.assertTrue(any(area.slug == expected_area_slug for area in areas))

    def test_gets_hyderabad_area_detail(self):
        area = get_city_area("hyderabad", "adibatla")

        self.assertIsNotNone(area)
        assert area is not None
        self.assertEqual(area.slug, "adibatla")
        self.assertEqual(area.name, "Adibatla")
        self.assertEqual(area.category, "Emerging")
        self.assertIsInstance(area.center, list)
        self.assertGreaterEqual(len(area.polygon), 4)
        self.assertEqual(area.signals.infrastructure, 92)

    def test_hyderabad_catalog_matches_locality_polygons(self):
        localities_path = (
            Path(__file__).resolve().parents[2]
            / "data"
            / "cities"
            / "hyderabad"
            / "localities.json"
        )
        localities = json.loads(localities_path.read_text(encoding="utf-8-sig"))

        locality_slugs = {locality["slug"] for locality in localities}
        catalog_slugs = {area.slug for area in list_city_areas("hyderabad")}

        self.assertSetEqual(catalog_slugs, locality_slugs)

    def test_unknown_city_returns_empty_list(self):
        self.assertEqual(list_city_areas("unknown-city"), [])

    def test_unknown_area_returns_none(self):
        self.assertIsNone(get_city_area("hyderabad", "missing-area"))


class MarketCatalogRouteTests(unittest.TestCase):
    def test_area_list_route_returns_supported_india_city_areas(self):
        client = TestClient(app)

        for city_slug, (expected_area_slug, expected_count) in SUPPORTED_CITY_EXPECTATIONS.items():
            with self.subTest(city=city_slug):
                response = client.get(f"/api/areas/?city={city_slug}")

                self.assertEqual(response.status_code, 200)
                body = response.json()
                self.assertEqual(body["city"]["slug"], city_slug)
                self.assertEqual(len(body["areas"]), expected_count)
                self.assertTrue(any(area["slug"] == expected_area_slug for area in body["areas"]))

    def test_area_detail_route_returns_supported_india_city_area(self):
        client = TestClient(app)

        for city_slug, (expected_area_slug, _) in SUPPORTED_CITY_EXPECTATIONS.items():
            with self.subTest(city=city_slug):
                response = client.get(f"/api/areas/{city_slug}/{expected_area_slug}")

                self.assertEqual(response.status_code, 200)
                body = response.json()
                self.assertEqual(body["slug"], expected_area_slug)
                self.assertIn("signals", body)
                self.assertGreaterEqual(len(body["polygon"]), 4)

    def test_area_detail_route_404s_for_missing_area(self):
        client = TestClient(app)

        response = client.get("/api/areas/hyderabad/missing-area")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Area not found")


if __name__ == "__main__":
    unittest.main()
