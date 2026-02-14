"""
Admin API endpoints for superadmin monitoring.

Provides:
- Users health overview (Meta connection status, activity stats, error counts)
- Log cleanup (delete old logs)
"""

import json
import re
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.middleware.activity_logger import get_db_connection

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent / "data"


class UserHealth(BaseModel):
    user_id: str
    has_meta_token: bool
    has_ad_account: bool
    ad_account_id: Optional[str] = None
    has_evolution: bool
    total_requests: int
    error_count: int
    last_activity: Optional[str] = None
    last_error: Optional[str] = None
    last_error_detail: Optional[str] = None


class UsersHealthResponse(BaseModel):
    success: bool
    users: list[UserHealth]


class LogCleanupResponse(BaseModel):
    success: bool
    deleted_count: int
    remaining_count: int


def get_all_user_settings() -> list[dict]:
    """Scan data dir for all per-user settings files."""
    users = []
    if not DATA_DIR.exists():
        return users

    for path in DATA_DIR.glob("settings_*.json"):
        match = re.match(r"settings_(.+)\.json$", path.name)
        if not match:
            continue

        user_id = match.group(1)
        try:
            with open(path, "r", encoding="utf-8") as f:
                settings = json.load(f)
        except (json.JSONDecodeError, OSError):
            settings = {}

        meta_api = settings.get("meta_api", {})
        evolution = settings.get("evolution", {})

        users.append({
            "user_id": user_id,
            "has_meta_token": bool(meta_api.get("access_token", "")),
            "has_ad_account": bool(meta_api.get("ad_account_id", "")),
            "ad_account_id": meta_api.get("ad_account_id", "") or None,
            "has_evolution": bool(
                evolution.get("enabled", False)
                and evolution.get("api_url", "")
                and evolution.get("api_key", "")
            ),
        })

    return users


@router.get("/users-health", response_model=UsersHealthResponse)
async def get_users_health(
    hours: int = Query(24, ge=1, le=720, description="Period in hours for activity stats"),
):
    """
    Returns health data for all registered users.
    Combines settings files analysis with activity log stats.
    """
    user_settings = get_all_user_settings()

    conn = get_db_connection()
    time_filter = f"timestamp >= datetime('now', '-{hours} hours')"

    # Get per-user activity stats
    activity_stats = conn.execute(
        f"""SELECT user_id,
            COUNT(*) as total_requests,
            SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
            MAX(timestamp) as last_activity
            FROM activity_logs
            WHERE {time_filter} AND user_id IS NOT NULL
            GROUP BY user_id"""
    ).fetchall()

    stats_map = {
        row["user_id"]: {
            "total_requests": row["total_requests"],
            "error_count": row["error_count"],
            "last_activity": row["last_activity"],
        }
        for row in activity_stats
    }

    # Get last error per user
    error_rows = conn.execute(
        f"""SELECT user_id, timestamp, error_detail
            FROM activity_logs
            WHERE {time_filter} AND status_code >= 400 AND user_id IS NOT NULL
            AND timestamp IN (
                SELECT MAX(timestamp) FROM activity_logs
                WHERE {time_filter} AND status_code >= 400 AND user_id IS NOT NULL
                GROUP BY user_id
            )"""
    ).fetchall()

    error_map = {
        row["user_id"]: {
            "last_error": row["timestamp"],
            "last_error_detail": row["error_detail"],
        }
        for row in error_rows
    }

    conn.close()

    # Merge settings + activity data
    users_health = []
    seen_user_ids = set()

    for user_data in user_settings:
        uid = user_data["user_id"]
        seen_user_ids.add(uid)
        activity = stats_map.get(uid, {})
        errors = error_map.get(uid, {})

        users_health.append(UserHealth(
            user_id=uid,
            has_meta_token=user_data["has_meta_token"],
            has_ad_account=user_data["has_ad_account"],
            ad_account_id=user_data["ad_account_id"],
            has_evolution=user_data["has_evolution"],
            total_requests=activity.get("total_requests", 0),
            error_count=activity.get("error_count", 0),
            last_activity=activity.get("last_activity"),
            last_error=errors.get("last_error"),
            last_error_detail=errors.get("last_error_detail"),
        ))

    # Also include users with activity but no settings file
    for uid, activity in stats_map.items():
        if uid not in seen_user_ids:
            errors = error_map.get(uid, {})
            users_health.append(UserHealth(
                user_id=uid,
                has_meta_token=False,
                has_ad_account=False,
                has_evolution=False,
                total_requests=activity["total_requests"],
                error_count=activity["error_count"],
                last_activity=activity["last_activity"],
                last_error=errors.get("last_error"),
                last_error_detail=errors.get("last_error_detail"),
            ))

    # Sort by total requests descending
    users_health.sort(key=lambda u: u.total_requests, reverse=True)

    return UsersHealthResponse(success=True, users=users_health)


@router.delete("/logs-cleanup", response_model=LogCleanupResponse)
async def cleanup_old_logs(
    days: int = Query(30, ge=1, le=365, description="Delete logs older than N days"),
):
    """
    Delete activity logs older than the specified number of days.
    Returns the count of deleted and remaining logs.
    """
    conn = get_db_connection()

    count_before = conn.execute(
        "SELECT COUNT(*) as cnt FROM activity_logs"
    ).fetchone()["cnt"]

    conn.execute(
        f"DELETE FROM activity_logs WHERE timestamp < datetime('now', '-{days} days')"
    )
    conn.commit()

    count_after = conn.execute(
        "SELECT COUNT(*) as cnt FROM activity_logs"
    ).fetchone()["cnt"]

    conn.close()

    deleted = count_before - count_after

    return LogCleanupResponse(
        success=True,
        deleted_count=deleted,
        remaining_count=count_after,
    )
