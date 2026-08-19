from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import Engine, text


class PostgresFlatCatalogRepository:
    def __init__(self, engine: Engine):
        self._engine = engine

    def get_published_status(self) -> dict[str, Any] | None:
        query = text(
            """
            SELECT snapshot.snapshot_id,
                   snapshot.source_as_of,
                   snapshot.metrics,
                   publication.served_from_last_known_good
            FROM flat_catalog_publications publication
            JOIN flat_catalog_snapshots snapshot
              ON snapshot.snapshot_id = publication.snapshot_id
            WHERE publication.channel = 'production'
              AND publication.superseded_at IS NULL
            """
        )
        with self._engine.connect() as connection:
            row = connection.execute(query).mappings().first()
        return dict(row) if row is not None else None

    def search(self, query_text: str, *, offset: int, limit: int) -> list[dict[str, Any]]:
        query = text(
            """
            WITH active AS (
                SELECT publication.snapshot_id
                FROM flat_catalog_publications publication
                WHERE publication.channel = 'production'
                  AND publication.superseded_at IS NULL
            ), matched AS (
                SELECT version.*,
                       CASE
                           WHEN lower(version.registration_number) LIKE :query THEN 1
                           WHEN lower(version.developer_name) LIKE :query THEN 2
                           WHEN lower(coalesce(version.locality_slug, '')) LIKE :query THEN 3
                           ELSE 4
                       END AS match_rank
                FROM flat_catalog_project_versions version
                JOIN active ON active.snapshot_id = version.snapshot_id
                WHERE version.catalog_status = 'SEARCHABLE'
                  AND (
                      lower(version.canonical_name) LIKE :query
                      OR lower(version.developer_name) LIKE :query
                      OR lower(coalesce(version.locality_slug, '')) LIKE :query
                      OR lower(version.registration_number) LIKE :query
                  )
            ), prioritized AS (
                SELECT matched.*, min(match_rank) OVER () AS best_rank
                FROM matched
            )
            SELECT prioritized.canonical_project_id AS project_id,
                   prioritized.registration_id,
                   prioritized.canonical_name,
                   prioritized.developer_name,
                   prioritized.authority_code,
                   prioritized.registration_number,
                   prioritized.city_slug,
                   prioritized.locality_slug,
                   prioritized.location_precision,
                   prioritized.review_status,
                   prioritized.identity_status,
                   prioritized.project_status,
                   prioritized.catalog_status,
                   prioritized.historical_reviewed_at,
                   prioritized.historical_review_valid_until,
                   prioritized.source_as_of,
                   prioritized.snapshot_id,
                   CASE prioritized.match_rank
                       WHEN 1 THEN 'RERA'
                       WHEN 2 THEN 'BUILDER'
                       WHEN 3 THEN 'LOCALITY'
                       ELSE 'PROJECT'
                   END AS query_type,
                   count(*) OVER () AS total
            FROM prioritized
            WHERE prioritized.match_rank = prioritized.best_rank
            ORDER BY prioritized.canonical_name, prioritized.registration_id
            OFFSET :offset LIMIT :limit
            """
        )
        parameters = {
            "query": f"%{query_text.strip().lower()}%",
            "offset": offset,
            "limit": limit,
        }
        with self._engine.connect() as connection:
            rows = connection.execute(query, parameters).mappings().all()
        return [dict(row) for row in rows]

    def get_detail(
        self,
        registration_id: UUID,
    ) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
        detail_query = text(
            """
            WITH active AS (
                SELECT publication.snapshot_id
                FROM flat_catalog_publications publication
                WHERE publication.channel = 'production'
                  AND publication.superseded_at IS NULL
            )
            SELECT version.canonical_project_id AS project_id,
                   version.registration_id,
                   version.canonical_name,
                   version.developer_name,
                   version.authority_code,
                   version.registration_number,
                   version.city_slug,
                   version.locality_slug,
                   version.latitude,
                   version.longitude,
                   version.location_precision,
                   version.review_status,
                   version.identity_status,
                   version.project_status,
                   version.catalog_status,
                   version.source_as_of,
                   version.snapshot_id,
                   version.current_review_id,
                   version.historical_reviewed_at,
                   version.historical_review_valid_until,
                   source.source_identifier,
                   source.retrieved_at AS source_retrieved_at
            FROM flat_catalog_project_versions version
            JOIN active ON active.snapshot_id = version.snapshot_id
            JOIN flat_source_records source ON source.id = version.source_record_id
            WHERE version.registration_id = :registration_id
              AND version.catalog_status = 'SEARCHABLE'
            """
        )
        with self._engine.connect() as connection:
            row = connection.execute(
                detail_query,
                {"registration_id": str(registration_id)},
            ).mappings().first()
            if row is None:
                return None, []
            project = dict(row)
            warning_rows = connection.execute(
                text(
                    """
                    SELECT warning.flag_type,
                           warning.warning_origin,
                           warning.warning_status,
                           warning.public_origin_label,
                           warning.source_label,
                           warning.source_url,
                           warning.source_as_of,
                           warning.observed_at
                    FROM flat_catalog_warning_versions warning
                    WHERE warning.project_id = :project_id
                      AND warning.snapshot_id = :snapshot_id
                      AND (
                          warning.registration_id IS NULL
                          OR warning.registration_id = :registration_id
                      )
                    ORDER BY warning.warning_status, warning.flag_type, warning.observed_at DESC
                    """
                ),
                {
                    "project_id": str(project["project_id"]),
                    "registration_id": str(registration_id),
                    "snapshot_id": project["snapshot_id"],
                },
            ).mappings().all()
        return project, [dict(warning) for warning in warning_rows]
