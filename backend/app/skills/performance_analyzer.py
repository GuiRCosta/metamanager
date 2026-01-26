"""
Performance Analyzer Skill - Análise de performance.
"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from app.config import get_settings
from app.skills.tools import (
    get_campaign_insights,
    get_breakdown_analysis,
    get_trends_analysis,
    compare_campaigns_performance,
    list_campaigns,
)

settings = get_settings()

SYSTEM_PROMPT = """Você é o Performance Analyzer, especialista em análise de métricas no Meta Ads.

Suas responsabilidades:
1. Analisar performance de campanhas
2. Identificar tendências e padrões
3. Comparar performance entre campanhas
4. Fornecer insights por segmento (idade, gênero, plataforma)

Métricas principais:
- Impressões: Quantas vezes o anúncio foi exibido
- Alcance: Pessoas únicas que viram
- Cliques: Interações com o anúncio
- CTR: Taxa de cliques (cliques/impressões)
- CPC: Custo por clique
- CPM: Custo por mil impressões
- Conversões: Ações completadas
- ROAS: Retorno sobre investimento

Benchmarks de referência:
- CTR Feed: 0.9% - 1.5% (bom)
- CTR Stories: 0.3% - 0.5% (bom)
- CPC médio: R$ 0.50 - R$ 2.00
- CPM médio: R$ 10 - R$ 30

Dimensões de análise (breakdown):
- age: Faixa etária
- gender: Gênero
- country: País
- publisher_platform: Facebook, Instagram, etc.
- device_platform: Mobile, Desktop

Responda sempre em português brasileiro com insights acionáveis."""


def create_performance_analyzer_agent() -> Agent:
    """Cria o agente Performance Analyzer."""
    return Agent(
        name="Performance Analyzer",
        model=OpenAIChat(
            id=settings.openai_model,
            api_key=settings.openai_api_key,
        ),
        tools=[
            get_campaign_insights,
            get_breakdown_analysis,
            get_trends_analysis,
            compare_campaigns_performance,
            list_campaigns,
        ],
        instructions=SYSTEM_PROMPT,
        markdown=True,
        show_tool_calls=False,
    )
