import hashlib
import hmac
import json
import os
import sqlite3
import tempfile
import unittest

from fastapi.testclient import TestClient

from app.core.auth import create_access_token
from app.core.config import settings
from app.main import app


class PaymentReconciliationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.previous_db_path = settings.ENTITLEMENTS_DB_PATH
        self.previous_webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        self.previous_leads_path = os.environ.get("CUSTOM_REPORT_LEADS_PATH")
        settings.ENTITLEMENTS_DB_PATH = os.path.join(self.tmp.name, "entitlements.sqlite3")
        settings.RAZORPAY_WEBHOOK_SECRET = "test-webhook-secret"
        os.environ["CUSTOM_REPORT_LEADS_PATH"] = os.path.join(self.tmp.name, "custom-report-leads.jsonl")
        self.client = TestClient(app)

    def tearDown(self):
        settings.ENTITLEMENTS_DB_PATH = self.previous_db_path
        settings.RAZORPAY_WEBHOOK_SECRET = self.previous_webhook_secret
        if self.previous_leads_path is None:
            os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
        else:
            os.environ["CUSTOM_REPORT_LEADS_PATH"] = self.previous_leads_path
        self.tmp.cleanup()

    def headers(self, user_id: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {create_access_token(user_id)}"}

    def create_paid_purchase(self) -> tuple[str, dict]:
        lead = self.client.post(
            "/api/leads/custom-report",
            headers=self.headers("original-browser"),
            json={
                "name": "Paid Buyer",
                "email": "buyer@example.com",
                "phone": "9876543210",
                "citySlug": "hyderabad",
                "cityName": "Hyderabad",
                "areaSlug": "isnapur",
                "areaName": "Isnapur",
                "packageInterest": "instant_pdf_99",
                "source": "area_report_summary",
            },
        )
        self.assertEqual(lead.status_code, 200)
        lead_id = lead.json()["leadId"]
        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_verified_123",
                        "status": "captured",
                        "amount": 9900,
                        "currency": "INR",
                        "email": "buyer@example.com",
                        "contact": "+91 98765 43210",
                        "notes": {
                            "plotdna_lead_id": lead_id,
                            "package_interest": "instant_pdf_99",
                        },
                    }
                }
            },
        }
        body = json.dumps(payload, separators=(",", ":")).encode()
        signature = hmac.new(b"test-webhook-secret", body, hashlib.sha256).hexdigest()
        response = self.client.post(
            "/api/leads/razorpay/webhook",
            content=body,
            headers={"Content-Type": "application/json", "X-Razorpay-Signature": signature},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "recorded")
        return lead_id, {"body": body, "signature": signature}

    def verify_email(self, user_id: str, email: str) -> dict:
        headers = self.headers(user_id)
        request = self.client.post(
            "/api/v1/auth/email-otp/request",
            headers=headers,
            json={"name": "Returning Buyer", "email": email},
        )
        self.assertEqual(request.status_code, 200)
        otp = request.json()["debugOtp"]
        self.assertIsNotNone(otp)
        verify = self.client.post(
            "/api/v1/auth/email-otp/verify",
            headers=headers,
            json={"email": email, "otp": otp},
        )
        self.assertEqual(verify.status_code, 200)
        return verify.json()["entitlements"]

    def test_verified_email_restores_payment_on_new_anonymous_session(self):
        self.create_paid_purchase()

        before_verification = self.client.get(
            "/api/v1/entitlements",
            headers=self.headers("new-browser"),
        ).json()
        self.assertFalse(before_verification["subscription_active"])

        restored = self.verify_email("new-browser", "BUYER@example.com")

        self.assertTrue(restored["subscription_active"])
        self.assertEqual(restored["email"], "buyer@example.com")

    def test_different_verified_email_does_not_restore_payment(self):
        self.create_paid_purchase()

        entitlements = self.verify_email("different-buyer", "different@example.com")

        self.assertFalse(entitlements["subscription_active"])

    def test_duplicate_webhook_is_idempotent(self):
        _, webhook = self.create_paid_purchase()

        duplicate = self.client.post(
            "/api/leads/razorpay/webhook",
            content=webhook["body"],
            headers={"Content-Type": "application/json", "X-Razorpay-Signature": webhook["signature"]},
        )
        self.assertEqual(duplicate.status_code, 200)

        connection = sqlite3.connect(settings.ENTITLEMENTS_DB_PATH)
        try:
            payment_count = connection.execute("SELECT COUNT(*) FROM payments").fetchone()[0]
            identity_count = connection.execute("SELECT COUNT(*) FROM identity_entitlements").fetchone()[0]
        finally:
            connection.close()
        self.assertEqual(payment_count, 1)
        self.assertEqual(identity_count, 1)

    def test_signed_webhook_with_wrong_amount_does_not_grant_access(self):
        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_wrong_amount",
                        "status": "captured",
                        "amount": 100,
                        "currency": "INR",
                        "email": "buyer@example.com",
                        "contact": "9876543210",
                        "notes": {"package_interest": "instant_pdf_99"},
                    }
                }
            },
        }
        body = json.dumps(payload, separators=(",", ":")).encode()
        signature = hmac.new(b"test-webhook-secret", body, hashlib.sha256).hexdigest()

        response = self.client.post(
            "/api/leads/razorpay/webhook",
            content=body,
            headers={"Content-Type": "application/json", "X-Razorpay-Signature": signature},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ignored")
        self.assertFalse(self.verify_email("wrong-amount-browser", "buyer@example.com")["subscription_active"])


if __name__ == "__main__":
    unittest.main()
