import httpx
from typing import Optional
from datetime import datetime

from app.config import get_settings

settings = get_settings()


class MetaAPIError(Exception):
    """Custom exception for Meta API errors."""

    def __init__(self, message: str, error_code: Optional[int] = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class MetaAPI:
    """Cliente para a Meta Marketing API."""

    BASE_URL = "https://graph.facebook.com"

    def __init__(self):
        self.access_token = settings.meta_access_token
        self.ad_account_id = settings.meta_ad_account_id
        self.api_version = settings.meta_api_version
        self.client = httpx.AsyncClient(timeout=30.0)

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
        """Faz uma requisição para a Meta API."""
        url = f"{self._base_url}/{endpoint}"

        default_params = {"access_token": self.access_token}
        if params:
            default_params.update(params)

        try:
            response = await self.client.request(
                method=method,
                url=url,
                params=default_params,
                json=data,
            )

            if response.status_code == 429:
                raise MetaAPIError("Rate limit exceeded", 429)

            result = response.json()

            if "error" in result:
                error = result["error"]
                raise MetaAPIError(
                    error.get("message", "Unknown error"),
                    error.get("code"),
                )

            return result
        except httpx.HTTPError as e:
            raise MetaAPIError(f"HTTP error: {str(e)}")

    async def get_campaigns(self, fields: Optional[list[str]] = None) -> list[dict]:
        """Lista todas as campanhas da conta."""
        default_fields = [
            "id",
            "name",
            "objective",
            "status",
            "daily_budget",
            "lifetime_budget",
            "created_time",
            "updated_time",
        ]
        fields_param = ",".join(fields or default_fields)

        result = await self._request(
            "GET",
            f"act_{self.ad_account_id}/campaigns",
            params={"fields": fields_param},
        )

        return result.get("data", [])

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
        data = {
            "name": name,
            "objective": objective,
            "status": status,
            "special_ad_categories": special_ad_categories or [],
        }

        if daily_budget:
            data["daily_budget"] = int(daily_budget * 100)

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

    async def get_ad_sets(self, campaign_id: str) -> list[dict]:
        """Lista ad sets de uma campanha."""
        result = await self._request(
            "GET",
            f"{campaign_id}/adsets",
            params={
                "fields": "id,name,status,daily_budget,targeting,created_time,updated_time"
            },
        )
        return result.get("data", [])

    async def get_ads(self, ad_set_id: str) -> list[dict]:
        """Lista ads de um ad set."""
        result = await self._request(
            "GET",
            f"{ad_set_id}/ads",
            params={"fields": "id,name,status,creative,created_time,updated_time"},
        )
        return result.get("data", [])

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

    async def get_account_insights(self, date_preset: str = "last_30d") -> dict:
        """Obtém métricas gerais da conta."""
        result = await self._request(
            "GET",
            f"act_{self.ad_account_id}/insights",
            params={
                "fields": "spend,impressions,clicks,conversions,ctr,cpc",
                "date_preset": date_preset,
            },
        )

        data = result.get("data", [])
        if not data:
            return {}

        return data[0]

    async def close(self):
        """Fecha o cliente HTTP."""
        await self.client.aclose()
