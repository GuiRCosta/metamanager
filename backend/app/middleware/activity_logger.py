import time
import sqlite3
import logging
from datetime import datetime
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent.parent.parent / "data" / "activity.db"

SKIP_PATHS = frozenset({"/", "/health", "/docs", "/openapi.json", "/redoc"})


def get_db_connection():
    """Creates a new SQLite connection with WAL mode for concurrent reads."""
    conn = sqlite3.connect(str(DB_PATH), timeout=5)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn


def init_activity_db():
    """Initialize the activity logs database and table."""
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            user_id TEXT,
            method TEXT NOT NULL,
            path TEXT NOT NULL,
            query_params TEXT,
            status_code INTEGER,
            response_time_ms REAL,
            error_detail TEXT,
            ip_address TEXT,
            user_agent TEXT
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_activity_timestamp
        ON activity_logs(timestamp DESC)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_activity_user_id
        ON activity_logs(user_id)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_activity_status_code
        ON activity_logs(status_code)
    """)
    conn.commit()
    conn.close()


class ActivityLoggerMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        init_activity_db()

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if path in SKIP_PATHS or not path.startswith("/api/"):
            return await call_next(request)

        start_time = time.time()
        user_id = request.query_params.get("user_id")
        error_detail = None
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception as e:
            error_detail = str(e)[:500]
            raise
        finally:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            self._save_log(
                user_id=user_id,
                method=request.method,
                path=path,
                query_params=str(dict(request.query_params)),
                status_code=status_code,
                response_time_ms=elapsed_ms,
                error_detail=error_detail,
                ip_address=request.client.host if request.client else None,
                user_agent=(request.headers.get("user-agent") or "")[:200],
            )

    @staticmethod
    def _save_log(**kwargs):
        """Persist a log entry to SQLite. Failures are silently logged."""
        try:
            conn = get_db_connection()
            conn.execute(
                """INSERT INTO activity_logs
                (timestamp, user_id, method, path, query_params,
                 status_code, response_time_ms, error_detail, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    datetime.utcnow().isoformat(),
                    kwargs["user_id"],
                    kwargs["method"],
                    kwargs["path"],
                    kwargs["query_params"],
                    kwargs["status_code"],
                    kwargs["response_time_ms"],
                    kwargs["error_detail"],
                    kwargs["ip_address"],
                    kwargs["user_agent"],
                ),
            )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.warning(f"Failed to save activity log: {e}")
