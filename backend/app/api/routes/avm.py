"""
AVM route — GET /api/v1/avm/{country}/{area_slug}

Automated Valuation Model: parses the static price_range string from
AREA_DATA, applies India RE assumptions for yield / payback, and builds
a 5-year price projection using the area's YoY growth with gentle decay.
"""
import re
from fastapi import APIRouter

from app.api.routes.verdict import AREA_DATA

router = APIRouter()

# India RE constants
_GROSS_YIELD_PCT = 2.8          # typical gross rental yield in Indian metros
_AREA_SQFT_ASSUMPTION = 1000    # default plot size used for "total value" display
_PROJECTION_DECAY = 0.88        # each year YoY shrinks to 88% of the prior year's rate


def _parse_price_range(price_range: str) -> tuple[int, int]:
    """
    Parse strings like:
      "Rs7,500-11,000/sqft"   → (7500, 11000)
      "Rs25,000-45,000/sqft"  → (25000, 45000)
    Returns (low, high) as integers.
    """
    nums = re.findall(r"[\d,]+", price_range)
    if len(nums) >= 2:
        low  = int(nums[0].replace(",", ""))
        high = int(nums[1].replace(",", ""))
        return low, high
    if len(nums) == 1:
        v = int(nums[0].replace(",", ""))
        return v, v
    return 5000, 8000   # safe fallback


def _build_projection(base_value: int, yoy_pct: float, years: int = 5) -> list[dict]:
    """
    Project price per sqft over `years` years.
    YoY decays by _PROJECTION_DECAY each year to model mean-reversion.
    """
    current_year = 2025
    projection = []
    val = float(base_value)
    rate = yoy_pct / 100.0
    for i in range(years):
        val = val * (1 + rate)
        rate *= _PROJECTION_DECAY
        projection.append({"year": current_year + i + 1, "value": round(val)})
    return projection


@router.get("/{country}/{area_slug}")
def get_avm(country: str, area_slug: str):
    area = AREA_DATA.get(area_slug) or {
        "name": area_slug.replace("-", " ").title(),
        "price_range": "Rs4,000-7,000/sqft",
        "yoy": 12.0,
        "score": 50,
    }

    price_range: str = area.get("price_range", "Rs4,000-7,000/sqft")
    yoy: float = area.get("yoy", 12.0)

    low, high = _parse_price_range(price_range)
    mid = (low + high) // 2

    gross_yield = _GROSS_YIELD_PCT
    payback_years = round(100.0 / gross_yield, 1)

    five_year_projection = _build_projection(mid, yoy)

    return {
        "estimated_value_per_sqft": mid,
        "confidence_low": low,
        "confidence_high": high,
        "gross_yield_pct": gross_yield,
        "payback_years": payback_years,
        "currency": "INR",
        "area_sqft_assumption": _AREA_SQFT_ASSUMPTION,
        "five_year_projection": five_year_projection,
        "model": "Static-regression AVM v1 · India RE",
    }
