from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.models.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignListResponse,
    CampaignStatus,
)
from app.models.insights import CampaignInsights
from app.tools.meta_api import MetaAPI

router = APIRouter()
meta_api = MetaAPI()


@router.get("", response_model=CampaignListResponse)
async def list_campaigns(
    status: Optional[CampaignStatus] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    """Lista todas as campanhas do usuário."""
    try:
        campaigns = await meta_api.get_campaigns()

        if status:
            campaigns = [c for c in campaigns if c.get("status") == status.value]

        total = len(campaigns)
        start = (page - 1) * limit
        end = start + limit
        paginated = campaigns[start:end]

        return CampaignListResponse(
            campaigns=[
                CampaignResponse(
                    id=c["id"],
                    meta_id=c["id"],
                    name=c["name"],
                    objective=c.get("objective", "UNKNOWN"),
                    status=CampaignStatus(c.get("status", "PAUSED")),
                    daily_budget=c.get("daily_budget"),
                    lifetime_budget=c.get("lifetime_budget"),
                    created_at=c.get("created_time"),
                    updated_at=c.get("updated_time"),
                )
                for c in paginated
            ],
            total=total,
            page=page,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: str):
    """Obtém detalhes de uma campanha específica."""
    try:
        campaign = await meta_api.get_campaign(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campanha não encontrada")

        return CampaignResponse(
            id=campaign["id"],
            meta_id=campaign["id"],
            name=campaign["name"],
            objective=campaign.get("objective", "UNKNOWN"),
            status=CampaignStatus(campaign.get("status", "PAUSED")),
            daily_budget=campaign.get("daily_budget"),
            lifetime_budget=campaign.get("lifetime_budget"),
            created_at=campaign.get("created_time"),
            updated_at=campaign.get("updated_time"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=CampaignResponse)
async def create_campaign(campaign: CampaignCreate):
    """Cria uma nova campanha."""
    try:
        result = await meta_api.create_campaign(
            name=campaign.name,
            objective=campaign.objective.value,
            status=campaign.status.value,
            daily_budget=campaign.daily_budget,
        )

        return CampaignResponse(
            id=result["id"],
            meta_id=result["id"],
            name=campaign.name,
            objective=campaign.objective.value,
            status=campaign.status,
            daily_budget=campaign.daily_budget,
            lifetime_budget=campaign.lifetime_budget,
            created_at=result.get("created_time"),
            updated_at=result.get("updated_time"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(campaign_id: str, campaign: CampaignUpdate):
    """Atualiza uma campanha existente."""
    try:
        update_data = campaign.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

        result = await meta_api.update_campaign(campaign_id, update_data)

        updated = await meta_api.get_campaign(campaign_id)
        return CampaignResponse(
            id=updated["id"],
            meta_id=updated["id"],
            name=updated["name"],
            objective=updated.get("objective", "UNKNOWN"),
            status=CampaignStatus(updated.get("status", "PAUSED")),
            daily_budget=updated.get("daily_budget"),
            lifetime_budget=updated.get("lifetime_budget"),
            created_at=updated.get("created_time"),
            updated_at=updated.get("updated_time"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    """Arquiva uma campanha (soft delete)."""
    try:
        await meta_api.delete_campaign(campaign_id)
        return {"message": "Campanha arquivada com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}/insights", response_model=CampaignInsights)
async def get_campaign_insights(
    campaign_id: str,
    date_preset: str = Query("last_7d", regex="^(today|yesterday|last_7d|last_30d)$"),
):
    """Obtém métricas de uma campanha."""
    try:
        insights = await meta_api.get_campaign_insights(campaign_id, date_preset)
        if not insights:
            raise HTTPException(status_code=404, detail="Métricas não encontradas")

        return CampaignInsights(**insights)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
