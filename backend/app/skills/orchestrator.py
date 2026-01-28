"""
Campaign Orchestrator - Coordena todos os skills de campanha.
"""

import re
import logging
from typing import Optional
from agno.agent import Agent
from agno.models.openai import OpenAIChat
import httpx

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
logger = logging.getLogger(__name__)

# Threshold mínimo de score para confiar no roteamento por keywords
KEYWORD_CONFIDENCE_THRESHOLD = 2


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
        "pausar", "pause", "ativar", "ative", "activate", "parar", "pare",
        # Deletar/Arquivar
        "arquivar", "archive", "deletar", "delete", "excluir", "exclua",
        # Duplicar
        "duplicar", "duplique", "copiar", "copie", "clonar", "clone", "duplicate",
        # Orçamento
        "aumentar", "aumente", "reduzir", "reduza",
        "mudar orçamento", "alterar budget",
        # Desativar
        "desativar", "desative", "disable",
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
            "duplicar", "copiar", "clonar",
            "listar", "liste", "mostrar", "mostre",
            "edit", "update", "activate", "delete", "show", "list",
            "desativar", "desative", "desativa",
            "status da campanha", "detalhes da campanha",
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
            "analisar", "análise", "métrica", "métricas", "performance",
            "desempenho", "comparar", "comparação", "tendência",
            "ctr", "cpc", "cpm", "roas", "conversão", "conversões",
            "analyze", "metrics", "trend", "compare",
            "como está", "como estão", "resultado", "resultados",
            "campanha", "campanhas", "impressões", "cliques", "alcance",
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

    # Sufixos clíticos do português (pronomes oblíquos átonos)
    CLITIC_SUFFIXES = r'(?:-?(?:l[aoe]s?|m[eoe]|n[oa]s?|se|lh[eoa]s?|vos))?'

    def _word_match(self, message_lower: str, words: list[str]) -> bool:
        """
        Verifica se alguma palavra aparece na mensagem,
        considerando sufixos clíticos do português.
        Ex: "desativa-la" deve casar com "desativa".
        """
        return any(
            re.search(rf'\b{re.escape(w)}{self.CLITIC_SUFFIXES}\b', message_lower)
            for w in words
        )

    def _requires_confirmation(self, message: str) -> tuple[bool, str]:
        """
        Verifica se a mensagem indica uma ação que modifica dados.
        Usa word boundary para evitar falsos positivos com adjetivos
        (ex: "desativada" não deve disparar confirmação de "desativar").

        Returns:
            Tuple (requires_confirmation, warning_message)
        """
        message_lower = message.lower()

        has_modification = self._word_match(message_lower, self.MODIFICATION_KEYWORDS)
        if not has_modification:
            return False, ""

        is_bulk = self._word_match(message_lower, self.BULK_KEYWORDS)

        if self._word_match(message_lower, ["arquivar", "archive", "deletar", "delete", "excluir", "exclua"]):
            if is_bulk:
                return True, "Você está prestes a **ARQUIVAR/EXCLUIR múltiplas campanhas**. Esta ação é irreversível.\n\nPara confirmar, responda **CONFIRMAR**."
            return True, f"Você solicitou uma ação de **exclusão/arquivamento**.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if self._word_match(message_lower, ["pausar", "pause", "parar", "pare"]):
            if is_bulk:
                return True, "Você está prestes a **PAUSAR múltiplas campanhas**.\n\nPara confirmar, responda **CONFIRMAR**."
            return True, f"Você solicitou **pausar** uma campanha.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if self._word_match(message_lower, ["ativar", "ative", "activate"]):
            return True, f"Você solicitou **ativar** uma campanha.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if self._word_match(message_lower, ["criar", "crie", "create", "launch", "lançar", "lance", "adicionar", "adicione"]):
            return True, f"Você solicitou **criar** um novo recurso.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if self._word_match(message_lower, ["duplicar", "duplique", "copiar", "copie", "clonar", "clone", "duplicate"]):
            return True, f"Você solicitou **duplicar** uma campanha.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if self._word_match(message_lower, ["aumentar", "aumente", "reduzir", "reduza", "alterar", "altere", "modificar", "modifique", "editar", "edite", "atualizar", "atualize", "mudar", "mude"]):
            return True, f"Você solicitou uma **modificação**.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        if self._word_match(message_lower, ["desativar", "desative", "disable"]):
            return True, f"Você solicitou **desativar** um recurso.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

        return True, f"Você solicitou uma ação que modifica dados.\n\nAção: _{message}_\n\nPara confirmar, responda **CONFIRMAR**."

    def _detect_intent_by_keywords(self, message: str) -> tuple[str, int]:
        """
        Detecta a intenção por keywords. Retorna (intent, score).
        Score alto = alta confiança.
        """
        message_lower = message.lower()

        scores = {}
        for intent, keywords in self.INTENT_KEYWORDS.items():
            matched = [
                kw for kw in keywords
                if re.search(rf'\b{re.escape(kw)}{self.CLITIC_SUFFIXES}\b', message_lower)
            ]
            scores[intent] = len(matched)
            if matched:
                logger.info(f"Intent '{intent}' matched keywords: {matched} (score={len(matched)})")

        max_score = max(scores.values()) if scores else 0
        logger.info(f"All scores for '{message_lower[:60]}...': {scores}, max={max_score}")

        if max_score == 0:
            return "analyzer", 0

        for intent, score in scores.items():
            if score == max_score:
                return intent, max_score

        return "analyzer", 0

    async def _detect_intent_by_llm(self, message: str) -> str:
        """
        Usa o LLM via OpenRouter para classificar o intent quando keywords são ambíguas.
        Chamada rápida com prompt curto e max_tokens baixo.
        """
        valid_intents = list(self.INTENT_KEYWORDS.keys())

        classification_prompt = f"""Classifique a mensagem do usuário em EXATAMENTE uma categoria para um sistema de gerenciamento de campanhas Meta Ads.

Categorias:
- creator: criar campanhas, ad sets, ads NOVOS do zero
- editor: ver, listar, mostrar, consultar detalhes, editar, pausar, ativar, desativar, duplicar, excluir campanhas existentes. Qualquer pergunta sobre uma campanha específica pelo nome vai aqui.
- audience: público-alvo, targeting, interesses, segmentação, localização, demografia
- creative: criativos, imagens, vídeos, carrossel, formatos de anúncio
- budget: orçamento, gastos, verba, investimento, projeção de custos, alocação de budget
- analyzer: análise de performance, métricas numéricas (CTR, CPC, CPM, ROAS), comparações entre campanhas, tendências
- reporter: relatórios formais, resumos, exportar dados, visão geral da conta

Regra importante: se a mensagem menciona uma campanha específica pelo nome e NÃO pede análise de métricas, use "editor".

Mensagem: "{message}"

Responda APENAS com o nome da categoria, sem explicação."""

        try:
            base_url = settings.llm_base_url or "https://api.openai.com/v1"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.llm_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.llm_model,
                        "messages": [{"role": "user", "content": classification_prompt}],
                        "max_tokens": 20,
                        "temperature": 0,
                    },
                )
                response.raise_for_status()
                data = response.json()
                intent = data["choices"][0]["message"]["content"].strip().lower()

                if intent in valid_intents:
                    logger.info(f"LLM classified intent: '{message[:50]}...' -> {intent}")
                    return intent

                logger.warning(f"LLM returned invalid intent '{intent}', falling back to analyzer")
                return "analyzer"

        except Exception as e:
            logger.error(f"LLM intent classification failed: {e}")
            return "analyzer"

    async def _detect_intent(self, message: str) -> str:
        """
        Detecção híbrida: keywords para casos claros, LLM para ambíguos.
        """
        intent, score = self._detect_intent_by_keywords(message)

        if score >= KEYWORD_CONFIDENCE_THRESHOLD:
            logger.info(f"Keyword intent (score={score}): '{message[:50]}...' -> {intent}")
            return intent

        # Score baixo ou zero: usar LLM para classificar
        logger.info(f"Low keyword score ({score}), using LLM for: '{message[:50]}...'")
        return await self._detect_intent_by_llm(message)

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

    # Padrões que indicam que o agente pediu confirmação (não deveria)
    AGENT_CONFIRMATION_PATTERNS = [
        r'confirma\s+que\s+deseja',
        r'deseja\s+prosseguir',
        r'tem\s+certeza',
        r'para\s+confirmar',
        r'responda\s+confirm',
        r'se\s+sim[,.]?\s+(?:posso|vou|irei)',
        r'gostaria\s+de\s+confirmar',
        r'deseja\s+continuar',
        r'quer\s+(?:mesmo|realmente)',
    ]

    # Mensagens curtas que sozinhas não fazem sentido sem contexto
    SHORT_CONTEXT_MESSAGES = [
        "sim", "yes", "ok", "não", "no", "confirmar", "confirm",
        "cancela", "cancelar", "confirmo", "confirme", "s", "n",
        "pode", "pode sim", "pode fazer", "faz", "faça", "vai", "beleza"
    ]

    async def process_message(
        self,
        message: str,
        ad_account_id: Optional[str] = None,
        history: Optional[list[dict]] = None,
        confirmed_action: Optional[str] = None,
    ) -> dict:
        """
        Processa uma mensagem do usuário roteando para o skill apropriado.

        Args:
            message: Mensagem do usuário
            ad_account_id: ID da conta de anúncios (opcional)
            history: Histórico de mensagens anteriores (opcional)
            confirmed_action: Ação confirmada pelo usuário (pula confirmação)

        Returns:
            dict com response, agent_type e suggestions
        """
        # Definir contexto da conta para as tools usarem
        set_current_ad_account(ad_account_id)

        # Se o frontend enviou uma ação confirmada, executar diretamente
        is_confirmed = confirmed_action is not None
        if is_confirmed:
            message = confirmed_action
            logger.info(f"Received confirmed_action from frontend: '{message[:80]}'")
        else:
            # Se a mensagem é curta e sem sentido próprio (ex: "sim", "ok"),
            # usar o histórico para entender o contexto
            message_clean = message.lower().strip()
            if message_clean in self.SHORT_CONTEXT_MESSAGES and history:
                logger.info(f"Short message detected: '{message}'. Searching history for context...")

                # Primeiro, procurar pending_action em mensagens do assistant
                pending_action_from_assistant = None
                for msg in reversed(history):
                    if msg.get("role") == "assistant":
                        content = msg.get("content", "")
                        # Procurar padrão de ação pendente: "Ação: _texto_"
                        action_match = re.search(r'Ação:\s*_(.+?)_', content)
                        if action_match:
                            pending_action_from_assistant = action_match.group(1)
                            logger.info(f"Found pending_action from assistant: '{pending_action_from_assistant}'")
                            break

                if pending_action_from_assistant:
                    message = pending_action_from_assistant
                    is_confirmed = True
                    logger.info(f"Using pending_action from assistant message")
                else:
                    # Fallback: buscar última mensagem do usuário que tenha contexto
                    last_user_msg = None
                    for msg in reversed(history):
                        if msg.get("role") == "user":
                            user_content = msg.get("content", "").lower().strip()
                            if user_content not in self.SHORT_CONTEXT_MESSAGES:
                                last_user_msg = msg["content"]
                                logger.info(f"Found last contextual user message: '{last_user_msg[:60]}...'")
                                break

                    if last_user_msg:
                        message = last_user_msg
                        is_confirmed = True
                        logger.info(f"Short message '{message_clean}' interpreted as confirmation of: '{last_user_msg[:60]}...'")
                    else:
                        logger.warning(f"No context found for short message '{message}'. History had {len(history)} messages.")

            if not is_confirmed:
                # Verificar se precisa de confirmação
                requires_confirmation, warning_message = self._requires_confirmation(message)
                if requires_confirmation:
                    return {
                        "response": f"⚠️ **Ação Destrutiva Detectada**\n\n{warning_message}\n\nSe você não deseja prosseguir, apenas continue conversando normalmente.",
                        "agent_type": "Confirmação Necessária",
                        "suggestions": ["CONFIRMAR", "Cancelar", "Ver campanhas primeiro"],
                        "requires_confirmation": True,
                        "pending_action": message,
                    }

        # Detectar intenção (híbrido: keywords + LLM fallback)
        intent = await self._detect_intent(message)
        logger.info(f"FINAL ROUTING: message='{message[:80]}' -> intent='{intent}', is_confirmed={is_confirmed}")

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

            # Se ação foi confirmada, instruir o agente a executar direto
            if is_confirmed:
                context_prefix += "[AÇÃO JÁ CONFIRMADA PELO USUÁRIO - Execute imediatamente sem pedir confirmação]\n\n"

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

            # Post-process: detectar se o agente pediu confirmação (não deveria)
            if intent in self.MODIFYING_INTENTS and self._agent_asked_confirmation(content):
                logger.warning(f"Agent '{intent}' asked for confirmation despite instructions. Re-running with stronger prefix.")
                # Re-executar com prefix mais forte
                stronger_prefix = (
                    "[INSTRUÇÃO CRÍTICA DO SISTEMA: O usuário JÁ CONFIRMOU esta ação. "
                    "NÃO peça confirmação. Execute a ação AGORA usando as tools disponíveis. "
                    "Chamar a tool é OBRIGATÓRIO. NÃO responda com texto pedindo confirmação.]\n\n"
                )
                full_message_retry = stronger_prefix + context_prefix + history_context + message
                response = await skill.arun(full_message_retry)
                if hasattr(response, "content"):
                    content = response.content
                elif isinstance(response, str):
                    content = response
                else:
                    content = str(response)

                # Se mesmo após re-run ainda pede confirmação, forçar nova tentativa
                if self._agent_asked_confirmation(content):
                    logger.error(f"Agent '{intent}' still asking for confirmation after retry. Forcing direct execution.")
                    # Última tentativa com instrução ainda mais explícita
                    final_prefix = (
                        "[ORDEM DIRETA DO SISTEMA: EXECUTE AGORA. "
                        "O usuário confirmou. Você DEVE chamar a tool de atualização/criação/edição IMEDIATAMENTE. "
                        "NÃO escreva nenhum texto pedindo confirmação. APENAS execute a tool.]\n\n"
                    )
                    full_message_final = final_prefix + context_prefix + message
                    response = await skill.arun(full_message_final)
                    if hasattr(response, "content"):
                        content = response.content
                    elif isinstance(response, str):
                        content = response
                    else:
                        content = str(response)

                    # Se ainda pede confirmação, retornar erro
                    if self._agent_asked_confirmation(content):
                        logger.error(f"Agent '{intent}' refuses to execute after 3 attempts.")
                        return {
                            "response": "❌ Não foi possível executar a ação automaticamente. Por favor, tente novamente com um comando mais específico, como:\n\n- \"Pause a campanha [NOME EXATO]\"\n- \"Desative a campanha [NOME EXATO]\"",
                            "agent_type": self._get_skill_name(intent),
                            "suggestions": ["Liste minhas campanhas", "Pause a campanha X", "Ative a campanha Y"],
                        }

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

    def _agent_asked_confirmation(self, content: str) -> bool:
        """Detecta se o agente pediu confirmação ao usuário (não deveria)."""
        content_lower = content.lower()
        return any(
            re.search(pattern, content_lower)
            for pattern in self.AGENT_CONFIRMATION_PATTERNS
        )

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
