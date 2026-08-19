from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
DEFAULT_FIXTURE = ROOT / "data" / "staging" / "tgrera" / "hyderabad-apartment-sample.json"
sys.path.insert(0, str(BACKEND))

from app.services.flatdna.catalog_pipeline import (  # noqa: E402
    SourceCatalogRecord,
    build_candidate_snapshot,
)


def build_report(path: str | Path) -> dict:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if payload.get("data_origin") != "TEST" or payload.get("production_eligible") is not False:
        raise ValueError("offline catalog builder accepts TEST, production-ineligible fixtures only")
    records = [SourceCatalogRecord.model_validate(record) for record in payload["records"]]
    if any(record.data_origin != "TEST" for record in records):
        raise ValueError("fixture contains a non-TEST source record")
    snapshot = build_candidate_snapshot(
        records,
        [],
        source_as_of=date.fromisoformat(payload["source_as_of"]),
        sequence=int(payload["sequence"]),
    )
    return snapshot.model_dump(mode="json")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Build a deterministic offline FlatDNA candidate snapshot from a TEST fixture"
    )
    parser.add_argument("--fixture", type=Path, default=DEFAULT_FIXTURE)
    parser.add_argument("--json-report", type=Path)
    args = parser.parse_args(argv)

    report = build_report(args.fixture)
    encoded = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.json_report:
        args.json_report.parent.mkdir(parents=True, exist_ok=True)
        args.json_report.write_text(encoded, encoding="utf-8")
    print(report["snapshot_id"])
    for name, count in report["metrics"].items():
        print(f"{name}: {count}")
    print("OFFLINE TEST FIXTURE: no database, network, or publication action performed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
