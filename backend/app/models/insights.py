from pydantic import BaseModel
from typing import Optional
from datetime import date


class MetricData(BaseModel):
    date: date
    spend: float
    impressions: int
    clicks: int
    conversions: int
    ctr: Optional[float] = None
    cpc: Optional[float] = None
    roas: Optional[float] = None


class CampaignInsights(BaseModel):
    campaign_id: str
    campaign_name: str
    date_start: date
    date_stop: date
    spend: float
    impressions: int
    clicks: int
    conversions: int
    ctr: float
    cpc: float
    roas: Optional[float] = None


class DashboardMetrics(BaseModel):
    total_spend: float
    total_impressions: int
    total_clicks: int
    total_conversions: int
    average_ctr: float
    average_cpc: float
    average_roas: Optional[float] = None
    active_campaigns: int
    paused_campaigns: int


class SpendSummary(BaseModel):
    period: str
    total_spend: float
    budget_limit: float
    percentage_used: float
    projected_monthly: float
    daily_average: float
