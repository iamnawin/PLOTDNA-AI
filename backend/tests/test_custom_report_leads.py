import json
import os
import hmac
import hashlib
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.auth import create_access_token
from app.core.config import settings
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

    def test_client_self_confirmation_is_disabled(self):
        with tempfile.TemporaryDirectory() as tmp:
            leads_path = os.path.join(tmp, "custom-report-leads.jsonl")
            previous_path = os.environ.get("CUSTOM_REPORT_LEADS_PATH")
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            os.environ["CUSTOM_REPORT_LEADS_PATH"] = leads_path
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            try:
                client = TestClient(app)
                headers = {"Authorization": f"Bearer {create_access_token('paid-lead-user')}"}
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

                response = client.post(
                    f"/api/leads/custom-report/{lead_response.json()['leadId']}/self-confirm-payment",
                    json={"paymentReference": "pay_test_123"},
                    headers=headers,
                )

                self.assertEqual(response.status_code, 410)

                with open(leads_path, encoding="utf-8") as f:
                    record = json.loads(f.readline())
                self.assertEqual(record["paymentStatus"], "pending")
                self.assertNotIn("paymentReference", record)
                self.assertNotIn("paidAt", record)
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                if previous_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_path

    def test_user_cannot_self_confirm_another_users_lead(self):
        with tempfile.TemporaryDirectory() as tmp:
            leads_path = os.path.join(tmp, "custom-report-leads.jsonl")
            previous_path = os.environ.get("CUSTOM_REPORT_LEADS_PATH")
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            os.environ["CUSTOM_REPORT_LEADS_PATH"] = leads_path
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            try:
                client = TestClient(app)
                owner_headers = {"Authorization": f"Bearer {create_access_token('owner-user')}"}
                other_headers = {"Authorization": f"Bearer {create_access_token('other-user')}"}
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
                    headers=owner_headers,
                )

                response = client.post(
                    f"/api/leads/custom-report/{lead_response.json()['leadId']}/self-confirm-payment",
                    json={"paymentReference": "pay_test_123"},
                    headers=other_headers,
                )

                self.assertEqual(response.status_code, 410)
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                if previous_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_path

    def test_authenticated_user_can_recover_existing_payment_by_email_phone_and_payment_id(self):
        with tempfile.TemporaryDirectory() as tmp:
            leads_path = os.path.join(tmp, "custom-report-leads.jsonl")
            previous_path = os.environ.get("CUSTOM_REPORT_LEADS_PATH")
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            os.environ["CUSTOM_REPORT_LEADS_PATH"] = leads_path
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            try:
                client = TestClient(app)
                original_headers = {"Authorization": f"Bearer {create_access_token('old-browser-user')}"}
                lead_response = client.post(
                    "/api/leads/custom-report",
                    json={
                        "name": "Naveen",
                        "email": "naveen.naidu21@gmail.com",
                        "phone": "9701797999",
                        "citySlug": "hyderabad",
                        "cityName": "Hyderabad",
                        "areaSlug": "adibatla",
                        "areaName": "Adibatla",
                        "packageInterest": "instant_pdf_99",
                        "source": "area_report_summary",
                    },
                    headers=original_headers,
                )
                self.assertEqual(lead_response.status_code, 200)

                recovery_headers = {"Authorization": f"Bearer {create_access_token('new-browser-user')}"}
                with patch(
                    "app.services.custom_report_leads.verify_razorpay_payment",
                    return_value={
                        "id": "pay_SyMkoiN7OOLawT",
                        "status": "captured",
                        "amount": 9900,
                        "currency": "INR",
                        "email": "naveen.naidu21@gmail.com",
                        "contact": "+91 97017 97999",
                        "notes": {"package_interest": "instant_pdf_99"},
                    },
                ):
                    response = client.post(
                        "/api/leads/custom-report/recover-payment",
                        json={
                            "name": "naveen",
                            "email": "NAVEEN.NAIDU21@gmail.com",
                            "phone": "+91 97017 97999",
                            "packageInterest": "instant_pdf_99",
                            "paymentReference": "pay_SyMkoiN7OOLawT",
                        },
                        headers=recovery_headers,
                    )

                self.assertEqual(response.status_code, 200)
                body = response.json()
                self.assertEqual(body["leadId"], lead_response.json()["leadId"])
                self.assertEqual(body["paymentStatus"], "paid")
                self.assertTrue(body["entitlements"]["subscription_active"])
                self.assertEqual(body["entitlements"]["email"], "naveen.naidu21@gmail.com")

                with open(leads_path, encoding="utf-8") as f:
                    record = json.loads(f.readline())
                self.assertEqual(record["paymentStatus"], "paid")
                self.assertEqual(record["paymentReference"], "pay_SyMkoiN7OOLawT")
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                if previous_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_path

    def test_authenticated_user_can_recover_direct_razorpay_payment_without_existing_lead(self):
        with tempfile.TemporaryDirectory() as tmp:
            leads_path = os.path.join(tmp, "custom-report-leads.jsonl")
            previous_path = os.environ.get("CUSTOM_REPORT_LEADS_PATH")
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            os.environ["CUSTOM_REPORT_LEADS_PATH"] = leads_path
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            try:
                client = TestClient(app)
                headers = {"Authorization": f"Bearer {create_access_token('direct-razorpay-user')}"}

                with patch(
                    "app.services.custom_report_leads.verify_razorpay_payment",
                    return_value={
                        "id": "pay_SyMkoiN7OOLawT",
                        "status": "captured",
                        "amount": 9900,
                        "currency": "INR",
                        "email": "naveen.naidu21@gmail.com",
                        "contact": "9701797999",
                        "notes": {"package_interest": "instant_pdf_99"},
                    },
                ):
                    response = client.post(
                        "/api/leads/custom-report/recover-payment",
                        json={
                            "name": "Naveen",
                            "email": "naveen.naidu21@gmail.com",
                            "phone": "9701797999",
                            "packageInterest": "instant_pdf_99",
                            "paymentReference": "pay_SyMkoiN7OOLawT",
                        },
                        headers=headers,
                    )

                self.assertEqual(response.status_code, 200)
                body = response.json()
                self.assertTrue(body["leadId"].startswith("cr_recovered_"))
                self.assertEqual(body["paymentStatus"], "paid")
                self.assertTrue(body["entitlements"]["subscription_active"])
                self.assertEqual(body["entitlements"]["email"], "naveen.naidu21@gmail.com")

                with open(leads_path, encoding="utf-8") as f:
                    records = [json.loads(line) for line in f if line.strip()]
                self.assertEqual(len(records), 1)
                self.assertEqual(records[0]["leadId"], body["leadId"])
                self.assertEqual(records[0]["paymentStatus"], "paid")
                self.assertEqual(records[0]["paymentReference"], "pay_SyMkoiN7OOLawT")
                self.assertEqual(records[0]["source"], "razorpay_payment_id_recovery")
                self.assertEqual(records[0]["recoveredByUserId"], "direct-razorpay-user")
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                if previous_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_path

    def test_fabricated_payment_id_cannot_activate_access(self):
        with tempfile.TemporaryDirectory() as tmp:
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            try:
                client = TestClient(app)
                headers = {"Authorization": f"Bearer {create_access_token('fabricated-payment-user')}"}

                with patch(
                    "app.services.custom_report_leads.verify_razorpay_payment",
                    side_effect=ValueError("Razorpay payment was not captured."),
                ):
                    response = client.post(
                        "/api/leads/custom-report/recover-payment",
                        json={
                            "name": "Attacker",
                            "email": "attacker@example.com",
                            "phone": "9876543210",
                            "packageInterest": "instant_pdf_99",
                            "paymentReference": "pay_fake123",
                        },
                        headers=headers,
                    )

                self.assertEqual(response.status_code, 400)
                entitlements = client.get("/api/v1/entitlements", headers=headers).json()
                self.assertFalse(entitlements["subscription_active"])
                self.assertIsNone(entitlements["email"])
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path

    def test_razorpay_webhook_marks_existing_lead_paid_for_auto_access(self):
        with tempfile.TemporaryDirectory() as tmp:
            leads_path = os.path.join(tmp, "custom-report-leads.jsonl")
            previous_path = os.environ.get("CUSTOM_REPORT_LEADS_PATH")
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            previous_secret = settings.RAZORPAY_WEBHOOK_SECRET
            os.environ["CUSTOM_REPORT_LEADS_PATH"] = leads_path
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            settings.RAZORPAY_WEBHOOK_SECRET = "test-webhook-secret"
            try:
                client = TestClient(app)
                user_id = "paid-webhook-user"
                headers = {"Authorization": f"Bearer {create_access_token(user_id)}"}
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
                lead_id = lead_response.json()["leadId"]
                payload = {
                    "event": "payment_link.paid",
                    "payload": {
                        "payment_link": {
                            "entity": {
                                "id": "plink_test_123",
                                "reference_id": lead_id,
                                "notes": {
                                    "plotdna_lead_id": lead_id,
                                    "package_interest": "instant_pdf_99",
                                },
                                "customer": {
                                    "email": "buyer@example.com",
                                    "contact": "9876543210",
                                },
                            }
                        },
                        "payment": {
                            "entity": {
                                "id": "pay_webhook_123",
                                "email": "buyer@example.com",
                                "contact": "9876543210",
                                "amount": 9900,
                                "currency": "INR",
                            }
                        },
                    },
                }
                body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
                signature = hmac.new(
                    b"test-webhook-secret",
                    body,
                    hashlib.sha256,
                ).hexdigest()

                webhook_response = client.post(
                    "/api/leads/razorpay/webhook",
                    content=body,
                    headers={
                        "Content-Type": "application/json",
                        "X-Razorpay-Signature": signature,
                    },
                )

                self.assertEqual(webhook_response.status_code, 200)
                self.assertEqual(webhook_response.json()["status"], "recorded")

                access_response = client.get(
                    "/api/v1/entitlements/report-access?packageInterest=instant_pdf_99",
                    headers=headers,
                )
                self.assertEqual(access_response.status_code, 200)
                self.assertTrue(access_response.json()["canAccess"])
                self.assertFalse(access_response.json()["requiresPayment"])

                with open(leads_path, encoding="utf-8") as f:
                    record = json.loads(f.readline())
                self.assertEqual(record["paymentStatus"], "paid")
                self.assertEqual(record["paymentReference"], "pay_webhook_123")
                self.assertEqual(record["razorpayPaymentLinkId"], "plink_test_123")
            finally:
                settings.RAZORPAY_WEBHOOK_SECRET = previous_secret
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                if previous_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_path

    def test_razorpay_webhook_requires_valid_signature(self):
        previous_secret = settings.RAZORPAY_WEBHOOK_SECRET
        settings.RAZORPAY_WEBHOOK_SECRET = "test-webhook-secret"
        try:
            client = TestClient(app)
            response = client.post(
                "/api/leads/razorpay/webhook",
                json={"event": "payment_link.paid", "payload": {}},
                headers={"X-Razorpay-Signature": "bad-signature"},
            )
            self.assertEqual(response.status_code, 400)
        finally:
            settings.RAZORPAY_WEBHOOK_SECRET = previous_secret

    def test_recover_payment_requires_razorpay_payment_id(self):
        with tempfile.TemporaryDirectory() as tmp:
            leads_path = os.path.join(tmp, "custom-report-leads.jsonl")
            previous_path = os.environ.get("CUSTOM_REPORT_LEADS_PATH")
            previous_db_path = settings.ENTITLEMENTS_DB_PATH
            os.environ["CUSTOM_REPORT_LEADS_PATH"] = leads_path
            settings.ENTITLEMENTS_DB_PATH = os.path.join(tmp, "entitlements.sqlite3")
            try:
                client = TestClient(app)
                headers = {"Authorization": f"Bearer {create_access_token('recovery-user')}"}

                response = client.post(
                    "/api/leads/custom-report/recover-payment",
                    json={
                        "name": "naveen",
                        "email": "naveen.naidu21@gmail.com",
                        "phone": "9701797999",
                        "packageInterest": "instant_pdf_99",
                        "paymentReference": "not-a-payment-id",
                    },
                    headers=headers,
                )

                self.assertEqual(response.status_code, 400)
            finally:
                settings.ENTITLEMENTS_DB_PATH = previous_db_path
                if previous_path is None:
                    os.environ.pop("CUSTOM_REPORT_LEADS_PATH", None)
                else:
                    os.environ["CUSTOM_REPORT_LEADS_PATH"] = previous_path


if __name__ == "__main__":
    unittest.main()
