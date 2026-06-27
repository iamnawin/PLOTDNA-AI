"""Verify official infrastructure references for Hyderabad pending cells.

This extracts HMDA Regional Ring Road Annexure B village rows and marks the
infrastructure signal verified only when a pending cell's official village and
mandal match an annexure row. It does not assign scores or promote cells.
"""

from __future__ import annotations

import json
import re
import tempfile
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen


try:
    from PyPDF2 import PdfReader
except ImportError as exc:  # pragma: no cover - environment guard
    raise SystemExit("PyPDF2 is required to extract HMDA Annexure B text") from exc


REPO_ROOT = Path(__file__).resolve().parents[1]
CITY_DIR = REPO_ROOT / "data" / "cities" / "hyderabad"
PENDING_SOURCES_PATH = CITY_DIR / "pending-context-sources.json"
OUTPUT_PATH = CITY_DIR / "pending-infrastructure-signals.json"
GENERATED_AT = "2026-06-27"

SOURCE_NAME = "HMDA proposed alignment of 100m wide Regional Ring Road Annexure B"
SOURCE_PAGE_URL = "https://www.hmda.gov.in/proposed-alignment-of-100m-wide-regional-ring-road/"
ANNEXURE_B_URL = "https://www.hmda.gov.in/wp-content/uploads/2020/07/Annexure-B.pdf"
PROJECT_NAME = "Proposed 100m wide Regional Ring Road"
ANNEXURE_DISTRICTS = [
    "Yadadri Bhuvanagiri",
    "Mahabubnagar",
    "Rangareddy",
    "Sangareddy",
    "Siddipet",
    "Nalgonda",
    "Medak",
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def fetch_pdf(url: str) -> Path:
    target = Path(tempfile.gettempdir()) / "plotdna-hmda-annexure-b.pdf"
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 PlotDNA data validation"})
    with urlopen(request, timeout=45) as response:
        target.write_bytes(response.read())
    return target


def extract_annexure_rows(pdf_path: Path) -> list[dict[str, str]]:
    reader = PdfReader(str(pdf_path))
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    rows = []
    for line in text.splitlines():
        clean = re.sub(r"\s+", " ", line).strip()
        if not re.match(r"^\d+\s+", clean):
            continue
        parsed = parse_annexure_row(clean)
        if not parsed:
            continue
        rows.append(
            {
                **parsed,
                "raw": clean[:700],
            }
        )
    return rows


def parse_annexure_row(clean: str) -> dict[str, str] | None:
    without_serial = re.sub(r"^\d+\s+", "", clean).strip()
    district = next(
        (
            name
            for name in sorted(ANNEXURE_DISTRICTS, key=len, reverse=True)
            if without_serial.lower().startswith(name.lower())
        ),
        None,
    )
    if not district:
        return None
    remainder = without_serial[len(district):].strip()
    mandal_match = re.match(r"([A-Za-z_]+)", remainder)
    if not mandal_match:
        return None
    mandal = mandal_match.group(1)
    village_and_surveys = remainder[mandal_match.end():].strip()
    village = re.split(r"\d|Presently", village_and_surveys, maxsplit=1)[0].strip()
    if not village:
        return None
    return {
        "districtName": district,
        "mandalName": mandal,
        "villageName": village,
        "normalizedMandal": normalize(mandal),
        "normalizedVillage": normalize(village),
    }


def find_annexure_row(rows: list[dict[str, str]], match: dict[str, Any]) -> dict[str, str] | None:
    village = normalize(match.get("villageName"))
    mandal = normalize(match.get("mandalName"))
    if not village or not mandal:
        return None
    return next(
        (
            row
            for row in rows
            if row["normalizedVillage"] == village and row["normalizedMandal"] == mandal
        ),
        None,
    )


def build_signal(row: dict[str, Any], annexure_rows: list[dict[str, str]]) -> dict[str, Any]:
    match = (row.get("officialMatches") or [{}])[0]
    annexure_row = find_annexure_row(annexure_rows, match)
    if not annexure_row:
        return {
            "slug": row["slug"],
            "name": row["name"],
            "status": "missing",
            "reason": "rrr_annexure_village_not_matched",
        }
    return {
        "slug": row["slug"],
        "name": row["name"],
        "status": "verified",
        "sourceName": SOURCE_NAME,
        "sourceUrl": ANNEXURE_B_URL,
        "sourcePageUrl": SOURCE_PAGE_URL,
        "officialMatch": {
            "villageName": match.get("villageName"),
            "mandalName": match.get("mandalName"),
            "districtName": match.get("districtName"),
            "sourceKey": match.get("sourceKey"),
        },
        "summary": {
            "projectName": PROJECT_NAME,
            "evidenceLabel": "Village listed in HMDA RRR Annexure B indicative village/survey-number alignment",
            "annexureDistrictName": annexure_row["districtName"],
            "annexureMandalName": annexure_row["mandalName"],
            "annexureVillageName": annexure_row["villageName"],
            "annexureRow": annexure_row["raw"],
        },
        "nextAction": "Keep blocked until every other required scoring signal is verified for this exact area.",
    }


def main() -> None:
    pending_sources = load_json(PENDING_SOURCES_PATH)
    annexure_rows = extract_annexure_rows(fetch_pdf(ANNEXURE_B_URL))
    infrastructure_signals = [
        build_signal(row, annexure_rows)
        for row in pending_sources["sourceAudits"]
    ]
    verified_count = sum(1 for signal in infrastructure_signals if signal["status"] == "verified")
    payload = {
        "schemaVersion": 1,
        "generatedAt": GENERATED_AT,
        "citySlug": "hyderabad",
        "purpose": "official exact-area infrastructure evidence for Hyderabad pending context cells",
        "sourcePolicy": "Use as infrastructure evidence only; it does not verify price, RERA, satellite, employment, or government-scheme signals.",
        "summary": {
            "pendingContextCellCount": len(infrastructure_signals),
            "verifiedInfrastructureSignalCount": verified_count,
            "missingInfrastructureSignalCount": len(infrastructure_signals) - verified_count,
        },
        "infrastructureSignals": infrastructure_signals,
    }
    write_json(OUTPUT_PATH, payload)
    print(
        f"Wrote {len(infrastructure_signals)} pending infrastructure signals "
        f"({verified_count} verified) to {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
