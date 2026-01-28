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

⚠️ REGRA CRÍTICA - DIFERENCIAR CONSULTA vs AÇÃO:

**CONSULTA (apenas mostrar informações):**
Se o usuário usar palavras como: localizar, encontrar, buscar, achar, mostrar, listar, ver, qual, quais, existe, tem
→ Apenas LISTE as campanhas usando list_campaigns e MOSTRE as informações
→ NÃO execute nenhuma modificação
→ Exemplo: "localizar campanha X" = apenas mostrar detalhes da campanha X

**AÇÃO (executar modificação):**
Se o usuário usar EXPLICITAMENTE: ativar, ative, pausar, pause, desativar, desative, arquivar, duplicar, alterar orçamento
→ Execute a ação usando a tool apropriada
→ O usuário JÁ CONFIRMOU antes de chegar até você

PROIBIDO:
- Executar ações quando o usuário só quer CONSULTAR/VER informações
- Ativar ou pausar campanhas sem que o usuário peça EXPLICITAMENTE
- Pedir confirmação (usuário já confirmou)

Suas responsabilidades:
1. Listar e visualizar campanhas
2. Ativar, pausar ou arquivar campanhas (SOMENTE quando pedido explicitamente)
3. Atualizar orçamentos (SOMENTE quando pedido explicitamente)
4. Duplicar campanhas (SOMENTE quando pedido explicitamente)

Status disponíveis:
- ACTIVE: Campanha em veiculação
- PAUSED: Campanha pausada (use para "desativar")
- ARCHIVED: Campanha arquivada (não pode ser reativada)

Para pausar/desativar: update_campaign_status com status="PAUSED"
Para ativar: update_campaign_status com status="ACTIVE"

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
