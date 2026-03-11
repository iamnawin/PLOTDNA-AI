"""
Dubai Land Department (DLD) — Open Data Client
Source: data.gov.ae / Dubai Pulse
Fetches real transaction prices for UAE areas.

API: https://gateway.data.gov.ae/datasets/dld_transactions (free, open data)
Cache: 24h in-memory per area name (AED prices don't move that fast)
"""
import time
import logging
from dataclasses import dataclass, field, asdict
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Data models ────────────────────────────────────────────────────────────────

@dataclass
class DLDTransaction:
    date: str
    price_per_sqft_aed: float
    total_price_aed: float
    property_type: str            # "Apartment" | "Villa" | "Land" | "Office"
    area_sqft: float
    area_name: str


@dataclass
class DLDAreaData:
    area: str
    currency: str = "AED"
    transactions: list[DLDTransaction] = field(default_factory=list)
    median_price_aed_sqft: Optional[float] = None
    avg_price_aed_sqft: Optional[float] = None
    total_transactions_30d: int = 0
    price_trend_3m: Optional[str] = None   # e.g. "+8.2%" or "-1.5%"
    last_updated: str = ""
    error: Optional[str] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["transactions"] = [asdict(t) for t in self.transactions]
        return d


# ── Cache ──────────────────────────────────────────────────────────────────────

_cache: dict[str, tuple[DLDAreaData, float]] = {}
CACHE_TTL = 24 * 3600   # 24 hours


def _cache_key(area: str) -> str:
    return f"dld:{area.lower().replace(' ', '_')}"


def _get_cached(area: str) -> Optional[DLDAreaData]:
    entry = _cache.get(_cache_key(area))
    if entry and time.time() < entry[1]:
        return entry[0]
    return None


def _set_cached(area: str, data: DLDAreaData):
    _cache[_cache_key(area)] = (data, time.time() + CACHE_TTL)


# ── Dubai Open Data API ────────────────────────────────────────────────────────

# data.gov.ae DLD Transactions dataset
_DLD_BASE_URL = "https://gateway.data.gov.ae/api/v1"
_DLD_DATASET_ID = "dld_transactions_2024"   # adjust to current year dataset


def _build_dld_url(area_name: str, limit: int = 50) -> str:
    """Build Dubai Open Data API URL. Requires DLD_API_KEY."""
    encoded_area = area_name.replace(" ", "%20")
    return (
        f"{_DLD_BASE_URL}/datasets/{_DLD_DATASET_ID}/records"
        f"?filters=area_en:{encoded_area}"
        f"&limit={limit}"
        f"&sort=transaction_date:desc"
    )


def _parse_dld_records(records: list[dict], area_name: str) -> DLDAreaData:
    transactions = []
    prices_per_sqft = []

    for rec in records:
        try:
            sqft = float(rec.get("area_sqm", 0)) * 10.764   # m² → sqft
            total_aed = float(rec.get("actual_worth", 0))
            ppsf = round(total_aed / sqft, 2) if sqft > 0 else 0

            tx = DLDTransaction(
                date=rec.get("transaction_date", "")[:10],
                price_per_sqft_aed=ppsf,
                total_price_aed=total_aed,
                property_type=rec.get("property_type_en", "Unknown"),
                area_sqft=round(sqft, 1),
                area_name=area_name,
            )
            transactions.append(tx)
            if ppsf > 0:
                prices_per_sqft.append(ppsf)
        except (ValueError, ZeroDivisionError):
            continue

    prices_per_sqft.sort()
    median = prices_per_sqft[len(prices_per_sqft) // 2] if prices_per_sqft else None
    avg = round(sum(prices_per_sqft) / len(prices_per_sqft), 2) if prices_per_sqft else None

    from datetime import datetime, timezone
    return DLDAreaData(
        area=area_name,
        transactions=transactions[:20],       # cap at 20 for response size
        median_price_aed_sqft=median,
        avg_price_aed_sqft=avg,
        total_transactions_30d=len(transactions),
        last_updated=datetime.now(timezone.utc).isoformat(),
    )


# ── Public API ─────────────────────────────────────────────────────────────────

async def get_area_transactions(area_name: str) -> DLDAreaData:
    """
    Fetch recent DLD transactions for a Dubai area.

    Args:
        area_name: Dubai area name (e.g. "Business Bay", "Downtown Dubai")

    Returns:
        DLDAreaData with transactions + median price
    """
    cached = _get_cached(area_name)
    if cached:
        logger.debug("DLD cache hit for: %s", area_name)
        return cached

    if not settings.DLD_API_KEY:
        logger.warning("DLD_API_KEY not set — returning mock data")
        mock = _mock_dld_data(area_name)
        _set_cached(area_name, mock)
        return mock

    url = _build_dld_url(area_name)
    headers = {"api-key": settings.DLD_API_KEY}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        records = data.get("records", data.get("results", []))
        result = _parse_dld_records(records, area_name)
        _set_cached(area_name, result)
        logger.info("DLD: fetched %d transactions for %s", len(records), area_name)
        return result

    except httpx.HTTPStatusError as exc:
        logger.error("DLD API HTTP error %s for %s: %s", exc.response.status_code, area_name, exc)
        fallback = DLDAreaData(area=area_name, error=f"DLD API error: {exc.response.status_code}")
        return fallback
    except Exception as exc:
        logger.error("DLD API failed for %s: %s", area_name, exc)
        fallback = DLDAreaData(area=area_name, error=str(exc))
        return fallback


def _mock_dld_data(area_name: str) -> DLDAreaData:
    """Mock data when DLD_API_KEY is not configured — for dev/testing."""
    from datetime import datetime, timezone

    mock_prices = {
        "business bay": (2100, 2250),
        "downtown dubai": (3200, 3500),
        "jumeirah village circle": (1100, 1250),
        "dubai hills": (1800, 2000),
        "palm jumeirah": (4000, 4500),
    }
    key = area_name.lower()
    low, high = mock_prices.get(key, (1500, 1800))
    median = (low + high) / 2

    return DLDAreaData(
        area=area_name,
        transactions=[
            DLDTransaction(
                date="2026-03-10",
                price_per_sqft_aed=median,
                total_price_aed=median * 850,
                property_type="Apartment",
                area_sqft=850,
                area_name=area_name,
            )
        ],
        median_price_aed_sqft=median,
        avg_price_aed_sqft=median,
        total_transactions_30d=42,
        price_trend_3m="+6.2%",
        last_updated=datetime.now(timezone.utc).isoformat(),
    )
