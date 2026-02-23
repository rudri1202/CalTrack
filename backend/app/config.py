"""Application settings loaded from environment / .env."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    model_config = {"env_file": ".env"}


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
