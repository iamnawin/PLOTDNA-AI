import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app


class LocationSearchRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def search(self, query: str):
        return self.client.post("/api/utils/search-location", json={"query": query})

    def test_exact_locality_search_selects_its_polygon(self):
        response = self.search("Isnapur")

        self.assertEqual(response.status_code, 200)
        result = response.json()["results"][0]
        self.assertEqual(result["localitySlug"], "isnapur")
        self.assertEqual(result["source"], "local_index")
        self.assertEqual(result["precision"], "exact_boundary")
        self.assertEqual(result["resolution"]["resolvedPlaceSlug"], "isnapur")

    def test_typo_search_uses_bounded_local_similarity(self):
        response = self.search("Isnapoor")

        self.assertEqual(response.status_code, 200)
        result = response.json()["results"][0]
        self.assertEqual(result["localitySlug"], "isnapur")
        self.assertEqual(result["matchKind"], "fuzzy")

    def test_airport_landmark_alias_resolves_to_shamshabad_context(self):
        response = self.search("Rajiv Gandhi International Airport")

        self.assertEqual(response.status_code, 200)
        result = response.json()["results"][0]
        self.assertEqual(result["localitySlug"], "shamshabad")
        self.assertEqual(result["displayName"], "Rajiv Gandhi International Airport")
        self.assertEqual(result["precision"], "landmark")

    def test_full_address_geocodes_then_resolves_containing_polygon(self):
        provider_result = {
            "lat": 17.345,
            "lng": 78.545,
            "display_name": "3-1, LB Nagar, Hyderabad, Telangana 500074",
            "locality": "LB Nagar",
            "city": "Hyderabad",
        }
        with patch(
            "app.services.location_search.geocode_address",
            new=AsyncMock(return_value=provider_result),
        ):
            response = self.search("3-1, LB Nagar, Hyderabad, Telangana 500074")

        self.assertEqual(response.status_code, 200)
        result = response.json()["results"][0]
        self.assertEqual(result["source"], "geocoder")
        self.assertEqual(result["localitySlug"], "lb-nagar")
        self.assertEqual(result["precision"], "geocoded_point")
        self.assertEqual(result["resolution"]["resolvedPlaceSlug"], "lb-nagar")

    def test_outskirt_address_inside_68km_market_resolves_to_containing_polygon(self):
        provider_result = {
            "lat": 17.592,
            "lng": 77.887,
            "display_name": "Munipally, Sangareddy district, Telangana",
            "locality": "Munipally",
            "city": "Sangareddy",
        }
        with patch(
            "app.services.location_search.geocode_address",
            new=AsyncMock(return_value=provider_result),
        ):
            response = self.search("Munipally Sangareddy Telangana")

        self.assertEqual(response.status_code, 200)
        result = response.json()["results"][0]
        self.assertEqual(result["source"], "geocoder")
        self.assertEqual(result["localitySlug"], "munipally")
        self.assertEqual(result["precision"], "geocoded_point")
        self.assertEqual(result["resolution"]["resolvedPlaceSlug"], "munipally")

    def test_context_only_outskirt_address_returns_data_pending_not_nearby_score(self):
        provider_result = {
            "lat": 16.982074,
            "lng": 78.293363,
            "display_name": "Sangam, Rangareddy district, Telangana",
            "locality": "Sangam",
            "city": "Hyderabad",
        }
        with patch(
            "app.services.location_search.geocode_address",
            new=AsyncMock(return_value=provider_result),
        ):
            response = self.search("Sangam Rangareddy Telangana")

        self.assertEqual(response.status_code, 200)
        result = response.json()["results"][0]
        self.assertEqual(result["source"], "geocoder")
        self.assertEqual(result["precision"], "context_area")
        self.assertEqual(result["localitySlug"], "ctx-madhurapur-shadnagar")
        self.assertEqual(result["resolution"]["tier"], "context")
        self.assertEqual(result["resolution"]["resolvedPlaceSlug"], "ctx-madhurapur-shadnagar")
        self.assertIsNone(result["resolution"]["analysisSlug"])
        self.assertIsNone(result["resolution"]["catalogArea"])
        self.assertEqual(result["resolution"]["boundaryKind"], "place_context_cell")
        self.assertEqual(result["resolution"]["scorePrecision"], "unscored_context")

    def test_outside_market_address_is_not_substituted_with_nearest_hyderabad_area(self):
        provider_result = {
            "lat": 12.9716,
            "lng": 77.5946,
            "display_name": "MG Road, Bengaluru, Karnataka",
            "locality": "MG Road",
            "city": "Bangalore",
        }
        with patch(
            "app.services.location_search.geocode_address",
            new=AsyncMock(return_value=provider_result),
        ):
            response = self.search("MG Road, Bengaluru")

        self.assertEqual(response.status_code, 200)
        result = response.json()["results"][0]
        self.assertEqual(result["precision"], "outside_market")
        self.assertIsNone(result["localitySlug"])
        self.assertIsNone(result["resolution"])

    def test_provider_no_result_returns_empty_results(self):
        with patch(
            "app.services.location_search.geocode_address",
            new=AsyncMock(return_value=None),
        ):
            response = self.search("address that does not exist 123")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"], [])
        self.assertEqual(response.json()["reason"], "no_result")


if __name__ == "__main__":
    unittest.main()
