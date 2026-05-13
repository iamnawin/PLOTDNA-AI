"""
Automated Valuation Model (AVM) — Phase 2
Predictive property valuation using regression inputs.

Formula:
  Value = β0 + β1(Area) + β2(Proximity_to_IT) + β3(Infrastructure_Growth) + ε

Extended with connectivity, legal risk, and AI sentiment signals.
"""
import logging
from dataclasses import dataclass, asdict
from typing import Optional

logger = logging.getLogger(__name__)


# ── Regression coefficients (India, calibrated on Hyderabad/Bangalore data) ───
# These will be replaced with actual ML-fitted weights in Phase 3.

INDIA_COEFFICIENTS = {
    "base_price_per_sqft": 4000,        # ₹/sqft base for Tier 2 city
    "area_sqft_bonus": 0.8,             # larger plots → lower per-sqft price
    "it_proximity_km_coeff": -250,      # per km closer to IT hub → +₹250/sqft
    "metro_proximity_km_coeff": -180,   # per km closer to metro → +₹180/sqft
    "highway_proximity_km_coeff": -80,
    "infra_score_coeff": 35,            # per point of infra score → +₹35/sqft
    "rera_penalty": -800,               # no RERA → -₹800/sqft
    "litigation_penalty": -1500,        # litigation on record → -₹1500/sqft
    "agricultural_penalty": -2000,      # agricultural land → big discount
}

UAE_COEFFICIENTS = {
    "base_price_per_sqft_aed": 800,     # AED/sqft base for UAE secondary market
    "it_proximity_km_coeff": -80,
    "metro_proximity_km_coeff": -120,
    "infra_score_coeff": 15,
    "dld_registered_bonus": 200,        # DLD-verified transaction → premium
}

# Yield coefficients
GROSS_YIELD_BY_CITY = {
    "hyderabad": 4.5, "bangalore": 4.2, "mumbai": 3.8,
    "pune": 4.8, "chennai": 4.3, "delhi": 3.5,
    "dubai": 6.5, "abu dhabi": 5.8,
}


# ── Data models ────────────────────────────────────────────────────────────────

@dataclass
class AVMResult:
    country: str
    currency: str
    city: str

    # Core valuation
    estimated_price_per_sqft: float
    estimated_total_value: float
    valuation_range_low: float
    valuation_range_high: float

    # Yield
    gross_yield_pct: float
    annual_rental_income: float
    payback_years: float

    # 5-year projection
    projected_value_5yr: float
    projected_cagr_pct: float

    # Inputs used
    area_sqft: float
    phase2_score: int
    confidence: str     # "high" | "medium" | "low"

    # Breakdown
    adjustment_factors: dict = None

    def __post_init__(self):
        if self.adjustment_factors is None:
            self.adjustment_factors = {}

    def to_dict(self) -> dict:
        return asdict(self)


# ── AVM computation ────────────────────────────────────────────────────────────

def compute_avm(
    country: str,
    city: str,
    area_sqft: float,
    phase2_score: int,

    # Spatial inputs (from spatial_verifier)
    it_park_dist_m: Optional[float] = None,       # metres to nearest IT park
    metro_dist_m: Optional[float] = None,          # metres to nearest metro
    highway_dist_m: Optional[float] = None,

    # Legal inputs (from api_setu_client / spatial_verifier)
    has_rera: bool = True,
    litigation: bool = False,
    is_agricultural: bool = False,

    # Market inputs
    market_price_sqft: Optional[float] = None,    # known market price (anchor)
    yoy_growth_pct: float = 8.0,
) -> AVMResult:
    """
    Compute Automated Valuation for a plot.

    Args:
        country: "India" | "UAE"
        city: City name (lowercase for yield lookup)
        area_sqft: Plot carpet/built-up area in sqft
        phase2_score: Phase 2 DNA score (0-100)
        it_park_dist_m: Distance to nearest IT park in metres
        metro_dist_m: Distance to nearest metro in metres
        highway_dist_m: Distance to nearest highway in metres
        has_rera: RERA registration confirmed
        litigation: Active litigation on land record
        is_agricultural: Land classified as agricultural
        market_price_sqft: Anchor price from DLD/market data (overrides regression if provided)
        yoy_growth_pct: Historical YoY price growth

    Returns:
        AVMResult with valuation range + yield estimates
    """
    currency = "INR" if country == "India" else "AED"
    city_lower = city.lower()

    if country == "India":
        result = _compute_india_avm(
            city_lower, area_sqft, phase2_score,
            it_park_dist_m, metro_dist_m, highway_dist_m,
            has_rera, litigation, is_agricultural,
            market_price_sqft, yoy_growth_pct,
        )
    else:
        result = _compute_uae_avm(
            city_lower, area_sqft, phase2_score,
            metro_dist_m, market_price_sqft, yoy_growth_pct,
        )

    return result


