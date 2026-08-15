import unittest
from unittest.mock import patch

from app.services.flatdna.database import (
    FlatDnaDatabaseConfigurationError,
    create_flatdna_engine,
)
from app.services.flatdna.models import DataOrigin
from app.services.flatdna.repository import (
    FlatDnaRegistryValidationError,
    PostgresFlatProjectRepository,
)
from tests.flatdna_test_data import make_supported_bundle


class _FakeResult:
    def __init__(self, row=None):
        self._row = row

    def mappings(self):
        return self

    def first(self):
        return self._row

    def all(self):
        return [] if self._row is None else [self._row]


class _FakeConnection:
    def __init__(self):
        self.executions = []
        self.existing_row = None

    def execute(self, statement, parameters=None):
        self.executions.append((str(statement), parameters))
        if str(statement).lstrip().startswith("SELECT"):
            return _FakeResult(self.existing_row)
        return _FakeResult()


class _Context:
    def __init__(self, value):
        self.value = value

    def __enter__(self):
        return self.value

    def __exit__(self, exc_type, exc, traceback):
        return False


class _FakeEngine:
    def __init__(self):
        self.connection = _FakeConnection()
        self.begin_calls = 0
        self.connect_calls = 0

    def begin(self):
        self.begin_calls += 1
        return _Context(self.connection)

    def connect(self):
        self.connect_calls += 1
        return _Context(self.connection)


class FlatDnaRepositoryTests(unittest.TestCase):
    def test_engine_creation_is_lazy_and_missing_url_fails_only_when_requested(self):
        with patch("app.services.flatdna.database.settings.DATABASE_URL", ""):
            with self.assertRaises(FlatDnaDatabaseConfigurationError):
                create_flatdna_engine()
        with patch("app.services.flatdna.database.create_engine") as create_engine:
            create_flatdna_engine("postgresql+psycopg2://example/test")
        create_engine.assert_called_once()

    def test_repository_rejects_unsafe_origin_before_opening_transaction(self):
        engine = _FakeEngine()
        repository = PostgresFlatProjectRepository(engine)
        with self.assertRaises(FlatDnaRegistryValidationError):
            repository.upsert_registry(make_supported_bundle(data_origin=DataOrigin.SYNTHETIC))
        self.assertEqual(engine.begin_calls, 0)

    def test_valid_bundle_is_written_in_one_transaction_without_deletes(self):
        engine = _FakeEngine()
        repository = PostgresFlatProjectRepository(engine)
        repository.upsert_registry(make_supported_bundle())
        self.assertEqual(engine.begin_calls, 1)
        statements = "\n".join(statement for statement, _ in engine.connection.executions)
        self.assertIn("INSERT INTO flat_developers", statements)
        self.assertIn("INSERT INTO flat_projects", statements)
        self.assertIn("INSERT INTO flat_evidence_sources", statements)
        self.assertIn("INSERT INTO flat_claim_evidence", statements)
        self.assertNotIn("DELETE FROM", statements.upper())

    def test_evidence_source_uuid_cannot_be_reassigned_to_another_snapshot(self):
        engine = _FakeEngine()
        engine.connection.existing_row = {
            "id": make_supported_bundle().evidence_sources[0].id,
            "source_class": "CURATED_REFERENCE",
            "source_ref": "different-source",
            "retrieved_at": make_supported_bundle().evidence_sources[0].retrieved_at,
        }
        repository = PostgresFlatProjectRepository(engine)
        with self.assertRaisesRegex(ValueError, "cannot be reassigned"):
            repository.upsert_registry(make_supported_bundle())

    def test_reads_are_supported_only(self):
        engine = _FakeEngine()
        repository = PostgresFlatProjectRepository(engine)
        self.assertIsNone(repository.get_supported_project(make_supported_bundle().projects[0].id))
        statement = engine.connection.executions[0][0]
        self.assertIn("project.registry_status = 'SUPPORTED'", statement)

    def test_identity_rows_are_supported_only_with_active_aliases_and_stable_order(self):
        engine = _FakeEngine()
        repository = PostgresFlatProjectRepository(engine)
        self.assertEqual(repository.list_supported_project_identity_rows(" Hyderabad "), [])
        statement, parameters = engine.connection.executions[0]
        self.assertIn("LEFT JOIN flat_project_aliases alias", statement)
        self.assertIn("alias.active = true", statement)
        self.assertIn("project.registry_status = 'SUPPORTED'", statement)
        self.assertIn("developer.registry_status <> 'INACTIVE'", statement)
        self.assertIn(
            "ORDER BY project.normalized_name, project.id, alias.normalized_alias, alias.id",
            " ".join(statement.split()),
        )
        self.assertEqual(parameters, {"city_slug": "hyderabad"})

    def test_rera_references_are_supported_only_and_exclude_superseded_rows(self):
        engine = _FakeEngine()
        repository = PostgresFlatProjectRepository(engine)
        self.assertEqual(
            repository.list_supported_project_rera_references(
                make_supported_bundle().projects[0].id
            ),
            [],
        )
        statement = engine.connection.executions[0][0]
        self.assertIn("project.registry_status = 'SUPPORTED'", statement)
        self.assertIn("rera.reference_status <> 'SUPERSEDED'", statement)
        self.assertIn("developer.registry_status <> 'INACTIVE'", statement)


if __name__ == "__main__":
    unittest.main()
