from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database (Supabase)
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Google Earth Engine
    GEE_SERVICE_ACCOUNT: str = ""
    GEE_KEY_FILE: str = ""

    # AI
    GEMINI_API_KEY: str = ""

    # Redis (optional for caching)
    REDIS_URL: str = "redis://localhost:6379"

    class Config:
        env_file = "../.env"


settings = Settings()
