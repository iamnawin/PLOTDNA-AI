"""Fetch official Telangana Registration unit-rate rows for pending Hyderabad cells.

This verifies only the price_band signal. It does not assign a PlotDNA score or
promote any pending cell.
"""

from __future__ import annotations

import base64
import json
import re
import time
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urljoin
from urllib.request import HTTPCookieProcessor, Request, build_opener
from urllib.parse import urlencode


REPO_ROOT = Path(__file__).resolve().parents[1]
CITY_DIR = REPO_ROOT / "data" / "cities" / "hyderabad"
PENDING_SOURCES_PATH = CITY_DIR / "pending-context-sources.json"
OUTPUT_PATH = CITY_DIR / "pending-price-signals.json"
BASE_URL = "https://registration.telangana.gov.in"
ENTRY_URL = f"{BASE_URL}/UnitRateMV/getDistrictList.htm"
MANDAL_URL = f"{BASE_URL}/UnitRateMV/getMandalListByDistCode"
VILLAGE_URL = f"{BASE_URL}/UnitRateMV/getVillageListByDistCode"
UNIT_RATE_URL = f"{BASE_URL}/UnitRateMV/unitRateMV"
GENERATED_AT = "2026-06-27"


class DistrictOptionParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_district_select = False
        self.current_value: str | None = None
        self.options: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = dict(attrs)
        if tag == "select" and attr.get("id") == "districtCode":
            self.in_district_select = True
        if self.in_district_select and tag == "option":
            self.current_value = attr.get("value") or ""

    def handle_endtag(self, tag: str) -> None:
        if tag == "select" and self.in_district_select:
            self.in_district_select = False
        if tag == "option":
            self.current_value = None

    def handle_data(self, data: str) -> None:
        if self.in_district_select and self.current_value:
            name = data.strip()
            if name:
                self.options.append({"code": self.current_value, "name": name})


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def parse_code_name_pairs(value: str) -> list[dict[str, str]]:
    pairs = []
    for chunk in value.split("##"):
        if not chunk or "/" not in chunk:
            continue
        code, name = chunk.split("/", 1)
        pairs.append({"code": code.strip(), "name": name.strip()})
    return pairs


