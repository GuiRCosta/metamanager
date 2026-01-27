from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str


class ChatContext(BaseModel):
    """Contexto enviado junto com mensagens do chat."""
    ad_account_id: Optional[str] = None
    history: Optional[list[dict]] = None  # Histórico de mensagens anteriores


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    context: Optional[ChatContext] = None
    ad_account_id: Optional[str] = None  # Atalho para contexto de conta
    confirmed_action: Optional[str] = None  # Ação confirmada pelo usuário


class ChatResponse(BaseModel):
    message: str
    agent_type: str
    suggestions: Optional[list[str]] = None
    requires_confirmation: bool = False
    pending_action: Optional[str] = None


class AgentContext(BaseModel):
    user_id: str
    active_campaigns: int
    total_spend: float
    monthly_budget: float
    average_roas: Optional[float] = None
