from typing import Optional

from app.agents.campaign_optimizer import CampaignOptimizerAgent
from app.agents.budget_advisor import BudgetAdvisorAgent
from app.agents.performance_analyst import PerformanceAnalystAgent


class AgentOrchestrator:
    """Orquestrador que roteia mensagens para os agentes apropriados."""

    BUDGET_KEYWORDS = [
        "orçamento", "budget", "gasto", "gastar", "dinheiro", "investimento",
        "custo", "preço", "valor", "limite", "projeção", "previsão", "forecast",
        "realocar", "realocação", "distribuir", "distribuição",
    ]

    OPTIMIZATION_KEYWORDS = [
        "otimizar", "otimização", "melhorar", "aumentar", "reduzir",
        "pausar", "pausa", "ativar", "desativar", "ajustar", "ajuste",
        "roas", "roi", "performance baixa", "baixo desempenho",
    ]

    ANALYSIS_KEYWORDS = [
        "analisar", "análise", "analise", "comparar", "comparação",
        "tendência", "trend", "métrica", "métricas", "insight",
        "relatório", "report", "resumo", "overview", "visão geral",
        "como está", "como estão", "performance", "desempenho",
    ]

    def __init__(self):
        self.optimizer = CampaignOptimizerAgent()
        self.budget_advisor = BudgetAdvisorAgent()
        self.performance_analyst = PerformanceAnalystAgent()

    def _detect_intent(self, message: str) -> str:
        """Detecta a intenção da mensagem baseado em palavras-chave."""
        message_lower = message.lower()

        budget_score = sum(1 for kw in self.BUDGET_KEYWORDS if kw in message_lower)
        optimization_score = sum(1 for kw in self.OPTIMIZATION_KEYWORDS if kw in message_lower)
        analysis_score = sum(1 for kw in self.ANALYSIS_KEYWORDS if kw in message_lower)

        scores = {
            "budget": budget_score,
            "optimization": optimization_score,
            "analysis": analysis_score,
        }

        max_score = max(scores.values())
        if max_score == 0:
            return "analysis"

        for intent, score in scores.items():
            if score == max_score:
                return intent

        return "analysis"

    def _get_agent(self, intent: str):
        """Retorna o agente apropriado para a intenção."""
        agents = {
            "budget": self.budget_advisor,
            "optimization": self.optimizer,
            "analysis": self.performance_analyst,
        }
        return agents.get(intent, self.performance_analyst)

    async def process_message(
        self,
        message: str,
        context: Optional[dict] = None,
    ) -> dict:
        """Processa uma mensagem do usuário roteando para o agente apropriado."""
        intent = self._detect_intent(message)
        agent = self._get_agent(intent)

        result = await agent.process_message(message, context)

        suggestions = self._generate_suggestions(intent)
        result["suggestions"] = suggestions

        return result

    def _generate_suggestions(self, current_intent: str) -> list[str]:
        """Gera sugestões de próximas perguntas."""
        suggestions_map = {
            "budget": [
                "Qual a projeção de gasto para este mês?",
                "Como posso realocar o orçamento entre campanhas?",
                "Estou perto do limite de orçamento?",
            ],
            "optimization": [
                "Quais campanhas devo pausar?",
                "Como melhorar o ROAS das campanhas?",
                "Qual orçamento ideal para cada campanha?",
            ],
            "analysis": [
                "Compare a performance das minhas campanhas",
                "Quais são as tendências de gasto?",
                "Gere um relatório de performance",
            ],
        }
        return suggestions_map.get(current_intent, suggestions_map["analysis"])

    async def get_optimization(self, campaign_id: str) -> dict:
        """Obtém sugestões de otimização para uma campanha específica."""
        message = f"Analise e sugira otimizações para a campanha {campaign_id}"
        return await self.optimizer.process_message(message)

    async def analyze_campaign(self, campaign_id: str) -> dict:
        """Analisa a performance de uma campanha específica."""
        message = f"Faça uma análise completa da performance da campanha {campaign_id}"
        return await self.performance_analyst.process_message(message)

    async def get_budget_advice(self) -> dict:
        """Obtém recomendações gerais de orçamento."""
        message = "Analise a distribuição de orçamento e faça recomendações"
        return await self.budget_advisor.process_message(message)
