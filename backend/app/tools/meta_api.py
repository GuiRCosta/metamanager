import httpx
import asyncio
import json
from typing import Optional
from datetime import datetime

# Rate limiting configuration
MAX_RETRIES = 3
BASE_RETRY_DELAY = 1.0  # seconds


class MetaAPIError(Exception):
    """Custom exception for Meta API errors."""

    def __init__(self, message: str, error_code: Optional[int] = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class MetaAPI:
    """Cliente para a Meta Marketing API."""

    BASE_URL = "https://graph.facebook.com"

    def __init__(
        self,
        ad_account_id: Optional[str] = None,
        access_token: Optional[str] = None,
        business_id: Optional[str] = None,
        api_version: Optional[str] = None,
        user_id: Optional[str] = None,
    ):
        """
        Inicializa o cliente Meta API.

        Prioridade de configuração:
        1. Parâmetros passados no construtor
        2. Configurações JSON (data/settings.json ou settings_{user_id}.json)
        3. Variáveis de ambiente (.env)
        """
        # Import local para evitar circular import
        from app.api.settings import get_meta_config

        config = get_meta_config(user_id)

        self.access_token = access_token or config.access_token
        self.ad_account_id = ad_account_id or config.ad_account_id
        self.business_id = business_id or config.business_id
        self.api_version = api_version or config.api_version
        self.client = httpx.AsyncClient(timeout=30.0)

    def with_account(self, ad_account_id: str) -> "MetaAPI":
        """Retorna uma nova instância com outra conta de anúncios."""
        return MetaAPI(
            ad_account_id=ad_account_id,
            access_token=self.access_token,
            business_id=self.business_id,
            api_version=self.api_version,
        )

    @property
    def _base_url(self) -> str:
        return f"{self.BASE_URL}/{self.api_version}"

    async def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[dict] = None,
        data: Optional[dict] = None,
    ) -> dict:
        """Faz uma requisição para a Meta API com retry automático."""
        url = f"{self._base_url}/{endpoint}"

        default_params = {"access_token": self.access_token}
        if params:
            default_params.update(params)

        last_error = None
        for attempt in range(MAX_RETRIES):
            try:
                response = await self.client.request(
                    method=method,
                    url=url,
                    params=default_params,
                    json=data,
                )

                if response.status_code == 429:
                    # Rate limit - retry with exponential backoff
                    retry_delay = BASE_RETRY_DELAY * (2 ** attempt)
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(retry_delay)
                        continue
                    raise MetaAPIError("Rate limit exceeded after retries", 429)

                result = response.json()

                if "error" in result:
                    error = result["error"]
                    error_code = error.get("code")
                    # Meta API rate limit error codes: 4, 17, 32, 613
                    if error_code in [4, 17, 32, 613] and attempt < MAX_RETRIES - 1:
                        retry_delay = BASE_RETRY_DELAY * (2 ** attempt)
                        await asyncio.sleep(retry_delay)
                        continue
                    # Include more error details
                    error_msg = error.get("message", "Unknown error")
                    error_subcode = error.get("error_subcode")
                    error_user_msg = error.get("error_user_msg") or error.get("error_user_title")
                    full_msg = error_msg
                    if error_subcode:
                        full_msg += f" (subcode: {error_subcode})"
                    if error_user_msg:
                        full_msg += f" - {error_user_msg}"
                    raise MetaAPIError(full_msg, error_code)

                return result
            except httpx.HTTPError as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(BASE_RETRY_DELAY * (2 ** attempt))
                    continue
                raise MetaAPIError(f"HTTP error: {str(e)}")

        raise MetaAPIError(f"Request failed after {MAX_RETRIES} attempts: {last_error}")

    async def get_campaigns(
        self,
        fields: Optional[list[str]] = None,
        limit: int = 500,
        include_archived: bool = False,
    ) -> list[dict]:
        """Lista todas as campanhas da conta (com paginação)."""
        default_fields = [
            "id",
            "name",
            "objective",
            "status",
            "effective_status",
            "daily_budget",
            "lifetime_budget",
            "created_time",
            "updated_time",
        ]
        fields_param = ",".join(fields or default_fields)

        all_campaigns = []

        # Definir filtro de status
        if include_archived:
            # Incluir todos os status
            status_filter = '[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED","ARCHIVED","IN_PROCESS","WITH_ISSUES"]}]'
        else:
            # Excluir arquivadas (comportamento padrão)
            status_filter = '[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED","IN_PROCESS","WITH_ISSUES"]}]'

        # Primeira requisição
        result = await self._request(
            "GET",
            f"act_{self.ad_account_id}/campaigns",
            params={"fields": fields_param, "limit": limit, "filtering": status_filter},
        )

        all_campaigns.extend(result.get("data", []))

        # Paginação - buscar próximas páginas
        while "paging" in result and "next" in result["paging"]:
            next_url = result["paging"]["next"]
            try:
                response = await self.client.get(next_url)
                result = response.json()
                if "error" in result:
                    break
                all_campaigns.extend(result.get("data", []))
            except Exception:
                break

        return all_campaigns

    async def get_campaign(self, campaign_id: str, fields: Optional[list[str]] = None) -> dict:
        """Obtém detalhes de uma campanha específica."""
        default_fields = [
            "id",
            "name",
            "objective",
            "status",
            "daily_budget",
            "lifetime_budget",
            "created_time",
            "updated_time",
            "special_ad_categories",
        ]
        fields_param = ",".join(fields or default_fields)

        result = await self._request(
            "GET",
            campaign_id,
            params={"fields": fields_param},
        )

        return result

    async def create_campaign(
        self,
        name: str,
        objective: str,
        status: str = "PAUSED",
        daily_budget: Optional[float] = None,
        special_ad_categories: Optional[list[str]] = None,
    ) -> dict:
        """Cria uma nova campanha."""
        import logging

        data = {
            "name": name,
            "objective": objective,
            "status": status,
            "special_ad_categories": special_ad_categories or [],
        }

        if daily_budget:
            data["daily_budget"] = int(daily_budget * 100)
        else:
            # Required when not using Campaign Budget Optimization
            data["is_adset_budget_sharing_enabled"] = False

        logging.info(f"Creating campaign with data: {data}")

        result = await self._request(
            "POST",
            f"act_{self.ad_account_id}/campaigns",
            data=data,
        )

        return result

    async def update_campaign(self, campaign_id: str, data: dict) -> dict:
        """Atualiza uma campanha existente."""
        update_data = {}

        if "name" in data:
            update_data["name"] = data["name"]
        if "status" in data:
            update_data["status"] = data["status"]
        if "daily_budget" in data:
            update_data["daily_budget"] = int(data["daily_budget"] * 100)

        result = await self._request("POST", campaign_id, data=update_data)
        return result

    async def delete_campaign(self, campaign_id: str) -> dict:
        """Arquiva uma campanha (soft delete)."""
        return await self.update_campaign(campaign_id, {"status": "ARCHIVED"})

    async def get_ad_sets(self, campaign_id: str, include_drafts: bool = True) -> list[dict]:
        """Lista ad sets de uma campanha."""
        params = {
            "fields": "id,name,status,effective_status,daily_budget,lifetime_budget,billing_event,optimization_goal,targeting,promoted_object,created_time,updated_time"
        }

        # Incluir todos os status, incluindo DRAFT
        if include_drafts:
            params["filtering"] = '[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED","DRAFT","PENDING_REVIEW","DISAPPROVED","PREAPPROVED","PENDING_BILLING_INFO","CAMPAIGN_PAUSED","ARCHIVED","ADSET_PAUSED","IN_PROCESS","WITH_ISSUES"]}]'

        result = await self._request(
            "GET",
            f"{campaign_id}/adsets",
            params=params,
        )
        return result.get("data", [])

    async def get_ad_set(self, ad_set_id: str) -> dict:
        """Obtém detalhes de um ad set específico."""
        result = await self._request(
            "GET",
            ad_set_id,
            params={
                "fields": "id,name,status,daily_budget,lifetime_budget,billing_event,optimization_goal,targeting,promoted_object,bid_amount,start_time,end_time"
            },
        )
        return result

    async def create_ad_set(
        self,
        campaign_id: str,
        name: str,
        status: str = "PAUSED",
        daily_budget: Optional[int] = None,
        lifetime_budget: Optional[int] = None,
        billing_event: str = "IMPRESSIONS",
        optimization_goal: str = "REACH",
        targeting: Optional[dict] = None,
        promoted_object: Optional[dict] = None,
        bid_amount: Optional[int] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
    ) -> dict:
        """Cria um novo ad set."""
        data = {
            "campaign_id": campaign_id,
            "name": name,
            "status": status,
            "billing_event": billing_event,
            "optimization_goal": optimization_goal,
        }

        if daily_budget:
            data["daily_budget"] = daily_budget
        if lifetime_budget:
            data["lifetime_budget"] = lifetime_budget
        if targeting:
            data["targeting"] = targeting
        if promoted_object:
            data["promoted_object"] = promoted_object
        if bid_amount:
            data["bid_amount"] = bid_amount
        if start_time:
            data["start_time"] = start_time
        if end_time:
            data["end_time"] = end_time

        result = await self._request(
            "POST",
            f"act_{self.ad_account_id}/adsets",
            data=data,
        )
        return result

    async def update_ad_set(self, ad_set_id: str, data: dict) -> dict:
        """Atualiza um ad set existente."""
        update_data = {}

        if "name" in data:
            update_data["name"] = data["name"]
        if "status" in data:
            update_data["status"] = data["status"]
        if "daily_budget" in data:
            update_data["daily_budget"] = int(data["daily_budget"] * 100)
        if "targeting" in data:
            update_data["targeting"] = data["targeting"]
        if "optimization_goal" in data:
            update_data["optimization_goal"] = data["optimization_goal"]
        if "billing_event" in data:
            update_data["billing_event"] = data["billing_event"]
        if "bid_amount" in data:
            update_data["bid_amount"] = data["bid_amount"]

        result = await self._request("POST", ad_set_id, data=update_data)
        return result

    async def get_ads(self, ad_set_id: str, include_drafts: bool = True) -> list[dict]:
        """Lista ads de um ad set com detalhes do criativo."""
        params = {
            "fields": "id,name,status,effective_status,created_time,updated_time,creative{id,name,object_type,thumbnail_url,image_url,video_id,object_story_spec}"
        }

        # Incluir todos os status, incluindo DRAFT
        if include_drafts:
            params["filtering"] = '[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED","DRAFT","PENDING_REVIEW","DISAPPROVED","PREAPPROVED","PENDING_BILLING_INFO","CAMPAIGN_PAUSED","ARCHIVED","ADSET_PAUSED","IN_PROCESS","WITH_ISSUES"]}]'

        result = await self._request(
            "GET",
            f"{ad_set_id}/ads",
            params=params,
        )
        return result.get("data", [])

    async def get_ad(self, ad_id: str) -> dict:
        """Obtém detalhes de um ad específico."""
        result = await self._request(
            "GET",
            ad_id,
            params={"fields": "id,name,status,creative{id},tracking_specs,conversion_specs"},
        )
        return result

    async def create_ad(
        self,
        ad_set_id: str,
        name: str,
        creative_id: str,
        status: str = "PAUSED",
        tracking_specs: Optional[list] = None,
        conversion_specs: Optional[list] = None,
    ) -> dict:
        """Cria um novo ad."""
        data = {
            "adset_id": ad_set_id,
            "name": name,
            "status": status,
            "creative": {"creative_id": creative_id},
        }

        if tracking_specs:
            data["tracking_specs"] = tracking_specs
        if conversion_specs:
            data["conversion_specs"] = conversion_specs

        result = await self._request(
            "POST",
            f"act_{self.ad_account_id}/ads",
            data=data,
        )
        return result

    async def update_ad(self, ad_id: str, data: dict) -> dict:
        """Atualiza um ad existente."""
        update_data = {}

        if "name" in data:
            update_data["name"] = data["name"]
        if "status" in data:
            update_data["status"] = data["status"]
        if "creative_id" in data:
            update_data["creative"] = {"creative_id": data["creative_id"]}

        result = await self._request("POST", ad_id, data=update_data)
        return result

    async def get_creatives(self, limit: int = 50) -> list[dict]:
        """Lista criativos da conta de anúncios."""
        result = await self._request(
            "GET",
            f"act_{self.ad_account_id}/adcreatives",
            params={
                "fields": "id,name,object_type,thumbnail_url,image_url,video_id,object_story_spec,status,title,body",
                "limit": limit,
            },
        )
        return [
            {
                "id": creative.get("id"),
                "name": creative.get("name", "Sem nome"),
                "object_type": creative.get("object_type"),
                "thumbnail_url": creative.get("thumbnail_url"),
                "image_url": creative.get("image_url"),
                "video_id": creative.get("video_id"),
                "status": creative.get("status", "ACTIVE"),
                "title": creative.get("title"),
                "body": creative.get("body"),
            }
            for creative in result.get("data", [])
        ]

    async def get_creative(self, creative_id: str) -> dict:
        """Obtém detalhes de um criativo específico."""
        result = await self._request(
            "GET",
            creative_id,
            params={
                "fields": "id,name,object_type,thumbnail_url,image_url,video_id,object_story_spec,status,title,body"
            },
        )
        return result

    async def get_ad_insights(
        self,
        ad_id: str,
        date_preset: str = "last_7d",
    ) -> dict:
        """Obtém métricas de um anúncio específico."""
        result = await self._request(
            "GET",
            f"{ad_id}/insights",
            params={
                "fields": "ad_id,ad_name,spend,impressions,clicks,conversions,ctr,cpc,reach,actions,cost_per_action_type",
                "date_preset": date_preset,
            },
        )

        data = result.get("data", [])
        if not data:
            return None

        insight = data[0]

        # Extrair conversões do campo actions
        actions = insight.get("actions", [])
        conversions = 0
        leads = 0
        purchases = 0

        for action in actions:
            action_type = action.get("action_type", "")
            value = int(action.get("value", 0))

            if action_type == "lead":
                leads = value
            elif action_type == "purchase":
                purchases = value
            elif action_type in ["omni_purchase", "onsite_conversion.purchase"]:
                purchases += value

        conversions = leads + purchases

        return {
            "ad_id": insight.get("ad_id"),
            "ad_name": insight.get("ad_name"),
            "spend": float(insight.get("spend", 0)),
            "impressions": int(insight.get("impressions", 0)),
            "clicks": int(insight.get("clicks", 0)),
            "reach": int(insight.get("reach", 0)),
            "conversions": conversions,
            "leads": leads,
            "purchases": purchases,
            "ctr": float(insight.get("ctr", 0)),
            "cpc": float(insight.get("cpc", 0)) if insight.get("cpc") else 0,
        }

    async def get_ads_with_insights(
        self,
        ad_set_id: str,
        date_preset: str = "last_7d",
    ) -> list[dict]:
        """Lista ads de um ad set com métricas de performance."""
        ads = await self.get_ads(ad_set_id)
        ads_with_insights = []

        for ad in ads:
            ad_data = {**ad}
            try:
                insights = await self.get_ad_insights(ad["id"], date_preset)
                ad_data["insights"] = insights
            except Exception:
                ad_data["insights"] = None
            ads_with_insights.append(ad_data)

        return ads_with_insights

    async def get_campaign_insights(
        self,
        campaign_id: str,
        date_preset: str = "last_7d",
    ) -> dict:
        """Obtém métricas de uma campanha."""
        result = await self._request(
            "GET",
            f"{campaign_id}/insights",
            params={
                "fields": "campaign_id,campaign_name,spend,impressions,clicks,conversions,ctr,cpc,date_start,date_stop",
                "date_preset": date_preset,
            },
        )

        data = result.get("data", [])
        if not data:
            return None

        insight = data[0]
        spend = float(insight.get("spend", 0))
        impressions = int(insight.get("impressions", 0))
        clicks = int(insight.get("clicks", 0))
        conversions = int(insight.get("conversions", 0))

        ctr = float(insight.get("ctr", 0))
        cpc = float(insight.get("cpc", 0)) if insight.get("cpc") else (spend / clicks if clicks > 0 else 0)

        return {
            "campaign_id": insight.get("campaign_id"),
            "campaign_name": insight.get("campaign_name"),
            "date_start": insight.get("date_start"),
            "date_stop": insight.get("date_stop"),
            "spend": spend,
            "impressions": impressions,
            "clicks": clicks,
            "conversions": conversions,
            "ctr": ctr,
            "cpc": cpc,
            "roas": None,
        }

    async def get_all_campaigns_insights(
        self,
        date_preset: str = "last_7d",
        include_archived: bool = False,
    ) -> list[dict]:
        """Obtém métricas de todas as campanhas para comparação."""
        campaigns = await self.get_campaigns(include_archived=include_archived)
        campaigns_with_insights = []

        for campaign in campaigns:
            campaign_data = {
                "id": campaign["id"],
                "name": campaign["name"],
                "status": campaign.get("effective_status", campaign.get("status", "UNKNOWN")),
                "objective": campaign.get("objective", "UNKNOWN"),
            }
            try:
                insights = await self.get_campaign_insights(campaign["id"], date_preset)
                if insights:
                    campaign_data["insights"] = insights
                else:
                    campaign_data["insights"] = None
            except Exception:
                campaign_data["insights"] = None
            campaigns_with_insights.append(campaign_data)

        return campaigns_with_insights

    async def get_account_insights_by_day(
        self,
        date_preset: str = "last_7d",
    ) -> list[dict]:
        """Obtém métricas da conta por dia para gráfico de tendências."""
        result = await self._request(
            "GET",
            f"act_{self.ad_account_id}/insights",
            params={
                "fields": "spend,impressions,clicks,reach,ctr,cpc,cpm,actions",
                "date_preset": date_preset,
                "time_increment": 1,  # Daily breakdown
            },
        )

        data = result.get("data", [])
        daily_metrics = []

        for day_data in data:
            # Extrair conversões do campo actions
            actions = day_data.get("actions", [])
            conversions = 0
            for action in actions:
                if action.get("action_type") in ["lead", "purchase", "omni_purchase"]:
                    conversions += int(action.get("value", 0))

            daily_metrics.append({
                "date": day_data.get("date_start"),
                "spend": float(day_data.get("spend", 0)),
                "impressions": int(day_data.get("impressions", 0)),
                "clicks": int(day_data.get("clicks", 0)),
                "reach": int(day_data.get("reach", 0)),
                "ctr": float(day_data.get("ctr", 0)),
                "cpc": float(day_data.get("cpc", 0)) if day_data.get("cpc") else 0,
                "cpm": float(day_data.get("cpm", 0)) if day_data.get("cpm") else 0,
                "conversions": conversions,
            })

        return daily_metrics

    async def get_account_insights(self, date_preset: str = "last_30d") -> dict:
        """Obtém métricas gerais da conta."""
        result = await self._request(
            "GET",
            f"act_{self.ad_account_id}/insights",
            params={
                "fields": "spend,impressions,clicks,reach,frequency,ctr,cpc,cpp,cpm,actions,cost_per_action_type,purchase_roas,video_play_actions",
                "date_preset": date_preset,
            },
        )

        data = result.get("data", [])
        if not data:
            return {}

        insight = data[0]

        # Extrair conversões do campo actions
        actions = insight.get("actions", [])
        conversions = 0
        leads = 0
        purchases = 0
        landing_page_views = 0

        for action in actions:
            action_type = action.get("action_type", "")
            value = int(action.get("value", 0))

            if action_type == "lead":
                leads = value
            elif action_type == "purchase":
                purchases = value
            elif action_type == "landing_page_view":
                landing_page_views = value
            elif action_type in ["omni_purchase", "onsite_conversion.purchase"]:
                purchases += value

        conversions = leads + purchases

        # Extrair ROAS
        roas_list = insight.get("purchase_roas", [])
        roas = float(roas_list[0].get("value", 0)) if roas_list else 0

        # Extrair video views
        video_actions = insight.get("video_play_actions", [])
        video_views = 0
        for va in video_actions:
            if va.get("action_type") == "video_view":
                video_views = int(va.get("value", 0))
                break

        return {
            "spend": float(insight.get("spend", 0)),
            "impressions": int(insight.get("impressions", 0)),
            "clicks": int(insight.get("clicks", 0)),
            "reach": int(insight.get("reach", 0)),
            "frequency": float(insight.get("frequency", 0)),
            "ctr": float(insight.get("ctr", 0)),
            "cpc": float(insight.get("cpc", 0)) if insight.get("cpc") else 0,
            "cpm": float(insight.get("cpm", 0)) if insight.get("cpm") else 0,
            "cpp": float(insight.get("cpp", 0)) if insight.get("cpp") else 0,
            "conversions": conversions,
            "leads": leads,
            "purchases": purchases,
            "landing_page_views": landing_page_views,
            "video_views": video_views,
            "roas": roas,
        }

    async def get_ad_accounts(self) -> list[dict]:
        """Lista todas as contas de anúncio do business."""
        result = await self._request(
            "GET",
            f"{self.business_id}/owned_ad_accounts",
            params={
                "fields": "name,account_id,account_status,amount_spent,currency,business_name"
            },
        )
        return result.get("data", [])

    async def get_adset_insights(
        self,
        adset_id: str,
        date_preset: str = "last_7d",
    ) -> dict:
        """Obtém métricas de um ad set específico."""
        result = await self._request(
            "GET",
            f"{adset_id}/insights",
            params={
                "fields": "adset_id,adset_name,spend,impressions,clicks,reach,ctr,cpc,actions,cost_per_action_type",
                "date_preset": date_preset,
            },
        )

        data = result.get("data", [])
        if not data:
            return None

        insight = data[0]

        # Extrair conversões do campo actions
        actions = insight.get("actions", [])
        conversions = 0
        leads = 0
        purchases = 0

        for action in actions:
            action_type = action.get("action_type", "")
            value = int(action.get("value", 0))

            if action_type == "lead":
                leads = value
            elif action_type == "purchase":
                purchases = value
            elif action_type in ["omni_purchase", "onsite_conversion.purchase"]:
                purchases += value

        conversions = leads + purchases

        return {
            "adset_id": insight.get("adset_id"),
            "adset_name": insight.get("adset_name"),
            "spend": float(insight.get("spend", 0)),
            "impressions": int(insight.get("impressions", 0)),
            "clicks": int(insight.get("clicks", 0)),
            "reach": int(insight.get("reach", 0)),
            "conversions": conversions,
            "leads": leads,
            "purchases": purchases,
            "ctr": float(insight.get("ctr", 0)),
            "cpc": float(insight.get("cpc", 0)) if insight.get("cpc") else 0,
        }

    async def get_all_adsets_insights(
        self,
        date_preset: str = "last_7d",
        include_archived: bool = False,
        max_campaigns: int = 20,
    ) -> list[dict]:
        """Obtém métricas de todos os ad sets em uma única chamada otimizada."""
        # Filtro de status para incluir drafts
        filtering = '[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED","DRAFT","PENDING_REVIEW","CAMPAIGN_PAUSED","IN_PROCESS","WITH_ISSUES"'
        if include_archived:
            filtering += ',"ARCHIVED"'
        filtering += ']}]'

        # Buscar todos os ad sets com insights em uma única chamada
        result = await self._request(
            "GET",
            f"act_{self.ad_account_id}/adsets",
            params={
                "fields": "id,name,status,effective_status,daily_budget,campaign_id,campaign{id,name},insights.date_preset(" + date_preset + "){spend,impressions,clicks,reach,ctr,cpc,actions}",
                "filtering": filtering,
                "limit": 500,
            },
        )

        all_adsets = []
        data = result.get("data", [])

        for adset in data:
            campaign = adset.get("campaign", {})
            insights_data = adset.get("insights", {}).get("data", [])
            insights = insights_data[0] if insights_data else {}

            # Extrair conversões do campo actions
            actions = insights.get("actions", [])
            conversions = 0
            leads = 0
            purchases = 0
            for action in actions:
                action_type = action.get("action_type", "")
                value = int(action.get("value", 0))
                if action_type == "lead":
                    leads = value
                elif action_type in ["purchase", "omni_purchase"]:
                    purchases += value
            conversions = leads + purchases

            all_adsets.append({
                "id": adset["id"],
                "name": adset["name"],
                "status": adset.get("effective_status", adset.get("status", "UNKNOWN")),
                "campaign_id": campaign.get("id", ""),
                "campaign_name": campaign.get("name", ""),
                "daily_budget": adset.get("daily_budget"),
                "insights": {
                    "spend": float(insights.get("spend", 0)),
                    "impressions": int(insights.get("impressions", 0)),
                    "clicks": int(insights.get("clicks", 0)),
                    "reach": int(insights.get("reach", 0)),
                    "conversions": conversions,
                    "leads": leads,
                    "purchases": purchases,
                    "ctr": float(insights.get("ctr", 0)),
                    "cpc": float(insights.get("cpc", 0)) if insights.get("cpc") else 0,
                } if insights else None,
            })

        return all_adsets

    async def get_all_ads_insights(
        self,
        date_preset: str = "last_7d",
        include_archived: bool = False,
        max_campaigns: int = 20,
    ) -> list[dict]:
        """Obtém métricas de todos os anúncios em uma única chamada otimizada."""
        # Filtro de status para incluir drafts
        filtering = '[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED","DRAFT","PENDING_REVIEW","CAMPAIGN_PAUSED","ADSET_PAUSED","IN_PROCESS","WITH_ISSUES"'
        if include_archived:
            filtering += ',"ARCHIVED"'
        filtering += ']}]'

        # Buscar todos os ads com insights em uma única chamada
        result = await self._request(
            "GET",
            f"act_{self.ad_account_id}/ads",
            params={
                "fields": "id,name,status,effective_status,adset_id,adset{id,name},campaign{id,name},creative{id,name,object_type,thumbnail_url},insights.date_preset(" + date_preset + "){spend,impressions,clicks,reach,ctr,cpc,actions}",
                "filtering": filtering,
                "limit": 500,
            },
        )

        all_ads = []
        data = result.get("data", [])

        for ad in data:
            campaign = ad.get("campaign", {})
            adset = ad.get("adset", {})
            creative = ad.get("creative", {})
            insights_data = ad.get("insights", {}).get("data", [])
            insights = insights_data[0] if insights_data else {}

            # Extrair conversões do campo actions
            actions = insights.get("actions", [])
            conversions = 0
            leads = 0
            purchases = 0
            for action in actions:
                action_type = action.get("action_type", "")
                value = int(action.get("value", 0))
                if action_type == "lead":
                    leads = value
                elif action_type in ["purchase", "omni_purchase"]:
                    purchases += value
            conversions = leads + purchases

            all_ads.append({
                "id": ad["id"],
                "name": ad["name"],
                "status": ad.get("effective_status", ad.get("status", "UNKNOWN")),
                "campaign_id": campaign.get("id", ""),
                "campaign_name": campaign.get("name", ""),
                "adset_id": adset.get("id", ""),
                "adset_name": adset.get("name", ""),
                "creative": {
                    "id": creative.get("id"),
                    "name": creative.get("name"),
                    "object_type": creative.get("object_type"),
                    "thumbnail_url": creative.get("thumbnail_url"),
                } if creative else None,
                "insights": {
                    "spend": float(insights.get("spend", 0)),
                    "impressions": int(insights.get("impressions", 0)),
                    "clicks": int(insights.get("clicks", 0)),
                    "reach": int(insights.get("reach", 0)),
                    "conversions": conversions,
                    "leads": leads,
                    "purchases": purchases,
                    "ctr": float(insights.get("ctr", 0)),
                    "cpc": float(insights.get("cpc", 0)) if insights.get("cpc") else 0,
                } if insights else None,
            })

        return all_ads

    async def _summary_count(self, endpoint: str, filtering: Optional[str] = None) -> int:
        """Conta objetos usando summary=true (eficiente, sem paginação)."""
        params: dict = {
            "summary": "true",
            "limit": 0,
        }
        if filtering:
            params["filtering"] = filtering

        result = await self._request("GET", endpoint, params=params)
        summary = result.get("summary", {})
        return summary.get("total_count", 0)

    async def get_account_limits(self) -> dict:
        """Obtém contagem atual e limites de campanhas, ad sets e ads da conta."""
        # Buscar informações da conta
        account_result = await self._request(
            "GET",
            f"act_{self.ad_account_id}",
            params={"fields": "name,account_id"},
        )
        account_name = account_result.get("name", "")

        # Filtrar apenas status que contam contra os limites da Meta
        # (exclui DELETED e ARCHIVED)
        status_filter = '[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED","IN_PROCESS","WITH_ISSUES"]}]'

        # Contar objetos em paralelo usando summary (eficiente)
        campaigns_count, adsets_count, ads_count = await asyncio.gather(
            self._summary_count(f"act_{self.ad_account_id}/campaigns", status_filter),
            self._summary_count(f"act_{self.ad_account_id}/adsets", status_filter),
            self._summary_count(f"act_{self.ad_account_id}/ads", status_filter),
        )

        # Limites padrão do Meta (podem variar por conta)
        # https://developers.facebook.com/docs/marketing-api/reference/ad-account/
        campaigns_limit = 5000  # Limite comum para a maioria das contas
        adsets_limit = 5000     # Por conta
        ads_limit = 50000       # Por conta

        return {
            "account_name": account_name,
            "items": [
                {
                    "name": "Campanhas",
                    "current": campaigns_count,
                    "limit": campaigns_limit,
                },
                {
                    "name": "Conjuntos de Anúncios",
                    "current": adsets_count,
                    "limit": adsets_limit,
                },
                {
                    "name": "Anúncios",
                    "current": ads_count,
                    "limit": ads_limit,
                },
            ],
        }

    # ========================================
    # Reach Estimation
    # ========================================

    async def get_reach_estimate(
        self,
        targeting_spec: dict,
        optimization_goal: str = "REACH",
    ) -> dict:
        """Estima o tamanho do público para um targeting específico."""
        result = await self._request(
            "GET",
            f"act_{self.ad_account_id}/reachestimate",
            params={
                "targeting_spec": json.dumps(targeting_spec),
                "optimization_goal": optimization_goal,
            },
        )

        data = result.get("data", {})
        return {
            "users_lower_bound": data.get("users_lower_bound", 0),
            "users_upper_bound": data.get("users_upper_bound", 0),
            "estimate_ready": data.get("estimate_ready", False),
        }

    # ========================================
    # Breakdown Analytics
    # ========================================

    async def get_insights_with_breakdown(
        self,
        object_id: str,
        date_preset: str = "last_7d",
        breakdowns: Optional[list[str]] = None,
    ) -> list[dict]:
        """
        Obtém insights com breakdown por dimensão.

        breakdowns: age, gender, country, publisher_platform, device_platform
        """
        params = {
            "fields": "spend,impressions,clicks,reach,ctr,cpc,cpm,actions",
            "date_preset": date_preset,
        }
        if breakdowns:
            params["breakdowns"] = ",".join(breakdowns)

        result = await self._request("GET", f"{object_id}/insights", params=params)
        data = result.get("data", [])

        # Process and extract conversions from actions
        processed = []
        for row in data:
            conversions = 0
            actions = row.get("actions", [])
            for action in actions:
                if action.get("action_type") in [
                    "omni_purchase",
                    "purchase",
                    "lead",
                    "complete_registration",
                ]:
                    conversions += int(action.get("value", 0))

            processed.append({
                **row,
                "conversions": conversions,
            })

        return processed

    # ========================================
    # Targeting Search
    # ========================================

    async def search_interests(self, query: str, limit: int = 20) -> list[dict]:
        """Busca interesses disponíveis para targeting."""
        result = await self._request(
            "GET",
            "search",
            params={
                "type": "adinterest",
                "q": query,
                "limit": limit,
            },
        )
        return [
            {
                "id": item.get("id"),
                "name": item.get("name"),
                "audience_size_lower_bound": item.get("audience_size_lower_bound", 0),
                "audience_size_upper_bound": item.get("audience_size_upper_bound", 0),
                "path": item.get("path", []),
                "topic": item.get("topic"),
            }
            for item in result.get("data", [])
        ]

    async def search_locations(
        self,
        query: str,
        location_types: Optional[list[str]] = None,
        limit: int = 20,
    ) -> list[dict]:
        """
        Busca localizações para targeting.

        location_types: city, region, country, zip, geo_market, electoral_district
        """
        params = {
            "type": "adgeolocation",
            "q": query,
            "limit": limit,
        }
        if location_types:
            params["location_types"] = json.dumps(location_types)

        result = await self._request("GET", "search", params=params)
        return [
            {
                "key": item.get("key"),
                "name": item.get("name"),
                "type": item.get("type"),
                "country_code": item.get("country_code"),
                "country_name": item.get("country_name"),
                "region": item.get("region"),
                "region_id": item.get("region_id"),
                "supports_city": item.get("supports_city", False),
                "supports_region": item.get("supports_region", False),
            }
            for item in result.get("data", [])
        ]

    async def get_targeting_categories(
        self,
        category_class: str = "interests",
    ) -> list[dict]:
        """
        Lista categorias de targeting disponíveis.

        category_class: interests, behaviors, demographics,
                       life_events, family_statuses, industries, income
        """
        result = await self._request(
            "GET",
            "search",
            params={
                "type": "adTargetingCategory",
                "class": category_class,
            },
        )
        return result.get("data", [])

    async def close(self):
        """Fecha o cliente HTTP."""
        await self.client.aclose()
