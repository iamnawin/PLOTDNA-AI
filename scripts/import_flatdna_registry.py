from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from sqlalchemy import Engine, text
from sqlalchemy.engine import make_url


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.services.flatdna.database import create_flatdna_engine  # noqa: E402
from app.services.flatdna.registry_io import (  # noqa: E402
    DEFAULT_HYDERABAD_REGISTRY_PATH,
    load_registry_bundle,
    registry_summary,
)
from app.services.flatdna.registry_validation import (  # noqa: E402
    HYDERABAD_LAUNCH_PROJECT_IDS,
    validate_hyderabad_launch_registry,
)
from app.services.flatdna.repository import PostgresFlatProjectRepository  # noqa: E402


TABLES_BY_BUNDLE_KEY = {
    "developers": "flat_developers",
    "developer_aliases": "flat_developer_aliases",
    "projects": "flat_projects",
    "project_aliases": "flat_project_aliases",
    "rera_references": "flat_rera_references",
    "evidence_sources": "flat_evidence_sources",
    "claim_evidence": "flat_claim_evidence",
}


def sanitized_target(database_url: str) -> str:
    url = make_url(database_url)
    host = url.host or "local"
    database = (url.database or "unknown").lstrip("/")
    return f"{host}/{database}"


def verify_import(engine: Engine, expected_counts: dict[str, int]) -> None:
    with engine.connect() as connection:
        for key, table in TABLES_BY_BUNDLE_KEY.items():
            actual = connection.execute(text(f"SELECT count(*) FROM {table}")).scalar_one()
            if actual != expected_counts[key]:
                raise RuntimeError(f"post-import count mismatch for {table}: expected {expected_counts[key]}, got {actual}")
        project_ids = {row[0] for row in connection.execute(text("SELECT id FROM flat_projects"))}
    if project_ids != set(HYDERABAD_LAUNCH_PROJECT_IDS.values()):
        raise RuntimeError("post-import project UUID verification failed")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Dry-run or import the curated Hyderabad FlatDNA registry")
    parser.add_argument("--registry", type=Path, default=DEFAULT_HYDERABAD_REGISTRY_PATH)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--database-url-env", default="DATABASE_URL")
    parser.add_argument("--confirm-target")
    args = parser.parse_args(argv)

    bundle = load_registry_bundle(args.registry)
    findings = validate_hyderabad_launch_registry(bundle)
    if findings:
        for finding in findings:
            print(f"ERROR {finding.code}: {finding.message}")
        return 1

    counts = registry_summary(bundle)
    print("FlatDNA registry validated")
    for name, count in counts.items():
        print(f"- {name}: {count}")
    if not args.apply:
        print("DRY RUN: no database connection or write performed")
        return 0

    database_url = os.getenv(args.database_url_env, "").strip()
    if not database_url:
        print(f"ERROR: {args.database_url_env} is not configured")
        return 2
    target = sanitized_target(database_url)
    if args.confirm_target != target:
        print(f"ERROR: pass --confirm-target {target} to apply")
        return 2

    engine = create_flatdna_engine(database_url)
    try:
        PostgresFlatProjectRepository(engine).upsert_registry(bundle)
        verify_import(engine, counts)
    finally:
        engine.dispose()
    print(f"IMPORTED: {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
