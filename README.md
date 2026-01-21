# Meta Campaign Manager

Aplicação full-stack para gerenciamento de campanhas Meta Ads com agentes de IA.

## Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python), OpenAI API
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Auth**: NextAuth.js

## Estrutura do Projeto

```
├── frontend/               # Next.js 15
│   ├── prisma/            # Schema do banco
│   ├── src/
│   │   ├── app/           # App Router
│   │   ├── components/    # Componentes React
│   │   ├── lib/           # Utilitários
│   │   └── hooks/         # Custom hooks
│   └── package.json
│
├── backend/               # FastAPI
│   ├── app/
│   │   ├── api/          # Endpoints
│   │   ├── agents/       # Agentes de IA
│   │   ├── tools/        # Cliente Meta API
│   │   └── models/       # Modelos Pydantic
│   └── requirements.txt
│
└── DOCUMENTACAO_COMPLETA/ # Documentação original
```

## Configuração

### 1. Variáveis de Ambiente

**Frontend** (`frontend/.env.local`):
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua_chave_secreta
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
BACKEND_API_URL=http://localhost:8000
```

**Backend** (`backend/.env`):
```env
META_ACCESS_TOKEN=seu_token_meta
META_AD_ACCOUNT_ID=act_seu_id
META_API_VERSION=v24.0
OPENAI_API_KEY=sk-proj-xxx
OPENAI_MODEL=gpt-4o-mini
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 3. Backend

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Funcionalidades

### Dashboard
- Métricas em tempo real (gasto, impressões, cliques, conversões)
- Widget de orçamento com projeção mensal
- Alertas recentes

### Campanhas
- Listagem com filtros e busca
- Criar, editar, pausar e excluir campanhas
- Sincronização com Meta API

### Agente IA
- Chat interativo com agentes especializados
- **Campaign Optimizer**: Otimização de performance
- **Budget Advisor**: Consultoria de orçamento
- **Performance Analyst**: Análise de tendências

### Analytics
- Gráficos de performance
- Comparação entre campanhas
- Análise de tendências

### Alertas
- Notificações de orçamento
- Alertas de performance
- Mudanças de status

### Configurações
- Limites de orçamento
- Credenciais Meta API
- Preferências de notificação
- Metas de performance

## Agentes de IA

O sistema possui 3 agentes especializados:

1. **CampaignOptimizerAgent**
   - Analisa métricas de performance
   - Sugere ajustes de orçamento
   - Identifica campanhas de baixa performance

2. **BudgetAdvisorAgent**
   - Análise de distribuição de orçamento
   - Projeção de gasto mensal
   - Sugestões de realocação

3. **PerformanceAnalystAgent**
   - Análise de tendências
   - Comparação entre campanhas
   - Geração de insights

## API Endpoints

### Backend (porta 8000)
- `POST /api/agent/chat` - Chat com agente
- `GET /api/campaigns` - Listar campanhas
- `POST /api/campaigns` - Criar campanha
- `POST /api/sync` - Sincronizar com Meta

### Frontend (porta 3000)
- `POST /api/auth/register` - Registro
- `POST /api/chat` - Proxy para agente

## Banco de Dados

Modelos principais:
- **User**: Usuários do sistema
- **Campaign**: Campanhas Meta
- **CampaignMetric**: Métricas diárias
- **AdSet**: Conjuntos de anúncios
- **Ad**: Anúncios individuais
- **Settings**: Configurações do usuário
- **Alert**: Alertas e notificações

## Licença

MIT
