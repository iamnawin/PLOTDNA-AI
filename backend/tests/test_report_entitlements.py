import os
import tempfile
import unittest

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


if __name__ == "__main__":
    unittest.main()
