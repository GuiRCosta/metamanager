"""
Alert Generation Service

Analyzes campaigns and generates alerts based on:
- Budget thresholds (50%, 80%, 90%, 100%)
- Performance metrics (low CTR, high CPC, low conversions)
- Status changes
- Optimization opportunities
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from app.models.alert import Alert, AlertType, AlertPriority

DATA_DIR = Path(__file__).parent.parent.parent / "data"
ALERTS_FILE = DATA_DIR / "alerts.json"
SETTINGS_FILE = DATA_DIR / "settings.json"


def ensure_data_dir():
    DATA_DIR.mkdir(exist_ok=True)


def load_alerts() -> list[dict]:
    ensure_data_dir()
    if ALERTS_FILE.exists():
        with open(ALERTS_FILE, "r") as f:
            return json.load(f)
    return []


def save_alerts(alerts: list[dict]):
    ensure_data_dir()
    with open(ALERTS_FILE, "w") as f:
        json.dump(alerts, f, indent=2, default=str)


def load_settings() -> dict:
    if SETTINGS_FILE.exists():
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    return {}


def alert_exists(alerts: list[dict], alert_type: str, campaign_id: Optional[str], title: str) -> bool:
    """Check if a similar unread alert already exists"""
    for alert in alerts:
        if (
            alert["type"] == alert_type
            and alert.get("campaign_id") == campaign_id
            and alert["title"] == title
            and not alert.get("read", False)
        ):
            return True
    return False


def create_alert(
    alert_type: AlertType,
    priority: AlertPriority,
    title: str,
    message: str,
    campaign_id: Optional[str] = None,
    campaign_name: Optional[str] = None,
) -> dict:
    """Create a new alert dict"""
    alert = Alert(
        type=alert_type,
        priority=priority,
        title=title,
        message=message,
        campaign_id=campaign_id,
        campaign_name=campaign_name,
    )
    alert_dict = alert.model_dump()
    alert_dict["created_at"] = alert.created_at.isoformat()
    return alert_dict


def generate_budget_alerts(campaigns: list[dict], settings: dict) -> list[dict]:
    """Generate alerts for budget thresholds"""
    new_alerts = []
    alerts = load_alerts()

    budget_settings = settings.get("budget", {})
    daily_limit = budget_settings.get("daily_limit", 1000)
    alert_threshold = budget_settings.get("alert_threshold", 80)

    # Calculate total daily spend
    total_daily_budget = sum(
        c.get("daily_budget", 0) / 100 if c.get("daily_budget") else 0
        for c in campaigns
        if c.get("status") == "ACTIVE"
    )

    if daily_limit > 0:
        usage_percent = (total_daily_budget / daily_limit) * 100

        # Critical: Over 100%
        if usage_percent >= 100:
            title = "Orçamento diário excedido"
            if not alert_exists(alerts, "budget", None, title):
                new_alerts.append(
                    create_alert(
                        AlertType.BUDGET,
                        AlertPriority.CRITICAL,
                        title,
                        f"O orçamento diário total (R$ {total_daily_budget:.2f}) excedeu o limite de R$ {daily_limit:.2f}.",
                    )
                )

        # High: Over 90%
        elif usage_percent >= 90:
            title = "Orçamento diário em 90%"
            if not alert_exists(alerts, "budget", None, title):
                new_alerts.append(
                    create_alert(
                        AlertType.BUDGET,
                        AlertPriority.HIGH,
                        title,
                        f"O orçamento diário está em {usage_percent:.0f}% do limite (R$ {total_daily_budget:.2f} de R$ {daily_limit:.2f}).",
                    )
                )

        # Medium: Over threshold (default 80%)
        elif usage_percent >= alert_threshold:
            title = f"Orçamento diário em {usage_percent:.0f}%"
            if not alert_exists(alerts, "budget", None, title):
                new_alerts.append(
                    create_alert(
                        AlertType.BUDGET,
                        AlertPriority.MEDIUM,
                        title,
                        f"O orçamento diário atingiu {usage_percent:.0f}% do limite configurado.",
                    )
                )

    return new_alerts


def generate_performance_alerts(campaigns: list[dict]) -> list[dict]:
    """Generate alerts for performance issues"""
    new_alerts = []
    alerts = load_alerts()

    for campaign in campaigns:
        if campaign.get("status") != "ACTIVE":
            continue

        campaign_id = campaign.get("id")
        campaign_name = campaign.get("name", "Campanha")
        insights = campaign.get("insights", {})

        if not insights:
            continue

        # Low CTR alert (below 1%)
        ctr = insights.get("ctr", 0)
        if ctr and float(ctr) < 1.0:
            title = f"CTR baixo: {campaign_name}"
            if not alert_exists(alerts, "performance", campaign_id, title):
                new_alerts.append(
                    create_alert(
                        AlertType.PERFORMANCE,
                        AlertPriority.MEDIUM,
                        title,
                        f"A campanha está com CTR de {float(ctr):.2f}%, abaixo do recomendado (1%).",
                        campaign_id,
                        campaign_name,
                    )
                )

        # High CPC alert (above R$ 5.00)
        cpc = insights.get("cpc", 0)
        if cpc and float(cpc) > 5.0:
            title = f"CPC elevado: {campaign_name}"
            if not alert_exists(alerts, "performance", campaign_id, title):
                new_alerts.append(
                    create_alert(
                        AlertType.PERFORMANCE,
                        AlertPriority.HIGH,
                        title,
                        f"O custo por clique está em R$ {float(cpc):.2f}, acima do ideal.",
                        campaign_id,
                        campaign_name,
                    )
                )

        # Low impressions alert (campaign active but no impressions)
        impressions = insights.get("impressions", 0)
        spend = insights.get("spend", 0)
        if spend and float(spend) > 0 and int(impressions) == 0:
            title = f"Sem impressões: {campaign_name}"
            if not alert_exists(alerts, "performance", campaign_id, title):
                new_alerts.append(
                    create_alert(
                        AlertType.PERFORMANCE,
                        AlertPriority.CRITICAL,
                        title,
                        "A campanha está gastando mas não está gerando impressões. Verifique a segmentação.",
                        campaign_id,
                        campaign_name,
                    )
                )

    return new_alerts


def generate_optimization_alerts(campaigns: list[dict]) -> list[dict]:
    """Generate alerts for optimization opportunities"""
    new_alerts = []
    alerts = load_alerts()

    # Check for paused campaigns with good performance
    for campaign in campaigns:
        if campaign.get("status") != "PAUSED":
            continue

        campaign_id = campaign.get("id")
        campaign_name = campaign.get("name", "Campanha")
        insights = campaign.get("insights", {})

        if not insights:
            continue

        ctr = insights.get("ctr", 0)
        if ctr and float(ctr) > 2.0:
            title = f"Reativar campanha: {campaign_name}"
            if not alert_exists(alerts, "optimization", campaign_id, title):
                new_alerts.append(
                    create_alert(
                        AlertType.OPTIMIZATION,
                        AlertPriority.LOW,
                        title,
                        f"Esta campanha pausada tinha CTR de {float(ctr):.2f}%. Considere reativá-la.",
                        campaign_id,
                        campaign_name,
                    )
                )

    # Check for campaigns without A/B testing
    active_campaigns = [c for c in campaigns if c.get("status") == "ACTIVE"]
    if len(active_campaigns) >= 3:
        title = "Oportunidade de A/B testing"
        if not alert_exists(alerts, "optimization", None, title):
            new_alerts.append(
                create_alert(
                    AlertType.OPTIMIZATION,
                    AlertPriority.LOW,
                    title,
                    f"Você tem {len(active_campaigns)} campanhas ativas. Considere fazer testes A/B para otimizar resultados.",
                )
            )

    return new_alerts


def generate_status_alerts(campaigns: list[dict], previous_campaigns: Optional[list[dict]] = None) -> list[dict]:
    """Generate alerts for status changes"""
    new_alerts = []

    if not previous_campaigns:
        return new_alerts

    alerts = load_alerts()
    prev_status_map = {c["id"]: c.get("status") for c in previous_campaigns}

    for campaign in campaigns:
        campaign_id = campaign.get("id")
        campaign_name = campaign.get("name", "Campanha")
        current_status = campaign.get("status")
        previous_status = prev_status_map.get(campaign_id)

        if previous_status and previous_status != current_status:
            # Campaign was active and is now paused/archived
            if previous_status == "ACTIVE" and current_status in ["PAUSED", "ARCHIVED"]:
                title = f"Campanha pausada: {campaign_name}"
                if not alert_exists(alerts, "status", campaign_id, title):
                    new_alerts.append(
                        create_alert(
                            AlertType.STATUS,
                            AlertPriority.MEDIUM,
                            title,
                            f"A campanha foi alterada de Ativa para {current_status}.",
                            campaign_id,
                            campaign_name,
                        )
                    )

    return new_alerts


def run_alert_generation(campaigns: list[dict], previous_campaigns: Optional[list[dict]] = None) -> int:
    """
    Run all alert generators and save new alerts.
    Returns the number of new alerts created.
    """
    settings = load_settings()
    alerts = load_alerts()

    new_alerts = []

    # Generate all types of alerts
    new_alerts.extend(generate_budget_alerts(campaigns, settings))
    new_alerts.extend(generate_performance_alerts(campaigns))
    new_alerts.extend(generate_optimization_alerts(campaigns))
    new_alerts.extend(generate_status_alerts(campaigns, previous_campaigns))

    if new_alerts:
        alerts.extend(new_alerts)
        save_alerts(alerts)

    return len(new_alerts)
