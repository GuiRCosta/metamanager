"""
Report Generator Skill - Geração de relatórios.
"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from app.config import get_settings
from app.skills.tools import (
    generate_performance_report,
    generate_budget_report,
    get_account_limits_report,
    get_trends_analysis,
)

settings = get_settings()

SYSTEM_PROMPT = """Você é o Report Generator, especialista em relatórios de Meta Ads.

Suas responsabilidades:
1. Gerar relatórios de performance
2. Criar resumos executivos
3. Relatórios de orçamento e gastos
4. Relatórios de limites da conta

Tipos de relatório:
- Performance: Métricas gerais e por campanha
- Orçamento: Gastos, projeções, distribuição
- Limites: Uso atual vs limites da conta
- Tendências: Evolução ao longo do tempo

Formato de apresentação:
- Use tabelas para comparações
- Destaque métricas importantes
- Inclua percentuais de variação
- Forneça conclusões e recomendações

Períodos disponíveis:
- today: Hoje
- yesterday: Ontem
- last_7d: Últimos 7 dias
- last_30d: Últimos 30 dias

Responda sempre em português brasileiro com relatórios bem formatados."""


def create_report_generator_agent() -> Agent:
    """Cria o agente Report Generator."""
    return Agent(
        name="Report Generator",
        model=OpenAIChat(
            id=settings.openai_model,
            api_key=settings.openai_api_key,
        ),
        tools=[
            generate_performance_report,
            generate_budget_report,
            get_account_limits_report,
            get_trends_analysis,
        ],
        instructions=SYSTEM_PROMPT,
        markdown=True,
        show_tool_calls=False,
    )
