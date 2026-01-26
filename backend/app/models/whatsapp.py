"""
Modelos para integração com WhatsApp via Evolution API.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class MessageType(str, Enum):
    """Tipos de mensagem suportados."""
    TEXT = "text"
    AUDIO = "audio"
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    STICKER = "sticker"
    LOCATION = "location"
    CONTACT = "contact"
    REACTION = "reaction"


class MediaMessage(BaseModel):
    """Dados de mídia recebida."""
    url: Optional[str] = None
    mimetype: Optional[str] = None
    caption: Optional[str] = None
    filename: Optional[str] = None
    file_size: Optional[int] = None
    base64: Optional[str] = None


class TextMessage(BaseModel):
    """Mensagem de texto."""
    text: str


class AudioMessage(BaseModel):
    """Mensagem de áudio."""
    audio: MediaMessage
    ptt: bool = False  # Push to talk (voice note)


class ImageMessage(BaseModel):
    """Mensagem de imagem."""
    image: MediaMessage


class VideoMessage(BaseModel):
    """Mensagem de vídeo."""
    video: MediaMessage


class DocumentMessage(BaseModel):
    """Mensagem de documento."""
    document: MediaMessage


class MessageKey(BaseModel):
    """Chave única da mensagem."""
    remote_jid: str = Field(alias="remoteJid")
    from_me: bool = Field(alias="fromMe")
    id: str

    class Config:
        populate_by_name = True


class WebhookMessage(BaseModel):
    """Mensagem recebida via webhook da Evolution API."""
    key: MessageKey
    push_name: Optional[str] = Field(None, alias="pushName")
    message_type: Optional[str] = Field(None, alias="messageType")
    message_timestamp: Optional[int] = Field(None, alias="messageTimestamp")

    # Conteúdo da mensagem
    message: Optional[dict] = None

    class Config:
        populate_by_name = True


class WebhookEvent(BaseModel):
    """Evento recebido do webhook da Evolution API."""
    event: str
    instance: str
    data: Optional[dict] = None
    destination: Optional[str] = None
    date_time: Optional[str] = Field(None, alias="date_time")
    sender: Optional[str] = None
    server_url: Optional[str] = Field(None, alias="server_url")
    api_key: Optional[str] = Field(None, alias="apikey")

    class Config:
        populate_by_name = True


class SendTextRequest(BaseModel):
    """Request para enviar mensagem de texto."""
    number: str
    text: str
    delay: Optional[int] = None


class SendMediaRequest(BaseModel):
    """Request para enviar mídia."""
    number: str
    media_type: str = Field(alias="mediatype")
    mimetype: str
    caption: Optional[str] = None
    media: str  # URL ou base64
    file_name: Optional[str] = Field(None, alias="fileName")

    class Config:
        populate_by_name = True


class WhatsAppResponse(BaseModel):
    """Resposta padrão do WhatsApp."""
    success: bool
    message: Optional[str] = None
    message_id: Optional[str] = None


class ConversationContext(BaseModel):
    """Contexto de uma conversa do WhatsApp."""
    phone_number: str
    name: Optional[str] = None
    ad_account_id: Optional[str] = None
    history: list[dict] = Field(default_factory=list)
    last_interaction: Optional[str] = None
