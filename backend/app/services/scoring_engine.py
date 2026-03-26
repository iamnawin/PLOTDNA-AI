"""
DNA scoring engine — converts raw OSM signal counts into normalized
0-100 signals and computes the weighted PlotDNA score.

Same weights as the frontend (see frontend/src/lib/utils.ts SIGNAL_WEIGHTS).
Normalization uses log scale so a sparse area isn't unfairly penalized.
"""
import math
from dataclasses import dataclass, field


# ── Normalization caps (empirically tuned for Indian urban context) ──────────
# At cap count → signal = 100. Lower counts scale log-smoothly from 0.
CAPS = {
    "transit":      6,    # metro+rail nodes; Ameerpet/MGBS has ~8, suburbs have 0-2
    "roads":       10,    # major road segments; busy junction has 10+, peripheral has 1-2
    "airport":      1,    # binary: 1 airport = full bonus
    "hospitals":   12,    # dense urban has 15+, suburban 2-5
    "education":   20,    # schools + colleges within 2km
    "shopping":     8,    # malls, markets
    "offices":     40,    # commercial buildings / landuse ways
    "it_offices":  10,    # IT-tagged offices
    "residential": 25,    # apartment buildings (density proxy)
    "construction":12,    # active construction sites
}

# DNA signal weights — must sum to 1.0 (matches frontend SIGNAL_WEIGHTS)
WEIGHTS = {
    "infrastructure": 0.25,
    "population":     0.20,
    "satellite":      0.20,
    "rera":           0.15,
    "employment":     0.10,
    "priceVelocity":  0.05,
    "govtScheme":     0.05,
}


@dataclass
class DNASignals:
    infrastructure: int = 0
    population:     int = 0
    satellite:      int = 0
    rera:           int = 0
    employment:     int = 0
    priceVelocity:  int = 0
    govtScheme:     int = 0


@dataclass
class DNAResult:
    score:      int
    signals:    DNASignals
    highlights: list[str] = field(default_factory=list)
    confidence: str = "Low"
    raw_counts: dict = field(default_factory=dict)


def _norm(count: float, cap: float) -> int:
    """Log-scale normalize to 0-100. 0 count → 0, cap count → ~100."""
    if count <= 0:
        return 0
    return min(100, round(100 * math.log1p(count) / math.log1p(cap)))


def compute_from_osm(counts: dict) -> DNAResult:
    """
    Convert raw OSM element counts into a DNA score and signal breakdown.
    """
    # ── Infrastructure (25%) ──────────────────────────────────────────────────
    # Weighted composite: transit (50%) + roads (30%) + hospital coverage (20%)
    # Airport gives a flat +25 bonus (capped at 100)
    airport_bonus = 25 if counts.get("airport", 0) > 0 else 0
    infra_base = (
        _norm(counts.get("transit", 0),   CAPS["transit"])   * 0.50 +
        _norm(counts.get("roads", 0),     CAPS["roads"])     * 0.30 +
        _norm(counts.get("hospitals", 0), CAPS["hospitals"]) * 0.20
    )
    infrastructure = min(100, round(infra_base + airport_bonus))

    # ── Employment (10%) ──────────────────────────────────────────────────────
    # General offices (70%) + IT-specific offices (30% bonus weight)
    employment = round(
        _norm(counts.get("offices", 0),    CAPS["offices"])    * 0.70 +
        _norm(counts.get("it_offices", 0), CAPS["it_offices"]) * 0.30
    )

    # ── Population proxy (20%) ────────────────────────────────────────────────
    # Residential density (60%) + education availability (25%) + shopping (15%)
    population = round(
        _norm(counts.get("residential", 0), CAPS["residential"]) * 0.60 +
        _norm(counts.get("education", 0),   CAPS["education"])   * 0.25 +
        _norm(counts.get("shopping", 0),    CAPS["shopping"])    * 0.15
    )

    # ── Satellite proxy (20%) ─────────────────────────────────────────────────
    # Construction activity = development momentum (best free proxy for change)
    satellite = _norm(counts.get("construction", 0), CAPS["construction"])

    # ── RERA proxy (15%) ──────────────────────────────────────────────────────
    # Residential project density (apartments + construction) — RERA scraping is Phase 3
    rera_raw = counts.get("residential", 0) + counts.get("construction", 0)
    rera = _norm(rera_raw, CAPS["residential"] + CAPS["construction"])

    # ── Static defaults (can't derive from OSM reliably) ─────────────────────
    price_velocity = 50   # neutral — real data needs price API (Phase 3)
    govt_scheme    = min(60, infrastructure // 2)   # infra-correlated proxy

    signals = DNASignals(
        infrastructure=infrastructure,
        population=population,
        satellite=satellite,
        rera=rera,
        employment=employment,
        priceVelocity=price_velocity,
        govtScheme=govt_scheme,
    )

    # ── Weighted DNA score ────────────────────────────────────────────────────
    score = round(
        signals.infrastructure * WEIGHTS["infrastructure"] +
        signals.population     * WEIGHTS["population"]     +
        signals.satellite      * WEIGHTS["satellite"]      +
        signals.rera           * WEIGHTS["rera"]           +
        signals.employment     * WEIGHTS["employment"]     +
        signals.priceVelocity  * WEIGHTS["priceVelocity"]  +
        signals.govtScheme     * WEIGHTS["govtScheme"]
    )

    # ── Highlight generation ──────────────────────────────────────────────────
    highlights: list[str] = []

    if counts.get("airport", 0) > 0:
        highlights.append("Airport within 10 km — premium connectivity")
    if signals.infrastructure >= 75:
        highlights.append("Excellent transit and road network")
    elif signals.infrastructure >= 50:
        highlights.append("Good road access and public transit nearby")
    if signals.employment >= 70:
        highlights.append("Major employment hub — offices and IT parks close by")
    elif signals.employment >= 40:
        highlights.append("Growing commercial activity in the area")
    if signals.satellite >= 65:
        highlights.append("High construction momentum — active development zone")
    elif signals.satellite >= 35:
        highlights.append("Moderate construction activity detected")
    if signals.population >= 75:
        highlights.append("Dense residential neighbourhood with strong amenities")
    if not highlights:
        highlights.append("Early-stage area — limited OSM coverage, score may improve")

    # ── Confidence ────────────────────────────────────────────────────────────
    total_signals = sum(counts.values())
    confidence = (
        "High"   if total_signals >= 30 else
        "Medium" if total_signals >= 10 else
        "Low"
    )

    return DNAResult(
        score=score,
        signals=signals,
        highlights=highlights[:3],
        confidence=confidence,
        raw_counts=counts,
    )
