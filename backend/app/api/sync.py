import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.tools.meta_api import MetaAPI
from app.services.alert_generator import run_alert_generation

router = APIRouter()


def get_meta_api(ad_account_id: Optional[str] = None) -> MetaAPI:
    """Retorna uma instância do MetaAPI com a conta especificada."""
    return MetaAPI(ad_account_id=ad_account_id)


class SyncResponse(BaseModel):
    success: bool
    campaigns_synced: int
    metrics_synced: int
    new_alerts: int = 0
    errors: Optional[list[str]] = None


class AdAccount(BaseModel):
    id: str
    account_id: str
    name: str
    currency: str
    account_status: int
    amount_spent: str
    business_name: Optional[str] = None


class AdAccountsResponse(BaseModel):
    success: bool
    accounts: list[AdAccount]


@router.get("/accounts", response_model=AdAccountsResponse)
async def get_ad_accounts():
    """Lista todas as contas de anúncio disponíveis."""
    try:
        meta_api = get_meta_api()
        accounts = await meta_api.get_ad_accounts()
        return AdAccountsResponse(
            success=True,
            accounts=[AdAccount(**acc) for acc in accounts],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=SyncResponse)
async def sync_all(ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios")):
    """Sincroniza campanhas e métricas do Meta."""
    try:
        meta_api = get_meta_api(ad_account_id)
        campaigns = await meta_api.get_campaigns()
        campaigns_count = len(campaigns)

        metrics_count = 0
        errors = []
        campaigns_with_insights = []

        for campaign in campaigns:
            try:
                insights = await meta_api.get_campaign_insights(campaign["id"], "last_7d")
                campaign_with_insights = {**campaign, "insights": insights}
                campaigns_with_insights.append(campaign_with_insights)
                metrics_count += 1
            except Exception as e:
                campaigns_with_insights.append(campaign)
                errors.append(f"Erro ao sincronizar métricas de {campaign['name']}: {str(e)}")

        # Generate alerts based on campaign data
        new_alerts = 0
        try:
            new_alerts = run_alert_generation(campaigns_with_insights)
            if new_alerts > 0:
                logging.info(f"Generated {new_alerts} new alerts")
        except Exception as e:
            logging.error(f"Error generating alerts: {e}")

        return SyncResponse(
            success=True,
            campaigns_synced=campaigns_count,
            metrics_synced=metrics_count,
            new_alerts=new_alerts,
            errors=errors if errors else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/campaigns")
async def sync_campaigns(
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    include_archived: bool = Query(False, description="Incluir campanhas arquivadas"),
):
    """Sincroniza apenas as campanhas."""
    try:
        meta_api = get_meta_api(ad_account_id)
        campaigns = await meta_api.get_campaigns(include_archived=include_archived)
        return {
            "success": True,
            "campaigns_synced": len(campaigns),
            "campaigns": campaigns,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/metrics")
async def sync_metrics(
    campaign_id: Optional[str] = None,
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
):
    """Sincroniza métricas (todas ou de uma campanha específica)."""
    try:
        meta_api = get_meta_api(ad_account_id)

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


class DashboardMetrics(BaseModel):
    spend: float
    impressions: int
    clicks: int
    conversions: int
    ctr: float
    cpc: float
    cpm: float
    reach: int
    frequency: float
    leads: int
    purchases: int
    landing_page_views: int
    video_views: int
    roas: float
    active_campaigns: int
    paused_campaigns: int
    archived_campaigns: int
    total_campaigns: int


class CampaignInsightsItem(BaseModel):
    id: str
    name: str
    status: str
    objective: str
    spend: float = 0
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    ctr: float = 0
    cpc: float = 0


class CampaignsInsightsResponse(BaseModel):
    success: bool
    campaigns: list[CampaignInsightsItem]


@router.get("/campaigns-insights", response_model=CampaignsInsightsResponse)
async def get_campaigns_insights(
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    date_preset: str = Query("last_7d", description="Período das métricas"),
    include_archived: bool = Query(False, description="Incluir campanhas arquivadas"),
):
    """Obtém métricas de todas as campanhas para comparação."""
    try:
        meta_api = get_meta_api(ad_account_id)
        campaigns = await meta_api.get_all_campaigns_insights(date_preset, include_archived)

        result = []
        for campaign in campaigns:
            insights = campaign.get("insights") or {}
            result.append(CampaignInsightsItem(
                id=campaign["id"],
                name=campaign["name"],
                status=campaign["status"],
                objective=campaign["objective"],
                spend=insights.get("spend", 0),
                impressions=insights.get("impressions", 0),
                clicks=insights.get("clicks", 0),
                conversions=insights.get("conversions", 0),
                ctr=insights.get("ctr", 0),
                cpc=insights.get("cpc", 0),
            ))

        # Sort by spend descending
        result.sort(key=lambda x: x.spend, reverse=True)

        return CampaignsInsightsResponse(success=True, campaigns=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DailyMetric(BaseModel):
    date: str
    spend: float
    impressions: int
    clicks: int
    reach: int
    ctr: float
    cpc: float
    cpm: float
    conversions: int


class TrendsResponse(BaseModel):
    success: bool
    data: list[DailyMetric]


@router.get("/trends", response_model=TrendsResponse)
async def get_trends(
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    date_preset: str = Query("last_7d", description="Período das métricas"),
):
    """Obtém métricas por dia para gráfico de tendências."""
    try:
        meta_api = get_meta_api(ad_account_id)
        daily_data = await meta_api.get_account_insights_by_day(date_preset)

        return TrendsResponse(
            success=True,
            data=[DailyMetric(**d) for d in daily_data],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard")
async def get_dashboard_metrics(
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    date_preset: str = Query("last_7d", description="Período das métricas"),
    include_archived: bool = Query(False, description="Incluir campanhas arquivadas"),
):
    """Obtém métricas para o dashboard."""
    try:
        meta_api = get_meta_api(ad_account_id)

        # Get campaigns
        campaigns = await meta_api.get_campaigns(include_archived=include_archived)
        active = sum(1 for c in campaigns if c.get("effective_status") == "ACTIVE")
        paused = sum(1 for c in campaigns if c.get("effective_status") == "PAUSED")
        archived = sum(1 for c in campaigns if c.get("effective_status") == "ARCHIVED")

        # Get account insights
        insights = await meta_api.get_account_insights(date_preset)

        return {
            "success": True,
            "metrics": {
                "spend": insights.get("spend", 0),
                "impressions": insights.get("impressions", 0),
                "clicks": insights.get("clicks", 0),
                "conversions": insights.get("conversions", 0),
                "ctr": insights.get("ctr", 0),
                "cpc": insights.get("cpc", 0),
                "cpm": insights.get("cpm", 0),
                "reach": insights.get("reach", 0),
                "frequency": insights.get("frequency", 0),
                "leads": insights.get("leads", 0),
                "purchases": insights.get("purchases", 0),
                "landing_page_views": insights.get("landing_page_views", 0),
                "video_views": insights.get("video_views", 0),
                "roas": insights.get("roas", 0),
                "active_campaigns": active,
                "paused_campaigns": paused,
                "archived_campaigns": archived,
                "total_campaigns": len(campaigns),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AdSetInsightsItem(BaseModel):
    id: str
    name: str
    status: str
    campaign_id: str
    campaign_name: str
    daily_budget: Optional[str] = None
    spend: float = 0
    impressions: int = 0
    clicks: int = 0
    reach: int = 0
    conversions: int = 0
    ctr: float = 0
    cpc: float = 0


class AdSetsInsightsResponse(BaseModel):
    success: bool
    ad_sets: list[AdSetInsightsItem]


@router.get("/adsets-insights", response_model=AdSetsInsightsResponse)
async def get_adsets_insights(
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    date_preset: str = Query("last_7d", description="Período das métricas"),
    include_archived: bool = Query(False, description="Incluir campanhas arquivadas"),
):
    """Obtém métricas de todos os conjuntos de anúncios para análise."""
    try:
        meta_api = get_meta_api(ad_account_id)
        adsets = await meta_api.get_all_adsets_insights(date_preset, include_archived)

        result = []
        for adset in adsets:
            insights = adset.get("insights") or {}
            result.append(AdSetInsightsItem(
                id=adset["id"],
                name=adset["name"],
                status=adset["status"],
                campaign_id=adset["campaign_id"],
                campaign_name=adset["campaign_name"],
                daily_budget=adset.get("daily_budget"),
                spend=insights.get("spend", 0),
                impressions=insights.get("impressions", 0),
                clicks=insights.get("clicks", 0),
                reach=insights.get("reach", 0),
                conversions=insights.get("conversions", 0),
                ctr=insights.get("ctr", 0),
                cpc=insights.get("cpc", 0),
            ))

        # Sort by spend descending
        result.sort(key=lambda x: x.spend, reverse=True)

        return AdSetsInsightsResponse(success=True, ad_sets=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AdInsightsItem(BaseModel):
    id: str
    name: str
    status: str
    campaign_id: str
    campaign_name: str
    adset_id: str
    adset_name: str
    creative_type: Optional[str] = None
    thumbnail_url: Optional[str] = None
    spend: float = 0
    impressions: int = 0
    clicks: int = 0
    reach: int = 0
    conversions: int = 0
    ctr: float = 0
    cpc: float = 0


class AdsInsightsResponse(BaseModel):
    success: bool
    ads: list[AdInsightsItem]


@router.get("/ads-insights", response_model=AdsInsightsResponse)
async def get_ads_insights(
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
    date_preset: str = Query("last_7d", description="Período das métricas"),
    include_archived: bool = Query(False, description="Incluir campanhas arquivadas"),
):
    """Obtém métricas de todos os anúncios para análise."""
    try:
        meta_api = get_meta_api(ad_account_id)
        ads = await meta_api.get_all_ads_insights(date_preset, include_archived)

        result = []
        for ad in ads:
            insights = ad.get("insights") or {}
            creative = ad.get("creative") or {}

            result.append(AdInsightsItem(
                id=ad["id"],
                name=ad["name"],
                status=ad["status"],
                campaign_id=ad["campaign_id"],
                campaign_name=ad["campaign_name"],
                adset_id=ad["adset_id"],
                adset_name=ad["adset_name"],
                creative_type=creative.get("object_type"),
                thumbnail_url=creative.get("thumbnail_url"),
                spend=insights.get("spend", 0),
                impressions=insights.get("impressions", 0),
                clicks=insights.get("clicks", 0),
                reach=insights.get("reach", 0),
                conversions=insights.get("conversions", 0),
                ctr=insights.get("ctr", 0),
                cpc=insights.get("cpc", 0),
            ))

        # Sort by spend descending
        result.sort(key=lambda x: x.spend, reverse=True)

        return AdsInsightsResponse(success=True, ads=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AccountLimitsItem(BaseModel):
    name: str
    current: int
    limit: int
    percentage: float


class AccountLimitsResponse(BaseModel):
    success: bool
    account_name: str
    limits: list[AccountLimitsItem]


@router.get("/account-limits", response_model=AccountLimitsResponse)
async def get_account_limits(
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
):
    """Obtém os limites de campanhas, conjuntos e anúncios da conta."""
    try:
        meta_api = get_meta_api(ad_account_id)
        limits_data = await meta_api.get_account_limits()

        limits = []
        for item in limits_data.get("items", []):
            current = item.get("current", 0)
            limit = item.get("limit", 1)
            percentage = (current / limit * 100) if limit > 0 else 0

            limits.append(AccountLimitsItem(
                name=item.get("name", ""),
                current=current,
                limit=limit,
                percentage=round(percentage, 1),
            ))

        return AccountLimitsResponse(
            success=True,
            account_name=limits_data.get("account_name", ""),
            limits=limits,
        )
    except Exception as e:
        # Log the error but return empty limits instead of failing
        import logging
        logging.warning(f"Failed to get account limits: {e}")
        return AccountLimitsResponse(
            success=True,
            account_name="",
            limits=[
                AccountLimitsItem(name="Campanhas", current=0, limit=5000, percentage=0),
                AccountLimitsItem(name="Conjuntos de Anúncios", current=0, limit=5000, percentage=0),
                AccountLimitsItem(name="Anúncios", current=0, limit=50000, percentage=0),
            ],
        )


# ========================================
# Reach Estimation
# ========================================


class ReachEstimate(BaseModel):
    users_lower_bound: int
    users_upper_bound: int
    estimate_ready: bool


class ReachEstimateRequest(BaseModel):
    targeting_spec: dict
    optimization_goal: str = "REACH"


class ReachEstimateResponse(BaseModel):
    success: bool
    estimate: ReachEstimate


@router.post("/reach-estimate", response_model=ReachEstimateResponse)
async def estimate_reach(
    request: ReachEstimateRequest,
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
):
    """
    Estima o tamanho do público para um targeting específico.

    Exemplo de targeting_spec:
    {
        "geo_locations": {"countries": ["BR"]},
        "age_min": 18,
        "age_max": 65,
        "genders": [1, 2],
        "interests": [{"id": "6003139266461", "name": "Fitness"}]
    }
    """
    try:
        meta_api = get_meta_api(ad_account_id)
        estimate = await meta_api.get_reach_estimate(
            request.targeting_spec,
            request.optimization_goal,
        )
        return ReachEstimateResponse(
            success=True,
            estimate=ReachEstimate(**estimate),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========================================
# Breakdown Analytics
# ========================================


class BreakdownItem(BaseModel):
    dimension: str
    value: str
    spend: float = 0
    impressions: int = 0
    clicks: int = 0
    reach: int = 0
    conversions: int = 0
    ctr: float = 0
    cpc: float = 0
    cpm: float = 0


class BreakdownResponse(BaseModel):
    success: bool
    breakdown_type: str
    data: list[BreakdownItem]


@router.get("/breakdown/{object_id}", response_model=BreakdownResponse)
async def get_breakdown(
    object_id: str,
    breakdown: str = Query(
        ...,
        description="Dimensão: age, gender, country, publisher_platform, device_platform",
    ),
    date_preset: str = Query("last_7d", description="Período: today, yesterday, last_7d, last_30d"),
    ad_account_id: Optional[str] = Query(None, description="ID da conta de anúncios"),
):
    """
    Obtém métricas com breakdown por dimensão.

    Dimensões disponíveis:
    - age: Faixa etária
    - gender: Gênero (1=male, 2=female)
    - country: País
    - publisher_platform: Plataforma (facebook, instagram, audience_network, messenger)
    - device_platform: Dispositivo (mobile, desktop)
    """
    try:
        meta_api = get_meta_api(ad_account_id)
        data = await meta_api.get_insights_with_breakdown(object_id, date_preset, [breakdown])

        items = []
        for row in data:
            # Map gender values to labels
            value = row.get(breakdown, "Unknown")
            if breakdown == "gender":
                value = "Masculino" if value == "1" else "Feminino" if value == "2" else value
            elif breakdown == "publisher_platform":
                platform_map = {
                    "facebook": "Facebook",
                    "instagram": "Instagram",
                    "audience_network": "Audience Network",
                    "messenger": "Messenger",
                }
                value = platform_map.get(value, value)

            items.append(BreakdownItem(
                dimension=breakdown,
                value=str(value),
                spend=float(row.get("spend", 0)),
                impressions=int(row.get("impressions", 0)),
                clicks=int(row.get("clicks", 0)),
                reach=int(row.get("reach", 0)),
                conversions=int(row.get("conversions", 0)),
                ctr=float(row.get("ctr", 0)),
                cpc=float(row.get("cpc", 0)),
                cpm=float(row.get("cpm", 0)),
            ))

        # Sort by spend descending
        items.sort(key=lambda x: x.spend, reverse=True)

        return BreakdownResponse(
            success=True,
            breakdown_type=breakdown,
            data=items,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
