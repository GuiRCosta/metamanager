from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.tools.meta_api import MetaAPI

router = APIRouter()
meta_api = MetaAPI()


class SyncResponse(BaseModel):
    success: bool
    campaigns_synced: int
    metrics_synced: int
    errors: Optional[list[str]] = None


@router.post("", response_model=SyncResponse)
async def sync_all():
    """Sincroniza campanhas e métricas do Meta."""
    try:
        campaigns = await meta_api.get_campaigns()
        campaigns_count = len(campaigns)

        metrics_count = 0
        errors = []

        for campaign in campaigns:
            try:
                await meta_api.get_campaign_insights(campaign["id"], "last_7d")
                metrics_count += 1
            except Exception as e:
                errors.append(f"Erro ao sincronizar métricas de {campaign['name']}: {str(e)}")

        return SyncResponse(
            success=True,
            campaigns_synced=campaigns_count,
            metrics_synced=metrics_count,
            errors=errors if errors else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/campaigns")
async def sync_campaigns():
    """Sincroniza apenas as campanhas."""
    try:
        campaigns = await meta_api.get_campaigns()
        return {
            "success": True,
            "campaigns_synced": len(campaigns),
            "campaigns": campaigns,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/metrics")
async def sync_metrics(campaign_id: Optional[str] = None):
    """Sincroniza métricas (todas ou de uma campanha específica)."""
    try:
        if campaign_id:
            insights = await meta_api.get_campaign_insights(campaign_id, "last_30d")
            return {"success": True, "metrics": insights}

        campaigns = await meta_api.get_campaigns()
        all_metrics = []

        for campaign in campaigns:
            try:
                insights = await meta_api.get_campaign_insights(campaign["id"], "last_30d")
                all_metrics.append(insights)
            except Exception:
                continue

        return {"success": True, "metrics_synced": len(all_metrics), "metrics": all_metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_sync_status():
    """Obtém o status da última sincronização."""
    return {
        "last_sync": None,
        "status": "pending",
        "message": "Sincronização não realizada ainda",
    }
