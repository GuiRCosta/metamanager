# Integração com Meta Marketing API

Guia completo de integração com a Meta Marketing API (Facebook Ads) v24.0, incluindo autenticação, endpoints, rate limiting e boas práticas.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Hierarquia da API](#hierarquia-da-api)
4. [Cliente Meta API](#cliente-meta-api)
5. [Operações CRUD](#operações-crud)
6. [Insights e Métricas](#insights-e-métricas)
7. [Rate Limiting](#rate-limiting)
8. [Webhooks](#webhooks)
9. [Troubleshooting](#troubleshooting)

---

## Visão Geral

A Meta Marketing API permite gerenciar campanhas publicitárias programaticamente.

### Recursos Principais

- ✅ Criar, editar e pausar campanhas
- ✅ Gerenciar conjuntos de anúncios (Ad Sets)
- ✅ Criar e editar anúncios
- ✅ Obter métricas e insights em tempo real
- ✅ Configurar targeting (segmentação)
- ✅ Upload de criativos (imagens/vídeos)
- ✅ Webhooks para atualizações automáticas

### Limitações

- ⚠️ **Rate Limit**: 200 chamadas por hora por Ad Account
- ⚠️ **Sandbox**: Dados limitados em modo teste
- ⚠️ **Permissões**: Requer aprovação para algumas features
- ⚠️ **Budget**: Limites diários para gastos

---

## Autenticação

### 1. Criar Meta App

1. Acesse: https://developers.facebook.com/
2. Crie um App tipo "Business"
3. Adicione produto "Marketing API"
4. Obtenha:
   - **App ID**: `123456789`
   - **App Secret**: `abc123...`

### 2. Gerar Access Token

```bash
# Via Graph API Explorer
# https://developers.facebook.com/tools/explorer/

# Permissões necessárias:
# - ads_management
# - ads_read
# - business_management
# - pages_read_engagement

# Token gerado:
# EAABwzLixnjYBO7ZCvq1wZCZCrGF...
```

### 3. Access Token de Longa Duração

```python
import httpx

async def exchange_token(short_token: str, app_id: str, app_secret: str):
    """Troca token de curta duração por longa duração (60 dias)"""
    url = "https://graph.facebook.com/v24.0/oauth/access_token"
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_token
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
        return data.get("access_token")
```

### 4. Obter Ad Account ID

```python
async def get_ad_accounts(access_token: str):
    """Lista Ad Accounts do usuário"""
    url = f"https://graph.facebook.com/v24.0/me/adaccounts"
    params = {
        "access_token": access_token,
        "fields": "id,name,account_status,currency"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
        return data.get("data", [])

# Retorna:
# [
#   {
#     "id": "act_123456789",
#     "name": "Minha Conta",
#     "account_status": 1,  # 1 = ACTIVE
#     "currency": "BRL"
#   }
# ]
```

---

## Hierarquia da API

### Estrutura de Objetos

```
Ad Account (act_123456789)
  │
  ├── Campaigns (Campanhas)
  │     ├── Campaign 1
  │     ├── Campaign 2
  │     └── Campaign 3
  │           │
  │           ├── Ad Sets (Conjuntos)
  │           │     ├── Ad Set 1
  │           │     └── Ad Set 2
  │           │           │
  │           │           ├── Ads (Anúncios)
  │           │           │     ├── Ad 1
  │           │           │     └── Ad 2
  │           │           │
  │           │           └── Targeting
  │           │
  │           └── Budget (Orçamento)
  │
  └── Insights (Métricas)
```

### Relacionamentos

- **1 Ad Account** → N Campaigns
- **1 Campaign** → N Ad Sets
- **1 Ad Set** → N Ads
- **1 Ad** → 1 Creative

---

## Cliente Meta API

### Implementação Completa

```python
# app/tools/meta_api.py
"""
Cliente para Meta Marketing API
"""
import httpx
from typing import Dict, List, Any, Optional
from app.config import settings


class MetaAPI:
    """Cliente para interagir com Meta Marketing API"""

    def __init__(self):
        self.base_url = f"https://graph.facebook.com/{settings.meta_api_version}"
        self.access_token = settings.meta_access_token
        self.ad_account_id = settings.meta_ad_account_id
        self.client = httpx.AsyncClient(timeout=30.0)

    def __del__(self):
        """Fechar cliente ao destruir"""
        try:
            import asyncio
            asyncio.create_task(self.client.aclose())
        except:
            pass

    async def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Faz request para Meta API"""
        url = f"{self.base_url}/{endpoint}"

        # Adicionar access token
        if params is None:
            params = {}
        params["access_token"] = self.access_token

        try:
            if method == "GET":
                response = await self.client.get(url, params=params)
            elif method == "POST":
                response = await self.client.post(url, params=params, json=data)
            elif method == "DELETE":
                response = await self.client.delete(url, params=params)
            else:
                raise ValueError(f"Método HTTP inválido: {method}")

            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            error_data = e.response.json() if e.response else {}
            raise Exception(
                f"Meta API Error: {error_data.get('error', {}).get('message', str(e))}"
            )

    # ==========================================
    # CAMPAIGNS
    # ==========================================

    async def get_campaigns(
        self,
        include_drafts: bool = False,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Lista todas as campanhas"""
        params = {
            "fields": "id,name,status,effective_status,objective,daily_budget,lifetime_budget",
            "limit": limit
        }

        # Incluir rascunhos se solicitado
        if not include_drafts:
            params["filtering"] = '[{"field":"effective_status","operator":"NOT_IN","value":["DELETED","ARCHIVED"]}]'

        data = await self._request(
            "GET",
            f"{self.ad_account_id}/campaigns",
            params=params
        )

        return data.get("data", [])

    async def get_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Obtém detalhes de uma campanha"""
        params = {
            "fields": "id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time,updated_time"
        }

        return await self._request("GET", campaign_id, params=params)

    async def create_campaign(
        self,
        name: str,
        objective: str,
        status: str = "PAUSED",
        daily_budget: Optional[int] = None,
        lifetime_budget: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Cria nova campanha

        Args:
            name: Nome da campanha
            objective: Objetivo (OUTCOME_TRAFFIC, OUTCOME_LEADS, etc.)
            status: Status inicial (ACTIVE, PAUSED)
            daily_budget: Orçamento diário em centavos (ex: 10000 = R$ 100)
            lifetime_budget: Orçamento total em centavos
        """
        data = {
            "name": name,
            "objective": objective,
            "status": status,
            "special_ad_categories": []  # Vazio se não for categoria especial
        }

        if daily_budget:
            data["daily_budget"] = daily_budget
        if lifetime_budget:
            data["lifetime_budget"] = lifetime_budget

        return await self._request(
            "POST",
            f"{self.ad_account_id}/campaigns",
            data=data
        )

    async def update_campaign(
        self,
        campaign_id: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Atualiza campanha

        Kwargs aceitos:
            name, status, daily_budget, lifetime_budget
        """
        return await self._request("POST", campaign_id, data=kwargs)

    async def delete_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Deleta (arquiva) campanha"""
        return await self._request("DELETE", campaign_id)

    # ==========================================
    # AD SETS
    # ==========================================

    async def get_ad_sets(
        self,
        campaign_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Lista Ad Sets de uma campanha"""
        params = {
            "fields": "id,name,status,effective_status,daily_budget,lifetime_budget,targeting",
            "limit": limit
        }

        data = await self._request(
            "GET",
            f"{campaign_id}/adsets",
            params=params
        )

        return data.get("data", [])

    async def create_ad_set(
        self,
        campaign_id: str,
        name: str,
        daily_budget: int,
        billing_event: str = "IMPRESSIONS",
        optimization_goal: str = "LINK_CLICKS",
        targeting: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Cria Ad Set

        Args:
            campaign_id: ID da campanha
            name: Nome do conjunto
            daily_budget: Orçamento diário em centavos
            billing_event: Como cobrar (IMPRESSIONS, LINK_CLICKS)
            optimization_goal: Meta de otimização
            targeting: Segmentação (geo, idade, interesses)
        """
        # Targeting padrão (Brasil, 18-65)
        if targeting is None:
            targeting = {
                "geo_locations": {"countries": ["BR"]},
                "age_min": 18,
                "age_max": 65
            }

        data = {
            "name": name,
            "campaign_id": campaign_id,
            "daily_budget": daily_budget,
            "billing_event": billing_event,
            "optimization_goal": optimization_goal,
            "targeting": targeting,
            "status": "PAUSED"
        }

        return await self._request(
            "POST",
            f"{self.ad_account_id}/adsets",
            data=data
        )

    # ==========================================
    # ADS
    # ==========================================

    async def create_ad(
        self,
        ad_set_id: str,
        name: str,
        creative: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Cria anúncio

        Args:
            ad_set_id: ID do Ad Set
            name: Nome do anúncio
            creative: Dados do criativo (imagem, texto, CTA)
        """
        data = {
            "name": name,
            "adset_id": ad_set_id,
            "creative": creative,
            "status": "PAUSED"
        }

        return await self._request(
            "POST",
            f"{self.ad_account_id}/ads",
            data=data
        )

    # ==========================================
    # INSIGHTS (MÉTRICAS)
    # ==========================================

    async def get_campaign_insights(
        self,
        campaign_id: str,
        date_preset: str = "last_7d",
        fields: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Obtém insights de uma campanha

        Args:
            campaign_id: ID da campanha
            date_preset: Período (today, yesterday, last_7d, last_30d, etc.)
            fields: Métricas desejadas

        Returns:
            {
              "spend": 150.50,
              "impressions": 10000,
              "clicks": 250,
              "conversions": 10,
              "ctr": 2.5,
              "cpc": 0.60
            }
        """
        if fields is None:
            fields = [
                "spend",
                "impressions",
                "clicks",
                "actions",  # Conversões
                "ctr",
                "cpc",
                "cpp",  # Custo por mil
                "frequency"
            ]

        params = {
            "fields": ",".join(fields),
            "date_preset": date_preset,
            "time_increment": 1  # Diário
        }

        data = await self._request(
            "GET",
            f"{campaign_id}/insights",
            params=params
        )

        insights_data = data.get("data", [])

        if not insights_data:
            return {
                "spend": 0,
                "impressions": 0,
                "clicks": 0,
                "conversions": 0
            }

        # Agregar métricas (somar todos os dias)
        totals = {
            "spend": 0.0,
            "impressions": 0,
            "clicks": 0,
            "conversions": 0
        }

        for day in insights_data:
            totals["spend"] += float(day.get("spend", 0))
            totals["impressions"] += int(day.get("impressions", 0))
            totals["clicks"] += int(day.get("clicks", 0))

            # Conversões podem vir em 'actions'
            actions = day.get("actions", [])
            for action in actions:
                if action.get("action_type") == "offsite_conversion.fb_pixel_purchase":
                    totals["conversions"] += int(action.get("value", 0))

        return totals

    async def get_account_insights(
        self,
        date_preset: str = "last_30d"
    ) -> Dict[str, Any]:
        """Obtém insights da conta inteira"""
        params = {
            "fields": "spend,impressions,clicks,actions",
            "date_preset": date_preset,
            "level": "account"
        }

        data = await self._request(
            "GET",
            f"{self.ad_account_id}/insights",
            params=params
        )

        insights_data = data.get("data", [])

        if not insights_data:
            return {
                "spend": 0,
                "impressions": 0,
                "clicks": 0,
                "conversions": 0
            }

        # Retornar primeiro resultado (account level)
        account_data = insights_data[0]

        # Processar conversões
        conversions = 0
        actions = account_data.get("actions", [])
        for action in actions:
            if "conversion" in action.get("action_type", "").lower():
                conversions += int(action.get("value", 0))

        return {
            "spend": float(account_data.get("spend", 0)),
            "impressions": int(account_data.get("impressions", 0)),
            "clicks": int(account_data.get("clicks", 0)),
            "conversions": conversions
        }
```

---

## Operações CRUD

### Criar Campanha Completa

```python
async def create_full_campaign(
    meta_api: MetaAPI,
    campaign_name: str,
    budget: float
):
    """Cria campanha completa (Campaign + Ad Set + Ad)"""

    # 1. Criar campanha
    campaign = await meta_api.create_campaign(
        name=campaign_name,
        objective="OUTCOME_TRAFFIC",
        status="PAUSED",
        daily_budget=int(budget * 100)  # Converter para centavos
    )

    campaign_id = campaign["id"]

    # 2. Criar Ad Set
    ad_set = await meta_api.create_ad_set(
        campaign_id=campaign_id,
        name=f"{campaign_name} - Ad Set 1",
        daily_budget=int(budget * 100),
        targeting={
            "geo_locations": {"countries": ["BR"]},
            "age_min": 25,
            "age_max": 55,
            "genders": [0]  # 0 = Todos, 1 = Homens, 2 = Mulheres
        }
    )

    ad_set_id = ad_set["id"]

    # 3. Criar Ad (simplificado - necessita creative)
    ad = await meta_api.create_ad(
        ad_set_id=ad_set_id,
        name=f"{campaign_name} - Ad 1",
        creative={
            "object_story_spec": {
                "page_id": settings.meta_page_id,
                "link_data": {
                    "message": "Confira nossa oferta!",
                    "link": "https://seusite.com",
                    "name": "Título do Anúncio",
                    "description": "Descrição do anúncio"
                }
            }
        }
    )

    return {
        "campaign": campaign,
        "ad_set": ad_set,
        "ad": ad
    }
```

---

## Rate Limiting

### Limites da Meta API

```python
# Por Ad Account:
# - 200 chamadas por hora
# - Reset a cada hora

# Implementação de cache e retry
import asyncio
from functools import wraps

def with_retry(max_retries=3, delay=60):
    """Decorator para retry em caso de rate limit"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    error_msg = str(e).lower()

                    # Rate limit atingido
                    if "rate limit" in error_msg or "too many requests" in error_msg:
                        if attempt < max_retries - 1:
                            print(f"Rate limit atingido. Aguardando {delay}s...")
                            await asyncio.sleep(delay)
                            continue

                    raise  # Re-raise se não for rate limit

            raise Exception("Max retries atingido")

        return wrapper
    return decorator


# Usar decorator
class MetaAPI:
    @with_retry(max_retries=3, delay=60)
    async def get_campaigns(self):
        # ... implementação
        pass
```

---

## Troubleshooting

### Erro: "Invalid OAuth access token"

**Causa**: Token expirado ou inválido

**Solução**:
```python
# 1. Gerar novo token no Graph Explorer
# 2. Trocar por token de longa duração
# 3. Atualizar .env
```

### Erro: "Application does not have permission"

**Causa**: App não tem permissões necessárias

**Solução**:
1. Meta App → App Review
2. Solicitar permissões: `ads_management`, `ads_read`
3. Aguardar aprovação

### Erro: "Please reduce the amount of data"

**Causa**: Query muito grande

**Solução**:
```python
# Reduzir campos retornados
params = {
    "fields": "id,name,status"  # Apenas essenciais
}

# Paginar resultados
params = {
    "limit": 25  # Reduzir de 100 para 25
}
```

---

## Próximos Passos

Agora que você entende a Meta API:

1. ✅ **[Frontend com Next.js](../frontend/README.md)** - Construa a interface
2. ✅ **[Autenticação e Segurança](../seguranca/AUTENTICACAO.md)** - Proteja sua aplicação
3. ✅ **[Deploy e Produção](../deploy/PRODUCAO.md)** - Coloque no ar

---

## 📚 Recursos

- [Meta Marketing API Docs](https://developers.facebook.com/docs/marketing-apis)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Marketing API Quickstart](https://developers.facebook.com/docs/marketing-api/get-started)
- [Error Codes Reference](https://developers.facebook.com/docs/graph-api/using-graph-api/error-handling)
