from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader

from app.config import get_settings

_api_key_header = APIKeyHeader(name="X-Admin-Key", auto_error=False)


async def require_admin_key(
    api_key: str | None = Security(_api_key_header),
) -> str:
    """Validate the admin API key from the X-Admin-Key header."""
    settings = get_settings()

    if not settings.admin_api_key:
        raise HTTPException(
            status_code=503,
            detail="Admin API key not configured on server",
        )

    if not api_key or api_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Invalid or missing admin key")

    return api_key
