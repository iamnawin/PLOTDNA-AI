from pathlib import Path

from pydantic_settings import BaseSettings


def _find_env() -> list[str]:
    """Locate .env from backend/, project root, or nested execution contexts."""
    candidates = [
        Path(".env"),
        Path("../.env"),
        Path("../../.env"),
    ]
    return [str(p) for p in candidates if p.exists()]


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    DEBUG: bool = True

    # CORS
    ALLOWED_ORIGINS: str = "*"

    # AI
    GEMINI_API_KEY: str = ""
    AI_PROVIDER_ORDER: str = "gemini,nvidia"
    GEMINI_VERDICT_MODELS: str = "gemini-1.5-flash,gemini-2.0-flash-lite"
    GEMINI_BROCHURE_MODELS: str = "gemini-2.0-flash,gemini-2.0-flash-lite,gemini-1.5-flash"
    NVIDIA_API_KEY: str = ""
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_CHAT_MODELS: str = "moonshotai/kimi-k2.6"
    NVIDIA_SAFETY_MODEL: str = "nvidia/nemotron-3-content-safety"

    # Database / Supabase
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Google Earth Engine
    GEE_SERVICE_ACCOUNT: str = ""
    GEE_KEY_FILE: str = ""

    # OSM / Overpass cache
    OSM_CACHE_DIR: str = ""
    OSM_CACHE_TTL_SECONDS: int = 86400

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Auth / entitlements
    JWT_SECRET: str = "dev-secret-change-me"
    JWT_ALG: str = "HS256"
    FREE_SEARCH_LIMIT: int = 3

    # News intelligence
    NEWS_API_KEY: str = ""

    # UAE / Dubai Land Department
    DLD_API_KEY: str = ""

    # India / API Setu
    API_SETU_KEY: str = ""

    # Brochure parsing
    MAX_BROCHURE_SIZE_MB: int = 10
    UPLOAD_TEMP_DIR: str = ""

    # Multi-country
    DEFAULT_COUNTRY: str = "India"
    SUPPORTED_COUNTRIES: str = "India,UAE"

    model_config = {
        "env_file": _find_env(),
        "extra": "ignore",
    }


settings = Settings()
