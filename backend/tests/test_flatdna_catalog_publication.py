import unittest
from uuid import UUID

from app.services.flatdna.catalog_publication import (
    CatalogPublicationError,
    PostgresCatalogPublisher,
)


CURRENT_ID = UUID("10000000-0000-4000-8000-000000000001")
TARGET_ID = UUID("10000000-0000-4000-8000-000000000002")


class FakeResult:
    def __init__(self, row=None):
        self.row = row

    def mappings(self):
        return self

    def first(self):
        return self.row


class FakeConnection:
    def __init__(
        self,
        *,
        validation_status="VALIDATED",
        validation_receipt="a" * 64,
        fail_insert=False,
        target_channel="production",
    ):
        self.validation_status = validation_status
        self.validation_receipt = validation_receipt
        self.fail_insert = fail_insert
        self.target_channel = target_channel
        self.calls = []

    def execute(self, statement, parameters=None):
        sql = " ".join(str(statement).split())
        parameters = parameters or {}
        self.calls.append((sql, parameters))
        if "FROM flat_catalog_snapshots" in sql:
            return FakeResult(
                {
                    "validation_status": self.validation_status,
                    "validation_receipt_sha256": self.validation_receipt,
                }
            )
        if "WHERE id = :publication_id" in sql:
            if parameters.get("channel") != self.target_channel:
                return FakeResult()
            return FakeResult({"id": TARGET_ID, "snapshot_id": "snapshot-old"})
        if "FROM flat_catalog_publications" in sql and "superseded_at IS NULL" in sql:
            return FakeResult({"id": CURRENT_ID, "snapshot_id": "snapshot-current"})
        if sql.startswith("INSERT INTO flat_catalog_publications") and self.fail_insert:
            raise RuntimeError("injected insert failure")
        return FakeResult()


class FakeBegin:
    def __init__(self, connection):
        self.connection = connection
        self.committed = False
        self.rolled_back = False

    def __enter__(self):
        return self.connection

    def __exit__(self, exc_type, exc, traceback):
        self.rolled_back = exc_type is not None
        self.committed = exc_type is None
        return False


class FakeEngine:
    def __init__(self, connection):
        self.manager = FakeBegin(connection)

    def begin(self):
        return self.manager


class FlatDnaCatalogPublicationTests(unittest.TestCase):
    def test_publish_locks_validated_snapshot_and_switches_pointer_atomically(self):
        connection = FakeConnection()
        engine = FakeEngine(connection)
        publisher = PostgresCatalogPublisher(engine)

        publication_id = publisher.publish(
            "snapshot-next",
            published_by="release-operator",
            validation_receipt="a" * 64,
        )

        sql = [call[0] for call in connection.calls]
        self.assertIsInstance(publication_id, UUID)
        self.assertIn("FOR UPDATE", sql[0])
        self.assertIn("superseded_at IS NULL", sql[1])
        self.assertTrue(sql[2].startswith("UPDATE flat_catalog_publications"))
        self.assertTrue(sql[3].startswith("INSERT INTO flat_catalog_publications"))
        self.assertTrue(engine.manager.committed)

    def test_unvalidated_snapshot_is_rejected_before_pointer_change(self):
        connection = FakeConnection(validation_status="CANDIDATE", validation_receipt="b" * 64)
        publisher = PostgresCatalogPublisher(FakeEngine(connection))

        with self.assertRaisesRegex(CatalogPublicationError, "VALIDATED"):
            publisher.publish(
                "snapshot-candidate",
                published_by="release-operator",
                validation_receipt="b" * 64,
            )

        self.assertEqual(len(connection.calls), 1)

    def test_insert_failure_rolls_back_supersede(self):
        connection = FakeConnection(fail_insert=True, validation_receipt="c" * 64)
        engine = FakeEngine(connection)
        publisher = PostgresCatalogPublisher(engine)

        with self.assertRaisesRegex(RuntimeError, "injected insert failure"):
            publisher.publish(
                "snapshot-next",
                published_by="release-operator",
                validation_receipt="c" * 64,
            )

        self.assertTrue(engine.manager.rolled_back)
        self.assertFalse(engine.manager.committed)

    def test_rollback_links_new_publication_to_historical_target(self):
        connection = FakeConnection(validation_receipt="d" * 64)
        publisher = PostgresCatalogPublisher(FakeEngine(connection))

        publisher.rollback(
            TARGET_ID,
            published_by="release-operator",
            validation_receipt="d" * 64,
        )

        insert_parameters = next(
            parameters
            for sql, parameters in connection.calls
            if sql.startswith("INSERT INTO flat_catalog_publications")
        )
        self.assertEqual(insert_parameters["snapshot_id"], "snapshot-old")
        self.assertEqual(insert_parameters["rollback_of"], str(TARGET_ID))

    def test_rollback_cannot_cross_publication_channels(self):
        connection = FakeConnection(
            validation_receipt="e" * 64,
            target_channel="staging",
        )
        publisher = PostgresCatalogPublisher(FakeEngine(connection))

        with self.assertRaisesRegex(CatalogPublicationError, "requested channel"):
            publisher.rollback(
                TARGET_ID,
                published_by="release-operator",
                validation_receipt="e" * 64,
                channel="production",
            )

    def test_receipt_must_match_validated_snapshot(self):
        connection = FakeConnection(validation_receipt="f" * 64)
        publisher = PostgresCatalogPublisher(FakeEngine(connection))

        with self.assertRaisesRegex(CatalogPublicationError, "receipt does not match"):
            publisher.publish(
                "snapshot-next",
                published_by="release-operator",
                validation_receipt="0" * 64,
            )


if __name__ == "__main__":
    unittest.main()
