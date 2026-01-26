import json
import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.models.settings import (
    Settings,
    SettingsUpdate,
    TestConnectionResponse,
    MetaApiSettings,
)
from app.config import get_settings as get_env_settings

router = APIRouter()

SETTINGS_FILE = Path(__file__).parent.parent.parent / "data" / "settings.json"


@dataclass
class MetaConfig:
    """Configuração consolidada da Meta API (JSON + env vars)."""
    access_token: str
    business_id: str
    ad_account_id: str
    api_version: str


@dataclass
class EvolutionConfig:
    """Configuração consolidada da Evolution API (JSON + env vars)."""
    api_url: str
    api_key: str
    instance: str
    webhook_secret: str
    enabled: bool
    allowed_numbers: list[str]


def ensure_data_dir():
    """Garante que o diretório de dados existe."""
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)


def load_settings() -> Settings:
    """Carrega as configurações do arquivo JSON."""
    ensure_data_dir()
    if SETTINGS_FILE.exists():
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return Settings(**data)
    return Settings()


def get_meta_config() -> MetaConfig:
    """
    Retorna configuração da Meta API.
    Prioridade: JSON settings > Environment variables
    """
    json_settings = load_settings()
    env_settings = get_env_settings()

    # JSON tem prioridade, env var é fallback
    access_token = json_settings.meta_api.access_token or env_settings.meta_access_token
    business_id = json_settings.meta_api.business_id or env_settings.meta_business_id
    ad_account_id = json_settings.meta_api.ad_account_id or env_settings.meta_ad_account_id
    api_version = json_settings.meta_api.api_version or env_settings.meta_api_version

    # Normaliza ad_account_id (remove 'act_' se presente para consistência)
    if ad_account_id and ad_account_id.startswith("act_"):
        ad_account_id = ad_account_id[4:]

    return MetaConfig(
        access_token=access_token or "",
        business_id=business_id or "",
        ad_account_id=ad_account_id or "",
        api_version=api_version or "v24.0",
    )


def get_evolution_config() -> EvolutionConfig:
    """
    Retorna configuração da Evolution API.
    Prioridade: JSON settings > Environment variables
    """
    json_settings = load_settings()
    env_settings = get_env_settings()

    return EvolutionConfig(
        api_url=json_settings.evolution.api_url or env_settings.evolution_api_url or "",
        api_key=json_settings.evolution.api_key or env_settings.evolution_api_key or "",
        instance=json_settings.evolution.instance or env_settings.evolution_instance or "",
        webhook_secret=json_settings.evolution.webhook_secret or env_settings.evolution_webhook_secret or "",
        enabled=json_settings.evolution.enabled,
        allowed_numbers=json_settings.evolution.allowed_numbers or [],
    )


def save_settings(settings: Settings) -> None:
    """Salva as configurações no arquivo JSON."""
    ensure_data_dir()
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings.model_dump(), f, indent=2, ensure_ascii=False)


@router.get("", response_model=Settings)
async def get_settings():
    """Obtém todas as configurações."""
    return load_settings()


@router.put("", response_model=Settings)
async def update_settings(updates: SettingsUpdate):
    """Atualiza as configurações."""
    current = load_settings()

    if updates.budget is not None:
        current.budget = updates.budget
    if updates.meta_api is not None:
        current.meta_api = updates.meta_api
    if updates.notifications is not None:
        current.notifications = updates.notifications
    if updates.goals is not None:
        current.goals = updates.goals
    if updates.evolution is not None:
        current.evolution = updates.evolution

    save_settings(current)
    return current


@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_meta_connection(credentials: MetaApiSettings):
    """Testa a conexão com a Meta API usando as credenciais fornecidas."""
    # Import local para evitar circular import
    from app.tools.meta_api import MetaAPI

    if not credentials.access_token:
        return TestConnectionResponse(
            success=False,
            message="Access Token é obrigatório",
        )

    try:
        # Cria MetaAPI com credenciais temporárias para teste
        meta_api = MetaAPI(
            access_token=credentials.access_token,
            business_id=credentials.business_id,
            ad_account_id=credentials.ad_account_id,
        )
        accounts = await meta_api.get_ad_accounts()

        if not accounts:
            return TestConnectionResponse(
                success=True,
                message="Conexão estabelecida, mas nenhuma conta de anúncios encontrada",
                accounts_found=0,
            )

        return TestConnectionResponse(
            success=True,
            message=f"Conexão bem sucedida! {len(accounts)} conta(s) encontrada(s)",
            accounts_found=len(accounts),
        )

    except Exception as e:
        error_message = str(e)
        if "Invalid OAuth" in error_message or "access token" in error_message.lower():
            return TestConnectionResponse(
                success=False,
                message="Access Token inválido ou expirado",
            )
        if "permission" in error_message.lower():
            return TestConnectionResponse(
                success=False,
                message="Token sem permissões necessárias (ads_read, ads_management)",
            )
        return TestConnectionResponse(
            success=False,
            message=f"Erro ao conectar: {error_message}",
        )
