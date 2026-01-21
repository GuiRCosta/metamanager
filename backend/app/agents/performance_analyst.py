from typing import Optional
import json

from app.agents.base_agent import BaseAgent
from app.tools.meta_api import MetaAPI


class PerformanceAnalystAgent(BaseAgent):
    """Agente especializado em análise de performance."""

    def __init__(self):
        super().__init__(
            name="performance_analyst",
            description="Analista de performance e tendências",
        )
        self.meta_api = MetaAPI()

    def _register_tools(self) -> list[dict]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "analyze_trends",
                    "description": "Analisa tendências de métricas ao longo do tempo",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "campaign_id": {
                                "type": "string",
                                "description": "ID da campanha (opcional, analisa todas se não informado)",
                            },
                            "metric": {
                                "type": "string",
                                "description": "Métrica a analisar",
                                "enum": ["spend", "impressions", "clicks", "conversions", "ctr", "cpc"],
                            },
                        },
                        "required": [],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "compare_campaigns",
                    "description": "Compara performance entre campanhas",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "campaign_ids": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "IDs das campanhas para comparar",
                            },
                        },
                        "required": [],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "generate_insights",
                    "description": "Gera insights acionáveis sobre a conta",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": [],
                    },
                },
            },
        ]

    def _get_system_prompt(self, context: Optional[dict] = None) -> str:
        base_prompt = """Você é um analista de dados especializado em métricas de campanhas digitais.

Seu papel é:
1. Identificar tendências em métricas de performance
2. Comparar performance entre campanhas
3. Detectar anomalias e padrões
4. Gerar insights acionáveis

Diretrizes:
- Apresente dados de forma clara e visual quando possível
- Destaque variações significativas (>10%)
- Sugira próximos passos baseados nos dados
- Use linguagem acessível em português"""

        if context:
            context_info = f"""

Contexto do usuário:
- Campanhas ativas: {context.get('active_campaigns', 'N/A')}
- Gasto total: R$ {context.get('total_spend', 'N/A')}
- Orçamento mensal: R$ {context.get('monthly_budget', 'N/A')}
- ROAS médio: {context.get('average_roas', 'N/A')}x"""
            return base_prompt + context_info

        return base_prompt

    async def _execute_tool(self, tool_name: str, arguments: dict) -> str:
        if tool_name == "analyze_trends":
            return await self._analyze_trends(
                arguments.get("campaign_id"),
                arguments.get("metric", "spend"),
            )
        elif tool_name == "compare_campaigns":
            return await self._compare_campaigns(arguments.get("campaign_ids"))
        elif tool_name == "generate_insights":
            return await self._generate_insights()

        return json.dumps({"error": f"Ferramenta {tool_name} não encontrada"})

    async def _analyze_trends(self, campaign_id: Optional[str], metric: str) -> str:
        try:
            if campaign_id:
                insights_7d = await self.meta_api.get_campaign_insights(campaign_id, "last_7d")
                insights_30d = await self.meta_api.get_campaign_insights(campaign_id, "last_30d")

                if not insights_7d or not insights_30d:
                    return json.dumps({"error": "Métricas não encontradas"})

                value_7d = insights_7d.get(metric, 0)
                value_30d = insights_30d.get(metric, 0)

                avg_30d = value_30d / 4 if value_30d else 0
                change = ((value_7d - avg_30d) / avg_30d * 100) if avg_30d else 0

                trend = "stable"
                if change > 10:
                    trend = "increasing"
                elif change < -10:
                    trend = "decreasing"

                return json.dumps({
                    "campaign_id": campaign_id,
                    "metric": metric,
                    "value_last_7d": value_7d,
                    "value_last_30d": value_30d,
                    "weekly_average_30d": round(avg_30d, 2),
                    "change_percentage": round(change, 2),
                    "trend": trend,
                    "analysis": self._get_trend_analysis(metric, trend, change),
                })
            else:
                account_7d = await self.meta_api.get_account_insights("last_7d")
                account_30d = await self.meta_api.get_account_insights("last_30d")

                value_7d = float(account_7d.get(metric, 0))
                value_30d = float(account_30d.get(metric, 0))

                avg_30d = value_30d / 4 if value_30d else 0
                change = ((value_7d - avg_30d) / avg_30d * 100) if avg_30d else 0

                trend = "stable"
                if change > 10:
                    trend = "increasing"
                elif change < -10:
                    trend = "decreasing"

                return json.dumps({
                    "scope": "account",
                    "metric": metric,
                    "value_last_7d": value_7d,
                    "value_last_30d": value_30d,
                    "weekly_average_30d": round(avg_30d, 2),
                    "change_percentage": round(change, 2),
                    "trend": trend,
                    "analysis": self._get_trend_analysis(metric, trend, change),
                })
        except Exception as e:
            return json.dumps({"error": str(e)})

    def _get_trend_analysis(self, metric: str, trend: str, change: float) -> str:
        metric_names = {
            "spend": "gasto",
            "impressions": "impressões",
            "clicks": "cliques",
            "conversions": "conversões",
            "ctr": "CTR",
            "cpc": "CPC",
        }

        metric_name = metric_names.get(metric, metric)

        if trend == "increasing":
            if metric in ["conversions", "ctr", "impressions", "clicks"]:
                return f"Excelente! {metric_name.capitalize()} aumentou {abs(change):.1f}% na última semana."
            elif metric == "spend":
                return f"Atenção: {metric_name.capitalize()} aumentou {abs(change):.1f}%. Verifique se o ROI está adequado."
            else:
                return f"{metric_name.capitalize()} aumentou {abs(change):.1f}%. Avalie o impacto na rentabilidade."
        elif trend == "decreasing":
            if metric in ["conversions", "ctr", "impressions", "clicks"]:
                return f"Atenção: {metric_name.capitalize()} caiu {abs(change):.1f}%. Investigue as causas."
            elif metric in ["spend", "cpc"]:
                return f"Bom: {metric_name.capitalize()} reduziu {abs(change):.1f}%. Verifique se o volume está adequado."
            else:
                return f"{metric_name.capitalize()} reduziu {abs(change):.1f}%."
        else:
            return f"{metric_name.capitalize()} está estável (variação de {abs(change):.1f}%)."

    async def _compare_campaigns(self, campaign_ids: Optional[list[str]]) -> str:
        try:
            campaigns = await self.meta_api.get_campaigns()
            active_campaigns = [c for c in campaigns if c.get("status") == "ACTIVE"]

            if campaign_ids:
                active_campaigns = [c for c in active_campaigns if c["id"] in campaign_ids]

            comparison = []
            for campaign in active_campaigns[:10]:
                insights = await self.meta_api.get_campaign_insights(campaign["id"], "last_7d")
                if not insights:
                    continue

                comparison.append({
                    "campaign_id": campaign["id"],
                    "campaign_name": campaign["name"],
                    "spend": insights.get("spend", 0),
                    "impressions": insights.get("impressions", 0),
                    "clicks": insights.get("clicks", 0),
                    "conversions": insights.get("conversions", 0),
                    "ctr": insights.get("ctr", 0),
                    "cpc": insights.get("cpc", 0),
                })

            if not comparison:
                return json.dumps({"error": "Nenhuma campanha com dados para comparar"})

            best_ctr = max(comparison, key=lambda x: x["ctr"])
            best_conversions = max(comparison, key=lambda x: x["conversions"])
            lowest_cpc = min(comparison, key=lambda x: x["cpc"] if x["cpc"] > 0 else float("inf"))

            return json.dumps({
                "campaigns_compared": len(comparison),
                "comparison": comparison,
                "highlights": {
                    "best_ctr": {
                        "campaign": best_ctr["campaign_name"],
                        "value": best_ctr["ctr"],
                    },
                    "best_conversions": {
                        "campaign": best_conversions["campaign_name"],
                        "value": best_conversions["conversions"],
                    },
                    "lowest_cpc": {
                        "campaign": lowest_cpc["campaign_name"],
                        "value": lowest_cpc["cpc"],
                    },
                },
            })
        except Exception as e:
            return json.dumps({"error": str(e)})

    async def _generate_insights(self) -> str:
        try:
            campaigns = await self.meta_api.get_campaigns()
            active_campaigns = [c for c in campaigns if c.get("status") == "ACTIVE"]

            insights = []
            total_spend = 0
            total_conversions = 0
            total_clicks = 0

            for campaign in active_campaigns:
                campaign_insights = await self.meta_api.get_campaign_insights(campaign["id"], "last_7d")
                if campaign_insights:
                    total_spend += campaign_insights.get("spend", 0)
                    total_conversions += campaign_insights.get("conversions", 0)
                    total_clicks += campaign_insights.get("clicks", 0)

            if total_conversions > 0:
                cpa = total_spend / total_conversions
                insights.append({
                    "type": "cpa",
                    "title": "Custo por Aquisição",
                    "value": f"R$ {cpa:.2f}",
                    "description": f"Você está pagando em média R$ {cpa:.2f} por conversão.",
                })

            if total_clicks > 0:
                avg_cpc = total_spend / total_clicks
                insights.append({
                    "type": "cpc_average",
                    "title": "CPC Médio",
                    "value": f"R$ {avg_cpc:.2f}",
                    "description": f"O custo médio por clique é R$ {avg_cpc:.2f}.",
                })

            insights.append({
                "type": "active_campaigns",
                "title": "Campanhas Ativas",
                "value": str(len(active_campaigns)),
                "description": f"Você tem {len(active_campaigns)} campanhas ativas.",
            })

            insights.append({
                "type": "weekly_spend",
                "title": "Gasto Semanal",
                "value": f"R$ {total_spend:.2f}",
                "description": f"Gasto total nos últimos 7 dias: R$ {total_spend:.2f}.",
            })

            return json.dumps({
                "insights": insights,
                "summary": {
                    "total_spend": round(total_spend, 2),
                    "total_conversions": total_conversions,
                    "total_clicks": total_clicks,
                    "active_campaigns": len(active_campaigns),
                },
            })
        except Exception as e:
            return json.dumps({"error": str(e)})
