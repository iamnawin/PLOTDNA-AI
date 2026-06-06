import json
import os
import tempfile
import unittest

from fastapi.testclient import TestClient

from app.core.auth import create_access_token
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
                        "email": " Buyer@Example.COM ",
                        "phone": "+91 98765 43210",
                        "citySlug": "hyderabad",
                        "cityName": "Hyderabad",
                        "areaSlug": "adibatla",
                        "areaName": "Adibatla",
                        "budgetRange": "50L-1Cr",
                        "timeline": "0-3 months",
                        "packageInterest": "custom_due_diligence_499",
                        "notes": "Need title and access checks before site visit.",
                        "source": "area_report_summary",
                    },
                )

                self.assertEqual(response.status_code, 200)
                body = response.json()
                self.assertEqual(body["status"], "success")
                self.assertEqual(body["leadType"], "email")
                self.assertEqual(body["paymentStatus"], "pending")
                self.assertTrue(body["leadId"].startswith("cr_"))

                with open(leads_path, encoding="utf-8") as f:
                    records = [json.loads(line) for line in f if line.strip()]

                self.assertEqual(len(records), 1)
                self.assertEqual(records[0]["leadId"], body["leadId"])
                self.assertEqual(records[0]["areaSlug"], "adibatla")
                self.assertEqual(records[0]["email"], "buyer@example.com")
                self.assertEqual(records[0]["phone"], "9876543210")
                self.assertEqual(records[0]["leadType"], "email")
                self.assertEqual(records[0]["paymentStatus"], "pending")
                self.assertEqual(records[0]["packageInterest"], "custom_due_diligence_499")
                self.assertIn("createdAt", records[0])
            finally:
                if previous_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_path

    def test_custom_report_lead_rejects_invalid_email_or_phone(self):
        client = TestClient(app)

        response = client.post(
            "/api/leads/custom-report",
            json={
                "name": "Naveen",
                "email": "not-contactable",
                "phone": "12345",
                "citySlug": "hyderabad",
                "cityName": "Hyderabad",
                "areaSlug": "adibatla",
                "areaName": "Adibatla",
                "source": "area_report_summary",
            },
        )

        self.assertEqual(response.status_code, 422)

    def test_custom_report_lead_records_authenticated_user_id_when_available(self):
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
                        "email": "buyer@example.com",
                        "phone": "9876543210",
                        "citySlug": "hyderabad",
                        "cityName": "Hyderabad",
                        "areaSlug": "adibatla",
                        "areaName": "Adibatla",
                        "packageInterest": "instant_pdf_99",
                        "source": "area_report_summary",
                    },
                    headers={"Authorization": f"Bearer {create_access_token('lead-user-id')}"},
                )

                self.assertEqual(response.status_code, 200)
                with open(leads_path, encoding="utf-8") as f:
                    record = json.loads(f.readline())
                self.assertEqual(record["userId"], "lead-user-id")
            finally:
                if previous_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_path


if __name__ == "__main__":
    unittest.main()
