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


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    message: str
    agent_type: str
    suggestions: Optional[list[str]] = None


class AgentContext(BaseModel):
    user_id: str
    active_campaigns: int
    total_spend: float
    monthly_budget: float
    average_roas: Optional[float] = None
