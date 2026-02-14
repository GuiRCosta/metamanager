from fastapi import APIRouter, Query
from typing import Optional
from pydantic import BaseModel

from app.middleware.activity_logger import get_db_connection

router = APIRouter()


class ActivityLog(BaseModel):
    id: int
    timestamp: str
    user_id: Optional[str] = None
    method: str
    path: str
    query_params: Optional[str] = None
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    error_detail: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class LogsResponse(BaseModel):
    success: bool
    logs: list[ActivityLog]
    total: int
    page: int
    limit: int


class LogStatsResponse(BaseModel):
    success: bool
    total_requests: int
    error_count: int
    avg_response_time_ms: float
    active_users: list[dict]
    top_endpoints: list[dict]
    status_breakdown: list[dict]
    recent_errors: list[dict]


@router.get("", response_model=LogsResponse)
async def get_logs(
    user_id: Optional[str] = Query(None, description="Filtrar por user_id"),
    method: Optional[str] = Query(None, description="Filtrar por metodo HTTP"),
    status_min: Optional[int] = Query(None, description="Status code minimo"),
    status_max: Optional[int] = Query(None, description="Status code maximo"),
    path_contains: Optional[str] = Query(None, description="Filtrar por path"),
    from_date: Optional[str] = Query(None, description="Data inicio (ISO)"),
    to_date: Optional[str] = Query(None, description="Data fim (ISO)"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    errors_only: bool = Query(False, description="Apenas erros (status >= 400)"),
):
    """Lista activity logs com filtros."""
    conn = get_db_connection()

    conditions = []
    params = []

    if user_id:
        conditions.append("user_id = ?")
        params.append(user_id)
    if method:
        conditions.append("method = ?")
        params.append(method.upper())
    if status_min:
        conditions.append("status_code >= ?")
        params.append(status_min)
    if status_max:
        conditions.append("status_code <= ?")
        params.append(status_max)
    if path_contains:
        conditions.append("path LIKE ?")
        params.append(f"%{path_contains}%")
    if from_date:
        conditions.append("timestamp >= ?")
        params.append(from_date)
    if to_date:
        conditions.append("timestamp <= ?")
        params.append(to_date)
    if errors_only:
        conditions.append("status_code >= 400")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    count_row = conn.execute(
        f"SELECT COUNT(*) as cnt FROM activity_logs {where_clause}", params
    ).fetchone()
    total = count_row["cnt"] if count_row else 0

    offset = (page - 1) * limit
    rows = conn.execute(
        f"SELECT * FROM activity_logs {where_clause} ORDER BY timestamp DESC LIMIT ? OFFSET ?",
        [*params, limit, offset],
    ).fetchall()

    conn.close()

    logs = [ActivityLog(**dict(row)) for row in rows]

    return LogsResponse(
        success=True,
        logs=logs,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/stats", response_model=LogStatsResponse)
async def get_log_stats(
    hours: int = Query(24, ge=1, le=168, description="Ultimas N horas"),
):
    """Estatisticas dos activity logs."""
    conn = get_db_connection()

    time_filter = f"timestamp >= datetime('now', '-{hours} hours')"

    total = conn.execute(
        f"SELECT COUNT(*) as cnt FROM activity_logs WHERE {time_filter}"
    ).fetchone()["cnt"]

    error_count = conn.execute(
        f"SELECT COUNT(*) as cnt FROM activity_logs WHERE {time_filter} AND status_code >= 400"
    ).fetchone()["cnt"]

    avg_time = conn.execute(
        f"SELECT COALESCE(AVG(response_time_ms), 0) as avg_ms FROM activity_logs WHERE {time_filter}"
    ).fetchone()["avg_ms"]

    active_users = conn.execute(
        f"""SELECT user_id, COUNT(*) as request_count,
            MAX(timestamp) as last_seen
            FROM activity_logs
            WHERE {time_filter} AND user_id IS NOT NULL
            GROUP BY user_id
            ORDER BY request_count DESC""",
    ).fetchall()

    top_endpoints = conn.execute(
        f"""SELECT path, method, COUNT(*) as count,
            ROUND(AVG(response_time_ms), 2) as avg_time_ms,
            SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
            FROM activity_logs
            WHERE {time_filter}
            GROUP BY path, method
            ORDER BY count DESC
            LIMIT 20""",
    ).fetchall()

    status_breakdown = conn.execute(
        f"""SELECT
            CASE
                WHEN status_code >= 500 THEN '5xx'
                WHEN status_code >= 400 THEN '4xx'
                WHEN status_code >= 300 THEN '3xx'
                WHEN status_code >= 200 THEN '2xx'
                ELSE 'other'
            END as status_group,
            COUNT(*) as count
            FROM activity_logs
            WHERE {time_filter}
            GROUP BY status_group
            ORDER BY count DESC""",
    ).fetchall()

    recent_errors = conn.execute(
        f"""SELECT timestamp, user_id, method, path, status_code,
            response_time_ms, error_detail
            FROM activity_logs
            WHERE {time_filter} AND status_code >= 400
            ORDER BY timestamp DESC
            LIMIT 20""",
    ).fetchall()

    conn.close()

    return LogStatsResponse(
        success=True,
        total_requests=total,
        error_count=error_count,
        avg_response_time_ms=round(avg_time, 2),
        active_users=[dict(row) for row in active_users],
        top_endpoints=[dict(row) for row in top_endpoints],
        status_breakdown=[dict(row) for row in status_breakdown],
        recent_errors=[dict(row) for row in recent_errors],
    )
