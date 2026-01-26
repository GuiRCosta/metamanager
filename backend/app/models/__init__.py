"""
Modelos da aplicação.
"""

from app.models.campaign import (
    CampaignStatus,
    CampaignObjective,
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignListResponse,
)
from app.models.adset import (
    OptimizationGoal,
    BillingEvent,
    AdSetCreate,
    AdSetUpdate,
    AdSetResponse,
    AdSetListResponse,
)
from app.models.ad import (
    AdCreate,
    AdUpdate,
    AdCreative,
    AdInsights,
    AdResponse,
    AdListResponse,
)
from app.models.insights import (
    MetricData,
    CampaignInsights,
    DashboardMetrics,
    SpendSummary,
)
from app.models.alert import (
    Alert,
    AlertType,
    AlertPriority,
    AlertResponse,
    AlertListResponse,
    AlertUpdate,
    CreateAlertRequest,
)
from app.models.chat import (
    MessageRole,
    ChatMessage,
    ChatContext,
    ChatRequest,
    ChatResponse,
    AgentContext,
)
from app.models.whatsapp import (
    MessageType,
    WebhookEvent,
    WebhookMessage,
    ConversationContext,
    WhatsAppResponse,
)

__all__ = [
    # Campaign
    "CampaignStatus",
    "CampaignObjective",
    "CampaignCreate",
    "CampaignUpdate",
    "CampaignResponse",
    "CampaignListResponse",
    # AdSet
    "OptimizationGoal",
    "BillingEvent",
    "AdSetCreate",
    "AdSetUpdate",
    "AdSetResponse",
    "AdSetListResponse",
    # Ad
    "AdCreate",
    "AdUpdate",
    "AdCreative",
    "AdInsights",
    "AdResponse",
    "AdListResponse",
    # Insights
    "MetricData",
    "CampaignInsights",
    "DashboardMetrics",
    "SpendSummary",
    # Alert
    "Alert",
    "AlertType",
    "AlertPriority",
    "AlertResponse",
    "AlertListResponse",
    "AlertUpdate",
    "CreateAlertRequest",
    # Chat
    "MessageRole",
    "ChatMessage",
    "ChatContext",
    "ChatRequest",
    "ChatResponse",
    "AgentContext",
    # WhatsApp
    "MessageType",
    "WebhookEvent",
    "WebhookMessage",
    "ConversationContext",
    "WhatsAppResponse",
]
