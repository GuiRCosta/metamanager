# Meta Campaign Manager

Aplicação full-stack para gerenciamento de campanhas Meta Ads com agentes de IA.

## Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python), OpenAI API
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Auth**: NextAuth.js
- **WhatsApp**: Evolution API (opcional)

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
│   │   ├── api/          # Endpoints REST
│   │   ├── models/       # Modelos Pydantic
│   │   ├── services/     # WhatsApp handler, scheduler
│   │   ├── skills/       # Orchestrator + 7 skills de IA
│   │   └── tools/        # Cliente Meta API
│   ├── data/             # Configurações persistidas
│   └── requirements.txt
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
OPENAI_WHISPER_MODEL=whisper-1
FRONTEND_URL=http://localhost:3000

# Evolution API (WhatsApp) - Opcional
EVOLUTION_API_URL=https://evolution.seudominio.com
EVOLUTION_API_KEY=sua_api_key
EVOLUTION_INSTANCE=nome_da_instancia
EVOLUTION_WEBHOOK_SECRET=seu_webhook_secret
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
- Integração WhatsApp

### WhatsApp (Evolution API)
- **Chat com agente via WhatsApp** - Interaja com o assistente de IA
- **Suporte a texto e áudio** - Envie mensagens de texto ou áudio (transcrição automática)
- **Relatórios diários automáticos** - Receba resumo de performance no horário configurado
- **Alertas de orçamento** - Notificações automáticas ao atingir 50%, 80% e 100% do limite
- **Projeção de gastos** - Alerta quando projeção excede o orçamento mensal
- **Lista de números permitidos** - Controle quem pode acessar o agente

## Arquitetura de IA

O sistema utiliza um **Orchestrator** que coordena 7 skills especializados:

| Skill | Função |
|-------|--------|
| **Campaign Creator** | Criação de campanhas, ad sets e anúncios |
| **Campaign Editor** | Edição, pausa e exclusão de campanhas |
| **Audience Manager** | Gerenciamento de públicos e targeting |
| **Creative Manager** | Gerenciamento de criativos e imagens |
| **Budget Optimizer** | Otimização e realocação de orçamento |
| **Performance Analyzer** | Análise de métricas e tendências |
| **Report Generator** | Geração de relatórios e insights |

O `CampaignOrchestrator` analisa sua pergunta e delega automaticamente para o skill mais adequado.

## API Endpoints

### Backend (porta 8000)

**Agente IA**
- `POST /api/agent/chat` - Chat com agente

**Campanhas**
- `GET /api/campaigns` - Listar campanhas
- `POST /api/campaigns` - Criar campanha
- `POST /api/sync` - Sincronizar com Meta

**WhatsApp**
- `POST /api/whatsapp/webhook` - Webhook da Evolution API
- `POST /api/whatsapp/test-message` - Enviar mensagem de teste
- `POST /api/whatsapp/send-report` - Enviar relatório agora
- `GET /api/whatsapp/scheduler-status` - Status do scheduler

**Configurações**
- `GET /api/settings` - Obter configurações
- `PUT /api/settings` - Atualizar configurações
- `POST /api/settings/test-connection` - Testar conexão Meta API

### Frontend (porta 3000)
- `POST /api/auth/register` - Registro
- `POST /api/chat` - Proxy para agente

## Configuração WhatsApp (Evolution API)

Para habilitar o acesso via WhatsApp, siga os passos:

### 1. Instale e configure a Evolution API
- Acesse [evolution-api.com](https://evolution-api.com) para instruções de instalação
- Crie uma instância e conecte seu WhatsApp

### 2. Configure o Webhook na Evolution
- **URL**: `http://seu-backend:8000/api/whatsapp/webhook`
- **Eventos**: Habilite `messages.upsert`
- **Secret** (opcional): Configure para validação de assinatura

### 3. Configure na aplicação
1. Acesse **Configurações > WhatsApp**
2. Preencha:
   - URL da API: `https://evolution.seudominio.com`
   - API Key: Sua chave da Evolution
   - Instância: Nome da instância conectada
3. Habilite a integração
4. Adicione números permitidos (ou deixe vazio para permitir todos)
5. Clique em **Salvar Configurações**

### 4. Teste a integração
- Use o botão "Enviar Mensagem de Teste"
- Envie uma mensagem pelo WhatsApp para testar

### Mensagens Automáticas

| Tipo | Quando | Configuração |
|------|--------|--------------|
| Relatório Diário | Horário definido | Notificações > Relatórios Diários |
| Alerta 50% | Gasto atinge 50% do orçamento | Orçamento > Alertas |
| Alerta 80% | Gasto atinge 80% do orçamento | Orçamento > Alertas |
| Alerta 100% | Gasto atinge 100% do orçamento | Orçamento > Alertas |
| Projeção Excesso | Projeção > 110% do orçamento | Orçamento > Alertas |

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
