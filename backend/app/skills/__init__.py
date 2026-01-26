"""
Skills de IA para gerenciamento de campanhas Meta Ads.

Arquitetura:
- Orchestrator: Coordena todos os skills
- Campaign Creator: Criação de campanhas, ad sets e ads
- Campaign Editor: Edição e gerenciamento de campanhas
- Audience Manager: Gerenciamento de públicos e targeting
- Creative Manager: Gerenciamento de criativos
- Budget Optimizer: Otimização de orçamento
- Performance Analyzer: Análise de performance
- Report Generator: Geração de relatórios
"""

from app.skills.orchestrator import CampaignOrchestrator

__all__ = ["CampaignOrchestrator"]
