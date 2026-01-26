"""
Ferramentas (Tools) para os skills de IA.
Cada função é uma tool que pode ser usada pelos agentes Agno.
"""

import json
from typing import Optional
from app.tools.meta_api import MetaAPI


def get_meta_api(ad_account_id: Optional[str] = None) -> MetaAPI:
    """Retorna instância do MetaAPI."""
    return MetaAPI(ad_account_id=ad_account_id)


# ============================================
# Campaign Creator Tools
# ============================================


async def create_campaign(
    name: str,
    objective: str,
    daily_budget: Optional[float] = None,
    status: str = "PAUSED",
) -> str:
    """
    Cria uma nova campanha no Meta Ads.

    Args:
        name: Nome da campanha
        objective: Objetivo (OUTCOME_AWARENESS, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT,
                   OUTCOME_LEADS, OUTCOME_SALES, OUTCOME_APP_PROMOTION)
        daily_budget: Orçamento diário em reais (opcional)
        status: Status inicial (PAUSED ou ACTIVE)

    Returns:
        JSON com ID da campanha criada e detalhes
    """
    try:
        meta_api = get_meta_api()
        result = await meta_api.create_campaign(
            name=name,
            objective=objective,
            daily_budget=daily_budget,
            status=status,
        )
        campaign = await meta_api.get_campaign(result["id"])
        return json.dumps({
            "success": True,
            "campaign_id": result["id"],
            "name": campaign.get("name"),
            "objective": campaign.get("objective"),
            "status": campaign.get("status"),
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def create_ad_set(
    campaign_id: str,
    name: str,
    daily_budget: int,
    optimization_goal: str = "REACH",
    billing_event: str = "IMPRESSIONS",
    targeting: Optional[dict] = None,
) -> str:
    """
    Cria um novo conjunto de anúncios (Ad Set).

    Args:
        campaign_id: ID da campanha pai
        name: Nome do ad set
        daily_budget: Orçamento diário em centavos
        optimization_goal: Objetivo de otimização (REACH, LINK_CLICKS, etc.)
        billing_event: Evento de cobrança (IMPRESSIONS, LINK_CLICKS)
        targeting: Configuração de público-alvo (opcional)

    Returns:
        JSON com ID do ad set criado
    """
    try:
        meta_api = get_meta_api()
        result = await meta_api.create_ad_set(
            campaign_id=campaign_id,
            name=name,
            daily_budget=daily_budget,
            optimization_goal=optimization_goal,
            billing_event=billing_event,
            targeting=targeting,
            status="PAUSED",
        )
        return json.dumps({
            "success": True,
            "ad_set_id": result["id"],
            "name": name,
            "campaign_id": campaign_id,
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def create_ad(
    ad_set_id: str,
    name: str,
    creative_id: str,
) -> str:
    """
    Cria um novo anúncio.

    Args:
        ad_set_id: ID do ad set pai
        name: Nome do anúncio
        creative_id: ID do criativo a usar

    Returns:
        JSON com ID do anúncio criado
    """
    try:
        meta_api = get_meta_api()
        result = await meta_api.create_ad(
            ad_set_id=ad_set_id,
            name=name,
            creative_id=creative_id,
            status="PAUSED",
        )
        return json.dumps({
            "success": True,
            "ad_id": result["id"],
            "name": name,
            "ad_set_id": ad_set_id,
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


# ============================================
# Campaign Editor Tools
# ============================================


async def list_campaigns(
    status: Optional[str] = None,
    include_archived: bool = False,
) -> str:
    """
    Lista todas as campanhas da conta.

    Args:
        status: Filtrar por status (ACTIVE, PAUSED, ARCHIVED)
        include_archived: Incluir campanhas arquivadas

    Returns:
        JSON com lista de campanhas
    """
    try:
        meta_api = get_meta_api()
        campaigns = await meta_api.get_campaigns(include_archived=include_archived)

        if status:
            campaigns = [c for c in campaigns if c.get("effective_status") == status]

        result = [
            {
                "id": c["id"],
                "name": c["name"],
                "objective": c.get("objective"),
                "status": c.get("effective_status", c.get("status")),
                "daily_budget": c.get("daily_budget"),
            }
            for c in campaigns
        ]
        return json.dumps({"success": True, "campaigns": result, "total": len(result)}, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def get_campaign_details(campaign_id: str) -> str:
    """
    Obtém detalhes completos de uma campanha.

    Args:
        campaign_id: ID da campanha

    Returns:
        JSON com detalhes da campanha
    """
    try:
        meta_api = get_meta_api()
        campaign = await meta_api.get_campaign(campaign_id)
        ad_sets = await meta_api.get_ad_sets(campaign_id)

        return json.dumps({
            "success": True,
            "campaign": {
                "id": campaign["id"],
                "name": campaign["name"],
                "objective": campaign.get("objective"),
                "status": campaign.get("status"),
                "daily_budget": campaign.get("daily_budget"),
                "lifetime_budget": campaign.get("lifetime_budget"),
                "created_time": campaign.get("created_time"),
            },
            "ad_sets_count": len(ad_sets),
            "ad_sets": [
                {"id": a["id"], "name": a["name"], "status": a.get("status")}
                for a in ad_sets
            ],
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def update_campaign_status(campaign_id: str, status: str) -> str:
    """
    Atualiza o status de uma campanha (ativar/pausar/arquivar).

    Args:
        campaign_id: ID da campanha
        status: Novo status (ACTIVE, PAUSED, ARCHIVED)

    Returns:
        JSON com resultado da operação
    """
    try:
        meta_api = get_meta_api()
        await meta_api.update_campaign(campaign_id, {"status": status})
        return json.dumps({
            "success": True,
            "campaign_id": campaign_id,
            "new_status": status,
            "message": f"Campanha {'ativada' if status == 'ACTIVE' else 'pausada' if status == 'PAUSED' else 'arquivada'} com sucesso",
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def update_campaign_budget(campaign_id: str, daily_budget: float) -> str:
    """
    Atualiza o orçamento diário de uma campanha.

    Args:
        campaign_id: ID da campanha
        daily_budget: Novo orçamento diário em reais

    Returns:
        JSON com resultado da operação
    """
    try:
        meta_api = get_meta_api()
        await meta_api.update_campaign(campaign_id, {"daily_budget": daily_budget})
        return json.dumps({
            "success": True,
            "campaign_id": campaign_id,
            "new_daily_budget": daily_budget,
            "message": f"Orçamento atualizado para R$ {daily_budget:.2f}/dia",
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def duplicate_campaign(
    campaign_id: str,
    count: int = 1,
    include_ads: bool = True,
) -> str:
    """
    Duplica uma campanha existente.

    Args:
        campaign_id: ID da campanha a duplicar
        count: Número de cópias (1-10)
        include_ads: Incluir ad sets e ads na duplicação

    Returns:
        JSON com IDs das campanhas criadas
    """
    try:
        meta_api = get_meta_api()
        original = await meta_api.get_campaign(campaign_id)

        created = []
        for i in range(min(count, 10)):
            new_name = f"{original['name']} (Cópia {i + 1})" if count > 1 else f"{original['name']} (Cópia)"

            daily_budget = None
            if original.get("daily_budget"):
                daily_budget = int(original["daily_budget"]) / 100

            result = await meta_api.create_campaign(
                name=new_name,
                objective=original.get("objective", "OUTCOME_TRAFFIC"),
                daily_budget=daily_budget,
                status="PAUSED",
                special_ad_categories=original.get("special_ad_categories", []),
            )
            created.append({"id": result["id"], "name": new_name})

        return json.dumps({
            "success": True,
            "original_id": campaign_id,
            "created_campaigns": created,
            "total": len(created),
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


# ============================================
# Audience Manager Tools
# ============================================


async def search_interests(query: str, limit: int = 20) -> str:
    """
    Busca interesses disponíveis para targeting.

    Args:
        query: Termo de busca
        limit: Número máximo de resultados

    Returns:
        JSON com lista de interesses encontrados
    """
    try:
        meta_api = get_meta_api()
        interests = await meta_api.search_interests(query, limit)
        return json.dumps({
            "success": True,
            "query": query,
            "interests": interests,
            "total": len(interests),
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def search_locations(
    query: str,
    location_types: Optional[list[str]] = None,
) -> str:
    """
    Busca localizações para targeting.

    Args:
        query: Nome da localização
        location_types: Tipos (city, region, country, zip)

    Returns:
        JSON com localizações encontradas
    """
    try:
        meta_api = get_meta_api()
        locations = await meta_api.search_locations(query, location_types)
        return json.dumps({
            "success": True,
            "query": query,
            "locations": locations,
            "total": len(locations),
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def estimate_audience_reach(
    targeting_spec: dict,
    optimization_goal: str = "REACH",
) -> str:
    """
    Estima o tamanho do público para um targeting.

    Args:
        targeting_spec: Especificação do público-alvo
        optimization_goal: Objetivo de otimização

    Returns:
        JSON com estimativa de alcance
    """
    try:
        meta_api = get_meta_api()
        estimate = await meta_api.get_reach_estimate(targeting_spec, optimization_goal)

        lower = estimate.get("users_lower_bound", 0)
        upper = estimate.get("users_upper_bound", 0)

        return json.dumps({
            "success": True,
            "estimate": {
                "lower_bound": lower,
                "upper_bound": upper,
                "formatted": f"{lower:,} - {upper:,} pessoas",
                "ready": estimate.get("estimate_ready", False),
            },
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


# ============================================
# Budget Optimizer Tools
# ============================================


async def get_account_spend_summary(date_preset: str = "last_30d") -> str:
    """
    Obtém resumo de gastos da conta.

    Args:
        date_preset: Período (today, yesterday, last_7d, last_30d)

    Returns:
        JSON com resumo de gastos
    """
    try:
        meta_api = get_meta_api()
        insights = await meta_api.get_account_insights(date_preset)

        return json.dumps({
            "success": True,
            "period": date_preset,
            "summary": {
                "total_spend": insights.get("spend", 0),
                "impressions": insights.get("impressions", 0),
                "clicks": insights.get("clicks", 0),
                "conversions": insights.get("conversions", 0),
                "cpc": insights.get("cpc", 0),
                "cpm": insights.get("cpm", 0),
                "roas": insights.get("roas", 0),
            },
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def get_campaigns_spend_comparison(date_preset: str = "last_7d") -> str:
    """
    Compara gastos entre campanhas.

    Args:
        date_preset: Período para comparação

    Returns:
        JSON com gastos por campanha ordenados
    """
    try:
        meta_api = get_meta_api()
        campaigns = await meta_api.get_all_campaigns_insights(date_preset)

        result = []
        for c in campaigns:
            insights = c.get("insights") or {}
            result.append({
                "id": c["id"],
                "name": c["name"],
                "status": c["status"],
                "spend": insights.get("spend", 0),
                "impressions": insights.get("impressions", 0),
                "clicks": insights.get("clicks", 0),
                "cpc": insights.get("cpc", 0),
            })

        result.sort(key=lambda x: x["spend"], reverse=True)

        total_spend = sum(c["spend"] for c in result)

        return json.dumps({
            "success": True,
            "period": date_preset,
            "total_spend": total_spend,
            "campaigns": result,
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def get_budget_recommendations() -> str:
    """
    Gera recomendações de alocação de orçamento baseado em performance.

    Returns:
        JSON com recomendações de orçamento
    """
    try:
        meta_api = get_meta_api()
        campaigns = await meta_api.get_all_campaigns_insights("last_7d")

        recommendations = []
        for c in campaigns:
            insights = c.get("insights") or {}
            spend = insights.get("spend", 0)
            clicks = insights.get("clicks", 0)
            cpc = insights.get("cpc", 0)

            if spend > 0:
                if cpc > 5:
                    recommendations.append({
                        "campaign_id": c["id"],
                        "campaign_name": c["name"],
                        "action": "REDUCE_BUDGET",
                        "reason": f"CPC alto (R$ {cpc:.2f})",
                        "priority": "HIGH",
                    })
                elif clicks > 100 and cpc < 1:
                    recommendations.append({
                        "campaign_id": c["id"],
                        "campaign_name": c["name"],
                        "action": "INCREASE_BUDGET",
                        "reason": f"Boa performance (CPC R$ {cpc:.2f})",
                        "priority": "MEDIUM",
                    })

        return json.dumps({
            "success": True,
            "recommendations": recommendations,
            "total": len(recommendations),
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


# ============================================
# Performance Analyzer Tools
# ============================================


async def get_campaign_insights(
    campaign_id: str,
    date_preset: str = "last_7d",
) -> str:
    """
    Obtém métricas detalhadas de uma campanha.

    Args:
        campaign_id: ID da campanha
        date_preset: Período das métricas

    Returns:
        JSON com métricas da campanha
    """
    try:
        meta_api = get_meta_api()
        insights = await meta_api.get_campaign_insights(campaign_id, date_preset)

        if not insights:
            return json.dumps({
                "success": True,
                "campaign_id": campaign_id,
                "message": "Sem dados para o período selecionado",
                "insights": None,
            }, ensure_ascii=False)

        return json.dumps({
            "success": True,
            "campaign_id": campaign_id,
            "period": date_preset,
            "insights": insights,
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def get_breakdown_analysis(
    object_id: str,
    breakdown: str,
    date_preset: str = "last_7d",
) -> str:
    """
    Analisa métricas por dimensão (idade, gênero, plataforma).

    Args:
        object_id: ID da campanha/ad set/ad
        breakdown: Dimensão (age, gender, country, publisher_platform, device_platform)
        date_preset: Período

    Returns:
        JSON com breakdown das métricas
    """
    try:
        meta_api = get_meta_api()
        data = await meta_api.get_insights_with_breakdown(object_id, date_preset, [breakdown])

        result = []
        for row in data:
            value = row.get(breakdown, "Unknown")
            if breakdown == "gender":
                value = "Masculino" if value == "1" else "Feminino" if value == "2" else value

            result.append({
                "dimension": breakdown,
                "value": str(value),
                "spend": float(row.get("spend", 0)),
                "impressions": int(row.get("impressions", 0)),
                "clicks": int(row.get("clicks", 0)),
                "ctr": float(row.get("ctr", 0)),
            })

        result.sort(key=lambda x: x["spend"], reverse=True)

        return json.dumps({
            "success": True,
            "object_id": object_id,
            "breakdown": breakdown,
            "data": result,
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def get_trends_analysis(date_preset: str = "last_7d") -> str:
    """
    Analisa tendências de performance ao longo do tempo.

    Args:
        date_preset: Período para análise

    Returns:
        JSON com dados de tendência
    """
    try:
        meta_api = get_meta_api()
        daily_data = await meta_api.get_account_insights_by_day(date_preset)

        if not daily_data:
            return json.dumps({
                "success": True,
                "message": "Sem dados para o período",
                "trends": [],
            }, ensure_ascii=False)

        total_spend = sum(d["spend"] for d in daily_data)
        avg_cpc = sum(d["cpc"] for d in daily_data) / len(daily_data) if daily_data else 0

        trend = "stable"
        if len(daily_data) >= 3:
            first_half = sum(d["spend"] for d in daily_data[:len(daily_data)//2])
            second_half = sum(d["spend"] for d in daily_data[len(daily_data)//2:])
            if second_half > first_half * 1.1:
                trend = "increasing"
            elif second_half < first_half * 0.9:
                trend = "decreasing"

        return json.dumps({
            "success": True,
            "period": date_preset,
            "summary": {
                "total_spend": total_spend,
                "average_daily_spend": total_spend / len(daily_data) if daily_data else 0,
                "average_cpc": avg_cpc,
                "trend": trend,
            },
            "daily_data": daily_data,
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def compare_campaigns_performance(
    campaign_ids: list[str],
    date_preset: str = "last_7d",
) -> str:
    """
    Compara performance entre campanhas específicas.

    Args:
        campaign_ids: Lista de IDs das campanhas
        date_preset: Período para comparação

    Returns:
        JSON com comparação de métricas
    """
    try:
        meta_api = get_meta_api()
        results = []

        for campaign_id in campaign_ids:
            campaign = await meta_api.get_campaign(campaign_id)
            insights = await meta_api.get_campaign_insights(campaign_id, date_preset)

            results.append({
                "campaign_id": campaign_id,
                "name": campaign.get("name"),
                "status": campaign.get("status"),
                "insights": insights or {},
            })

        return json.dumps({
            "success": True,
            "period": date_preset,
            "comparison": results,
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


# ============================================
# Report Generator Tools
# ============================================


async def generate_performance_report(
    date_preset: str = "last_7d",
    include_campaigns: bool = True,
    include_adsets: bool = False,
) -> str:
    """
    Gera um relatório completo de performance.

    Args:
        date_preset: Período do relatório
        include_campaigns: Incluir detalhes por campanha
        include_adsets: Incluir detalhes por ad set

    Returns:
        JSON com relatório formatado
    """
    try:
        meta_api = get_meta_api()

        account_insights = await meta_api.get_account_insights(date_preset)
        campaigns = await meta_api.get_campaigns()
        active = sum(1 for c in campaigns if c.get("effective_status") == "ACTIVE")
        paused = sum(1 for c in campaigns if c.get("effective_status") == "PAUSED")

        report = {
            "success": True,
            "report_type": "performance",
            "period": date_preset,
            "generated_at": None,
            "summary": {
                "total_spend": account_insights.get("spend", 0),
                "total_impressions": account_insights.get("impressions", 0),
                "total_clicks": account_insights.get("clicks", 0),
                "total_conversions": account_insights.get("conversions", 0),
                "average_ctr": account_insights.get("ctr", 0),
                "average_cpc": account_insights.get("cpc", 0),
                "roas": account_insights.get("roas", 0),
                "active_campaigns": active,
                "paused_campaigns": paused,
                "total_campaigns": len(campaigns),
            },
        }

        if include_campaigns:
            campaigns_data = await meta_api.get_all_campaigns_insights(date_preset)
            report["campaigns"] = [
                {
                    "name": c["name"],
                    "status": c["status"],
                    "spend": (c.get("insights") or {}).get("spend", 0),
                    "impressions": (c.get("insights") or {}).get("impressions", 0),
                    "clicks": (c.get("insights") or {}).get("clicks", 0),
                }
                for c in campaigns_data
            ]

        return json.dumps(report, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def generate_budget_report(date_preset: str = "last_30d") -> str:
    """
    Gera relatório focado em orçamento e gastos.

    Args:
        date_preset: Período do relatório

    Returns:
        JSON com relatório de orçamento
    """
    try:
        meta_api = get_meta_api()

        insights = await meta_api.get_account_insights(date_preset)
        campaigns = await meta_api.get_all_campaigns_insights(date_preset)
        daily_data = await meta_api.get_account_insights_by_day(date_preset)

        total_spend = insights.get("spend", 0)
        days = len(daily_data) if daily_data else 1
        daily_average = total_spend / days

        # Projeção mensal
        monthly_projection = daily_average * 30

        report = {
            "success": True,
            "report_type": "budget",
            "period": date_preset,
            "summary": {
                "total_spend": total_spend,
                "daily_average": daily_average,
                "monthly_projection": monthly_projection,
            },
            "spend_by_campaign": [
                {
                    "name": c["name"],
                    "spend": (c.get("insights") or {}).get("spend", 0),
                    "percentage": ((c.get("insights") or {}).get("spend", 0) / total_spend * 100) if total_spend > 0 else 0,
                }
                for c in sorted(campaigns, key=lambda x: (x.get("insights") or {}).get("spend", 0), reverse=True)
            ],
            "daily_trend": daily_data,
        }

        return json.dumps(report, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


async def get_account_limits_report() -> str:
    """
    Gera relatório de limites da conta.

    Returns:
        JSON com limites e uso atual
    """
    try:
        meta_api = get_meta_api()
        limits = await meta_api.get_account_limits()

        return json.dumps({
            "success": True,
            "report_type": "account_limits",
            "account_name": limits.get("account_name", ""),
            "limits": limits.get("items", []),
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)
