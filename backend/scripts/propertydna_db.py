from __future__ import annotations

import argparse
import re
import socket
import ssl
import sys
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

from sqlalchemy import Engine, bindparam, text
from sqlalchemy.engine import URL, make_url


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPO_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))
sys.path.insert(0, str(REPO_ROOT))

from app.services.flatdna.database import create_flatdna_engine  # noqa: E402
from app.services.flatdna.registry_io import (  # noqa: E402
    load_registry_bundle,
    registry_summary,
)
from app.services.flatdna.registry_validation import (  # noqa: E402
    HYDERABAD_LAUNCH_PROJECT_IDS,
    validate_hyderabad_launch_registry,
)
from app.services.flatdna.repository import PostgresFlatProjectRepository  # noqa: E402
from scripts.import_flatdna_registry import (  # noqa: E402
    TABLES_BY_BUNDLE_KEY,
    verify_import,
)


SECRET_FILE = REPO_ROOT / ".local-secrets" / "production.env"
UP_MIGRATION = BACKEND_ROOT / "migrations" / "0001_flatdna_registry.up.sql"
WRITE_COMMANDS = {"migrate", "registry-import"}
EXPECTED_REGISTRY_COUNTS = {
    "developers": 8,
    "developer_aliases": 0,
    "projects": 14,
    "project_aliases": 9,
    "rera_references": 14,
    "evidence_sources": 42,
    "claim_evidence": 87,
}
DIAGNOSTIC_CATEGORIES = (
    "SECRET_FILE_MISSING",
    "DATABASE_URL_MISSING",
    "INVALID_DATABASE_URL",
    "DNS_RESOLUTION_FAILED",
    "CONNECTION_TIMEOUT",
    "CONNECTION_REFUSED",
    "SSL_ERROR",
    "AUTHENTICATION_FAILED",
    "DATABASE_NOT_FOUND",
    "ROLE_NOT_FOUND",
    "UNKNOWN_DATABASE_ERROR",
)


class OperatorError(RuntimeError):
    def __init__(self, message: str, diagnostic: str = "UNKNOWN_DATABASE_ERROR"):
        self.diagnostic = diagnostic
        super().__init__(message)


@dataclass(frozen=True, repr=False)
class DatabaseConfig:
    database_url: str
    parsed_url: URL
    project_ref: str


@dataclass(frozen=True)
class MigrationObjects:
    tables: tuple[str, ...]
    indexes: tuple[str, ...]
    functions: tuple[str, ...]
    triggers: tuple[str, ...]
    constraints: tuple[str, ...]

    @property
    def relations(self) -> tuple[str, ...]:
        return self.tables + self.indexes


@dataclass(frozen=True)
class Inspection:
    version: str
    database: str
    role: str
    search_path: str
    target_schema: str
    existing_tables: tuple[str, ...]
    relation_conflicts: tuple[str, ...]
    function_conflicts: tuple[str, ...]
    trigger_conflicts: tuple[str, ...]
    constraint_conflicts: tuple[str, ...]

    @property
    def conflicts(self) -> tuple[str, ...]:
        return (
            self.relation_conflicts
            + self.function_conflicts
            + self.trigger_conflicts
            + self.constraint_conflicts
        )


def load_database_config(path: Path | None = None) -> DatabaseConfig:
    secret_path = path or SECRET_FILE
    if not secret_path.is_file():
        raise OperatorError(
            "missing .local-secrets/production.env; create it manually with DATABASE_URL",
            "SECRET_FILE_MISSING",
        )

    database_url = ""
    try:
        for raw_line in secret_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                raise OperatorError("production.env is malformed", "INVALID_DATABASE_URL")
            key, value = line.split("=", 1)
            if key.strip() == "DATABASE_URL":
                if database_url:
                    raise OperatorError(
                        "production.env contains duplicate DATABASE_URL entries",
                        "INVALID_DATABASE_URL",
                    )
                database_url = value.strip()
                if len(database_url) >= 2 and database_url[0] == database_url[-1] in {"'", '"'}:
                    database_url = database_url[1:-1]
    except OSError as exc:
        raise OperatorError("production.env could not be read") from exc

    if not database_url:
        raise OperatorError(
            "production.env does not contain a non-empty DATABASE_URL",
            "DATABASE_URL_MISSING",
        )

    try:
        parsed = make_url(database_url)
    except Exception as exc:
        raise OperatorError("DATABASE_URL is malformed", "INVALID_DATABASE_URL") from exc

    host = (parsed.host or "").lower()
    username = parsed.username or ""
    if (
        not parsed.drivername.startswith("postgresql")
        or not parsed.password
        or not parsed.database
        or not host.endswith(".pooler.supabase.com")
        or not username.startswith("postgres.")
    ):
        raise OperatorError(
            "DATABASE_URL must be a Supabase PostgreSQL Session Pooler URL",
            "INVALID_DATABASE_URL",
        )

    project_ref = username.partition(".")[2]
    if not re.fullmatch(r"[a-z0-9]+", project_ref):
        raise OperatorError(
            "Supabase project identity could not be derived safely",
            "INVALID_DATABASE_URL",
        )
    return DatabaseConfig(database_url, parsed, project_ref)


