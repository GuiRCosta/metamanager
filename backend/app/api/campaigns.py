from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import logging

from app.models.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignListResponse,
    CampaignStatus,
)
from app.models.insights import CampaignInsights
from app.models.adset import AdSetResponse, AdSetListResponse, AdSetCreate, AdSetUpdate
from app.models.ad import AdResponse, AdListResponse, AdCreative, AdInsights, AdCreate, AdUpdate
from app.tools.meta_api import MetaAPI, MetaAPIError

router = APIRouter()

# Mapeamento de objetivos legados para novos (ODAX)
# https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group#objectives
LEGACY_OBJECTIVE_MAPPING = {
    # Objetivos antigos -> Novos (ODAX)
    "BRAND_AWARENESS": "OUTCOME_AWARENESS",
    "REACH": "OUTCOME_AWARENESS",
    "LINK_CLICKS": "OUTCOME_TRAFFIC",
    "POST_ENGAGEMENT": "OUTCOME_ENGAGEMENT",
    "PAGE_LIKES": "OUTCOME_ENGAGEMENT",
    "EVENT_RESPONSES": "OUTCOME_ENGAGEMENT",
    "VIDEO_VIEWS": "OUTCOME_ENGAGEMENT",
    "LEAD_GENERATION": "OUTCOME_LEADS",
    "MESSAGES": "OUTCOME_LEADS",
    "CONVERSIONS": "OUTCOME_SALES",
    "PRODUCT_CATALOG_SALES": "OUTCOME_SALES",
    "STORE_VISITS": "OUTCOME_TRAFFIC",
    "APP_INSTALLS": "OUTCOME_APP_PROMOTION",
    "TRAFFIC": "OUTCOME_TRAFFIC",
}


def normalize_objective(objective: str) -> str:
    """Converte objetivos legados para o formato ODAX."""
    if objective.startswith("OUTCOME_"):
        return objective
    return LEGACY_OBJECTIVE_MAPPING.get(objective, "OUTCOME_TRAFFIC")


def get_meta_api(ad_account_id: Optional[str] = None, user_id: Optional[str] = None) -> MetaAPI:
    """Retorna uma instância do MetaAPI com a conta especificada."""
    return MetaAPI(ad_account_id=ad_account_id, user_id=user_id)


@router.get("", response_model=CampaignListResponse)
async def list_campaigns(
    status: Optional[CampaignStatus] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    user_id: Optional[str] = Query(None),
):
    """Lista todas as campanhas do usuário."""
    try:
        meta_api = get_meta_api(ad_account_id, user_id=user_id)
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
    except MetaAPIError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: str, user_id: Optional[str] = Query(None)):
    """Obtém detalhes de uma campanha específica."""
    try:
        meta_api = get_meta_api(user_id=user_id)
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
    except MetaAPIError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=CampaignResponse)
async def create_campaign(
    campaign: CampaignCreate,
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    user_id: Optional[str] = Query(None),
):
    """Cria uma nova campanha."""
    try:
        meta_api = get_meta_api(ad_account_id, user_id=user_id)
        result = await meta_api.create_campaign(
            name=campaign.name,
            objective=campaign.objective.value,
            status=campaign.status.value,
            daily_budget=campaign.daily_budget,
        )

        created = await meta_api.get_campaign(result["id"])
        return CampaignResponse(
            id=created["id"],
            meta_id=created["id"],
            name=created["name"],
            objective=created.get("objective", campaign.objective.value),
            status=CampaignStatus(created.get("status", campaign.status.value)),
            daily_budget=created.get("daily_budget"),
            lifetime_budget=created.get("lifetime_budget"),
            created_at=created.get("created_time"),
            updated_at=created.get("updated_time"),
        )
    except MetaAPIError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(campaign_id: str, campaign: CampaignUpdate, user_id: Optional[str] = Query(None)):
    """Atualiza uma campanha existente."""
    try:
        meta_api = get_meta_api(user_id=user_id)
        update_data = campaign.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

        await meta_api.update_campaign(campaign_id, update_data)

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
    except MetaAPIError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, user_id: Optional[str] = Query(None)):
    """Arquiva uma campanha (soft delete)."""
    try:
        meta_api = get_meta_api(user_id=user_id)
        await meta_api.delete_campaign(campaign_id)
        return {"message": "Campanha arquivada com sucesso"}
    except MetaAPIError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DuplicateResponse(CampaignListResponse):
    """Response for duplicate endpoint that can return multiple campaigns."""
    pass


