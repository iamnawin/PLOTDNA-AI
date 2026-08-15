import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SAMPLE = ROOT / "data" / "staging" / "aprera" / "quarterly-status-residential-sample.json"


class ApreraStagingDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.payload = json.loads(SAMPLE.read_text(encoding="utf-8"))

    def test_sample_is_source_bound_and_deterministic(self):
        self.assertEqual(self.payload["schema_version"], 1)
        self.assertEqual(self.payload["parser_version"], "aprera-quarterly-v1")
        self.assertEqual(self.payload["record_count"], 10)
        self.assertEqual(
            self.payload["source"]["url"],
            "https://rera.ap.gov.in/RERA/DOCUMENTS/Notice/QU%20Status%20Report.pdf",
        )
        self.assertRegex(self.payload["source"]["content_sha256"], r"^[0-9a-f]{64}$")

    def test_sample_does_not_invent_live_inventory(self):
        records = self.payload["records"]
        self.assertEqual(len({record["project_id"] for record in records}), 10)
        self.assertTrue(all(record["project_type"] == "Residential" for record in records))
        self.assertTrue(all("available_units" not in record for record in records))
        self.assertTrue(all("sold_units" not in record for record in records))


if __name__ == "__main__":
    unittest.main()
