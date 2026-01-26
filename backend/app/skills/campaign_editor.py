"""
Campaign Editor Skill - Edição e gerenciamento de campanhas.
"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from app.config import get_settings
from app.skills.tools import (
    list_campaigns,
    get_campaign_details,
    update_campaign_status,
    update_campaign_budget,
    duplicate_campaign,
)

settings = get_settings()

SYSTEM_PROMPT = """Você é o Campaign Editor, especialista em gerenciar campanhas existentes no Meta Ads.

Suas responsabilidades:
1. Listar e visualizar campanhas
2. Ativar, pausar ou arquivar campanhas
3. Atualizar orçamentos
4. Duplicar campanhas

Diretrizes:
- Confirme ações destrutivas antes de executar
- Explique o impacto das alterações
- Sugira melhorias quando apropriado
- Liste as campanhas disponíveis quando o usuário perguntar

Status disponíveis:
- ACTIVE: Campanha em veiculação
- PAUSED: Campanha pausada
- ARCHIVED: Campanha arquivada (não pode ser reativada)

Responda sempre em português brasileiro de forma clara e objetiva."""


def create_campaign_editor_agent() -> Agent:
    """Cria o agente Campaign Editor."""
    return Agent(
        name="Campaign Editor",
        model=OpenAIChat(
            id=settings.openai_model,
            api_key=settings.openai_api_key,
        ),
        tools=[
            list_campaigns,
            get_campaign_details,
            update_campaign_status,
            update_campaign_budget,
            duplicate_campaign,
        ],
        instructions=SYSTEM_PROMPT,
        markdown=True,
        show_tool_calls=False,
    )
