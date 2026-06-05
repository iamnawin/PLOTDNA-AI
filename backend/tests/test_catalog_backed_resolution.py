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
            json={"lat": 13.249, "lng": 77.762},
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

    def test_hyderabad_frontier_corridors_resolve_as_exact_polygon_hits(self):
        client = TestClient(app)

        frontier_points = [
            ("kollur", 17.425, 78.205),
            ("beeramguda", 17.51527, 78.29213),
            ("isnapur", 17.533, 78.276),
            ("bhanur", 17.477, 78.178),
            ("sangareddy", 17.624, 78.09),
            ("kandi", 17.584, 78.124),
            ("rudraram", 17.548, 78.189),
            ("indresham", 17.498, 78.251),
            ("rameshwar-banda", 17.469, 78.232),
            ("ghanpur", 17.506, 78.139),
            ("hathnoor", 17.653, 78.286),
            ("jogipet", 17.837, 78.063),
            ("mominpet", 17.403, 77.767),
            ("dharur", 17.455, 77.755),
        ]

        for expected_slug, lat, lng in frontier_points:
            with self.subTest(area=expected_slug):
                response = client.post(
                    "/api/utils/resolve",
                    json={"lat": lat, "lng": lng},
                )

                self.assertEqual(response.status_code, 200)
                body = response.json()
                self.assertEqual(body["tier"], "exact")
                self.assertEqual(body["citySlug"], "hyderabad")
                self.assertEqual(body["localitySlug"], expected_slug)
                self.assertEqual(body["matchedBy"], "polygon")
                self.assertEqual(body["catalogArea"]["slug"], expected_slug)


if __name__ == "__main__":
    unittest.main()
