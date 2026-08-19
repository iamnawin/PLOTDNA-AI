from __future__ import annotations

import re
from uuid import UUID, uuid4

from sqlalchemy import Engine, text


class CatalogPublicationError(RuntimeError):
    pass


class PostgresCatalogPublisher:
    def __init__(self, engine: Engine):
        self._engine = engine

    def publish(
        self,
        snapshot_id: str,
        *,
        published_by: str,
        validation_receipt: str,
        channel: str = "production",
    ) -> UUID:
        _validate_input(snapshot_id, published_by, validation_receipt, channel)
        with self._engine.begin() as connection:
            return self._publish(
                connection,
                snapshot_id,
                published_by=published_by,
                validation_receipt=validation_receipt,
                channel=channel,
                rollback_of=None,
            )

    def rollback(
        self,
        publication_id: UUID,
        *,
        published_by: str,
        validation_receipt: str,
        channel: str = "production",
    ) -> UUID:
        _validate_input("rollback-target", published_by, validation_receipt, channel)
        with self._engine.begin() as connection:
            target = connection.execute(
                text(
                    """
                    SELECT id, snapshot_id
                    FROM flat_catalog_publications
                    WHERE id = :publication_id AND channel = :channel
                    FOR UPDATE
                    """
                ),
                {"publication_id": str(publication_id), "channel": channel},
            ).mappings().first()
            if target is None:
                raise CatalogPublicationError(
                    "rollback publication was not found in the requested channel"
                )
            return self._publish(
                connection,
                target["snapshot_id"],
                published_by=published_by,
                validation_receipt=validation_receipt,
                channel=channel,
                rollback_of=publication_id,
            )

    @staticmethod
    def _publish(
        connection,
        snapshot_id: str,
        *,
        published_by: str,
        validation_receipt: str,
        channel: str,
        rollback_of: UUID | None,
    ) -> UUID:
        snapshot = connection.execute(
            text(
                """
                SELECT validation_status, validation_receipt_sha256
                FROM flat_catalog_snapshots
                WHERE snapshot_id = :snapshot_id
                FOR UPDATE
                """
            ),
            {"snapshot_id": snapshot_id},
        ).mappings().first()
        if snapshot is None or snapshot["validation_status"] != "VALIDATED":
            raise CatalogPublicationError("catalog publication requires a VALIDATED snapshot")
        if snapshot["validation_receipt_sha256"] != validation_receipt:
            raise CatalogPublicationError(
                "validation receipt does not match the validated snapshot"
            )

        current = connection.execute(
            text(
                """
                SELECT id, snapshot_id
                FROM flat_catalog_publications
                WHERE channel = :channel AND superseded_at IS NULL
                FOR UPDATE
                """
            ),
            {"channel": channel},
        ).mappings().first()
        if current is not None and current["snapshot_id"] == snapshot_id:
            return UUID(str(current["id"]))
        if current is not None:
            connection.execute(
                text(
                    """
                    UPDATE flat_catalog_publications
                    SET superseded_at = now()
                    WHERE id = :publication_id AND superseded_at IS NULL
                    """
                ),
                {"publication_id": str(current["id"])},
            )

        new_id = uuid4()
        connection.execute(
            text(
                """
                INSERT INTO flat_catalog_publications (
                    id, channel, snapshot_id, published_by,
                    validation_receipt, rollback_of
                ) VALUES (
                    :id, :channel, :snapshot_id, :published_by,
                    :validation_receipt, :rollback_of
                )
                """
            ),
            {
                "id": str(new_id),
                "channel": channel,
                "snapshot_id": snapshot_id,
                "published_by": published_by,
                "validation_receipt": validation_receipt,
                "rollback_of": str(rollback_of) if rollback_of else None,
            },
        )
        return new_id


def _validate_input(
    snapshot_id: str,
    published_by: str,
    validation_receipt: str,
    channel: str,
) -> None:
    if not snapshot_id.strip() or not published_by.strip() or not channel.strip():
        raise ValueError("publication identifiers must not be blank")
    if not re.fullmatch(r"[0-9a-f]{64}", validation_receipt):
        raise ValueError("validation_receipt must be a SHA-256 hex digest")
