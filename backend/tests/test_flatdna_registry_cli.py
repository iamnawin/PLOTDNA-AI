import importlib.util
import io
import os
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import MagicMock, patch


ROOT = Path(__file__).resolve().parents[2]


def load_script(name):
    path = ROOT / "scripts" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


validator = load_script("validate_flatdna_registry")
importer = load_script("import_flatdna_registry")


class FlatDnaRegistryCliTests(unittest.TestCase):
    def test_validator_reports_exact_counts(self):
        output = io.StringIO()
        with redirect_stdout(output):
            result = validator.main([])
        self.assertEqual(result, 0)
        self.assertIn("- projects: 14", output.getvalue())
        self.assertIn("VALID", output.getvalue())

    def test_importer_dry_run_never_constructs_engine(self):
        output = io.StringIO()
        with patch.object(importer, "create_flatdna_engine") as create_engine, redirect_stdout(output):
            result = importer.main([])
        self.assertEqual(result, 0)
        create_engine.assert_not_called()
        self.assertIn("DRY RUN: no database connection or write performed", output.getvalue())

    def test_apply_requires_exact_sanitized_confirmation_without_logging_secret(self):
        secret_url = "postgresql://user:do-not-log@db.example.test/flatdna"
        output = io.StringIO()
        with patch.dict(os.environ, {"BATCH_0C_TEST_URL": secret_url}), patch.object(importer, "create_flatdna_engine") as create_engine, redirect_stdout(output):
            result = importer.main(["--apply", "--database-url-env", "BATCH_0C_TEST_URL"])
        self.assertEqual(result, 2)
        create_engine.assert_not_called()
        self.assertNotIn("do-not-log", output.getvalue())
        self.assertIn("db.example.test/flatdna", output.getvalue())

    def test_apply_uses_existing_repository_once(self):
        url = "postgresql://user:secret@db.example.test/flatdna"
        engine = MagicMock()
        repository = MagicMock()
        with patch.dict(os.environ, {"BATCH_0C_TEST_URL": url}), patch.object(importer, "create_flatdna_engine", return_value=engine), patch.object(importer, "PostgresFlatProjectRepository", return_value=repository), patch.object(importer, "verify_import"):
            result = importer.main(["--apply", "--database-url-env", "BATCH_0C_TEST_URL", "--confirm-target", "db.example.test/flatdna"])
        self.assertEqual(result, 0)
        repository.upsert_registry.assert_called_once()
        engine.dispose.assert_called_once()


if __name__ == "__main__":
    unittest.main()
