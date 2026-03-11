from pathlib import Path
from pydantic_settings import BaseSettings


def _find_env() -> list[str]:
    """Locate .env — works from backend/ (local) or project root (Render)."""
    candidates = [
        Path(".env"),          # Render: cwd is backend/
        Path("../.env"),       # Local: cwd is project root
        Path("../../.env"),    # Edge case
    ]
    return [str(p) for p in candidates if p.exists()]


class Settings(BaseSettings):
    # App
    APP_ENV:  str  = "development"
    DEBUG:    bool = True

    # CORS (set "*" for public APIs, or comma-separated origins for production)
    ALLOWED_ORIGINS: str = "*"

    # AI — required for live verdicts + brochure parsing
    GEMINI_API_KEY: str = ""

    # Database (Supabase) — Phase 2
    DATABASE_URL:  str = ""
    SUPABASE_URL:  str = ""
    SUPABASE_KEY:  str = ""

    # Google Earth Engine — Phase 3
    GEE_SERVICE_ACCOUNT: str = ""
    GEE_KEY_FILE:        str = ""

    # Redis — Phase 2 (replaced by in-memory cache for Phase 1)
    REDIS_URL: str = "redis://localhost:6379"

    # Phase 2: News Intelligence
    NEWS_API_KEY: str = ""          # newsapi.org — 100 req/day free

    # Phase 2: UAE — Dubai Land Department Open Data
    DLD_API_KEY: str = ""           # data.gov.ae API key

    # Phase 2: India — API Setu (national land records, RERA 2.0)
    API_SETU_KEY: str = ""          # api.setu.in developer key

    # Phase 2: Brochure parsing
    MAX_BROCHURE_SIZE_MB: int = 10
    UPLOAD_TEMP_DIR:      str = ""  # defaults to system temp if empty

    # Multi-country
    DEFAULT_COUNTRY:     str = "India"
    SUPPORTED_COUNTRIES: str = "India,UAE"

    model_config = {
        "env_file": _find_env(),
        "extra": "ignore",
    }


settings = Settings()
