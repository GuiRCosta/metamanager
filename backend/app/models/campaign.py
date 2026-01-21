from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class CampaignStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    ARCHIVED = "ARCHIVED"
    DRAFT = "DRAFT"


class CampaignObjective(str, Enum):
    OUTCOME_TRAFFIC = "OUTCOME_TRAFFIC"
    OUTCOME_LEADS = "OUTCOME_LEADS"
    OUTCOME_SALES = "OUTCOME_SALES"
    OUTCOME_ENGAGEMENT = "OUTCOME_ENGAGEMENT"
    OUTCOME_AWARENESS = "OUTCOME_AWARENESS"
    OUTCOME_APP_PROMOTION = "OUTCOME_APP_PROMOTION"


class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    objective: CampaignObjective
    daily_budget: Optional[float] = Field(None, ge=0)
    lifetime_budget: Optional[float] = Field(None, ge=0)
    status: CampaignStatus = CampaignStatus.PAUSED


class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    objective: Optional[CampaignObjective] = None
    daily_budget: Optional[float] = Field(None, ge=0)
    lifetime_budget: Optional[float] = Field(None, ge=0)
    status: Optional[CampaignStatus] = None


class CampaignResponse(BaseModel):
    id: str
    meta_id: str
    name: str
    objective: str
    status: CampaignStatus
    daily_budget: Optional[float] = None
    lifetime_budget: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CampaignListResponse(BaseModel):
    campaigns: list[CampaignResponse]
    total: int
    page: int
    limit: int
