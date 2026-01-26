from pydantic import BaseModel, Field
from typing import Optional


class BudgetAlerts(BaseModel):
    alert_50: bool = True
    alert_80: bool = True
    alert_100: bool = True
    projection_excess: bool = True


class BudgetSettings(BaseModel):
    monthly_budget: float = Field(default=5000, ge=0)
    alerts: BudgetAlerts = Field(default_factory=BudgetAlerts)


class MetaApiSettings(BaseModel):
    access_token: Optional[str] = None
    business_id: Optional[str] = None


class NotificationSettings(BaseModel):
    daily_reports: bool = True
    immediate_alerts: bool = True
    optimization_suggestions: bool = True
    status_changes: bool = True
    report_time: str = "09:00"


class GoalsSettings(BaseModel):
    conversion_goal: Optional[int] = None
    roas_goal: Optional[float] = None
    cpc_max: Optional[float] = None
    ctr_min: Optional[float] = None


class EvolutionSettings(BaseModel):
    """Configurações da Evolution API (WhatsApp)."""
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    instance: Optional[str] = None
    webhook_secret: Optional[str] = None
    enabled: bool = False
    allowed_numbers: list[str] = Field(default_factory=list)  # Números permitidos


class Settings(BaseModel):
    budget: BudgetSettings = Field(default_factory=BudgetSettings)
    meta_api: MetaApiSettings = Field(default_factory=MetaApiSettings)
    notifications: NotificationSettings = Field(default_factory=NotificationSettings)
    goals: GoalsSettings = Field(default_factory=GoalsSettings)
    evolution: EvolutionSettings = Field(default_factory=EvolutionSettings)


class SettingsUpdate(BaseModel):
    budget: Optional[BudgetSettings] = None
    meta_api: Optional[MetaApiSettings] = None
    notifications: Optional[NotificationSettings] = None
    goals: Optional[GoalsSettings] = None
    evolution: Optional[EvolutionSettings] = None


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    accounts_found: Optional[int] = None
