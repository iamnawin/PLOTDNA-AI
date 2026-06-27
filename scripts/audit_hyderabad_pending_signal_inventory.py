"""Build source inventory for Hyderabad pending scoring signals.

This file identifies the official/source-of-record path for each signal type.
It does not extract values, assign scores, or promote pending cells.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
CITY_DIR = REPO_ROOT / "data" / "cities" / "hyderabad"
PENDING_SOURCES_PATH = CITY_DIR / "pending-context-sources.json"
PENDING_PRICE_SIGNALS_PATH = CITY_DIR / "pending-price-signals.json"
PENDING_INFRASTRUCTURE_SIGNALS_PATH = CITY_DIR / "pending-infrastructure-signals.json"
OUTPUT_PATH = CITY_DIR / "pending-signal-inventory.json"
GENERATED_AT = "2026-06-27"

REQUIRED_SIGNALS = [
    "price_band",
    "rera_activity",
    "infrastructure",
    "satellite_growth",
    "employment",
    "government_scheme",
]

SIGNAL_SOURCE_CATALOG: dict[str, dict[str, str]] = {
    "price_band": {
        "label": "Price band",
        "sourceName": "Telangana Registration Market Value Search",
        "sourceUrl": "https://registration.telangana.gov.in/UnitRateMV/getDistrictList.htm",
        "verificationMethod": "Match district, mandal, village or locality to non-agricultural land/apartment unit-rate records.",
    },
    "rera_activity": {
        "label": "RERA activity",
        "sourceName": "Telangana RERA registered projects and agents",
        "sourceUrl": "https://rera.telangana.gov.in/",
        "verificationMethod": "Match registered projects to the exact village/locality and count active project density.",
    },
    "infrastructure": {
        "label": "Infrastructure",
        "sourceName": "HMDA master planning and project references",
        "sourceUrl": "https://www.hmda.gov.in/master-planning-2031/",
        "verificationMethod": "Attach area-specific road, metro, RRR, ORR, master-plan, or public project evidence.",
    },
    "satellite_growth": {
        "label": "Satellite growth",
        "sourceName": "Time-series settlement or land-use observation",
        "sourceUrl": "https://tgrac.telangana.gov.in/",
        "verificationMethod": "Compare dated imagery or authoritative land-use layers for built-up growth in the exact area.",
    },
    "employment": {
        "label": "Employment",
        "sourceName": "Official industrial, IT, logistics, airport, or institutional project references",
        "sourceUrl": "https://www.hmda.gov.in/",
        "verificationMethod": "Attach exact-area employment anchor evidence rather than borrowing from nearby scored markets.",
    },
    "government_scheme": {
        "label": "Government scheme",
        "sourceName": "HMDA, MAUD, and Telangana government development notifications",
        "sourceUrl": "https://www.hmda.gov.in/planning-2/",
        "verificationMethod": "Attach exact-area scheme, notification, layout, or public investment evidence.",
    },
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_signal_status(
    signal_key: str,
    row: dict[str, Any],
    price_signal: dict[str, Any] | None,
    infrastructure_signal: dict[str, Any] | None,
) -> dict[str, Any]:
    match = (row.get("officialMatches") or [{}])[0]
    catalog = SIGNAL_SOURCE_CATALOG[signal_key]
    if signal_key == "price_band" and price_signal and price_signal.get("status") == "verified":
        return {
            "status": "verified",
            "label": catalog["label"],
            "sourceName": price_signal.get("sourceName"),
            "sourceUrl": price_signal.get("sourceUrl"),
            "verificationMethod": "Matched Telangana Registration unit-rate rows to the exact official village/mandal/district.",
            "summary": price_signal.get("summary"),
            "nextAction": "Keep blocked until the other required scoring signals are verified.",
        }
    if signal_key == "infrastructure" and infrastructure_signal and infrastructure_signal.get("status") == "verified":
        return {
            "status": "verified",
            "label": catalog["label"],
            "sourceName": infrastructure_signal.get("sourceName"),
            "sourceUrl": infrastructure_signal.get("sourceUrl"),
            "verificationMethod": "Matched HMDA RRR Annexure B village and mandal rows to the exact official village/mandal.",
            "summary": infrastructure_signal.get("summary"),
            "nextAction": "Keep blocked until the other required scoring signals are verified.",
        }
    return {
        "status": "source_identified",
        "label": catalog["label"],
        "sourceName": catalog["sourceName"],
        "sourceUrl": catalog["sourceUrl"],
        "verificationMethod": catalog["verificationMethod"],
        "areaJoinBasis": {
            "villageName": match.get("villageName"),
            "mandalName": match.get("mandalName"),
            "districtName": match.get("districtName"),
            "sourceKey": match.get("sourceKey"),
        },
        "nextAction": "Extract and verify exact-area signal values before scoring this pending polygon.",
    }


def main() -> None:
    pending_sources = load_json(PENDING_SOURCES_PATH)
    pending_price_signals = load_json(PENDING_PRICE_SIGNALS_PATH)
    pending_infrastructure_signals = load_json(PENDING_INFRASTRUCTURE_SIGNALS_PATH)
    price_signal_by_slug = {
        row["slug"]: row for row in pending_price_signals["priceSignals"]
    }
    infrastructure_signal_by_slug = {
        row["slug"]: row for row in pending_infrastructure_signals["infrastructureSignals"]
    }
    area_inventories = []
    for row in pending_sources["sourceAudits"]:
        signals = {
            key: build_signal_status(
                key,
                row,
                price_signal_by_slug.get(row["slug"]),
                infrastructure_signal_by_slug.get(row["slug"]),
            )
            for key in REQUIRED_SIGNALS
        }
        signal_deck_ready = all(signal["status"] == "verified" for signal in signals.values())
        area_inventories.append(
            {
                "slug": row["slug"],
                "name": row["name"],
                "sourceStatus": row["status"],
                "officialSourceKey": (row.get("officialMatches") or [{}])[0].get("sourceKey"),
                "officialMatchLabel": " / ".join(
                    value
                    for value in [
                        (row.get("officialMatches") or [{}])[0].get("villageName"),
                        (row.get("officialMatches") or [{}])[0].get("mandalName"),
                        (row.get("officialMatches") or [{}])[0].get("districtName"),
                    ]
                    if value
                ),
                "signalDeckReady": signal_deck_ready,
                "signals": signals,
                "nextAction": "Build an exact-area signal deck from these identified sources; do not substitute nearby scored-market data.",
            }
        )

    area_inventories.sort(key=lambda item: (item["signalDeckReady"], item["name"], item["slug"]))
    ready_count = sum(1 for item in area_inventories if item["signalDeckReady"])
    payload = {
        "schemaVersion": 1,
        "generatedAt": GENERATED_AT,
        "citySlug": "hyderabad",
        "purpose": "source inventory for exact-area scoring signals required before pending Hyderabad polygons can be promoted",
        "requiredSignals": REQUIRED_SIGNALS,
        "signalPolicy": "source_identified is not score evidence; only verified exact-area signal decks can unlock promotion.",
        "summary": {
            "pendingContextCellCount": len(area_inventories),
            "signalDeckReadyCount": ready_count,
            "sourceIdentifiedSignalCount": sum(
                1
                for item in area_inventories
                for signal in item["signals"].values()
                if signal["status"] == "source_identified"
            ),
            "verifiedSignalCount": sum(
                1
                for item in area_inventories
                for signal in item["signals"].values()
                if signal["status"] == "verified"
            ),
        },
        "areaInventories": area_inventories,
    }
    write_json(OUTPUT_PATH, payload)
    print(
        f"Wrote {len(area_inventories)} Hyderabad pending signal inventories "
        f"({ready_count} ready) to {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
