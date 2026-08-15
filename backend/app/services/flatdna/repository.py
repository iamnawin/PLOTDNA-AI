from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Protocol
from uuid import UUID

from sqlalchemy import Engine, bindparam, text

from .models import DataOrigin, RegistryBundle
from .registry_validation import ValidationFinding, validate_registry_bundle


class FlatDnaRegistryValidationError(ValueError):
    def __init__(self, findings: list[ValidationFinding]):
        self.findings = findings
        super().__init__("FlatDNA registry bundle failed validation")


class FlatDnaIdentityConflictError(ValueError):
    pass


class FlatProjectRepository(Protocol):
    def get_supported_project(self, project_id: UUID) -> dict[str, Any] | None: ...

    def list_supported_project_rera_references(self, project_id: UUID) -> list[dict[str, Any]]: ...

    def list_supported_projects(self, city_slug: str) -> list[dict[str, Any]]: ...

    def list_supported_project_identity_rows(self, city_slug: str) -> list[dict[str, Any]]: ...

    def upsert_registry(self, bundle: RegistryBundle) -> None: ...


class PostgresFlatProjectRepository:
    def __init__(self, engine: Engine):
        self._engine = engine

    def get_supported_project(self, project_id: UUID) -> dict[str, Any] | None:
        query = text(
            """
            SELECT project.*, developer.canonical_name AS developer_name,
                   developer.normalized_name AS developer_normalized_name
            FROM flat_projects project
            JOIN flat_developers developer ON developer.id = project.developer_id
            WHERE project.id = :project_id
              AND project.registry_status = 'SUPPORTED'
              AND developer.registry_status <> 'INACTIVE'
            """
        )
        with self._engine.connect() as connection:
            row = connection.execute(query, {"project_id": str(project_id)}).mappings().first()
        return dict(row) if row is not None else None

    def list_supported_projects(self, city_slug: str) -> list[dict[str, Any]]:
        query = text(
            """
            SELECT project.*, developer.canonical_name AS developer_name,
                   developer.normalized_name AS developer_normalized_name
            FROM flat_projects project
            JOIN flat_developers developer ON developer.id = project.developer_id
            WHERE project.city_slug = :city_slug
              AND project.registry_status = 'SUPPORTED'
              AND developer.registry_status <> 'INACTIVE'
            ORDER BY project.normalized_name, project.id
            """
        )
        with self._engine.connect() as connection:
            rows = connection.execute(query, {"city_slug": city_slug.strip().lower()}).mappings().all()
        return [dict(row) for row in rows]

    def list_supported_project_rera_references(self, project_id: UUID) -> list[dict[str, Any]]:
        query = text(
            """
            SELECT rera.authority_code,
                   rera.registration_number,
                   rera.reference_status
            FROM flat_rera_references rera
            JOIN flat_projects project ON project.id = rera.project_id
            JOIN flat_developers developer ON developer.id = project.developer_id
            WHERE project.id = :project_id
              AND project.registry_status = 'SUPPORTED'
              AND developer.registry_status <> 'INACTIVE'
              AND rera.reference_status <> 'SUPERSEDED'
            ORDER BY rera.authority_code, rera.normalized_registration_number, rera.id
            """
        )
        with self._engine.connect() as connection:
            rows = connection.execute(query, {"project_id": str(project_id)}).mappings().all()
        return [dict(row) for row in rows]

    def list_supported_project_identity_rows(self, city_slug: str) -> list[dict[str, Any]]:
        query = text(
            """
            SELECT project.id AS project_id,
                   project.canonical_name,
                   project.normalized_name,
                   project.developer_id,
                   project.city_slug,
                   project.locality_slug,
                   developer.canonical_name AS developer_name,
                   developer.normalized_name AS developer_normalized_name,
                   alias.id AS alias_id,
                   alias.alias,
                   alias.normalized_alias,
                   alias.alias_type
            FROM flat_projects project
            JOIN flat_developers developer ON developer.id = project.developer_id
            LEFT JOIN flat_project_aliases alias
              ON alias.project_id = project.id
             AND alias.active = true
            WHERE project.city_slug = :city_slug
              AND project.registry_status = 'SUPPORTED'
              AND developer.registry_status <> 'INACTIVE'
            ORDER BY project.normalized_name, project.id, alias.normalized_alias, alias.id
            """
        )
        with self._engine.connect() as connection:
            rows = connection.execute(query, {"city_slug": city_slug.strip().lower()}).mappings().all()
        return [dict(row) for row in rows]

    def upsert_registry(self, bundle: RegistryBundle) -> None:
        if any(source.data_origin in {DataOrigin.TEST, DataOrigin.SYNTHETIC} for source in bundle.evidence_sources):
            raise FlatDnaRegistryValidationError(
                [ValidationFinding("source.unsafe_origin", "repository rejects TEST and SYNTHETIC evidence")]
            )
        findings = validate_registry_bundle(bundle)
        if findings:
            raise FlatDnaRegistryValidationError(findings)

        with self._engine.begin() as connection:
            self._assert_immutable_relationships(connection, bundle)
            self._upsert_records(connection, "flat_developers", bundle.developers, (
                "id", "canonical_name", "normalized_name", "registry_status"
            ))
            self._upsert_records(connection, "flat_developer_aliases", bundle.developer_aliases, (
                "id", "developer_id", "alias", "normalized_alias", "alias_type", "active"
            ))
            self._upsert_records(connection, "flat_projects", bundle.projects, (
                "id", "developer_id", "canonical_name", "normalized_name", "city_slug", "locality_slug",
                "latitude", "longitude", "location_precision", "registry_status"
            ))
            self._upsert_records(connection, "flat_project_aliases", bundle.project_aliases, (
                "id", "project_id", "alias", "normalized_alias", "alias_type", "active"
            ))
            self._upsert_records(connection, "flat_rera_references", bundle.rera_references, (
                "id", "project_id", "authority_code", "registration_number",
                "normalized_registration_number", "reference_status"
            ))
            self._upsert_records(connection, "flat_evidence_sources", bundle.evidence_sources, (
                "id", "source_class", "data_origin", "publisher", "title", "source_ref", "url",
                "retrieved_at", "content_hash", "source_status"
            ))
            self._upsert_records(connection, "flat_claim_evidence", bundle.claim_evidence, (
                "id", "evidence_source_id", "developer_id", "developer_alias_id", "project_id",
                "project_alias_id", "rera_reference_id", "claim_key", "observed_value", "review_status",
                "reviewed_by", "reviewed_at", "notes", "fingerprint"
            ))

    @staticmethod
    def _upsert_records(connection, table: str, records: list[Any], columns: tuple[str, ...]) -> None:
        if not records:
            return
        insert_columns = ", ".join(columns)
        parameters = ", ".join(f":{column}" for column in columns)
        update_columns = ", ".join(
            f"{column} = EXCLUDED.{column}" for column in columns if column != "id"
        )
        statement = text(
            f"""
            INSERT INTO {table} ({insert_columns})
            VALUES ({parameters})
            ON CONFLICT (id) DO UPDATE SET {update_columns}, updated_at = now()
            """
        )
        connection.execute(statement, [_database_values(record, columns) for record in records])

    @staticmethod
    def _assert_immutable_relationships(connection, bundle: RegistryBundle) -> None:
        checks = (
            ("flat_projects", bundle.projects, ("developer_id",)),
            ("flat_developer_aliases", bundle.developer_aliases, ("developer_id",)),
            ("flat_project_aliases", bundle.project_aliases, ("project_id",)),
            ("flat_rera_references", bundle.rera_references, ("project_id",)),
            (
                "flat_evidence_sources",
                bundle.evidence_sources,
                ("source_class", "source_ref", "retrieved_at"),
            ),
            (
                "flat_claim_evidence",
                bundle.claim_evidence,
                (
                    "evidence_source_id", "developer_id", "developer_alias_id", "project_id",
                    "project_alias_id", "rera_reference_id", "claim_key", "observed_value"
                ),
            ),
        )
        for table, records, columns in checks:
            if not records:
                continue
            column_list = ", ".join(columns)
            statement = text(f"SELECT id, {column_list} FROM {table} WHERE id IN :ids").bindparams(
                bindparam("ids", expanding=True)
            )
            existing_by_id = {
                _comparable(row["id"]): row
                for row in connection.execute(
                    statement, {"ids": [str(record.id) for record in records]}
                ).mappings().all()
            }
            for record in records:
                existing = existing_by_id.get(str(record.id))
                if existing is None:
                    continue
                expected = _database_values(record, columns)
                if any(_comparable(existing[column]) != _comparable(expected[column]) for column in columns):
                    raise FlatDnaIdentityConflictError(
                        f"{table} UUID {record.id} cannot be reassigned to another canonical relationship"
                    )


def _database_values(record: Any, columns: tuple[str, ...]) -> dict[str, Any]:
    values: dict[str, Any] = {}
    for column in columns:
        value = getattr(record, column)
        if isinstance(value, Enum):
            value = value.value
        elif isinstance(value, UUID):
            value = str(value)
        values[column] = value
    return values


def _comparable(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    return str(value)
