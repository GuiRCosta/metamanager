import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.models.alert import (
    Alert,
    AlertListResponse,
    AlertResponse,
    AlertUpdate,
    CreateAlertRequest,
    AlertType,
    AlertPriority,
)
from app.services.alert_generator import run_alert_generation

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent / "data"
ALERTS_FILE = DATA_DIR / "alerts.json"


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


def alert_to_response(alert: dict) -> AlertResponse:
    return AlertResponse(
        id=alert["id"],
        type=alert["type"],
        priority=alert["priority"],
        title=alert["title"],
        message=alert["message"],
        campaign_id=alert.get("campaign_id"),
        campaign_name=alert.get("campaign_name"),
        read=alert.get("read", False),
        created_at=alert["created_at"],
    )


@router.get("", response_model=AlertListResponse)
async def get_alerts(
    type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    read: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all alerts with optional filtering"""
    alerts = load_alerts()

    # Apply filters
    if type:
        alerts = [a for a in alerts if a["type"] == type]
    if priority:
        alerts = [a for a in alerts if a["priority"] == priority]
    if read is not None:
        alerts = [a for a in alerts if a.get("read", False) == read]

    # Sort by created_at descending (newest first)
    alerts.sort(key=lambda x: x["created_at"], reverse=True)

    # Calculate unread count before limiting
    all_alerts = load_alerts()
    unread_count = sum(1 for a in all_alerts if not a.get("read", False))

    # Apply limit
    limited_alerts = alerts[:limit]

    return AlertListResponse(
        alerts=[alert_to_response(a) for a in limited_alerts],
        total=len(alerts),
        unread_count=unread_count,
    )


@router.get("/unread-count")
async def get_unread_count():
    """Get count of unread alerts"""
    alerts = load_alerts()
    unread_count = sum(1 for a in alerts if not a.get("read", False))
    return {"unread_count": unread_count}


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str):
    """Get a specific alert by ID"""
    alerts = load_alerts()
    alert = next((a for a in alerts if a["id"] == alert_id), None)

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return alert_to_response(alert)


@router.post("", response_model=AlertResponse)
async def create_alert(request: CreateAlertRequest):
    """Create a new alert"""
    alert = Alert(
        type=request.type,
        priority=request.priority,
        title=request.title,
        message=request.message,
        campaign_id=request.campaign_id,
        campaign_name=request.campaign_name,
    )

    alerts = load_alerts()
    alert_dict = alert.model_dump()
    alert_dict["created_at"] = alert.created_at.isoformat()
    alerts.append(alert_dict)
    save_alerts(alerts)

    return alert_to_response(alert_dict)


@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(alert_id: str, update: AlertUpdate):
    """Update an alert (e.g., mark as read)"""
    alerts = load_alerts()
    alert_index = next((i for i, a in enumerate(alerts) if a["id"] == alert_id), None)

    if alert_index is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    if update.read is not None:
        alerts[alert_index]["read"] = update.read

    save_alerts(alerts)
    return alert_to_response(alerts[alert_index])


@router.put("/mark-all-read", response_model=dict)
async def mark_all_read():
    """Mark all alerts as read"""
    alerts = load_alerts()
    for alert in alerts:
        alert["read"] = True
    save_alerts(alerts)
    return {"success": True, "updated": len(alerts)}


@router.delete("/{alert_id}")
async def delete_alert(alert_id: str):
    """Delete an alert"""
    alerts = load_alerts()
    alert_index = next((i for i, a in enumerate(alerts) if a["id"] == alert_id), None)

    if alert_index is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    deleted = alerts.pop(alert_index)
    save_alerts(alerts)
    return {"success": True, "deleted_id": deleted["id"]}


@router.delete("")
async def delete_all_alerts():
    """Delete all alerts"""
    save_alerts([])
    return {"success": True}


@router.post("/generate")
async def generate_alerts(campaigns: list[dict]):
    """
    Generate alerts based on campaign data.
    This endpoint is called after syncing campaigns.
    """
    new_count = run_alert_generation(campaigns)
    return {"success": True, "new_alerts": new_count}
