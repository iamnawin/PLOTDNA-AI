import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
UP_PATH = REPO_ROOT / "backend" / "migrations" / "0002_flatdna_catalog.up.sql"
DOWN_PATH = REPO_ROOT / "backend" / "migrations" / "0002_flatdna_catalog.down.sql"
EXPECTED_TABLES = {
    "flat_ingestion_runs",
    "flat_source_records",
    "flat_catalog_snapshots",
    "flat_catalog_publications",
    "flat_project_registrations",
    "flat_project_reviews",
    "flat_review_claim_evidence",
    "flat_regulatory_warnings",
    "flat_match_assessments",
    "flat_catalog_project_versions",
}


class FlatDnaCatalogMigrationContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.up_sql = UP_PATH.read_text(encoding="utf-8")
        cls.down_sql = DOWN_PATH.read_text(encoding="utf-8")

    def test_migration_creates_and_drops_exact_phase_two_tables(self):
        created = set(re.findall(r"CREATE TABLE(?: IF NOT EXISTS)?\s+(flat_[a-z_]+)", self.up_sql, re.I))
        dropped = set(re.findall(r"DROP TABLE IF EXISTS\s+(flat_[a-z_]+)", self.down_sql, re.I))
        self.assertEqual(created, EXPECTED_TABLES)
        self.assertEqual(dropped, EXPECTED_TABLES)

    def test_migrations_are_transaction_wrapped(self):
        self.assertTrue(self.up_sql.strip().startswith("BEGIN;"))
        self.assertTrue(self.up_sql.strip().endswith("COMMIT;"))
        self.assertTrue(self.down_sql.strip().startswith("BEGIN;"))
        self.assertTrue(self.down_sql.strip().endswith("COMMIT;"))

    def test_schema_has_atomic_publication_and_snapshot_membership(self):
        required = (
            "flat_catalog_publications_current_channel_idx",
            "WHERE superseded_at IS NULL",
            "PRIMARY KEY (snapshot_id, registration_id)",
            "UNIQUE (authority_code, normalized_rera_number)",
            "REFERENCES flat_catalog_snapshots(snapshot_id)",
            "validation_receipt_sha256",
            "validation_receipt_sha256 IS NOT NULL",
        )
        for fragment in required:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.up_sql)

    def test_existing_registration_ids_are_preserved_by_backfill(self):
        compact = " ".join(self.up_sql.split())
        self.assertIn("INSERT INTO flat_project_registrations", compact)
        self.assertIn("SELECT rera.id, rera.project_id", compact)
        self.assertIn("FROM flat_rera_references rera", compact)

    def test_independent_statuses_reviews_and_warnings_are_constrained(self):
        required = (
            "REVIEW_REQUIRED', 'SUPPORTED', 'UNSUPPORTED",
            "RESOLVED', 'PARTIALLY_RESOLVED', 'UNRESOLVED",
            "ACTIVE', 'COMPLETED', 'WITHDRAWN', 'LAPSED', 'UNKNOWN",
            "SEARCHABLE', 'QUARANTINED', 'HIDDEN",
            "REVOKED', 'DEFAULTER', 'LITIGATION_REPORTED', 'OTHER_WARNING",
            "flat_assert_current_project_review",
            "flat_assert_catalog_project_review",
            "flat_assert_validated_catalog_publication",
            "flat_guard_review_evidence_link",
            "flat_revalidate_linked_review_claim",
            "flat_prevent_historical_review_mutation",
            "resolution evidence",
            "exclusion_reason",
            "exclusion_reason IS NOT NULL",
            "partially_resolved_searchable_check",
            "unique_registration boolean",
            "supported review expired before publication",
        )
        for fragment in required:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.up_sql)

    def test_existing_evidence_and_claim_rows_are_not_mutated(self):
        self.assertNotRegex(
            self.up_sql,
            r"(?is)\b(?:DELETE|TRUNCATE|UPDATE)\s+(?:FROM\s+)?flat_(?:evidence_sources|claim_evidence)\b",
        )
        altered = set(re.findall(r"ALTER TABLE\s+(flat_[a-z_]+)", self.up_sql, re.I))
        self.assertEqual(altered, {"flat_projects"})

    def test_down_removes_only_phase_two_extensions_from_flat_projects(self):
        for column in (
            "review_status",
            "identity_status",
            "project_status",
            "catalog_status",
            "current_review_id",
            "exclusion_reason",
        ):
            self.assertIn(f"DROP COLUMN IF EXISTS {column}", self.down_sql)
        self.assertNotIn("DROP TABLE IF EXISTS flat_projects", self.down_sql)
        self.assertNotIn("DROP TABLE IF EXISTS flat_evidence_sources", self.down_sql)

    def test_review_freshness_is_derived_from_pointer_and_validity(self):
        self.assertNotIn("refresh_status", self.up_sql)
        self.assertIn("current_review_id", self.up_sql)
        self.assertIn("valid_until <= now()", self.up_sql)


if __name__ == "__main__":
    unittest.main()