def diagnose_database_error(error: BaseException) -> str:
    errors: list[BaseException] = []
    pending: list[BaseException] = [error]
    seen: set[int] = set()
    while pending:
        current = pending.pop()
        if id(current) in seen:
            continue
        seen.add(id(current))
        errors.append(current)
        for nested in (
            getattr(current, "orig", None),
            current.__cause__,
            current.__context__,
        ):
            if isinstance(nested, BaseException):
                pending.append(nested)

    if any(isinstance(item, socket.gaierror) for item in errors):
        return "DNS_RESOLUTION_FAILED"
    if any(isinstance(item, (TimeoutError, socket.timeout)) for item in errors):
        return "CONNECTION_TIMEOUT"
    if any(isinstance(item, ConnectionRefusedError) for item in errors):
        return "CONNECTION_REFUSED"
    if any(isinstance(item, ssl.SSLError) for item in errors):
        return "SSL_ERROR"

    messages = []
    sqlstates = set()
    for item in errors:
        try:
            messages.append(str(item).casefold())
        except Exception:
            pass
        sqlstate = getattr(item, "pgcode", None) or getattr(
            getattr(item, "diag", None), "sqlstate", None
        )
        if sqlstate:
            sqlstates.add(sqlstate)
    message = " ".join(messages)

    if "role " in message and " does not exist" in message:
        return "ROLE_NOT_FOUND"
    if "3D000" in sqlstates or ("database " in message and " does not exist" in message):
        return "DATABASE_NOT_FOUND"
    if "28P01" in sqlstates or "password authentication failed" in message:
        return "AUTHENTICATION_FAILED"
    if any(
        marker in message
        for marker in (
            "could not translate host name",
            "name or service not known",
            "temporary failure in name resolution",
            "getaddrinfo failed",
        )
    ):
        return "DNS_RESOLUTION_FAILED"
    if any(marker in message for marker in ("connection timed out", "timeout expired")):
        return "CONNECTION_TIMEOUT"
    if "connection refused" in message:
        return "CONNECTION_REFUSED"
    if any(
        marker in message
        for marker in ("ssl error", "certificate verify failed", "tls handshake")
    ):
        return "SSL_ERROR"
    return "UNKNOWN_DATABASE_ERROR"


def migration_objects() -> MigrationObjects:
    sql = UP_MIGRATION.read_text(encoding="utf-8")

    def names(pattern: str) -> tuple[str, ...]:
        return tuple(dict.fromkeys(re.findall(pattern, sql, flags=re.IGNORECASE | re.MULTILINE)))

    return MigrationObjects(
        tables=names(r"^CREATE TABLE\s+(flat_[a-z_]+)"),
        indexes=names(r"^CREATE (?:UNIQUE )?INDEX\s+(flat_[a-z_]+)"),
        functions=names(r"^CREATE FUNCTION\s+(flat_[a-z_]+)"),
        triggers=names(r"^CREATE CONSTRAINT TRIGGER\s+(flat_[a-z_]+)"),
        constraints=names(r"\bCONSTRAINT\s+(flat_[a-z_]+)"),
    )


@contextmanager
def read_only_connection(engine: Engine) -> Iterator[object]:
    with engine.connect() as connection:
        with connection.begin():
            connection.exec_driver_sql("SET TRANSACTION READ ONLY")
            yield connection


def _in_query(sql: str, parameter: str = "names"):
    return text(sql).bindparams(bindparam(parameter, expanding=True))


def _database_identity(connection) -> dict[str, str]:
    return dict(
        connection.execute(
            text(
                """
                SELECT version() AS version,
                       current_database() AS database,
                       current_user AS role,
                       current_setting('search_path') AS search_path,
                       current_schema() AS target_schema
                """
            )
        ).mappings().one()
    )


