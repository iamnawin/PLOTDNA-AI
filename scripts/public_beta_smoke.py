from __future__ import annotations

import argparse
import os
import sys
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))


def _load_env() -> None:
    for path in (ROOT / ".env", ROOT / "scripts" / ".env", BACKEND / ".env"):
        if path.exists():
            load_dotenv(path, override=False)


def _configured(name: str) -> bool:
    return bool(os.getenv(name, "").strip())


def _status(name: str) -> str:
    return "configured" if _configured(name) else "missing"


def _print_provider_matrix() -> None:
    keys = [
        "JWT_SECRET",
        "GEMINI_API_KEY",
        "TOGETHER_API_KEY",
        "NVIDIA_API_KEY",
        "NEWS_API_KEY",
        "DLD_API_KEY",
        "API_SETU_KEY",
        "SUPABASE_URL",
        "SUPABASE_KEY",
    ]
    print("provider matrix")
    for key in keys:
        print(f"- {key}: {_status(key)}")


def _smoke_core() -> None:
    from app.main import app

    client = TestClient(app)

    health = client.get("/health")
    assert health.status_code == 200, health.text

    auth = client.post("/api/v1/auth/anonymous")
    assert auth.status_code == 200, auth.text
    token = auth.json()["access_token"]

    entitlements = client.get(
        "/api/v1/entitlements",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert entitlements.status_code == 200, entitlements.text

    resolved = client.post(
        "/api/utils/resolve",
        json={
            "lat": 17.4435,
            "lng": 78.3772,
            "locality": "Financial District",
            "city": "Hyderabad",
        },
    )
    assert resolved.status_code == 200, resolved.text

    route_paths = {route.path for route in app.routes}
    for path in (
        "/api/v1/auth/anonymous",
        "/api/v1/entitlements",
        "/api/v1/analyze-brochure",
        "/api/india/spatial",
        "/api/uae/zones",
    ):
        assert path in route_paths, f"missing route: {path}"

    print(f"core smoke: pass ({len(route_paths)} routes, resolve={resolved.json()['tier']})")


def _smoke_live_ai() -> None:
    if not (
        _configured("GEMINI_API_KEY")
        or _configured("TOGETHER_API_KEY")
        or _configured("NVIDIA_API_KEY")
    ):
        print("live ai smoke: skipped (no Gemini, Together, or NVIDIA key)")
        return

    from app.services.ai_provider import call_text_model

    result = call_text_model(
        "Return one short sentence confirming PlotDNA release smoke test connectivity."
    )
    assert result is not None and result.text.strip(), "AI provider returned no text"
    print(f"live ai smoke: pass ({result.source}:{result.model})")


def _smoke_optional_routes() -> None:
    from app.main import app

    client = TestClient(app)

    if _configured("DLD_API_KEY"):
        response = client.get("/api/uae/transactions/Business%20Bay")
        assert response.status_code == 200, response.text
        print("dld smoke: pass")
    else:
        print("dld smoke: skipped (DLD_API_KEY missing)")

    if _configured("API_SETU_KEY"):
        response = client.get("/api/india/infra-pipeline?lat=17.4435&lng=78.3772")
        assert response.status_code == 200, response.text
        print("api setu smoke: pass")
    else:
        print("api setu smoke: skipped (API_SETU_KEY missing)")

    if _configured("SUPABASE_URL") and _configured("SUPABASE_KEY"):
        print("supabase smoke: configured (write test intentionally not run)")
    else:
        print("supabase smoke: skipped (Supabase env missing)")


def main() -> int:
    parser = argparse.ArgumentParser(description="PlotDNA public beta release smoke checks")
    parser.add_argument("--live", action="store_true", help="call configured external providers")
    args = parser.parse_args()

    _load_env()
    os.environ.setdefault("APP_ENV", "development")
    os.environ.setdefault("DEBUG", "false")
    os.environ.setdefault(
        "ENTITLEMENTS_DB_PATH",
        str(Path(tempfile.gettempdir()) / "plotdna-public-beta-smoke.sqlite3"),
    )

    _print_provider_matrix()
    _smoke_core()
    if args.live:
        _smoke_live_ai()
        _smoke_optional_routes()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
