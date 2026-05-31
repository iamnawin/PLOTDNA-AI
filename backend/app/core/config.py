from pathlib import Path
from typing import Any

from pydantic import field_validator, model_validator
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
    JWT_SECRET: str = "plotdna-dev-only-change-me"
    FREE_SEARCH_LIMIT: int = 5

    # CORS (set "*" for public APIs, or comma-separated origins for production)
    ALLOWED_ORIGINS: str = "*"

    # AI — required for live verdicts
    GEMINI_API_KEY: str = ""
    GEMINI_CHAT_MODELS: str = "gemini-1.5-flash"
    GEMINI_BROCHURE_MODELS: str = "gemini-2.0-flash,gemini-1.5-flash"
    AI_PROVIDER_ORDER: str = "gemini,together,nvidia,fallback"
    TOGETHER_API_KEY: str = ""
    TOGETHER_BASE_URL: str = "https://api.together.ai/v1"
    TOGETHER_CHAT_MODELS: str = "openai/gpt-oss-20b,meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"
    TOGETHER_TIMEOUT_SECONDS: float = 45.0
    NVIDIA_API_KEY: str = ""
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_CHAT_MODELS: str = "moonshotai/kimi-k2.6"
    NVIDIA_TIMEOUT_SECONDS: float = 35.0
    NEWS_API_KEY: str = ""

    # External data providers
    DLD_API_KEY: str = ""
    API_SETU_KEY: str = ""

    # Database (Supabase) — Phase 2
    DATABASE_URL:  str = ""
    SUPABASE_URL:  str = ""
    SUPABASE_KEY:  str = ""

    # Google Earth Engine — Phase 3
    GEE_SERVICE_ACCOUNT: str = ""
    GEE_KEY_FILE:        str = ""

    # Redis — Phase 2 (replaced by in-memory cache for Phase 1)
    REDIS_URL: str = "redis://localhost:6379"

    # Brochure uploads
    MAX_BROCHURE_SIZE_MB: int = 10
    UPLOAD_TEMP_DIR: str = ""

    # Local entitlement store. Leave blank to use backend/app/.local.
    ENTITLEMENTS_DB_PATH: str = ""

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value: Any) -> Any:
        if isinstance(value, str) and value.strip().lower() in {"release", "prod", "production"}:
            return False
        return value

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.APP_ENV.lower() == "production":
            if self.JWT_SECRET == "plotdna-dev-only-change-me" or len(self.JWT_SECRET) < 32:
                raise ValueError("JWT_SECRET must be set to a long random value in production")
        return self

    model_config = {
        "env_file": _find_env(),
        "extra": "ignore",
    }


settings = Settings()
