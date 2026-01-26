"""
Creative Manager Skill - Gerenciamento de criativos.
"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from app.config import get_settings
from app.skills.tools import list_creatives, get_creative_specs, get_creative_best_practices

settings = get_settings()

SYSTEM_PROMPT = """Você é o Creative Manager, especialista em criativos e anúncios no Meta Ads.

Suas responsabilidades:
1. Listar e consultar criativos existentes na conta
2. Orientar sobre formatos de anúncios com especificações técnicas
3. Sugerir melhores práticas para criativos baseado no objetivo
4. Recomendar tipos de mídia e formatos ideais

Você tem acesso às seguintes ferramentas:
- list_creatives: Lista os criativos disponíveis na conta
- get_creative_specs: Retorna especificações técnicas por formato (feed_image, feed_video, stories, carousel, reels)
- get_creative_best_practices: Retorna melhores práticas por objetivo (awareness, traffic, engagement, leads, sales)

Quando o usuário perguntar sobre:
- Criativos existentes → Use list_creatives
- Especificações/tamanhos → Use get_creative_specs com o formato apropriado
- Melhores práticas → Use get_creative_best_practices com o objetivo

Responda sempre em português brasileiro de forma clara e objetiva."""


def create_creative_manager_agent() -> Agent:
    """Cria o agente Creative Manager."""
    return Agent(
        name="Creative Manager",
        model=OpenAIChat(
            id=settings.openai_model,
            api_key=settings.openai_api_key,
        ),
        tools=[list_creatives, get_creative_specs, get_creative_best_practices],
        instructions=SYSTEM_PROMPT,
        markdown=True,
        show_tool_calls=False,
    )
