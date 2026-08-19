from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
DEFAULT_FIXTURE = ROOT / "data" / "staging" / "tgrera" / "hyderabad-apartment-sample.json"
DEFAULT_REGISTRY = ROOT / "data" / "cities" / "hyderabad" / "flatdna" / "registry.json"
sys.path.insert(0, str(BACKEND))

from app.services.flatdna.catalog_pipeline import (  # noqa: E402
    SourceCatalogRecord,
    build_candidate_snapshot,
)
from app.services.flatdna.catalog_validation import (  # noqa: E402
    expected_migration_state,
    reconcile_registry_migration,
    validate_candidate_snapshot,
)
from app.services.flatdna.registry_io import load_registry_bundle  # noqa: E402


def build_release_report(fixture_path: Path, registry_path: Path) -> dict:
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    if fixture.get("data_origin") != "TEST" or fixture.get("production_eligible") is not False:
        raise ValueError("release validator accepts the sanitized TEST fixture only")
    candidate = build_candidate_snapshot(
        [SourceCatalogRecord.model_validate(item) for item in fixture["records"]],
        [],
        date.fromisoformat(fixture["source_as_of"]),
        int(fixture["sequence"]),
    )
    candidate_receipt = validate_candidate_snapshot(candidate)
    registry = load_registry_bundle(registry_path)
    baseline_state = expected_migration_state(registry)
    baseline_check = reconcile_registry_migration(registry, baseline_state)
    return {
        "candidate_validation": candidate_receipt.model_dump(mode="json"),
        "registry_baseline_check": baseline_check.model_dump(mode="json"),
        "database_reconciliation_performed": False,
        "disposable_postgres_apply_down_reapply": "NOT_RUN",
        "publication_rollback_simulation": "UNIT_TEST_ONLY",
        "release_accepted": False,
        "blocking_reason": "FLATDNA_TEST_DATABASE_URL is required for database acceptance",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Create an offline FlatDNA catalog validation receipt without database access"
    )
    parser.add_argument("--fixture", type=Path, default=DEFAULT_FIXTURE)
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--json-report", type=Path)
    args = parser.parse_args(argv)

    report = build_release_report(args.fixture, args.registry)
    encoded = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.json_report:
        args.json_report.parent.mkdir(parents=True, exist_ok=True)
        args.json_report.write_text(encoded, encoding="utf-8")
    print(encoded, end="")
    return 0 if (
        report["candidate_validation"]["passed"]
        and report["registry_baseline_check"]["passed"]
    ) else 1


if __name__ == "__main__":
    raise SystemExit(main())
