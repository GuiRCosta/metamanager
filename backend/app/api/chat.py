from fastapi import APIRouter, HTTPException

from app.models.chat import ChatRequest, ChatResponse
from app.agents.orchestrator import AgentOrchestrator

router = APIRouter()
orchestrator = AgentOrchestrator()


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """Envia uma mensagem para o agente de IA."""
    try:
        result = await orchestrator.process_message(
            message=request.message,
            context=request.context,
        )

        return ChatResponse(
            message=result["response"],
            agent_type=result["agent_type"],
            suggestions=result.get("suggestions"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize")
async def get_optimization_suggestions(campaign_id: str):
    """Obtém sugestões de otimização para uma campanha."""
    try:
        result = await orchestrator.get_optimization(campaign_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_performance(campaign_id: str):
    """Analisa a performance de uma campanha."""
    try:
        result = await orchestrator.analyze_campaign(campaign_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/budget-advice")
async def get_budget_advice():
    """Obtém recomendações de orçamento."""
    try:
        result = await orchestrator.get_budget_advice()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
