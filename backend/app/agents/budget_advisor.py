from typing import Optional
from datetime import datetime
import json

from app.agents.base_agent import BaseAgent
from app.tools.meta_api import MetaAPI


class BudgetAdvisorAgent(BaseAgent):
    """Agente especializado em consultoria de orçamento."""

    def __init__(self):
        super().__init__(
            name="budget_advisor",
            description="Consultor de orçamento e previsões financeiras",
        )
        self.meta_api = MetaAPI()

    def _register_tools(self) -> list[dict]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "analyze_budget_distribution",
                    "description": "Analisa a distribuição de orçamento entre campanhas",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "total_budget": {
                                "type": "number",
                                "description": "Orçamento total disponível em R$",
                            },
                        },
                        "required": [],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "forecast_monthly_spend",
                    "description": "Projeta o gasto mensal baseado no ritmo atual",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "budget_limit": {
                                "type": "number",
                                "description": "Limite de orçamento mensal em R$",
                            },
                        },
                        "required": [],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "suggest_reallocation",
                    "description": "Sugere realocação de orçamento entre campanhas",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "optimization_goal": {
                                "type": "string",
                                "description": "Objetivo da otimização",
                                "enum": ["maximize_conversions", "maximize_reach", "balance"],
                            },
                        },
                        "required": [],
                    },
                },
            },
        ]

    def _get_system_prompt(self, context: Optional[dict] = None) -> str:
        base_prompt = """Você é um consultor financeiro especializado em orçamentos de mídia paga.

Seu papel é:
1. Analisar a distribuição de orçamento entre campanhas
2. Fazer projeções de gasto mensal
3. Identificar riscos de overspending
4. Sugerir realocações para maximizar resultados

Diretrizes:
- Seja preciso com números e projeções
- Alerte sobre riscos de ultrapassar o orçamento
- Sugira alocações baseadas em performance histórica
- Comunique-se de forma clara em português"""

        if context:
            context_info = f"""

Contexto do usuário:
- Campanhas ativas: {context.get('active_campaigns', 'N/A')}
- Gasto total do mês: R$ {context.get('total_spend', 'N/A')}
- Limite mensal: R$ {context.get('monthly_budget', 'N/A')}
- ROAS médio: {context.get('average_roas', 'N/A')}x"""
            return base_prompt + context_info

        return base_prompt

    async def _execute_tool(self, tool_name: str, arguments: dict) -> str:
        if tool_name == "analyze_budget_distribution":
            return await self._analyze_budget_distribution(
                arguments.get("total_budget", 5000)
            )
        elif tool_name == "forecast_monthly_spend":
            return await self._forecast_monthly_spend(
                arguments.get("budget_limit", 5000)
            )
        elif tool_name == "suggest_reallocation":
            return await self._suggest_reallocation(
                arguments.get("optimization_goal", "balance")
            )

        return json.dumps({"error": f"Ferramenta {tool_name} não encontrada"})

    async def _analyze_budget_distribution(self, total_budget: float) -> str:
        try:
            campaigns = await self.meta_api.get_campaigns()
            active_campaigns = [c for c in campaigns if c.get("status") == "ACTIVE"]

            distribution = []
            total_daily_budget = 0

            for campaign in active_campaigns:
                daily_budget = campaign.get("daily_budget", 0)
                if daily_budget:
                    daily_budget = daily_budget / 100

                total_daily_budget += daily_budget

                distribution.append({
                    "campaign_id": campaign["id"],
                    "campaign_name": campaign["name"],
                    "daily_budget": daily_budget,
                    "percentage": 0,
                })

            if total_daily_budget > 0:
                for item in distribution:
                    item["percentage"] = round(
                        (item["daily_budget"] / total_daily_budget) * 100, 2
                    )

            projected_monthly = total_daily_budget * 30
            budget_status = "OK" if projected_monthly <= total_budget else "ALERTA"

            return json.dumps({
                "distribution": distribution,
                "total_daily_budget": round(total_daily_budget, 2),
                "projected_monthly": round(projected_monthly, 2),
                "budget_limit": total_budget,
                "status": budget_status,
                "overspend_risk": projected_monthly > total_budget,
            })
        except Exception as e:
            return json.dumps({"error": str(e)})

    async def _forecast_monthly_spend(self, budget_limit: float) -> str:
        try:
            now = datetime.now()
            days_elapsed = now.day
            days_in_month = 30

            account_insights = await self.meta_api.get_account_insights("this_month")
            current_spend = float(account_insights.get("spend", 0))

            daily_average = current_spend / days_elapsed if days_elapsed > 0 else 0
            projected_monthly = daily_average * days_in_month
            remaining_days = days_in_month - days_elapsed
            remaining_budget = budget_limit - current_spend

            if remaining_budget > 0 and remaining_days > 0:
                recommended_daily = remaining_budget / remaining_days
            else:
                recommended_daily = 0

            status = "OK"
            if projected_monthly > budget_limit:
                status = "ALERTA_OVERSPEND"
            elif projected_monthly > budget_limit * 0.8:
                status = "ALERTA_PROXIMO_LIMITE"

            return json.dumps({
                "current_spend": round(current_spend, 2),
                "daily_average": round(daily_average, 2),
                "projected_monthly": round(projected_monthly, 2),
                "budget_limit": budget_limit,
                "percentage_used": round((current_spend / budget_limit) * 100, 2),
                "days_elapsed": days_elapsed,
                "remaining_days": remaining_days,
                "remaining_budget": round(remaining_budget, 2),
                "recommended_daily": round(recommended_daily, 2),
                "status": status,
            })
        except Exception as e:
            return json.dumps({"error": str(e)})

    async def _suggest_reallocation(self, optimization_goal: str) -> str:
        try:
            campaigns = await self.meta_api.get_campaigns()
            active_campaigns = [c for c in campaigns if c.get("status") == "ACTIVE"]

            campaign_performance = []
            for campaign in active_campaigns:
                insights = await self.meta_api.get_campaign_insights(campaign["id"], "last_7d")
                if not insights:
                    continue

                daily_budget = campaign.get("daily_budget", 0)
                if daily_budget:
                    daily_budget = daily_budget / 100

                campaign_performance.append({
                    "campaign_id": campaign["id"],
                    "campaign_name": campaign["name"],
                    "current_budget": daily_budget,
                    "spend": insights.get("spend", 0),
                    "conversions": insights.get("conversions", 0),
                    "ctr": insights.get("ctr", 0),
                    "roas": insights.get("roas", 0),
                })

            suggestions = []
            if optimization_goal == "maximize_conversions":
                sorted_campaigns = sorted(
                    campaign_performance,
                    key=lambda x: x["conversions"],
                    reverse=True,
                )
            elif optimization_goal == "maximize_reach":
                sorted_campaigns = sorted(
                    campaign_performance,
                    key=lambda x: x["ctr"],
                    reverse=True,
                )
            else:
                sorted_campaigns = campaign_performance

            for i, campaign in enumerate(sorted_campaigns):
                if i < len(sorted_campaigns) // 2:
                    action = "increase"
                    suggested = campaign["current_budget"] * 1.2
                    reason = "Alta performance"
                else:
                    action = "decrease"
                    suggested = campaign["current_budget"] * 0.8
                    reason = "Performance abaixo da média"

                suggestions.append({
                    "campaign_id": campaign["campaign_id"],
                    "campaign_name": campaign["campaign_name"],
                    "current_budget": campaign["current_budget"],
                    "suggested_budget": round(suggested, 2),
                    "action": action,
                    "reason": reason,
                })

            return json.dumps({
                "optimization_goal": optimization_goal,
                "suggestions": suggestions,
                "total_campaigns": len(campaign_performance),
            })
        except Exception as e:
            return json.dumps({"error": str(e)})
