import os
import tempfile
import unittest

from fastapi.testclient import TestClient

from app.core.auth import create_access_token
from app.core.config import settings
from app.main import app


class EmailOtpMetricsRouteTests(unittest.TestCase):
    def _client_with_user(self, user_id: str) -> tuple[TestClient, dict[str, str]]:
        client = TestClient(app)
        return client, {"Authorization": f"Bearer {create_access_token(user_id)}"}

    def _with_temp_db(self):
        return tempfile.TemporaryDirectory()

    def test_email_otp_verification_attaches_verified_email(self):
        with self._with_temp_db() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            previous_env = settings.APP_ENV
            previous_debug_emails = settings.EMAIL_OTP_DEBUG_EMAILS
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            settings.APP_ENV = "development"
            settings.EMAIL_OTP_DEBUG_EMAILS = ""
            try:
                client, headers = self._client_with_user("otp-user")

                request_response = client.post(
                    "/api/v1/auth/email-otp/request",
                    json={"email": " Buyer@Example.COM ", "name": " Naveen Buyer "},
                    headers=headers,
                )

                self.assertEqual(request_response.status_code, 200)
                request_body = request_response.json()
                self.assertEqual(request_body["email"], "buyer@example.com")
                self.assertEqual(request_body["status"], "sent")
                self.assertRegex(request_body["debugOtp"], r"^\d{6}$")

                verify_response = client.post(
                    "/api/v1/auth/email-otp/verify",
                    json={"email": "buyer@example.com", "otp": request_body["debugOtp"]},
                    headers=headers,
                )

                self.assertEqual(verify_response.status_code, 200)
                verify_body = verify_response.json()
                self.assertEqual(verify_body["email"], "buyer@example.com")
                self.assertEqual(verify_body["status"], "verified")
                self.assertIsNotNone(verify_body["entitlements"]["email"])
                self.assertEqual(verify_body["entitlements"]["email"], "buyer@example.com")
                self.assertEqual(verify_body["entitlements"]["name"], "Naveen Buyer")
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                settings.APP_ENV = previous_env
                settings.EMAIL_OTP_DEBUG_EMAILS = previous_debug_emails

    def test_production_otp_debug_code_is_available_only_for_allowlisted_test_email(self):
        with self._with_temp_db() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            previous_env = settings.APP_ENV
            previous_debug_emails = settings.EMAIL_OTP_DEBUG_EMAILS
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            settings.APP_ENV = "production"
            settings.EMAIL_OTP_DEBUG_EMAILS = "internal-test@example.com"
            try:
                client, headers = self._client_with_user("otp-debug-user")

                allowed_response = client.post(
                    "/api/v1/auth/email-otp/request",
                    json={"email": "internal-test@example.com", "name": "Internal Tester"},
                    headers=headers,
                )
                self.assertEqual(allowed_response.status_code, 200)
                self.assertRegex(allowed_response.json()["debugOtp"], r"^\d{6}$")

                other_client, other_headers = self._client_with_user("otp-normal-user")
                normal_response = other_client.post(
                    "/api/v1/auth/email-otp/request",
                    json={"email": "real-buyer@example.com", "name": "Real Buyer"},
                    headers=other_headers,
                )
                self.assertEqual(normal_response.status_code, 200)
                self.assertIsNone(normal_response.json()["debugOtp"])
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                settings.APP_ENV = previous_env
                settings.EMAIL_OTP_DEBUG_EMAILS = previous_debug_emails

    def test_email_otp_rejects_wrong_code_and_does_not_unlock_entitlement(self):
        with self._with_temp_db() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            previous_env = settings.APP_ENV
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            settings.APP_ENV = "development"
            try:
                client, headers = self._client_with_user("wrong-otp-user")

                client.post(
                    "/api/v1/auth/email-otp/request",
                    json={"email": "buyer@example.com"},
                    headers=headers,
                )
                verify_response = client.post(
                    "/api/v1/auth/email-otp/verify",
                    json={"email": "buyer@example.com", "otp": "000000"},
                    headers=headers,
                )

                self.assertEqual(verify_response.status_code, 400)

                entitlement_response = client.get("/api/v1/entitlements", headers=headers)
                self.assertEqual(entitlement_response.status_code, 200)
                self.assertIsNone(entitlement_response.json()["email"])
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                settings.APP_ENV = previous_env

    def test_legacy_email_attach_endpoint_no_longer_unlocks_email(self):
        with self._with_temp_db() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            try:
                client, headers = self._client_with_user("legacy-email-user")

                response = client.post(
                    "/api/v1/entitlements/email",
                    json={"email": "buyer@example.com"},
                    headers=headers,
                )

                self.assertEqual(response.status_code, 410)

                entitlement_response = client.get("/api/v1/entitlements", headers=headers)
                self.assertEqual(entitlement_response.status_code, 200)
                self.assertIsNone(entitlement_response.json()["email"])
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path

    def test_user_events_feed_admin_metrics_and_live_count(self):
        with self._with_temp_db() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            previous_admin_ids = settings.ADMIN_ACCESS_USER_IDS
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            settings.ADMIN_ACCESS_USER_IDS = "admin-user"
            try:
                client, buyer_headers = self._client_with_user("buyer-user")
                _, admin_headers = self._client_with_user("admin-user")

                otp_response = client.post(
                    "/api/v1/auth/email-otp/request",
                    json={"email": "buyer@example.com"},
                    headers=buyer_headers,
                )
                client.post(
                    "/api/v1/auth/email-otp/verify",
                    json={"email": "buyer@example.com", "otp": otp_response.json()["debugOtp"]},
                    headers=buyer_headers,
                )

                download_response = client.post(
                    "/api/v1/entitlements/events",
                    json={
                        "eventType": "pdf_downloaded",
                        "areaSlug": "tellapur",
                        "packageInterest": "instant_pdf_99",
                    },
                    headers=buyer_headers,
                )
                payment_response = client.post(
                    "/api/v1/entitlements/events",
                    json={
                        "eventType": "payment_started",
                        "areaSlug": "tellapur",
                        "packageInterest": "instant_pdf_99",
                    },
                    headers=buyer_headers,
                )
                metrics_response = client.get(
                    "/api/v1/entitlements/admin/metrics",
                    headers=admin_headers,
                )

                self.assertEqual(download_response.status_code, 200)
                self.assertEqual(payment_response.status_code, 200)
                self.assertEqual(metrics_response.status_code, 200)
                metrics = metrics_response.json()
                self.assertEqual(metrics["totalUsers"], 2)
                self.assertEqual(metrics["verifiedEmailUsers"], 1)
                self.assertEqual(metrics["downloadCount"], 1)
                self.assertEqual(metrics["paymentStartedCount"], 1)
                self.assertEqual(metrics["paidUserCount"], 0)
                self.assertGreaterEqual(metrics["liveUsers"], 1)
                self.assertEqual(metrics["topDownloadedAreas"][0]["areaSlug"], "tellapur")
                self.assertEqual(metrics["topDownloadedAreas"][0]["count"], 1)
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                settings.ADMIN_ACCESS_USER_IDS = previous_admin_ids

    def test_public_metrics_exposes_live_counts_without_admin_token(self):
        with self._with_temp_db() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            try:
                client, buyer_headers = self._client_with_user("public-metrics-user")
                event_response = client.post(
                    "/api/v1/entitlements/events",
                    json={"eventType": "landing_viewed"},
                    headers=buyer_headers,
                )
                metrics_response = client.get("/api/v1/entitlements/public/metrics")

                self.assertEqual(event_response.status_code, 200)
                self.assertEqual(metrics_response.status_code, 200)
                metrics = metrics_response.json()
                self.assertGreaterEqual(metrics["liveUsers"], 1)
                self.assertGreaterEqual(metrics["activeUsersToday"], 1)
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path


if __name__ == "__main__":
    unittest.main()