def _catalog_inspection(connection, schema: str, expected: MigrationObjects) -> dict[str, tuple[str, ...]]:
    existing_tables = tuple(
        connection.execute(
            _in_query(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = :schema AND table_name IN :names
                ORDER BY table_name
                """
            ),
            {"schema": schema, "names": expected.tables},
        ).scalars()
    )
    relation_conflicts = tuple(
        connection.execute(
            _in_query(
                """
                SELECT c.relname
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = :schema AND c.relname IN :names
                ORDER BY c.relname
                """
            ),
            {"schema": schema, "names": expected.relations},
        ).scalars()
    )
    function_conflicts = tuple(
        connection.execute(
            _in_query(
                """
                SELECT DISTINCT p.proname
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = :schema AND p.proname IN :names
                ORDER BY p.proname
                """
            ),
            {"schema": schema, "names": expected.functions},
        ).scalars()
    )
    trigger_conflicts = tuple(
        connection.execute(
            _in_query(
                """
                SELECT DISTINCT t.tgname
                FROM pg_trigger t
                JOIN pg_class c ON c.oid = t.tgrelid
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = :schema AND NOT t.tgisinternal AND t.tgname IN :names
                ORDER BY t.tgname
                """
            ),
            {"schema": schema, "names": expected.triggers},
        ).scalars()
    )
    constraint_conflicts = tuple(
        connection.execute(
            _in_query(
                """
                SELECT DISTINCT con.conname
                FROM pg_constraint con
                JOIN pg_namespace n ON n.oid = con.connamespace
                WHERE n.nspname = :schema AND con.conname IN :names
                ORDER BY con.conname
                """
            ),
            {"schema": schema, "names": expected.constraints},
        ).scalars()
    )
    return {
        "existing_tables": existing_tables,
        "relation_conflicts": relation_conflicts,
        "function_conflicts": function_conflicts,
        "trigger_conflicts": trigger_conflicts,
        "constraint_conflicts": constraint_conflicts,
    }


def collect_inspection(engine: Engine) -> Inspection:
    expected = migration_objects()
    with read_only_connection(engine) as connection:
        identity = _database_identity(connection)
        schema = identity["target_schema"]
        if not schema:
            raise OperatorError("database has no active target schema")
        catalog = _catalog_inspection(connection, schema, expected)
    return Inspection(**identity, **catalog)


def _print_inspection(config: DatabaseConfig, inspection: Inspection) -> None:
    print("connected: YES")
    print(f"postgresql_version: {inspection.version}")
    print(f"database: {inspection.database}")
    print(f"role: {inspection.role}")
    print(f"search_path: {inspection.search_path}")
    print(f"target_schema: {inspection.target_schema}")
    print(f"supabase_project_ref: {config.project_ref}")
    print("existing_flat_tables: " + (", ".join(inspection.existing_tables) or "none"))
    print("migration_conflicts: " + (", ".join(inspection.conflicts) or "none"))
    print(
        "safe_to_migrate: "
        + ("YES" if inspection.target_schema == "public" and not inspection.conflicts else "NO")
    )


def _validated_registry():
    bundle = load_registry_bundle()
    findings = validate_hyderabad_launch_registry(bundle)
    if findings:
        raise OperatorError(f"accepted registry failed validation with {len(findings)} finding(s)")
    counts = registry_summary(bundle)
    if counts != EXPECTED_REGISTRY_COUNTS:
        raise OperatorError("accepted registry counts differ from the production lock")
    return bundle, counts


def _require_flatdna_tables(inspection: Inspection) -> None:
    expected = set(migration_objects().tables)
    if inspection.target_schema != "public" or set(inspection.existing_tables) != expected:
        raise OperatorError("the seven FlatDNA tables are not present in the public schema")


def _require_migration_objects(inspection: Inspection) -> None:
    expected = migration_objects()
    if (
        set(inspection.relation_conflicts) != set(expected.relations)
        or set(inspection.function_conflicts) != set(expected.functions)
        or set(inspection.trigger_conflicts) != set(expected.triggers)
        or set(inspection.constraint_conflicts) != set(expected.constraints)
    ):
        raise OperatorError("migration object verification failed")
    _require_flatdna_tables(inspection)


def registry_plan(engine: Engine, bundle) -> dict[str, dict[str, int]]:
    plan: dict[str, dict[str, int]] = {}
    with read_only_connection(engine) as connection:
        for key, table in TABLES_BY_BUNDLE_KEY.items():
            records = getattr(bundle, key)
            ids = [str(record.id) for record in records]
            existing_ids = set()
            if ids:
                existing_ids = set(
                    connection.execute(
                        _in_query(f"SELECT id FROM {table} WHERE id IN :names"),
                        {"names": ids},
                    ).scalars()
                )
            total = connection.execute(text(f"SELECT count(*) FROM {table}")).scalar_one()
            updates = len(existing_ids)
            plan[key] = {
                "inserts": len(records) - updates,
                "updates": updates,
                "other_existing_rows": total - updates,
            }
    return plan


def _print_registry_counts(counts: dict[str, int]) -> None:
    print("registry_valid: YES")
    for key, count in counts.items():
        print(f"{key}: {count}")


def _print_registry_plan(plan: dict[str, dict[str, int]]) -> None:
    for key, counts in plan.items():
        print(
            f"{key}: inserts={counts['inserts']} updates={counts['updates']} "
            f"other_existing_rows={counts['other_existing_rows']}"
        )


def apply_up_migration(engine: Engine) -> None:
    sql = UP_MIGRATION.read_text(encoding="utf-8")
    raw_connection = engine.raw_connection()
    cursor = None
    try:
        cursor = raw_connection.cursor()
        cursor.execute(sql)
        raw_connection.commit()
    except Exception:
        raw_connection.rollback()
        raise
    finally:
        if cursor is not None:
            cursor.close()
        raw_connection.close()


def verify_registry(engine: Engine, counts: dict[str, int]) -> None:
    verify_import(engine, counts)
    with read_only_connection(engine) as connection:
        supported = connection.execute(
            text("SELECT count(*) FROM flat_projects WHERE registry_status = 'SUPPORTED'")
        ).scalar_one()
        verified_rera = connection.execute(
            text("SELECT count(*) FROM flat_rera_references WHERE reference_status = 'VERIFIED'")
        ).scalar_one()
        approved_claims = connection.execute(
            text("SELECT count(*) FROM flat_claim_evidence WHERE review_status = 'APPROVED'")
        ).scalar_one()
        project_ids = set(connection.execute(text("SELECT id FROM flat_projects")).scalars())
    if supported != len(HYDERABAD_LAUNCH_PROJECT_IDS):
        raise OperatorError("not all accepted FlatDNA projects are SUPPORTED")
    if verified_rera != counts["rera_references"]:
        raise OperatorError("not all accepted RERA references are VERIFIED")
    if approved_claims != counts["claim_evidence"]:
        raise OperatorError("not all accepted evidence claims are APPROVED")
    if {str(value) for value in project_ids} != {
        str(value) for value in HYDERABAD_LAUNCH_PROJECT_IDS.values()
    }:
        raise OperatorError("production project UUIDs differ from the accepted registry")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="PropertyDNA production database operator")
    parser.add_argument(
        "command",
        choices=("inspect", "migrate", "registry-dry-run", "registry-import", "verify"),
    )
    parser.add_argument("--confirm-production", action="store_true")
    parser.add_argument("--diagnose", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.diagnose and args.command != "inspect":
        print("ERROR: --diagnose is only valid with inspect", file=sys.stderr)
        return 2
    if args.command in WRITE_COMMANDS and not args.confirm_production:
        print("ERROR: write command requires --confirm-production", file=sys.stderr)
        return 2

    engine = None
    try:
        config = load_database_config()
        engine = create_flatdna_engine(config.database_url)

        if args.command == "inspect":
            _print_inspection(config, collect_inspection(engine))
        elif args.command == "migrate":
            inspection = collect_inspection(engine)
            if inspection.target_schema != "public" or inspection.conflicts:
                raise OperatorError("migration safety gate failed; run inspect for details")
            apply_up_migration(engine)
            post_migration = collect_inspection(engine)
            _require_migration_objects(post_migration)
            print("migration_0001_applied: YES")
        elif args.command == "registry-dry-run":
            bundle, counts = _validated_registry()
            inspection = collect_inspection(engine)
            _require_flatdna_tables(inspection)
            plan = registry_plan(engine, bundle)
            _print_registry_counts(counts)
            _print_registry_plan(plan)
            print("dry_run_writes: 0")
        elif args.command == "registry-import":
            bundle, counts = _validated_registry()
            inspection = collect_inspection(engine)
            _require_flatdna_tables(inspection)
            plan = registry_plan(engine, bundle)
            if any(item["other_existing_rows"] for item in plan.values()):
                raise OperatorError("unexpected FlatDNA rows exist; import refused")
            PostgresFlatProjectRepository(engine).upsert_registry(bundle)
            verify_registry(engine, counts)
            print("registry_imported: YES")
        elif args.command == "verify":
            _, counts = _validated_registry()
            inspection = collect_inspection(engine)
            _require_flatdna_tables(inspection)
            verify_registry(engine, counts)
            _print_registry_counts(counts)
            print("uuid_verification: EXACT MATCH")
            print("supported_projects: 14")
    except OperatorError as exc:
        if args.command == "inspect":
            print("connected: NO")
        if args.diagnose:
            print(f"diagnostic: {exc.diagnostic}")
        else:
            print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:
        if args.command == "inspect":
            print("connected: NO")
        if args.diagnose:
            print(f"diagnostic: {diagnose_database_error(exc)}")
        else:
            print("ERROR: database operation failed (details redacted)", file=sys.stderr)
        return 1
    finally:
        if engine is not None:
            engine.dispose()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
