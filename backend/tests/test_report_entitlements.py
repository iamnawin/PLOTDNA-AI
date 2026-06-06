import os
import tempfile
import unittest
import json

from fastapi.testclient import TestClient

from app.core.auth import create_access_token
from app.core.config import settings
from app.main import app
from app.services.entitlements_store import set_email


class ReportEntitlementRouteTests(unittest.TestCase):
    def _client_with_user(self, user_id: str) -> tuple[TestClient, dict[str, str]]:
        client = TestClient(app)
        return client, {"Authorization": f"Bearer {create_access_token(user_id)}"}

    def test_report_access_requires_payment_for_unentitled_user(self):
        with tempfile.TemporaryDirectory() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            try:
                client, headers = self._client_with_user("ordinary-user")

                response = client.get(
                    "/api/v1/entitlements/report-access",
                    params={"packageInterest": "instant_pdf_99"},
                    headers=headers,
                )

                self.assertEqual(response.status_code, 200)
                body = response.json()
                self.assertFalse(body["canAccess"])
                self.assertTrue(body["requiresPayment"])
                self.assertEqual(body["reason"], "payment_required")
                self.assertEqual(body["packageInterest"], "instant_pdf_99")
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path

    def test_report_access_allows_admin_test_email_without_payment(self):
        with tempfile.TemporaryDirectory() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            previous_admins = settings.ADMIN_ACCESS_EMAILS
            previous_app_env = settings.APP_ENV
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            settings.ADMIN_ACCESS_EMAILS = "founder@plotdna.ai, qa@plotdna.ai"
            settings.APP_ENV = "development"
            try:
                client, headers = self._client_with_user("admin-user")
                set_email("admin-user", "qa@plotdna.ai")

                response = client.get(
                    "/api/v1/entitlements/report-access",
                    params={"packageInterest": "custom_due_diligence_499"},
                    headers=headers,
                )

                self.assertEqual(response.status_code, 200)
                body = response.json()
                self.assertTrue(body["canAccess"])
                self.assertFalse(body["requiresPayment"])
                self.assertEqual(body["reason"], "admin_allowlist")
                self.assertEqual(body["email"], "qa@plotdna.ai")
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                settings.ADMIN_ACCESS_EMAILS = previous_admins
                settings.APP_ENV = previous_app_env

    def test_report_access_allows_admin_user_id_without_payment_in_production(self):
        with tempfile.TemporaryDirectory() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            previous_admin_user_ids = settings.ADMIN_ACCESS_USER_IDS
            previous_app_env = settings.APP_ENV
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            settings.ADMIN_ACCESS_USER_IDS = "prod-admin-user"
            settings.APP_ENV = "production"
            try:
                client, headers = self._client_with_user("prod-admin-user")

                response = client.get(
                    "/api/v1/entitlements/report-access",
                    params={"packageInterest": "instant_pdf_99"},
                    headers=headers,
                )

                self.assertEqual(response.status_code, 200)
                body = response.json()
                self.assertTrue(body["canAccess"])
                self.assertFalse(body["requiresPayment"])
                self.assertEqual(body["reason"], "admin_allowlist")
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                settings.ADMIN_ACCESS_USER_IDS = previous_admin_user_ids
                settings.APP_ENV = previous_app_env

    def test_report_access_ignores_self_declared_admin_email_in_production(self):
        with tempfile.TemporaryDirectory() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            previous_admins = settings.ADMIN_ACCESS_EMAILS
            previous_app_env = settings.APP_ENV
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            settings.ADMIN_ACCESS_EMAILS = "qa@plotdna.ai"
            settings.APP_ENV = "production"
            try:
                client, headers = self._client_with_user("claimed-admin-email")
                set_email("claimed-admin-email", "qa@plotdna.ai")

                response = client.get(
                    "/api/v1/entitlements/report-access",
                    params={"packageInterest": "instant_pdf_99"},
                    headers=headers,
                )

                self.assertEqual(response.status_code, 200)
                body = response.json()
                self.assertFalse(body["canAccess"])
                self.assertTrue(body["requiresPayment"])
                self.assertEqual(body["reason"], "payment_required")
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                settings.ADMIN_ACCESS_EMAILS = previous_admins
                settings.APP_ENV = previous_app_env

    def test_report_access_rejects_unknown_package(self):
        with tempfile.TemporaryDirectory() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            try:
                client, headers = self._client_with_user("ordinary-user")

                response = client.get(
                    "/api/v1/entitlements/report-access",
                    params={"packageInterest": "unknown"},
                    headers=headers,
                )

                self.assertEqual(response.status_code, 422)
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path

    def test_claim_paid_access_activates_session_for_manually_paid_lead(self):
        with tempfile.TemporaryDirectory() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            previous_leads_path = os.environ.get("CUSTOM_REPORT_LEADS_PATH")
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            os.environ["CUSTOM_REPORT_LEADS_PATH"] = os.path.join(tmp, "custom-report-leads.jsonl")
            try:
                client, headers = self._client_with_user("returning-paid-user")
                lead_response = client.post(
                    "/api/leads/custom-report",
                    json={
                        "name": "Naveen",
                        "email": "buyer@example.com",
                        "phone": "+91 98765 43210",
                        "citySlug": "hyderabad",
                        "cityName": "Hyderabad",
                        "areaSlug": "adibatla",
                        "areaName": "Adibatla",
                        "packageInterest": "instant_pdf_99",
                        "source": "area_report_summary",
                    },
                )
                self.assertEqual(lead_response.status_code, 200)

                with open(os.environ["CUSTOM_REPORT_LEADS_PATH"], encoding="utf-8") as f:
                    record = json.loads(f.readline())
                record["paymentStatus"] = "paid"
                record["paidAt"] = "2026-06-06T12:00:00+00:00"
                with open(os.environ["CUSTOM_REPORT_LEADS_PATH"], "w", encoding="utf-8") as f:
                    f.write(json.dumps(record))
                    f.write("\n")

                claim_response = client.post(
                    "/api/v1/entitlements/claim-paid-access",
                    json={
                        "email": "BUYER@example.com",
                        "phone": "09876543210",
                        "packageInterest": "instant_pdf_99",
                    },
                    headers=headers,
                )

                self.assertEqual(claim_response.status_code, 200)
                claim_body = claim_response.json()
                self.assertTrue(claim_body["matched"])
                self.assertEqual(claim_body["leadId"], lead_response.json()["leadId"])
                self.assertTrue(claim_body["entitlements"]["subscription_active"])
                self.assertEqual(claim_body["entitlements"]["email"], "buyer@example.com")

                access_response = client.get(
                    "/api/v1/entitlements/report-access",
                    params={"packageInterest": "instant_pdf_99"},
                    headers=headers,
                )
                self.assertTrue(access_response.json()["canAccess"])
                self.assertEqual(access_response.json()["reason"], "subscription_active")
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                if previous_leads_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_leads_path

    def test_report_access_recognizes_manually_paid_lead_for_same_user_id(self):
        with tempfile.TemporaryDirectory() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            previous_leads_path = os.environ.get("CUSTOM_REPORT_LEADS_PATH")
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            os.environ["CUSTOM_REPORT_LEADS_PATH"] = os.path.join(tmp, "custom-report-leads.jsonl")
            try:
                client, headers = self._client_with_user("same-browser-user")
                lead_response = client.post(
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
                    headers=headers,
                )
                self.assertEqual(lead_response.status_code, 200)

                with open(os.environ["CUSTOM_REPORT_LEADS_PATH"], encoding="utf-8") as f:
                    record = json.loads(f.readline())
                record["paymentStatus"] = "paid"
                record["paidAt"] = "2026-06-06T12:00:00+00:00"
                with open(os.environ["CUSTOM_REPORT_LEADS_PATH"], "w", encoding="utf-8") as f:
                    f.write(json.dumps(record))
                    f.write("\n")

                access_response = client.get(
                    "/api/v1/entitlements/report-access",
                    params={"packageInterest": "instant_pdf_99"},
                    headers=headers,
                )

                self.assertEqual(access_response.status_code, 200)
                body = access_response.json()
                self.assertTrue(body["canAccess"])
                self.assertFalse(body["requiresPayment"])
                self.assertEqual(body["reason"], "subscription_active")

                entitlement_response = client.get("/api/v1/entitlements", headers=headers)
                self.assertTrue(entitlement_response.json()["subscription_active"])
                self.assertEqual(entitlement_response.json()["email"], "buyer@example.com")
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                if previous_leads_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_leads_path

    def test_claim_paid_access_does_not_activate_pending_lead(self):
        with tempfile.TemporaryDirectory() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            previous_leads_path = os.environ.get("CUSTOM_REPORT_LEADS_PATH")
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            os.environ["CUSTOM_REPORT_LEADS_PATH"] = os.path.join(tmp, "custom-report-leads.jsonl")
            try:
                client, headers = self._client_with_user("pending-user")
                lead_response = client.post(
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
                )
                self.assertEqual(lead_response.status_code, 200)

                claim_response = client.post(
                    "/api/v1/entitlements/claim-paid-access",
                    json={
                        "email": "buyer@example.com",
                        "phone": "9876543210",
                        "packageInterest": "instant_pdf_99",
                    },
                    headers=headers,
                )

                self.assertEqual(claim_response.status_code, 200)
                claim_body = claim_response.json()
                self.assertFalse(claim_body["matched"])
                self.assertIsNone(claim_body["leadId"])
                self.assertFalse(claim_body["entitlements"]["subscription_active"])
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                if previous_leads_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_leads_path


if __name__ == "__main__":
    unittest.main()
