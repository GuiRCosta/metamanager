import json
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.models.settings import (
    Settings,
    SettingsUpdate,
    TestConnectionResponse,
    MetaApiSettings,
)
from app.tools.meta_api import MetaAPI

router = APIRouter()

SETTINGS_FILE = Path(__file__).parent.parent.parent / "data" / "settings.json"


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

    save_settings(current)
    return current


@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_meta_connection(credentials: MetaApiSettings):
    """Testa a conexão com a Meta API usando as credenciais fornecidas."""
    if not credentials.access_token:
        return TestConnectionResponse(
            success=False,
            message="Access Token é obrigatório",
        )

    try:
        # Salva temporariamente o token no ambiente para testar
        original_token = os.environ.get("META_ACCESS_TOKEN")
        os.environ["META_ACCESS_TOKEN"] = credentials.access_token

        if credentials.business_id:
            os.environ["META_BUSINESS_ID"] = credentials.business_id

        meta_api = MetaAPI()
        accounts = await meta_api.get_ad_accounts()

        # Restaura o token original
        if original_token:
            os.environ["META_ACCESS_TOKEN"] = original_token
        else:
            os.environ.pop("META_ACCESS_TOKEN", None)

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
