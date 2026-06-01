import unittest

from fastapi.testclient import TestClient

from app.main import app


class CatalogBackedResolutionRouteTests(unittest.TestCase):
    def test_exact_resolution_includes_catalog_area(self):
        client = TestClient(app)

        response = client.post(
            "/api/utils/resolve",
            json={
                "lat": 17.265,
                "lng": 78.575,
                "locality": "Adibatla",
                "city": "Hyderabad",
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["tier"], "exact")
        self.assertEqual(body["citySlug"], "hyderabad")
        self.assertEqual(body["localitySlug"], "adibatla")
        self.assertEqual(body["catalogArea"]["slug"], "adibatla")
        self.assertEqual(body["catalogArea"]["score"], 88)
        self.assertEqual(body["catalogArea"]["signals"]["infrastructure"], 92)

    def test_nearby_resolution_includes_catalog_area(self):
        client = TestClient(app)

        response = client.post(
            "/api/utils/resolve",
            json={"lat": 13.249, "lng": 77.718},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["tier"], "nearby")
        self.assertEqual(body["citySlug"], "bangalore")
        self.assertEqual(body["localitySlug"], "devanahalli")
        self.assertEqual(body["catalogArea"]["slug"], "devanahalli")
        self.assertEqual(body["catalogArea"]["score"], 87)

    def test_cluster_resolution_has_no_catalog_area(self):
        client = TestClient(app)

        response = client.post(
            "/api/utils/resolve",
            json={"lat": 12.8, "lng": 77.8},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["tier"], "cluster")
        self.assertIsNone(body["catalogArea"])


if __name__ == "__main__":
    unittest.main()
