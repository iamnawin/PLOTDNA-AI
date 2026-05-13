"""
Advanced DNA Scorer — Phase 2 Algorithm
4-signal scoring for areas with live data (news, brochures, transaction history).

Weights:
  Infrastructure Pipeline   30%
  Market Sentiment (News)   20%
  Brochure Accuracy (RERA)  20%
  Historical Appreciation   30%

Returns a Phase 2 score (0–100) alongside the existing Phase 1 static score.
"""
import logging
from dataclasses import dataclass, asdict
from typing import Optional

logger = logging.getLogger(__name__)


# ── Signal weights ─────────────────────────────────────────────────────────────

SIGNAL_WEIGHTS = {
    "infrastructure": 0.30,
    "sentiment":      0.20,
    "accuracy":       0.20,
    "appreciation":   0.30,
}

WEIGHT_LABELS = {
    "infrastructure": "Government Infrastructure Pipeline",
    "sentiment":      "Market Sentiment from News",
    "accuracy":       "Brochure Accuracy vs. RERA Filing",
    "appreciation":   "Historical Price Appreciation",
}


# ── Score tiers (same as Phase 1) ─────────────────────────────────────────────

def score_tier(score: int) -> dict:
    if score >= 86:
        return {"tier": "Goldzone",     "color": "#10b981", "label": "💎 Goldzone"}
    if score >= 66:
        return {"tier": "Good Growth",  "color": "#22c55e", "label": "🟢 Good Growth"}
    if score >= 41:
        return {"tier": "Moderate",     "color": "#f59e0b", "label": "🟡 Moderate"}
    return     {"tier": "High Risk",    "color": "#ef4444", "label": "🔴 High Risk"}


# ── Signal scorers ─────────────────────────────────────────────────────────────

def score_infrastructure(phase1_infra_signal: int) -> int:
    """
    Phase 1 infrastructure signal (0–100) from static data.
    In Phase 2, this will be enriched with live news NER (infra projects mentioned).
    For now, use static signal directly.
    """
    return max(0, min(100, phase1_infra_signal))


def score_sentiment(sentiment_score: int) -> int:
    """
    News sentiment score (0–100) from MarketNewsResult.sentiment_score.
    Already in 0-100 range — just validate bounds.
    """
    return max(0, min(100, sentiment_score))


def score_brochure_accuracy(
    brochure_rera_number: Optional[str],
    phase1_rera_signal: int,
    loading_percentage: Optional[float],
) -> int:
    """
    Brochure accuracy vs. RERA filing.
    Logic:
    - RERA number present in brochure → +30 points base
    - Phase 1 RERA signal (project filing quality) → 50% weight
    - Low loading % (≤15%) → bonus points (transparent pricing)
    - High loading % (>25%) → penalty (misleading pricing)
    """
    base = 50  # neutral start

    # RERA number present
    if brochure_rera_number:
        base += 30
    else:
        base -= 10   # no RERA shown in brochure — suspicious

    # RERA quality signal from Phase 1
    rera_contribution = (phase1_rera_signal - 50) * 0.5
    base += rera_contribution

    # Loading % transparency bonus/penalty
    if loading_percentage is not None:
        if loading_percentage <= 15:
            base += 15   # transparent, fair loading
        elif loading_percentage <= 25:
            base += 0    # typical, no adjustment
        else:
            base -= 20   # high loading = misleading price

    return max(0, min(100, int(base)))


def score_appreciation(
    yoy_growth_pct: float,
    price_trend_signal: Optional[str] = None,
) -> int:
    """
    Historical appreciation score.
    - yoy_growth_pct: Year-over-year price appreciation percentage
    - price_trend_signal: Optional string "+8.2%" or "-1.5%" from DLD/market data

    Scoring:
    - >20% YoY → 90–100
    - 10–20%   → 70–90
    - 5–10%    → 50–70
    - 0–5%     → 30–50
    - Negative → 0–30
    """
    # Parse trend signal if provided (supplement or override)
    trend_pct = None
    if price_trend_signal:
        try:
            trend_pct = float(price_trend_signal.strip().replace("%", "").replace("+", ""))
        except ValueError:
            pass

    # Use trend_pct if available (more recent), else use yoy
    growth = trend_pct if trend_pct is not None else yoy_growth_pct

    if growth >= 20:
        return min(100, int(80 + (growth - 20) * 1.0))
    if growth >= 10:
        return int(60 + (growth - 10) * 2.0)
    if growth >= 5:
        return int(40 + (growth - 5) * 4.0)
    if growth >= 0:
        return int(20 + growth * 4.0)
    # Negative growth
    return max(0, int(20 + growth * 2.0))


