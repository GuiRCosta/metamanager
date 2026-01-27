"""
Campaign Orchestrator - Coordena todos os skills de campanha.
"""

import re
from typing import Optional
from agno.agent import Agent
from agno.models.openai import OpenAIChat

from app.config import get_settings
from app.skills.campaign_creator import create_campaign_creator_agent
from app.skills.campaign_editor import create_campaign_editor_agent
from app.skills.audience_manager import create_audience_manager_agent
from app.skills.creative_manager import create_creative_manager_agent
from app.skills.budget_optimizer import create_budget_optimizer_agent
from app.skills.performance_analyzer import create_performance_analyzer_agent
from app.skills.report_generator import create_report_generator_agent
from app.skills.tools import set_current_ad_account

settings = get_settings()


class CampaignOrchestrator:
    """
    Orquestrador central que roteia mensagens para os skills apropriados.

    Arquitetura:
    - Campaign Creator: Criação de campanhas, ad sets, ads
    - Campaign Editor: Edição, ativação, pausa, duplicação
    - Audience Manager: Targeting, interesses, localizações
    - Creative Manager: Criativos e formatos de anúncio
    - Budget Optimizer: Orçamento e alocação de verba
    - Performance Analyzer: Análise de métricas
    - Report Generator: Geração de relatórios
    """

    # Intents que modificam dados e precisam de confirmação
    MODIFYING_INTENTS = {"creator", "editor", "budget"}

    # Palavras-chave que indicam ações de modificação
    MODIFICATION_KEYWORDS = [
        # Criar
        "criar", "crie", "adicionar", "adicione", "lançar", "lance",
        "create", "launch",
        # Editar
        "editar", "edite", "alterar", "altere", "modificar", "modifique",
        "atualizar", "atualize", "edit", "update",
        # Pausar/Ativar
        "pausar", "pause", "ativar", "ative", "ativa", "activate", "parar", "pare",
        # Deletar/Arquivar
        "arquivar", "archive", "deletar", "delete", "excluir", "exclua",
        # Duplicar
        "duplicar", "duplique", "copiar", "copie", "clonar", "clone", "duplicate",
        # Orçamento
        "aumentar", "aumente", "reduzir", "reduza",
        "mudar orçamento", "alterar budget",
        # Desativar
        "desativar", "desative", "desativa", "disable",
    ]

    # Palavras-chave que indicam ações em massa (mais perigosas)
    BULK_KEYWORDS = ["todas", "todos", "all", "tudo"]

    # Palavras-chave para roteamento
    INTENT_KEYWORDS = {
        "creator": [
            "criar", "crie", "adicionar", "adicione", "lançar", "lance",
            "create", "launch", "iniciar",
        ],
        "editor": [
            "editar", "alterar", "modificar", "atualizar",
            "pausar", "pause", "ativar", "ative", "ativa",
            "arquivar", "deletar", "excluir",
            "duplicar", "copiar", "clonar", "status",
            "edit", "update", "activate", "delete",
            "desativar", "desative", "desativa",
        ],
        "audience": [
            "público", "audiência", "targeting", "segmentação",
            "interesse", "interesses", "localização", "local",
            "idade", "gênero", "demográfico", "alcance",
            "audience", "target", "location", "interest",
        ],
        "creative": [
            "criativo", "imagem", "vídeo", "carrossel",
            "formato", "anúncio", "visual", "mídia",
            "creative", "image", "video", "format",
        ],
        "budget": [
            "orçamento", "budget", "gasto", "gastar",
            "dinheiro", "investimento", "custo", "verba",
            "realocar", "distribuir", "limite", "projeção",
        ],
        "analyzer": [
            "analisar", "análise", "métrica", "performance",
            "desempenho", "comparar", "comparação", "tendência",
            "ctr", "cpc", "cpm", "roas", "conversão",
            "analyze", "metrics", "trend", "compare",
        ],
        "reporter": [
            "relatório", "report", "resumo", "summary",
            "exportar", "gerar relatório", "visão geral",
            "overview", "export", "dashboard",
        ],
    }

    def __init__(self):
        """Inicializa o orquestrador com todos os skills."""
        self._skills = {}
        self._initialize_skills()

    def _initialize_skills(self):
        """Inicializa os skills sob demanda."""
        # Skills são criados sob demanda para economizar recursos
        pass

    def _get_skill(self, skill_name: str) -> Agent:
        """Obtém ou cria um skill."""
        if skill_name not in self._skills:
            skill_creators = {
                "creator": create_campaign_creator_agent,
                "editor": create_campaign_editor_agent,
                "audience": create_audience_manager_agent,
                "creative": create_creative_manager_agent,
                "budget": create_budget_optimizer_agent,
                "analyzer": create_performance_analyzer_agent,
                "reporter": create_report_generator_agent,
            }
            if skill_name in skill_creators:
                self._skills[skill_name] = skill_creators[skill_name]()
        return self._skills.get(skill_name)

    def _requires_confirmation(self, message: str) -> tuple[bool, str]:
        """
        Verifica se a mensagem indica uma ação que modifica dados.

        Returns:
            Tuple (requires_confirmation, warning_message)
        """
        message_lower = message.lower()

        has_modification = any(kw in message_lower for kw in self.MODIFICATION_KEYWORDS)
        if not has_modification:
            return False, ""

        is_bulk = any(kw in message_lower for kw in self.BULK_KEYWORDS)

        if any(w in message_lower for w in ["arquivar", "archive", "deletar", "delete", "excluir", "exclua"]):
            if is_bulk:
                return True, "Você está prestes a **ARQUIVAR/EXCLUIR múltiplas campanhas**. Esta ação é irreversível.\n\nPara confirmar, responda **CONFIRMAR**."
            return True, f"Você solicitou uma ação de **exclusão/arquivamento**.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if any(w in message_lower for w in ["pausar", "pause", "parar", "pare"]):
            if is_bulk:
                return True, "Você está prestes a **PAUSAR múltiplas campanhas**.\n\nPara confirmar, responda **CONFIRMAR**."
            return True, f"Você solicitou **pausar** uma campanha.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if any(w in message_lower for w in ["ativar", "ative", "ativa", "activate"]):
            return True, f"Você solicitou **ativar** uma campanha.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if any(w in message_lower for w in ["criar", "crie", "create", "launch", "lançar", "lance", "adicionar", "adicione"]):
            return True, f"Você solicitou **criar** um novo recurso.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if any(w in message_lower for w in ["duplicar", "duplique", "copiar", "copie", "clonar", "clone", "duplicate"]):
            return True, f"Você solicitou **duplicar** uma campanha.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if any(w in message_lower for w in ["aumentar", "aumente", "reduzir", "reduza", "alterar", "altere", "modificar", "modifique", "editar", "edite", "atualizar", "atualize", "mudar", "mude"]):
            return True, f"Você solicitou uma **modificação**.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if any(w in message_lower for w in ["desativar", "desative", "desativa", "disable"]):
            return True, f"Você solicitou **desativar** um recurso.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        return True, f"Você solicitou uma ação que modifica dados.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

    def _is_confirmation(self, message: str) -> bool:
        """Verifica se a mensagem é uma confirmação."""
        message_lower = message.lower()
        confirmations = [
            "confirmar", "confirm", "sim", "yes",
            "confirmar pausa", "confirmar exclusão", "confirmar desativação",
        ]
        return any(c in message_lower for c in confirmations)

    def _detect_intent(self, message: str) -> str:
        """Detecta a intenção da mensagem e retorna o skill apropriado."""
        message_lower = message.lower()

        # Usar word boundary para evitar match em nomes de campanhas
        scores = {}
        for intent, keywords in self.INTENT_KEYWORDS.items():
            score = sum(
                1 for kw in keywords
                if re.search(rf'\b{re.escape(kw)}\b', message_lower)
            )
            scores[intent] = score

        max_score = max(scores.values()) if scores else 0

        if max_score == 0:
            # Default: Performance Analyzer para perguntas gerais
            return "analyzer"

        # Retorna o primeiro intent com score máximo
        for intent, score in scores.items():
            if score == max_score:
                return intent

        return "analyzer"

    def _get_skill_name(self, intent: str) -> str:
        """Retorna o nome amigável do skill."""
        names = {
            "creator": "Campaign Creator",
            "editor": "Campaign Editor",
            "audience": "Audience Manager",
            "creative": "Creative Manager",
            "budget": "Budget Optimizer",
            "analyzer": "Performance Analyzer",
            "reporter": "Report Generator",
        }
        return names.get(intent, "Assistant")

    def _generate_suggestions(self, intent: str) -> list[str]:
        """Gera sugestões de próximas perguntas baseado no skill atual."""
        suggestions_map = {
            "creator": [
                "Crie uma campanha de tráfego",
                "Quais objetivos de campanha existem?",
                "Criar ad set com targeting personalizado",
            ],
            "editor": [
                "Liste minhas campanhas",
                "Pause a campanha X",
                "Duplique a campanha Y",
            ],
            "audience": [
                "Busque interesses sobre fitness",
                "Qual o tamanho do público em São Paulo?",
                "Sugira targeting para e-commerce",
            ],
            "creative": [
                "Qual formato usar para Stories?",
                "Melhores práticas para vídeo",
                "Especificações de imagem para Feed",
            ],
            "budget": [
                "Como está distribuído meu orçamento?",
                "Quais campanhas devo aumentar o budget?",
                "Projeção de gastos do mês",
            ],
            "analyzer": [
                "Analise a performance das campanhas",
                "Compare minhas campanhas ativas",
                "Qual campanha tem melhor CTR?",
            ],
            "reporter": [
                "Gere um relatório de performance",
                "Resumo de gastos do mês",
                "Relatório de limites da conta",
            ],
        }
        return suggestions_map.get(intent, suggestions_map["analyzer"])

    async def process_message(
        self,
        message: str,
        ad_account_id: Optional[str] = None,
        history: Optional[list[dict]] = None,
    ) -> dict:
        """
        Processa uma mensagem do usuário roteando para o skill apropriado.

        Args:
            message: Mensagem do usuário
            ad_account_id: ID da conta de anúncios (opcional)
            history: Histórico de mensagens anteriores (opcional)

        Returns:
            dict com response, agent_type e suggestions
        """
        # Definir contexto da conta para as tools usarem
        set_current_ad_account(ad_account_id)

        # Verificar se é uma confirmação de ação pendente
        is_confirmation = self._is_confirmation(message)

        # Se é confirmação com prefixo "CONFIRMAR:", extrair a mensagem original
        if is_confirmation and message.upper().startswith("CONFIRMAR:"):
            message = message[len("CONFIRMAR:"):].strip()

        # Verificar se precisa de confirmação (exceto se já é uma confirmação)
        if not is_confirmation:
            requires_confirmation, warning_message = self._requires_confirmation(message)
            if requires_confirmation:
                return {
                    "response": f"⚠️ **Ação Destrutiva Detectada**\n\n{warning_message}\n\nSe você não deseja prosseguir, apenas continue conversando normalmente.",
                    "agent_type": "Confirmação Necessária",
                    "suggestions": ["CONFIRMAR", "Cancelar", "Ver campanhas primeiro"],
                    "requires_confirmation": True,
                    "pending_action": message,
                }

        # Detectar intenção
        intent = self._detect_intent(message)

        # Obter o skill apropriado
        skill = self._get_skill(intent)

        if not skill:
            return {
                "response": "Desculpe, não consegui processar sua solicitação.",
                "agent_type": "error",
                "suggestions": self._generate_suggestions("analyzer"),
            }

        try:
            # Construir mensagem com contexto
            context_prefix = ""
            if ad_account_id:
                context_prefix = f"[Contexto: Conta de anúncios {ad_account_id}]\n\n"

            # Adicionar histórico se disponível
            history_context = ""
            if history and len(history) > 0:
                history_context = "Histórico recente da conversa:\n"
                for msg in history[-5:]:  # Últimas 5 mensagens
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_context += f"- {role}: {content}\n"
                history_context += "\nMensagem atual: "

            full_message = context_prefix + history_context + message

            # Executar o skill
            response = await skill.arun(full_message)

            # Extrair conteúdo da resposta
            content = ""
            if hasattr(response, "content"):
                content = response.content
            elif isinstance(response, str):
                content = response
            else:
                content = str(response)

            return {
                "response": content,
                "agent_type": self._get_skill_name(intent),
                "suggestions": self._generate_suggestions(intent),
            }

        except Exception as e:
            return {
                "response": f"Erro ao processar: {str(e)}",
                "agent_type": "error",
                "suggestions": self._generate_suggestions("analyzer"),
            }

    async def get_optimization(self, campaign_id: str) -> dict:
        """Obtém sugestões de otimização para uma campanha."""
        message = f"Analise e sugira otimizações para a campanha {campaign_id}"
        skill = self._get_skill("budget")
        response = await skill.arun(message)
        return {
            "response": response.content if hasattr(response, "content") else str(response),
            "agent_type": "Budget Optimizer",
        }

    async def analyze_campaign(self, campaign_id: str) -> dict:
        """Analisa a performance de uma campanha."""
        message = f"Faça uma análise completa da performance da campanha {campaign_id}"
        skill = self._get_skill("analyzer")
        response = await skill.arun(message)
        return {
            "response": response.content if hasattr(response, "content") else str(response),
            "agent_type": "Performance Analyzer",
        }

    async def get_budget_advice(self) -> dict:
        """Obtém recomendações de orçamento."""
        message = "Analise a distribuição de orçamento e faça recomendações"
        skill = self._get_skill("budget")
        response = await skill.arun(message)
        return {
            "response": response.content if hasattr(response, "content") else str(response),
            "agent_type": "Budget Optimizer",
        }
