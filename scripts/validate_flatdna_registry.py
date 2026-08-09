from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.services.flatdna.registry_io import (  # noqa: E402
    DEFAULT_HYDERABAD_REGISTRY_PATH,
    load_registry_bundle,
    registry_summary,
)
from app.services.flatdna.registry_validation import (  # noqa: E402
    validate_hyderabad_launch_registry,
)


def validate_registry(path: str | Path) -> tuple[dict[str, int], list[dict[str, str | None]]]:
    bundle = load_registry_bundle(path)
    findings = validate_hyderabad_launch_registry(bundle)
    return registry_summary(bundle), [
        {"code": finding.code, "message": finding.message, "record_id": str(finding.record_id) if finding.record_id else None}
        for finding in findings
    ]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate the curated Hyderabad FlatDNA registry")
    parser.add_argument("--registry", type=Path, default=DEFAULT_HYDERABAD_REGISTRY_PATH)
    parser.add_argument("--json-report", type=Path)
    args = parser.parse_args(argv)
    summary, findings = validate_registry(args.registry)
    report = {"registry": str(args.registry), "counts": summary, "findings": findings}
    if args.json_report:
        args.json_report.parent.mkdir(parents=True, exist_ok=True)
        args.json_report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("FlatDNA Hyderabad registry")
    for name, count in summary.items():
        print(f"- {name}: {count}")
    for finding in findings:
        suffix = f" ({finding['record_id']})" if finding["record_id"] else ""
        print(f"ERROR {finding['code']}{suffix}: {finding['message']}")
    print("VALID" if not findings else f"INVALID: {len(findings)} finding(s)")
    return 0 if not findings else 1


if __name__ == "__main__":
    raise SystemExit(main())
