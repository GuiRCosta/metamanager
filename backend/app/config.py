from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Meta API
    meta_access_token: str = ""
    meta_ad_account_id: str = ""
    meta_page_id: str = ""
    meta_api_version: str = "v24.0"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Application
    frontend_url: str = "http://localhost:3000"
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # Rate Limiting
    rate_limit_per_minute: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
