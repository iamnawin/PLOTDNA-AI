"""Compile Hyderabad pending-cell promotion readiness from verified evidence decks.

This script does not score or promote polygons. It creates a review report that
lists which pending context cells have complete evidence and which signal decks
still block promotion.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
CITY_DIR = REPO_ROOT / "data" / "cities" / "hyderabad"

PENDING_SOURCES_PATH = CITY_DIR / "pending-context-sources.json"
PENDING_SIGNAL_INVENTORY_PATH = CITY_DIR / "pending-signal-inventory.json"
PENDING_SCORING_READINESS_PATH = CITY_DIR / "pending-scoring-readiness.json"
OUTPUT_PATH = CITY_DIR / "pending-promotion-report.json"

GENERATED_AT = "2026-07-03"
REQUIRED_EVIDENCE = [
    "official_boundary",
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


def verified_signal_summary(evidence: dict[str, Any]) -> dict[str, list[str]]:
    verified = [
        key
        for key in REQUIRED_EVIDENCE
        if (evidence.get(key) or {}).get("status") == "verified"
    ]
    missing = [key for key in REQUIRED_EVIDENCE if key not in verified]
    return {"verified": verified, "missing": missing}


def main() -> None:
    pending_sources = load_json(PENDING_SOURCES_PATH)
    signal_inventory = load_json(PENDING_SIGNAL_INVENTORY_PATH)
    scoring_readiness = load_json(PENDING_SCORING_READINESS_PATH)

    source_by_slug = {row["slug"]: row for row in pending_sources["sourceAudits"]}
    inventory_by_slug = {row["slug"]: row for row in signal_inventory["areaInventories"]}

    promotion_rows = []
    for audit in scoring_readiness["areaAudits"]:
        source = source_by_slug.get(audit["slug"])
        inventory = inventory_by_slug.get(audit["slug"])
        if not source or not inventory:
            raise SystemExit(f"Missing source or signal inventory row for {audit['slug']}")

        summary = verified_signal_summary(audit["evidence"])
        promotion_ready = len(summary["missing"]) == 0
        if promotion_ready != bool(audit.get("promotionReady")):
            raise SystemExit(f"Promotion readiness mismatch for {audit['slug']}")
        if promotion_ready and not inventory.get("signalDeckReady"):
            raise SystemExit(f"Signal deck mismatch for promotion-ready row {audit['slug']}")

        promotion_rows.append(
            {
                "slug": audit["slug"],
                "name": audit["name"],
                "officialMatchLabel": audit.get("officialMatchLabel"),
                "promotionReady": promotion_ready,
                "verifiedEvidenceCount": len(summary["verified"]),
                "missingEvidenceCount": len(summary["missing"]),
                "verifiedEvidence": summary["verified"],
                "missingEvidence": summary["missing"],
                "nextAction": (
                    "Review exact-area signal values and create a scored MicroMarket entry."
                    if promotion_ready
                    else "Keep blocked; do not assign a PlotDNA score until every missing evidence deck is verified."
                ),
            }
        )

    promotion_rows.sort(
        key=lambda row: (
            not row["promotionReady"],
            row["missingEvidenceCount"],
            row["name"],
            row["slug"],
        )
    )
    promotion_ready_rows = [row for row in promotion_rows if row["promotionReady"]]
    missing_counts = {
        key: sum(1 for row in promotion_rows if key in row["missingEvidence"])
        for key in REQUIRED_EVIDENCE
    }
    verified_counts = {
        key: sum(1 for row in promotion_rows if key in row["verifiedEvidence"])
        for key in REQUIRED_EVIDENCE
    }
    next_best_rows = [
        row
        for row in promotion_rows
        if not row["promotionReady"] and row["verifiedEvidenceCount"] > 1
    ][:10]

    report = {
        "schemaVersion": 1,
        "generatedAt": GENERATED_AT,
        "citySlug": "hyderabad",
        "purpose": "promotion review report for Hyderabad pending context cells",
        "promotionPolicy": "Promote only rows with every required evidence item verified; this report never assigns scores.",
        "requiredEvidence": REQUIRED_EVIDENCE,
        "summary": {
            "pendingContextCellCount": len(promotion_rows),
            "promotionReadyCount": len(promotion_ready_rows),
            "blockedCount": len(promotion_rows) - len(promotion_ready_rows),
            "verifiedEvidenceCounts": verified_counts,
            "missingEvidenceCounts": missing_counts,
        },
        "promotionReadyRows": promotion_ready_rows,
        "nextBestEvidenceRows": next_best_rows,
        "areaPromotionRows": promotion_rows,
    }
    write_json(OUTPUT_PATH, report)
    print(
        "Hyderabad pending promotion report written: "
        f"{len(promotion_ready_rows)} ready, {report['summary']['blockedCount']} blocked."
    )


if __name__ == "__main__":
    main()
