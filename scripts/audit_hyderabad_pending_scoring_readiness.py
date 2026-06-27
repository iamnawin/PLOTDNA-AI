"""Build scoring-readiness audit for Hyderabad data-pending context cells.

This does not score or promote any pending area. It records the minimum evidence
required before a pending context cell can become a scored PlotDNA market.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
CITY_DIR = REPO_ROOT / "data" / "cities" / "hyderabad"
PENDING_SOURCES_PATH = CITY_DIR / "pending-context-sources.json"
PENDING_SIGNAL_INVENTORY_PATH = CITY_DIR / "pending-signal-inventory.json"
OUTPUT_PATH = CITY_DIR / "pending-scoring-readiness.json"
GENERATED_AT = "2026-06-27"

REQUIRED_SIGNAL_EVIDENCE = [
    "price_band",
    "rera_activity",
    "infrastructure",
    "satellite_growth",
    "employment",
    "government_scheme",
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_pending_evidence(row: dict[str, Any], signal_inventory: dict[str, Any] | None) -> dict[str, Any]:
    match = (row.get("officialMatches") or [{}])[0]
    official_boundary_verified = bool(match.get("sourceKey"))
    evidence = {
        "official_boundary": {
            "status": "verified" if official_boundary_verified else "missing",
            "sourceKey": match.get("sourceKey"),
            "sourceName": match.get("sourceLayer"),
            "sourceUrl": match.get("sourceUrl"),
        }
    }
    for key in REQUIRED_SIGNAL_EVIDENCE:
        signal = (signal_inventory or {}).get("signals", {}).get(key)
        if signal:
            evidence[key] = {
                "status": signal["status"],
                "sourceName": signal.get("sourceName"),
                "sourceUrl": signal.get("sourceUrl"),
                "verificationMethod": signal.get("verificationMethod"),
                "nextAction": signal.get("nextAction"),
            }
            continue
        evidence[key] = {
            "status": "missing",
            "nextAction": "Attach verified signal deck before assigning a PlotDNA score.",
        }
    return evidence


def main() -> None:
    pending_sources = load_json(PENDING_SOURCES_PATH)
    pending_signal_inventory = load_json(PENDING_SIGNAL_INVENTORY_PATH)
    signal_inventory_by_slug = {
        row["slug"]: row for row in pending_signal_inventory["areaInventories"]
    }
    area_audits = []
    for row in pending_sources["sourceAudits"]:
        evidence = build_pending_evidence(row, signal_inventory_by_slug.get(row["slug"]))
        promotion_ready = all(item["status"] == "verified" for item in evidence.values())
        missing_evidence = [
            key
            for key, item in evidence.items()
            if item["status"] != "verified"
        ]
        area_audits.append(
            {
                "slug": row["slug"],
                "name": row["name"],
                "sourceStatus": row["status"],
                "officialMatchLabel": " / ".join(
                    value
                    for value in [
                        (row.get("officialMatches") or [{}])[0].get("villageName"),
                        (row.get("officialMatches") or [{}])[0].get("mandalName"),
                        (row.get("officialMatches") or [{}])[0].get("districtName"),
                    ]
                    if value
                ),
                "promotionReady": promotion_ready,
                "missingEvidence": missing_evidence,
                "evidence": evidence,
                "nextAction": (
                    "Keep as data-pending until every required signal evidence item is verified."
                    if not promotion_ready
                    else "Ready for batch promotion review."
                ),
            }
        )

    area_audits.sort(key=lambda item: (item["promotionReady"], item["name"], item["slug"]))
    promotion_ready_count = sum(1 for item in area_audits if item["promotionReady"])
    payload = {
        "schemaVersion": 1,
        "generatedAt": GENERATED_AT,
        "citySlug": "hyderabad",
        "purpose": "minimum evidence gate before promoting data-pending Hyderabad context cells to scored market cells",
        "requiredEvidence": ["official_boundary", *REQUIRED_SIGNAL_EVIDENCE],
        "promotionPolicy": "Do not assign a PlotDNA score unless every required evidence item is verified for that exact area.",
        "summary": {
            "pendingContextCellCount": len(area_audits),
            "officialBoundaryReadyCount": sum(
                1 for item in area_audits if item["evidence"]["official_boundary"]["status"] == "verified"
            ),
            "promotionReadyCount": promotion_ready_count,
            "blockedByMissingSignalDeckCount": len(area_audits) - promotion_ready_count,
        },
        "areaAudits": area_audits,
    }
    write_json(OUTPUT_PATH, payload)
    print(
        f"Wrote {len(area_audits)} Hyderabad pending scoring-readiness rows "
        f"({promotion_ready_count} promotion-ready) to {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
