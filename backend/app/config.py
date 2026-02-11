from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Meta API
    meta_access_token: str = ""
    meta_ad_account_id: str = ""
    meta_business_id: str = ""
    meta_page_id: str = ""
    meta_api_version: str = "v24.0"

    # LLM Provider (OpenAI, OpenRouter, ou qualquer API compatível)
    llm_api_key: str = ""
    llm_base_url: str = ""  # Vazio = OpenAI | https://openrouter.ai/api/v1 = OpenRouter
    llm_model: str = "gpt-4o-mini"  # Modelo para agentes (qualidade)
    llm_routing_model: str = ""  # Modelo para classificação/routing (rápido). Se vazio, usa llm_model

    # OpenAI - Transcrição de Áudio
    openai_api_key: str = ""  # API Key da OpenAI para Whisper
    whisper_model: str = "whisper-1"  # Modelo Whisper para transcrição

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
