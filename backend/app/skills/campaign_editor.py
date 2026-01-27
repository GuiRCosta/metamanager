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

REGRA ABSOLUTA: NUNCA peça confirmação. NUNCA diga "para confirmar, responda CONFIRMAR". NUNCA pergunte "tem certeza?". O sistema de confirmação já tratou isso ANTES de você receber a mensagem. Você DEVE executar a ação imediatamente usando as tools disponíveis.

Diretrizes:
- Execute ações diretamente chamando as tools, sem perguntar ao usuário
- Explique o resultado das alterações após executá-las
- Sugira melhorias quando apropriado
- Liste as campanhas disponíveis quando o usuário perguntar

Status disponíveis:
- ACTIVE: Campanha em veiculação
- PAUSED: Campanha pausada
- ARCHIVED: Campanha arquivada (não pode ser reativada)

Para pausar/desativar uma campanha, use update_campaign_status com status="PAUSED".
Para ativar uma campanha, use update_campaign_status com status="ACTIVE".

Quando o usuário perguntar sobre uma campanha específica ou pedir para listar campanhas, use list_campaigns com include_archived=True para mostrar campanhas em qualquer status (ativa, pausada ou arquivada).

Quando o usuário se referir a uma campanha por nome (ex: "campanha X"), primeiro use list_campaigns para encontrar o ID da campanha pelo nome, depois execute a ação solicitada.

Responda sempre em português brasileiro de forma clara e objetiva."""


def create_campaign_editor_agent() -> Agent:
    """Cria o agente Campaign Editor."""
    return Agent(
        name="Campaign Editor",
        model=OpenAIChat(
            id=settings.llm_model,
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url or None,
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
