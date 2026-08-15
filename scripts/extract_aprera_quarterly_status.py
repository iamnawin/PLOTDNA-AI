from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.services.flatdna.aprera_quarterly import parse_quarterly_tables  # noqa: E402


PARSER_VERSION = "aprera-quarterly-v1"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract the official APRERA quarterly-status PDF")
    parser.add_argument("--input", type=Path, required=True, help="Downloaded official PDF")
    parser.add_argument("--output", type=Path, required=True, help="Staging JSON path")
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--retrieved-at", required=True, help="ISO-8601 timestamp with timezone")
    parser.add_argument("--project-type", help="Optional exact project-type filter")
    parser.add_argument("--limit", type=int, help="Optional deterministic record limit")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    retrieved_at = datetime.fromisoformat(args.retrieved_at.replace("Z", "+00:00"))
    if retrieved_at.utcoffset() is None:
        raise SystemExit("--retrieved-at must include a timezone")
    if args.limit is not None and args.limit < 1:
        raise SystemExit("--limit must be positive")

    try:
        import pdfplumber
    except ImportError as exc:
        raise SystemExit("pdfplumber is required: run with `uv run --with pdfplumber`") from exc

    raw = args.input.read_bytes()
    tables = []
    with pdfplumber.open(args.input) as pdf:
        for page in pdf.pages:
            tables.extend(page.extract_tables())

    records = parse_quarterly_tables(tables)
    if args.project_type:
        records = [
            record for record in records
            if record["project_type"] == args.project_type
        ]
    if args.limit:
        records = records[:args.limit]

    payload = {
        "schema_version": 1,
        "parser_version": PARSER_VERSION,
        "source": {
            "publisher": "Andhra Pradesh RERA",
            "url": args.source_url,
            "retrieved_at": retrieved_at.isoformat(),
            "content_sha256": hashlib.sha256(raw).hexdigest(),
        },
        "record_count": len(records),
        "records": records,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"APRERA staging records: {len(records)}")
    print(f"Output: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
