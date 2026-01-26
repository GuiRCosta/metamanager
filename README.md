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

## Deploy

O projeto suporta **Docker Compose** e **Docker Swarm**.

### Pré-requisitos
- Docker e Docker Compose (ou Docker Swarm)
- PostgreSQL rodando
- Traefik configurado com SSL
- Domínio apontando para o servidor

---

## Opção 1: Docker Swarm (Recomendado para produção)

Para ambientes com Docker Swarm (Portainer, clusters, etc).

### 1. Clone o repositório
```bash
cd /opt
git clone https://github.com/GuiRCosta/metamanager.git
cd metamanager
```

### 2. Configure as variáveis
```bash
cp .env.swarm .env.swarm.local
nano .env.swarm.local
```

Preencha:
```env
DOMAIN=metamanager.seudominio.com
POSTGRES_HOST=postgres_postgres
POSTGRES_PASSWORD=sua_senha
NEXTAUTH_SECRET=$(openssl rand -base64 32)
META_ACCESS_TOKEN=seu_token
META_BUSINESS_ID=seu_business_id
META_AD_ACCOUNT_ID=act_xxx
OPENAI_API_KEY=sk-proj-xxx
```

### 3. Crie o banco de dados
```bash
docker exec $(docker ps -qf "name=postgres") psql -U postgres -c "CREATE DATABASE metamanager;"
```

### 4. Build das imagens
```bash
docker build -t metamanager-backend:latest ./backend
docker build -t metamanager-frontend:latest ./frontend
```

### 5. Deploy da stack
```bash
# Carregar variáveis
set -a && source .env.swarm.local && set +a

# Deploy
docker stack deploy -c docker-stack.yml metamanager
```

### 6. Execute as migrations
```bash
# Aguarde ~30 segundos para o frontend iniciar
docker exec $(docker ps -qf "name=metamanager_frontend" | head -1) npx prisma migrate deploy
```

### 7. Verifique o status
```bash
docker stack services metamanager
```

### Comandos úteis (Swarm)
```bash
docker stack services metamanager          # Ver serviços
docker service logs metamanager_backend -f # Logs backend
docker service logs metamanager_frontend -f # Logs frontend
docker stack rm metamanager                # Remover stack
```

---

## Opção 2: Docker Compose

Para ambientes simples com Docker Compose.

### Instalação Automática

```bash
git clone https://github.com/GuiRCosta/metamanager.git
cd metamanager
./install.sh
```

O script vai:
1. Pedir as configurações (domínio, PostgreSQL, APIs)
2. Criar os arquivos `.env` automaticamente
3. Construir e iniciar os containers

### Instalação Manual

```bash
git clone https://github.com/GuiRCosta/metamanager.git
cd metamanager
cp .env.example .env
nano .env          # Preencha as variáveis
nano backend/.env  # Configure backend

docker compose up -d
```

### Comandos úteis (Compose)
```bash
docker compose logs -f        # Ver logs
docker compose restart        # Reiniciar
docker compose down           # Parar
docker compose build --no-cache # Rebuild
```

---

## Deploy via Portainer

### Docker Swarm (Stack)
1. Portainer > **Stacks > Add Stack**
2. Nome: `metamanager`
3. **Web editor**: Cole o conteúdo de `docker-stack.yml`
4. Configure as **Environment variables**
5. **Deploy the stack**

### Docker Compose
1. Portainer > **Stacks > Add Stack**
2. **Repository**: `https://github.com/GuiRCosta/metamanager.git`
3. Compose path: `docker-compose.yml`
4. Configure as variáveis
5. Deploy

---

## Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `DOMAIN` | Domínio (sem https) | Sim |
| `POSTGRES_HOST` | Host do PostgreSQL | Sim |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | Sim |
| `NEXTAUTH_SECRET` | Chave NextAuth (gerar com `openssl rand -base64 32`) | Sim |
| `META_ACCESS_TOKEN` | Token de acesso Meta | Sim |
| `META_BUSINESS_ID` | ID do Business Manager | Sim |
| `META_AD_ACCOUNT_ID` | ID da conta de anúncios (act_xxx) | Sim |
| `OPENAI_API_KEY` | Chave da API OpenAI | Sim |
| `EVOLUTION_API_URL` | URL da Evolution API | Não |
| `EVOLUTION_API_KEY` | Chave da Evolution API | Não |

---

## Primeiro Acesso

Após o deploy:
1. Acesse `https://seudominio.com/register`
2. Crie sua conta
3. Faça login em `https://seudominio.com/login`

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
