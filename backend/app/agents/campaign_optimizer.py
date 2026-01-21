from typing import Optional
import json

from app.agents.base_agent import BaseAgent
from app.tools.meta_api import MetaAPI


class CampaignOptimizerAgent(BaseAgent):
    """Agente especializado em otimização de campanhas."""

    def __init__(self):
        super().__init__(
            name="campaign_optimizer",
            description="Especialista em otimização de campanhas Meta Ads",
        )
        self.meta_api = MetaAPI()

    def _register_tools(self) -> list[dict]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_campaign_metrics",
                    "description": "Obtém métricas de performance de uma campanha",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "campaign_id": {
                                "type": "string",
                                "description": "ID da campanha",
                            },
                            "date_range": {
                                "type": "string",
                                "description": "Período (last_7d, last_30d)",
                                "enum": ["last_7d", "last_30d"],
                            },
                        },
                        "required": ["campaign_id"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "suggest_budget_adjustment",
                    "description": "Sugere ajuste de orçamento baseado no ROAS",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "campaign_id": {
                                "type": "string",
                                "description": "ID da campanha",
                            },
                            "current_budget": {
                                "type": "number",
                                "description": "Orçamento atual em R$",
                            },
                            "target_roas": {
                                "type": "number",
                                "description": "ROAS alvo desejado",
                            },
                        },
                        "required": ["campaign_id", "current_budget"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "analyze_low_performers",
                    "description": "Identifica campanhas com baixa performance",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "min_ctr": {
                                "type": "number",
                                "description": "CTR mínimo aceitável (%)",
                            },
                            "min_conversions": {
                                "type": "integer",
                                "description": "Conversões mínimas esperadas",
                            },
                        },
                        "required": [],
                    },
                },
            },
        ]

    def _get_system_prompt(self, context: Optional[dict] = None) -> str:
        base_prompt = """Você é um especialista em otimização de campanhas Meta Ads.

Seu papel é:
1. Analisar métricas de performance das campanhas
2. Identificar oportunidades de melhoria
3. Sugerir ajustes de orçamento baseados em ROAS
4. Recomendar pausas em campanhas de baixa performance

Diretrizes:
- Seja objetivo e baseie-se em dados
- Forneça recomendações acionáveis
- Explique o raciocínio por trás das sugestões
- Use linguagem clara e profissional em português"""

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
        if tool_name == "get_campaign_metrics":
            return await self._get_campaign_metrics(
                arguments["campaign_id"],
                arguments.get("date_range", "last_7d"),
            )
        elif tool_name == "suggest_budget_adjustment":
            return await self._suggest_budget_adjustment(
                arguments["campaign_id"],
                arguments["current_budget"],
                arguments.get("target_roas", 3.0),
            )
        elif tool_name == "analyze_low_performers":
            return await self._analyze_low_performers(
                arguments.get("min_ctr", 1.0),
                arguments.get("min_conversions", 5),
            )

        return json.dumps({"error": f"Ferramenta {tool_name} não encontrada"})

    async def _get_campaign_metrics(self, campaign_id: str, date_range: str) -> str:
        try:
            insights = await self.meta_api.get_campaign_insights(campaign_id, date_range)
            if not insights:
                return json.dumps({"error": "Métricas não encontradas"})
            return json.dumps(insights)
        except Exception as e:
            return json.dumps({"error": str(e)})

    async def _suggest_budget_adjustment(
        self,
        campaign_id: str,
        current_budget: float,
        target_roas: float,
    ) -> str:
        try:
            insights = await self.meta_api.get_campaign_insights(campaign_id, "last_7d")
            if not insights:
                return json.dumps({"error": "Métricas não encontradas"})

            current_roas = insights.get("roas", 0) or 0
            spend = insights.get("spend", 0)
            conversions = insights.get("conversions", 0)

            if current_roas >= target_roas:
                recommendation = "increase"
                suggested_budget = current_budget * 1.2
                reason = f"ROAS atual ({current_roas:.2f}x) acima do alvo ({target_roas}x)"
            elif current_roas > 0 and current_roas < target_roas * 0.5:
                recommendation = "decrease"
                suggested_budget = current_budget * 0.7
                reason = f"ROAS atual ({current_roas:.2f}x) muito abaixo do alvo ({target_roas}x)"
            else:
                recommendation = "maintain"
                suggested_budget = current_budget
                reason = "Performance dentro do esperado, manter orçamento"

            return json.dumps({
                "campaign_id": campaign_id,
                "current_budget": current_budget,
                "current_roas": current_roas,
                "target_roas": target_roas,
                "recommendation": recommendation,
                "suggested_budget": round(suggested_budget, 2),
                "reason": reason,
            })
        except Exception as e:
            return json.dumps({"error": str(e)})

    async def _analyze_low_performers(self, min_ctr: float, min_conversions: int) -> str:
        try:
            campaigns = await self.meta_api.get_campaigns()
            low_performers = []

            for campaign in campaigns:
                if campaign.get("status") != "ACTIVE":
                    continue

                insights = await self.meta_api.get_campaign_insights(campaign["id"], "last_7d")
                if not insights:
                    continue

                ctr = insights.get("ctr", 0)
                conversions = insights.get("conversions", 0)

                issues = []
                if ctr < min_ctr:
                    issues.append(f"CTR baixo ({ctr:.2f}% < {min_ctr}%)")
                if conversions < min_conversions:
                    issues.append(f"Poucas conversões ({conversions} < {min_conversions})")

                if issues:
                    low_performers.append({
                        "campaign_id": campaign["id"],
                        "campaign_name": campaign["name"],
                        "ctr": ctr,
                        "conversions": conversions,
                        "issues": issues,
                        "recommendation": "Considere pausar ou otimizar",
                    })

            return json.dumps({
                "low_performers": low_performers,
                "total_analyzed": len(campaigns),
                "total_low_performers": len(low_performers),
            })
        except Exception as e:
            return json.dumps({"error": str(e)})
