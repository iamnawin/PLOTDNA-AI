from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
DEFAULT_POLICY_PATH = ROOT / "data" / "cities" / "hyderabad" / "flatdna" / "acquisition-policy.json"
sys.path.insert(0, str(BACKEND))

from app.services.flatdna.acquisition import (  # noqa: E402
    AcquisitionApprovalError,
    assert_automated_ingestion_allowed,
    load_acquisition_policy,
)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate the FlatDNA TG-RERA acquisition policy without accessing the network"
    )
    parser.add_argument("--policy", type=Path, default=DEFAULT_POLICY_PATH)
    parser.add_argument("--require-approved", action="store_true")
    args = parser.parse_args(argv)

    policy = load_acquisition_policy(args.policy)
    print(json.dumps(policy.sanitized_summary(), indent=2))
    if not args.require_approved:
        return 0

    try:
        assert_automated_ingestion_allowed(policy)
    except AcquisitionApprovalError as exc:
        print(f"BLOCKED: {exc}")
        return 1
    print("APPROVED: automated acquisition policy gate passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