@router.post("/{campaign_id}/duplicate", response_model=DuplicateResponse)
async def duplicate_campaign(
    campaign_id: str,
    count: int = Query(1, ge=1, le=10, description="Número de cópias a criar"),
    include_ads: bool = Query(True, description="Incluir ad sets e ads na duplicação"),
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    user_id: Optional[str] = Query(None),
):
    """Duplica uma campanha existente, incluindo ad sets e ads."""
    try:
        meta_api = get_meta_api(ad_account_id, user_id=user_id)
        original = await meta_api.get_campaign(campaign_id)
        if not original:
            raise HTTPException(status_code=404, detail="Campanha não encontrada")

        daily_budget = None
        if original.get("daily_budget"):
            daily_budget = int(original["daily_budget"]) / 100

        # Copiar special_ad_categories da campanha original
        special_ad_categories = original.get("special_ad_categories", [])

        # Normalizar objetivo para formato ODAX (novos objetivos)
        original_objective = original.get("objective", "OUTCOME_TRAFFIC")
        normalized_objective = normalize_objective(original_objective)

        # Log dos parâmetros originais para debug
        logging.info(f"Original campaign: objective={original_objective} -> {normalized_objective}, special_ad_categories={special_ad_categories}")

        created_campaigns: List[CampaignResponse] = []

        for i in range(count):
            try:
                # Nome com numeração se count > 1
                if count > 1:
                    new_name = f"{original['name']} (Cópia {i + 1})"
                else:
                    new_name = f"{original['name']} (Cópia)"

                # 1. Criar a nova campanha
                result = await meta_api.create_campaign(
                    name=new_name,
                    objective=normalized_objective,
                    status="PAUSED",
                    daily_budget=daily_budget,
                    special_ad_categories=special_ad_categories,
                )
                new_campaign_id = result["id"]
                logging.info(f"Created campaign copy {i + 1}: {new_campaign_id}")

                # 2. Duplicar ad sets e ads se solicitado
                if include_ads:
                    try:
                        original_ad_sets = await meta_api.get_ad_sets(campaign_id)

                        for ad_set in original_ad_sets:
                            try:
                                # Criar novo ad set
                                new_ad_set = await meta_api.create_ad_set(
                                    campaign_id=new_campaign_id,
                                    name=ad_set["name"],
                                    status="PAUSED",
                                    daily_budget=int(ad_set["daily_budget"]) if ad_set.get("daily_budget") else None,
                                    lifetime_budget=int(ad_set["lifetime_budget"]) if ad_set.get("lifetime_budget") else None,
                                    billing_event=ad_set.get("billing_event", "IMPRESSIONS"),
                                    optimization_goal=ad_set.get("optimization_goal", "REACH"),
                                    targeting=ad_set.get("targeting"),
                                    promoted_object=ad_set.get("promoted_object"),
                                )
                                new_ad_set_id = new_ad_set["id"]

                                # Duplicar ads do ad set
                                original_ads = await meta_api.get_ads(ad_set["id"])
                                for ad in original_ads:
                                    try:
                                        creative = ad.get("creative", {})
                                        creative_id = creative.get("id") if isinstance(creative, dict) else None

                                        if creative_id:
                                            await meta_api.create_ad(
                                                ad_set_id=new_ad_set_id,
                                                name=ad["name"],
                                                creative_id=creative_id,
                                                status="PAUSED",
                                            )
                                    except Exception as ad_err:
                                        logging.warning(f"Failed to duplicate ad: {ad_err}")
                                        continue
                            except Exception as adset_err:
                                logging.warning(f"Failed to duplicate ad set: {adset_err}")
                                continue
                    except Exception as e:
                        logging.warning(f"Failed to get ad sets for duplication: {e}")

                new_campaign = await meta_api.get_campaign(new_campaign_id)
                created_campaigns.append(CampaignResponse(
                    id=new_campaign["id"],
                    meta_id=new_campaign["id"],
                    name=new_campaign["name"],
                    objective=new_campaign.get("objective", "UNKNOWN"),
                    status=CampaignStatus(new_campaign.get("status", "PAUSED")),
                    daily_budget=new_campaign.get("daily_budget"),
                    lifetime_budget=new_campaign.get("lifetime_budget"),
                    created_at=new_campaign.get("created_time"),
                    updated_at=new_campaign.get("updated_time"),
                ))
            except Exception as e:
                logging.error(f"Failed to create campaign copy {i + 1}: {e}")
                # Continue trying to create remaining copies
                continue

        if not created_campaigns:
            raise HTTPException(status_code=500, detail="Não foi possível criar nenhuma cópia da campanha")

        return DuplicateResponse(
            campaigns=created_campaigns,
            total=len(created_campaigns),
            page=1,
            limit=count,
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Duplicate campaign error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}/insights", response_model=CampaignInsights)
async def get_campaign_insights(
    campaign_id: str,
    date_preset: str = Query("last_7d", pattern="^(today|yesterday|last_7d|last_30d)$"),
    user_id: Optional[str] = Query(None),
):
    """Obtém métricas de uma campanha."""
    try:
        meta_api = get_meta_api(user_id=user_id)
        insights = await meta_api.get_campaign_insights(campaign_id, date_preset)
        if not insights:
            # Return empty metrics instead of 404
            return CampaignInsights(
                campaign_id=campaign_id,
                campaign_name="",
                date_start=None,
                date_stop=None,
                spend=0,
                impressions=0,
                clicks=0,
                conversions=0,
                ctr=0,
                cpc=0,
                roas=None,
            )

        return CampaignInsights(**insights)
    except HTTPException:
        raise
    except MetaAPIError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}/ad-sets", response_model=AdSetListResponse)
