"""
Handler de mensagens do WhatsApp.
Coordena o processamento de mídia e integração com o orquestrador de agentes.
"""

from datetime import datetime
from typing import Optional
from app.config import get_settings
from app.models.whatsapp import WebhookEvent, MessageType, ConversationContext
from app.services.media_processor import get_media_processor
from app.services.evolution_client import get_evolution_client
from app.skills.orchestrator import CampaignOrchestrator

settings = get_settings()


class WhatsAppHandler:
    """Processa mensagens do WhatsApp e coordena respostas."""

    def __init__(self):
        self.media_processor = get_media_processor()
        self.evolution_client = get_evolution_client()
        self.orchestrator = CampaignOrchestrator()

        # Cache de conversas (em produção, usar Redis ou banco de dados)
        self._conversations: dict[str, ConversationContext] = {}

    def _get_conversation(self, phone_number: str) -> ConversationContext:
        """Obtém ou cria contexto de conversa."""
        if phone_number not in self._conversations:
            self._conversations[phone_number] = ConversationContext(
                phone_number=phone_number,
                history=[],
            )
        return self._conversations[phone_number]

    def _update_conversation(
        self,
        phone_number: str,
        role: str,
        content: str,
        name: Optional[str] = None,
    ):
        """Atualiza histórico da conversa."""
        context = self._get_conversation(phone_number)

        if name and not context.name:
            context.name = name

        context.history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        })

        # Manter apenas últimas 20 mensagens
        if len(context.history) > 20:
            context.history = context.history[-20:]

        context.last_interaction = datetime.now().isoformat()

    def _extract_phone_number(self, remote_jid: str) -> str:
        """Extrai número de telefone do JID."""
        return remote_jid.split("@")[0] if "@" in remote_jid else remote_jid

    def _detect_message_type(self, message: dict) -> str:
        """Detecta o tipo de mensagem recebida."""
        if "conversation" in message or "extendedTextMessage" in message:
            return MessageType.TEXT
        elif "audioMessage" in message:
            return MessageType.AUDIO
        elif "imageMessage" in message:
            return MessageType.IMAGE
        elif "videoMessage" in message:
            return MessageType.VIDEO
        elif "documentMessage" in message:
            return MessageType.DOCUMENT
        elif "stickerMessage" in message:
            return MessageType.STICKER
        elif "locationMessage" in message:
            return MessageType.LOCATION
        elif "contactMessage" in message:
            return MessageType.CONTACT
        elif "reactionMessage" in message:
            return MessageType.REACTION
        return "unknown"

    def _extract_text(self, message: dict) -> Optional[str]:
        """Extrai texto de uma mensagem."""
        if "conversation" in message:
            return message["conversation"]
        if "extendedTextMessage" in message:
            return message["extendedTextMessage"].get("text")
        return None

    def _extract_media_info(self, message: dict, media_type: str) -> dict:
        """Extrai informações de mídia de uma mensagem."""
        media_key = f"{media_type}Message"
        media_data = message.get(media_key, {})

        return {
            "url": media_data.get("url"),
            "mimetype": media_data.get("mimetype"),
            "caption": media_data.get("caption"),
            "filename": media_data.get("fileName"),
            "base64": media_data.get("base64"),
        }

    async def process_webhook_event(self, event: WebhookEvent) -> dict:
        """
        Processa um evento recebido do webhook.

        Args:
            event: Evento do webhook

        Returns:
            Dict com resultado do processamento
        """
        # Ignorar eventos que não são mensagens
        if event.event not in ["messages.upsert", "message"]:
            return {"processed": False, "reason": "Event type not handled"}

        data = event.data
        if not data:
            return {"processed": False, "reason": "No data in event"}

        # Extrair informações da mensagem
        key = data.get("key", {})
        message = data.get("message", {})
        push_name = data.get("pushName")

        # Ignorar mensagens enviadas por nós mesmos
        if key.get("fromMe", False):
            return {"processed": False, "reason": "Message from self"}

        phone_number = self._extract_phone_number(key.get("remoteJid", ""))
        if not phone_number:
            return {"processed": False, "reason": "No phone number"}

        # Processar a mensagem
        return await self.process_message(
            phone_number=phone_number,
            message=message,
            push_name=push_name,
        )

    async def process_message(
        self,
        phone_number: str,
        message: dict,
        push_name: Optional[str] = None,
    ) -> dict:
        """
        Processa uma mensagem e gera resposta.

        Args:
            phone_number: Número do remetente
            message: Dados da mensagem
            push_name: Nome do contato

        Returns:
            Dict com resultado
        """
        try:
            # Enviar indicador de digitação
            await self.evolution_client.send_typing(phone_number)

            # Detectar tipo de mensagem
            msg_type = self._detect_message_type(message)

            # Extrair conteúdo baseado no tipo
            user_input = ""

            if msg_type == MessageType.TEXT:
                user_input = self._extract_text(message) or ""

            elif msg_type == MessageType.AUDIO:
                media_info = self._extract_media_info(message, "audio")
                transcription = await self.media_processor.transcribe_audio(
                    audio_url=media_info.get("url"),
                    audio_base64=media_info.get("base64"),
                )
                user_input = transcription

            elif msg_type == MessageType.IMAGE:
                # Imagem não suportada por enquanto
                await self.evolution_client.send_text(
                    number=phone_number,
                    text="No momento não consigo processar imagens. Por favor, envie sua mensagem como texto ou áudio.",
                )
                return {"processed": True, "response": "Image not supported"}

            elif msg_type == MessageType.VIDEO:
                # Vídeo não suportado por enquanto
                await self.evolution_client.send_text(
                    number=phone_number,
                    text="No momento não consigo processar vídeos. Por favor, envie sua mensagem como texto ou áudio.",
                )
                return {"processed": True, "response": "Video not supported"}

            elif msg_type == MessageType.DOCUMENT:
                await self.evolution_client.send_text(
                    number=phone_number,
                    text="No momento não consigo processar documentos. Por favor, envie sua mensagem como texto ou áudio.",
                )
                return {"processed": True, "response": "Document not supported"}

            elif msg_type == MessageType.STICKER:
                return {"processed": True, "response": None, "reason": "Sticker ignored"}

            elif msg_type == MessageType.REACTION:
                return {"processed": True, "response": None, "reason": "Reaction ignored"}

            else:
                user_input = "Recebi sua mensagem, mas não consegui identificar o tipo. Por favor, envie como texto ou áudio."

            if not user_input.strip():
                return {"processed": False, "reason": "Empty input"}

            # Atualizar histórico com mensagem do usuário
            self._update_conversation(phone_number, "user", user_input, push_name)

            # Obter contexto da conversa
            context = self._get_conversation(phone_number)

            # Processar com o orquestrador
            result = await self.orchestrator.process_message(
                message=user_input,
                ad_account_id=context.ad_account_id,
                history=context.history[:-1],  # Excluir mensagem atual do histórico
            )

            response_text = result.get("response", "Desculpe, não consegui processar sua mensagem.")

            # Atualizar histórico com resposta
            self._update_conversation(phone_number, "assistant", response_text)

            # Enviar resposta via WhatsApp
            send_result = await self.evolution_client.send_text(
                number=phone_number,
                text=response_text,
            )

            return {
                "processed": True,
                "response": response_text,
                "agent_type": result.get("agent_type"),
                "sent": send_result.success,
            }

        except Exception as e:
            error_message = "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente."

            # Tentar enviar mensagem de erro
            await self.evolution_client.send_text(
                number=phone_number,
                text=error_message,
            )

            return {
                "processed": False,
                "error": str(e),
            }

    def set_ad_account(self, phone_number: str, ad_account_id: str):
        """
        Define a conta de anúncios para uma conversa.

        Args:
            phone_number: Número do telefone
            ad_account_id: ID da conta de anúncios
        """
        context = self._get_conversation(phone_number)
        context.ad_account_id = ad_account_id

    def clear_conversation(self, phone_number: str):
        """Limpa histórico de uma conversa."""
        if phone_number in self._conversations:
            del self._conversations[phone_number]


# Singleton para reutilização
_whatsapp_handler: Optional[WhatsAppHandler] = None


def get_whatsapp_handler() -> WhatsAppHandler:
    """Retorna instância do handler do WhatsApp."""
    global _whatsapp_handler
    if _whatsapp_handler is None:
        _whatsapp_handler = WhatsAppHandler()
    return _whatsapp_handler
