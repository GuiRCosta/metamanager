from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import uuid


class AlertType(str, Enum):
    BUDGET = "budget"
    PERFORMANCE = "performance"
    STATUS = "status"
    OPTIMIZATION = "optimization"


class AlertPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: AlertType
    priority: AlertPriority
    title: str
    message: str
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    ad_account_id: Optional[str] = None
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AlertResponse(BaseModel):
    id: str
    type: str
    priority: str
    title: str
    message: str
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    ad_account_id: Optional[str] = None
    read: bool
    created_at: str


class AlertListResponse(BaseModel):
    alerts: list[AlertResponse]
    total: int
    unread_count: int


class AlertUpdate(BaseModel):
    read: Optional[bool] = None


class CreateAlertRequest(BaseModel):
    type: AlertType
    priority: AlertPriority
    title: str
    message: str
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
