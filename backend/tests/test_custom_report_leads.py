import json
import os
import tempfile
import unittest

from fastapi.testclient import TestClient

from app.main import app


class CustomReportLeadRouteTests(unittest.TestCase):
    def test_custom_report_lead_is_validated_and_stored(self):
        with tempfile.TemporaryDirectory() as tmp:
            leads_path = os.path.join(tmp, "custom-report-leads.jsonl")
            previous_path = os.environ.get("CUSTOM_REPORT_LEADS_PATH")
            os.environ["CUSTOM_REPORT_LEADS_PATH"] = leads_path
            try:
                client = TestClient(app)

                response = client.post(
                    "/api/leads/custom-report",
                    json={
                        "name": "Naveen",
                        "contact": "+91 98765 43210",
                        "citySlug": "hyderabad",
                        "cityName": "Hyderabad",
                        "areaSlug": "adibatla",
                        "areaName": "Adibatla",
                        "budgetRange": "50L-1Cr",
                        "timeline": "0-3 months",
                        "notes": "Need title and access checks before site visit.",
                        "source": "area_report_summary",
                    },
                )

                self.assertEqual(response.status_code, 200)
                body = response.json()
                self.assertEqual(body["status"], "success")
                self.assertEqual(body["leadType"], "phone")
                self.assertTrue(body["leadId"].startswith("cr_"))

                with open(leads_path, encoding="utf-8") as f:
                    records = [json.loads(line) for line in f if line.strip()]

                self.assertEqual(len(records), 1)
                self.assertEqual(records[0]["leadId"], body["leadId"])
                self.assertEqual(records[0]["areaSlug"], "adibatla")
                self.assertEqual(records[0]["contact"], "+91 98765 43210")
                self.assertEqual(records[0]["leadType"], "phone")
                self.assertIn("createdAt", records[0])
            finally:
                if previous_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_path

    def test_custom_report_lead_rejects_invalid_contact(self):
        client = TestClient(app)

        response = client.post(
            "/api/leads/custom-report",
            json={
                "name": "Naveen",
                "contact": "not-contactable",
                "citySlug": "hyderabad",
                "cityName": "Hyderabad",
                "areaSlug": "adibatla",
                "areaName": "Adibatla",
                "source": "area_report_summary",
            },
        )

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
