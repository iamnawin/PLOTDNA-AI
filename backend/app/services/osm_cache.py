"""
Small JSON cache for OpenStreetMap / Overpass signal counts.

The cache is dependency-free so Render can use it without Redis. It stores
rounded coordinate cells, not raw user map links.
"""
from __future__ import annotations

import json
import logging
import re
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)

DEFAULT_TTL_SECONDS = 24 * 3600
COORD_PRECISION = 3
EMPTY_COUNTS = {
    "transit": 0,
    "roads": 0,
    "airport": 0,
    "hospitals": 0,
    "education": 0,
    "shopping": 0,
    "offices": 0,
    "it_offices": 0,
    "residential": 0,
    "construction": 0,
}


@dataclass(frozen=True)
class CachedOsmSignals:
    key: str
    counts: dict[str, int]
    age_seconds: int
    is_fresh: bool
    expires_at: float


def cache_key(lat: float, lng: float) -> str:
    return f"{lat:.{COORD_PRECISION}f}:{lng:.{COORD_PRECISION}f}"


def ttl_seconds() -> int:
    configured = getattr(settings, "OSM_CACHE_TTL_SECONDS", DEFAULT_TTL_SECONDS)
    return max(300, int(configured or DEFAULT_TTL_SECONDS))


def cache_dir() -> Path:
    configured = getattr(settings, "OSM_CACHE_DIR", "")
    if configured:
        return Path(configured)
    return Path(tempfile.gettempdir()) / "plotdna-osm-cache"


def _path_for_key(key: str) -> Path:
    safe_key = re.sub(r"[^0-9A-Za-z_.:-]", "_", key)
    return cache_dir() / f"{safe_key}.json"


def _normalize_counts(counts: dict) -> dict[str, int]:
    normalized = EMPTY_COUNTS.copy()
    for name in normalized:
        value = counts.get(name, 0)
        normalized[name] = max(0, int(value or 0))
    return normalized


def get_osm_cache(lat: float, lng: float, *, allow_stale: bool = False) -> CachedOsmSignals | None:
    key = cache_key(lat, lng)
    path = _path_for_key(key)
    if not path.exists():
        return None

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        created_at = float(data["created_at"])
        counts = _normalize_counts(data["counts"])
    except Exception as exc:
        logger.warning("Ignoring unreadable OSM cache entry %s: %s", path, exc)
        return None

    now = time.time()
    age = max(0, int(now - created_at))
    expires_at = created_at + ttl_seconds()
    is_fresh = now < expires_at
    if not is_fresh and not allow_stale:
        return None

    return CachedOsmSignals(
        key=key,
        counts=counts,
        age_seconds=age,
        is_fresh=is_fresh,
        expires_at=expires_at,
    )


def set_osm_cache(lat: float, lng: float, counts: dict) -> CachedOsmSignals:
    key = cache_key(lat, lng)
    path = _path_for_key(key)
    payload = {
        "key": key,
        "lat": round(lat, COORD_PRECISION),
        "lng": round(lng, COORD_PRECISION),
        "created_at": time.time(),
        "counts": _normalize_counts(counts),
        "source": "OpenStreetMap / Overpass API",
    }

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    cached = get_osm_cache(lat, lng, allow_stale=True)
    if cached is None:
        raise RuntimeError("OSM cache write succeeded but could not be read back")
    return cached