def _compute_india_avm(city, area_sqft, phase2_score, it_km, metro_km,
                        highway_km, has_rera, litigation, is_agricultural,
                        market_anchor, yoy_pct) -> AVMResult:
    c = INDIA_COEFFICIENTS

    # City base price adjustment
    city_multipliers = {
        "mumbai": 3.5, "bangalore": 2.2, "hyderabad": 1.5,
        "pune": 1.8, "chennai": 1.6, "delhi": 2.8,
    }
    base = c["base_price_per_sqft"] * city_multipliers.get(city, 1.5)

    adjustments = {}

    # Proximity adjustments (convert m to km)
    if it_km is not None:
        adj = c["it_proximity_km_coeff"] * (it_km / 1000)
        base += adj
        adjustments["it_park_proximity"] = round(adj, 0)

    if metro_km is not None:
        adj = c["metro_proximity_km_coeff"] * (metro_km / 1000)
        base += adj
        adjustments["metro_proximity"] = round(adj, 0)

    if highway_km is not None:
        adj = c["highway_proximity_km_coeff"] * (highway_km / 1000)
        base += adj
        adjustments["highway_proximity"] = round(adj, 0)

    # Score adjustment
    score_adj = c["infra_score_coeff"] * (phase2_score - 50)
    base += score_adj
    adjustments["phase2_score_signal"] = round(score_adj, 0)

    # Legal adjustments
    if not has_rera:
        base += c["rera_penalty"]
        adjustments["no_rera_penalty"] = c["rera_penalty"]

    if litigation:
        base += c["litigation_penalty"]
        adjustments["litigation_penalty"] = c["litigation_penalty"]

    if is_agricultural:
        base += c["agricultural_penalty"]
        adjustments["agricultural_land_penalty"] = c["agricultural_penalty"]

    ppsf = max(2000, base)

    # If market anchor exists, blend (50/50 regression vs market)
    if market_anchor:
        ppsf = (ppsf + market_anchor) / 2
        adjustments["market_anchor_blend"] = market_anchor

    total_value = round(ppsf * area_sqft)
    gross_yield = GROSS_YIELD_BY_CITY.get(city, 4.5)
    annual_rental = round(total_value * (gross_yield / 100))
    payback = round(total_value / annual_rental, 1) if annual_rental > 0 else 0

    cagr = min(yoy_pct, 20.0)
    projected_5yr = round(total_value * ((1 + cagr / 100) ** 5))

    confidence = "high" if market_anchor and not litigation and has_rera else \
                 "medium" if not litigation else "low"

    return AVMResult(
        country="India", currency="INR", city=city.title(),
        estimated_price_per_sqft=round(ppsf, 0),
        estimated_total_value=total_value,
        valuation_range_low=round(total_value * 0.90),
        valuation_range_high=round(total_value * 1.12),
        gross_yield_pct=gross_yield,
        annual_rental_income=annual_rental,
        payback_years=payback,
        projected_value_5yr=projected_5yr,
        projected_cagr_pct=cagr,
        area_sqft=area_sqft,
        phase2_score=phase2_score,
        confidence=confidence,
        adjustment_factors=adjustments,
    )


def _compute_uae_avm(city, area_sqft, phase2_score, metro_km,
                      market_anchor, yoy_pct) -> AVMResult:
    c = UAE_COEFFICIENTS

    zone_base = {
        "dubai": 1000, "abu dhabi": 850, "sharjah": 550,
    }
    base = zone_base.get(city, 900)

    adjustments = {}
    if metro_km is not None:
        adj = c["metro_proximity_km_coeff"] * (metro_km / 1000)
        base += adj
        adjustments["metro_proximity"] = round(adj, 0)

    score_adj = c["infra_score_coeff"] * (phase2_score - 50)
    base += score_adj
    adjustments["phase2_score_signal"] = round(score_adj, 0)

    ppsf = max(500, base)
    if market_anchor:
        ppsf = (ppsf + market_anchor) / 2
        adjustments["dld_market_anchor"] = market_anchor

    total_value = round(ppsf * area_sqft)
    gross_yield = GROSS_YIELD_BY_CITY.get(city, 6.0)
    annual_rental = round(total_value * (gross_yield / 100))
    payback = round(total_value / annual_rental, 1) if annual_rental > 0 else 0

    cagr = min(yoy_pct, 15.0)
    projected_5yr = round(total_value * ((1 + cagr / 100) ** 5))

    return AVMResult(
        country="UAE", currency="AED", city=city.title(),
        estimated_price_per_sqft=round(ppsf, 0),
        estimated_total_value=total_value,
        valuation_range_low=round(total_value * 0.92),
        valuation_range_high=round(total_value * 1.10),
        gross_yield_pct=gross_yield,
        annual_rental_income=annual_rental,
        payback_years=payback,
        projected_value_5yr=projected_5yr,
        projected_cagr_pct=cagr,
        area_sqft=area_sqft,
        phase2_score=phase2_score,
        confidence="high" if market_anchor else "medium",
        adjustment_factors=adjustments,
    )