# ── Main scorer ────────────────────────────────────────────────────────────────

@dataclass
class Phase2Score:
    phase2_score: int
    phase1_score: int
    signals: dict           # individual signal scores
    weights: dict           # signal weights
    tier: str
    tier_color: str
    tier_label: str
    improvement: int        # phase2_score - phase1_score
    confidence: str         # "high" | "medium" | "low" (based on data completeness)
    data_completeness: float  # 0–1 fraction of live signals available

    def to_dict(self) -> dict:
        return asdict(self)


def compute_phase2_score(
    # Required
    phase1_score: int,
    phase1_infra_signal: int,
    phase1_rera_signal: int,
    yoy_growth_pct: float,
    # From news intel
    sentiment_score: int = 50,
    # From brochure parser
    brochure_rera_number: Optional[str] = None,
    loading_percentage: Optional[float] = None,
    # From DLD / market data
    price_trend_signal: Optional[str] = None,
) -> Phase2Score:
    """
    Compute Phase 2 DNA Score combining live signals.

    Args:
        phase1_score: Existing static DNA score (0–100)
        phase1_infra_signal: Static infrastructure signal score (0–100)
        phase1_rera_signal: Static RERA signal score (0–100)
        yoy_growth_pct: Year-over-year price appreciation %
        sentiment_score: News sentiment score from news_intel (0–100)
        brochure_rera_number: RERA registration extracted from brochure
        loading_percentage: Loading % from brochure (None if no brochure)
        price_trend_signal: Price trend string from DLD/market (e.g. "+8.2%")

    Returns:
        Phase2Score dataclass
    """
    # Compute individual signals
    infra_s = score_infrastructure(phase1_infra_signal)
    sentiment_s = score_sentiment(sentiment_score)
    accuracy_s = score_brochure_accuracy(brochure_rera_number, phase1_rera_signal, loading_percentage)
    appreciation_s = score_appreciation(yoy_growth_pct, price_trend_signal)

    # Weighted sum
    phase2 = int(
        infra_s        * SIGNAL_WEIGHTS["infrastructure"] +
        sentiment_s    * SIGNAL_WEIGHTS["sentiment"] +
        accuracy_s     * SIGNAL_WEIGHTS["accuracy"] +
        appreciation_s * SIGNAL_WEIGHTS["appreciation"]
    )
    phase2 = max(0, min(100, phase2))

    # Assess data completeness (which live signals are actually live vs assumed)
    live_signals = 0
    if sentiment_score != 50:           live_signals += 1   # real news data
    if brochure_rera_number is not None: live_signals += 1  # brochure parsed
    if price_trend_signal is not None:  live_signals += 1   # market data
    completeness = live_signals / 3.0

    if completeness >= 0.67:
        confidence = "high"
    elif completeness >= 0.33:
        confidence = "medium"
    else:
        confidence = "low"

    tier_info = score_tier(phase2)

    return Phase2Score(
        phase2_score=phase2,
        phase1_score=phase1_score,
        signals={
            "infrastructure": infra_s,
            "sentiment": sentiment_s,
            "accuracy": accuracy_s,
            "appreciation": appreciation_s,
        },
        weights=SIGNAL_WEIGHTS,
        tier=tier_info["tier"],
        tier_color=tier_info["color"],
        tier_label=tier_info["label"],
        improvement=phase2 - phase1_score,
        confidence=confidence,
        data_completeness=round(completeness, 2),
    )


def format_score_breakdown(score: Phase2Score) -> dict:
    """Format for frontend display — includes labels and visual weights."""
    breakdown = []
    for key in ["infrastructure", "sentiment", "accuracy", "appreciation"]:
        breakdown.append({
            "signal": key,
            "label": WEIGHT_LABELS[key],
            "score": score.signals[key],
            "weight": int(SIGNAL_WEIGHTS[key] * 100),
            "weighted_contribution": round(score.signals[key] * SIGNAL_WEIGHTS[key], 1),
        })

    return {
        "phase2_score": score.phase2_score,
        "phase1_score": score.phase1_score,
        "improvement": score.improvement,
        "tier": score.tier,
        "tier_label": score.tier_label,
        "tier_color": score.tier_color,
        "confidence": score.confidence,
        "data_completeness_pct": int(score.data_completeness * 100),
        "breakdown": breakdown,
    }