async def get_campaign_ad_sets(campaign_id: str, user_id: Optional[str] = Query(None)):
    """Lista todos os conjuntos de anúncios de uma campanha."""
    try:
        meta_api = get_meta_api(user_id=user_id)
        ad_sets = await meta_api.get_ad_sets(campaign_id)
        return AdSetListResponse(
            ad_sets=[
                AdSetResponse(
                    id=ad_set["id"],
                    name=ad_set["name"],
                    status=ad_set.get("status", "UNKNOWN"),
                    effective_status=ad_set.get("effective_status"),
                    daily_budget=ad_set.get("daily_budget"),
                    targeting=ad_set.get("targeting"),
                    created_time=ad_set.get("created_time"),
                    updated_time=ad_set.get("updated_time"),
                )
                for ad_set in ad_sets
            ],
            total=len(ad_sets),
        )
    except Exception as e:
        # Log the error and return empty list instead of 500
        import logging
        logging.warning(f"Failed to get ad sets for campaign {campaign_id}: {e}")
        return AdSetListResponse(ad_sets=[], total=0)


@router.get("/{campaign_id}/ad-sets/{ad_set_id}/ads", response_model=AdListResponse)
async def get_ad_set_ads(
    campaign_id: str,
    ad_set_id: str,
    include_insights: bool = Query(True, description="Incluir métricas de performance"),
    date_preset: str = Query("last_7d", description="Período das métricas"),
    user_id: Optional[str] = Query(None),
):
    """Lista todos os anúncios de um conjunto de anúncios com métricas."""
    try:
        meta_api = get_meta_api(user_id=user_id)

        if include_insights:
            ads = await meta_api.get_ads_with_insights(ad_set_id, date_preset)
        else:
            ads = await meta_api.get_ads(ad_set_id)

        def parse_creative(creative_data: dict) -> AdCreative:
            if not creative_data:
                return None
            return AdCreative(
                id=creative_data.get("id", ""),
                name=creative_data.get("name"),
                object_type=creative_data.get("object_type"),
                thumbnail_url=creative_data.get("thumbnail_url"),
                image_url=creative_data.get("image_url"),
                video_id=creative_data.get("video_id"),
            )

        def parse_insights(insights_data: dict) -> AdInsights:
            if not insights_data:
                return None
            return AdInsights(
                spend=insights_data.get("spend", 0),
                impressions=insights_data.get("impressions", 0),
                clicks=insights_data.get("clicks", 0),
                reach=insights_data.get("reach", 0),
                conversions=insights_data.get("conversions", 0),
                leads=insights_data.get("leads", 0),
                purchases=insights_data.get("purchases", 0),
                ctr=insights_data.get("ctr", 0),
                cpc=insights_data.get("cpc", 0),
            )

        return AdListResponse(
            ads=[
                AdResponse(
                    id=ad["id"],
                    name=ad["name"],
                    status=ad.get("status", "UNKNOWN"),
                    effective_status=ad.get("effective_status"),
                    creative=parse_creative(ad.get("creative")),
                    insights=parse_insights(ad.get("insights")),
                    created_time=ad.get("created_time"),
                    updated_time=ad.get("updated_time"),
                )
                for ad in ads
            ],
            total=len(ads),
        )
    except MetaAPIError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{campaign_id}/ad-sets")
async def create_ad_set(
    campaign_id: str,
    ad_set: AdSetCreate,
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    user_id: Optional[str] = Query(None),
):
    """Cria um novo conjunto de anúncios para uma campanha."""
    try:
        meta_api = get_meta_api(ad_account_id, user_id=user_id)

        # Converter orçamento para centavos
        daily_budget_cents = int(ad_set.daily_budget * 100)

        result = await meta_api.create_ad_set(
            campaign_id=campaign_id,
            name=ad_set.name,
            status=ad_set.status,
            daily_budget=daily_budget_cents,
            billing_event=ad_set.billing_event.value,
            optimization_goal=ad_set.optimization_goal.value,
            targeting=ad_set.targeting,
        )

        return {
            "success": True,
            "id": result["id"],
            "name": ad_set.name,
            "campaign_id": campaign_id,
        }
    except MetaAPIError as e:
        logging.warning(f"Meta API error creating ad set: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to create ad set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{campaign_id}/ad-sets/{ad_set_id}/ads")
