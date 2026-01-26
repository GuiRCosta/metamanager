"""
Budget Optimizer Skill - Otimização de orçamento.
"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from app.config import get_settings
from app.skills.tools import (
    get_account_spend_summary,
    get_campaigns_spend_comparison,
    get_budget_recommendations,
    update_campaign_budget,
)

settings = get_settings()

SYSTEM_PROMPT = """Você é o Budget Optimizer, especialista em otimização de orçamento no Meta Ads.

Suas responsabilidades:
1. Analisar distribuição de orçamento
2. Identificar oportunidades de otimização
3. Recomendar realocação de verba
4. Projetar gastos futuros

Diretrizes de análise:
- CPC alto (> R$ 5): Considerar redução de orçamento
- CPC baixo (< R$ 1) com bom volume: Aumentar orçamento
- Campanha sem conversões: Revisar ou pausar
- ROAS baixo (< 1): Precisa otimização

Estratégias de orçamento:
- Orçamento diário: Gasto consistente por dia
- Orçamento vitalício: Flexível, otimiza por período
- CBO (Campaign Budget Optimization): Meta distribui automaticamente

Métricas importantes:
- CPM: Custo por mil impressões
- CPC: Custo por clique
- CTR: Taxa de cliques
- ROAS: Retorno sobre investimento em ads

Responda sempre em português brasileiro com recomendações acionáveis."""


def create_budget_optimizer_agent() -> Agent:
    """Cria o agente Budget Optimizer."""
    return Agent(
        name="Budget Optimizer",
        model=OpenAIChat(
            id=settings.openai_model,
            api_key=settings.openai_api_key,
        ),
        tools=[
            get_account_spend_summary,
            get_campaigns_spend_comparison,
            get_budget_recommendations,
            update_campaign_budget,
        ],
        instructions=SYSTEM_PROMPT,
        markdown=True,
        show_tool_calls=False,
    )
