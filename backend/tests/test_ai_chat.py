import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app


class AiChatRouteTests(unittest.TestCase):
    def test_fallback_answer_uses_area_context_without_inventing(self):
        client = TestClient(app)

        with patch("app.api.routes.ai.call_text_model", return_value=None):
            response = client.post(
                "/api/ai/chat",
                json={
                    "question": "Compare this with nearby areas",
                    "context": {
                        "page": "area",
                        "cityName": "Hyderabad",
                        "areaName": "Beeramguda",
                        "resolutionTier": "exact_locality",
                        "summary": "DNA 68, livability is steady, risk is moderate.",
                    },
                },
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["source"], "fallback")
        self.assertIn("Beeramguda", body["answer"])
        self.assertIn("DNA 68", body["answer"])
        self.assertIn("moderate", body["answer"])
        self.assertIn("nearby", body["answer"].lower())
        self.assertNotIn("right level for a local comparison view", body["answer"])

    def test_fallback_answer_warns_when_coordinate_context_is_broad(self):
        client = TestClient(app)

        with patch("app.api.routes.ai.call_text_model", return_value=None):
            response = client.post(
                "/api/ai/chat",
                json={
                    "question": "Is this accurate?",
                    "context": {
                        "page": "map",
                        "cityName": "Hyderabad",
                        "coords": [17.5, 78.4],
                        "resolutionTier": "uncovered",
                        "resolutionLabel": "live coordinate",
                    },
                },
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["source"], "fallback")
        self.assertIn("approximate", body["answer"].lower())
        self.assertIn("17.50000, 78.40000", body["answer"])
        self.assertIn("supported locality", body["answer"].lower())


if __name__ == "__main__":
    unittest.main()
