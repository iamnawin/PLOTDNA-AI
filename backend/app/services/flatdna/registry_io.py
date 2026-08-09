from __future__ import annotations

import json
from pathlib import Path

from .models import RegistryBundle


REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_HYDERABAD_REGISTRY_PATH = (
    REPO_ROOT / "data" / "cities" / "hyderabad" / "flatdna" / "registry.json"
)
REGISTRY_LIST_NAMES = (
    "developers",
    "developer_aliases",
    "projects",
    "project_aliases",
    "rera_references",
    "evidence_sources",
    "claim_evidence",
)


def load_registry_bundle(path: str | Path = DEFAULT_HYDERABAD_REGISTRY_PATH) -> RegistryBundle:
    registry_path = Path(path)
    with registry_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return RegistryBundle.model_validate(payload)


def registry_summary(bundle: RegistryBundle) -> dict[str, int]:
    return {name: len(getattr(bundle, name)) for name in REGISTRY_LIST_NAMES}
