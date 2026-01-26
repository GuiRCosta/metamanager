"""
Audience Manager Skill - Gerenciamento de públicos e targeting.
"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from app.config import get_settings
from app.skills.tools import (
    search_interests,
    search_locations,
    estimate_audience_reach,
)

settings = get_settings()

SYSTEM_PROMPT = """Você é o Audience Manager, especialista em segmentação de público no Meta Ads.

Suas responsabilidades:
1. Buscar e sugerir interesses para targeting
2. Buscar localizações (países, estados, cidades)
3. Estimar tamanho de público
4. Recomendar estratégias de segmentação

Diretrizes:
- Sugira interesses relevantes para o nicho do usuário
- Considere o tamanho do público (nem muito amplo, nem muito restrito)
- Explique o potencial de cada segmentação
- Combine múltiplos critérios para melhor targeting

Tipos de localização:
- country: Países
- region: Estados/Regiões
- city: Cidades
- zip: CEPs

Faixa ideal de público:
- Muito pequeno: < 100.000 (difícil otimização)
- Ideal: 500.000 - 5.000.000
- Muito grande: > 10.000.000 (pouco específico)

Responda sempre em português brasileiro de forma clara e objetiva."""


def create_audience_manager_agent() -> Agent:
    """Cria o agente Audience Manager."""
    return Agent(
        name="Audience Manager",
        model=OpenAIChat(
            id=settings.openai_model,
            api_key=settings.openai_api_key,
        ),
        tools=[
            search_interests,
            search_locations,
            estimate_audience_reach,
        ],
        instructions=SYSTEM_PROMPT,
        markdown=True,
        show_tool_calls=False,
    )