async def create_ad(
    campaign_id: str,
    ad_set_id: str,
    ad: AdCreate,
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    user_id: Optional[str] = Query(None),
):
    """Cria um novo anúncio em um conjunto de anúncios."""
    try:
        meta_api = get_meta_api(ad_account_id, user_id=user_id)

        result = await meta_api.create_ad(
            ad_set_id=ad_set_id,
            name=ad.name,
            creative_id=ad.creative_id,
            status=ad.status,
        )

        return {
            "success": True,
            "id": result["id"],
            "name": ad.name,
            "ad_set_id": ad_set_id,
        }
    except MetaAPIError as e:
        logging.warning(f"Meta API error creating ad: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to create ad: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{campaign_id}/ad-sets/{ad_set_id}")
async def update_ad_set(
    campaign_id: str,
    ad_set_id: str,
    ad_set: AdSetUpdate,
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    user_id: Optional[str] = Query(None),
):
    """Atualiza um conjunto de anúncios."""
    try:
        meta_api = get_meta_api(ad_account_id, user_id=user_id)

        update_data = {}
        if ad_set.name is not None:
            update_data["name"] = ad_set.name
        if ad_set.status is not None:
            update_data["status"] = ad_set.status
        if ad_set.daily_budget is not None:
            update_data["daily_budget"] = ad_set.daily_budget
        if ad_set.targeting is not None:
            update_data["targeting"] = ad_set.targeting
        if ad_set.optimization_goal is not None:
            update_data["optimization_goal"] = ad_set.optimization_goal.value
        if ad_set.billing_event is not None:
            update_data["billing_event"] = ad_set.billing_event.value

        result = await meta_api.update_ad_set(ad_set_id, update_data)

        return {
            "success": True,
            "id": ad_set_id,
            "updated_fields": list(update_data.keys()),
        }
    except MetaAPIError as e:
        logging.warning(f"Meta API error updating ad set: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to update ad set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{campaign_id}/ad-sets/{ad_set_id}/ads/{ad_id}")
async def update_ad(
    campaign_id: str,
    ad_set_id: str,
    ad_id: str,
    ad: AdUpdate,
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    user_id: Optional[str] = Query(None),
):
    """Atualiza um anúncio."""
    try:
        meta_api = get_meta_api(ad_account_id, user_id=user_id)

        update_data = {}
        if ad.name is not None:
            update_data["name"] = ad.name
        if ad.status is not None:
            update_data["status"] = ad.status
        if ad.creative_id is not None:
            update_data["creative_id"] = ad.creative_id

        result = await meta_api.update_ad(ad_id, update_data)

        return {
            "success": True,
            "id": ad_id,
            "updated_fields": list(update_data.keys()),
        }
    except MetaAPIError as e:
        logging.warning(f"Meta API error updating ad: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to update ad: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/creatives/list")
async def list_creatives(
    limit: int = Query(50, ge=1, le=100),
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    user_id: Optional[str] = Query(None),
):
    """Lista todos os criativos disponíveis na conta de anúncios."""
    try:
        meta_api = get_meta_api(ad_account_id, user_id=user_id)
        creatives = await meta_api.get_creatives(limit)

        return {
            "success": True,
            "creatives": [
                AdCreative(
                    id=c["id"],
                    name=c.get("name"),
                    object_type=c.get("object_type"),
                    thumbnail_url=c.get("thumbnail_url"),
                    image_url=c.get("image_url"),
                    video_id=c.get("video_id"),
                )
                for c in creatives
            ],
            "total": len(creatives),
        }
    except Exception as e:
        logging.error(f"Failed to list creatives: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/creatives/{creative_id}")
async def get_creative(
    creative_id: str,
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    user_id: Optional[str] = Query(None),
):
    """Obtém detalhes de um criativo específico."""
    try:
        meta_api = get_meta_api(ad_account_id, user_id=user_id)
        creative = await meta_api.get_creative(creative_id)

        if not creative:
            raise HTTPException(status_code=404, detail="Criativo não encontrado")

        return {
            "success": True,
            "creative": AdCreative(
                id=creative["id"],
                name=creative.get("name"),
                object_type=creative.get("object_type"),
                thumbnail_url=creative.get("thumbnail_url"),
                image_url=creative.get("image_url"),
                video_id=creative.get("video_id"),
            ),
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to get creative: {e}")
        raise HTTPException(status_code=500, detail=str(e))
