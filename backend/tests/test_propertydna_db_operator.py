from __future__ import annotations

import importlib.util
import io
import socket
import ssl
import subprocess
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "backend" / "scripts" / "propertydna_db.py"


def load_operator():
    spec = importlib.util.spec_from_file_location("propertydna_db", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    sys_modules = __import__("sys").modules
    sys_modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


operator = load_operator()
FAKE_URL = (
    "postgresql://postgres.abcdefghijklmnopqrst:do-not-print@"
    "aws-0-test.pooler.supabase.com:5432/postgres"
)


class PropertyDnaDatabaseOperatorTests(unittest.TestCase):
    def make_secret(self, directory: str, value: str = FAKE_URL) -> Path:
        path = Path(directory) / "production.env"
        path.write_text(f"DATABASE_URL={value}\n", encoding="utf-8")
        return path

    def test_local_secret_path_is_gitignored(self):
        result = subprocess.run(
            ["git", "check-ignore", ".local-secrets/production.env"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0)

    def test_missing_secret_file_fails_safely(self):
        with tempfile.TemporaryDirectory() as directory:
            missing = Path(directory) / "missing.env"
            with patch.object(operator, "SECRET_FILE", missing):
                stdout = io.StringIO()
                stderr = io.StringIO()
                with redirect_stdout(stdout), redirect_stderr(stderr):
                    result = operator.main(["inspect"])
        self.assertEqual(result, 2)
        self.assertIn("connected: NO", stdout.getvalue())
        self.assertIn("missing .local-secrets/production.env", stderr.getvalue())

    def test_malformed_url_fails_without_printing_secret(self):
        secret = "not-a-database-url-do-not-print"
        with tempfile.TemporaryDirectory() as directory:
            path = self.make_secret(directory, secret)
            with self.assertRaises(operator.OperatorError) as raised:
                operator.load_database_config(path)
        self.assertNotIn(secret, str(raised.exception))
        self.assertEqual(raised.exception.diagnostic, "INVALID_DATABASE_URL")

    def test_missing_database_url_has_safe_diagnostic(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "production.env"
            path.write_text("# DATABASE_URL is intentionally absent\n", encoding="utf-8")
            with self.assertRaises(operator.OperatorError) as raised:
                operator.load_database_config(path)
        self.assertEqual(raised.exception.diagnostic, "DATABASE_URL_MISSING")

    def test_connection_errors_are_redacted(self):
        with tempfile.TemporaryDirectory() as directory:
            path = self.make_secret(directory)
            leaked_error = RuntimeError(FAKE_URL)
            with (
                patch.object(operator, "SECRET_FILE", path),
                patch.object(operator, "create_flatdna_engine", side_effect=leaked_error),
            ):
                stdout = io.StringIO()
                stderr = io.StringIO()
                with redirect_stdout(stdout), redirect_stderr(stderr):
                    result = operator.main(["inspect"])
        output = stdout.getvalue() + stderr.getvalue()
        self.assertEqual(result, 1)
        self.assertNotIn(FAKE_URL, output)
        self.assertNotIn("do-not-print", output)
        self.assertIn("details redacted", output)

    def test_diagnostic_classifier_covers_safe_categories(self):
        cases = (
            (socket.gaierror("fake DNS failure"), "DNS_RESOLUTION_FAILED"),
            (TimeoutError("fake timeout"), "CONNECTION_TIMEOUT"),
            (ConnectionRefusedError("fake refusal"), "CONNECTION_REFUSED"),
            (ssl.SSLError("fake certificate failure"), "SSL_ERROR"),
            (RuntimeError("password authentication failed"), "AUTHENTICATION_FAILED"),
            (RuntimeError('database "fake" does not exist'), "DATABASE_NOT_FOUND"),
            (RuntimeError('role "fake" does not exist'), "ROLE_NOT_FOUND"),
            (RuntimeError("opaque failure"), "UNKNOWN_DATABASE_ERROR"),
        )
        for error, expected in cases:
            with self.subTest(expected=expected):
                self.assertEqual(operator.diagnose_database_error(error), expected)

    def test_inspect_diagnose_redacts_raw_connection_error(self):
        with tempfile.TemporaryDirectory() as directory:
            path = self.make_secret(directory)
            leaked_error = RuntimeError(f"password authentication failed: {FAKE_URL}")
            with (
                patch.object(operator, "SECRET_FILE", path),
                patch.object(operator, "create_flatdna_engine", side_effect=leaked_error),
            ):
                stdout = io.StringIO()
                stderr = io.StringIO()
                with redirect_stdout(stdout), redirect_stderr(stderr):
                    result = operator.main(["inspect", "--diagnose"])
        output = stdout.getvalue() + stderr.getvalue()
        self.assertEqual(result, 1)
        self.assertEqual(
            stdout.getvalue().splitlines(),
            ["connected: NO", "diagnostic: AUTHENTICATION_FAILED"],
        )
        self.assertEqual(stderr.getvalue(), "")
        self.assertNotIn(FAKE_URL, output)
        self.assertNotIn("do-not-print", output)

    def test_inspect_diagnose_classifies_safe_loader_failures(self):
        with tempfile.TemporaryDirectory() as directory:
            missing = Path(directory) / "missing.env"
            with patch.object(operator, "SECRET_FILE", missing):
                stdout = io.StringIO()
                with redirect_stdout(stdout), redirect_stderr(io.StringIO()):
                    result = operator.main(["inspect", "--diagnose"])
        self.assertEqual(result, 2)
        self.assertEqual(
            stdout.getvalue().splitlines(),
            ["connected: NO", "diagnostic: SECRET_FILE_MISSING"],
        )

    def test_successful_diagnose_preserves_safe_inspection_report(self):
        inspection = operator.Inspection(
            version="PostgreSQL test",
            database="postgres",
            role="operator",
            search_path='"$user", public',
            target_schema="public",
            existing_tables=(),
            relation_conflicts=(),
            function_conflicts=(),
            trigger_conflicts=(),
            constraint_conflicts=(),
        )
        with tempfile.TemporaryDirectory() as directory:
            path = self.make_secret(directory)
            with (
                patch.object(operator, "SECRET_FILE", path),
                patch.object(operator, "create_flatdna_engine", return_value=MagicMock()),
                patch.object(operator, "collect_inspection", return_value=inspection),
            ):
                stdout = io.StringIO()
                with redirect_stdout(stdout), redirect_stderr(io.StringIO()):
                    result = operator.main(["inspect", "--diagnose"])
        self.assertEqual(result, 0)
        self.assertIn("connected: YES", stdout.getvalue())
        self.assertIn("postgresql_version: PostgreSQL test", stdout.getvalue())
        self.assertNotIn("diagnostic:", stdout.getvalue())

    def test_read_only_connection_sets_transaction_read_only(self):
        engine = MagicMock()
        connection = engine.connect.return_value.__enter__.return_value
        with operator.read_only_connection(engine) as returned:
            self.assertIs(returned, connection)
        connection.exec_driver_sql.assert_called_once_with("SET TRANSACTION READ ONLY")

    def test_inspect_uses_read_only_connection(self):
        engine = MagicMock()
        connection = MagicMock()
        identity = {
            "version": "PostgreSQL test",
            "database": "postgres",
            "role": "operator",
            "search_path": '"$user", public',
            "target_schema": "public",
        }
        catalog = {
            "existing_tables": (),
            "relation_conflicts": (),
            "function_conflicts": (),
            "trigger_conflicts": (),
            "constraint_conflicts": (),
        }
        manager = MagicMock()
        manager.__enter__.return_value = connection
        with (
            patch.object(operator, "read_only_connection", return_value=manager) as read_only,
            patch.object(operator, "_database_identity", return_value=identity),
            patch.object(operator, "_catalog_inspection", return_value=catalog),
        ):
            inspection = operator.collect_inspection(engine)
        read_only.assert_called_once_with(engine)
        self.assertEqual(inspection.target_schema, "public")

    def test_registry_dry_run_planning_is_read_only(self):
        engine = MagicMock()
        connection = MagicMock()
        connection.execute.return_value.scalar_one.return_value = 0
        manager = MagicMock()
        manager.__enter__.return_value = connection
        bundle = SimpleNamespace(projects=[])
        with (
            patch.object(operator, "TABLES_BY_BUNDLE_KEY", {"projects": "flat_projects"}),
            patch.object(operator, "read_only_connection", return_value=manager) as read_only,
        ):
            plan = operator.registry_plan(engine, bundle)
        read_only.assert_called_once_with(engine)
        self.assertEqual(
            plan,
            {"projects": {"inserts": 0, "updates": 0, "other_existing_rows": 0}},
        )
        statement = str(connection.execute.call_args.args[0]).strip().upper()
        self.assertTrue(statement.startswith("SELECT COUNT(*)"))

    def test_operator_locks_expected_migration_objects(self):
        expected = operator.migration_objects()
        self.assertEqual(len(expected.tables), 7)
        self.assertEqual(len(expected.indexes), 21)
        self.assertEqual(len(expected.functions), 2)
        self.assertEqual(len(expected.triggers), 3)

    def test_operator_locks_the_accepted_registry_counts(self):
        _, counts = operator._validated_registry()
        self.assertEqual(counts, operator.EXPECTED_REGISTRY_COUNTS)

    def test_write_commands_require_explicit_confirmation(self):
        for command in ("migrate", "registry-import"):
            with self.subTest(command=command):
                stderr = io.StringIO()
                with (
                    patch.object(operator, "load_database_config") as load_config,
                    redirect_stderr(stderr),
                ):
                    result = operator.main([command])
                self.assertEqual(result, 2)
                load_config.assert_not_called()
                self.assertIn("--confirm-production", stderr.getvalue())

    def test_diagnose_is_restricted_to_inspect(self):
        with patch.object(operator, "load_database_config") as load_config:
            stderr = io.StringIO()
            with redirect_stderr(stderr):
                result = operator.main(["migrate", "--confirm-production", "--diagnose"])
        self.assertEqual(result, 2)
        load_config.assert_not_called()
        self.assertIn("only valid with inspect", stderr.getvalue())

    def test_down_migration_is_not_an_operator_command(self):
        parser = operator.build_parser()
        command_action = next(action for action in parser._actions if action.dest == "command")
        self.assertNotIn("down", command_action.choices)
        self.assertNotIn("rollback", command_action.choices)
        self.assertNotIn("0001_flatdna_registry.down.sql", SCRIPT.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