def request_text(opener: Any, url: str, data: dict[str, str] | None = None, method: str = "POST") -> str:
    encoded = urlencode(data).encode("utf-8") if data and method == "POST" else None
    if data and method == "GET":
        url = f"{url}?{urlencode(data)}"
    request = Request(
        url,
        data=encoded,
        headers={
            "User-Agent": "Mozilla/5.0 PlotDNA data validation",
            "Referer": ENTRY_URL,
        },
    )
    with opener.open(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def parse_unit_rate_records(html: str) -> list[dict[str, Any]]:
    records = []
    for row in re.findall(r"<tr.*?</tr>", html, flags=re.IGNORECASE | re.DOTALL):
        clean = re.sub(r"<[^>]+>", " | ", row)
        clean = re.sub(r"\s+", " ", unescape(clean)).strip(" |")
        if not re.search(r"\d{1,2}/\d{1,2}/\d{4}", clean):
            continue
        cells = [cell.strip() for cell in clean.split("|") if cell.strip()]
        numbers = [int(value.replace(",", "")) for value in re.findall(r"\b\d{1,3}(?:,\d{3})+\b|\b\d{4,6}\b", clean)]
        date_match = re.search(r"\d{1,2}/\d{1,2}/\d{4}", clean)
        classification = next((cell for cell in cells if "Residential" in cell or "Commercial" in cell), None)
        locality = next((cell for cell in cells if re.search(r"RESIDENTIAL|COMMERCIAL", cell, re.I)), None)
        if len(numbers) < 2 or not date_match:
            continue
        records.append(
            {
                "locality": locality,
                "landValuePerSqYard": numbers[-2],
                "apartmentValuePerSqft": numbers[-1],
                "classification": classification,
                "effectiveDate": date_match.group(0),
                "raw": clean[:400],
            }
        )
    return records


def summarize_records(records: list[dict[str, Any]]) -> dict[str, Any]:
    land_values = [record["landValuePerSqYard"] for record in records]
    apartment_values = [record["apartmentValuePerSqft"] for record in records]
    return {
        "recordCount": len(records),
        "landValueMinPerSqYard": min(land_values),
        "landValueMaxPerSqYard": max(land_values),
        "apartmentValueMinPerSqft": min(apartment_values),
        "apartmentValueMaxPerSqft": max(apartment_values),
        "effectiveDates": sorted({record["effectiveDate"] for record in records}),
    }


def fetch_unit_rates(opener: Any, district: dict[str, str], mandal: dict[str, str], village: dict[str, str]) -> list[dict[str, Any]]:
    payload = {
        "locName": "",
        "rValue": "U",
        "tFlag": "",
        "mndlName": mandal["name"],
        "vlgName": village["name"],
        "RateType": "U",
        "search_by": "L",
        "districtId": district["code"],
        "mandalCode": mandal["code"],
        "villageCode": village["code"],
    }
    payload["encodestr"] = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("ascii")
    html = request_text(opener, UNIT_RATE_URL, payload)
    if "Invalid inputs" in html or "igrsexception" in html:
        return []
    return parse_unit_rate_records(html)


def main() -> None:
    pending_sources = load_json(PENDING_SOURCES_PATH)
    opener = build_opener(HTTPCookieProcessor())
    entry_html = request_text(opener, ENTRY_URL)
    parser = DistrictOptionParser()
    parser.feed(entry_html)
    districts = {normalize(option["name"]): option for option in parser.options}

    mandal_cache: dict[str, list[dict[str, str]]] = {}
    village_cache: dict[tuple[str, str], list[dict[str, str]]] = {}
    price_signals = []

    for row in pending_sources["sourceAudits"]:
        match = (row.get("officialMatches") or [{}])[0]
        district = districts.get(normalize(match.get("districtName")))
        if not district:
            price_signals.append({"slug": row["slug"], "name": row["name"], "status": "missing", "reason": "district_not_found"})
            continue

        if district["code"] not in mandal_cache:
            mandal_cache[district["code"]] = parse_code_name_pairs(
                request_text(opener, MANDAL_URL, {"districtcode": district["code"]}, method="GET")
            )
        mandal = next((item for item in mandal_cache[district["code"]] if normalize(item["name"]) == normalize(match.get("mandalName"))), None)
        if not mandal:
            price_signals.append({"slug": row["slug"], "name": row["name"], "status": "missing", "reason": "mandal_not_found"})
            continue

        village_key = (district["code"], mandal["code"])
        if village_key not in village_cache:
            village_cache[village_key] = parse_code_name_pairs(
                request_text(opener, VILLAGE_URL, {"districtcode": district["code"], "mandalcode": mandal["code"], "sType": "U"}, method="GET")
            )
        village = next((item for item in village_cache[village_key] if normalize(item["name"]) == normalize(match.get("villageName"))), None)
        if not village:
            price_signals.append({"slug": row["slug"], "name": row["name"], "status": "missing", "reason": "village_not_found"})
            continue

        time.sleep(0.08)
        records = fetch_unit_rates(opener, district, mandal, village)
        if not records:
            price_signals.append({"slug": row["slug"], "name": row["name"], "status": "missing", "reason": "unit_rate_rows_not_found"})
            continue

        price_signals.append(
            {
                "slug": row["slug"],
                "name": row["name"],
                "status": "verified",
                "sourceName": "Telangana Registration Market Value Search",
                "sourceUrl": UNIT_RATE_URL,
                "officialMatch": {
                    "villageName": match.get("villageName"),
                    "mandalName": match.get("mandalName"),
                    "districtName": match.get("districtName"),
                    "districtCode": district["code"],
                    "mandalCode": mandal["code"],
                    "villageCode": village["code"],
                },
                "summary": summarize_records(records),
                "records": records[:25],
            }
        )

    verified_count = sum(1 for signal in price_signals if signal["status"] == "verified")
    payload = {
        "schemaVersion": 1,
        "generatedAt": GENERATED_AT,
        "citySlug": "hyderabad",
        "purpose": "official exact-area price-band evidence for Hyderabad pending context cells",
        "sourcePolicy": "Use as price_band evidence only; it does not verify RERA, infrastructure, satellite, employment, or government-scheme signals.",
        "summary": {
            "pendingContextCellCount": len(price_signals),
            "verifiedPriceSignalCount": verified_count,
            "missingPriceSignalCount": len(price_signals) - verified_count,
        },
        "priceSignals": price_signals,
    }
    write_json(OUTPUT_PATH, payload)
    print(f"Wrote {len(price_signals)} pending price signals ({verified_count} verified) to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
