import json
import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.models.settings import (
    Settings,
    SettingsUpdate,
    TestConnectionResponse,
    MetaApiSettings,
)
from app.config import get_settings as get_env_settings

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent / "data"
SETTINGS_FILE = DATA_DIR / "settings.json"


def get_settings_file(user_id: str | None = None) -> Path:
    """Retorna o path do arquivo de settings para o usuário."""
    if user_id:
        return DATA_DIR / f"settings_{user_id}.json"
    return SETTINGS_FILE


@dataclass
class MetaConfig:
    """Configuração consolidada da Meta API (JSON + env vars)."""
    access_token: str
    business_id: str
    ad_account_id: str
    page_id: str
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


def load_settings(user_id: str | None = None) -> Settings:
    """Carrega as configurações do arquivo JSON."""
    ensure_data_dir()
    settings_file = get_settings_file(user_id)
    if settings_file.exists():
        with open(settings_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return Settings(**data)
    # Fallback: tenta arquivo global se user-specific não existe
    if user_id and SETTINGS_FILE.exists():
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return Settings(**data)
    return Settings()


def get_meta_config(user_id: str | None = None) -> MetaConfig:
    """
    Retorna configuração da Meta API.
    Prioridade: JSON settings > Environment variables
    """
    json_settings = load_settings(user_id)
    env_settings = get_env_settings()

    # JSON tem prioridade, env var é fallback
    access_token = json_settings.meta_api.access_token or env_settings.meta_access_token
    business_id = json_settings.meta_api.business_id or env_settings.meta_business_id
    ad_account_id = json_settings.meta_api.ad_account_id or env_settings.meta_ad_account_id
    page_id = json_settings.meta_api.page_id or ""
    api_version = json_settings.meta_api.api_version or env_settings.meta_api_version

    # Normaliza ad_account_id (remove 'act_' se presente para consistência)
    if ad_account_id and ad_account_id.startswith("act_"):
        ad_account_id = ad_account_id[4:]

    return MetaConfig(
        access_token=access_token or "",
        business_id=business_id or "",
        ad_account_id=ad_account_id or "",
        page_id=page_id,
        api_version=api_version or "v22.0",
    )


def get_evolution_config(user_id: str | None = None) -> EvolutionConfig:
    """
    Retorna configuração da Evolution API.
    Prioridade: JSON settings > Environment variables
    """
    json_settings = load_settings(user_id)
    env_settings = get_env_settings()

    return EvolutionConfig(
        api_url=json_settings.evolution.api_url or env_settings.evolution_api_url or "",
        api_key=json_settings.evolution.api_key or env_settings.evolution_api_key or "",
        instance=json_settings.evolution.instance or env_settings.evolution_instance or "",
        webhook_secret=json_settings.evolution.webhook_secret or env_settings.evolution_webhook_secret or "",
        enabled=json_settings.evolution.enabled,
        allowed_numbers=json_settings.evolution.allowed_numbers or [],
    )


def save_settings(settings: Settings, user_id: str | None = None) -> None:
    """Salva as configurações no arquivo JSON."""
    ensure_data_dir()
    settings_file = get_settings_file(user_id)
    with open(settings_file, "w", encoding="utf-8") as f:
        json.dump(settings.model_dump(), f, indent=2, ensure_ascii=False)


@router.get("", response_model=Settings)
async def get_settings(user_id: str | None = Query(None)):
    """Obtém todas as configurações."""
    return load_settings(user_id)


@router.put("", response_model=Settings)
async def update_settings(updates: SettingsUpdate, user_id: str | None = Query(None)):
    """Atualiza as configurações."""
    current = load_settings(user_id)

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

    save_settings(current, user_id)
    return current


class SetDefaultAccountRequest(BaseModel):
    """Request para definir conta padrão."""
    ad_account_id: str


@router.patch("/default-account")
async def set_default_account(request: SetDefaultAccountRequest, user_id: str | None = Query(None)):
    """
    Define a conta de anúncios padrão.
    Chamado automaticamente quando o usuário seleciona uma conta no dropdown.
    """
    current = load_settings(user_id)
    current.meta_api.ad_account_id = request.ad_account_id
    save_settings(current, user_id)
    return {"success": True, "ad_account_id": request.ad_account_id}


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
