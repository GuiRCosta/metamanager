from pydantic import BaseModel
from typing import Optional
from enum import Enum


class OptimizationGoal(str, Enum):
    REACH = "REACH"
    LINK_CLICKS = "LINK_CLICKS"
    LANDING_PAGE_VIEWS = "LANDING_PAGE_VIEWS"
    IMPRESSIONS = "IMPRESSIONS"
    OFFSITE_CONVERSIONS = "OFFSITE_CONVERSIONS"
    LEAD_GENERATION = "LEAD_GENERATION"


class BillingEvent(str, Enum):
    IMPRESSIONS = "IMPRESSIONS"
    LINK_CLICKS = "LINK_CLICKS"


class AdSetCreate(BaseModel):
    name: str
    daily_budget: float
    optimization_goal: OptimizationGoal = OptimizationGoal.REACH
    billing_event: BillingEvent = BillingEvent.IMPRESSIONS
    targeting: Optional[dict] = None
    status: str = "PAUSED"


class AdSetUpdate(BaseModel):
    name: Optional[str] = None
    daily_budget: Optional[float] = None
    optimization_goal: Optional[OptimizationGoal] = None
    billing_event: Optional[BillingEvent] = None
    targeting: Optional[dict] = None
    status: Optional[str] = None


class AdSetResponse(BaseModel):
    id: str
    name: str
    status: str
    effective_status: Optional[str] = None
    daily_budget: Optional[str] = None
    targeting: Optional[dict] = None
    created_time: Optional[str] = None
    updated_time: Optional[str] = None


class AdSetListResponse(BaseModel):
    ad_sets: list[AdSetResponse]
    total: int
