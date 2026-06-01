import json
import os
import tempfile
import unittest

from fastapi.testclient import TestClient

from app.main import app


class AnalyticsEventRouteTests(unittest.TestCase):
    def test_analytics_event_is_stored(self):
        with tempfile.TemporaryDirectory() as tmp:
            events_path = os.path.join(tmp, "analytics-events.jsonl")
            previous_path = os.environ.get("ANALYTICS_EVENTS_PATH")
            os.environ["ANALYTICS_EVENTS_PATH"] = events_path
            try:
                client = TestClient(app)

                response = client.post(
                    "/api/analytics/events",
                    json={
                        "name": "custom_report_requested",
                        "payload": {
                            "citySlug": "hyderabad",
                            "areaSlug": "adibatla",
                            "source": "area_report_summary",
                        },
                        "at": "2026-06-01T14:10:00.000Z",
                    },
                )

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["status"], "success")

                with open(events_path, encoding="utf-8") as f:
                    records = [json.loads(line) for line in f if line.strip()]

                self.assertEqual(len(records), 1)
                self.assertEqual(records[0]["name"], "custom_report_requested")
                self.assertEqual(records[0]["payload"]["areaSlug"], "adibatla")
                self.assertIn("receivedAt", records[0])
            finally:
                if previous_path is None:
                    os.environ.pop("ANALYTICS_EVENTS_PATH", None)
                else:
                    os.environ["ANALYTICS_EVENTS_PATH"] = previous_path

    def test_analytics_event_rejects_empty_name(self):
        client = TestClient(app)

        response = client.post(
            "/api/analytics/events",
            json={"name": " ", "payload": {}},
        )

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
