# Backend com FastAPI e Agentes de IA

Este guia explica como construir o backend completo com FastAPI, incluindo integração com Meta API e **sistema de agentes de IA** para automação e análise de campanhas.

---

## 📋 Índice

1. [Estrutura do Backend](#estrutura-do-backend)
2. [Configuração Inicial](#configuração-inicial)
3. [Endpoints da API](#endpoints-da-api)
4. [Sistema de Agentes de IA](#sistema-de-agentes-de-ia)
5. [Integração com Meta API](#integração-com-meta-api)
6. [Rate Limiting e Segurança](#rate-limiting-e-segurança)
7. [Testes](#testes)

---

## Estrutura do Backend

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Entry point FastAPI
│   ├── config.py               # Configurações
│   │
│   ├── api/                    # Rotas da API
│   │   ├── __init__.py
│   │   ├── campaigns.py        # CRUD de campanhas
│   │   ├── chat.py             # Agente IA conversacional
│   │   └── sync.py             # Sincronização
│   │
│   ├── tools/                  # Ferramentas e integrações
│   │   ├── __init__.py
│   │   ├── meta_api.py         # Cliente Meta API
│   │   └── whatsapp.py         # Cliente WhatsApp (opcional)
│   │
│   ├── agents/                 # Agentes de IA
│   │   ├── __init__.py
│   │   ├── base_agent.py       # Classe base
│   │   ├── campaign_optimizer.py   # Otimização de campanhas
│   │   ├── budget_advisor.py       # Consultoria de orçamento
│   │   └── performance_analyst.py  # Análise de performance
│   │
│   └── models/                 # Modelos Pydantic
│       ├── __init__.py
│       ├── campaign.py
│       └── insights.py
│
├── requirements.txt
├── .env
└── env.config.sh
```

---

## Configuração Inicial

### 1. Criar Estrutura

```bash
cd backend
mkdir -p app/{api,tools,agents,models}
touch app/__init__.py
touch app/{api,tools,agents,models}/__init__.py
```

### 2. requirements.txt

```txt
# Web Framework
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.9.0
pydantic-settings==2.5.0

# HTTP Client
httpx==0.27.0

# Environment
python-dotenv==1.0.1

# AI/ML (se usar agentes)
openai==1.50.0
anthropic==0.34.0  # Claude API

# Rate Limiting
slowapi==0.1.9

# CORS
python-multipart==0.0.9
```

```bash
pip install -r requirements.txt
```

### 3. config.py

```python
# app/config.py
"""
Configurações centralizadas da aplicação
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configurações da aplicação"""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # Meta API
    meta_access_token: str
    meta_ad_account_id: str
    meta_page_id: str | None = None
    meta_api_version: str = "v24.0"

    # OpenAI (para agentes de IA)
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"

    # Anthropic/Claude (alternativa ao OpenAI)
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-3-5-sonnet-20241022"

    # Database
    database_url: str

    # Frontend
    frontend_url: str = "http://localhost:3000"

    # Evolution API (WhatsApp - opcional)
    evolution_api_url: str | None = None
    evolution_api_key: str | None = None
    evolution_instance: str | None = None

    # Rate Limiting
    rate_limit_per_minute: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Singleton das configurações"""
    return Settings()


settings = get_settings()
```

### 4. main.py

```python
# app/main.py
"""
Meta Campaign Manager - Backend API
FastAPI server com integração Agno para agentes de IA
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager para startup e shutdown."""
    # Startup
    print("🚀 Iniciando Meta Campaign Manager Backend...")
    print(f"   OpenAI Model: {settings.openai_model}")
    print(f"   Meta Ad Account: {settings.meta_ad_account_id or 'Não configurado'}")
    print(f"   Evolution API: {settings.evolution_api_url or 'Não configurado'}")

    yield

    # Shutdown
    print("👋 Encerrando servidor...")


app = FastAPI(
    title="Meta Campaign Manager API",
    description="Backend API para gerenciamento de campanhas Meta com agentes de IA",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "Meta Campaign Manager API",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    """Health check detalhado."""
    return {
        "status": "healthy",
        "openai_configured": bool(settings.openai_api_key),
        "meta_configured": bool(settings.meta_access_token),
        "evolution_configured": bool(settings.evolution_api_key),
        "database_configured": bool(settings.database_url),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
```

---

## Sistema de Agentes de IA

O sistema possui **múltiplos agentes especializados** que trabalham em conjunto:

### Arquitetura dos Agentes

```
┌─────────────────────────────────────────────┐
│         Frontend (Chat Interface)           │
└────────────────┬────────────────────────────┘
                 │
                 │ POST /api/agent/chat
                 │
┌────────────────▼────────────────────────────┐
│        AgentOrchestrator                    │
│  (Direciona para agente especializado)     │
└─────┬──────┬──────┬──────┬─────────────────┘
      │      │      │      │
      │      │      │      │
      ▼      ▼      ▼      ▼
   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
   │Campaign│Budget │Performance│Content│
   │Optimizer│Advisor│Analyst   │Creator│
   └──────┘ └──────┘ └──────┘ └──────┘
```

### 1. Base Agent (Classe Abstrata)

```python
# app/agents/base_agent.py
"""
Agente base para todos os agentes de IA
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List
from openai import AsyncOpenAI
from app.config import settings


class BaseAgent(ABC):
    """Classe base para agentes de IA"""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
        self.tools = self._register_tools()

    @abstractmethod
    def _register_tools(self) -> List[Dict[str, Any]]:
        """Registra ferramentas (function calling) do agente"""
        pass

    @abstractmethod
    async def process_message(
        self,
        user_message: str,
        context: Dict[str, Any]
    ) -> str:
        """Processa mensagem do usuário"""
        pass

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000,
    ) -> str:
        """Chama OpenAI Chat Completion"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                tools=self.tools if self.tools else None,
            )

            # Se houver function calling
            if response.choices[0].message.tool_calls:
                return await self._handle_tool_calls(
                    response.choices[0].message.tool_calls,
                    messages
                )

            return response.choices[0].message.content

        except Exception as e:
            return f"Erro ao processar: {str(e)}"

    async def _handle_tool_calls(self, tool_calls, messages):
        """Processa chamadas de função"""
        # Implementar lógica de function calling
        # Executar função solicitada
        # Retornar resultado
        pass
```

### 2. Campaign Optimizer Agent

```python
# app/agents/campaign_optimizer.py
"""
Agente especializado em otimização de campanhas
"""
from typing import Any, Dict, List
from app.agents.base_agent import BaseAgent
from app.tools.meta_api import MetaAPI


class CampaignOptimizerAgent(BaseAgent):
    """Agente que otimiza campanhas baseado em performance"""

    def __init__(self):
        super().__init__(
            name="Campaign Optimizer",
            description="Especialista em otimizar campanhas Meta Ads"
        )
        self.meta_api = MetaAPI()

    def _register_tools(self) -> List[Dict[str, Any]]:
        """Ferramentas disponíveis para o agente"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_campaign_metrics",
                    "description": "Obtém métricas de uma campanha",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "campaign_id": {
                                "type": "string",
                                "description": "ID da campanha"
                            },
                            "date_range": {
                                "type": "string",
                                "description": "Período (last_7d, last_30d, etc.)"
                            }
                        },
                        "required": ["campaign_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "suggest_budget_adjustment",
                    "description": "Sugere ajuste de orçamento baseado em performance",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "campaign_id": {"type": "string"},
                            "current_budget": {"type": "number"},
                            "target_roas": {"type": "number"}
                        },
                        "required": ["campaign_id", "current_budget"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "pause_low_performing_ads",
                    "description": "Pausa anúncios com baixa performance",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "campaign_id": {"type": "string"},
                            "min_ctr": {"type": "number", "description": "CTR mínimo aceitável"}
                        },
                        "required": ["campaign_id"]
                    }
                }
            }
        ]

    async def process_message(
        self,
        user_message: str,
        context: Dict[str, Any]
    ) -> str:
        """Processa mensagem sobre otimização"""

        system_prompt = f"""Você é um especialista em otimização de campanhas Meta Ads.

Sua função é:
1. Analisar performance de campanhas
2. Sugerir otimizações (budget, targeting, criativos)
3. Identificar oportunidades de melhoria
4. Explicar métricas e KPIs

Contexto do usuário:
- Campanhas ativas: {context.get('active_campaigns', 0)}
- Orçamento mensal: R$ {context.get('monthly_budget', 0)}
- ROAS médio: {context.get('avg_roas', 0):.2f}x

Seja objetivo e baseie suas sugestões em dados."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]

        return await self.chat_completion(messages)

    async def get_campaign_metrics(self, campaign_id: str, date_range: str = "last_7d"):
        """Obtém métricas da campanha"""
        insights = await self.meta_api.get_campaign_insights(
            campaign_id=campaign_id,
            date_preset=date_range
        )
        return insights

    async def suggest_budget_adjustment(
        self,
        campaign_id: str,
        current_budget: float,
        target_roas: float = 3.0
    ):
        """Sugere ajuste de orçamento"""
        # Buscar métricas
        metrics = await self.get_campaign_metrics(campaign_id)

        spend = metrics.get('spend', 0)
        conversions = metrics.get('conversions', 0)
        revenue = conversions * 100  # Estimativa

        current_roas = revenue / spend if spend > 0 else 0

        if current_roas > target_roas:
            # Performance boa - aumentar budget
            suggested_budget = current_budget * 1.2
            reason = f"ROAS atual ({current_roas:.2f}x) acima da meta. Recomendo aumentar budget."
        elif current_roas < target_roas * 0.5:
            # Performance ruim - reduzir budget
            suggested_budget = current_budget * 0.8
            reason = f"ROAS atual ({current_roas:.2f}x) muito abaixo da meta. Recomendo reduzir budget."
        else:
            suggested_budget = current_budget
            reason = "Performance dentro do esperado. Manter budget atual."

        return {
            "current_budget": current_budget,
            "suggested_budget": round(suggested_budget, 2),
            "current_roas": round(current_roas, 2),
            "target_roas": target_roas,
            "reason": reason
        }
```

### 3. Budget Advisor Agent

```python
# app/agents/budget_advisor.py
"""
Agente consultor de orçamento
"""
from typing import Any, Dict, List
from app.agents.base_agent import BaseAgent


class BudgetAdvisorAgent(BaseAgent):
    """Agente que aconselha sobre distribuição de orçamento"""

    def __init__(self):
        super().__init__(
            name="Budget Advisor",
            description="Consultor especializado em alocação de orçamento"
        )

    def _register_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "analyze_budget_distribution",
                    "description": "Analisa como o orçamento está distribuído entre campanhas",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "total_budget": {"type": "number"},
                            "campaigns": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "name": {"type": "string"},
                                        "budget": {"type": "number"},
                                        "roas": {"type": "number"}
                                    }
                                }
                            }
                        },
                        "required": ["total_budget", "campaigns"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "forecast_monthly_spend",
                    "description": "Projeta gasto mensal baseado em tendência",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "daily_spend": {"type": "number"},
                            "days_elapsed": {"type": "number"}
                        },
                        "required": ["daily_spend", "days_elapsed"]
                    }
                }
            }
        ]

    async def process_message(
        self,
        user_message: str,
        context: Dict[str, Any]
    ) -> str:
        """Processa consulta sobre orçamento"""

        system_prompt = f"""Você é um consultor financeiro especializado em publicidade digital.

Sua função é:
1. Analisar distribuição de orçamento
2. Projetar gastos futuros
3. Sugerir realocação de budget
4. Alertar sobre overspending

Situação atual:
- Orçamento mensal: R$ {context.get('monthly_budget', 0)}
- Gasto até agora: R$ {context.get('current_spend', 0)}
- Dias restantes: {context.get('days_remaining', 0)}

Seja conservador e baseie-se em dados históricos."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]

        return await self.chat_completion(messages)

    def analyze_budget_distribution(
        self,
        total_budget: float,
        campaigns: List[Dict[str, Any]]
    ):
        """Analisa distribuição de orçamento"""
        total_allocated = sum(c['budget'] for c in campaigns)

        # Calcular eficiência (ROAS ponderado)
        weighted_roas = sum(
            c['budget'] * c.get('roas', 0)
            for c in campaigns
        ) / total_allocated if total_allocated > 0 else 0

        # Identificar campanhas ineficientes
        inefficient = [
            c for c in campaigns
            if c.get('roas', 0) < weighted_roas * 0.7
        ]

        return {
            "total_budget": total_budget,
            "allocated": total_allocated,
            "remaining": total_budget - total_allocated,
            "weighted_roas": round(weighted_roas, 2),
            "inefficient_campaigns": len(inefficient),
            "suggestions": self._generate_suggestions(campaigns, weighted_roas)
        }

    def _generate_suggestions(self, campaigns, avg_roas):
        """Gera sugestões de realocação"""
        suggestions = []

        for campaign in campaigns:
            roas = campaign.get('roas', 0)
            budget = campaign['budget']

            if roas > avg_roas * 1.5:
                suggestions.append({
                    "campaign": campaign['name'],
                    "action": "increase",
                    "reason": f"ROAS excelente ({roas:.2f}x)",
                    "suggested_change": budget * 0.2
                })
            elif roas < avg_roas * 0.5:
                suggestions.append({
                    "campaign": campaign['name'],
                    "action": "decrease",
                    "reason": f"ROAS baixo ({roas:.2f}x)",
                    "suggested_change": -budget * 0.2
                })

        return suggestions
```

### 4. Performance Analyst Agent

```python
# app/agents/performance_analyst.py
"""
Agente analista de performance
"""
from typing import Any, Dict, List
from app.agents.base_agent import BaseAgent
import statistics


class PerformanceAnalystAgent(BaseAgent):
    """Agente que analisa métricas e identifica insights"""

    def __init__(self):
        super().__init__(
            name="Performance Analyst",
            description="Analista especializado em métricas de campanhas"
        )

    def _register_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "analyze_campaign_trends",
                    "description": "Analisa tendências de performance ao longo do tempo",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "campaign_id": {"type": "string"},
                            "metrics": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "date": {"type": "string"},
                                        "spend": {"type": "number"},
                                        "impressions": {"type": "number"},
                                        "clicks": {"type": "number"},
                                        "conversions": {"type": "number"}
                                    }
                                }
                            }
                        },
                        "required": ["campaign_id", "metrics"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "compare_campaigns",
                    "description": "Compara performance de múltiplas campanhas",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "campaigns": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {"type": "string"},
                                        "name": {"type": "string"},
                                        "metrics": {"type": "object"}
                                    }
                                }
                            }
                        },
                        "required": ["campaigns"]
                    }
                }
            }
        ]

    async def process_message(
        self,
        user_message: str,
        context: Dict[str, Any]
    ) -> str:
        """Processa análise de performance"""

        system_prompt = """Você é um analista de dados especializado em marketing digital.

Sua função é:
1. Analisar tendências de métricas
2. Identificar anomalias e oportunidades
3. Comparar performance entre campanhas
4. Explicar correlações entre métricas

Seja analítico e use dados para embasar suas conclusões."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]

        return await self.chat_completion(messages)

    def analyze_campaign_trends(
        self,
        campaign_id: str,
        metrics: List[Dict[str, Any]]
    ):
        """Analisa tendências da campanha"""
        if not metrics:
            return {"error": "Sem dados suficientes"}

        # Calcular métricas agregadas
        total_spend = sum(m['spend'] for m in metrics)
        total_impressions = sum(m['impressions'] for m in metrics)
        total_clicks = sum(m['clicks'] for m in metrics)
        total_conversions = sum(m['conversions'] for m in metrics)

        # CTR e CPC
        ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        cpc = (total_spend / total_clicks) if total_clicks > 0 else 0

        # Tendências (últimos vs primeiros 3 dias)
        recent = metrics[-3:]
        early = metrics[:3]

        recent_spend = sum(m['spend'] for m in recent) / len(recent)
        early_spend = sum(m['spend'] for m in early) / len(early)
        spend_trend = "increasing" if recent_spend > early_spend else "decreasing"

        recent_conversions = sum(m['conversions'] for m in recent) / len(recent)
        early_conversions = sum(m['conversions'] for m in early) / len(early)
        conversion_trend = "improving" if recent_conversions > early_conversions else "declining"

        return {
            "campaign_id": campaign_id,
            "period": f"{len(metrics)} days",
            "totals": {
                "spend": round(total_spend, 2),
                "impressions": total_impressions,
                "clicks": total_clicks,
                "conversions": total_conversions
            },
            "kpis": {
                "ctr": round(ctr, 2),
                "cpc": round(cpc, 2),
                "cost_per_conversion": round(total_spend / total_conversions, 2) if total_conversions > 0 else 0
            },
            "trends": {
                "spend": spend_trend,
                "conversions": conversion_trend
            },
            "insights": self._generate_insights(ctr, cpc, conversion_trend)
        }

    def _generate_insights(self, ctr, cpc, conversion_trend):
        """Gera insights baseados nas métricas"""
        insights = []

        if ctr < 1.0:
            insights.append({
                "type": "warning",
                "message": f"CTR baixo ({ctr:.2f}%). Considere melhorar criativos ou targeting."
            })
        elif ctr > 3.0:
            insights.append({
                "type": "success",
                "message": f"CTR excelente ({ctr:.2f}%)! Continue com a estratégia atual."
            })

        if cpc > 5.0:
            insights.append({
                "type": "warning",
                "message": f"CPC alto (R$ {cpc:.2f}). Revise targeting e competição."
            })

        if conversion_trend == "declining":
            insights.append({
                "type": "alert",
                "message": "Conversões em declínio. Investigue mudanças recentes na campanha."
            })

        return insights
```

### 5. Agent Orchestrator

```python
# app/agents/__init__.py
"""
Orchestrador de agentes
"""
from typing import Dict, Any
from app.agents.campaign_optimizer import CampaignOptimizerAgent
from app.agents.budget_advisor import BudgetAdvisorAgent
from app.agents.performance_analyst import PerformanceAnalystAgent


class AgentOrchestrator:
    """Direciona mensagens para o agente apropriado"""

    def __init__(self):
        self.agents = {
            "optimizer": CampaignOptimizerAgent(),
            "budget": BudgetAdvisorAgent(),
            "analyst": PerformanceAnalystAgent(),
        }

    async def route_message(
        self,
        user_message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Roteia mensagem para agente apropriado"""

        # Detectar intenção
        agent_type = self._detect_intent(user_message)
        agent = self.agents.get(agent_type, self.agents["optimizer"])

        response = await agent.process_message(user_message, context)

        return {
            "agent": agent.name,
            "response": response,
            "agent_type": agent_type
        }

    def _detect_intent(self, message: str) -> str:
        """Detecta qual agente deve responder"""
        message_lower = message.lower()

        # Keywords para budget
        if any(word in message_lower for word in ['orçamento', 'budget', 'gasto', 'custo', 'projeção']):
            return "budget"

        # Keywords para análise
        if any(word in message_lower for word in ['análise', 'tendência', 'comparar', 'métrica', 'kpi']):
            return "analyst"

        # Default: otimização
        return "optimizer"
```

---

## Endpoints da API com Agentes

### Chat com Agente IA

```python
# app/api/chat.py
"""
Endpoint de chat com agente de IA
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.agents import AgentOrchestrator

router = APIRouter()
orchestrator = AgentOrchestrator()


class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any] = {}


class ChatResponse(BaseModel):
    agent: str
    response: str
    agent_type: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """
    Chat com agente de IA

    O agente analisa a mensagem e responde com insights,
    sugestões e análises baseadas em dados.
    """
    try:
        result = await orchestrator.route_message(
            user_message=request.message,
            context=request.context
        )

        return ChatResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar mensagem: {str(e)}"
        )
```

### Como usar no Frontend

```typescript
// Frontend: Chamar agente IA
const response = await fetch('/api/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Como posso melhorar o ROAS das minhas campanhas?",
    context: {
      active_campaigns: 5,
      monthly_budget: 5000,
      avg_roas: 2.5
    }
  })
});

const data = await response.json();
console.log(data.response);
// "Baseado no seu ROAS médio de 2.5x, recomendo..."
```

---

Quer que eu continue com:
- **Integração Meta API detalhada**
- **Endpoints de campanhas (CRUD completo)**
- **Rate limiting e segurança**
- **Testes automatizados**?