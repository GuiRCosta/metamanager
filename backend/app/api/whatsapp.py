"""
API endpoints para integração com WhatsApp via Evolution API.
"""

import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException, Header, BackgroundTasks
from typing import Optional
from pydantic import BaseModel

from app.config import get_settings
from app.models.whatsapp import WebhookEvent
from app.services.whatsapp_handler import get_whatsapp_handler

settings = get_settings()
router = APIRouter()


def verify_webhook_signature(
    payload: bytes,
    signature: Optional[str],
    secret: str,
) -> bool:
    """
    Verifica a assinatura do webhook.

    Args:
        payload: Corpo da requisição em bytes
        signature: Assinatura recebida no header
        secret: Secret configurado

    Returns:
        True se a assinatura for válida
    """
    if not secret:
        return True  # Se não há secret, aceita todas as requisições

    if not signature:
        return False

    expected_signature = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)


class SetAdAccountRequest(BaseModel):
    """Request para definir conta de anúncios."""
    phone_number: str
    ad_account_id: str


class SendMessageRequest(BaseModel):
    """Request para enviar mensagem manualmente."""
    phone_number: str
    message: str


@router.post("/webhook")
async def webhook_handler(
    request: Request,
    background_tasks: BackgroundTasks,
    x_webhook_signature: Optional[str] = Header(None, alias="x-webhook-signature"),
):
    """
    Endpoint para receber webhooks da Evolution API.

    A Evolution API envia eventos como:
    - messages.upsert: Nova mensagem recebida
    - messages.update: Mensagem atualizada (leitura, etc)
    - connection.update: Status da conexão
    """
    try:
        # Ler corpo da requisição
        body = await request.body()

        # Verificar assinatura (opcional, se configurado)
        if settings.evolution_webhook_secret:
            if not verify_webhook_signature(
                body,
                x_webhook_signature,
                settings.evolution_webhook_secret,
            ):
                raise HTTPException(status_code=401, detail="Invalid signature")

        # Parse do evento
        data = await request.json()

        # Criar objeto do evento
        event = WebhookEvent(
            event=data.get("event", ""),
            instance=data.get("instance", ""),
            data=data.get("data"),
            destination=data.get("destination"),
            sender=data.get("sender"),
        )

        # Processar em background para responder rapidamente
        handler = get_whatsapp_handler()
        background_tasks.add_task(handler.process_webhook_event, event)

        return {"success": True, "message": "Event received"}

    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/send")
async def send_message(request: SendMessageRequest):
    """
    Envia uma mensagem manualmente para um número.

    Útil para testes ou para enviar mensagens programáticas.
    """
    handler = get_whatsapp_handler()
    result = await handler.process_message(
        phone_number=request.phone_number,
        message={"conversation": request.message},
    )
    return result


@router.post("/set-account")
async def set_ad_account(request: SetAdAccountRequest):
    """
    Define a conta de anúncios para uma conversa específica.

    Isso permite que o agente saiba qual conta usar para operações.
    """
    handler = get_whatsapp_handler()
    handler.set_ad_account(request.phone_number, request.ad_account_id)

    return {
        "success": True,
        "message": f"Conta {request.ad_account_id} definida para {request.phone_number}",
    }


@router.delete("/conversation/{phone_number}")
async def clear_conversation(phone_number: str):
    """
    Limpa o histórico de conversa de um número.

    Útil para reiniciar uma conversa do zero.
    """
    handler = get_whatsapp_handler()
    handler.clear_conversation(phone_number)

    return {
        "success": True,
        "message": f"Conversa com {phone_number} limpa",
    }


@router.get("/health")
async def health_check():
    """Verifica se o serviço de WhatsApp está funcionando."""
    from app.services.evolution_client import get_evolution_client

    client = get_evolution_client()

    # Verificar se as configurações estão presentes
    config_ok = bool(
        settings.evolution_api_url
        and settings.evolution_api_key
        and settings.evolution_instance
    )

    return {
        "status": "healthy" if config_ok else "not_configured",
        "evolution_api_url": settings.evolution_api_url[:30] + "..." if settings.evolution_api_url else None,
        "instance": settings.evolution_instance or None,
        "configured": config_ok,
    }
