import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
UP_PATH = REPO_ROOT / "backend" / "migrations" / "0001_flatdna_registry.up.sql"
DOWN_PATH = REPO_ROOT / "backend" / "migrations" / "0001_flatdna_registry.down.sql"
EXPECTED_TABLES = {
    "flat_developers",
    "flat_developer_aliases",
    "flat_projects",
    "flat_project_aliases",
    "flat_rera_references",
    "flat_evidence_sources",
    "flat_claim_evidence",
}


class FlatDnaMigrationContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.up_sql = UP_PATH.read_text(encoding="utf-8")
        cls.down_sql = DOWN_PATH.read_text(encoding="utf-8")

    def test_up_creates_exactly_seven_tables_without_seed_rows(self):
        created = set(re.findall(r"CREATE TABLE\s+(flat_[a-z_]+)", self.up_sql, re.IGNORECASE))
        self.assertEqual(created, EXPECTED_TABLES)
        self.assertNotRegex(self.up_sql, r"\bINSERT\s+INTO\b")
        self.assertNotIn("flat_towers", self.up_sql)
        self.assertNotIn("flat_unit_configurations", self.up_sql)

    def test_migrations_are_transaction_wrapped(self):
        self.assertTrue(self.up_sql.strip().startswith("BEGIN;"))
        self.assertTrue(self.up_sql.strip().endswith("COMMIT;"))
        self.assertTrue(self.down_sql.strip().startswith("BEGIN;"))
        self.assertTrue(self.down_sql.strip().endswith("COMMIT;"))

    def test_down_drops_exactly_the_created_tables(self):
        dropped = set(re.findall(r"DROP TABLE\s+(flat_[a-z_]+)", self.down_sql, re.IGNORECASE))
        self.assertEqual(dropped, EXPECTED_TABLES)

    def test_schema_contains_approved_integrity_rules(self):
        required_fragments = (
            "num_nonnulls",
            "observed_value text NOT NULL",
            "source_status text NOT NULL",
            "data_origin IN ('REAL', 'CURATED')",
            "flat_projects_supported_identity_key",
            "flat_supported_project_claim_guard",
            "flat_supported_project_source_guard",
            "DEFERRABLE INITIALLY DEFERRED",
        )
        for fragment in required_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.up_sql)

    def test_migration_does_not_alter_existing_plotdna_tables(self):
        self.assertNotRegex(self.up_sql, r"(?i)\bALTER\s+TABLE\b")
        self.assertNotRegex(self.up_sql, r"(?i)\bDROP\s+TABLE\b")
        self.assertNotIn("entitlements", self.up_sql.lower())


if __name__ == "__main__":
    unittest.main()
