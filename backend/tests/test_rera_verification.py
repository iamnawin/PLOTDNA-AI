import unittest

from fastapi.testclient import TestClient

from app.main import app
from app.api.routes.brochure import _build_rera_verification
from app.services.rera_verification import ReraVerificationRequest, verify_rera_registration


class ReraVerificationServiceTests(unittest.TestCase):
    def test_telangana_returns_manual_verification_for_captcha_protected_search(self):
        result = verify_rera_registration(
            ReraVerificationRequest(
                state="Telangana",
                registration_number="P02400001234",
                project_name="Example Heights",
            )
        )

        self.assertEqual(result.state, "telangana")
        self.assertEqual(result.registration_number, "P02400001234")
        self.assertEqual(result.status, "manual_verification_required")
        self.assertIn("rerait.telangana.gov.in/SearchList/Search", result.official_source_url)
        self.assertEqual(result.confidence, 0.25)
        self.assertTrue(any("captcha" in warning.lower() for warning in result.warnings))
        self.assertIn("does not by itself verify land title", result.disclaimer)

    def test_unknown_state_is_source_unavailable_with_warning(self):
        result = verify_rera_registration(
            ReraVerificationRequest(state="Atlantis", registration_number="ABC123")
        )

        self.assertEqual(result.state, "atlantis")
        self.assertEqual(result.status, "source_unavailable")
        self.assertEqual(result.confidence, 0.0)
        self.assertTrue(any("unsupported state" in warning.lower() for warning in result.warnings))


class ReraVerificationRouteTests(unittest.TestCase):
    def test_rera_verify_route_returns_manual_status_for_telangana(self):
        client = TestClient(app)

        response = client.post(
            "/api/v1/rera/verify",
            json={"state": "Telangana", "registration_number": "P02400001234"},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["state"], "telangana")
        self.assertEqual(body["status"], "manual_verification_required")
        self.assertEqual(body["registration_number"], "P02400001234")


class BrochureReraVerificationTests(unittest.TestCase):
    def test_brochure_rera_verification_is_nullable_when_no_rera_number(self):
        self.assertIsNone(_build_rera_verification({"rera_number": None, "rera_state": "Telangana"}))

    def test_brochure_rera_verification_uses_extracted_state_and_number(self):
        result = _build_rera_verification(
            {
                "rera_number": "P02400001234",
                "rera_state": "Telangana",
                "project_name": "Example Heights",
            }
        )

        self.assertIsNotNone(result)
        self.assertEqual(result["state"], "telangana")
        self.assertEqual(result["status"], "manual_verification_required")


if __name__ == "__main__":
    unittest.main()
