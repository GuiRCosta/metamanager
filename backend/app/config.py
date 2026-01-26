from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Meta API
    meta_access_token: str = ""
    meta_ad_account_id: str = ""
    meta_business_id: str = ""
    meta_page_id: str = ""
    meta_api_version: str = "v24.0"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_whisper_model: str = "whisper-1"  # Modelo de transcrição de áudio

    # Evolution API (WhatsApp)
    evolution_api_url: str = ""  # Ex: https://evolution.seudominio.com
    evolution_api_key: str = ""
    evolution_instance: str = ""  # Nome da instância
    evolution_webhook_secret: str = ""  # Secret para validar webhooks

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
