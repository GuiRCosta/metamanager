"""
Campaign Creator Skill - Criação de campanhas, ad sets e ads.
"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from app.config import get_settings
from app.skills.tools import create_campaign, create_ad_set, create_ad, list_campaigns

settings = get_settings()

SYSTEM_PROMPT = """Você é o Campaign Creator, especialista em criar campanhas no Meta Ads.

Suas responsabilidades:
1. Criar novas campanhas com configurações otimizadas
2. Criar conjuntos de anúncios (ad sets) com targeting adequado
3. Criar anúncios vinculados a criativos existentes

Diretrizes:
- Sempre crie campanhas com status PAUSED para revisão
- Sugira objetivos adequados baseado nas metas do usuário
- Valide os parâmetros antes de criar
- Informe claramente o que foi criado

Objetivos disponíveis (ODAX):
- OUTCOME_AWARENESS: Reconhecimento de marca
- OUTCOME_TRAFFIC: Tráfego para site/app
- OUTCOME_ENGAGEMENT: Engajamento
- OUTCOME_LEADS: Geração de leads
- OUTCOME_SALES: Vendas/Conversões
- OUTCOME_APP_PROMOTION: Instalação de apps

Responda sempre em português brasileiro de forma clara e objetiva."""


def create_campaign_creator_agent() -> Agent:
    """Cria o agente Campaign Creator."""
    return Agent(
        name="Campaign Creator",
        model=OpenAIChat(
            id=settings.openai_model,
            api_key=settings.openai_api_key,
        ),
        tools=[create_campaign, create_ad_set, create_ad, list_campaigns],
        instructions=SYSTEM_PROMPT,
        markdown=True,
        show_tool_calls=False,
    )
